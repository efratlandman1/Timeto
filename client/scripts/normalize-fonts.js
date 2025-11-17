'use strict';

/**
 * Normalize fonts into a consistent structure and generate a single fonts CSS.
 *
 * - Scans client/src/assets/fonts for source font files (.ttf/.otf/.woff)
 * - Converts to .woff2 using ttf2woff2 where possible (prefers .ttf/.otf)
 * - Writes normalized files into client/src/assets/fonts/_normalized/<Family>/<Family>-<Weight>.woff2
 * - Generates client/src/styles/global/fonts.generated.css with @font-face rules
 *
 * Families/weights are inferred from folder/file names using simple heuristics.
 *
 * Run:
 *   cd client
 *   node scripts/normalize-fonts.js
 */

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const ttf2woff2 = require('ttf2woff2');

const INPUT_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'fonts');
const OUTPUT_DIR = path.resolve(INPUT_DIR, '_normalized');
const CSS_DIR = path.resolve(__dirname, '..', 'src', 'styles', 'global');
const CSS_OUT_FILE = path.resolve(CSS_DIR, 'fonts.generated.css');

const SOURCE_EXTENSIONS = new Set(['.ttf', '.otf', '.woff']); // prefer .ttf/.otf; fallback to .woff if needed
const IGNORE_DIR_NAMES = new Set([
	'__MACOSX',
	'specimen_files',
	'Images',
	'Indesign Poster',
]);
const IGNORE_FILE_EXTENSIONS = new Set([
	'.eot',
	'.svg',
	'.html',
	'.png',
	'.css',
	'.pdf',
	'.indd',
	'.lst',
	'.txt',
	'.ds_store',
]);

const WEIGHT_NAME_TO_VALUE = new Map([
	['thin', 100],
	['extralight', 200],
	['ultralight', 200],
	['light', 300],
	['book', 350],
	['regular', 400],
	['normal', 400],
	['roman', 400],
	['medium', 500],
	['demibold', 600],
	['semibold', 600],
	['bold', 700],
	['extrabold', 800],
	['ultrabold', 800],
	['black', 900],
	['heavy', 900],
]);

const WEIGHT_VALUE_TO_NAME = new Map([
	[100, 'Thin'],
	[200, 'ExtraLight'],
	[300, 'Light'],
	[350, 'Book'],
	[400, 'Regular'],
	[500, 'Medium'],
	[600, 'SemiBold'],
	[700, 'Bold'],
	[800, 'ExtraBold'],
	[900, 'Black'],
]);

const ensureDir = async (dir) => {
	await fsp.mkdir(dir, { recursive: true });
};

const isIgnorable = (filePath) => {
	const base = path.basename(filePath);
	const ext = path.extname(base).toLowerCase();
	if (IGNORE_FILE_EXTENSIONS.has(ext)) return true;
	if (base.startsWith('._')) return true;
	return false;
};

const walkFonts = async (dir) => {
	const entries = await fsp.readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			if (IGNORE_DIR_NAMES.has(entry.name)) continue;
			files.push(...(await walkFonts(entryPath)));
			continue;
		}
		if (isIgnorable(entryPath)) continue;
		const ext = path.extname(entry.name).toLowerCase();
		if (!SOURCE_EXTENSIONS.has(ext)) continue;
		files.push(entryPath);
	}
	return files;
};

const inferFamilyFromPath = (absPath) => {
	const parts = absPath.split(path.sep).map((p) => p.toLowerCase());
	// Known folders → canonical family names
	if (parts.includes('m_plus_rounded_1c')) return 'MPLUSRounded1c';
	if (parts.includes('rubik_spray_paint')) return 'RubikSprayPaint';
	if (parts.includes('solitreo')) return 'Solitreo';
	if (parts.includes('gan')) return 'GanCLM';
	if (parts.includes('makabiyg')) return 'Makabiyg';
	if (parts.includes('noot_april13') || parts.includes('noot')) return 'Noot';
	if (parts.includes('dragon')) return 'Dragon';

	// Fallback: use parent directory name in PascalCase (alnum only)
	const parent = path.basename(path.dirname(absPath)).replace(/[^a-z0-9]+/gi, ' ').trim();
	const pascal = parent
		.split(/\s+/)
		.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
		.join('');
	return pascal || 'CustomFont';
};

const inferWeightFromFilename = (family, filename) => {
	const lower = filename.toLowerCase();

	// Family-specific heuristics
	if (family === 'MPLUSRounded1c') {
		if (lower.includes('thin')) return 100;
		if (lower.includes('light')) return 300;
		if (lower.includes('regular')) return 400;
		if (lower.includes('medium')) return 500;
		if (lower.includes('bold') && !lower.includes('extra')) return 700;
		if (lower.includes('extrabold')) return 800;
		if (lower.includes('black')) return 900;
	}
	if (family === 'GanCLM') {
		if (lower.includes('bold')) return 700;
	}

	// Generic heuristics
	for (const [name, value] of WEIGHT_NAME_TO_VALUE.entries()) {
		if (lower.includes(name)) return value;
	}
	return 400; // default Regular
};

