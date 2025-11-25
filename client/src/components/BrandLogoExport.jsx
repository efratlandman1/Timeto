import React, { useEffect, useMemo, useRef, useState } from 'react';
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
	ctx.clearRect(0, 0, size, size);

	// Ensure font is loaded
	const baseFontPx = size * 0.42;
	await ensureFontsLoaded(baseFontPx);
	ctx.font = `900 ${Math.round(baseFontPx)}px "GanCLM", sans-serif`;
	ctx.textBaseline = 'alphabetic';

	// Order letters visually for RTL so drawing left->right matches the intended look
	const rawChars = Array.from((text || '').trim());
	// For Hebrew, reverse visual order so the leftmost on canvas is the last character
	const chars = rawChars.slice().reverse();

	// Measure widths and compute layout
	const gapPx = baseFontPx * gapEm;
	const baseWidths = chars.map((ch) => ctx.measureText(ch).width || 0);
	const letterWidths = baseWidths.map((w, idx) => w * (scales[idx] || 1) + (kerningEm[idx] || 0) * baseFontPx + (idx === 0 ? 0 : gapPx));
	const totalWidth = letterWidths.reduce((a, b) => a + b, 0);
	const xLeft = (size - totalWidth) / 2;
	const baselineY = size * 0.70;

	// Gradient across the whole text run
	const grad = ctx.createLinearGradient(xLeft, 0, xLeft + totalWidth, 0);
	grad.addColorStop(0.0, '#b71c1c');
	grad.addColorStop(0.2, '#c62828');
	grad.addColorStop(0.4, '#d32f2f');
	grad.addColorStop(0.6, '#e53935');
	grad.addColorStop(0.8, '#ef5350');
	grad.addColorStop(1.0, '#ff6f61');
	ctx.fillStyle = grad;

	// Optional subtle stroke (disabled by default)
	// ctx.lineWidth = Math.max(1, baseFontPx * 0.02);
	// ctx.strokeStyle = 'rgba(0,0,0,0.08)';

	let used = 0;
	for (let idx = 0; idx < chars.length; idx++) {
		const ch = chars[idx];
		const w = letterWidths[idx];
		const angle = (anglesDeg[idx] || 0) * Math.PI / 180;
		const scale = scales[idx] || 1;

		const x = xLeft + used;
		ctx.save();
		ctx.translate(x, baselineY);
		ctx.rotate(angle);
		ctx.scale(scale, scale);
		ctx.fillText(ch, 0, 0);
		// ctx.strokeText(ch, 0, 0);
		ctx.restore();

		used += w;
	}
}

function drawFromImage({ canvas, img, size, paddingRatio = 0.12, flipX = false, flipY = false, rotateDeg = 0, fit = 'contain' }) {
	const ctx = canvas.getContext('2d');
	canvas.width = size;
	canvas.height = size;
	ctx.clearRect(0, 0, size, size);

	// Compute target rect preserving aspect ratio with a little padding
	const padding = size * paddingRatio;
	const maxW = size - padding * 2;
	const maxH = size - padding * 2;
	const imgRatio = img.width / img.height;
	const boxRatio = maxW / maxH;

	// Determine scale according to fit mode
	let scale;
	if (fit === 'cover') {
		scale = imgRatio > boxRatio ? (maxH / img.height) : (maxW / img.width);
	} else {
		// contain
		scale = imgRatio > boxRatio ? (maxW / img.width) : (maxH / img.height);
	}

	let drawW = Math.min(maxW, img.width * scale);
	let drawH = Math.min(maxH, img.height * scale);

	// Center-based drawing with transforms (handles rotation and flips reliably)
	ctx.imageSmoothingEnabled = true;
	ctx.imageSmoothingQuality = 'high';

	ctx.save();
	ctx.translate(size / 2, size / 2);
	if (rotateDeg) {
		ctx.rotate((rotateDeg * Math.PI) / 180);
	}
	ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
	ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
	ctx.restore();
}

