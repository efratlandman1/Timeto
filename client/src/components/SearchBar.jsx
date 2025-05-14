import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaFilter } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useNavigate } from 'react-router-dom';
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

  const fetchResults = async (query, pageNum = 1, append = false) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses?q=${encodeURIComponent(query)}&page=${pageNum}`);
      const data = await res.json();
      const newResults = data.data || [];

      setHasMore(data.hasMore !== undefined ? data.hasMore : newResults.length >= 10);
      if (append) {
        setResults((prev) => [...prev, ...newResults]);
      } else {
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
        // אל תעדכן את ה-URL או תבצע חיפוש מחדש אם כבר יש חיפוש
        if (searchQuery.trim()) {
          setShowDropdown(false);  // רק נסגור את הדפדפן, לא נבצע חיפוש מחדש
        } else {
          setShowDropdown(false);  // אם אין חיפוש, נסגור את הדפדפן
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  useEffect(() => {
    const body = document.body;
    showDropdown ? body.classList.add('blurred') : body.classList.remove('blurred');
    return () => body.classList.remove('blurred');
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
    const handleScroll = () => {
      const dropdown = listRef.current;
      if (
        dropdown &&
        hasMore &&
        !isLoadingMore &&
        dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight - 50
      ) {
        handleLoadMore();
      }
    };

    const dropdown = listRef.current;
    if (dropdown) dropdown.addEventListener('scroll', handleScroll);
    return () => {
      if (dropdown) dropdown.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, isLoadingMore, results]);

  const triggerSearch = () => {
    const query = searchQuery.trim();
    navigate(query ? `/search-results?q=${encodeURIComponent(query)}` : `/search-results`);
    document.body.classList.remove('blurred');
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + results.length) % results.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelectResult(results[highlightedIndex]);
        } else {
          triggerSearch();
        }
        setShowDropdown(false);
        break;
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

  const handleBlur = () => {
    setTimeout(() => {
      triggerSearch();
      setShowDropdown(false);
    }, 150);
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
    const parts = text?.split(new RegExp(`(${searchQuery})`, 'gi')) || [];
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
          <span key={i} className="search-tag">{highlightMatch(tag)}</span>
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
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (searchQuery.trim() && results.length > 0) setShowDropdown(true);
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
