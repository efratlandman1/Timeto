import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedBusiness } from '../redux/businessSlice';
import { useNavigate } from 'react-router-dom';
import { FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope, FaStar, FaRegStar } from "react-icons/fa";
import '../styles/businessCard.css';

const BusinessCard = ({ business, fromUserBusinesses }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleEdit = () => {
        dispatch(setSelectedBusiness(business));
        // navigate('/edit');
        navigate(`/edit/${business._id}`);

    };

    const handleFeedback = () => {
        // navigate(`/feedback-page/${business._id}`);
        navigate(`/feedback-page`);

    };

    const handleCardClick = () => {
        navigate(`/business-profile/${business._id}`);
    };

    const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1];
      if (!token) {
        window.location.href = '/login';
        return;
      }

    const handleDelete = async () => {
        if (window.confirm("האם אתה בטוח שברצונך להסיר את העסק?")) {
            try {
            const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${business._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                alert('העסק הוסר בהצלחה');
                // רענון רשימה: כאן אפשר לשגר action, למשוך מחדש, או להשתמש ב-setState
            } else {
                const err = await res.json();
                alert(err.message || 'שגיאה במחיקת העסק');
            }
            } catch (error) {
            console.error('שגיאה במחיקה:', error);
            alert('שגיאה במחיקה');
            }
        }
        };

        const handleRestore = async () => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${business._id}/restore`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            });

            if (res.ok) {
            alert('העסק שוחזר בהצלחה');
            // רענון רשימה: אותו רעיון
            } else {
            const err = await res.json();
            alert(err.message || 'שגיאה בשחזור');
            }
        } catch (error) {
            console.error('שגיאה בשחזור:', error);
            alert('שגיאה בשחזור');
        }
        };

    return (
        <div className="business-card" >
            {/* Left side of the card (action buttons) */}
            <div className="business-card-left">
                {fromUserBusinesses ? (
                    <>
                        <button className="business-card-action-button edit" onClick={handleEdit}>
                        <FaPencilAlt />
                        </button>
                        {business.active ? (
                        <button className="business-card-action-button delete" onClick={handleDelete}>
                            ❌
                        </button>
                        ) : (
                        <button className="business-card-action-button restore" onClick={handleRestore}>
                            ♻️
                        </button>
                        )}
                    </>
                    ) : (
                    <>
                        <a href={`mailto:${business.email}`} className="business-card-action-button email" aria-label="Email">
                            <FaEnvelope />
                        </a>
                        <a href={`https://wa.me/${business.phone}`} className="business-card-action-button whatsapp" aria-label="WhatsApp">
                            <FaWhatsapp />
                        </a>
                        <a href={`tel:${business.phone}`} className="business-card-action-button phone" aria-label="Call">
                            <FaPhone />
                        </a>
                        <button className="business-card-action-button feedback" onClick={handleFeedback} title="הוספת פידבק">
                            <FaRegStar />
                        </button>
                    </>
                )}
            </div>

            {/* Right side of the card (info) */}
            <div className="business-card-right" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                <div className="business-card-header">
                    <img
                        className="business-card-image"
                        src={business.logo ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}` : `${process.env.REACT_APP_API_DOMAIN}/uploads/default-logo.png`}
                        alt={business.name}
                    />
                    <h3 className="business-card-name">{business.name}</h3>
                    <p className="business-card-category">{business.category}</p>
                    <div className="business-card-description-rating">
                        <div className="business-card-rating">
                            <FaStar />
                            <span>{business.rating ? `${business.rating}/5` : '0/5'}</span>
                        </div>
                        <div className="business-card-description">{business.description}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessCard;
