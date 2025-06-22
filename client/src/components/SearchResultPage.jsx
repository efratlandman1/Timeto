import React, { useState, useEffect, useRef, useCallback } from 'react';
import BusinessCard from './BusinessCard';
import AdvancedSearchModal from './AdvancedSearchModal';
import axios from 'axios';
import '../styles/SearchResultPage.css';
import '../styles/AdvancedSearchPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FaFilter, FaTimes, FaChevronDown, FaSort } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { buildQueryUrl } from '../utils/buildQueryUrl';

const ITEMS_PER_PAGE = 8;

const SORT_OPTIONS = {
    rating: 'דירוג גבוה',
    name: 'לפי א-ב',
    distance: 'מרחק',
    newest: 'חדש ביותר',
    popular_nearby: 'פופולרי באזורך'
};

const SearchResultPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [sortOption, setSortOption] = useState('rating');
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const sortDropdownRef = useRef(null);
    const advancedSearchRef = useRef(null);
    const prevSortRef = useRef('rating');
    const prevFiltersRef = useRef('');
    const prevLocationErrorRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();
    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);

    const observer = useRef();
    const lastBusinessElementRef = useCallback(node => {
        if (isLoading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setCurrentPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoading, hasMore]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
                setShowSortDropdown(false);
            }
            if (advancedSearchRef.current && !advancedSearchRef.current.contains(event.target) && !event.target.closest('.filter-button')) {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const filters = {};
        const sort = params.get('sort') || 'rating';
        for (const [key, value] of params.entries()) {
            if (key !== 'sort' && key !== 'q' && key !== 'page' && key !== 'limit') {
                if (key in filters) {
                    if (Array.isArray(filters[key])) {
                        filters[key].push(value);
                    } else {
                        filters[key] = [filters[key], value];
                    }
                } else {
                    filters[key] = value;
                }
            }
        }
        setActiveFilters(filters);
        setSortOption(sort);
    }, [location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || 'rating';
        const filtersString = JSON.stringify(activeFilters);
        if (
            currentPage !== 1 &&
            (prevSortRef.current !== sort || prevFiltersRef.current !== filtersString)
        ) {
            setCurrentPage(1);
        }
        prevSortRef.current = sort;
        prevFiltersRef.current = filtersString;
    }, [activeFilters, sortOption, location.search]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const sort = params.get('sort') || 'rating';
        const maxDistance = params.get('maxDistance');
        
        const needsLocationSorting = sort === 'distance' || sort === 'popular_nearby';
        const needsLocationFiltering = maxDistance;
        const needsLocation = needsLocationSorting || needsLocationFiltering;

        console.log('SearchResultPage - Location logic:', {
            sort,
            maxDistance,
            needsLocationSorting,
            needsLocationFiltering,
            needsLocation,
            userLocation,
            locationLoading,
            locationError
        });

        if (needsLocation) {
            if (locationLoading) return;
            if (!userLocation && !locationError) return;
            if (locationError && prevLocationErrorRef.current === locationError && currentPage !== 1) return;
            prevLocationErrorRef.current = locationError;
        }

        const paramsObj = {};
        for (const [key, value] of params.entries()) {
            if (key === 'services') {
                if (!paramsObj.services) paramsObj.services = [];
                paramsObj.services.push(value);
            } else {
                paramsObj[key] = value;
            }
        }
        paramsObj.page = currentPage;
        paramsObj.limit = ITEMS_PER_PAGE;
        if (needsLocation && locationError) {
            paramsObj.sort = 'rating';
        }
        
        console.log('SearchResultPage - Final params:', paramsObj);
        
        setIsLoading(true);
        const url = buildQueryUrl(
            `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
            paramsObj,
            needsLocation && userLocation ? userLocation : undefined
        );
        
        console.log('SearchResultPage - Final URL:', url);
        
        axios.get(url)
            .then(res => {
                const newBusinesses = res.data.data || [];
                setBusinesses(prevBusinesses => 
                    currentPage === 1 ? newBusinesses : [...prevBusinesses, ...newBusinesses]
                );
                setTotalPages(res.data.pagination?.totalPages || 1);
                setHasMore(currentPage < (res.data.pagination?.totalPages || 1));
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching businesses:', error);
                setIsLoading(false);
            });
    }, [location.search, currentPage, userLocation, locationLoading, locationError]);

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(location.search);
        if (Array.isArray(value)) {
            newParams.delete(key);
            value.forEach(v => newParams.append(key, v));
        } else {
            newParams.set(key, value);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleRemoveFilter = (key, value = null) => {
        const newParams = new URLSearchParams(location.search);
        if (value !== null && Array.isArray(activeFilters[key])) {
            const values = activeFilters[key].filter(v => v !== value);
            newParams.delete(key);
            values.forEach(v => newParams.append(key, v));
        } else {
            newParams.delete(key);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleClearFilters = () => {
        navigate({ pathname: location.pathname });
        setCurrentPage(1);
    };

    const handleSortChange = (newSort) => {
        const newParams = new URLSearchParams(location.search);
        if (newSort === 'rating') {
            newParams.delete('sort');
        } else {
            newParams.set('sort', newSort);
        }
        newParams.set('page', 1);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content'>
                <div className="page-header">
                    <div className="page-header__content">
                        <h1>חיפוש עסקים</h1>
                        <p>מצא את העסק המתאים לך</p>
                    </div>
                </div>
                
                <div className="search-controls">
                    <div className="search-controls__main">
                        <div className="search-bar-container">
                            <SearchBar isMainPage={false} />
                        </div>
                        <div className="search-controls__actions">
                            <button 
                                className="filter-button"
                                onClick={() => setShowFilters(!showFilters)}
                                aria-expanded={showFilters}
                            >
                                <FaFilter />
                                <span>סינון מתקדם</span>
                            </button>
                            <div className="sort-control" ref={sortDropdownRef}>
                                <button 
                                    className="sort-button"
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    aria-expanded={showSortDropdown}
                                >
                                    <span >{SORT_OPTIONS[sortOption]}</span>
                                    <FaSort  />
                                </button>
                                {showSortDropdown && (
                                    <div className="sort-dropdown">
                                        {Object.entries(SORT_OPTIONS).map(([value, label]) => (
                                            <button
                                                key={value}
                                                className={`sort-option ${sortOption === value ? 'selected' : ''}`}
                                                onClick={() => {
                                                    handleSortChange(value);
                                                    setShowSortDropdown(false);
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {showFilters && (
                        <div className="modal-overlay">
                            <AdvancedSearchModal
                                isOpen={showFilters}
                                onClose={() => setShowFilters(false)}
                                filters={activeFilters}
                                onFilterChange={(key, value) => {
                                    handleFilterChange(key, value);
                                }}
                            />
                        </div>
                    )}
                </div>

                {(sortOption === 'distance' || sortOption === 'popular_nearby') && !userLocation && !locationError && (
                    <div style={{ color: 'gray', margin: '1rem 0', textAlign: 'center' }}>טוען מיקום...</div>
                )}
                {locationError && (sortOption === 'distance' || sortOption === 'popular_nearby') && (
                    <div style={{ color: 'red', margin: '1rem 0', textAlign: 'center' }}>{locationError}</div>
                )}

                {Object.keys(activeFilters).length > 0 && (
                    <div className="filters-area">
                        <div className="filters-header">
                            <div className="filters-title">סינונים פעילים:</div>
                            <button 
                                className="clear-all-filters"
                                onClick={handleClearFilters}
                            >
                                נקה הכל
                                <FaTimes />
                            </button>
                        </div>

                        <div className="active-filters-container">
                            {Object.entries(activeFilters).map(([key, value]) => (
                                Array.isArray(value) ? (
                                    value.map((v, idx) => (
                                        <div key={`${key}-${idx}`} className="filter-tag">
                                            {key === 'categoryName' ? `קטגוריה: ${v}` :
                                             key === 'rating' ? `${v} כוכבים ומעלה` :
                                             key === 'services' ? `שירות: ${v}` :
                                             key === 'maxDistance' ? `עד מרחק של: ${v} ק"מ` : v}
                                            <button onClick={() => handleRemoveFilter(key, v)}>
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div key={key} className="filter-tag">
                                        {key === 'categoryName' ? `קטגוריה: ${value}` :
                                         key === 'rating' ? `${value} כוכבים ומעלה` :
                                         key === 'services' ? `שירות: ${value}` :
                                         key === 'maxDistance' ? `עד מרחק של: ${value} ק"מ` : value}
                                        <button onClick={() => handleRemoveFilter(key)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* תוצאות חיפוש */}
                {businesses.length > 0 && (
                    <div className="search-results-layout">
                        <div className="business-cards-grid">
                            {businesses.map((business, index) => {
                                if (businesses.length === index + 1) {
                                    return (
                                        <div key={business._id} ref={lastBusinessElementRef}>
                                            <BusinessCard business={business} />
                                        </div>
                                    );
                                } else {
                                    return <BusinessCard key={business._id} business={business} />;
                                }
                            })}
                        </div>
                    </div>
                )}

                {/* לוודר */}
                {isLoading && (
                    <div className="loader-container">
                        <div className="loader"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultPage;