import axios from 'axios';
import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { FaUser, FaLock, FaClock } from 'react-icons/fa';

// import logo from '../assets/logo.png'; // ודא שיש לוגו בתיקייה המתאימה

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/login', {
                username,
                password
            });
            if (response.data.token) {
                document.cookie = `token=${response.data.token}`;
                window.location.href = '/user-businesses';
            }
        } catch (e) {
            // handle error if needed
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                {/* <img src={logo} alt="Logo" className="login-logo" /> */}
                <FaClock className="login-logo" />
                <h1 className="login-title">זה הזמן</h1>
                <div className="login-input-wrapper">
                    <FaUser className="login-input-icon" />
                    <input className="login-input" type="text" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="login-input-wrapper">
                    <FaLock className="login-input-icon" />
                    <input className="login-input" type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button className="login-button" type="submit">התחברות</button>
            </form>
        </div>
    );
};

export default LoginPage;
