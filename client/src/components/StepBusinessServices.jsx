import React, { useState } from 'react';
import '../styles/StepsStyle.css';
import { FaTags } from 'react-icons/fa';

const fixedServices = [
  'תספורת גברים',
  'תספורת נשים',
  'צבע לשיער',
  'פן',
  'עיצוב גבות',
  'פדיקור',
  'מניקור',
  'עיסוי שוודי',
  'עיסוי רקמות עמוק',
  'טיפול פנים'
];

const StepBusinessServices = ({ onNext, selectedServicesData = [] }) => {
  const [selectedServices, setSelectedServices] = useState(selectedServicesData);

  const toggleService = (service) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleNext = () => {
    onNext(selectedServices);
  };

  return (
    <div className="step-page-container">
      <div className="step-business-details">
        <h2 className="step-title">
          <FaTags style={{ color: '#e63946' }} />
            שירותים שהעסק מספק
        </h2>
        <div className="tags-container">
          {fixedServices.map((service, index) => (
            <div
              key={index}
              className={`tag selectable ${selectedServices.includes(service) ? 'selected' : ''}`}
              onClick={() => toggleService(service)}
            >
              {service}
            </div>
          ))}
        </div>
        {/* <button className="next-button" onClick={handleNext}>הבא</button> */}
      </div>
    </div>
  );
};

export default StepBusinessServices;
