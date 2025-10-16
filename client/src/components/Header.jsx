import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
    FaUserCircle, 
    FaSignOutAlt, 
    FaSignInAlt, 
    FaGlobe, 
    FaPlusCircle,
    FaPlus,
    FaTags,
    FaBullhorn,
    FaHeart,
    FaStore,
    FaLightbulb,
    FaMapMarkerAlt,
    FaChevronDown,
    FaSearch,
    FaHome,
    FaCog,
    FaIdCard,
    FaSyncAlt,
    FaTimes
} from "react-icons/fa";
import "../styles/Header.css";
import { useSelector, useDispatch } from 'react-redux';
import { getToken } from "../utils/auth";
import { useTranslation } from 'react-i18next';
import { logout } from '../redux/userSlice';
import { fetchUserLocation } from '../redux/locationSlice';
import { setLanguage, setDirection } from '../redux/uiSlice';
import { changeLanguage, getCurrentDirection } from '../i18n';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const [greeting, setGreeting] = useState("");
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const userMenuRef = useRef(null);
    const userButtonRef = useRef(null);
    const createMenuRef = useRef(null);
    const createButtonRef = useRef(null);
    const loginUser = useSelector(state => state.user.user);
    const isAdmin = loginUser && loginUser.role === 'admin';
    const { t, i18n, ready } = useTranslation();
    const dispatch = useDispatch();
    const { coords, loading, error } = useSelector(state => state.location);
    const [showPopover, setShowPopover] = useState(false);
    const [address, setAddress] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);
    const [addressError, setAddressError] = useState('');
    const popoverRef = useRef(null);
    
    // Get language and direction from Redux with fallback values
    const uiState = useSelector(state => state.ui);
    const language = uiState?.language || i18n.language || 'he';
    const direction = uiState?.direction || getCurrentDirection() || 'rtl';
    
    // Check if Redux is ready
    const isReduxReady = !!uiState;
    
    // Check if i18n is ready
    const isI18nReady = ready;
    
    // Debug logging
    console.log('Header State:', { uiState, language, direction, isReduxReady, isI18nReady });

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('greetings.morning');
        if (hour >= 12 && hour < 17) return t('greetings.afternoon');
        if (hour >= 17 && hour < 20) return t('greetings.evening');
        return t('greetings.night');
    };

    // Initialize language and direction on component mount
    useEffect(() => {
        const currentLang = i18n.language;
        const currentDir = getCurrentDirection();
        
        // Update Redux state if it differs from current state
        if (currentLang !== language) {
            dispatch(setLanguage(currentLang));
        }
        if (currentDir !== direction) {
            dispatch(setDirection(currentDir));
        }
    }, [language, direction, dispatch]);

    // Listen for language change events from i18n
    useEffect(() => {
        const handleLanguageChange = (event) => {
            const { language: newLang, direction: newDir } = event.detail;
            dispatch(setLanguage(newLang));
            dispatch(setDirection(newDir));
        };

        window.addEventListener('languageChanged', handleLanguageChange);
        
        return () => {
            window.removeEventListener('languageChanged', handleLanguageChange);
        };
    }, [dispatch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Check if click is outside both the menu and the button
            if (
                userMenuRef.current && 
                !userMenuRef.current.contains(event.target) &&
                userButtonRef.current &&
                !userButtonRef.current.contains(event.target)
            ) {
                setShowUserMenu(false);
            }
            
            // Check if click is outside language menu
            const langDropdown = event.target.closest('.lang-dropdown');
            if (!langDropdown) {
                setShowLangMenu(false);
            }

            // Close create dropdown if clicking outside
            if (
                createMenuRef.current &&
                !createMenuRef.current.contains(event.target) &&
                createButtonRef.current &&
                !createButtonRef.current.contains(event.target)
            ) {
                setShowCreateMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowUserMenu(false);
                setShowLangMenu(false);
                setShowCreateMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    useEffect(() => {
        const token = getToken(); // Now getToken checks validity automatically
        if (token && loginUser) {
            setUsername(loginUser.firstName || loginUser.email);
            setGreeting(getGreeting());
        } else {
            setUsername(null);
            // Clear user data if token is invalid
            if (loginUser && !token) {
                dispatch(logout());
            }
        }
        
        // Set loading to false after checking auth status
        setIsAuthLoading(false);

        const intervalId = setInterval(() => {
            if (loginUser) setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, [loginUser, t, dispatch]);

    // Periodic token validation check
    useEffect(() => {
        const checkTokenValidity = () => {
            const token = getToken(); // This now checks validity automatically
            if (!token && loginUser) {
                // Token is expired, clear user data
                dispatch(logout());
                setUsername(null);
                setShowUserMenu(false);
            }
        };

        // Check token validity every 30 seconds
        const tokenCheckInterval = setInterval(checkTokenValidity, 30000);
        
        // Also check on page focus (when user returns to tab)
        const handleFocus = () => {
            checkTokenValidity();
        };
        
        window.addEventListener('focus', handleFocus);
        
        return () => {
            clearInterval(tokenCheckInterval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loginUser, dispatch]);

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        localStorage.removeItem('user');
        dispatch(logout());
        setShowUserMenu(false);
        navigate("/");
    };

    const handleLanguageToggle = async () => {
        const newLang = language === 'he' ? 'en' : 'he';
        const newDir = newLang === 'he' ? 'rtl' : 'ltr';
        
        // Change language using i18n helper
        const success = await changeLanguage(newLang);
        
        if (success) {
            // Update Redux state
            dispatch(setLanguage(newLang));
            dispatch(setDirection(newDir));
        }
    };

    const handleLanguageChange = async (newLang) => {
        const newDir = newLang === 'he' ? 'rtl' : 'ltr';
        const success = await changeLanguage(newLang);
        if (success) {
            dispatch(setLanguage(newLang));
            dispatch(setDirection(newDir));
            setShowLangMenu(false);
        }
    };

    const handleMenuItemClick = (path) => {
        navigate(path);
        setShowUserMenu(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleRefreshLocation = () => {
        dispatch(fetchUserLocation());
    };

    // Fetch address from coordinates
    const fetchAddress = async (lat, lng) => {
        setAddressLoading(true);
        setAddressError('');
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`);
            const data = await res.json();
    
            if (data.address) {
                const { road, house_number, city, town, village, country } = data.address;
    
                // בונים את הרחוב ומספר הבית יחד בלי פסיק
                const streetWithNumber = [road, house_number].filter(Boolean).join(' ');
    
                const cityName = city || town || village || '';
                const formatted = [
                    streetWithNumber,
                    cityName,
                    country || 'ישראל'
                ].filter(Boolean).join(', ');
    
                setAddress(formatted);
            } else {
                setAddressError(t('header.addressNotFound'));
            }
        } catch (e) {
            setAddressError(t('header.addressError'));
        } finally {
            setAddressLoading(false);
        }
    };
    
    // When popover opens or coords change, fetch address
    useEffect(() => {
        if (showPopover && coords) {
            fetchAddress(coords.lat, coords.lng);
        }
    }, [showPopover, coords]);

    // Close popover on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setShowPopover(false);
            }
        }
        if (showPopover) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showPopover]);

    const formatAddress = (address) => address || '';

    // Safety check: don't render until Redux and i18n are ready
    if (!isReduxReady || !isI18nReady) {
        return (
            <div className="header-container">
                <nav className="navbar">
                    <div className="nav-right">
                        <div className="logo">
                            <FaMapMarkerAlt className="logo-icon" />
                            <div className="logo-text">
                                <span className="logo-text-main">{t('common.loading')}</span>
                                <span className="logo-text-sub">Loading...</span>
                            </div>
                        </div>
                    </div>
                </nav>
            </div>
        );
    }

    // Direction-aware CSS classes with safety checks
    const isRTL = direction === 'rtl';
    const headerClass = `header-container ${isRTL ? 'rtl' : 'ltr'}`;
    const navClass = `navbar ${isRTL ? 'rtl' : 'ltr'}`;
    const navRightClass = `nav-right ${isRTL ? 'rtl' : 'ltr'}`;
    const navCenterClass = `nav-center ${isRTL ? 'rtl' : 'ltr'}`;
    const navLeftClass = `nav-left ${isRTL ? 'rtl' : 'ltr'}`;
    const logoTextClass = "logo-text";
    const navLinksClass = "nav-links";
    const langSwitchClass = "lang-switch";
    const userMenuClass = "user-menu";
    const authButtonsClass = "auth-buttons";
    const dropdownMenuClass = "dropdown-menu";
    const dropdownItemClass = "dropdown-item";
    const locationPopoverClass = `location-popover ${isRTL ? 'rtl' : 'ltr'}`;
    const popoverHeaderClass = `popover-header ${isRTL ? 'rtl' : 'ltr'}`;
    const popoverActionsClass = `popover-actions ${isRTL ? 'rtl' : 'ltr'}`;

    return (
        <div className={headerClass}>
            <nav className={navClass}>
                <div className={navRightClass}>
                    <div className="logo" onClick={() => navigate("/")}> 
                        <FaMapMarkerAlt className="logo-icon" />
                        <div className={logoTextClass}>
                            <span className="logo-text-main">{t('header.logo.main')}</span>
                        </div>
                    </div>
                </div>

                <div className={navCenterClass}>
                    <div className={navLinksClass}>
                        <button 
                            className={`nav-button ${isActive("/") ? "active" : ""}`} 
                            onClick={() => navigate("/")}
                        >
                            <FaHome />
                            {t('header.home')}
                        </button>
                        <button 
                            className={`nav-button ${isActive("/search-results") ? "active" : ""}`} 
                            onClick={() => navigate("/search-results")}
                        >
                            <FaSearch />
                            {t('header.search')}
                        </button>
                        {/* Removed sale/promo nav to simplify header */}
                        <button 
                                className={`nav-button`}
                                onClick={() => setShowCreateMenu(!showCreateMenu)}
                                ref={createButtonRef}
                                aria-expanded={showCreateMenu}
                                aria-haspopup="true"
                                title="צור חדש"
                            >
                                <FaPlus />
                                צור
                            </button>
                            {showCreateMenu && (
                                <div 
                                    className={dropdownMenuClass}
                                    role="menu"
                                    aria-label="Create dropdown"
                                    ref={createMenuRef}
                                    style={{ minWidth: 200 }}
                                >
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); handleMenuItemClick("/business"); }}
                                        role="menuitem"
                                    >
                                        <FaStore />
                                        הוספת עסק
                                    </button>
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); handleMenuItemClick("/ads/sale/new"); }}
                                        role="menuitem"
                                    >
                                        <FaTags />
                                        מודעת מכירה
                                    </button>
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); handleMenuItemClick("/ads/promo/new"); }}
                                        role="menuitem"
                                    >
                                        <FaBullhorn />
                                        מודעת פרסום
                                    </button>
                                </div>
                            )}
                        <button 
                            className={`nav-button ${isActive("/suggest-item") ? "active" : ""}`} 
                            onClick={() => navigate("/suggest-item")}
                        >
                            <FaLightbulb />
                            {t('header.suggest')}
                        </button>
                        <span className="location-wrapper">
                            <button
                                onClick={() => setShowPopover(!showPopover)}
                                className="nav-button"
                                title={t('header.myLocation')}
                                type="button"
                            >
                                <FaMapMarkerAlt />
                                {t('header.locationShort')}
                            </button>
                            {showPopover && (
                            <div ref={popoverRef} className={locationPopoverClass}>
                                <div className={popoverHeaderClass}>
                                    <span>{t('header.currentLocation')}</span>
                                    <button className="close-popover-btn" onClick={() => setShowPopover(false)}><FaTimes /></button>
                                </div>
                                <div className="popover-content">
                                    {addressLoading || loading ? (
                                        <span className="address-loading">{t('header.loadingAddress')}</span>
                                    ) : addressError ? (
                                        <span className="address-error">{t('header.addressError')}</span>
                                    ) : address ? (
                                        <span className="address-text">{formatAddress(address)}</span>
                                    ) : (
                                        <span className="address-error">{t('header.noLocation')}</span>
                                    )}
                                </div>
                                <div className={popoverActionsClass}>
                                    <button className="refresh-popover-btn" onClick={handleRefreshLocation} disabled={loading || addressLoading} title={t('header.refreshLocation')}>
                                        <FaSyncAlt className={loading ? 'spin' : ''} />
                                        {t('header.refreshLocation')}
                                    </button>
                                </div>
                                </div>
                            )}
                        </span>
                    </div>
                </div>

                <div className={navLeftClass}>
                    <div className={langSwitchClass}>
                        <button
                            className={`lang-toggle-pill ${direction}`}
                            onClick={handleLanguageToggle}
                            aria-label={t('header.selectLanguage')}
                            type="button"
                        >
                            {/* <FaGlobe className="lang-globe" aria-hidden="true" /> */}
                            <span className={`pill-option ${language === 'he' ? 'active' : ''}`}>{t('header.languages.he')}</span>
                            <span className="pill-sep">|</span>
                            <span className={`pill-option ${language === 'en' ? 'active' : ''}`}>{t('header.languages.en')}</span>
                        </button>
                    </div>


                    {isAuthLoading ? (
                        <div className="auth-buttons">
                            <span></span>
                        </div>
                    ) : (
                        username ? (
                            <div className={userMenuClass} ref={userMenuRef}>
                                <button 
                                    className="nav-button with-hover" 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    ref={userButtonRef}
                                    aria-expanded={showUserMenu}
                                    aria-haspopup="true"
                                >
                                    <FaUserCircle />
                                    <span>{greeting} <span className="username">{username}</span></span>
                                </button>
                                {showUserMenu && (
                                    <div 
                                        className={dropdownMenuClass}
                                        role="menu"
                                        aria-labelledby="user-menu-button"
                                    >
                                        <button 
                                            className={dropdownItemClass} 
                                            onClick={() => handleMenuItemClick("/user-profile")}
                                            role="menuitem"
                                        >
                                            <FaIdCard />
                                            הפרופיל שלי
                                        </button>
                                        <button 
                                            className={dropdownItemClass} 
                                            onClick={() => handleMenuItemClick("/user-businesses")}
                                            role="menuitem"
                                        >
                                            <FaStore />
                                            {t('header.myBusinesses')}
                                        </button>
                                        <button 
                                            className={dropdownItemClass} 
                                            onClick={() => handleMenuItemClick("/user-favorites")}
                                            role="menuitem"
                                        >
                                            <FaHeart />
                                            {t('header.myFavorites')}
                                        </button>
                                        {isAdmin && (
                                            <button 
                                                className={dropdownItemClass} 
                                                onClick={() => handleMenuItemClick("/admin")}
                                                role="menuitem"
                                            >
                                                <FaCog />
                                                {t('header.adminPanel')}
                                            </button>
                                        )}
                                        <button 
                                            className={dropdownItemClass} 
                                            onClick={handleLogout}
                                            role="menuitem"
                                        >
                                            <FaSignOutAlt />
                                            {t('header.logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={authButtonsClass}>
                                <button className="auth-button" onClick={() => navigate("/auth")}>
                                    <FaSignInAlt />
                                    {t('header.register')} / {t('header.login')}
                                </button>
                            </div>
                        )
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Header;
