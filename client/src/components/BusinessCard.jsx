import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedBusiness } from '../redux/businessSlice';
import { useNavigate } from 'react-router-dom';
import {
    FaPencilAlt, FaPhone, FaWhatsapp, FaEnvelope,
    FaStar, FaRegStar, FaTrash, FaRecycle
} from "react-icons/fa";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import '../styles/businessCard.css';

const BusinessCard = ({ business, fromUserBusinesses }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1];
    if (!token) {
        window.location.href = '/login';
        return;
    }

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

    const showDialog = ({ title, message, isError = false, onCloseCallback = () => {} }) => {
        confirmAlert({
            customUI: ({ onClose }) => {
                const handleClose = () => {
                    onClose();
                    onCloseCallback();
                };
                return (
                    <div className='custom-ui' dir="rtl" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        textAlign: 'center',
                        maxWidth: '400px',
                        margin: 'auto',
                        fontFamily: 'inherit'
                    }}>
                        <h1 style={{ color: isError ? 'red' : 'green' }}>{title}</h1>
                        <p>{message}</p>
                        <button onClick={handleClose} style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            backgroundColor: '#1976d2',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}>
                            סגור
                        </button>
                    </div>
                );
            }
        });
    };

    const handleDelete = () => {
        confirmAlert({
            customUI: ({ onClose }) => (
                <div className="custom-ui" dir="rtl" style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '10px',
                    textAlign: 'center',
                    maxWidth: '400px',
                    margin: 'auto',
                    fontFamily: 'inherit'
                }}>
                    <h1>מחיקת עסק</h1>
                    <p>האם אתה בטוח שברצונך למחוק את העסק?</p>
                    <div style={{ marginTop: '20px' }}>
                        <button onClick={onClose} style={{
                            marginRight: '10px',
                            padding: '10px 20px',
                            backgroundColor: '#999',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer'
                        }}>
                            ביטול
                        </button>
                        <button
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
                                    showDialog({
                                        title: 'שגיאה',
                                        message: 'שגיאה במחיקה',
                                        isError: true
                                    });
                                }
                            }}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#d32f2f',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
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
            showDialog({
                title: 'שגיאה',
                message: 'שגיאה בשחזור',
                isError: true
            });
        }
    };

    return (
        <div className="business-card">
            <div className="business-card-left">
                {fromUserBusinesses ? (
                    <>
                        <button className="business-card-action-button edit" onClick={handleEdit}>
                            <FaPencilAlt />
                        </button>
                        {business.active ? (
                            <button className="business-card-action-button delete" onClick={handleDelete}>
                                <FaTrash />
                            </button>
                        ) : (
                            <button className="business-card-action-button restore" onClick={handleRestore}>
                                <FaRecycle />
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

            <div className="business-card-right" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
                <div className="business-card-header">
                    <img
                        className="business-card-image"
                        src={business.logo
                            ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`
                            : `${process.env.REACT_APP_API_DOMAIN}/uploads/default-logo.png`}
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
