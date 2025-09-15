import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FeedbackPage from './FeedbackPage';
import {
  FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope,
  FaStar, FaRegStar, FaTrash, FaRecycle, FaMapMarkerAlt,
  FaClock, FaShekelSign, FaHeart
} from "react-icons/fa";
import { setSelectedBusiness } from '../redux/businessSlice';
import '../styles/businessCard.css';
import { getToken } from "../utils/auth";
import { roundRating, renderStars } from '../utils/ratingUtils';

const BusinessCard = ({ business, fromUserBusinesses }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localActive, setLocalActive] = useState(business.active);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(business.isFavorite || false);

  // הסרת useEffect לבדיקת סטטוס מועדפים - עכשיו זה מגיע מהשרת

  const handleToggleFavorite = async (e) => {
    e.stopPropagation();
    try {
      const token = getToken();
      if (!token) {
        navigate('/auth');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ business_id: business._id })
      });

      if (response.ok) {
        const result = await response.json();
        const active = result.data.active;
        setIsFavorite(active);
        showToast(active ? '✅ נוסף למועדפים' : '✅ הוסר מהמועדפים');
      } else {
        const errorData = await response.json();
        showToast(`❌ ${errorData.message || 'שגיאה בעדכון מועדפים'}`, true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      showToast('❌ שגיאה בעדכון מועדפים', true);
    }
  };

  // const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  // if (!token) {
  //   window.location.href = '/auth';
  //   return null;
  // }

  const handleDeleteConfirmed = async (e) => {
    e.stopPropagation(); // Prevent card navigation
    try {
      const token = getToken();
      if (!token) {
        window.location.href = '/auth';
        return null;
      }
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${business._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setLocalActive(false);
        setConfirmDelete(false);
        showToast(result.message || '✅ העסק נמחק');
      } else {
        const err = await res.json();
        showToast(`❌ ${err.message || 'מחיקה נכשלה'}`, true);
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
        window.location.href = '/auth';
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
        const result = await res.json();
        setLocalActive(true);
        showToast(result.message || '✅ העסק שוחזר בהצלחה');
      } else {
        const err = await res.json();
        showToast(`❌ ${err.message || 'שחזור נכשל'}`, true);
      }
    } catch {
      showToast('❌ שגיאה בשחזור', true);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation(); // Prevent card navigation
    dispatch(setSelectedBusiness(business));
    navigate(`/business/${business._id}`);
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
    return renderStars(
      rating,
      <FaStar />,
      <FaRegStar />
    );
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
      <div
        className="business-card-image-container"
        style={{
          background: !business.logo && business.categoryId?.color
            ? business.categoryId.color
            : '#f8f8f8'
        }}
      >
        {business.logo ? (
          <img
            className="business-card-image"
            src={`${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`}
            alt={business.name}
          />
        ) : (
          <span className="business-card-placeholder">
            {business.categoryId?.logo && (
              <img
                src={`${process.env.REACT_APP_API_DOMAIN}${business.categoryId.logo}`}
                alt={business.categoryId?.name}
                className="category-logo-in-placeholder"
              />
            )}
            <span className="business-placeholder-name">{business.name}</span>
          </span>
        )}
        <div className="business-card-overlay" />
        {localActive && (
          <div className={`business-card-badge ${isBusinessOpen() ? 'badge-open' : 'badge-closed'}`}>
            {isBusinessOpen() ? 'פתוח' : 'סגור'}
          </div>
        )}
        <button 
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={handleToggleFavorite}
          aria-label={isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        >
          <FaHeart />
        </button>
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
              {renderRatingStars(business.rating)}
            </div>
          </div>

          <div className="business-card-actions">
            {fromUserBusinesses ? (
              <>
                {localActive && (
                  <button
                    className="action-button admin edit-button"
                    onClick={(e) => handleEdit(e)}
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
                        onClick={(e) => handleDeleteConfirmed(e)}
                        title="אישור מחיקה"
                      >
                        <span>✔</span>
                      </button>
                      <button
                        className="action-button admin cancel-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDelete(false);
                        }}
                        title="ביטול"
                      >
                        <span>✖</span>
                      </button>
                    </>
                  ) : (
                    <button
                      className="action-button admin delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(true);
                      }}
                      title="מחיקה"
                    >
                      <FaTrash />
                    </button>
                  )
                ) : (
                  <button
                    className="action-button admin restore-button"
                    onClick={(e) => handleRestore(e)}
                    title="שחזור"
                  >
                    <FaRecycle />
                  </button>
                )}
              </>
            ) : (
              <>
                <button 
                  className="action-button email"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `mailto:${business.email}`)}
                  title="שליחת אימייל"
                >
                  <FaEnvelope />
                </button>
                <button 
                  className="action-button whatsapp"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `https://wa.me/${business.phone}`)}
                  title="וואטסאפ"
                >
                  <FaWhatsapp />
                </button>
                <button 
                  className="action-button phone"
                  onClick={(e) => handleActionClick(e, () => window.location.href = `tel:${business.phone}`)}
                  title="התקשרות"
                >
                  <FaPhone />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <FeedbackPage
              businessId={business._id}
              onClose={() => setShowFeedbackModal(false)}
            />
          </div>
        </div>
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
