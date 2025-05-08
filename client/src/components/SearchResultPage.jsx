import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/SearchResultPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';

const SearchResultPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryId, setCategoryId] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    const queryParams = new URLSearchParams(location.search);
    const filters = Object.fromEntries(queryParams.entries());

    // קבלת ID של הקטגוריה לפי השם
    useEffect(() => {
        const fetchCategoryId = async () => {
            if (!filters.category) {
                setCategoryId(null);
                return;
            }
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
                console.log('res:',res);
                console.log('filters.category:',filters.category);
                
                const match = res.data.find(cat => cat.name === filters.category);
                console.log('match:',match);
                setCategoryId(match ? match._id : null);
            } catch (error) {
                console.error("Error fetching category ID:", error);
                setCategoryId(null);
            }
        };
        fetchCategoryId();
    }, [filters.category]);

    useEffect(() => {
        fetchBusinesses();
    }, [filters, categoryId]);

    const fetchBusinesses = async () => {
        try {
            const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
            let results = res.data;

            if (filters.service) {
                results = results.filter(b => b.services?.includes(filters.service));
            }
            if (filters.minPrice) {
                results = results.filter(b => b.price >= parseFloat(filters.minPrice));
            }
            if (filters.maxPrice) {
                results = results.filter(b => b.price <= parseFloat(filters.maxPrice));
            }
            if (filters.distance) {
                results = results.filter(b => b.distance <= parseFloat(filters.distance));
            }
            if (filters.rating) {
                results = results.filter(b => b.rating >= parseFloat(filters.rating));
            }
            if (categoryId) {
                results = results.filter(b => b.categoryId === categoryId);
            }

            setBusinesses(results);
            setFilteredBusinesses(results);
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const handleSearch = () => {
        if (searchQuery) {
            setFilteredBusinesses(businesses.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredBusinesses(businesses);
        }
    };

    const handleAdvancedSearchClick = () => {
        navigate('/advanced-search-page');
    };

    const removeFilter = (key) => {
        const newParams = new URLSearchParams(location.search);
        newParams.delete(key);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const createLabel = (key, value) => {
        switch (key) {
            case 'category':
                return `קטגוריה ${value}`;
            case 'service':
                return `שירות ${value}`;
            case 'minPrice':
                return `מחיר מינימלי ${value} ש"ח`;
            case 'maxPrice':
                return `מחיר מקסימלי ${value} ש"ח`;
            case 'distance':
                return `מרחק ${value} ק"מ`;
            case 'rating':
                return `דירוג ${value} כוכבים`;
            default:
                return '';
        }
    };

    return (
        <div className='search-result-page-container'>
            <div className="search-bar">
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
            </div>

            {Object.keys(filters).length > 0 && (
                <div className="filters-container">
                    {Object.entries(filters).map(([key, value]) => (
                        <div key={key} className="filter-tag">
                            {createLabel(key, value)}
                            <span className="remove-filter" onClick={() => removeFilter(key)}>×</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="card-slider">
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business._id} business={business} />
                ))}
            </div>
        </div>
    );
};

export default SearchResultPage;
