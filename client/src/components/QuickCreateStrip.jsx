import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaStore, FaTags, FaBullhorn } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { getToken } from '../utils/auth';

const QuickCreateStrip = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const items = [
    {
      id: 'business',
      icon: <FaStore />,
      title: t('quickCreate.business.title'),
      desc: t('quickCreate.business.desc'),
      onClick: () => {
        const token = getToken();
        if (!token) { navigate('/auth', { state: { background: location } }); return; }
        navigate('/business');
      }
    },
    {
      id: 'sale',
      icon: <FaTags />,
      title: t('quickCreate.sale.title'),
      desc: t('quickCreate.sale.desc'),
      onClick: () => {
        const token = getToken();
        if (!token) { navigate('/auth', { state: { background: location } }); return; }
        navigate('/ads/sale/new');
      }
    },
    {
      id: 'promo',
      icon: <FaBullhorn />,
      title: t('quickCreate.promo.title'),
      desc: t('quickCreate.promo.desc'),
      onClick: () => {
        const token = getToken();
        if (!token) { navigate('/auth', { state: { background: location } }); return; }
        navigate('/ads/promo/new');
      }
    }
  ];

  return (
    <section className="quick-create" aria-label="אפשרויות יצירה מהירה">
      <div className="quick-create__grid">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            className={`quick-card quick-card--${it.id}`}
            onClick={it.onClick}
            aria-label={it.title}
          >
            {/* Icon on the right, aligned to both lines */}
            <span className="quick-card__icon" aria-hidden="true">{it.icon}</span>
            <div className="quick-card__content">
              <div className="quick-card__title">{it.title}</div>
              <div className="quick-card__desc">{it.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

export default QuickCreateStrip;


