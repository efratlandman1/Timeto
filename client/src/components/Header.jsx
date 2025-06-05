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
    FaHome
} from "react-icons/fa";
import "../styles/Header.css";
import { useSelector } from 'react-redux';
import { getToken } from "../utils/auth";
import { useTranslation } from 'react-i18next';

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const [greeting, setGreeting] = useState("");
    const userMenuRef = useRef(null);
    const userButtonRef = useRef(null);
    const loginUser = useSelector(state => state.user.user);
    const { t, i18n } = useTranslation();

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
            setUsername(loginUser.firstName);
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
        setShowUserMenu(false);
        navigate("/login");
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
                            className={`nav-button ${isActive("/edit") ? "active" : ""}`} 
                            onClick={() => navigate("/edit")}
                        >
                            <FaPlusCircle />
                            {t('header.addBusiness')}
                        </button>
                        <button 
                            className={`nav-button ${isActive("/suggest") ? "active" : ""}`} 
                            onClick={() => navigate("/suggest")}
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
                                {/* <FaChevronDown style={{ fontSize: '12px', marginRight: '4px' }} /> */}
                            </button>
                            {showUserMenu && (
                                <div 
                                    className="dropdown-menu"
                                    role="menu"
                                    aria-labelledby="user-menu-button"
                                >
                                    <button 
                                        className="dropdown-item" 
                                        onClick={() => handleMenuItemClick("/my-businesses")}
                                        role="menuitem"
                                    >
                                        <FaStore />
                                        {t('header.myBusinesses')}
                                    </button>
                                    <button 
                                        className="dropdown-item" 
                                        onClick={() => handleMenuItemClick("/my-favorites")}
                                        role="menuitem"
                                    >
                                        <FaHeart />
                                        {t('header.myFavorites')}
                                    </button>
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
                            <button className="auth-button" onClick={() => navigate("/register")}>
                                <FaUserCircle />
                                {t('header.register')}
                            </button>
                            <button className="auth-button" onClick={() => navigate("/login")}>
                                <FaSignInAlt />
                                {t('header.login')}
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </div>
    );
};

export default Header;
