import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStore, FaTags, FaBullhorn } from 'react-icons/fa';

const QuickCreateStrip = () => {
  const navigate = useNavigate();

  const items = [
    {
      id: 'business',
      icon: <FaStore />,
      title: 'הוספת עסק',
      desc: 'פתח כרטיס עסק חדש עם פרטים ושעות',
      onClick: () => navigate('/business')
    },
    {
      id: 'sale',
      icon: <FaTags />,
      title: 'מודעת מכירה',
      desc: 'פרסמי מוצר ליד שנייה במהירות',
      onClick: () => navigate('/ads/sale/new')
    },
    {
      id: 'promo',
      icon: <FaBullhorn />,
      title: 'מודעת פרסום',
      desc: 'תדמית/קידום עם תוקף ותמונה',
      onClick: () => navigate('/ads/promo/new')
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


