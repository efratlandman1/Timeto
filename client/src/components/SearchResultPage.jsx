import React, { useState, useEffect } from 'react'; 
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/SearchResultPage.css';
import '../styles/SearchBar.css';
import '../styles/businessCard.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa'; // אייקונים עבור חיפוש ופילטר

const SearchResultPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); // משתנה למלל חיפוש חופשי
    
    const location = useLocation();
    const filters = location.state?.filters || {};  // קבלת הפילטרים שנשלחו
    const navigate = useNavigate();

    useEffect(() => {
        fetchBusinesses();
    }, []);

    const fetchBusinesses = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
            setBusinesses(response.data);
            setFilteredBusinesses(response.data);
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    // פונקציה לחיפוש חופשי
    const handleSearch = () => {
        if (searchQuery) {
            setFilteredBusinesses(businesses.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredBusinesses(businesses);
        }
    };

    const handleAdvancedSearchClick = () => {
        navigate('/advanced-search-page'); // נווט לדף חיפוש מתקדם
    };

    // יצירת תוויות עבור הפילטרים
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

    // יצירת מערך של תוויות עבור כל הפילטרים
    const filterLabels = Object.entries(filters).map(([key, value]) => {
        return (
            <span key={key} className="filter-label">
                {createLabel(key, value)}
            </span>
        );
    });

    return (
        <div className='search-result-page-container'>
            {/* שורת חיפוש */}
            <div className="search-bar">
                <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="חיפוש חופשי"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyUp={handleSearch} // חיפוש יקרה בעת הקשת מקש
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

            {/* הצגת הפילטרים הפעילים */}
            {/* {filterLabels.length > 0 && (
                <div className="active-filters">
                    {filterLabels}
                </div>
            )} */}
            {Object.keys(filters).length > 0 && (
                <div className="filters-container">
                    {filters.category && <div className="filter-tag">תחום: {filters.category} <span className="remove-filter" onClick={() => {/* פונקציה להסרת פילטר */}}>×</span></div>}
                    {filters.service && <div className="filter-tag">שירות: {filters.service} <span className="remove-filter" onClick={() => {/* פונקציה להסרת פילטר */}}>×</span></div>}
                    {filters.minPrice && filters.maxPrice && <div className="filter-tag">מחיר: {filters.minPrice} - {filters.maxPrice} <span className="remove-filter" onClick={() => {/* פונקציה להסרת פילטר */}}>×</span></div>}
                    {filters.distance && <div className="filter-tag">מרחק: {filters.distance} ק"מ <span className="remove-filter" onClick={() => {/* פונקציה להסרת פילטר */}}>×</span></div>}
                    {filters.rating && <div className="filter-tag">דירוג: {filters.rating} כוכבים <span className="remove-filter" onClick={() => {/* פונקציה להסרת פילטר */}}>×</span></div>}
                </div>
            )}


            {/* הצגת העסקים */}
            <div className="card-slider">
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business._id} business={business} />
                ))}
            </div>
        </div>
    );
}

export default SearchResultPage;
