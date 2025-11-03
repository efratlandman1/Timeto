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
    FaTimes,
    FaBars
} from "react-icons/fa";
import "../styles/Header.css";
import { useSelector, useDispatch } from 'react-redux';
import { getToken } from "../utils/auth";
import { useTranslation } from 'react-i18next';
import { logout } from '../redux/userSlice';
import { fetchUserLocation } from '../redux/locationSlice';
import { setLanguage, setDirection } from '../redux/uiSlice';
import { changeLanguage, getCurrentDirection } from '../i18n';
import { useResponsive } from '../utils/ResponsiveProvider';

const Header = () => {
    const { isMobile, isTablet } = useResponsive();
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
    const locationButtonRef = useRef(null);
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
    const [createMenuStyle, setCreateMenuStyle] = useState({});
    const [userMenuStyle, setUserMenuStyle] = useState({});
    const [popoverStyle, setPopoverStyle] = useState({});
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const mobileMenuRef = useRef(null);
    const mobileMenuBtnRef = useRef(null);
    const [mobileCreateOpen, setMobileCreateOpen] = useState(false);
    
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

            // Close mobile menu on outside click
            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target) &&
                mobileMenuBtnRef.current &&
                !mobileMenuBtnRef.current.contains(event.target)
            ) {
                setShowMobileMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setShowUserMenu(false);
                setShowLangMenu(false);
                setShowCreateMenu(false);
                setShowMobileMenu(false);
                setMobileCreateOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Body scroll lock when mobile menu open
    useEffect(() => {
        if (showMobileMenu) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
        return () => document.body.classList.remove('no-scroll');
    }, [showMobileMenu]);

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

    const updateCreateMenuPosition = () => {
        if (!createButtonRef.current) return;
        const rect = createButtonRef.current.getBoundingClientRect();
        const style = { position: 'fixed', top: rect.bottom + 4, minWidth: 200, zIndex: 1000 };
        if (isRTL) {
            style.right = window.innerWidth - rect.right;
        } else {
            style.left = rect.left;
        }
        setCreateMenuStyle(style);
    };

    const updatePopoverPosition = () => {
        if (!locationButtonRef.current) return;
        const rect = locationButtonRef.current.getBoundingClientRect();
        const style = { position: 'fixed', top: rect.bottom + 8, minWidth: 320, zIndex: 3000 };
        if (isRTL) {
            style.right = window.innerWidth - rect.right;
        } else {
            style.left = rect.left;
        }
        setPopoverStyle(style);
    };

    const handleToggleCreateMenu = () => {
        const next = !showCreateMenu;
        setShowCreateMenu(next);
        if (next) updateCreateMenuPosition();
    };

    const handleToggleMobileMenu = () => {
        setShowMobileMenu(prev => !prev);
    };

    const handleToggleLocationPopover = () => {
        // Refresh location each time the popover opens
        if (!showPopover) {
            dispatch(fetchUserLocation());
        }
        const next = !showPopover;
        setShowPopover(next);
        if (next) {
            requestAnimationFrame(() => updatePopoverPosition());
        }
    };

    const handleToggleMobileCreate = () => {
        setMobileCreateOpen(prev => !prev);
    };

    // Ensure user menu stays inside viewport
    useEffect(() => {
        if (!showUserMenu) return;
        if (!userButtonRef.current) return;
        const rect = userButtonRef.current.getBoundingClientRect();
        const padding = 8;
        const minWidth = 140;
        const maxMenuWidth = 220;
        const viewport = { w: window.innerWidth, h: window.innerHeight };
        const style = {
            position: 'fixed',
            top: Math.max(padding, rect.bottom + 4),
            minWidth,
            maxWidth: Math.min(maxMenuWidth, viewport.w - padding * 2),
            zIndex: 1000,
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto'
        };
        const distanceFromLeft = rect.left;
        const distanceFromRight = viewport.w - rect.right;
        if (direction === 'rtl') {
            // Clamp so left edge stays inside viewport
            const maxRight = Math.max(padding, viewport.w - minWidth - padding);
            const proposedRight = Math.max(padding, distanceFromRight);
            style.right = Math.min(proposedRight, maxRight);
        } else {
            const maxLeft = Math.max(padding, viewport.w - minWidth - padding);
            const proposedLeft = Math.max(padding, distanceFromLeft);
            style.left = Math.min(proposedLeft, maxLeft);
        }
        setUserMenuStyle(style);

        const onResize = () => {
            const r = userButtonRef.current?.getBoundingClientRect();
            if (!r) return;
            const vw = window.innerWidth;
            if (direction === 'rtl') {
                const maxRight = Math.max(padding, vw - minWidth - padding);
                const proposedRight = Math.max(padding, vw - r.right);
                setUserMenuStyle(s => ({ ...s, right: Math.min(proposedRight, maxRight), maxWidth: Math.min(maxMenuWidth, vw - padding * 2) }));
            } else {
                const maxLeft = Math.max(padding, vw - minWidth - padding);
                const proposedLeft = Math.max(padding, r.left);
                setUserMenuStyle(s => ({ ...s, left: Math.min(proposedLeft, maxLeft), maxWidth: Math.min(maxMenuWidth, vw - padding * 2) }));
            }
        };
        window.addEventListener('resize', onResize, { passive: true });
        return () => window.removeEventListener('resize', onResize);
    }, [showUserMenu, direction]);

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
            // 1) Try Google Geocoding API (avoids CORS issues)
            const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
            let resolved = '';
            if (apiKey) {
                const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=${i18n.language || 'he'}&key=${apiKey}`;
                const gRes = await fetch(gUrl);
                if (gRes.ok) {
                    const gData = await gRes.json();
                    if (Array.isArray(gData.results) && gData.results.length) {
                        resolved = gData.results[0].formatted_address || '';
                    }
                }
            }
            // No browser fallback to Nominatim to avoid CORS/403

            if (resolved) setAddress(resolved); else setAddressError(t('header.addressNotFound'));
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
        <>
        <div className={headerClass}>
            <nav className={navClass}>
                <div className={navRightClass}>
                    <div className="logo" onClick={() => navigate("/")}> 
                        <FaMapMarkerAlt className="logo-icon" />
                        <div className={logoTextClass}>
                            <span className="logo-text-main">{t('header.logo.main')}</span>
                        </div>
                    </div>
                    {(isMobile || isTablet) && (
                        <button
                            onClick={handleToggleLocationPopover}
                            className="nav-button"
                            title={t('header.myLocation')}
                            type="button"
                            ref={locationButtonRef}
                            aria-expanded={showPopover}
                            aria-haspopup="true"
                        >
                            <FaMapMarkerAlt />
                        </button>
                    )}
                </div>

                <div className={navCenterClass}>
                    <div className={navLinksClass}>
                        <button 
                            className={`nav-button ${isActive("/") ? "active" : ""}`} 
                            onClick={() => navigate("/")}
                        >
                            <FaHome />
                            {!isMobile && t('header.home')}
                        </button>
                        <button 
                            className={`nav-button ${isActive("/search-results") ? "active" : ""}`} 
                            onClick={() => navigate("/search-results")}
                        >
                            <FaSearch />
                            {!isMobile && t('header.search')}
                        </button>
                        {/* Removed sale/promo nav to simplify header */}
                        <button 
                                className={`nav-button`}
                                onClick={handleToggleCreateMenu}
                                ref={createButtonRef}
                                aria-expanded={showCreateMenu}
                                aria-haspopup="true"
                                title={t('userBusinesses.create')}
                            >
                                <FaPlus />
                                {!isMobile && t('userBusinesses.create')}
                            </button>
                            {showCreateMenu && (
                                <div 
                                    className={`${dropdownMenuClass} ${direction}`}
                                    role="menu"
                                    aria-label="Create dropdown"
                                    ref={createMenuRef}
                                    style={createMenuStyle}
                                >
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); navigate('/business', { state: { reset: Date.now() } }); setShowUserMenu(false); }}
                                        role="menuitem"
                                    >
                                        <FaStore />
                                        {t('userBusinesses.createOptions.addBusiness')}
                                    </button>
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); handleMenuItemClick("/ads/sale/new"); }}
                                        role="menuitem"
                                    >
                                        <FaTags />
                                        {t('userBusinesses.createOptions.saleAd')}
                                    </button>
                                    <button 
                                        className={dropdownItemClass} 
                                        onClick={() => { setShowCreateMenu(false); handleMenuItemClick("/ads/promo/new"); }}
                                        role="menuitem"
                                    >
                                        <FaBullhorn />
                                        {t('userBusinesses.createOptions.promoAd')}
                                    </button>
                                </div>
                            )}
                        <button 
                            className={`nav-button ${isActive("/suggest-item") ? "active" : ""}`} 
                            onClick={() => navigate("/suggest-item", { state: { background: location } })}
                        >
                            <FaLightbulb />
                            {t('header.suggest')}
                        </button>
                        {!(isMobile || isTablet) && (
                          <button
                              onClick={handleToggleLocationPopover}
                              className="nav-button"
                              title={t('header.myLocation')}
                              type="button"
                              ref={locationButtonRef}
                          >
                              <FaMapMarkerAlt />
                              <span className="loc-label">{t('header.locationShort')}</span>
                          </button>
                        )}
                        {/* Popover moved outside center on mobile */}
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
                                    {!isMobile && <span>{greeting} <span className="username">{username}</span></span>}
                                </button>
                                {showUserMenu && (
                                    <div 
                                        className={dropdownMenuClass}
                                        role="menu"
                                        aria-labelledby="user-menu-button"
                                        style={userMenuStyle}
                                    >
                                        <button 
                                            className={dropdownItemClass} 
                                            onClick={() => handleMenuItemClick("/user-profile")}
                                            role="menuitem"
                                        >
                                            <FaIdCard />
                                            {t('profile')}
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
                                <button className="auth-button" onClick={() => navigate("/auth", { state: { background: location } })}>
                                    <FaSignInAlt />
                                    {!isMobile && (<>{t('header.register')} / {t('header.login')}</>)}
                                </button>
                            </div>
                        )
                    )}
                </div>
            </nav>
        </div>
        {showPopover && (
            <div ref={popoverRef} className={locationPopoverClass} style={popoverStyle}>
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
        {(isMobile || isTablet) && showMobileMenu && (
            <div 
                className={`mobile-menu ${direction}`} 
                role="menu" 
                aria-label="Mobile Menu"
                ref={mobileMenuRef}
            >
                <button 
                    className="mobile-menu-item"
                    onClick={() => { setShowMobileMenu(false); navigate("/"); }}
                >
                    <FaHome />
                    <span>{t('header.home')}</span>
                </button>
                <button 
                    className="mobile-menu-item"
                    onClick={() => { setShowMobileMenu(false); navigate("/search-results"); }}
                >
                    <FaSearch />
                    <span>{t('header.search')}</span>
                </button>
                <div className="mobile-menu-section">
                    <button className="mobile-menu-item" onClick={handleToggleMobileCreate} aria-expanded={mobileCreateOpen} aria-controls="mobile-create-submenu">
                        <FaPlus />
                        <span>{t('userBusinesses.create')}</span>
                    </button>
                    {mobileCreateOpen && (
                        <div id="mobile-create-submenu" role="group" aria-label={t('userBusinesses.create')}>
                            <button 
                                className="mobile-menu-item"
                                onClick={() => { setShowMobileMenu(false); setMobileCreateOpen(false); navigate('/business', { state: { reset: Date.now() } }); }}
                            >
                                <FaStore />
                                <span>{t('userBusinesses.createOptions.addBusiness')}</span>
                            </button>
                            <button 
                                className="mobile-menu-item"
                                onClick={() => { setShowMobileMenu(false); setMobileCreateOpen(false); navigate("/ads/sale/new"); }}
                            >
                                <FaTags />
                                <span>{t('userBusinesses.createOptions.saleAd')}</span>
                            </button>
                            <button 
                                className="mobile-menu-item"
                                onClick={() => { setShowMobileMenu(false); setMobileCreateOpen(false); navigate("/ads/promo/new"); }}
                            >
                                <FaBullhorn />
                                <span>{t('userBusinesses.createOptions.promoAd')}</span>
                            </button>
                        </div>
                    )}
                </div>
                <button 
                    className="mobile-menu-item"
                    onClick={() => { setShowMobileMenu(false); navigate("/suggest-item", { state: { background: location } }); }}
                >
                    <FaLightbulb />
                    <span>{t('header.suggest')}</span>
                </button>
            </div>
        )}
        </>
    );
};

export default Header;
