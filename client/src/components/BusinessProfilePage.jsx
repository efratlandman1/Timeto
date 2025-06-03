import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPhoneAlt, FaTags, FaClock,
  FaStar, FaRegStar, FaEnvelope, FaWhatsapp
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
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false);
  const [expandedComments, setExpandedComments] = useState(new Set());

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
    fetchFeedbacks();
    fetchBusiness();
  };

  const renderRatingStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <span key={index} className="star">
        {index < Math.floor(rating) ? <FaStar /> : <FaRegStar />}
      </span>
    ));
  };

  const getCurrentDayIndex = () => {
    return new Date().getDay();
  };

  const toggleComment = (feedbackId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId);
      } else {
        newSet.add(feedbackId);
      }
      return newSet;
    });
  };

  if (loading) return <div className="loading">טוען פרטי עסק...</div>;
  if (error) return <div className="error">שגיאה: {error}</div>;
  if (!business) return <div className="not-found">לא נמצאו נתונים לעסק</div>;

  const averageRating = business.rating || 0;
  const totalReviews = feedbacks.length;
  const displayedFeedbacks = showAllFeedbacks ? feedbacks : feedbacks.slice(0, 6);
  const currentDayIndex = getCurrentDayIndex();

  return (
    <div className="wide-page-container">
      <div className="business-hero">
        <img
          className="business-hero-image"
          src={
            business.logo
              ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`
              : `${process.env.REACT_APP_API_DOMAIN}/uploads/default-logo.png`
          }
          alt={business.name}
        />
        <div className="business-hero-overlay">
          <div className="business-hero-content">
            <h1 className="business-hero-title">{business.name}</h1>
            <div className="business-hero-category">{business.category}</div>
          </div>
        </div>
      </div>

      {/* Contact Section - Full Width */}
      <div className="contact-section">
        <div className="contact-grid">
          <div className="contact-card">
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`} 
               target="_blank" 
               rel="noopener noreferrer">
              <div className="contact-icon">
                <FaMapMarkerAlt />
              </div>
              <span className="contact-label">כתובת</span>
              <span className="contact-value">{business.address}</span>
            </a>
          </div>
          
          <div className="contact-card">
            <a href={`tel:${business.phone}`}>
              <div className="contact-icon">
                <FaPhoneAlt />
              </div>
              <span className="contact-label">טלפון</span>
              <span className="contact-value">{business.phone}</span>
            </a>
          </div>

          <div className="contact-card">
            <a href={`https://wa.me/${business.phone}`} 
               target="_blank" 
               rel="noopener noreferrer">
              <div className="contact-icon">
                <FaWhatsapp />
              </div>
              <span className="contact-label">WhatsApp</span>
              <span className="contact-value">{business.phone}</span>
            </a>
          </div>

          {business.email && (
            <div className="contact-card">
              <a href={`mailto:${business.email}`}>
                <div className="contact-icon">
                  <FaEnvelope />
                </div>
                <span className="contact-label">אימייל</span>
                <span className="contact-value">{business.email}</span>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section */}
      <div className="two-column-section">
        {/* Hours Column */}
        <div className="column-card">
          <div className="info-card-header">
            <FaClock />
            <h3 className="info-card-title">שעות פעילות</h3>
          </div>
          <div className="hours-list">
            {business.openingHours?.map((item, index) => (
              <div key={index} className={`hours-day ${index === currentDayIndex ? 'current' : ''}`}>
                <span className="day-name">{daysMap[item.day]}</span>
                <span className="hours-range">
                  {item.closed ? (
                    <span className="closed-tag">סגור</span>
                  ) : (
                    item.ranges?.map((range, i) => (
                      <span key={i}>
                        {range.open} - {range.close}
                      </span>
                    ))
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Services Column */}
        <div className="column-card">
          <div className="info-card-header">
            <FaTags />
            <h3 className="info-card-title">שירותים</h3>
          </div>
          <div className="services-grid">
            {business.services?.map((service, index) => (
              <div key={index} className="service-tag">
                {service.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback Section - Full Width */}
      <div className="feedback-section">
        <div className="feedback-header">
          <h2>דירוגים ופידבקים</h2>
          <button className="add-feedback-button" onClick={() => setShowFeedbackModal(true)}>
            <FaRegStar />
            הוסף פידבק
          </button>
        </div>

        <div className="feedback-stats">
          <div className="stat-card">
            <div className="stat-number">{averageRating.toFixed(1)}</div>
            <div className="rating-stars">{renderRatingStars(averageRating)}</div>
            <div className="stat-label">דירוג ממוצע</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{totalReviews}</div>
            <div className="stat-label">סך הכל ביקורות</div>
          </div>
        </div>

        <div className="feedback-list">
          {displayedFeedbacks.map((feedback, index) => {
            const isExpanded = expandedComments.has(feedback._id);
            const comment = feedback.comment || '-';
            const shouldShowToggle = comment.length > 100;

            return (
              <div key={index} className="feedback-card">
                <div className="feedback-card-header">
                  <span className="feedback-author">{feedback.user_id?.nickname || 'אננימי'}</span>
                  <span className="feedback-date">
                    {new Date(feedback.created_at).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="feedback-rating">
                  <div className="stars">
                    {renderRatingStars(feedback.rating || 0)}
                  </div>
                </div>
                <div className={`feedback-comment ${isExpanded ? 'expanded' : ''}`}>
                  {comment}
                </div>
                {shouldShowToggle && (
                  <button 
                    className="feedback-comment-toggle"
                    onClick={() => toggleComment(feedback._id)}
                  >
                    {isExpanded ? 'הצג פחות' : 'הצג הכל'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {feedbacks.length > 6 && !showAllFeedbacks && (
          <button 
            className="show-more-button"
            onClick={() => setShowAllFeedbacks(true)}
          >
            הצג עוד ביקורות ({feedbacks.length - 6})
          </button>
        )}
      </div>

      {showFeedbackModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FeedbackPage
              businessId={business._id}
              onClose={handleFeedbackClose}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessProfilePage;
