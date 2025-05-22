import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { confirmAlert } from 'react-confirm-alert';
import {
  FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope,
  FaStar, FaRegStar, FaTrash, FaRecycle
} from "react-icons/fa";
import { setSelectedBusiness } from '../redux/businessSlice';
import 'react-confirm-alert/src/react-confirm-alert.css';
import '../styles/businessCard.css';

const BusinessCard = ({ business, fromUserBusinesses }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  if (!token) {
    window.location.href = '/login';
    return null;
  }

  const showDialog = ({ title, message, isError = false, onCloseCallback = () => {} }) => {
    confirmAlert({
      customUI: ({ onClose }) => {
        const handleClose = () => {
          onClose();
          onCloseCallback();
        };
        return (
          <div className='custom-confirm-alert'>
            <h2 style={{ color: isError ? '#dc3545' : '#28a745' }}>{title}</h2>
            <p>{message}</p>
            <div className="buttons">
              <button onClick={handleClose}>סגור</button>
            </div>
          </div>
        );
      }
    });
  };

  const handleDelete = () => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="custom-confirm-alert">
          <h2>מחיקת עסק</h2>
          <p>האם אתה בטוח שברצונך למחוק את העסק?</p>
          <div className="buttons">
            <button onClick={onClose}>ביטול</button>
            <button
              className="danger"
              onClick={async () => {
                try {
                  const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${business._id}`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  onClose();
                  if (res.ok) {
                    showDialog({
                      title: 'הצלחה',
                      message: 'העסק נמחק בהצלחה',
                      onCloseCallback: () => navigate(0)
                    });
                  } else {
                    const err = await res.json();
                    showDialog({
                      title: 'שגיאה',
                      message: err.message || 'שגיאה במחיקה',
                      isError: true
                    });
                  }
                } catch (error) {
                  onClose();
                  showDialog({ title: 'שגיאה', message: 'שגיאה במחיקה', isError: true });
                }
              }}
            >
              מחיקה
            </button>
          </div>
        </div>
      )
    });
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
        showDialog({
          title: 'הצלחה',
          message: 'העסק שוחזר בהצלחה',
          onCloseCallback: () => navigate(0)
        });
      } else {
        const err = await res.json();
        showDialog({
          title: 'שגיאה',
          message: err.message || 'שגיאה בשחזור',
          isError: true
        });
      }
    } catch (error) {
      showDialog({ title: 'שגיאה', message: 'שגיאה בשחזור', isError: true });
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
            {business.active ? (
              <button className="business-card-action-button delete" onClick={handleDelete}><FaTrash /></button>
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

export default BusinessCard;
