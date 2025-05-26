import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/BusinessProfilePage.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaTags, FaClock, FaStar } from 'react-icons/fa';

const daysMap = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

const BusinessProfilePage = () => {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${id}`);
        if (!response.ok) throw new Error('בעיה בטעינת פרטי העסק');
        const data = await response.json();
        setBusiness(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
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

    fetchBusiness();
    fetchFeedbacks();
  }, [id]);

  if (loading) return <div>טוען פרטי עסק...</div>;
  if (error) return <div>שגיאה: {error}</div>;
  if (!business) return <div>לא נמצאו נתונים לעסק</div>;

  return (
    <div className="page-container">
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
                      ))
                  }
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
        <div className="feedback-list">
          {feedbacks.length > 0 ? (
            feedbacks.map((feedback, index) => (
              <div key={index} className="feedback-item">
                <p><strong>{feedback.userName || 'משתמש אנונימי'}:</strong></p>
                <p>⭐ {feedback.rating}</p>
                <p>{feedback.comment}</p>
              </div>
            ))
          ) : (
            <p>אין פידבקים להצגה</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
