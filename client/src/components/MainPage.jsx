import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import SearchBar from './SearchBar'; // ← חדש
import axios from 'axios';
import '../styles/MainPage.css';
import '../styles/businessCard.css';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaUserFriends, FaStar, FaCalendarCheck } from 'react-icons/fa';
import { buildQueryUrl } from '../utils/buildQueryUrl';
import { useSelector } from 'react-redux';

const MainPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [popularBusinesses, setPopularBusinesses] = useState([]);
    const [newBusinesses, setNewBusinesses] = useState([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [stats, setStats] = useState({
        users: null,
        businesses: null,
        reviews: null
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const navigate = useNavigate();
    
    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);

    const bannerImages = [
        '/uploads/business1.jpeg',
        '/uploads/business2.png',
        '/uploads/business3.jpg'
    ];

    // Auto-advance banner
    useEffect(() => {
        const timer = setInterval(() => {
            handleNextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    const handleNextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    };

    const handlePrevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + bannerImages.length) % bannerImages.length);
    };

    const handleSlideClick = () => {
        handleNextSlide();
    };

    const handleIndicatorClick = (index) => {
        setCurrentSlide(index);
    };

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchBusinesses();
    }, [userLocation, locationError]);

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
            // Fetch new businesses
            const newBusinessesUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'newest', limit: 3 }
            );
            const newBusinessesResponse = await axios.get(newBusinessesUrl);
            console.log('New businesses response:', newBusinessesResponse.data);
            setNewBusinesses(newBusinessesResponse.data.data);

            // Fetch popular nearby businesses
            const popularNearbyUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'popular_nearby', limit: 3 },
                userLocation
            );
            const popularNearbyResponse = await axios.get(popularNearbyUrl);
            console.log('Popular nearby response:', popularNearbyResponse.data);
            setPopularBusinesses(popularNearbyResponse.data.data);

            // Fetch recommended businesses (using high rating as criteria)
            const recommendedUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'rating', limit: 3 }
            );
            const recommendedResponse = await axios.get(recommendedUrl);
            console.log('Recommended response:', recommendedResponse.data);
            setRecommendedBusinesses(recommendedResponse.data.data);

        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const fetchStats = async () => {
        try {
            setIsStatsLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/stats/home`);
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const handleFilterChange = (categoryName) => {
        navigate(`/search-results?categoryName=${categoryName}`);
    };

    const handleScroll = (direction) => {
        const container = document.querySelector('.categories');
        const scrollAmount = direction === 'left' ? -300 : 300;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    const getRandomBusinesses = (businessList, count) => {
        let shuffled = [...businessList];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled.slice(0, count);
    };

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content'>
                {/* Hero Section */}
                <section className="hero-section">
                    <div className="hero-content">
                        {/* Search Section */}
                        <div className="search-section">
                            <h1>מצא את העסק המושלם</h1>
                            <p>בקרבתך ובכל הארץ</p>
                            <SearchBar />
                        </div>

                        <div className="banner-stats-container">
                            {/* Banner */}
                            <div className="banner-container" onClick={handleSlideClick}>
                                {bannerImages.map((src, index) => (
                                    <div key={index} 
                                        className={`banner-slide ${index === currentSlide ? 'active' : ''}`}>
                                        <img 
                                            src={`${process.env.REACT_APP_API_DOMAIN}${src}`} 
                                            alt={`Banner ${index + 1}`} 
                                            className="banner-image" 
                                        />
                                    </div>
                                ))}
                                
                                {/* Story Indicators */}
                                <div className="story-indicators">
                                    {bannerImages.map((_, index) => (
                                        <div 
                                            key={index}
                                            className={`story-indicator ${index === currentSlide ? 'active' : ''} 
                                                      ${index < currentSlide ? 'viewed' : ''}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleIndicatorClick(index);
                                            }}
                                        >
                                            <div className="indicator-progress"></div>
                                        </div>
                                    ))}
                                </div>

                                {/* Navigation Arrows */}
                                <button 
                                    className="banner-nav prev" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePrevSlide();
                                    }}
                                >
                                    <FaChevronRight />
                                </button>
                                <button 
                                    className="banner-nav next" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleNextSlide();
                                    }}
                                >
                                    <FaChevronLeft />
                                </button>
                            </div>

                            {/* Stats */}
                            <div className="stats-container">
                                <div className="stat-box">
                                    <div className="stat-icon-wrapper">
                                        <FaUserFriends className="stat-icon" />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-number">
                                            {!isStatsLoading && stats.users !== null && (
                                                <>{stats.users > 0 && '+ '}{stats.users}</>
                                            )}
                                        </div>
                                        <div className="stat-label">משתמשים רשומים</div>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-wrapper">
                                        <FaStar className="stat-icon" />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-number">
                                            {!isStatsLoading && stats.reviews !== null && (
                                                <>{stats.reviews > 0 && '+ '}{stats.reviews}</>
                                            )}
                                        </div>
                                        <div className="stat-label">ביקורות מאומתות</div>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-wrapper">
                                        <FaCalendarCheck className="stat-icon" />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-number">
                                            {!isStatsLoading && stats.businesses !== null && (
                                                <>{stats.businesses > 0 && '+ '}{stats.businesses}</>
                                            )}
                                        </div>
                                        <div className="stat-label">עסקים רשומים</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Categories */}
                <div className="categories-wrapper">
                    <div className="categories-header">
                        <h2>קטגוריות פופולריות</h2>
                    </div>
                    <button className="arrow-button" onClick={() => handleScroll('right')}>
                        <FaChevronRight />
                    </button>
                    <div className="categories">
                        {categories.map((category) => (
                            <div key={category._id} 
                                className="category-business" 
                                onClick={() => handleFilterChange(category.name)}>
                                <img
                                    src={`${process.env.REACT_APP_API_DOMAIN}${category.logo}`}
                                    alt={category.name}
                                    className="category-logo"
                                />
                                <span>{category.name}</span>
                            </div>
                        ))}
                    </div>
                    <button className="arrow-button" onClick={() => handleScroll('left')}>
                        <FaChevronLeft />
                    </button>
                    
                </div>

                {/* Business Groups */}
                <div className="business-groups">
                    <div className="business-row">
                        <div className="business-row-header">
                            <h3>עסקים חדשים</h3>
                            <a href="/search-results?sort=newest" className="view-all">הצג הכל</a>
                        </div>
                        <div className="card-slider">
                            {newBusinesses.map((business) => (
                                <BusinessCard key={business._id} business={business} />
                            ))}
                        </div>
                    </div>

                    <div className="business-row">
                        <div className="business-row-header">
                            <h3>פופולרי באזורך</h3>
                            <a href="/search-results?sort=popular_nearby" className="view-all">הצג הכל</a>
                        </div>
                        <div className="card-slider">
                            {popularBusinesses.map((business) => (
                                <BusinessCard key={business._id} business={business} />
                            ))}
                        </div>
                    </div>

                    <div className="business-row">
                        <div className="business-row-header">
                            <h3>עסקים מומלצים</h3>
                            <a href="/search-results?sort=rating" className="view-all">הצג הכל</a>
                        </div>
                        <div className="card-slider">
                            {recommendedBusinesses.map((business) => (
                                <BusinessCard key={business._id} business={business} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Banner */}
                <section className="bottom-banner">
                    <div className="bottom-banner-content">
                        <h2>הצטרף לקהילת זמן</h2>
                        <p>הוסף את העסק שלך והתחיל לקבל לקוחות חדשים עוד היום</p>
                        <button className="add-button" onClick={() => navigate('/edit')}>
                            הוסף עסק חינם
                        </button>
                    </div>
                </section>

                {/* Footer */}
                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>צור קשר</h3>
                            <div className="contact-info">
                                <a href="mailto:info@zezman.app">info@zezman.app</a>
                            </div>
                        </div>

                        <div className="footer-section">
                            <h3>קישורים מהירים</h3>
                            <ul className="quick-links">
                                <li><a href="/search">חיפוש</a></li>
                                <li><a href="/suggest">הצע פריט</a></li>
                                <li><a href="/terms" onClick={(e) => {
                                    e.preventDefault();
                                    // Show terms modal or navigate to terms page when ready
                                    alert('תנאי השימוש יהיו זמינים בקרוב');
                                }}>תנאי שימוש</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h3>זה הזמן</h3>
                            <p>מדריך העסקים המוביל בישראל. תמצא את העסק הנכון בקרבתך.</p>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="copyright">
                            © Zezman 2023 כל הזכויות שמורות.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MainPage;
