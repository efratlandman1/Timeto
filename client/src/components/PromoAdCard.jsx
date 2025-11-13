import React from 'react';
import '../styles/businessCard.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { FaPencilAlt, FaTrash, FaRecycle, FaHeart } from 'react-icons/fa';

const PromoAdCard = ({ ad, onFavoriteRemoved }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isFavorite, setIsFavorite] = React.useState(ad.isFavorite || false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [localActive, setLocalActive] = React.useState(ad.active !== false);
  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth', { state: { background: location } }); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads/${ad._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLocalActive(false);
        setConfirmDelete(false);
        showToast('✅ המודעה נמחקה');
      }
    } catch {}
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/ads/promo/new?edit=${ad._id}` , { state: { ad } });
  };

  const handleRestore = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth', { state: { background: location } }); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads/restore/${ad._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLocalActive(true);
        showToast('✅ המודעה שוחזרה בהצלחה');
      }
    } catch {}
  };

  const isExpired = (() => {
    if (!ad?.validTo) return false;
    try { return new Date(ad.validTo) < new Date(); } catch { return false; }
  })();

  return (
    <div className={`business-card promo ${!localActive ? 'inactive' : ''}`} role="article" aria-label={ad.title} onClick={() => navigate(`/ads/promo/${ad._id}`, { state: { background: location } })} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/ads/promo/${ad._id}`, { state: { background: location } }); }}>
      <div className="business-card-image-container" style={{ background: '#ffffff' }}>
        {!localActive && (<div className="status-badge inactive">לא פעיל</div>)}
        {isExpired && localActive && (<div className="status-badge expired">לא בתוקף</div>)}
        {ad.image ? (
          <img className="business-card-image" src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`} alt={ad.title} />
        ) : (
          <span className="business-card-placeholder">
            <span className="business-placeholder-name">{ad.title}</span>
          </span>
        )}
        <div className="business-card-overlay" />
        <button 
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const token = getToken();
              if (!token) { navigate('/auth', { state: { background: location } }); return; }
              const res = await fetch(`${process.env.REACT_APP_API_DOMAIN || 'http://localhost:5050'}/api/v1/promo-favorites/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ promoAdId: ad._id })
              });
              const json = await res.json();
              if (res.ok) {
                const active = json?.data?.active;
                setIsFavorite(active);
                showToast(active ? '✅ נוסף למועדפים' : '✅ הוסר מהמועדפים');
                if (!active && typeof onFavoriteRemoved === 'function') {
                  onFavoriteRemoved();
                }
              } else {
                showToast(`❌ ${json?.message || 'שגיאה בעדכון מועדפים'}`, true);
              }
            } catch (err) {
              showToast('❌ שגיאה בעדכון מועדפים', true);
            }
          }}
          aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          <FaHeart />
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
            {(() => {
              const name = ad?.categoryId?.name || ad?.category?.name || (Array.isArray(ad?.category) ? ad.category[0]?.name : '');
              return name ? (<div className="font-medium">{name}</div>) : null;
            })()}
          </div>
          <div className="price-slot empty"></div>
          {ad.canManage && (
            <div className="business-card-actions">
              {localActive && (
                <button
                  className="action-button admin edit-button"
                  onClick={handleEdit}
                  title="עריכה"
                >
                  <FaPencilAlt />
                </button>
              )}
              {localActive ? (
                confirmDelete ? (
                  <>
                    <button
                      className="action-button admin confirm-delete"
                      onClick={handleDelete}
                      title="אישור מחיקה"
                    >
                      <span>✔</span>
                    </button>
                    <button
                      className="action-button admin cancel-delete"
                      onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                      title="ביטול"
                    >
                      <span>✖</span>
                    </button>
                  </>
                ) : (
                  <button
                    className="action-button admin delete-button"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                    title="מחיקה"
                  >
                    <FaTrash />
                  </button>
                )
              ) : (
                <button
                  className="action-button admin restore-button"
                  onClick={handleRestore}
                  title="שחזור"
                >
                  <FaRecycle />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoAdCard;


function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

