import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/BusinessProfilePage.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaTags, FaClock } from 'react-icons/fa';

const BusinessProfilePage = () => {
  const { id } = useParams(); // שליפת מזהה העסק מה-URL
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        console.log('innnnn');
        const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${id}`);
        
        if (!response.ok) {
          throw new Error('בעיה בטעינת פרטי העסק');
        }
        const data = await response.json();
        setBusiness(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
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
          {business.subCategoryIds?.map((tag, index) => (
            <span key={index} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="hours-section">
        <h3><FaClock className="icon" /> שעות פעילות</h3>
        <table className="hours-table">
          <thead>
            <tr>
              <th>יום</th>
              <th>שעות</th>
            </tr>
          </thead>
          <tbody>
            {business.openingHours?.map((item, index) => (
              <tr key={index}>
                <td>{item.day}</td>
                <td>{item.hours || `${item.from} - ${item.to}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
