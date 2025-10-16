import React from 'react';
import '../styles/businessCard.css';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { FaPencilAlt, FaTrash, FaRecycle, FaHeart, FaEnvelope, FaWhatsapp, FaPhone } from 'react-icons/fa';

const SaleAdCard = ({ ad }) => {
  const navigate = useNavigate();
  const mainImage = ad.images && ad.images[0];
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [localActive, setLocalActive] = React.useState(ad.active !== false);
  const [isFavorite, setIsFavorite] = React.useState(ad.isFavorite || false);
  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth'); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads/${ad._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLocalActive(false);
        setConfirmDelete(false);
      }
    } catch {}
  };
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/ads/sale/new?edit=${ad._id}` , { state: { ad } });
  };

  const handleRestore = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth'); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads/restore/${ad._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLocalActive(true);
    } catch {}
  };

  return (
    <div className={`business-card ${!localActive ? 'inactive' : ''}`} role="article" aria-label={ad.title} onClick={() => navigate(`/ads/sale/${ad._id}`)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/ads/sale/${ad._id}`); }}>
      <div className="business-card-image-container" style={{ background: '#ffffff' }}>
        {mainImage ? (
          <img className="business-card-image" src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${mainImage}`} alt={ad.title} />
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
              if (!token) { navigate('/auth'); return; }
              const res = await fetch(`${process.env.REACT_APP_API_DOMAIN || 'http://localhost:5050'}/api/v1/sale-favorites/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ saleAdId: ad._id })
              });
              const json = await res.json();
              if (res.ok) {
                const active = json?.data?.active;
                setIsFavorite(active);
                showToast(active ? '✅ נוסף למועדפים' : '✅ הוסר מהמועדפים');
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
            {ad.price !== undefined && (
              <div className="font-medium">{ad.price} {ad.currency || 'ILS'}</div>
            )}
          </div>
          {ad.canManage ? (
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
          ) : (
            <div className="business-card-actions">
              {ad.email && (
                <button 
                  className="action-button email"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${ad.email}`; }}
                  title="שליחת אימייל"
                >
                  <FaEnvelope />
                </button>
              )}
              {ad.phone && ad.hasWhatsapp !== false && (
                <button 
                  className="action-button whatsapp"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `https://wa.me/${ad.phone}`; }}
                  title="וואטסאפ"
                >
                  <FaWhatsapp />
                </button>
              )}
              {ad.phone && (
                <button 
                  className="action-button phone"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `tel:${ad.phone}`; }}
                  title="התקשרות"
                >
                  <FaPhone />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleAdCard;


function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

