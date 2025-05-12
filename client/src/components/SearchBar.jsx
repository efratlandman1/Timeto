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
    }, 300); // debounce

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
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? <strong key={index}>{part}</strong> : part
    );
  };

  const handleSelectResult = (business) => {
    navigate(`/business/${business._id}`);
    setSearchQuery(business.name);
    setShowDropdown(false);
  };

  return (
    <div className="search-bar relative">
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

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full max-h-60 overflow-y-auto mt-1 rounded shadow-md">
          {results.map((business) => (
            <li
              key={business._id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelectResult(business)}
            >
              <div className="font-bold">{highlightMatch(business.name)}</div>
              <div className="text-sm text-gray-500">{highlightMatch(business.address)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
