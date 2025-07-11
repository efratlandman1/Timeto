import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaRegStar, FaStar } from 'react-icons/fa';
import ReactDOM from 'react-dom';
import '../styles/FeedbackPage.css';
import {getToken} from "../utils/auth";

const Toast = ({ message, isError, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`business-card-toast ${isError ? 'error' : 'success'}`}
      style={{
        borderLeft: `5px solid ${isError ? 'red' : 'green'}`,
        padding: '10px 15px',
        backgroundColor: isError ? '#ffe6e6' : '#e6ffe6',
        color: isError ? '#900' : '#060',
        fontWeight: 'bold',
        margin: '10px 0',
        borderRadius: 4,
      }}
    >
      {message}
    </div>
  );
};


const FeedbackPage = ({ businessId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [previousFeedbacks, setPreviousFeedbacks] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [toast, setToast] = useState(null); // { message, isError }
  const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
    if (businessId) {
        setIsLoading(true); // להתחיל טעינה
        axios
        .get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/feedbacks/business/${businessId}`)
        .then(res => {
            setPreviousFeedbacks(res.data);
            const name = res.data?.[0]?.business_id?.name;
            if (name) setBusinessName(name);
        })
        .catch(err => console.error('Error fetching feedbacks:', err))
        .finally(() => setIsLoading(false)); // סיום טעינה
    }
    }, [businessId]);


  const handleStarClick = (value) => {
    setRating(value);
    setHover(0);
  };

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
  };

    const handleSubmit = async () => {
    try {
        const token = getToken();

        if (!token) {
        showToast('לא נמצאה הרשאת התחברות. התחברי מחדש.', true);
        setTimeout(() => window.location.href = '/auth', 3000);
        return;
        }

        if (rating === 0) {
        showToast('אנא בחר דירוג לפני השליחה.', true);
        return;
        }

        await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/feedbacks`, {
        business_id: businessId,
        rating,
        comment
        }, {
        headers: { Authorization: `Bearer ${token}` }
        });

        showToast('✅ הפידבק נשלח בהצלחה!');
        setTimeout(onClose, 1500);

    } catch (error) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'שגיאה לא ידועה';
        console.error('Failed to submit feedback:', errorMessage);
        showToast(`שגיאה בשליחת הפידבק: ${errorMessage}`, true);
    }
    };


  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return null;

  return ReactDOM.createPortal(
    <>
    {isLoading ? (
        <div className="feedback-page-loader">טוען חוות דעת...</div>
        ) : (
        <>
            <div className="feedback-page-modal-overlay" onClick={onClose}>
                <div className="feedback-page-modal">
                    <div className="feedback-page-content"
                    dir="rtl"
                    onClick={(e) => e.stopPropagation()}
                    >
                    <button className="feedback-page-close-button" onClick={onClose}>×</button>
                    <h2 className="feedback-page-title">
                        חוות דעת על {businessName || 'העסק'}
                    </h2>

                    <div className="form-group rating-group">
                        <label>דרג את העסק</label>
                        <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                                <span
                                    key={star}
                                    className={`star ${star <= (hover || rating) ? "filled" : ""}`}
                                    onClick={() => handleStarClick(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    {star <= (hover || rating) ? <FaStar size={36} /> : <FaRegStar size={36} />}
                                </span>
                            ))}
                        </div>
                        {rating > 0 && (
                            <div className="rating-text">
                                {rating} כוכבים
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label>כתוב את חוות דעתך</label>
                        <textarea
                        placeholder="הסבר בקצרה את החוויה שלך..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        rows={5}
                        className="feedback-page-textarea-input"
                        />
                    </div>

                    <button className="confirm-button" onClick={handleSubmit}>שלח פידבק</button>

                    <div className="feedback-page-feedback-list">
                        <h3>חוות דעת קודמות</h3>
                        {previousFeedbacks.length === 0 && <p className="no-feedbacks">עדיין אין חוות דעת, תהיה הראשון!</p>}
                        {previousFeedbacks.map((fb, idx) => (
                        <div key={idx} className="feedback-page-feedback-item">
                            <div className="feedback-page-feedback-header">
                            <span className="feedback-name">{fb.user_id?.nickname || 'אנונימי'}</span>
                            <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="feedback-page-feedback-stars">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span
                                        key={i}
                                        className={`star ${i <= fb.rating ? "filled" : ""}`}
                                    >
                                        {i <= fb.rating ? <FaStar size={20} /> : <FaRegStar size={20} />}
                                    </span>
                                ))}
                            </div>
                            <p className="feedback-page-feedback-comment">{fb.comment}</p>
                        </div>
                        ))}
                    </div>
                    </div>
                </div>
            </div>
            {toast && (
                <Toast
                message={toast.message}
                isError={toast.isError}
                onClose={() => setToast(null)}
                />
            )}
        </>
    )}
    </>,
    modalRoot
  );
};

export default FeedbackPage;
