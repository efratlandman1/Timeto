import axios from 'axios';
import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { FaEnvelope, FaLock, FaClock, FaEye, FaEyeSlash } from 'react-icons/fa';  // נוספנו את FaEnvelope בשביל האימייל
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const [email, setEmail] = useState('');  // שדה האימייל
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
    
        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/login', {
                email,
                password
            });
    
            if (response.data.token && response.data.user) {
                dispatch(setUser({user: response.data.user}));
                document.cookie = `token=${response.data.token}`;
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/user-businesses');
            } else {
                setError('ההתחברות נכשלה. נסה שוב');
            }
        } catch (e) {
            setError('האימייל או הסיסמה שגויים');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <FaClock className="login-logo" />
                <h1 className="login-title">זה הזמן</h1>

                {error && <div className="login-error">{error}</div>}

                {/* שדה אימייל במקום שם משתמש */}
                <div className="login-input-wrapper">
                    <FaEnvelope className="login-input-icon" />  {/* השתמשנו באייקון של אימייל */}
                    <input
                        className="login-input"
                        type="email"
                        placeholder="אימייל"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        onInvalid={(e) => e.target.setCustomValidity('אנא הזן כתובת אימייל חוקית')}
                        onInput={(e) => e.target.setCustomValidity('')}
                    />
                </div>

                {/* סיסמה עם עין */}
                <div className="login-input-wrapper">
                    <FaLock className="login-input-icon" />
                    <input
                        className="login-input"
                        type={showPassword ? "text" : "password"}
                        placeholder="סיסמה"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </span>
                </div>

                <button className="login-button" type="submit" disabled={loading}>
                    {loading ? 'טוען...' : 'התחברות'}
                </button>
            </form>
        </div>
    );
};

export default LoginPage;
