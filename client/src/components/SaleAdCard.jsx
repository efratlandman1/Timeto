import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleSaleFavorite } from '../redux/saleFavoritesSlice';

const SaleAdCard = ({ ad }) => {
  const dispatch = useDispatch();
  const mainImage = ad.images && ad.images[0];
  return (
    <div className="business-card" role="article" aria-label={ad.title}>
      <div className="business-card-image-container" style={{ background: '#f8f8f8' }}>
        {mainImage ? (
          <img className="business-card-image" src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${mainImage}`} alt={ad.title} />
        ) : (
          <span className="business-card-placeholder">
            <span className="business-placeholder-name">{ad.title}</span>
          </span>
        )}
        <div className="business-card-overlay" />
        <button 
          className={`favorite-button ${ad.isFavorite ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); dispatch(toggleSaleFavorite(ad._id)); }}
          aria-label={ad.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          ♥
        </button>
      </div>
      <div className="business-card-content">
        <div className="business-card-header">
          <h3 className="business-card-name">{ad.title}</h3>
          <div className="business-card-category">
            <span className="business-card-address">{ad.city}</span>
          </div>
        </div>
        <div className="business-card-footer">
          <div className="business-card-rating">
            {ad.price !== undefined && (
              <div className="font-medium">{ad.price} {ad.currency || 'ILS'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaleAdCard;


