import React, { useState, useEffect, useRef } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdvancedSearchPage.css';
import { useNavigate, useLocation } from 'react-router-dom';

const MAX_DISTANCE_KM = 100;

const AdvancedSearchModal = ({ isOpen, onClose, filters, onFilterChange }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [distance, setDistance] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const prevCategoryRef = useRef('');

  // Reset all selections when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedServices([]);
      setRating(0);
      setHoveredRating(0);
      setDistance(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory && prevCategoryRef.current !== selectedCategory) {
      setSelectedServices([]);  // מנקה שירותים כשקטגוריה משתנה
      prevCategoryRef.current = selectedCategory;
    }
  }, [selectedCategory]);
  
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
        // setSelectedServices([]);
        fetchServices();
      }
    } else {
      setServices([]);
    }
  }, [selectedCategory, categories]);
 
  useEffect(() => {
    if (services.length > 0 && filters?.services) {
      const servicesList = Array.isArray(filters.services) 
        ? filters.services 
        : filters.services.split(',');
        
      // בודקים שרק השירותים שקיימים באמת ב-services יישארו
      const validServices = servicesList.filter(s => services.some(service => service.name === s));
      setSelectedServices(validServices);
    }
  }, [services, filters]);
  
  useEffect(() => {
    if (filters) {
      if (filters.categoryName) {
        setSelectedCategory(filters.categoryName);
      }
      // if (filters.services) {
      //   // Handle both string and array formats from URL
      //   const servicesList = Array.isArray(filters.services) 
      //     ? filters.services 
      //     : filters.services.split(',');
      //   setSelectedServices(servicesList);
      // }
      if (filters.rating) {
        setRating(parseInt(filters.rating));
      }
      if (filters.maxDistance) {
        setDistance(Number(filters.maxDistance));
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

  const handleClearAll = () => {
    setSelectedCategory('');
    setSelectedServices([]);
    setRating(0);
    setHoveredRating(0);
    setDistance(0);
  };

  const handleSubmit = () => {
    const currentParams = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();
    const searchQuery = currentParams.get('q');
    const sortParam = currentParams.get('sort');
    if (searchQuery) newParams.set('q', searchQuery);
    if (sortParam) newParams.set('sort', sortParam);
    if (selectedCategory) newParams.set('categoryName', selectedCategory);
    selectedServices.forEach(service => newParams.append('services', service));
    if (rating > 0) newParams.set('rating', rating.toString());
    if (distance > 0) newParams.set('maxDistance', distance.toString());
    navigate({ pathname: location.pathname, search: newParams.toString() });
    onClose();
  };

  const renderStarRating = () => {
    return (
      <div className="rating-selector">
        <div className="rating-stars-row">
          <div className="stars-wrapper">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`rating-star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star === rating ? 0 : star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-circle btn-sm btn-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h2>חיפוש מורחב</h2>
        
        <div className="modal-scroll-content">
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

          <div className="form-group">
            <label htmlFor="distance-slider">מרחק מקסימלי (ק"מ)</label>
            <div className="distance-slider-row">
              <input
                id="distance-slider"
                type="range"
                min={0}
                max={MAX_DISTANCE_KM}
                value={distance}
                onChange={e => setDistance(Number(e.target.value))}
                step={1}
              />
              <span className="distance-value">{distance} ק"מ</span>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={handleClearAll}>נקה הכל</button>
          <button className="btn btn-solid btn-primary" onClick={handleSubmit}>הצג תוצאות</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal; 