import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaFilter, FaFolder, FaMapMarkerAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SearchBar.css';

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

const SearchBar = ({ onSearch, isMainPage = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const itemRefs = useRef([]);

  const escapeRegExp = useCallback((string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }, []);

  const fetchResults = useCallback(async (query, pageNum = 1, append = false) => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (!append) {
      setIsSearching(true);
    }
    
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses?` +
        `q=${encodeURIComponent(query)}&` +
        `page=${pageNum}&` +
        `limit=${ITEMS_PER_PAGE}`
      );
      
      if (!res.ok) throw new Error('Search request failed');
      
      const data = await res.json();
      const newResults = data.data || [];
      
      setHasMore(data.pagination?.hasNextPage || false);
      
      if (append) {
        setResults(prev => [...prev, ...newResults]);
      } else {
        setResults(newResults);
        itemRefs.current = [];
      }
      
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setIsSearching(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        setPage(1);
        fetchResults(searchQuery, 1);
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchResults]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
    }
  }, [location.search]);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    fetchResults(searchQuery.trim(), nextPage, true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setShowDropdown(false);
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search-results?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectResult(results[highlightedIndex]);
        } else {
          handleSubmit(e);
        }
        break;

      case 'Escape':
        setShowDropdown(false);
        break;

      default:
        break;
    }
  };

  const handleSelectResult = (business) => {
    navigate(`/business-profile/${business._id}`);
    setSearchQuery(business.name);
    setShowDropdown(false);
  };

  const renderHighlightedText = (text) => {
    if (!text || !searchQuery.trim()) return text;
  
    try {
      const parts = String(text).split(
        new RegExp(`(${escapeRegExp(searchQuery.trim())})`, 'gi')
      );
  
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.trim().toLowerCase()
          ? <strong key={i}>{part}</strong>
          : part // החלקים הלא מודגשים חוזרים ישירות בלי <span> או Fragment
      );
    } catch (error) {
      return text;
    }
  };
  
  
  
  

  const renderServices = (business) => {
    if (!business.services?.length) return null;

    const displayServices = business.services.slice(0, 2);
    const extraCount = business.services.length - displayServices.length;

    return (
      <>
        {displayServices.map((service) => (
          <span key={service._id} className="tag">
            {renderHighlightedText(service.name)}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="tag">+{extraCount}</span>
        )}
      </>
    );
  };

  const renderSearchResults = () => {
    if (!showDropdown) return null;

    return (
      <ul 
        className="search-results-dropdown" 
        ref={listRef}
        role="listbox"
        aria-label="תוצאות חיפוש"
      >
        {isSearching && results.length === 0 ? (
          <li className="load-more-item">
            <div className="loading-spinner">
              <AiOutlineLoading3Quarters className="spinner-icon" />
            </div>
          </li>
        ) : results.length === 0 ? (
          <li className="no-results">
            <svg className="no-results-icon" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5 3a6.5 6.5 0 0 1 5.2 10.4l5.15 5.15a1 1 0 0 1-1.42 1.42l-5.15-5.15A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z"/>
            </svg>
            <div className="no-results-message">לא נמצאו תוצאות</div>
            <div className="no-results-suggestion">נסה לחפש במילים אחרות</div>
          </li>
        ) : (
          <>
            {results.map((business, index) => (
              <li
                key={business._id}
                ref={el => itemRefs.current[index] = el}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`search-result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelectResult(business)}
              >
                <div className="search-result-header">
                  <div className="business-info">
                    <div className="business-main-info">
                      <div className="business-name">
                        {renderHighlightedText(business.name)}
                      </div>
                      <div className="business-address">
                        <FaMapMarkerAlt />
                        {renderHighlightedText(business.address)}
                      </div>
                    </div>
                    <div className="business-tags">
                      {business.categoryName && (
                        <span className="tag">
                          {renderHighlightedText(business.categoryName)}
                        </span>
                      )}
                      {renderServices(business)}
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {hasMore && (
              <li className="load-more-item">
                {isLoadingMore ? (
                  <div className="loading-spinner">
                    <AiOutlineLoading3Quarters className="spinner-icon" />
                  </div>
                ) : (
                  <button 
                    className="load-more-button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                  >
                    טען עוד תוצאות
                  </button>
                )}
              </li>
            )}
          </>
        )}
      </ul>
    );
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
          placeholder="חפש עסק או שירות..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim() && results.length > 0) {
              setShowDropdown(true);
            }
          }}
          onKeyDown={handleKeyDown}
          aria-expanded={showDropdown}
          aria-controls="search-results"
          aria-autocomplete="list"
          role="combobox"
        />
        <FaSearch 
          className="search-icon"
          onClick={handleSubmit}
          aria-label="חפש"
        />
      </form>
      {renderSearchResults()}
    </div>
  );
};

export default SearchBar;
