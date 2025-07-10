import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
    FaUserCircle, 
    FaSignOutAlt, 
    FaSignInAlt, 
    FaGlobe, 
    FaPlusCircle,
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
import { useSelector,useDispatch  } from 'react-redux';
import { getToken } from "../utils/auth";
import { useTranslation } from 'react-i18next';
import { logout } from '../redux/userSlice';
import { fetchUserLocation } from '../redux/locationSlice';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const [greeting, setGreeting] = useState("");
    const userMenuRef = useRef(null);
    const userButtonRef = useRef(null);
    const loginUser = useSelector(state => state.user.user);
    const isAdmin = loginUser && loginUser.role === 'admin';
    const { t, i18n } = useTranslation();
    const dispatch = useDispatch();
    const { coords, loading, error } = useSelector(state => state.location);
    const [showPopover, setShowPopover] = useState(false);
    const [address, setAddress] = useState('');
    const [addressLoading, setAddressLoading] = useState(false);
    const [addressError, setAddressError] = useState('');
    const popoverRef = useRef(null);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return t('greetings.morning');
        if (hour >= 12 && hour < 17) return t('greetings.afternoon');
        if (hour >= 17 && hour < 20) return t('greetings.evening');
        return t('greetings.night');
    };

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
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowUserMenu(false);
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
        const token = getToken();
        if (token && loginUser) {
            setUsername(loginUser.firstName || loginUser.email);
            setGreeting(getGreeting());
        } else {
            setUsername(null);
        }

        const intervalId = setInterval(() => {
            if (loginUser) setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, [loginUser, t]);

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        localStorage.removeItem('user');
        dispatch(logout());
        setShowUserMenu(false);
        navigate("/");
    };

    const handleLanguageToggle = () => {
        const newLang = i18n.language === 'he' ? 'en' : 'he';
        i18n.changeLanguage(newLang);
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
                setAddressError('לא נמצאה כתובת');
            }
        } catch (e) {
            setAddressError('שגיאה בשליפת כתובת');
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

    return (
        <div className="header-container">
            <nav className="navbar">
                <div className="nav-right">
                    <div className="logo" onClick={() => navigate("/")}>
                        <FaMapMarkerAlt className="logo-icon" />
                        <div className="logo-text">
                            <span className="logo-text-main">{t('header.logo.main')}</span>
                            <span className="logo-text-sub">{t('header.logo.sub')}</span>
                        </div>
                    </div>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                            onClick={() => setShowPopover(!showPopover)}
                            className="refresh-location-btn styled-location-btn"
                            title="המיקום שלי"
                            type="button"
                        >
                            <FaMapMarkerAlt style={{ marginLeft: 6, fontSize: 18 }} />
                            המיקום שלי
                        </button>
                        {showPopover && (
                            <div ref={popoverRef} className="location-popover">
                                <div className="popover-header">
                                    <span>המיקום הנוכחי שלך</span>
                                    <button className="close-popover-btn" onClick={() => setShowPopover(false)}><FaTimes /></button>
                                </div>
                                <div className="popover-content">
                                    {addressLoading || loading ? (
                                        <span className="address-loading">טוען כתובת...</span>
                                    ) : addressError ? (
                                        <span className="address-error">{addressError}</span>
                                    ) : address ? (
                                        <span className="address-text">{formatAddress(address)}</span>
                                    ) : (
                                        <span className="address-error">לא נמצא מיקום</span>
                                    )}
                                </div>
                                <div className="popover-actions">
                                    <button className="refresh-popover-btn" onClick={handleRefreshLocation} disabled={loading || addressLoading} title="רענן מיקום">
                                        <FaSyncAlt className={loading ? 'spin' : ''} />
                                        רענן מיקום
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-center">
                    <div className="nav-links">
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
                        <button 
                            className={`nav-button ${isActive("/business") ? "active" : ""}`} 
                            onClick={() => navigate("/business")}
                        >
                            <FaPlusCircle />
                            {t('header.addBusiness')}
                        </button>
                        <button 
                            className={`nav-button ${isActive("/suggest-item") ? "active" : ""}`} 
                            onClick={() => navigate("/suggest-item")}
                        >
                            <FaLightbulb />
                            {t('header.suggest')}
                        </button>
                    </div>
                </div>

                <div className="nav-left">
                    <div className="lang-switch">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={i18n.language === 'en'}
                                onChange={handleLanguageToggle}
                            />
                            <span className="slider">
                                <span className="lang-label he">עב</span>
                                <span className="lang-label en">EN</span>
                            </span>
                        </label>
                    </div>

                    {username ? (
                        <div className="user-menu" ref={userMenuRef}>
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
                                    className="dropdown-menu"
                                    role="menu"
                                    aria-labelledby="user-menu-button"
                                >
                                    <button 
                                        className="dropdown-item" 
                                        onClick={() => handleMenuItemClick("/user-profile")}
                                        role="menuitem"
                                    >
                                        <FaIdCard />
                                        {"פרופיל אישי"}  
                                    </button>
                                    <button 
                                        className="dropdown-item" 
                                        onClick={() => handleMenuItemClick("/user-businesses")}
                                        role="menuitem"
                                    >
                                        <FaStore />
                                        {t('header.myBusinesses')}
                                    </button>
                                    <button 
                                        className="dropdown-item" 
                                        onClick={() => handleMenuItemClick("/user-favorites")}
                                        role="menuitem"
                                    >
                                        <FaHeart />
                                        {t('header.myFavorites')}
                                    </button>
                                    {isAdmin && (
                                        <button 
                                            className="dropdown-item" 
                                            onClick={() => handleMenuItemClick("/admin")}
                                            role="menuitem"
                                        >
                                            <FaCog />
                                            {t('header.adminPanel')}
                                        </button>
                                    )}
                                    <button 
                                        className="dropdown-item" 
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
                        <div className="auth-buttons">
                            <button className="auth-button" onClick={() => navigate("/auth")}>
                                <FaSignInAlt />
                                הרשמה / כניסה
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Header;
