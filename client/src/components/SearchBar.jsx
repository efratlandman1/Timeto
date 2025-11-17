import React, { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/SearchBar.css';
 

const SearchBar = ({ onSearch, isMainPage = false }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
 
  // Initialize from URL (supports arriving with q param)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q') || '';
    setSearchQuery(q);
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (isMainPage || !onSearch) {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
      return;
    }
    onSearch(searchQuery.trim());
  };
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!isMainPage) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(location.search);
      if (value.trim()) params.set('q', value);
      else params.delete('q');
      navigate({ pathname: location.pathname, search: params.toString() });
      if (onSearch) onSearch(value);
      }, 300);
    }
  };

  return (
    <div 
      className={`search-bar-container ${isMainPage ? 'main-page' : 'results-page'}`}
      ref={wrapperRef}
    >
      <form onSubmit={handleSubmit} className="search-bar-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChange={handleInputChange}
          aria-label={t('search.search')}
        />
        <FaSearch 
          className="search-icon"
          onClick={handleSubmit}
          aria-label={t('search.search')}
        />
      </form>
    </div>
  );
};

export default SearchBar;
