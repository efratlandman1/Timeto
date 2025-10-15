import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localActive, setLocalActive] = useState(business.active);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(business.isFavorite || false);
  const [now, setNow] = useState(new Date());

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

  // Update current time every minute to refresh open/closed status
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const [hStr, mStr] = timeStr.split(':');
    const hours = Number(hStr);
    const minutes = Number(mStr);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
  };

  const isBusinessOpen = useMemo(() => {
    const openingHours = business?.openingHours;
    if (!Array.isArray(openingHours) || openingHours.length === 0) {
      return false;
    }

    // Map JS getDay (0=Sunday ... 6=Saturday) matches our schema (0-6)
    const currentDay = now.getDay();
    const today = openingHours.find(d => Number(d.day) === currentDay);
    if (!today || today.closed) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // A day can have multiple ranges; open if any range matches
    for (const range of (today.ranges || [])) {
      const openMin = parseTimeToMinutes(range.open);
      const closeMin = parseTimeToMinutes(range.close);
      if (openMin == null || closeMin == null) continue;

      if (closeMin > openMin) {
        // Normal same-day range: open <= now < close
        if (currentMinutes >= openMin && currentMinutes < closeMin) {
          return true;
        }
      } else if (closeMin < openMin) {
        // Overnight range (e.g., 20:00-02:00): open if now >= open OR now < close
        if (currentMinutes >= openMin || currentMinutes < closeMin) {
          return true;
        }
      } else {
        // open == close (edge case) => treat as closed range
        continue;
      }
    }
    return false;
  }, [business?.openingHours, now]);

  // Compute timing text: current close time if open, or next open time if closed
  const { timingText, isSoon, isOpenNow } = useMemo(() => {
    const openingHours = business?.openingHours;
    if (!Array.isArray(openingHours) || openingHours.length === 0) {
      return { timingText: '', isSoon: false, isOpenNow: false };
    }

    const currentDay = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const today = openingHours.find(d => Number(d.day) === currentDay);

    // If open now: find active range to get close time
    if (isBusinessOpen && today && !today.closed) {
      for (const range of (today.ranges || [])) {
        const openMin = parseTimeToMinutes(range.open);
        const closeMin = parseTimeToMinutes(range.close);
        if (openMin == null || closeMin == null) continue;

        if (closeMin > openMin) {
          if (currentMinutes >= openMin && currentMinutes < closeMin) {
            const minutesUntilClose = closeMin - currentMinutes;
            if (minutesUntilClose <= 30) {
              return { timingText: t('businessCard.timing.closingSoon'), isSoon: true, isOpenNow: true };
            }
            return { timingText: t('businessCard.timing.openUntil', { time: range.close }), isSoon: false, isOpenNow: true };
          }
        } else if (closeMin < openMin) {
          // Overnight
          if (currentMinutes >= openMin || currentMinutes < closeMin) {
            const minutesUntilClose = currentMinutes >= openMin
              ? (24 * 60 - currentMinutes) + closeMin
              : closeMin - currentMinutes;
            if (minutesUntilClose <= 30) {
              return { timingText: t('businessCard.timing.closingSoon'), isSoon: true, isOpenNow: true };
            }
            return { timingText: t('businessCard.timing.openUntil', { time: range.close }), isSoon: false, isOpenNow: true };
          }
        }
      }
    }

    // Otherwise find the next opening time within the next 7 days
    const MINUTES_IN_DAY = 24 * 60;
    const SOON_THRESHOLD = 30; // minutes
    for (let offset = 0; offset < 7; offset++) {
      const dayIndex = (currentDay + offset) % 7;
      const day = openingHours.find(d => Number(d.day) === dayIndex);
      if (!day || day.closed) continue;
      const ranges = Array.isArray(day.ranges) ? day.ranges : [];
      // Sort ranges by open time to get the earliest
      const sorted = [...ranges].sort((a, b) => (parseTimeToMinutes(a.open) ?? 0) - (parseTimeToMinutes(b.open) ?? 0));

      for (const range of sorted) {
        const openMin = parseTimeToMinutes(range.open);
        const closeMin = parseTimeToMinutes(range.close);
        if (openMin == null || closeMin == null) continue;

        if (offset === 0) {
          // Today: next range with open in the future (or overnight already handled above)
          if (openMin > currentMinutes) {
            const diff = openMin - currentMinutes;
            if (diff <= SOON_THRESHOLD) {
              return { timingText: t('businessCard.timing.opensSoon'), isSoon: true, isOpenNow: false };
            }
            return { timingText: t('businessCard.timing.opensAt', { time: range.open }), isSoon: false, isOpenNow: false };
          }
        } else {
          // Future day: take the earliest open time
          return { timingText: t('businessCard.timing.opensAt', { time: range.open }), isSoon: false, isOpenNow: false };
        }
      }
    }

    return { timingText: '', isSoon: false, isOpenNow: false };
  }, [business?.openingHours, now, isBusinessOpen, t]);

  return (
    <div 
      className={`business-card ${!localActive ? 'inactive' : ''}`}
      onClick={handleCardClick}
    >
      <div
        className="business-card-image-container"
        style={{ background: '#ffffff' }}
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
          <div className={`business-card-badge ${isBusinessOpen ? 'badge-open' : 'badge-closed'}`}>
            {isBusinessOpen ? t('businessCard.status.open') : t('businessCard.status.closed')}
            {((!isBusinessOpen && timingText) || (isBusinessOpen && isSoon)) && (
              <span className={`badge-timing ${isBusinessOpen ? 'badge-timing-soon' : 'badge-timing-closed'}`}>
                {' '}· {timingText}
              </span>
            )}
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
          {/* timing moved into badge */}
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
                {business.hasWhatsapp !== false && (
                  <button 
                    className="action-button whatsapp"
                    onClick={(e) => handleActionClick(e, () => window.location.href = `https://wa.me/${business.phone}`)}
                    title="וואטסאפ"
                  >
                    <FaWhatsapp />
                  </button>
                )}
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
