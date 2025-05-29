import React, { useState, useEffect } from 'react';
import { FaStar } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdvancedSearchPage.css';

const AdvancedSearchModal = ({ isOpen, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const category = categories.find(c => c.name === selectedCategory);
      if (category) {
        const fetchServices = async () => {
          try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/byCategory/${category._id}`);
            setServices(response.data);
          } catch (error) {
            console.error("Error fetching services:", error);
            setServices([]);
          }
        };
        fetchServices();
      }
    } else {
      setServices([]);
    }
  }, [selectedCategory, categories]);

  const handleServiceClick = (serviceName) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceName)) {
        return prev.filter(s => s !== serviceName);
      }
      return [...prev, serviceName];
    });
  };

  const handleSubmit = () => {
    const params = new URLSearchParams(window.location.search);
    
    // Clear existing filter parameters
    params.delete('categoryName');
    params.delete('services');
    params.delete('rating');
    
    // Add new filter parameters
    if (selectedCategory) {
      params.set('categoryName', selectedCategory);
    }
    
    selectedServices.forEach(service => {
      params.append('services', service);
    });
    
    if (rating > 0) {
      params.set('rating', rating.toString());
    }
    
    // Keep the search query if it exists
    const searchQuery = params.get('q');
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    
    window.location.search = params.toString();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>חיפוש מורחב</h2>

        <div className="form-group">
          <label>קטגוריה</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">בחר קטגוריה</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>

        {services.length > 0 && (
          <div className="form-group tags-section">
            <label>שירותים</label>
            <div className="tags-container">
              {services.map((service) => (
                <div
                  key={service._id}
                  className={`tag selectable ${selectedServices.includes(service.name) ? 'selected' : ''}`}
                  onClick={() => handleServiceClick(service.name)}
                >
                  {service.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-group rating-group">
          <label>דירוג (החל מ)</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                size={30}
                onClick={() => setRating(star)}
                className={rating >= star ? "star filled" : "star empty"}
              />
            ))}
          </div>
        </div>

        <div className="buttons-container">
          <button className="cancel-button" onClick={onClose}>ביטול</button>
          <button className="confirm-button" onClick={handleSubmit}>אישור</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal; 