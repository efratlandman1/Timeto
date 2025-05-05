import React from 'react';
import '../styles/BusinessProfilePage.css';
import { FaMapMarkerAlt, FaPhoneAlt, FaTags, FaClock } from 'react-icons/fa';

const BusinessProfilePage = () => {
  const business = {
    name: 'מסעדת הבוסתן',
    address: 'רחוב החרוב 12, תל אביב',
    phone: '03-1234567',
    subCategoryNames: ['אוכל ביתי', 'משלוחים', 'טבעוני'],
    openingHours: [
      { day: 'ראשון', hours: '09:00 - 22:00' },
      { day: 'שני', hours: '09:00 - 22:00' },
      { day: 'שלישי', hours: '09:00 - 22:00' },
      { day: 'רביעי', hours: '09:00 - 22:00' },
      { day: 'חמישי', hours: '09:00 - 23:00' },
      { day: 'שישי', hours: '09:00 - 15:00' },
      { day: 'שבת', hours: 'סגור' },
    ]
  };

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
          {business.subCategoryNames.map((tag, index) => (
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
            {business.openingHours.map((item, index) => (
              <tr key={index}>
                <td>{item.day}</td>
                <td>{item.hours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BusinessProfilePage;
