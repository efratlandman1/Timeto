import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    FaChevronDown
} from "react-icons/fa";
import "../styles/Header.css";
import { useSelector } from 'react-redux';
import { getToken } from "../utils/auth";

const Header = () => {
    const navigate = useNavigate();
    const [showLangMenu, setShowLangMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const [greeting, setGreeting] = useState("");
    const [currentLang, setCurrentLang] = useState("he");
    const menuRef = useRef(null);
    const langMenuRef = useRef(null);
    const loginUser = useSelector(state => state.user.user);
    
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return "בוקר טוב";
        if (hour >= 12 && hour < 17) return "צהריים טובים";
        if (hour >= 17 && hour < 20) return "אחר הצהריים טובים";
        if (hour >= 20 && hour < 24) return "ערב טוב";
        return "לילה טוב";
    };

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        localStorage.removeItem('user');
        navigate("/login");
    };

    const handleLanguageChange = (lang) => {
        setCurrentLang(lang);
        setShowLangMenu(false);
        // Future language change logic here
    };

    useEffect(() => {
        const token = getToken();
        if (token && loginUser) {
            setUsername(loginUser.firstName);
            setGreeting(getGreeting());
        } else {
            setUsername(null);
        }

        // Update greeting every minute
        const intervalId = setInterval(() => {
            if (loginUser) setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, [loginUser]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
                setShowLangMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="header-container">
            <nav className="navbar">
                <div className="nav-right">
                    <div className="logo" onClick={() => navigate("/")}>
                        <FaMapMarkerAlt className="logo-icon" />
                        <span>זמן</span>
                    </div>
                </div>

                <div className="nav-center">
                    <div className="nav-links">
                        <button className="nav-button primary" onClick={() => navigate("/new-business")}>
                            <FaPlusCircle />
                            עסק חדש
                        </button>
                        <button className="nav-button" onClick={() => navigate("/my-favorites")}>
                            <FaHeart />
                            המועדפים שלי
                        </button>
                        <button className="nav-button" onClick={() => navigate("/my-businesses")}>
                            <FaStore />
                            העסקים שלי
                        </button>
                        <button className="nav-button" onClick={() => navigate("/suggest")}>
                            <FaLightbulb />
                            הצע קטגוריה
                        </button>
                    </div>
                </div>

                <div className="nav-left">
                    <div className="lang-menu" ref={langMenuRef}>
                        <button className="lang-button" onClick={() => setShowLangMenu(!showLangMenu)}>
                            <FaGlobe />
                        </button>
                        {showLangMenu && (
                            <div className="lang-dropdown">
                                <button 
                                    className={`lang-option ${currentLang === 'he' ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange('he')}
                                >
                                    עברית
                                </button>
                                <button 
                                    className={`lang-option ${currentLang === 'en' ? 'active' : ''}`}
                                    onClick={() => handleLanguageChange('en')}
                                >
                                    English
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="auth-section">
                        {username ? (
                            <div className="user-greeting">
                                <span className="greeting-text">{greeting}</span>
                                <span className="username-text">{username}</span>
                                <button className="auth-button" onClick={handleLogout}>
                                    <FaSignOutAlt />
                                    יציאה
                                </button>
                            </div>
                        ) : (
                            <div className="auth-buttons">
                                <button className="auth-button" onClick={() => navigate("/register")}>
                                    הרשמה
                                </button>
                                <button className="auth-button" onClick={() => navigate("/login")}>
                                    <FaSignInAlt />
                                    כניסה
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </div>
    );
};

export default Header;
