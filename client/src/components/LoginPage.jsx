import axios from 'axios';
import React, { useState } from 'react';
import '../styles/LoginPage.css';
import { FaEnvelope, FaLock, FaClock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleGoogleLoginSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/google`, {
                tokenId: credentialResponse.credential
            });

            if (response.data.token && response.data.user) {
                dispatch(setUser({user: response.data.user}));
                document.cookie = `token=${response.data.token}`;
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/my-businesses');
            } else {
                setError('ההתחברות נכשלה. נסה שוב');
            }
        } catch (e) {
            setError('התחברות גוגל נכשלה');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLoginError = () => {
        setError('התחברות גוגל נכשלה');
    };

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
                navigate('/my-businesses');
            } else {
                setError('ההתחברות נכשלה. נסה שוב');
            }
        } catch (e) {
            if (e.response && e.response.status === 429) {
                setError(e.response.data);
            } else {
                setError('האימייל או הסיסמה שגויים');
            }
            console.error('Login error:', e.response ? e.response.data : e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="narrow-page-container">
            <div className="narrow-page-content">
                <form className="login-form" onSubmit={handleLogin}>
                    <FaClock className="login-logo" />
                    <h1 className="login-title">התחברות</h1>

                    {error && <div className="login-error">{error}</div>}

                    <div className="login-input-wrapper">
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
                        <FaEnvelope className="login-input-icon" />
                    </div>

                    <div className="login-input-wrapper">
                        <input
                            className="login-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="סיסמה"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <FaLock className="login-input-icon" />
                        <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <button className="login-button" type="submit" disabled={loading}>
                        {loading ? 'טוען...' : 'התחברות'}
                    </button>

                    <Link to="/forgot-password" className="login-forgot-password-link">שכחת סיסמה?</Link>

                    <div className="google-login-container" style={{paddingTop: '15px', display: 'flex', justifyContent: 'center'}}>
                        <GoogleLogin
                            onSuccess={handleGoogleLoginSuccess}
                            onError={handleGoogleLoginError}
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
