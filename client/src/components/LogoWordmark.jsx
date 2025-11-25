import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function LogoWordmark({ className = '' }) {
	const { t, i18n } = useTranslation();
	const text = useMemo(() => (t('header.logo.main') || '').trim(), [t]);
	const chars = Array.from(text);
	const isHebrew = (i18n?.language || 'he') === 'he';

	return (
		<span className={`logo-text-main ${className}`} aria-label={text} dir="rtl">
			{chars.map((ch, idx) => (
				<span key={idx} className={`logo-ch logo-ch-${idx + 1} logo-gradient`} aria-hidden="true">
					{ch}
				</span>
			))}
			
			{/* {isHebrew && (
				<span aria-hidden="true" className="ms-1 inline-block align-middle">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						className="w-4 h-4 text-gray-700 dark:text-gray-300"
						focusable="false"
					>
						<path
							fill="currentColor"
							d="M16.5 2a3.5 3.5 0 0 0-3.5 3.5v8.75a2.25 2.25 0 1 1-4.5 0V12a1 1 0 1 0-2 0v2.25a4.25 4.25 0 1 0 8.5 0V5.5a1.5 1.5 0 1 1 3 0c0 .828-.672 1.5-1.5 1.5a1 1 0 1 0 0 2c2.071 0 3.5-1.678 3.5-3.5A3.5 3.5 0 0 0 16.5 2Z"
						/>
					</svg>
				</span>
			)} */}
		</span>
	);
}


