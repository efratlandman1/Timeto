import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/registrationPage.css';
import { FaUser, FaLock, FaClock } from 'react-icons/fa';

const RegistrationPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/register', { username, password });
            document.cookie = `token=${response.data.token}`;
            navigate('/');
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleRegister}>
                {/* <img src={logo} alt="Logo" className="login-logo" /> */}
                <FaClock className="login-logo" />
                <h1 className="login-title">זה הזמן</h1>
                <div className="input-wrapper">
                    <FaUser className="input-icon" />
                    <input className="login-input" type="text" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="input-wrapper">
                    <FaLock className="input-icon" />
                    <input className="login-input" type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button className="login-button" type="submit">התחברות</button>
            </form>
        </div>
    );
};

export default RegistrationPage;
