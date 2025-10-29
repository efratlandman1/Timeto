import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import SaleAdCard from './SaleAdCard';
import PromoAdCard from './PromoAdCard';
import SearchBar from './SearchBar'; // ← חדש
import QuickCreateStrip from './QuickCreateStrip';
import axios from 'axios';
import '../styles/MainPage.css';
import '../styles/businessCard.css';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaArrowLeft, FaArrowRight, FaUserFriends, FaStar, FaCalendarCheck, FaEnvelope, FaPhone, FaWhatsapp } from 'react-icons/fa';
import { buildQueryUrl } from '../utils/buildQueryUrl';
import { useSelector } from 'react-redux';
import { getToken } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import { useResponsive } from '../utils/ResponsiveProvider';

const MainPage = () => {
    const { t, ready } = useTranslation();
    const { isMobile, isTablet } = useResponsive();
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [popularBusinesses, setPopularBusinesses] = useState([]);
    const [newBusinesses, setNewBusinesses] = useState([]);
    const [recommendedBusinesses, setRecommendedBusinesses] = useState([]);
    const [newSaleAds, setNewSaleAds] = useState([]);
    const [newPromoAds, setNewPromoAds] = useState([]);
    const [categories, setCategories] = useState([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [stats, setStats] = useState({
        users: null,
        businesses: null,
        reviews: null
    });
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const navigate = useNavigate();
    const htmlDir = typeof document !== 'undefined' ? (document.documentElement.getAttribute('dir') || 'ltr') : 'ltr';
    const isRTL = htmlDir === 'rtl';
    
    const userLocation = useSelector(state => state.location.coords);
    const locationLoading = useSelector(state => state.location.loading);
    const locationError = useSelector(state => state.location.error);
    
    const bannerImages = [
        '/uploads/business1.png',
        '/uploads/business2.png',
        '/uploads/business3.png'
    ];

        // Auto-advance banner
    useEffect(() => {
        const timer = setInterval(() => {
            handleNextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, [currentSlide]);

    useEffect(() => {
        fetchCategories();
        fetchStats();
    }, []);

    useEffect(() => {
        fetchBusinesses();
        fetchSaleAndPromo();
    }, [userLocation, locationError]);
    
    // Wait for translations to load
    if (!ready) {
        return (
            <div className="wide-page-container">
                <div className="wide-page-content">
                    <div className="loading-container">
                        <div className="loader"></div>
                        <span>Loading translations...</span>
                    </div>
                </div>
            </div>
        );
    }
    
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

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
            setCategories(response.data.data.categories);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchBusinesses = async () => {
        try {
            // הוספת headers עם טוקן אם המשתמש מחובר
            const headers = {};
            const token = getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            // Fetch new businesses
            const newBusinessesUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'newest', limit: 3 }
            );
            const newBusinessesResponse = await axios.get(newBusinessesUrl, { headers });
            console.log('New businesses response:', newBusinessesResponse.data);
            setNewBusinesses(newBusinessesResponse.data.data.businesses || []);

            // Fetch popular nearby businesses
            const popularNearbyUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'popular_nearby', limit: 3 },
                userLocation
            );
            const popularNearbyResponse = await axios.get(popularNearbyUrl, { headers });
            console.log('Popular nearby response:', popularNearbyResponse.data);
            setPopularBusinesses(popularNearbyResponse.data.data.businesses || []);

            // Fetch recommended businesses (using high rating as criteria)
            const recommendedUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                { sort: 'rating', limit: 3 }
            );
            const recommendedResponse = await axios.get(recommendedUrl, { headers });
            console.log('Recommended response:', recommendedResponse.data);
            setRecommendedBusinesses(recommendedResponse.data.data.businesses || []);

        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const fetchSaleAndPromo = async () => {
        try {
            const headers = {};
            const token = getToken();
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            // Fetch newest Sale Ads (nearby when location available)
            const saleUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads`,
                { sort: 'newest', limit: 12 },
                userLocation
            );
            const saleRes = await axios.get(saleUrl, { headers });
            setNewSaleAds((saleRes.data && saleRes.data.data && saleRes.data.data.ads) || []);

            // Fetch newest active Promo Ads (nearby when location available)
            const promoUrl = buildQueryUrl(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads`,
                { status: 'active', sort: 'newest', limit: 12 },
                userLocation
            );
            const promoRes = await axios.get(promoUrl, { headers });
            setNewPromoAds((promoRes.data && promoRes.data.data && promoRes.data.data.ads) || []);
        } catch (error) {
            console.error('Error fetching sale/promo ads:', error);
        }
    };

    const fetchStats = async () => {
        try {
            setIsStatsLoading(true);
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/stats/home`);
            setStats(response.data.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsStatsLoading(false);
        }
    };

    const formatStat = (value) => {
        if (value == null) {
            return { value: '', plus: false };
        }
        if (value < 10) {
            return { value, plus: false };
        }
        let step = 10;
        if (value >= 100000) {
            step = 10000;
        } else if (value >= 10000) {
            step = 1000;
        } else if (value >= 1000) {
            step = 100;
        } else if (value >= 100) {
            step = 10;
        }
        let floored = Math.floor(value / step) * step;
        if (floored >= value) {
            floored = Math.max(0, value - step);
        }
        return { value: floored, plus: floored < value };
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
                        {/* Top Join Strip above quick-create and banner */}
                        <div className="top-join-strip" role="region" aria-label="join-community">
                            <div className="top-join-inner">
                                <h2>{t('mainPage.joinBanner.title')}</h2>
                                <div className="top-join-accent" aria-hidden="true"></div>
                                <p>{t('mainPage.footer.aboutDescriptionLine1')}</p>
                                <p>{t('mainPage.footer.aboutDescriptionLine2')}</p>
                            </div>
                        </div>

                        {/* Search Section (without big title) */}
                        <div className="search-section">
                            <SearchBar />
                        </div>

                        {/* Quick Create strip placed under the search */}
                        <QuickCreateStrip />

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
                                            {!isStatsLoading && stats.users !== null && (() => {
                                                const f = formatStat(stats.users);
                                                return <>{f.plus && '+ '}{f.value}</>;
                                            })()}
                                        </div>
                                        <div className="stat-label">{t('mainPage.stats.newUsers')}</div>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-wrapper">
                                        <FaStar className="stat-icon" />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-number">
                                            {!isStatsLoading && stats.reviews !== null && (() => {
                                                const f = formatStat(stats.reviews);
                                                return <>{f.plus && '+ '}{f.value}</>;
                                            })()}
                                        </div>
                                        <div className="stat-label">{t('mainPage.stats.verifiedReviews')}</div>
                                    </div>
                                </div>
                                <div className="stat-box">
                                    <div className="stat-icon-wrapper">
                                        <FaCalendarCheck className="stat-icon" />
                                    </div>
                                    <div className="stat-content">
                                        <div className="stat-number">
                                            {!isStatsLoading && stats.businesses !== null && (() => {
                                                const f = formatStat(stats.businesses);
                                                return <>{f.plus && '+ '}{f.value}</>;
                                            })()}
                                        </div>
                                        <div className="stat-label">{t('mainPage.stats.registeredBusinesses')}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Create & Search appear only above banner */}
                    </div>
                </section>

                {/* Categories */}
                <div className="categories-wrapper">
                    <div className="categories-header">
                        <h2>{t('mainPage.categories.title')}</h2>
                    </div>
                    <button className="category-arrow left" onClick={() => handleScroll('left')}>
                        <FaChevronLeft />
                    </button>
                    <div className="categories">
                        {categories && categories.map((category) => (
                            <div key={category._id}
                                className="category-business"
                                style={{ background: '#fff' }}
                                onClick={() => handleFilterChange(category.name)}>
                                {category.logo ? (
                                    <img
                                        src={`${process.env.REACT_APP_API_DOMAIN}${category.logo}`}
                                        alt={category.name}
                                        className="category-logo"
                                    />
                                ) : (
                                    <span className="category-initial" style={{ background: '#fff' }}></span>
                                )}
                                <span>{category.name}</span>
                            </div>
                        ))}
                    </div>
                    <button className="category-arrow right" onClick={() => handleScroll('right')}>
                        <FaChevronRight />
                    </button>
                </div>

                {/* Business Groups */}
                <div className="business-groups">
                    {/* New Businesses in your area */}
                    {newBusinesses.length > 0 && (
                        <div className="business-row">
                            <div className="business-row-header">
                                <h3>{t('mainPage.sections.new')}</h3>
                                <a href="/search-results?tab=business&sort=newest" className="view-all" aria-label={t('mainPage.viewAll')}
                                   onClick={(e)=>{ e.preventDefault(); navigate('/search-results?tab=business&sort=newest'); }}>
                                    <span className="view-all-label visually-hidden">{t('mainPage.viewAll')}</span>
                                    <span className="view-all-icon" aria-hidden="true">{isRTL ? <FaArrowLeft /> : <FaArrowRight />}</span>
                                </a>
                            </div>
                            <div className="card-slider" style={{ gridTemplateColumns: `repeat(${isMobile ? 1 : isTablet ? 2 : 3}, minmax(0, 1fr))` }}>
                                {newBusinesses.slice(0, (isMobile ? 1 : isTablet ? 2 : 3)).map((business) => (
                                    <BusinessCard key={business._id} business={business} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Sale Ads in your area */}
                    {newSaleAds.length > 0 && (
                        <div className="business-row">
                            <div className="business-row-header">
                                <h3>{t('mainPage.sections.newSales')}</h3>
                                <a href="/search-results?tab=sale&sort=newest" className="view-all" aria-label={t('mainPage.viewAll')}
                                   onClick={(e)=>{ e.preventDefault(); navigate('/search-results?tab=sale&sort=newest'); }}>
                                    <span className="view-all-label visually-hidden">{t('mainPage.viewAll')}</span>
                                    <span className="view-all-icon" aria-hidden="true">{isRTL ? <FaArrowLeft /> : <FaArrowRight />}</span>
                                </a>
                            </div>
                            <div className="card-slider" style={{ gridTemplateColumns: `repeat(${isMobile ? 1 : isTablet ? 2 : 3}, minmax(0, 1fr))` }}>
                                {newSaleAds.slice(0, (isMobile ? 1 : isTablet ? 2 : 3)).map((ad) => (
                                    <SaleAdCard key={ad._id} ad={ad} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Promo Ads in your area */}
                    {newPromoAds.length > 0 && (
                        <div className="business-row">
                            <div className="business-row-header">
                                <h3>{t('mainPage.sections.newPromos')}</h3>
                                <a href="/search-results?tab=promo&status=active&sort=newest" className="view-all" aria-label={t('mainPage.viewAll')}
                                   onClick={(e)=>{ e.preventDefault(); navigate('/search-results?tab=promo&status=active&sort=newest'); }}>
                                    <span className="view-all-label visually-hidden">{t('mainPage.viewAll')}</span>
                                    <span className="view-all-icon" aria-hidden="true">{isRTL ? <FaArrowLeft /> : <FaArrowRight />}</span>
                                </a>
                            </div>
                            <div className="card-slider" style={{ gridTemplateColumns: `repeat(${isMobile ? 1 : isTablet ? 2 : 3}, minmax(0, 1fr))` }}>
                                {newPromoAds.slice(0, (isMobile ? 1 : isTablet ? 2 : 3)).map((ad) => (
                                    <PromoAdCard key={ad._id} ad={ad} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Bottom Banner removed as per request */}

                {/* Footer */}
                <footer className="footer">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>{t('mainPage.footer.contact')}</h3>
                            <p>{t('mainPage.footer.contactSubtitle')}</p>
                            <div className="contact-info">
                                <div className="contact-row">
                                    <FaEnvelope className="icon" />
                                    <a href="mailto:info@zezman.app" aria-label="אימייל">info@zezman.app</a>
                                </div>
                                <div className="contact-row">
                                    <FaPhone className="icon" />
                                    <a href="tel:+97235551234" aria-label="טלפון">03-555-1234</a>
                                </div>
                                <div className="contact-row">
                                    <FaWhatsapp className="icon" />
                                    <a href="https://wa.me/972500000000" target="_blank" rel="noreferrer" aria-label="וואטסאפ">050-000-0000</a>
                                </div>
                            </div>
                        </div>

                        <div className="footer-section">
                            <h3>{t('mainPage.footer.quickLinks')}</h3>
                            <ul className="quick-links">
                                <li><a href="/search">{t('mainPage.footer.search')}</a></li>
                                <li><a href="/suggest-item">{t('mainPage.footer.suggestItem')}</a></li>
                                <li><a href="/terms" onClick={(e) => {
                                    e.preventDefault();
                                    // Show terms modal or navigate to terms page when ready
                                    alert(t('mainPage.footer.termsComingSoon'));
                                }}>{t('mainPage.footer.termsOfService')}</a></li>
                            </ul>
                        </div>

                        <div className="footer-section">
                            <h3>{t('mainPage.footer.about')}</h3>
                            <p>{t('mainPage.joinBanner.descriptionFull')}</p>
                        </div>
                    </div>

                    <div className="footer-bottom">
                        <div className="copyright">
                            {t('mainPage.footer.copyright')}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default MainPage;
