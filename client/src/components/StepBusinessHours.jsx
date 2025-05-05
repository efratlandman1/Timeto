import React, { useEffect, useState } from 'react';
import { FaClock, FaPlus ,FaTrash} from 'react-icons/fa';
import '../styles/StepsStyle.css';

const daysOfWeek = [
  'ראשון',
  'שני',
  'שלישי',
  'רביעי',
  'חמישי',
  'שישי',
  'שבת',
];

const StepBusinessHours = ({ onNext, businessHoursData }) => {
  const [hours, setHours] = useState([]);

  useEffect(() => {
    if (businessHoursData && businessHoursData.length) {
      setHours(businessHoursData);
    } else {
      const initial = daysOfWeek.map((day) => ({
        day,
        closed: false,
        ranges: [{ open: '', close: '' }],
      }));
      setHours(initial);
    }
  }, [businessHoursData]);

  const handleRangeChange = (dayIndex, rangeIndex, field, value) => {
    const updated = [...hours];
    updated[dayIndex].ranges[rangeIndex][field] = value;
    setHours(updated);
  };

  const addRange = (dayIndex) => {
    const updated = [...hours];
    updated[dayIndex].ranges.push({ open: '', close: '' });
    setHours(updated);
  };

  const toggleClosed = (dayIndex) => {
    const updated = [...hours];
    const isClosed = !updated[dayIndex].closed;
    updated[dayIndex].closed = isClosed;
    updated[dayIndex].ranges = isClosed ? [] : [{ open: '', close: '' }];
    setHours(updated);
  };

  const removeTimeRange = (dayIndex, rangeIndex) => {
    const updated = [...hours];
    updated[dayIndex].ranges.splice(rangeIndex, 1); // תיקון כאן
    setHours(updated);
  };
  
  return (
    <div className="step-page-container">
      <div className="step-business-details">
        <h2 className="step-title">
          <FaClock className="icon" />
          שעות פעילות
        </h2>

        {hours.map((day, dayIndex) => (
          <div key={day.day} className="day-row">
            <div className="day-header">
              <span className="day-name">{day.day}</span>
              <button
                className={`closed-button ${day.closed ? 'active' : ''}`}
                onClick={() => toggleClosed(dayIndex)}
              >
                סגור
              </button>
            </div>

            {!day.closed &&
              day.ranges.map((range, rangeIndex) => (
                <div key={rangeIndex} className="time-range">
                  <input
                    type="time"
                    value={range.open}
                    onChange={(e) =>
                      handleRangeChange(dayIndex, rangeIndex, 'open', e.target.value)
                    }
                  />
                  <span className="dash">-</span>
                  <input
                    type="time"
                    value={range.close}
                    onChange={(e) =>
                      handleRangeChange(dayIndex, rangeIndex, 'close', e.target.value)
                    }
                  />


                  {rangeIndex === day.ranges.length - 1 && (
                    <button
                      className="add-range-btn"
                      onClick={() => addRange(dayIndex)}
                      title="הוסף טווח נוסף"
                    >
                      <FaPlus />
                    </button>
                  )}


                {day.ranges.length > 1 && (
                        <button
                        className="delete-range-btn"
                        onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                        title="מחק טווח"
                        >
                        <FaTrash size={14} />
                        </button>
                    )}

                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepBusinessHours;
