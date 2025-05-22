import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope,
  FaStar, FaRegStar, FaTrash, FaRecycle
} from "react-icons/fa";
import { setSelectedBusiness } from '../redux/businessSlice';
import '../styles/businessCard.css';

const BusinessCard = ({ business, fromUserBusinesses }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localActive, setLocalActive] = useState(business.active);

  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  if (!token) {
    window.location.href = '/login';
    return null;
  }

  const handleDeleteConfirmed = async () => {
    try {
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

  const handleRestore = async () => {
    try {
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

  const handleEdit = () => {
    dispatch(setSelectedBusiness(business));
    navigate(`/edit/${business._id}`);
  };

  const handleFeedback = () => {
    navigate(`/feedback-page`);
  };

  const handleCardClick = () => {
    navigate(`/business-profile/${business._id}`);
  };

  return (
    <div className="business-card">
      <div className="business-card-left">
        {fromUserBusinesses ? (
          <>
            <button className="business-card-action-button edit" onClick={handleEdit}><FaPencilAlt /></button>

            {localActive ? (
              confirmDelete ? (
                <>
                  <button className="business-card-action-button delete" onClick={handleDeleteConfirmed}>✔</button>
                  <button className="business-card-action-button delete" onClick={() => setConfirmDelete(false)}>✖</button>
                </>
              ) : (
                <button className="business-card-action-button delete" onClick={() => setConfirmDelete(true)}><FaTrash /></button>
              )
            ) : (
              <button className="business-card-action-button restore" onClick={handleRestore}><FaRecycle /></button>
            )}
          </>
        ) : (
          <>
            <a href={`mailto:${business.email}`} className="business-card-action-button email"><FaEnvelope /></a>
            <a href={`https://wa.me/${business.phone}`} className="business-card-action-button whatsapp"><FaWhatsapp /></a>
            <a href={`tel:${business.phone}`} className="business-card-action-button phone"><FaPhone /></a>
            <button className="business-card-action-button feedback" onClick={handleFeedback}><FaRegStar /></button>
          </>
        )}
      </div>

      <div className="business-card-right" onClick={handleCardClick}>
        <img
          className="business-card-image"
          src={
            business.logo
              ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`
              : `${process.env.REACT_APP_API_DOMAIN}/uploads/default-logo.png`
          }
          alt={business.name}
        />
        <div className="business-card-text">
          <h3 className="business-card-name">{business.name}</h3>
          <p className="business-card-category">{business.category}</p>
          <div className="business-card-description-rating">
            <div className="business-card-description">{business.description}</div>
            <div className="business-card-rating">
              <FaStar />
              <span>{business.rating ? `${business.rating}/5` : '0/5'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast helper
function showToast(message, isError = false) {
  const toast = document.createElement('div');
  toast.className = `business-card-toast ${isError ? 'error' : 'success'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export default BusinessCard;
