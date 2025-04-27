import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/MainPage.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa'; // אייקונים עבור חיפוש ופילטר

const MainPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState(''); // משתנה למלל חיפוש חופשי

    const navigate = useNavigate();

    useEffect(() => {
        fetchCategories();
        fetchBusinesses();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
            setBusinesses(response.data);
            setFilteredBusinesses(response.data);
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const handleFilterChange = (categoryId) => {
        if (categoryId === "") {
            setFilteredBusinesses(businesses);
        } else {
            setFilteredBusinesses(businesses.filter(b => b.categoryId === categoryId));
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

    return (
        <div className='main-page-container'>
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

            {/* קטגוריות */}
            <div className="category-container">
                <div className="categories">
                    <div className="category-business" onClick={() => handleFilterChange("")}>
                        <img src="/path/to/default-icon.png" alt="All" />
                        <span>כל הקטגוריות</span>
                    </div>
                    {categories.map((category) => (
                        <div key={category._id} className="category-business" onClick={() => handleFilterChange(category._id)}>
                            <img src={category.icon || "/path/to/default-icon.png"} alt={category.name} />
                            <span>{category.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* הצגת העסקים */}
            <div className="card-slider">
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business._id} business={business} />
                ))}
            </div>
        </div>
    );
}

export default MainPage;
