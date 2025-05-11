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

    const navigate = useNavigate();
    const location = useLocation();

    const urlParams = new URLSearchParams(location.search);

    // מסך הפילטרים כ-object
    const filters = {};
    for (const [key, value] of urlParams.entries()) {
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

    useEffect(() => {
        const fetchBusinesses = async () => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`, {
                    params: filters
                });
                setBusinesses(res.data.data || []);
                setFilteredBusinesses(res.data.data || []);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            }
        };

        fetchBusinesses();
    }, [location.search]);

    const handleSearch = () => {
        if (searchQuery) {
            setFilteredBusinesses(
                businesses.filter(b =>
                    b.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        } else {
            setFilteredBusinesses(businesses);
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
            case 'subcategories': return `שירות: ${value}`;
            case 'minPrice': return `מינימום ${value} ש"ח`;
            case 'maxPrice': return `מקסימום ${value} ש"ח`;
            case 'distance': return `עד ${value} ק"מ`;
            case 'rating': return `${value} כוכבים ומעלה`;
            default: return `${key}: ${value}`;
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
