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

    // ניתוח הפילטרים מ-URL (לדוגמה: ?category=מסעדות&rating=4)
    const filters = Object.fromEntries(new URLSearchParams(location.search));

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
    }, [location.search]); // קריאה מחדש רק אם הפרמטרים ב-URL משתנים

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

    const removeFilter = (keyToRemove) => {
        const newParams = new URLSearchParams(location.search);
        newParams.delete(keyToRemove);
        navigate({ pathname: location.pathname, search: newParams.toString() });
    };

    const createLabel = (key, value) => {
        switch (key) {
            case 'category': return `קטגוריה: ${value}`;
            case 'service': return `שירות: ${value}`;
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
