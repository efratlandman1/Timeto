import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { FaPencilAlt, FaTrash, FaRecycle } from 'react-icons/fa';

const PromoAdCard = ({ ad }) => {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [localActive, setLocalActive] = React.useState(ad.active !== false);
  const handleDelete = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth'); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads/${ad._id}`, {
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
    navigate(`/ads/promo/new?edit=${ad._id}` , { state: { ad } });
  };

  const handleRestore = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) { navigate('/auth'); return; }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads/restore/${ad._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setLocalActive(true);
    } catch {}
  };

  return (
    <div className={`business-card ${!localActive ? 'inactive' : ''}`} role="article" aria-label={ad.title} onClick={() => navigate(`/ads/promo/${ad._id}`)} tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate(`/ads/promo/${ad._id}`); }}>
      <div className="business-card-image-container" style={{ background: '#f8f8f8' }}>
        {ad.image ? (
          <img className="business-card-image" src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`} alt={ad.title} />
        ) : (
          <span className="business-card-placeholder">
            <span className="business-placeholder-name">{ad.title}</span>
          </span>
        )}
        <div className="business-card-overlay" />
        <div className={`business-card-badge ${localActive ? 'badge-open' : 'badge-closed'}`}>
          {localActive ? 'פעיל' : 'לא פעיל'}
        </div>
      </div>
      <div className="business-card-content">
        <div className="business-card-header">
          <h3 className="business-card-name">{ad.title}</h3>
          <div className="business-card-category">
            <span className="business-card-address">{ad.city}</span>
          </div>
        </div>
        <div className="business-card-footer">
          <div className="business-card-rating" />
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


