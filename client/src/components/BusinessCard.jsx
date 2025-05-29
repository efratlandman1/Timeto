import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FeedbackPage from './FeedbackPage';
import {
  FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope,
  FaStar, FaRegStar, FaTrash, FaRecycle, FaMapMarkerAlt,
  FaClock, FaShekelSign
} from "react-icons/fa";
import { setSelectedBusiness } from '../redux/businessSlice';
import '../styles/businessCard.css';
import { getToken } from "../utils/auth";

const BusinessCard = ({ business, fromUserBusinesses }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localActive, setLocalActive] = useState(business.active);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  // if (!token) {
  //   window.location.href = '/login';
  //   return null;
  // }

  const handleDeleteConfirmed = async (e) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return null;
      }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${business._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLocalActive(false);
        setConfirmDelete(false);
        showToast('✅ העסק נמחק');
      } else {
        const err = await res.json();
        showToast(`שגיאה: ${err.message || 'מחיקה נכשלה'}`, true);
      }
    } catch {
      showToast('❌ שגיאה במחיקה', true);
    }
  };

  const handleRestore = async (e) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return null;
      }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/restore/${business._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        setLocalActive(true);
        showToast('✅ העסק שוחזר בהצלחה');
      } else {
        const err = await res.json();
        showToast(`שגיאה: ${err.message || 'שחזור נכשל'}`, true);
      }
    } catch {
      showToast('❌ שגיאה בשחזור', true);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card navigation
    dispatch(setSelectedBusiness(business));
    navigate(`/edit/${business._id}`);
  };

  const handleCardClick = () => {
    if (localActive) {
      navigate(`/business-profile/${business._id}`);
    }
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation(); // Prevent card navigation
    action();
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <span key={i}>
          {i < Math.floor(rating) ? <FaStar /> : <FaRegStar />}
        </span>
      );
    }
    return stars;
  };

  const isBusinessOpen = () => {
    // Add your business hours logic here
    return true; // Placeholder
  };

  return (
    <div 
      className={`business-card ${!localActive ? 'inactive' : ''}`}
      onClick={handleCardClick}
    >
      <div className="business-card-image-container">
        <img
          className="business-card-image"
          src={
            business.logo
              ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`
              : `${process.env.REACT_APP_API_DOMAIN}/uploads/default-logo.png`
          }
          alt={business.name}
        />
        <div className="business-card-overlay" />
        {localActive && (
          <div className={`business-card-badge ${isBusinessOpen() ? 'badge-open' : 'badge-closed'}`}>
            {isBusinessOpen() ? 'פתוח' : 'סגור'}
          </div>
        )}
      </div>

      <div className="business-card-content">
        <div className="business-card-header">
          <h3 className="business-card-name">{business.name}</h3>
          <div className="business-card-category">
            <FaMapMarkerAlt />
            <span className="business-card-address">{business.address}</span>
          </div>
        </div>

        {/* <div className="business-card-info"> */}
          {/* <div className="price-range">
            <FaShekelSign />
            <span>{getPriceRange()}</span>
          </div>
          <div className="delivery-time">
            <FaClock />
            <span>{getDeliveryTime()} דקות</span>
          </div> */}
        {/* </div> */}

        <div className="business-card-footer">
          <div className="business-card-rating">
            <div className="rating-stars">
              {renderRatingStars(business.rating || 0)}
            </div>
            <span className="rating-number">
              {business.rating ? business.rating.toFixed(1) : 'חדש'}
            </span>
          </div>

          <div className="business-card-actions">
            {fromUserBusinesses ? (
              <>
                {localActive && (
                  <button
                    className="action-button admin"
                    onClick={(e) => handleEdit(e)}
                  >
                    <FaPencilAlt />
                    <span className="tooltip">עריכה</span>
                  </button>
                )}
                {localActive ? (
                  confirmDelete ? (
                    <>
                      <button
                        className="action-button admin"
                        onClick={(e) => handleDeleteConfirmed(e)}
                      >
                        <span>✔</span>
                        <span className="tooltip">אישור מחיקה</span>
                      </button>
                      <button
                        className="action-button admin"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(false);
                        }}
                      >
                        <span>✖</span>
                        <span className="tooltip">ביטול</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-button admin"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                    >
                      <FaTrash />
                      <span className="tooltip">מחיקה</span>
                    </button>
                  )
                ) : (
                  <button
                    className="action-button admin"
                    onClick={(e) => handleRestore(e)}
                  >
                    <FaRecycle />
                    <span className="tooltip">שחזור</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  className="action-button email"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `mailto:${business.email}`)}
                >
                  <FaEnvelope />
                  <span className="tooltip">שליחת אימייל</span>
                </button>
                <button 
                  className="action-button whatsapp"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `https://wa.me/${business.phone}`)}
                >
                  <FaWhatsapp />
                  <span className="tooltip">וואטסאפ</span>
                </button>
                <button 
                  className="action-button phone"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `tel:${business.phone}`)}
                >
                  <FaPhone />
                  <span className="tooltip">התקשרות</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showFeedbackModal && (
        <FeedbackPage
          businessId={business._id}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
};

function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'error' : 'success'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export default BusinessCard;
