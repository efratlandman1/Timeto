import React, { useState } from 'react';

const StepBusinessServices = ({ onNext, servicesData }) => {
  const [services, setServices] = useState(servicesData || []);

  const handleAddService = () => {
    setServices([...services, '']);
  };

  const handleServiceChange = (index, value) => {
    const updatedServices = [...services];
    updatedServices[index] = value;
    setServices(updatedServices);
  };

  const handleNext = () => {
    onNext(services);
  };

  return (
    <div className="step-content">
      <h2>שירותי העסק</h2>
      {services.map((service, index) => (
        <div key={index} className="input-group">
          <label>שירות {index + 1}</label>
          <input
            type="text"
            value={service}
            onChange={(e) => handleServiceChange(index, e.target.value)}
          />
        </div>
      ))}
      <button onClick={handleAddService}>הוסף שירות</button>
      <button onClick={handleNext}>הבא</button>
    </div>
  );
};

export default StepBusinessServices;
