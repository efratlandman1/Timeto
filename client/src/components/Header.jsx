import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt, FaSignInAlt, FaUserPlus } from "react-icons/fa";
import "../styles/Header.css";
import { jwtDecode } from "jwt-decode";

const Header = () => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [username, setUsername] = useState(null);
    const menuRef = useRef(null);    
    
    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        setUsername(null);
        navigate("/login");
    };

    useEffect(() => {
        const token = document.cookie.split("; ").find(row => row.startsWith("token="))?.split("=")[1];
        if (token) {
            let parsedToken = jwtDecode(token);
            setUsername(parsedToken.userName);
        }

        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="header-container">
            <nav className="navbar">
                
                <div className="user-menu" ref={menuRef}>
                    <button className="user-button" onClick={() => setShowMenu(!showMenu)}>
                        {username ? ` ${username}` : "כניסה"}
                        <FaUserCircle className="user-icon" />
                    </button>
                    {showMenu && (
                        <div className="dropdown-menu">
                            {username ? (
                                <>
                                    <button onClick={() => navigate("/user-businesses")}>
                                        <FaUserCircle /> אזור אישי
                                    </button>
                                    <button onClick={handleLogout}>
                                        <FaSignOutAlt /> יציאה
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => navigate("/login")}>
                                        <FaSignInAlt /> כניסה
                                    </button>
                                    <button onClick={() => navigate("/register")}>
                                        <FaUserPlus /> הרשמה
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                <div className="logo">זה הזמן</div>
            </nav>
        </div>
    );
};

export default Header;
