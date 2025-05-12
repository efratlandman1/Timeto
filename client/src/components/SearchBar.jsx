import React, { useState, useEffect } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.trim()) {
        fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/search?q=${encodeURIComponent(searchQuery)}`)
          .then((res) => res.json())
          .then((data) => {
            setResults(data);
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
        navigate(`/search-results?query=${encodeURIComponent(searchQuery.trim())}`);
        setShowDropdown(false);
      }
    }
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

  const handleSelectResult = (business) => {
    navigate(`/business/${business._id}`);
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
    <div className="search-bar">
      <div className="search-input-wrapper">
        <FaSearch className="search-icon" />
        <input
          type="text"
          placeholder="חיפוש חופשי"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyUp={handleSearch}
        />
        {showDropdown && results.length > 0 && (
          <ul className="search-results-dropdown">
          {results.map((business) => (
            <li
              key={business._id}
              className="search-result-item"
              onClick={() => handleSelectResult(business)}
            >
              <div className="search-result-top-row">
              <div className="serach-business-header">
                <span className="serach-business-name">{highlightMatch(business.name)}</span>
                {business.categoryName && (
                  <span className="serach-business-category-pill">{highlightMatch(business.categoryName)}</span>
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
