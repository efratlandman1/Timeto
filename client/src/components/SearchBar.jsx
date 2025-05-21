import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = () => {
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
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const triggerSearch = () => {
    const query = searchQuery.trim();
    navigate(query ? `/search-results?q=${encodeURIComponent(query)}` : `/search-results`);
    document.body.classList.remove('blurred');
    setShowDropdown(false);
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
          triggerSearch();
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

  const highlightMatch = (text) => {
    if (!text) return null;
    const escapedQuery = escapeRegExp(searchQuery);
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === searchQuery.toLowerCase() ? <strong key={i}>{part}</strong> : part
    );
  };

  const renderTags = (subcategories) => {
    if (!subcategories?.length) return null;
    const displayTags = subcategories.slice(0, 4);
    const extraCount = subcategories.length - displayTags.length;

    return (
      <div className="tags-container">
        {displayTags.map((tag, i) => (
          <span key={tag + i} className="search-tag">{highlightMatch(tag)}</span>
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
          onFocus={() => {
            if (searchQuery.trim() && results.length > 0) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              triggerSearch();
            } else {
              handleKeyDown(e);
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          aria-controls="search-dropdown"
          aria-activedescendant={
            highlightedIndex >= 0 && results[highlightedIndex]
              ? `result-${results[highlightedIndex]._id}`
              : undefined
          }
        />

        {showDropdown && (
          <ul className="search-results-dropdown" id="search-dropdown" role="listbox" ref={listRef}>
            {results.length === 0 ? (
              <li className="no-results">
                <svg className="no-results-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9.5 3a6.5 6.5 0 0 1 5.2 10.4l5.15 5.15a1 1 0 0 1-1.42 1.42l-5.15-5.15A6.5 6.5 0 1 1 9.5 3Zm0 2a4.5 4.5 0 1 0 0 9a4.5 4.5 0 0 0 0-9Z"/>
                </svg>
                <div>לא נמצאו תוצאות תואמות</div>
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
        )}
      </div>

      <div className="filter-button-wrapper">
        <button onClick={handleAdvancedSearchClick} className="filter-button" title="חיפוש מורחב">
          <FaFilter />
        </button>
      </div>
    </div>
  );
};

export default SearchBar;
