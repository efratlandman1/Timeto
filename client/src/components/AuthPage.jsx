import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import '../styles/AuthPage.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [searchParams] = useSearchParams();
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

    useEffect(() => {
        const verificationStatus = searchParams.get('verification_status');
        if (verificationStatus) {
                    if (verificationStatus === 'success') {
            setMessage({ text: t('auth.verification.success'), type: 'success' });
        } else { // 'failure'
            setMessage({ text: t('auth.verification.failure'), type: 'error' });
        }
            navigate('/auth', { replace: true });
        }
    }, [searchParams, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (password.length < 8) {
            setMessage({ text: t('userProfile.messages.passwordLength'), type: 'error' });
            return;
        }
        
        setIsLoading(true);

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/auth`, { email, password });

            if (res.data.data.action === 'login') {
                document.cookie = `token=${res.data.data.token}; path=/`;
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                dispatch(setUser(res.data.data.user));
                navigate('/');
            } else if (res.data.data.status === 'verification-resent' || res.data.data.status === 'user-created') {
                setMessage({ text: res.data.data.message, type: 'success' });
            }
        } catch (error) {
            const errorMessage = error.response?.data?.error || t('common.generalError');
            setMessage({ text: errorMessage, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const responseGoogle = async (credentialResponse) => {
        if (credentialResponse.credential) {
            setIsLoading(true);
            try {
                const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/google`, { tokenId: credentialResponse.credential });
                dispatch(setUser(res.data.data.user));
                document.cookie = `token=${res.data.data.token}; path=/`;
                localStorage.setItem('user', JSON.stringify(res.data.data.user));
                navigate('/');
            } catch (error) {
                setMessage({
                    text: error.response?.data?.error || t('auth.forgotPassword.messages.googleLoginFailed'),
                    type: 'error'
                });
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleClose = () => {
        navigate('/');
    };

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <div className="auth-page-overlay">
                {isLoading && (
                    <div className="spinner-overlay">
                        <div className="spinner"></div>
                    </div>
                )}
                <div className="auth-modal" style={{ opacity: isLoading ? 0.7 : 1 }}>
                    <button onClick={handleClose} className="close-button">×</button>
                    <h2>{t('header.letsGo')}</h2>
                    <p>{t('mainPage.joinBanner.joinNowAndDiscover')}</p>
                    
                    <div className="auth-content">
                        <GoogleLogin
                            onSuccess={responseGoogle}
                            onError={() => {
                                setMessage({
                                    text: t('auth.login.errors.loginFailed'),
                                    type: 'error'
                                });
                            }}
                            useOneTap
                            shape="pill"
                            width="350px"
                        />
                        <div className="divider">{t('auth.login.simpleLoginWithEmail')}</div>
                        <form onSubmit={handleSubmit} className="email-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('auth.login.emailAddress')}
                                required
                                className="form-input"
                                autoFocus
                            />
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('auth.login.password')}
                                    required
                                    className="form-input"
                                />
                                <span onClick={() => setShowPassword(!showPassword)} className="password-toggle-icon">
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <button type="submit" className="confirm-button" disabled={isLoading}>{t('auth.login.continue')}</button>
                             <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password');}} className="forgot-password-link">
                             {t('auth.forgotPassword.createNewPassword')}
                        </a>
                            {message.text && (
                                <p className={`auth-message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
                                    {message.text}
                                </p>
                            )}
                        </form>
                        <button className="cancel-button" type="button" onClick={handleClose} style={{marginTop: '1rem'}}>
                            {t('common.cancel')}
                        </button>
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default AuthPage;