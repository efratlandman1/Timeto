import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaTags, FaClock, FaStar, FaRegStar
} from 'react-icons/fa';
import FeedbackPage from './FeedbackPage';
import '../styles/BusinessProfilePage.css';

const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const BusinessProfilePage = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${id}`);
      if (!response.ok) throw new Error('בעיה בטעינת פרטי העסק');
      const data = await response.json();
      setBusiness(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/feedbacks/business/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error('שגיאה בשליפת פידבקים:', err);
    }
  };
  
  useEffect(() => {
    setLoading(true);
    Promise.all([fetchBusiness(), fetchFeedbacks()])
      .finally(() => setLoading(false));
  }, [id]);

  const handleFeedbackClose = () => {
    setShowFeedbackModal(false);
    fetchFeedbacks();  // רענון פידבקים
    fetchBusiness();   // רענון דירוג כולל
  };


  // useEffect(() => {
  //   const fetchBusiness = async () => {
  //     try {
  //       const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${id}`);
  //       if (!response.ok) throw new Error('בעיה בטעינת פרטי העסק');
  //       const data = await response.json();
  //       setBusiness(data);
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   const fetchFeedbacks = async () => {
  //     try {
  //       const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/feedbacks/business/${id}`);
  //       if (response.ok) {
  //         const data = await response.json();
  //         setFeedbacks(data);
  //       }
  //     } catch (err) {
  //       console.error('שגיאה בשליפת פידבקים:', err);
  //     }
  //   };

  //   fetchBusiness();
  //   fetchFeedbacks();
  // }, [id]);

  if (loading) return <div>טוען פרטי עסק...</div>;
  if (error) return <div>שגיאה: {error}</div>;
  if (!business) return <div>לא נמצאו נתונים לעסק</div>;

  return (
    <div className="page-container" dir="rtl">
      <div className="page-header">
        <h1>פרופיל העסק</h1>
        <div className="header-line"></div>
      </div>

      <div className="business-info">
        <h2>{business.name}</h2>
        <p><FaMapMarkerAlt className="icon" /> {business.address}</p>
        <p><FaPhoneAlt className="icon" /> {business.phone}</p>
      </div>

      <div className="tags-section">
        <h3><FaTags className="icon" /> שירותים</h3>
        <div className="tags-container">
          {business.services?.length > 0 ? (
            business.services.map((service, index) => (
              <span key={index} className="tag">{service.name}</span>
            ))
          ) : (
            <p>לא נמצאו שירותים</p>
          )}
        </div>
      </div>

      <div className="hours-section">
        <h3><FaClock className="icon" /> שעות פעילות</h3>
        <table className="hours-table">
          <thead>
            <tr>
              <th>יום</th>
              <th>סטטוס</th>
              <th>שעות</th>
            </tr>
          </thead>
          <tbody>
            {business.openingHours?.map((item, index) => (
              <tr key={index}>
                <td>{daysMap[item.day]}</td>
                <td>{item.closed ? 'סגור' : 'פתוח'}</td>
                <td>
                  {item.closed || !item.ranges?.length
                    ? '-'
                    : item.ranges.map((range, i) => (
                        <div key={i}>
                          {range.open} - {range.close}
                        </div>
                      ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="feedback-section">
        <h3><FaStar className="icon" /> דירוגים ופידבקים</h3>
        <p className="rating">
          <strong>דירוג ממוצע:</strong> {business.rating?.toFixed(1) || 'אין דירוג'}
        </p>

        <button
          className="add-feedback-button"
          onClick={() => setShowFeedbackModal(true)}
        >
          <FaRegStar style={{ marginLeft: '6px' }} />
          הוסף פידבק
        </button>

        <div className="feedback-list">
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback, index) => {
              const rating = feedback.rating || 0;
              const nickname = feedback.user_id?.nickname || 'אננימי';
              const comment = feedback.comment || '-';
              const createdAt = new Date(feedback.created_at).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });

              let ratingClass = 'low-rating';
              if (rating >= 4) ratingClass = 'high-rating';
              else if (rating >= 2.5) ratingClass = 'mid-rating';

              return (
                <div key={index} className={`feedback-item ${ratingClass}`}>
                  <div className="feedback-header">
                    <strong>{nickname}</strong>
                    <span className="feedback-date">{createdAt}</span>
                  </div>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < rating ? 'filled-star' : 'empty-star'}>★</span>
                    ))}
                  </div>
                  <div className="comment">{comment}</div>
                </div>
              );
            })
          ) : (
            <p>אין פידבקים להצגה</p>
          )}
        </div>
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FeedbackPage
              businessId={business._id}
              // onClose={() => setShowFeedbackModal(false)}
              onClose={handleFeedbackClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfilePage;