const hasItalic = (filename) => {
	const lower = filename.toLowerCase();
	return lower.includes('italic') || lower.endsWith('i') || lower.includes('-i.') || lower.includes('_i.');
};

const convertToWoff2 = async (srcFile) => {
	const ext = path.extname(srcFile).toLowerCase();
	if (ext === '.woff') {
		// We cannot reliably convert .woff → .woff2 without original TTF/OTF; skip conversion and return null
		return null;
	}
	const input = await fsp.readFile(srcFile);
	const output = ttf2woff2(input);
	return output;
};

const createNormalizedName = (family, weightValue, isItalic) => {
	const weightName = WEIGHT_VALUE_TO_NAME.get(weightValue) || 'Regular';
	const styleSuffix = isItalic ? 'Italic' : '';
	return `${family}-${weightName}${styleSuffix}.woff2`;
};

const relUrlForCss = (absFile) => {
	// produce URL path starting with /src for consistency with dev server
	const idx = absFile.toLowerCase().lastIndexOf(path.sep + 'src' + path.sep);
	if (idx !== -1) {
		const rel = absFile.slice(idx).split(path.sep).join('/');
		return `/${rel}`;
	}
	// fallback to relative from client root
	return `/src/assets/fonts/_normalized/${path.basename(path.dirname(absFile))}/${path.basename(absFile)}`;
};

const main = async () => {
	const start = Date.now();
	await ensureDir(OUTPUT_DIR);
	await ensureDir(CSS_DIR);

	const sourceFiles = await walkFonts(INPUT_DIR);
	const created = [];

	for (const src of sourceFiles) {
		try {
			const family = inferFamilyFromPath(src);
			const base = path.basename(src);
			const italic = hasItalic(base);
			const weight = inferWeightFromFilename(family, base);
			const familyOutDir = path.join(OUTPUT_DIR, family);
			await ensureDir(familyOutDir);

			const normalizedName = createNormalizedName(family, weight, italic);
			const outPath = path.join(familyOutDir, normalizedName);

			// If already exists, skip
			if (fs.existsSync(outPath)) {
				created.push({ family, weight, italic, file: outPath, existed: true });
				continue;
			}

			let woff2Buffer = null;
			const ext = path.extname(src).toLowerCase();
			if (ext === '.ttf' || ext === '.otf') {
				woff2Buffer = await convertToWoff2(src);
			} else if (ext === '.woff') {
				// Try to prefer a sibling .ttf/.otf if exists
				const siblingTtf = src.replace(/\.woff$/i, '.ttf');
				const siblingOtf = src.replace(/\.woff$/i, '.otf');
				if (fs.existsSync(siblingTtf)) {
					woff2Buffer = await convertToWoff2(siblingTtf);
				} else if (fs.existsSync(siblingOtf)) {
					woff2Buffer = await convertToWoff2(siblingOtf);
				} else {
					// No convertible source; skip
					woff2Buffer = null;
				}
			}

			if (!woff2Buffer) {
				// Skip if unable to produce woff2
				continue;
			}

			await fsp.writeFile(outPath, woff2Buffer);
			created.push({ family, weight, italic, file: outPath, existed: false });
		} catch {
			// Continue on errors per file; summary will still be useful
			continue;
		}
	}

	// Generate CSS
	const seenFaces = new Set();
	const cssLines = [];
	for (const item of created) {
		const { family, weight, italic, file } = item;
		const key = `${family}-${weight}-${italic ? 'italic' : 'normal'}`;
		if (seenFaces.has(key)) continue;
		seenFaces.add(key);
		const url = relUrlForCss(file);
		cssLines.push(
			`@font-face {`,
			`  font-family: '${family}';`,
			`  src: url('${url}') format('woff2');`,
			`  font-weight: ${weight};`,
			`  font-style: ${italic ? 'italic' : 'normal'};`,
			`  font-display: swap;`,
			`}`
		);
	}
	const cssContent = [
		`/* AUTO-GENERATED FILE. Do not edit manually. */`,
		`/* Generated by scripts/normalize-fonts.js at ${new Date().toISOString()} */`,
		``,
		...cssLines,
		``,
	].join('\n');
	await fsp.writeFile(CSS_OUT_FILE, cssContent, 'utf8');

	const duration = Date.now() - start;
	const families = Array.from(new Set(created.map((c) => c.family))).sort();
	const report = [
		`Fonts normalization complete in ${duration}ms`,
		`Output directory: ${OUTPUT_DIR}`,
		`CSS file: ${CSS_OUT_FILE}`,
		`Families processed: ${families.join(', ') || 'none'}`,
		`Files created/kept: ${created.length}`,
	].join('\n');
	// eslint-disable-next-line no-console
	console.log(report);
};

main().catch((err) => {
	// eslint-disable-next-line no-console
	console.error('Failed to normalize fonts:', err);
	process.exit(1);
});


