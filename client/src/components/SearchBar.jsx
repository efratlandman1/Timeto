import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef();

  // סגירת dropdown בלחיצה מחוץ
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // רקע מטושטש כשהתפריט פתוח
  useEffect(() => {
    const body = document.body;
    if (showDropdown) {
      body.classList.add('blurred');
    } else {
      body.classList.remove('blurred');
    }

    return () => body.classList.remove('blurred');
  }, [showDropdown]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        // fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/search?q=${encodeURIComponent(searchQuery)}`)
        fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setResults(data.data || []);
            setShowDropdown(true);
          });
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
        setShowDropdown(false);
      }
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (searchQuery.trim() && !showDropdown) { // רק אם התפריט לא פתוח
        navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
        setShowDropdown(false);
      }
    }, 150); // מאפשר ללחוץ על תוצאה לפני סגירה
  };

  const handleAdvancedSearchClick = () => {
    navigate('/advanced-search-page');
  };

  const highlightMatch = (text) => {
    const parts = text?.split(new RegExp(`(${searchQuery})`, 'gi')) || [];
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? <strong key={index}>{part}</strong> : part
    );
  };

  const handleSelectResult = (business, event) => {
    event.stopPropagation();  // מונע את ההתפשטות של האירוע, כדי שלא תתבצע פעולה נוספת
    navigate(`/business-profile/${business._id}`);
    setSearchQuery(business.name);
    setShowDropdown(false);
  };

  const renderTags = (subcategories) => {
    if (!subcategories || subcategories.length === 0) return null;
    const displayTags = subcategories.slice(0, 4);
    const extraCount = subcategories.length - displayTags.length;

    return (
      <div className="tags-container">
        {displayTags.map((tag, idx) => (
          <span key={idx} className="search-tag">{highlightMatch(tag)}</span>
        ))}
        {extraCount > 0 && <span className="search-tag extra-tag">+{extraCount}</span>}
      </div>
    );
  };

  return (
    <div className="search-bar" ref={wrapperRef}>
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
            type="text"
            placeholder="חיפוש חופשי"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyUp={handleSearch}
            onBlur={handleBlur}
            onFocus={() => {
              if (searchQuery.trim() && results.length > 0) {
                setShowDropdown(true);
              }
            }}
          />

        {showDropdown && results.length > 0 && (
          <ul className="search-results-dropdown">
            {results.map((business) => (
              <li
                key={business._id}
                className="search-result-item"
                onClick={(e) => handleSelectResult(business, e)} // העברת האיבנט
              >
                <div className="search-result-top-row">
                  <div className="serach-business-header">
                    <span className="serach-business-name">{highlightMatch(business.name)}</span>
                    {business.categoryName && (
                      <span className="serach-business-category-pill">
                        {highlightMatch(business.categoryName)}
                      </span>
                    )}
                  </div>
                  {renderTags(business.subCategoryIds)}
                </div>
                <div className="business-address">{highlightMatch(business.address)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="filter-button-wrapper">
        <button
          onClick={handleAdvancedSearchClick}
          className="filter-button"
          title="חיפוש מורחב"
        >
          <FaFilter />
        </button>
      </div>

    </div>
  );
};

export default SearchBar;
