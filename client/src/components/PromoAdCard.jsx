import React from 'react';

const PromoAdCard = ({ ad }) => {
  return (
    <div className="business-card" role="article" aria-label={ad.title}>
      <div className="business-card-image-container" style={{ background: '#f8f8f8' }}>
        {ad.image ? (
          <img className="business-card-image" src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`} alt={ad.title} />
        ) : (
          <span className="business-card-placeholder">
            <span className="business-placeholder-name">{ad.title}</span>
          </span>
        )}
        <div className="business-card-overlay" />
        <div className={`business-card-badge ${ad.isCurrentlyActive ? 'badge-open' : 'badge-closed'}`}>
          {ad.isCurrentlyActive ? 'פעיל' : 'לא פעיל'}
        </div>
      </div>
      <div className="business-card-content">
        <div className="business-card-header">
          <h3 className="business-card-name">{ad.title}</h3>
          <div className="business-card-category">
            <span className="business-card-address">{ad.city}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoAdCard;


