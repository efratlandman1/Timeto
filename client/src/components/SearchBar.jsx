import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaFilter, FaFolder, FaMapMarkerAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch, isMainPage = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const navigate = useNavigate();
  const wrapperRef = useRef();
  const listRef = useRef();
  const itemRefs = useRef([]);
  const location = useLocation();

  const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const fetchResults = async (query, pageNum = 1, append = false) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses?q=${encodeURIComponent(query)}&page=${pageNum}`);
      const data = await res.json();
      const newResults = data.data || [];

      setHasMore(data.hasMore ?? newResults.length > 0);
      if (append) {
        setResults((prev) => [...prev, ...newResults]);
      } else {
        itemRefs.current = [];
        setResults(newResults);
      }
      setShowDropdown(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('שגיאה בטעינת תוצאות:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        document.body.classList.remove('blurred');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('blurred');
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('blurred', showDropdown);
    return () => document.body.classList.remove('blurred');
  }, [showDropdown]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const query = searchQuery.trim();
      if (query) {
        setPage(1);
        fetchResults(query, 1);
      } else {
        setResults([]);
        setShowDropdown(false);
        document.body.classList.remove('blurred');
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  useEffect(() => {
    const dropdown = listRef.current;
    if (!dropdown) return;

    const handleScroll = () => {
      if (hasMore && !isLoadingMore && dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 50) {
        handleLoadMore();
      }
    };

    dropdown.addEventListener('scroll', handleScroll);
    return () => dropdown.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      fetchResults(q, 1);
      setShowDropdown(false);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery);
      } else {
        navigate(`/search-results?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        const nextIndex = highlightedIndex + 1;
        if (nextIndex < results.length) setHighlightedIndex(nextIndex);
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        const prevIndex = highlightedIndex - 1;
        if (prevIndex >= 0) setHighlightedIndex(prevIndex);
        break;
      }
      case 'Enter': {
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectResult(results[highlightedIndex]);
        } else {
          handleSubmit(e);
        }
        break;
      }
      case 'Escape':
        setShowDropdown(false);
        document.body.classList.remove('blurred');
        break;
      default:
        break;
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    setPage(nextPage);
    fetchResults(searchQuery.trim(), nextPage, true);
  };

  const handleAdvancedSearchClick = () => {
    navigate('/advanced-search-page');
  };

  const handleSelectResult = (business) => {
    navigate(`/business-profile/${business._id}`);
    setSearchQuery(business.name);
    setShowDropdown(false);
    document.body.classList.remove('blurred');
  };

  const renderHighlightedText = (text) => {
    if (!text || !searchQuery.trim()) return text;
    try {
      const parts = String(text).split(new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi'));
      return parts.map((part, i) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? 
          <strong key={i}>{part}</strong> : 
          part
      );
    } catch (error) {
      return text;
    }
  };

  const renderServices = (business) => {
    if (!business.services?.length) return null;
    const displayServices = business.services.slice(0, 3);
    const extraCount = business.services.length - displayServices.length;

    return (
      <div className="business-services">
        {displayServices.map((service) => (
          <span key={service._id} className="service-tag">
            {renderHighlightedText(service.name)}
          </span>
        ))}
        {extraCount > 0 && (
          <span className="service-tag">+{extraCount}</span>
        )}
      </div>
    );
  };

  const renderSearchResults = () => {
    if (!showDropdown) return null;

    return (
      <ul className="search-results-dropdown" id="search-dropdown" role="listbox" ref={listRef}>
        {results.length === 0 ? (
          <li className="no-results">
            <svg className="no-results-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path fill="currentColor" d="M9.5 3a6.5 6.5 0 0 1 5.2 10.4l5.15 5.15a1 1 0 0 1-1.42 1.42l-5.15-5.15A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Z"/>
            </svg>
            <div className="no-results-message">לא נמצאו תוצאות תואמות</div>
            <div className="no-results-suggestion">נסה לחפש במילים אחרות או הסר מסננים</div>
          </li>
        ) : (
          <>
            {results.map((business, index) => (
              <li
                id={`result-${business._id}`}
                key={business._id}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`search-result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                ref={(el) => itemRefs.current[index] = el}
                onClick={() => handleSelectResult(business)}
              >
                <div className="search-result-header">
                  <div className="business-info">
                    <div className="business-main-info">
                      <div className="business-name">
                        {renderHighlightedText(business.name)}
                      </div>
                      {business.categoryName && (
                        <div className="business-category">
                          <FaFolder className="category-icon" />
                          {renderHighlightedText(business.categoryName)}
                        </div>
                      )}
                      <div className="business-address">
                        <FaMapMarkerAlt size={12} />
                        {renderHighlightedText(business.address)}
                      </div>
                    </div>
                    {renderServices(business)}
                  </div>
                </div>
              </li>
            ))}
            {isLoadingMore && (
              <li className="load-more-item">
                <div className="loading-spinner red">
                  <AiOutlineLoading3Quarters className="spinner-icon spin" />
                </div>
              </li>
            )}
          </>
        )}
      </ul>
    );
  };

  return (
    <div className={`search-bar-container ${isMainPage ? 'main-page' : 'results-page'}`} ref={wrapperRef}>
      <form onSubmit={handleSubmit} className="search-bar-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder="חפש עסק או שירות..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => {
            if (searchQuery.trim() && results.length > 0) {
              setShowDropdown(true);
              document.body.classList.add('blurred');
            }
          }}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls="search-dropdown"
          aria-activedescendant={
            highlightedIndex >= 0 && results[highlightedIndex]
              ? `result-${results[highlightedIndex]._id}`
              : undefined
          }
        />
        <FaSearch className="search-icon" onClick={handleSubmit} />
      </form>
      {renderSearchResults()}
    </div>
  );
};

export default SearchBar;
