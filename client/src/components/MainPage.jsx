import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import SearchBar from './SearchBar'; // ← חדש
import axios from 'axios';
import '../styles/MainPage.css';
import '../styles/businessCard.css';
import { useNavigate } from 'react-router-dom';

const MainPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);

    const [popularBusinesses, setPopularBusinesses] = useState([]);
    const [newBusinesses, setNewBusinesses] = useState([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState([]);

    const [categories, setCategories] = useState([]);
    const navigate = useNavigate();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [direction, setDirection] = useState(1);

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
            const allBusinesses = response.data;
            setBusinesses(allBusinesses);
            setFilteredBusinesses(allBusinesses);

            setPopularBusinesses(getRandomBusinesses(allBusinesses));
            setNewBusinesses(getRandomBusinesses(allBusinesses));
            setRecommendedBusinesses(getRandomBusinesses(allBusinesses));
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const handleFilterChange = (categoryName) => {
        navigate(`/search-results?categoryName=${categoryName}`);
    };

    const scrollLeft = () => {
        const container = document.querySelector('.categories');
        container.scrollBy({ left: -300, behavior: 'smooth' });
    };

    const scrollRight = () => {
        const container = document.querySelector('.categories');
        container.scrollBy({ left: 300, behavior: 'smooth' });
    };

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
            <SearchBar />

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
