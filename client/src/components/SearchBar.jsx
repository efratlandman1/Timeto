import React, { useState } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (searchQuery.trim()) {
        navigate(`/search-results?query=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  }; 

  const handleAdvancedSearchClick = () => {
    navigate('/advanced-search-page');
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
