import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaRegStar, FaStar, FaArrowRight } from 'react-icons/fa';
import { toast } from 'react-toastify';
import '../styles/FeedbackPage.css';
import {getToken} from "../utils/auth";
import { useNavigate } from 'react-router-dom';

const FeedbackPage = ({ businessId, onClose }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [previousFeedbacks, setPreviousFeedbacks] = useState([]);
  const [businessName, setBusinessName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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
    if (isError) {
      toast.error(message, { autoClose: 3000 });
    } else {
      toast.success(message, { autoClose: 3000 });
    }
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

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="feedback-page-loader">טוען חוות דעת...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" dir="rtl" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-ghost btn-circle btn-sm btn-close" onClick={onClose}>×</button>
        <h2 className="feedback-page-title">
          חוות דעת על {businessName || 'העסק'}
        </h2>

        <div className="form-field-container">
          <label>דרג את העסק</label>
          <div className="star-rating-container">
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

        </div>

        <div className="form-field-container">
          <label>כתוב את חוות דעתך</label>
          <textarea
            placeholder="הסבר בקצרה את החוויה שלך..."
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={5}
          />
        </div>

        <div className="actions-container">
          <button type="submit" className="btn btn-solid btn-primary" onClick={handleSubmit}>
            שלח משוב
          </button>
        </div>

        <div className="feedback-page-feedback-list">
          <h3>חוות דעת קודמות</h3>
          {previousFeedbacks.length === 0 && <p className="no-feedbacks">עדיין אין חוות דעת, תהיה הראשון!</p>}
          {previousFeedbacks.map((fb, idx) => (
            <div key={idx} className="feedback-page-feedback-item">
              <div className="feedback-page-feedback-header">
                <span className="feedback-name">{fb.user_id?.nickname || 'אנונימי'}</span>
                <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="star-rating-container">
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
  );
};

export default FeedbackPage;
