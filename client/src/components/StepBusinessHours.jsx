import React, { useState } from 'react';

const StepBusinessHours = ({ onNext, businessHoursData }) => {
  const [hours, setHours] = useState(businessHoursData || []);

  const handleAddHours = () => {
    setHours([...hours, { day: '', open: '', close: '' }]);
  };

  const handleHoursChange = (index, field, value) => {
    const updatedHours = [...hours];
    updatedHours[index][field] = value;
    setHours(updatedHours);
  };

  const handleNext = () => {
    onNext(hours);
  };

  return (
    <div className="step-content">
      <h2>שעות פעילות</h2>
      {hours.map((hour, index) => (
        <div key={index} className="input-group">
          <label>יום {index + 1}</label>
          <select
            value={hour.day}
            onChange={(e) => handleHoursChange(index, 'day', e.target.value)}
          >
            <option value="">בחר יום</option>
            <option value="Sunday">ראשון</option>
            <option value="Monday">שני</option>
            <option value="Tuesday">שלישי</option>
            <option value="Wednesday">רביעי</option>
            <option value="Thursday">חמישי</option>
            <option value="Friday">שישי</option>
            <option value="Saturday">שבת</option>
          </select>
          <input
            type="time"
            value={hour.open}
            onChange={(e) => handleHoursChange(index, 'open', e.target.value)}
            placeholder="שעת פתיחה"
          />
          <input
            type="time"
            value={hour.close}
            onChange={(e) => handleHoursChange(index, 'close', e.target.value)}
            placeholder="שעת סגירה"
          />
        </div>
      ))}
      <button onClick={handleAddHours}>הוסף שעות</button>
      <button onClick={handleNext}>סיום</button>
    </div>
  );
};

export default StepBusinessHours;
