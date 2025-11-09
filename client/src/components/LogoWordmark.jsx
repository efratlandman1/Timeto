import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function LogoWordmark({ className = '' }) {
	const { t } = useTranslation();
	const text = useMemo(() => (t('header.logo.main') || '').trim(), [t]);
	const chars = Array.from(text);

	return (
		<span className={`logo-text-main ${className}`} aria-label={text} dir="rtl">
			{chars.map((ch, idx) => (
				<span key={idx} className={`logo-ch logo-ch-${idx + 1} logo-gradient`} aria-hidden="true">
					{ch}
				</span>
			))}
		</span>
	);
}


