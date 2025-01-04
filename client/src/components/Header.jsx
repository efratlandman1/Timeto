import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Header.css";

const Header = () => {
    const navigate = useNavigate();
    const [showButtons, setShowButtons] = useState(false);
    const [bubblePosition, setBubblePosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const token = document.cookie.split("; ").find((row) => row.startsWith("token="));

    const handleLogout = () => {
        document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        navigate("/login");
    };

    const onPersonalAreaClicked = () => {
        if (token) {
            navigate("/user-items");
            return;
        }
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            setBubblePosition({
                top: buttonRect.bottom, // No scroll offset because header is fixed
                left: buttonRect.left,
            });
            setShowButtons((prev) => !prev);
        }
    };

    function onLoginClicked() {
        setShowButtons(false);
        navigate("/login");
    }

    function onRegistrationClicked() {
        setShowButtons(false);
        navigate("/register");
    }

    return (
        <div className="header-container">
            {token && <button onClick={handleLogout}>התנתק</button>}
            <button
                className="personal-area-button"
                ref={buttonRef}
                onClick={onPersonalAreaClicked}
            >
                האיזור האישי
            </button>

            {showButtons && (
                <div
                    className="bubble"
                    style={{
                        position: "fixed", // Fixed relative to the viewport
                        top: `${bubblePosition.top}px`,
                        left: `${bubblePosition.left}px`,
                    }}
                >
                    <button onClick={onLoginClicked}>רוצה להתחבר</button>
                    <button onClick={onRegistrationClicked}>רוצה להירשם</button>
                </div>
            )}
        </div>
    );
};

export default Header;
