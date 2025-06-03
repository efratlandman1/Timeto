import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdvancedSearchPage.css';

const AdvancedSearchModal = ({ isOpen, onClose, filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

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

  useEffect(() => {
    // Initialize filters from URL params
    if (filters) {
      if (filters.categoryName) {
        setSelectedCategory(filters.categoryName);
      }
      if (filters.services) {
        setSelectedServices(Array.isArray(filters.services) ? filters.services : [filters.services]);
      }
      if (filters.rating) {
        setRating(parseInt(filters.rating));
      }
    }
  }, [filters]);

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

  const renderStarRating = () => {
    return (
      <div className="rating-selector">
        <div className="rating-stars-row">
          <div className="stars-wrapper">
            {[5, 4, 3, 2, 1].map((star) => (
              <FaStar
                key={star}
                className={`rating-star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star === rating ? 0 : star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
          <span className="rating-display">
            {hoveredRating || rating ? `${hoveredRating || rating} כוכבים ומעלה` : 'לא נבחר דירוג'}
          </span>
        </div>
        <div className="rating-hint">
          לחץ על הכוכבים כדי לבחור דירוג מינימלי
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="narrow-page-container">
        <div className="narrow-page-content">
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
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

          <div className="form-group">
            <label>דירוג מינימלי</label>
            {renderStarRating()}
          </div>

          <div className="buttons-container">
            <button className="modal-button secondary" onClick={onClose}>ביטול</button>
            <button className="modal-button primary" onClick={handleSubmit}>
              {selectedCategory || selectedServices.length > 0 || rating > 0 ? 'החל סינון' : 'סגור'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal; 