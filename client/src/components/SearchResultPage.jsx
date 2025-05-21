import React, { useState, useEffect, useRef } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import SearchBar from './SearchBar';
import { FaChevronDown } from 'react-icons/fa'; // 👈 הוספת אייקון
import { useSelector } from 'react-redux';
import '../styles/SearchResultPage.css';

const ITEMS_PER_PAGE = 8;

const SORT_OPTIONS = {
    rating: 'דירוג',
    name: 'שם העסק',
    distance: 'מרחק'
};

const SearchResultPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showSortOptions, setShowSortOptions] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const reduxServices = useSelector(state => state.services.services);
    const sortRef = useRef(null);

    const urlParams = new URLSearchParams(location.search);
    const rawFilters = {};
    for (const [key, value] of urlParams.entries()) {
        if (rawFilters[key]) {
            rawFilters[key] = [...rawFilters[key], value];
        } else {
            rawFilters[key] = [value];
        }
    }

    const currentSort = urlParams.get("sort") || "rating";

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const filters = { ...rawFilters };

                // המרת שירותים לפי Redux
                // if (filters.services) {
                //     const mapped = filters.services
                //         .map(name => reduxServices.find(s => s.name === name))
                //         .filter(Boolean)
                //         .map(s => s.id);

                //     if (mapped.length > 0) {
                //         filters.services = mapped;
                //     } // אחרת נשאר מחרוזת, השרת יתמודד
                // }
                console.log("reduxServices:",reduxServices)
                if (reduxServices.length > 0) {
                    filters.services = reduxServices.map(s => s.id);
                }

                const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`, {
                    params: {
                        ...filters,
                        page: currentPage,
                        limit: ITEMS_PER_PAGE,
                        sort: currentSort
                    }
                });

                setBusinesses(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            }
        };

        fetchBusinesses();
    }, [location.search, currentPage, reduxServices]);

    const handleSearch = () => {
        if (searchQuery) {
            const filtered = businesses.filter(b =>
                b.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setBusinesses(filtered);
        } else {
            setCurrentPage(1);
        }
    };

    const handleAdvancedSearchClick = () => {
        navigate('/advanced-search-page');
    };

    const removeFilter = (keyToRemove, valueToRemove = null) => {
        const newParams = new URLSearchParams(location.search);
        if (valueToRemove !== null) {
            const values = newParams.getAll(keyToRemove).filter(val => val !== valueToRemove);
            newParams.delete(keyToRemove);
            values.forEach(val => newParams.append(keyToRemove, val));
        } else {
            newParams.delete(keyToRemove);
        }

        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const createLabel = (key, value) => {
        switch (key) {
            case 'categoryName': return `קטגוריה: ${value}`;
            case 'services': return `שירות: ${value}`;
            case 'minPrice': return `מינימום ${value} ש"ח`;
            case 'maxPrice': return `מקסימום ${value} ש"ח`;
            case 'distance': return `עד ${value} ק"מ`;
            case 'rating': return `${value} כוכבים ומעלה`;
            default: return `${key}: ${value}`;
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSortSelect = (sortKey) => {
        const newParams = new URLSearchParams(location.search);
        newParams.set("sort", sortKey);
        setShowSortOptions(false);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) {
                setShowSortOptions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className='main-page-container'>
            <SearchBar />

            {Object.keys(rawFilters).length > 0 && (
                <div className="filters-container">
                    {Object.entries(filters).map(([key, value]) => (
                        key === 'q' || key === 'sort' || !value ? null : (
                            Array.isArray(value) ? (
                                value.map((val, idx) => (
                                    <div key={`${key}-${idx}`} className="filter-tag">
                                        {createLabel(key, val)}
                                        <span className="remove-filter" onClick={() => removeFilter(key, val)}>×</span>
                                    </div>
                                ))
                            ) : (
                                <div key={key} className="filter-tag">
                                    {createLabel(key, value)}
                                    <span className="remove-filter" onClick={() => removeFilter(key)}>×</span>
                                </div>
                            )
                        )
                    ))}
                </div>
            )}

            <div className="sort-container" ref={sortRef}>
                <div className="sort-label" onClick={() => setShowSortOptions(prev => !prev)}>
                    ממויין לפי {SORT_OPTIONS[currentSort] || "דירוג"}
                    <FaChevronDown
                        className={`sort-arrow ${showSortOptions ? 'open' : ''}`}
                        style={{ marginRight: '8px', color: 'red' }}
                    />
                </div>
                {showSortOptions && (
                    <div className="sort-options">
                        {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                            <div
                                key={key}
                                className="sort-option"
                                onClick={() => handleSortSelect(key)}
                            >
                                {label}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="card-slider">
                {businesses.map((business) => (
                    <BusinessCard key={business._id} business={business} />
                ))}
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
    );
};

export default SearchResultPage;
