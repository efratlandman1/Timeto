import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaSearch, FaFilter, FaFolder, FaMapMarkerAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/SearchBar.css';
import { getToken } from '../utils/auth';

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 300;

const SearchBar = ({ onSearch, isMainPage = false }) => {
  const { t } = useTranslation();
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
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      // הוספת headers עם טוקן אם המשתמש מחובר
      const headers = {};
      const token = getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const API = process.env.REACT_APP_API_DOMAIN;

      // 1) Vector search first
      const vecRes = await fetch(`${API}/api/v1/embeddings/search`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, topK: ITEMS_PER_PAGE, includeContent: false })
      });

      if (vecRes.ok) {
        const vecJson = await vecRes.json();
        const vecItems = Array.isArray(vecJson?.data) ? vecJson.data : [];

        if (vecItems.length > 0) {
          // Group IDs by entity type
          const bizIds = [];
          const saleIds = [];
          const promoIds = [];
          vecItems.forEach((r) => {
            const et = (r?.metadata?.entityType || '').toLowerCase();
            const id = r?.metadata?.entityId || r?.id;
            if (!id) return;
            if (et === 'business') bizIds.push(id);
            else if (et === 'sale') saleIds.push(id);
            else if (et === 'promo') promoIds.push(id);
          });

          // Fetch details in parallel (hydrate)
          const fetchById = async (url) => {
            try {
              const res = await fetch(url, { headers });
              return res.ok ? res.json() : null;
            } catch {
              return null;
            }
          };

          const [bizDetails, saleDetails, promoDetails] = await Promise.all([
            Promise.all(bizIds.map(id => fetchById(`${API}/api/v1/businesses/${id}`))),
            Promise.all(saleIds.map(id => fetchById(`${API}/api/v1/sale-ads/${id}`))),
            Promise.all(promoIds.map(id => fetchById(`${API}/api/v1/promo-ads/${id}`)))
          ]);

          // Build lookup maps
          const bizMap = new Map();
          bizDetails.forEach((j, i) => {
            const id = bizIds[i];
            const item = j?.data?.business;
            if (id && item) bizMap.set(String(id), item);
          });
          const saleMap = new Map();
          saleDetails.forEach((j, i) => {
            const id = saleIds[i];
            const item = j?.data?.ad;
            if (id && item) saleMap.set(String(id), item);
          });
          const promoMap = new Map();
          promoDetails.forEach((j, i) => {
            const id = promoIds[i];
            const item = j?.data?.ad;
            if (id && item) promoMap.set(String(id), item);
          });

          // Reconstruct ordered results by vector ranking
          const combined = [];
          vecItems.forEach((r) => {
            const et = (r?.metadata?.entityType || '').toLowerCase();
            const id = String(r?.metadata?.entityId || r?.id || '');
            if (!id) return;
            if (et === 'business' && bizMap.has(id)) combined.push({ type: 'business', item: bizMap.get(id), score: r.score });
            if (et === 'sale' && saleMap.has(id)) combined.push({ type: 'sale', item: saleMap.get(id), score: r.score });
            if (et === 'promo' && promoMap.has(id)) combined.push({ type: 'promo', item: promoMap.get(id), score: r.score });
          });

          // Vector results are final (no infinite paging for now)
          setHasMore(false);
          if (append) {
            setResults(prev => [...prev, ...combined]);
          } else {
            setResults(combined);
            itemRefs.current = [];
          }
          setShowDropdown(true);
          setHighlightedIndex(-1);
          return;
        }
      }

      // 2) Fallback to legacy text search endpoints if vector is empty or failed
      const [bizRes, saleRes, promoRes] = await Promise.all([
        fetch(`${API}/api/v1/businesses?q=${encodeURIComponent(query)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`, { headers }),
        fetch(`${API}/api/v1/sale-ads?q=${encodeURIComponent(query)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`, { headers }),
        fetch(`${API}/api/v1/promo-ads?q=${encodeURIComponent(query)}&page=${pageNum}&limit=${ITEMS_PER_PAGE}`, { headers })
      ]);

      if (!bizRes.ok && !saleRes.ok && !promoRes.ok) throw new Error('Search request failed');

      const [bizJson, saleJson, promoJson] = await Promise.all([
        bizRes.ok ? bizRes.json() : Promise.resolve({ data: { businesses: [] }, pagination: {} }),
        saleRes.ok ? saleRes.json() : Promise.resolve({ data: { ads: [] }, pagination: {} }),
        promoRes.ok ? promoRes.json() : Promise.resolve({ data: { ads: [] }, pagination: {} })
      ]);

      const bizItems = (bizJson?.data?.businesses || []).map(b => ({ type: 'business', item: b }));
      const saleItems = (saleJson?.data?.ads || []).map(a => ({ type: 'sale', item: a }));
      const promoItems = (promoJson?.data?.ads || []).map(a => ({ type: 'promo', item: a }));

      const combined = [...bizItems, ...saleItems, ...promoItems];
      combined.sort((a,b) => new Date(b.item.updatedAt || b.item.createdAt || 0) - new Date(a.item.updatedAt || a.item.createdAt || 0));

      let hasNext = (bizJson.pagination?.hasNextPage) || (saleJson.pagination?.hasNextPage) || (promoJson.pagination?.hasNextPage) || (combined.length === ITEMS_PER_PAGE);
      setHasMore(!!hasNext);

      if (append) {
        setResults(prev => [...prev, ...combined]);
      } else {
        if (combined.length === 0 && query.trim().length >= 2 && pageNum === 1) {
          try {
            const limit = 20;
            const [fbBizRes, fbSaleRes, fbPromoRes] = await Promise.all([
              fetch(`${API}/api/v1/businesses?page=1&limit=${limit}`, { headers }),
              fetch(`${API}/api/v1/sale-ads?page=1&limit=${limit}`, { headers }),
              fetch(`${API}/api/v1/promo-ads?page=1&limit=${limit}`, { headers })
            ]);
            const [fbBizJson, fbSaleJson, fbPromoJson] = await Promise.all([
              fbBizRes.ok ? fbBizRes.json() : Promise.resolve({ data: { businesses: [] } }),
              fbSaleRes.ok ? fbSaleRes.json() : Promise.resolve({ data: { ads: [] } }),
              fbPromoRes.ok ? fbPromoRes.json() : Promise.resolve({ data: { ads: [] } })
            ]);
            const ql = query.trim().toLowerCase();
            const str = (v) => (v ? String(v).toLowerCase() : '');
            const bizFb = (fbBizJson?.data?.businesses || []).filter(b =>
              str(b.name).includes(ql) || str(b.address).includes(ql) || str(b.city).includes(ql) || str(b.categoryName).includes(ql)
            ).map(b => ({ type: 'business', item: b }));
            const saleFb = (fbSaleJson?.data?.ads || []).filter(a =>
              str(a.title || a.name).includes(ql) || str(a.description).includes(ql) || str(a.city).includes(ql) || str(a.categoryName).includes(ql)
            ).map(a => ({ type: 'sale', item: a }));
            const promoFb = (fbPromoJson?.data?.ads || []).filter(a =>
              str(a.title || a.name).includes(ql) || str(a.description).includes(ql)
            ).map(a => ({ type: 'promo', item: a }));
            const fallbackCombined = [...bizFb, ...saleFb, ...promoFb];
            fallbackCombined.sort((a,b) => new Date(b.item.updatedAt || b.item.createdAt || 0) - new Date(a.item.updatedAt || a.item.createdAt || 0));
            hasNext = fallbackCombined.length >= ITEMS_PER_PAGE;
            setHasMore(!!hasNext);
            setResults(fallbackCombined);
          } catch {
            setResults([]);
          }
        } else {
          setResults(combined);
        }
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

  // Add blur effect when dropdown is shown
  useEffect(() => {
    if (showDropdown) {
      document.body.classList.add('blurred');
    } else {
      document.body.classList.remove('blurred');
    }
    
    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('blurred');
    };
  }, [showDropdown]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('q');
    if (q) {
      setSearchQuery(q);
      if (isMainPage) {
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
        searchTimeoutRef.current = setTimeout(() => {
          setPage(1);
          fetchResults(q, 1);
        }, DEBOUNCE_DELAY);
      }
    }
  }, [location.search, isMainPage, fetchResults]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const params = new URLSearchParams(location.search);
    const urlQuery = params.get('q');
    
    if (searchQuery !== urlQuery) {
      searchTimeoutRef.current = setTimeout(() => {
        if (searchQuery.trim()) {
          setPage(1);
          fetchResults(searchQuery, 1);
        } else {
          setResults([]);
          setShowDropdown(false);
        }
      }, DEBOUNCE_DELAY);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, location.search, fetchResults]);

  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  // Handle scroll for infinite loading
  useEffect(() => {
    const dropdown = listRef.current;
    if (!dropdown) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = dropdown;
      
      // Check if we're near the bottom (within 50px)
      if (scrollHeight - scrollTop - clientHeight < 50) {
        if (hasMore && !isLoadingMore) {
          handleLoadMore();
        }
      }
    };

    dropdown.addEventListener('scroll', handleScroll);
    return () => dropdown.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingMore, page]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || !searchQuery.trim()) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchResults(searchQuery.trim(), nextPage, true);
  }, [hasMore, isLoadingMore, page, searchQuery, fetchResults]);

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

  const handleSelectResult = (result) => {
    if (result.type === 'business') {
      navigate(`/business-profile/${result.item._id}`, { state: { background: location } });
      setSearchQuery(result.item.name);
    } else if (result.type === 'sale') {
      navigate(`/ads/sale/${result.item._id}`, { state: { background: location } });
      setSearchQuery(result.item.title || result.item.name || '');
    } else if (result.type === 'promo') {
      navigate(`/ads/promo/${result.item._id}`, { state: { background: location } });
      setSearchQuery(result.item.title || result.item.name || '');
    }
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

  const getSearchResultImage = (result) => {
    if (result.type === 'business') {
      // בדיקה אם הלוגו קיים ולא ריק
      if (result.item.logo && result.item.logo.trim() !== '') {
        // הוסף את הנתיב המלא לתמונה כמו בכרטיסי עסקים
        const logoFileName = result.item.logo.split('/').pop();
        const imageSrc = `${process.env.REACT_APP_API_DOMAIN}/uploads/${logoFileName}`;
        return (
          <img 
            src={imageSrc} 
            alt={result.item.name}
            className="search-result-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        );
      }
      return null;
    } else if (result.type === 'promo') {
      // בדיקה אם התמונה קיימת ולא ריקה
      if (result.item.image && result.item.image.trim() !== '') {
        // הוסף את הנתיב המלא לתמונה כמו במודעות
        const imageSrc = `${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${result.item.image}`;
        return (
          <img 
            src={imageSrc} 
            alt={result.item.title}
            className="search-result-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        );
      }
      return null;
    } else if (result.type === 'sale') {
      // בדיקה אם יש תמונות ולא ריקות
      if (result.item.images && result.item.images.length > 0 && result.item.images[0] && result.item.images[0].trim() !== '') {
        const randomIndex = Math.floor(Math.random() * result.item.images.length);
        // הוסף את הנתיב המלא לתמונה כמו במודעות
        const imageSrc = `${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${result.item.images[randomIndex]}`;
        return (
          <img 
            src={imageSrc} 
            alt={result.item.title || result.item.name}
            className="search-result-img"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        );
      }
      return null;
    }
    
    return null;
  };

  const renderSearchResults = () => {
    if (!showDropdown) return null;

    return (
      <ul 
        className="search-results-dropdown" 
        ref={listRef}
        role="listbox"
        aria-label={t('search.results')}
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
                    <div className="no-results-message">{t('search.noResults')}</div>
        <div className="no-results-suggestion">{t('search.noResultsSuggestion')}</div>
          </li>
        ) : (
          <>
            {results.map((res, index) => (
              <li
                key={`${res.type}-${res.item._id}`}
                ref={el => itemRefs.current[index] = el}
                role="option"
                aria-selected={index === highlightedIndex}
                className={`search-result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelectResult(res)}
              >
                <div className="search-result-header">
                  <div className="business-info">
                    <div className="business-main-info">
                      <div className="business-name">
                        {renderHighlightedText(res.item.name || res.item.title)}
                      </div>
                      <div className="business-address">
                        <FaMapMarkerAlt />
                        {renderHighlightedText(res.item.address || res.item.city || '')}
                      </div>
                    </div>
                    <div className="business-tags">
                      {res.item.categoryName && (
                        <span className="tag">
                          {renderHighlightedText(res.item.categoryName)}
                        </span>
                      )}
                      {res.type === 'business' ? renderServices(res.item) : null}
                    </div>
                  </div>
                  <div className="search-result-image">
                    {getSearchResultImage(res)}
                  </div>
                </div>
              </li>
            ))}
            {isLoadingMore && (
              <li className="load-more-item">
                <div className="loading-spinner">
                  <AiOutlineLoading3Quarters className="spinner-icon" />
                </div>
              </li>
            )}
          </>
        )}
      </ul>
    );
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // If we're on the results page and the input is cleared
    if (!isMainPage && !value.trim()) {
      const params = new URLSearchParams(location.search);
      params.delete('q');
      navigate({ 
        pathname: location.pathname,
        search: params.toString()
      });
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
          onFocus={() => {
            if (isMainPage || document.activeElement === inputRef.current) {
              setShowDropdown(results.length > 0);
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
          aria-label={t('search.search')}
        />
      </form>
      {renderSearchResults()}
    </div>
  );
};

export default SearchBar;
