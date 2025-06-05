import React, { useState, useEffect, useRef } from 'react';
import BusinessCard from './BusinessCard';
import AdvancedSearchModal from './AdvancedSearchModal';
import axios from 'axios';
import '../styles/SearchResultPage.css';
import '../styles/AdvancedSearchPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FaFilter, FaTimes, FaChevronDown, FaSort } from 'react-icons/fa';

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

    const navigate = useNavigate();
    const location = useLocation();

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
            if (key !== 'sort' && key !== 'q') {
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
        const fetchBusinesses = async () => {
            try {
                const params = new URLSearchParams(location.search);
                params.set('page', currentPage.toString());
                params.set('limit', ITEMS_PER_PAGE.toString());
                
                // Create URL with all parameters, including multiple services
                const url = new URL(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
                params.forEach((value, key) => {
                    url.searchParams.append(key, value);
                });
                
                const res = await axios.get(url.toString());
                
                setBusinesses(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            }
        };

        fetchBusinesses();
    }, [location.search, currentPage]);

    const handleFilterChange = (key, value) => {
        const newParams = new URLSearchParams(location.search);
        
        if (Array.isArray(value)) {
            newParams.delete(key);
            value.forEach(v => newParams.append(key, v));
        } else {
            newParams.set(key, value);
        }
        
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

        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const handleClearFilters = () => {
        const newParams = new URLSearchParams();
        navigate({ pathname: location.pathname });
    };

    const handleSortChange = (newSort) => {
        const newParams = new URLSearchParams(location.search);
        if (newSort === 'rating') {
            newParams.delete('sort');
        } else {
            newParams.set('sort', newSort);
        }
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
                                    <span className="sort-text">{SORT_OPTIONS[sortOption]}</span>
                                    <FaSort className="sort-icon" />
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
                                             key === 'services' ? `שירות: ${v}` : v}
                                            <button onClick={() => handleRemoveFilter(key, v)}>
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div key={key} className="filter-tag">
                                        {key === 'categoryName' ? `קטגוריה: ${value}` :
                                         key === 'rating' ? `${value} כוכבים ומעלה` :
                                         key === 'services' ? `שירות: ${value}` : value}
                                        <button onClick={() => handleRemoveFilter(key)}>
                                            <FaTimes />
                                        </button>
                                    </div>
                                )
                            ))}
                        </div>
                    </div>
                )}

                <div className="search-results-layout">
                    <div className="business-cards-grid">
                        {businesses.map((business) => (
                            <BusinessCard key={business._id} business={business} />
                        ))}
                    </div>
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResultPage;