export default function BrandLogoExport() {
	const { t } = useTranslation();
	const text = useMemo(() => (t('header.logo.main') || '').trim(), [t]);
	const canvas512Ref = useRef(null);
	const canvas192Ref = useRef(null);
	const [imageFile, setImageFile] = useState(null);
	const [imagePreviewUrl, setImagePreviewUrl] = useState('');
	const [flipX, setFlipX] = useState(false);
	const [flipY, setFlipY] = useState(false);
	const [rotateDeg, setRotateDeg] = useState(0);
	const [fit, setFit] = useState('contain'); // 'contain' | 'cover'
	const [paddingPercent, setPaddingPercent] = useState(12);
	const [useYIcon, setUseYIcon] = useState(false);
	const [yBg, setYBg] = useState('transparent'); // 'transparent' | 'dark' | 'light'

	useEffect(() => {
		const run = async () => {
			const c1 = canvas512Ref.current;
			const c2 = canvas192Ref.current;
			if (!c1 || !c2) return;

			// Priority: Y icon generator → uploaded image → wordmark
			if (useYIcon) {
				await drawYIcon({ canvas: c1, size: SIZE_512, bg: yBg });
				await drawYIcon({ canvas: c2, size: SIZE_192, bg: yBg });
			} else if (imageFile) {
				const img = new Image();
				await new Promise((resolve, reject) => {
					img.onload = resolve;
					img.onerror = reject;
					img.src = imagePreviewUrl;
				});
				const paddingRatio = Math.max(0, Math.min(30, paddingPercent)) / 100;
				drawFromImage({ canvas: c1, img, size: SIZE_512, flipX, flipY, rotateDeg, fit, paddingRatio });
				drawFromImage({ canvas: c2, img, size: SIZE_192, flipX, flipY, rotateDeg, fit, paddingRatio });
			} else if (text) {
				const basePx512 = SIZE_512 * 0.42;
				await ensureFontsLoaded(basePx512);
				await drawLogo({ canvas: c1, text, size: SIZE_512 });
				await drawLogo({ canvas: c2, text, size: SIZE_192 });
			}
		};
		run();
	}, [text, imageFile, imagePreviewUrl, flipX, flipY, rotateDeg, fit, paddingPercent, useYIcon, yBg]);

	const handleDownload = (size) => {
		const canvas = size === SIZE_512 ? canvas512Ref.current : canvas192Ref.current;
		if (!canvas) return;
		const dataUrl = canvas.toDataURL('image/png');
		downloadDataUrl(`logo-${size}.png`, dataUrl);
	};

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) {
			setImageFile(null);
			setImagePreviewUrl('');
			return;
		}
		const url = URL.createObjectURL(file);
		setImageFile(file);
		setImagePreviewUrl(url);
	};

	const handleClearImage = () => {
		if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
		setImageFile(null);
		setImagePreviewUrl('');
		setFlipX(false);
		setFlipY(false);
		setRotateDeg(0);
	};

	async function drawYIcon({ canvas, size, bg }) {
		const ctx = canvas.getContext('2d');
		canvas.width = size;
		canvas.height = size;
		ctx.clearRect(0, 0, size, size);

		// Backgrounds
		if (bg === 'dark') {
			const radius = Math.round(size * 0.18);
			ctx.fillStyle = '#111215';
			roundRect(ctx, 0, 0, size, size, radius);
			ctx.fill();
		} else if (bg === 'light') {
			const radius = Math.round(size * 0.18);
			ctx.fillStyle = '#ffffff';
			roundRect(ctx, 0, 0, size, size, radius);
			ctx.fill();
			ctx.strokeStyle = '#e5e7eb';
			ctx.lineWidth = Math.max(1, size * 0.012);
			roundRect(ctx, 0 + ctx.lineWidth / 2, 0 + ctx.lineWidth / 2, size - ctx.lineWidth, size - ctx.lineWidth, radius);
			ctx.stroke();
		}

		// Ensure GanCLM font
		const baseFontPx = size * 0.62;
		await ensureFontsLoaded(baseFontPx);
		ctx.font = `900 ${Math.round(baseFontPx)}px "GanCLM", sans-serif`;
		ctx.textBaseline = 'alphabetic';

		// Red gradient
		const grad = ctx.createLinearGradient(size * 0.2, 0, size * 0.8, 0);
		grad.addColorStop(0.0, '#ff6f61');
		grad.addColorStop(0.5, '#e53935');
		grad.addColorStop(1.0, '#b71c1c');
		ctx.fillStyle = grad;

		const glyph = 'y';
		const metrics = ctx.measureText(glyph);
		const textWidth = metrics.width;
		const x = (size - textWidth) / 2;
		const baselineY = size * 0.70;

		ctx.fillText(glyph, x, baselineY);

		// light inner stroke for definition
		if (bg !== 'transparent') {
			ctx.strokeStyle = bg === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';
			ctx.lineWidth = Math.max(1, size * 0.018);
			ctx.strokeText(glyph, x, baselineY);
		}

		// subtle cane-like hook near tail
		ctx.save();
		ctx.strokeStyle = grad;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		ctx.lineWidth = Math.max(2, size * 0.03);
		const tailX = x + textWidth * 0.70;
		const tailY = baselineY + size * 0.02;
		ctx.beginPath();
		ctx.moveTo(tailX, tailY);
		ctx.quadraticCurveTo(tailX + size * 0.10, tailY - size * 0.04, tailX + size * 0.12, tailY - size * 0.12);
		ctx.stroke();
		ctx.restore();
	}

	function roundRect(ctx, x, y, w, h, r) {
		const radius = Math.min(r, w / 2, h / 2);
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.arcTo(x + w, y, x + w, y + h, radius);
		ctx.arcTo(x + w, y + h, x, y + h, radius);
		ctx.arcTo(x, y + h, x, y, radius);
		ctx.arcTo(x, y, x + w, y, radius);
		ctx.closePath();
	}

	return (
		<section className="p-4" aria-label="Export app logo" dir="rtl">
			<h1 style={{ fontSize: 18, marginBottom: 12 }}>ייצוא לוגו PWA (שקוף)</h1>
			<p style={{ marginBottom: 8 }}>אפשרות 1: העלי תמונה קיימת ואייצר 512/192:</p>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
				<input
					type="file"
					accept="image/*"
					onChange={handleFileChange}
					aria-label="בחרי תמונת לוגו מהמחשב"
				/>
				{imageFile && (
					<button className="nav-button" type="button" onClick={handleClearImage} aria-label="נקה תמונה">
						נקה
					</button>
				)}
				{imageFile && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<input
							type="checkbox"
							checked={flipX}
							onChange={(e) => setFlipX(e.target.checked)}
							aria-label="היפוך אופקי (תקן תמונת מראה)"
						/>
						<span>היפוך אופקי (תקן תמונת מראה)</span>
					</label>
				)}
				{imageFile && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<input
							type="checkbox"
							checked={flipY}
							onChange={(e) => setFlipY(e.target.checked)}
							aria-label="היפוך אנכי"
						/>
						<span>היפוך אנכי</span>
					</label>
				)}
				{imageFile && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<span>סיבוב</span>
						<select
							value={rotateDeg}
							onChange={(e) => setRotateDeg(Number(e.target.value))}
							aria-label="סיבוב התמונה"
						>
							<option value={0}>0°</option>
							<option value={90}>90°</option>
							<option value={180}>180°</option>
							<option value={270}>270°</option>
						</select>
					</label>
				)}
				{imageFile && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<span>התאמה</span>
						<select
							value={fit}
							onChange={(e) => setFit(e.target.value)}
							aria-label="אופן התאמת התמונה למסגרת"
						>
							<option value="contain">Contain (ללא חיתוך)</option>
							<option value="cover">Cover (ממלא, ייתכן חיתוך)</option>
						</select>
					</label>
				)}
				{imageFile && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<span>מרווח (%)</span>
						<input
							type="number"
							min={0}
							max={30}
							step={1}
							value={paddingPercent}
							onChange={(e) => setPaddingPercent(Number(e.target.value))}
							style={{ width: 64 }}
							aria-label="אחוז מרווח מהקצוות"
						/>
					</label>
				)}
				{imagePreviewUrl && (
					<img
						src={imagePreviewUrl}
						alt="תצוגה מקדימה של התמונה שהועלתה"
						style={{ height: 40, objectFit: 'contain' }}
					/>
				)}
			</div>

			<p style={{ margin: '12px 0 8px' }}>אפשרות 2: יצירת איקון y מהגופן (GLM) עם שדרוג עדין:</p>
			<div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
				<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
					<input
						type="checkbox"
						checked={useYIcon}
						onChange={(e) => setUseYIcon(e.target.checked)}
						aria-label="יצירת איקון y מהגופן"
					/>
					<span>הפעל מצב איקון y</span>
				</label>
				{useYIcon && (
					<label style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
						<span>רקע</span>
						<select value={yBg} onChange={(e) => setYBg(e.target.value)} aria-label="צבע רקע לאיקון">
							<option value="transparent">שקוף</option>
							<option value="dark">כהה</option>
							<option value="light">בהיר</option>
						</select>
					</label>
				)}
			</div>

			<p style={{ margin: '12px 0 8px' }}>אפשרות 3: שימוש במיתוג הטקסטואלי (כמו בהדר):</p>
			<div style={{ padding: '8px 0 16px 0' }}>
				<LogoWordmark />
			</div>

			<p style={{ marginBottom: 8 }}>הורדת PNG שקופים:</p>
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


