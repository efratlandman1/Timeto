import React, { useState, useEffect } from 'react';
import '../styles/StepsStyle.css';
import { FaTags } from 'react-icons/fa';
import axios from 'axios';

const StepBusinessServices = ({ businessData, setBusinessData }) => {
  const [availableServices, setAvailableServices] = useState([]);
  
  console.log("📦 businessData:", businessData); 
  
  const selectedServices = businessData.services || [];

  useEffect(() => {
    const fetchServices = async () => {
      if (!businessData.categoryId) return;

      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_DOMAIN}/api/v1/services/byCategory/${businessData.categoryId}`
        );
        setAvailableServices(response.data);
      } catch (error) {
        console.error('שגיאה בטעינת השירותים:', error);
      }
    };

    fetchServices();
  }, [businessData.categoryId]);

  const toggleService = (serviceId) => {
    const updatedServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId];

    setBusinessData(prev => ({
      ...prev,
      services: updatedServices
    }));
  };

  return (
    <div /*className="step-business-details"*/>
      
      <div className="form-field-vertical-container">
        {availableServices.map(service => (
          <div
            key={service._id}
            className={`tag selectable ${selectedServices.includes(service._id) ? 'selected' : ''}`}
            onClick={() => toggleService(service._id)}
          >
            {service.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepBusinessServices;
