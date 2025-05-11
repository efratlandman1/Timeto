import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/MainPage.css';
import '../styles/SearchBar.css';
import '../styles/businessCard.css';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter } from 'react-icons/fa';

const MainPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    
    const [popularBusinesses, setPopularBusinesses] = useState([]);
    const [newBusinesses, setNewBusinesses] = useState([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState([]);


    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [direction, setDirection] = useState(1); // 1 קדימה, -1 אחורה

    const images = [
        `${process.env.REACT_APP_API_DOMAIN}/uploads/business1.jpeg`,
        `${process.env.REACT_APP_API_DOMAIN}/uploads/business2.png`,
        `${process.env.REACT_APP_API_DOMAIN}/uploads/business3.jpg`
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImageIndex((prevIndex) => {
                let nextIndex = prevIndex + direction;

                if (nextIndex >= images.length) {
                    setDirection(-1);
                    return prevIndex - 1;
                } else if (nextIndex < 0) {
                    setDirection(1);
                    return prevIndex + 1;
                }

                return nextIndex;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [direction, images.length]);

    const handlePrev = () => {
        setDirection(-1);
        setCurrentImageIndex((prevIndex) =>
            prevIndex === 0 ? 0 : prevIndex - 1
        );
    };

    const handleNext = () => {
        setDirection(1);
        setCurrentImageIndex((prevIndex) =>
            prevIndex === images.length - 1 ? prevIndex : prevIndex + 1
        );
    };

    // ====== טעינת נתונים ======
    useEffect(() => {
        fetchCategories().then(); // שליפת קטגוריות מהשרת
        fetchBusinesses().then(); // שליפת עסקים מהשרת
    }, []);

    // === פונקציה: שליפת קטגוריות מהשרת (משמשת לבניית תפריט קטגוריות) ===
    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    // === פונקציה: שליפת עסקים מהשרת (משמשת להצגת כלל העסקים) ===
    // const fetchBusinesses = async () => {
    //     try {
    //         const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
    //         setBusinesses(response.data);
    //         setFilteredBusinesses(response.data);
    //     } catch (error) {
    //         console.error("Error fetching businesses:", error);
    //     }
    // };
    const fetchBusinesses = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
            const allBusinesses = response.data;
            setBusinesses(allBusinesses);
            setFilteredBusinesses(allBusinesses);
    
            // קביעת העסקים לשורות
            setPopularBusinesses(getRandomBusinesses(allBusinesses));
            setNewBusinesses(getRandomBusinesses(allBusinesses));
            setRecommendedBusinesses(getRandomBusinesses(allBusinesses));
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };
    

    // === סינון עסקים לפי קטגוריה (משתמש עבור קליק על קטגוריה) ===
    // const handleFilterChange = (categoryId) => {
    //     if (categoryId === "") {
    //         setFilteredBusinesses(businesses);
    //     } else {
    //         setFilteredBusinesses(businesses.filter(b => b.categoryId === categoryId));
    //     }
    // };
    const handleFilterChange = (categoryName) => {
        // ניווט לדף תוצאות החיפוש לפי הקטגוריה
        navigate(`/search-results?categoryName=${categoryName}`);
    };

    // === חיפוש חופשי בטקסט (משתמש עבור שורת חיפוש) ===
    const handleSearch = () => {
        if (searchQuery) {
            setFilteredBusinesses(businesses.filter(b => b.name.toLowerCase().includes(searchQuery.toLowerCase())));
        } else {
            setFilteredBusinesses(businesses);
        }
    };

    // === מעבר לדף חיפוש מתקדם (בלחיצה על כפתור פילטר) ===
    const handleAdvancedSearchClick = () => {
        navigate('/advanced-search-page');
    };

    // === גלילה שמאלה של הקטגוריות (בלחיצה על חץ שמאלי) ===
    const scrollLeft = () => {
        const container = document.querySelector('.categories');
        container.scrollBy({ left: -300, behavior: 'smooth' });
    };

    // === גלילה ימינה של הקטגוריות (בלחיצה על חץ ימני) ===
    const scrollRight = () => {
        const container = document.querySelector('.categories');
        container.scrollBy({ left: 300, behavior: 'smooth' });
    };

    // === שליפת 4 עסקים רנדומליים מתוך רשימה (משמש עבור שורות עסקיות) ===
    const getRandomBusinesses = (businessList) => {
        let shuffled = [...businessList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, 4);
    };

    return (
        <div className='main-page-container'>

            {/* === שורת חיפוש === */}
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

            {/* === קטגוריות עם חיצים === */}
            <div className="category-container">
                <button className="arrow-left" onClick={scrollLeft}>←</button>
                <div className="categories">
                    {categories.map((category) => (
                        <div key={category._id} className="category-business" onClick={() => handleFilterChange(category.name)}>
                            <img
                                src={`${process.env.REACT_APP_API_DOMAIN}${category.logo}`}
                                alt={category.name}
                                className="category-logo"
                                />
                            <span>{category.name}</span>
                        </div>
                    ))}
                </div>
                <button className="arrow-right" onClick={scrollRight}>→</button>
            </div>

            {/* === באנר === */}
            <div className="banner">
                <div className="banner-slider" style={{ transform: `translateX(-${currentImageIndex * 100}%)` }}>
                    {images.map((src, index) => (
                        <img key={index} src={src} alt={`Business ${index}`} className="banner-image" />
                    ))}
                </div>
                <div className="banner-arrows">
                    <button className="arrow-left" onClick={handlePrev}>←</button>
                    <button className="arrow-right" onClick={handleNext}>→</button>
                </div>
            </div>

            {/* === שורות של קבוצות עסקים === */}
            <div className="business-groups">
                {/* שורה: פופולאריים */}
                <div className="business-row">
                    <div className="business-row-header">
                        <h3>פופולאריים בקרבת מקום</h3>
                        <a href="/search-results?filter=popular" className="view-all">הצג הכל</a>
                    </div>
                    <div className="card-slider">
                        {popularBusinesses.map((business) => (
                            <BusinessCard key={business._id} business={business} />
                        ))}
                    </div>

                </div>

                {/* שורה: עסקים חדשים */}
                <div className="business-row">
                    <div className="business-row-header">
                        <h3>עסקים חדשים שנוספו לאחרונה</h3>
                        <a href="/search-results?filter=new" className="view-all">הצג הכל</a>
                    </div>
                    <div className="card-slider">
                        {newBusinesses.map((business) => (
                            <BusinessCard key={business._id} business={business} />
                        ))}
                    </div>

                </div>

                {/* שורה: עסקים מומלצים */}
                <div className="business-row">
                    <div className="business-row-header">
                        <h3>המומלצים שלנו</h3>
                        <a href="/search-results?filter=recommended" className="view-all">הצג הכל</a>
                    </div>
                    <div className="card-slider">
                    {recommendedBusinesses.map((business) => (
                        <BusinessCard key={business._id} business={business} />
                    ))}
                </div>

                </div>
            </div>
        </div>
    );
};

export default MainPage;
