import React, { useEffect, useState } from 'react';
import { FaClock, FaPlus, FaTrash } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import '../styles/StepsStyle.css';

const DAYS = [
  { day: 0, heb: 'ראשון', eng: 'Sunday' },
  { day: 1, heb: 'שני', eng: 'Monday' },
  { day: 2, heb: 'שלישי', eng: 'Tuesday' },
  { day: 3, heb: 'רביעי', eng: 'Wednesday' },
  { day: 4, heb: 'חמישי', eng: 'Thursday' },
  { day: 5, heb: 'שישי', eng: 'Friday' },
  { day: 6, heb: 'שבת', eng: 'Saturday' }
];

const StepBusinessHours = ({ businessData, setBusinessData }) => {
  const { t } = useTranslation();
  const [hours, setHours] = useState([]);

  useEffect(() => {
    const initial = DAYS.map(({ day }) => {
      const existing = businessData.openingHours?.find(d => d.day === day);
      let closed = false;
      let ranges = [{ open: '08:00', close: '16:00' }];

      if (day === 5) {
        ranges = [{ open: '08:00', close: '12:00' }];
      } else if (day === 6) {
        closed = true;
        ranges = [];
      }

      return {
        day,
        closed: existing?.closed ?? closed,
        ranges: existing?.ranges?.length ? existing.ranges : ranges,
      };
    });

    setHours(initial);
    setBusinessData(prev => ({
      ...prev,
      openingHours: initial,
    }));
  }, []);



  useEffect(() => {
    console.log(new Date().toLocaleTimeString(), '🕒 businessData:', businessData);
  }, [businessData]);

  const updateOpeningHours = (newHours) => {
    setHours(newHours);
    setBusinessData(prev => ({
      ...prev,
      openingHours: newHours
    }));
  };

  const handleRangeChange = (dayIndex, rangeIndex, field, value) => {
    const updated = [...hours];
    updated[dayIndex].ranges[rangeIndex][field] = value;
    updateOpeningHours(updated);
  };

  const addRange = (dayIndex) => {
    const updated = [...hours];
    updated[dayIndex].ranges.push({ open: '', close: '' });
    updateOpeningHours(updated);
  };

  const toggleClosed = (dayIndex) => {
    const updated = [...hours];
    const isClosed = !updated[dayIndex].closed;
    updated[dayIndex].closed = isClosed;
    updated[dayIndex].ranges = isClosed ? [] : [{ open: '', close: '' }];
    updateOpeningHours(updated);
  };

  const removeTimeRange = (dayIndex, rangeIndex) => {
    const updated = [...hours];
    updated[dayIndex].ranges.splice(rangeIndex, 1);
    updateOpeningHours(updated);
  };

  return (
    <div className="step-business-details">
      {/* <h2 className="step-title">
        <FaClock className="icon" />
        שעות פעילות
      </h2> */}

      {hours.map((day, dayIndex) => {
        const hebDay = DAYS.find(d => d.day === day.day)?.heb || `יום ${day.day}`;
        return (
          <div key={day.day} className="day-row">
            <div className="day-header">
              <span className="day-name">{hebDay}</span>
              <button
                className={`closed-button ${day.closed ? 'active' : ''}`}
                onClick={() => toggleClosed(dayIndex)}
              >
                {day.closed ? t('businessSteps.hours.closed') : t('businessSteps.hours.open')}
              </button>

            </div>

            {!day.closed &&
              day.ranges.map((range, rangeIndex) => (
                <div key={rangeIndex} className="time-range" >
                  <input
                    type="time"
                    id='open'
                    value={range.open}
                    onChange={(e) =>
                      handleRangeChange(dayIndex, rangeIndex, 'open', e.target.value)
                    }
                  />
                  <span className="dash">-</span>
                  <input
                    type="time"
                    id='close'
                    value={range.close}
                    onChange={(e) =>
                      handleRangeChange(dayIndex, rangeIndex, 'close', e.target.value)
                    }
                  />

                  {rangeIndex === day.ranges.length - 1 && (
                    <button
                      className="add-range-btn"
                      onClick={() => addRange(dayIndex)}
                      title={t('businessSteps.hours.addRange')}
                    >
                      <FaPlus />
                    </button>
                  )}

                  {day.ranges.length > 1 && (
                    <button
                      className="delete-range-btn"
                      onClick={() => removeTimeRange(dayIndex, rangeIndex)}
                      title={t('businessSteps.hours.removeRange')}
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
};

export default StepBusinessHours;
