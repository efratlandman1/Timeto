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

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const [greeting, setGreeting] = useState("");
    const [currentLang, setCurrentLang] = useState("he");
    const menuRef = useRef(null);
    const langMenuRef = useRef(null);
    const userMenuRef = useRef(null);
    const loginUser = useSelector(state => state.user.user);
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "בוקר טוב";
        if (hour >= 12 && hour < 17) return "צהריים טובים";
        if (hour >= 17 && hour < 20) return "אחר הצהריים טובים";
        if (hour >= 20 && hour < 24) return "ערב טוב";
        return "לילה טוב";
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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
    }, [loginUser]);

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        localStorage.removeItem('user');
        navigate("/login");
    };

    const handleLanguageChange = (lang) => {
        setCurrentLang(lang);
        setShowLangMenu(false);
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
                            <span className="logo-text-main">זמן</span>
                            <span className="logo-text-sub">מדריך העסקים</span>
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
                            בית
                        </button>
                        <button 
                            className={`nav-button ${isActive("/search-results") ? "active" : ""}`} 
                            onClick={() => navigate("/search-results")}
                        >
                            <FaSearch />
                            חיפוש
                        </button>
                        <button 
                            className={`nav-button ${isActive("/edit") ? "active" : ""}`} 
                            onClick={() => navigate("/edit")}
                        >
                            <FaPlusCircle />
                            הוסף עסק
                        </button>
                        <button 
                            className={`nav-button ${isActive("/suggest") ? "active" : ""}`} 
                            onClick={() => navigate("/suggest")}
                        >
                            <FaLightbulb />
                            הצע פריט
                        </button>
                    </div>
                </div>

                <div className="nav-left">
                    {username ? (
                        <div className="user-menu" ref={userMenuRef}>
                            <div 
                                className="nav-button with-hover" 
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <FaUserCircle />
                                <span>{greeting} <span className="username">{username}</span></span>
                                <FaChevronDown style={{ fontSize: '12px', marginRight: '4px' }} />
                            </div>
                            {showUserMenu && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => navigate("/user-businesses")}>
                                        <FaStore />
                                        העסקים שלי
                                    </div>
                                    <div className="dropdown-item" onClick={() => navigate("/my-favorites")}>
                                        <FaHeart />
                                        המועדפים שלי
                                    </div>
                                    <div className="dropdown-item" onClick={handleLogout}>
                                        <FaSignOutAlt />
                                        יציאה
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="auth-buttons">
                            <button className="auth-button" onClick={() => navigate("/register")}>
                            <FaUserCircle />
                                הרשמה
                                
                            </button>
                            <button className="auth-button" onClick={() => navigate("/login")}>
                            <FaSignInAlt />
                                כניסה
                                
                            </button>
                        </div>
                    )}

                    <div className="lang-menu" ref={langMenuRef}>
                        <button className="nav-button with-hover" onClick={() => setShowLangMenu(!showLangMenu)}>
                            <FaGlobe />
                        </button>
                        {showLangMenu && (
                            <div className="dropdown-menu lang-dropdown">
                                <div 
                                    className={`dropdown-item ${currentLang === 'he' ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange('he')}
                                >
                                    עברית
                                </div>
                                <div 
                                    className={`dropdown-item ${currentLang === 'en' ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange('en')}
                                >
                                    English
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Header;
