import React, { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import LogoWordmark from './LogoWordmark';
import ganBoldWoffUrl from '../../src/assets/fonts/gan/gan/ganclm_bold-webfont.woff';

const SIZE_512 = 512;
const SIZE_192 = 192;

// Visual parameters aligned with header CSS (per-letter)
const scales = [0.86, 1.00, 1.14, 1.28];
const anglesDeg = [-26, -5, -2, 2]; // alternating tilt per letter
const kerningEm = [0, 0, 0.04, 0.06]; // extra spacing before letter 3 and 4
const gapEm = 0.06; // same as .logo-text-main gap

function downloadDataUrl(filename, dataUrl) {
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

async function ensureFontsLoaded(baseFontPx) {
	try {
		// Wait for existing CSS fonts to be ready
		if (document.fonts && document.fonts.ready) {
			await document.fonts.ready;
		}
		// Explicitly load GanCLM at a large size so canvas will use it
		if (document.fonts && document.fonts.load) {
			await Promise.all([
				document.fonts.load(`900 ${Math.round(baseFontPx)}px "GanCLM"`),
				document.fonts.load(`700 ${Math.round(baseFontPx)}px "GanCLM"`),
			]);
		}
	} catch {
		// proceed even if Font Loading API not available
	}
}

function measureLettersWithSVG({ text, size, baseFontPx }) {
	// Create a hidden SVG in DOM to get precise text widths using the actual font
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('width', '0');
	svg.setAttribute('height', '0');
	svg.style.position = 'absolute';
	svg.style.opacity = '0';
	document.body.appendChild(svg);
	const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
	textEl.setAttribute('font-family', 'GanCLM');
	textEl.setAttribute('font-weight', '900');
	textEl.setAttribute('font-size', `${baseFontPx}px`);
	svg.appendChild(textEl);
	const chars = Array.from(text).slice(0, 4);
	const widths = chars.map((ch) => {
		textEl.textContent = ch;
		const bbox = textEl.getBBox();
		return bbox.width || 0;
	});
	document.body.removeChild(svg);
	return widths;
}

function getVisualCharsUsingDOM({ text, baseFontPx }) {
	// Build hidden DOM using the same classes so visual order matches header
	const container = document.createElement('div');
	container.style.position = 'absolute';
	container.style.left = '-99999px';
	container.style.top = '-99999px';
	container.style.visibility = 'hidden';
	container.style.direction = 'rtl';
	container.style.fontFamily = 'GanCLM';
	container.style.fontWeight = '900';
	container.style.fontSize = `${baseFontPx}px`;
	container.className = 'logo-text-main';
	const chars = Array.from(text).slice(0, 4);
	chars.forEach((ch, idx) => {
		const span = document.createElement('span');
		span.className = `logo-ch logo-ch-${idx + 1} logo-gradient`;
		span.textContent = ch;
		container.appendChild(span);
	});
	document.body.appendChild(container);
	const spans = Array.from(container.querySelectorAll('.logo-ch'));
	const ordered = spans
		.map((el, i) => ({ ch: el.textContent || '', left: el.getBoundingClientRect().left, i }))
		.sort((a, b) => b.left - a.left) // rightmost first
		.map((o) => o.ch);
	document.body.removeChild(container);
	return ordered;
}

function buildSVGMarkup({ text, size, fontDataUrl }) {
	const padding = size * 0.1;
	const baseFontPx = size * 0.42;
	// Determine visual RTL order using the actual DOM (matches header exactly)
	const chars = getVisualCharsUsingDOM({ text, baseFontPx });
	// Measure base widths
	const baseWidths = measureLettersWithSVG({ text: chars.join(''), size, baseFontPx });
	// Compute final widths with scale + kerning + gap
	const gapPx = baseFontPx * gapEm;
	const letterWidths = baseWidths.map((w, idx) => w * scales[idx] + (kerningEm[idx] || 0) * baseFontPx + (idx === 0 ? 0 : gapPx));
	const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
	// Left edge of centered block (we'll place first reversed letter at the left)
	const xLeft = (size - totalWidth) / 2;
	const baselineY = size * 0.70;
	const gradId = `grad-${Math.random().toString(36).slice(2)}`;

	const header = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
		`<defs>`,
		`<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="0">`,
		`<stop offset="0%" stop-color="#b71c1c"/>`,
		`<stop offset="20%" stop-color="#c62828"/>`,
		`<stop offset="40%" stop-color="#d32f2f"/>`,
		`<stop offset="60%" stop-color="#e53935"/>`,
		`<stop offset="80%" stop-color="#ef5350"/>`,
		`<stop offset="100%" stop-color="#ff6f61"/>`,
		`</linearGradient>`,
		`</defs>`,
		`<style><![CDATA[`,
		`@font-face { font-family: 'GanCLM'; src: url('${fontDataUrl}') format('woff'); font-weight: 700; font-style: normal; font-display: swap; }`,
		`@font-face { font-family: 'GanCLM'; src: url('${fontDataUrl}') format('woff'); font-weight: 900; font-style: normal; font-display: swap; }`,
		`]]></style>`,
		`<g fill="url(#${gradId})" font-family="GanCLM" font-weight="900" font-size="${baseFontPx}">`
	].join('');

	const parts = [header];
	let used = 0; // accumulated width placed from the left edge
	chars.forEach((ch, idx) => {
		const w = letterWidths[idx];
		const angle = anglesDeg[idx] || 0;
		// Place current letter so that its left edge is xLeft + used
		const x = xLeft + used;
		const transform = `translate(${x},${baselineY}) rotate(${angle}) scale(${scales[idx]})`;
		parts.push(`<text transform="${transform}">${ch.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`);
		used += w;
	});
	parts.push(`</g></svg>`);
	return parts.join('');
}

function arrayBufferToBase64(buffer) {
	let binary = '';
	const bytes = new Uint8Array(buffer);
	const len = bytes.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return window.btoa(binary);
}

async function drawLogo({ canvas, text, size }) {
	const ctx = canvas.getContext('2d');
	canvas.width = size;
	canvas.height = size;

	// transparent bg
	ctx.clearRect(0, 0, size, size);

	// Fetch font as data URL to embed inside SVG, ensuring exact font usage
	let fontDataUrl = '';
	try {
		const res = await fetch(ganBoldWoffUrl);
		const buf = await res.arrayBuffer();
		const b64 = arrayBufferToBase64(buf);
		fontDataUrl = `data:font/woff;base64,${b64}`;
	} catch {
		fontDataUrl = '';
	}

	// Build SVG using same font & transforms, then render to canvas for PNG
	const svgMarkup = buildSVGMarkup({ text, size, fontDataUrl });
	const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
	const url = URL.createObjectURL(svgBlob);
	try {
		const img = new Image();
		await new Promise((resolve, reject) => {
			img.onload = () => resolve();
			img.onerror = reject;
			img.src = url;
		});
		ctx.drawImage(img, 0, 0);
	} finally {
		URL.revokeObjectURL(url);
	}
}

export default function BrandLogoExport() {
	const { t } = useTranslation();
	const text = useMemo(() => (t('header.logo.main') || '').trim(), [t]);
	const canvas512Ref = useRef(null);
	const canvas192Ref = useRef(null);

	useEffect(() => {
		const run = async () => {
			const c1 = canvas512Ref.current;
			const c2 = canvas192Ref.current;
			if (!c1 || !c2 || !text) return;
			const basePx512 = SIZE_512 * 0.42;
			await ensureFontsLoaded(basePx512);
			// Draw both after fonts are ready
			await drawLogo({ canvas: c1, text, size: SIZE_512 });
			await drawLogo({ canvas: c2, text, size: SIZE_192 });
		};
		run();
	}, [text]);

	const handleDownload = (size) => {
		const canvas = size === SIZE_512 ? canvas512Ref.current : canvas192Ref.current;
		if (!canvas) return;
		const dataUrl = canvas.toDataURL('image/png');
		downloadDataUrl(`logo-${size}.png`, dataUrl);
	};

	return (
		<section className="p-4" aria-label="Export app logo" dir="rtl">
			<h1 style={{ fontSize: 18, marginBottom: 12 }}>ייצוא לוגו PWA (שקוף)</h1>
			<p style={{ marginBottom: 8 }}>תצוגה חיה (אותה קומפוננטה כמו בהדר):</p>
			<div style={{ padding: '8px 0 16px 0' }}>
				<LogoWordmark />
			</div>
			<p style={{ marginBottom: 8 }}>הקפידי שהפונט נטען (GanCLM) ואז הורידי קבצי PNG שקופים:</p>
			<div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
				<div>
					<canvas ref={canvas512Ref} width={SIZE_512} height={SIZE_512} style={{ width: 180, height: 180, border: '1px dashed #eee', background: 'transparent' }} />
					<div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
						<button className="nav-button primary" onClick={() => handleDownload(SIZE_512)} aria-label="הורד לוגו 512">הורדה 512x512</button>
					</div>
				</div>
				<div>
					<canvas ref={canvas192Ref} width={SIZE_192} height={SIZE_192} style={{ width: 96, height: 96, border: '1px dashed #eee', background: 'transparent' }} />
					<div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'center' }}>
						<button className="nav-button primary" onClick={() => handleDownload(SIZE_192)} aria-label="הורד לוגו 192">הורדה 192x192</button>
					</div>
				</div>
			</div>
			<div style={{ marginTop: 16, fontSize: 14, color: '#666' }}>
				<p>לאחר ההורדה, שימי את הקבצים ב־<code>/client/public/icons/</code> ועדכני את ה־manifest.</p>
			</div>
		</section>
	);
}


