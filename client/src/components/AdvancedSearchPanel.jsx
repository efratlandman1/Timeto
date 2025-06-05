import React, { useState, useEffect } from 'react';
import { FaTimes, FaChevronDown, FaStar, FaCheck } from 'react-icons/fa';
import '../styles/AdvancedSearchPanel.css';

const AdvancedSearchPanel = ({ 
  isOpen,
  onClose,
  isMobile,
  filters,
  onFilterChange,
  onClearFilters,
  onRemoveFilter,
  sortOption,
  onSortChange
}) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    rating: true,
    sort: true
  });

  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    // Fetch categories from your API
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Keep selectedCategories in sync with filters
  useEffect(() => {
    if (filters.categories) {
      setSelectedCategories(Array.isArray(filters.categories) ? filters.categories : [filters.categories]);
    } else {
      setSelectedCategories([]);
    }
  }, [filters.categories]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleCategoryChange = (event) => {
    const categoryName = event.target.value;
    if (categoryName && !selectedCategories.includes(categoryName)) {
      const newCategories = [...selectedCategories, categoryName];
      setSelectedCategories(newCategories);
      onFilterChange('categories', newCategories);
    }
  };

  const handleRemoveCategory = (categoryName) => {
    const newCategories = selectedCategories.filter(cat => cat !== categoryName);
    setSelectedCategories(newCategories);
    onFilterChange('categories', newCategories.length > 0 ? newCategories : null);
  };

  const SORT_OPTIONS = [
    { key: 'rating', label: 'דירוג גבוה' },
    { key: 'name', label: 'לפי א-ב' },
    { key: 'distance', label: 'מרחק' },
    { key: 'newest', label: 'חדש ביותר' },
    { key: 'popular_nearby', label: 'פופולרי באזורך' }
  ];

  const RATING_OPTIONS = [
    { value: 5, label: 'ומעלה' },
    { value: 4, label: 'ומעלה' },
    { value: 3, label: 'ומעלה' },
    { value: 2, label: 'ומעלה' },
    { value: 1, label: 'ומעלה' }
  ];

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FaStar
        key={index}
        size={16}
        color={index < rating ? '#ffd700' : '#ddd'}
      />
    ));
  };

  return (
    <div className={`advanced-search-panel ${isOpen ? 'open' : ''} ${isMobile ? 'mobile' : ''}`}>
      {isMobile && (
        <div className="panel-header">
          <h2>סינון ומיון</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
      )}

      <div className="panel-content">
        {/* Sort Section */}
        <div className="filter-section">
          <div 
            className="section-header" 
            onClick={() => toggleSection('sort')}
          >
            <h3>מיון תוצאות</h3>
            <FaChevronDown className={`chevron ${expandedSections.sort ? 'open' : ''}`} />
          </div>
          {expandedSections.sort && (
            <div className="section-content">
              <select
                className="sort-select"
                value={sortOption}
                onChange={(e) => onSortChange(e.target.value)}
              >
                {SORT_OPTIONS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="filter-section">
          <div 
            className="section-header" 
            onClick={() => toggleSection('rating')}
          >
            <h3>דירוג</h3>
            <FaChevronDown className={`chevron ${expandedSections.rating ? 'open' : ''}`} />
          </div>
          {expandedSections.rating && (
            <div className="section-content rating-list">
              {RATING_OPTIONS.map(({ value, label }) => (
                <div
                  key={value}
                  className={`rating-option ${filters.rating === value.toString() ? 'selected' : ''}`}
                  onClick={() => onFilterChange('rating', value.toString())}
                >
                  <div className="rating-stars">
                    {renderStars(value)}
                  </div>
                  <span className="rating-text">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <div 
            className="section-header" 
            onClick={() => toggleSection('category')}
          >
            <h3>קטגוריה</h3>
            <FaChevronDown className={`chevron ${expandedSections.category ? 'open' : ''}`} />
          </div>
          {expandedSections.category && (
            <div className="section-content">
              <select
                className="category-select"
                onChange={handleCategoryChange}
                value=""
              >
                <option value="">בחר קטגוריה</option>
                {categories
                  .filter(category => !selectedCategories.includes(category.name))
                  .map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))
                }
              </select>
              {selectedCategories.length > 0 && (
                <div className="selected-categories">
                  {selectedCategories.map((categoryName) => (
                    <div key={categoryName} className="selected-category">
                      <span>{categoryName}</span>
                      <button onClick={() => handleRemoveCategory(categoryName)}>
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isMobile && (
        <div className="panel-footer">
          <button className="apply-filters-button" onClick={onClose}>
            החל סינון
          </button>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearchPanel; 