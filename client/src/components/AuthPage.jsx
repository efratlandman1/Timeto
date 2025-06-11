import React, { useState } from 'react';
import axios from 'axios';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setUser, logout } from '../redux/userSlice';
import '../styles/AuthPage.css'; // Import the new CSS file
import { Link } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authStep, setAuthStep] = useState('enter-email'); // 'enter-email', 'enter-password', 'verification-sent'
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false); // Spinner state
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Redux dispatch
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

    const handleEmailSubmit = async (e) => {
        if(e) e.preventDefault();
        setMessage({ text: '', type: '' });
        setIsLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/auth`, { email });
            if (res.data.status === 'verification-sent') {
                setAuthStep('verification-sent');
            } else if (res.data.status === 'verified') {
                setAuthStep('enter-password');
            }
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({
                    text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.',
                    type: 'error'
                });
            } else {
                setMessage({
                    text: error.response?.data?.error || 'משהו השתבש. נסה שוב.',
                    type: 'error'
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/login`, { email, password });

            dispatch(setUser(res.data.user));
            navigate('/');
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({
                    text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.',
                    type: 'error'
                });
            } else if (error.response?.data?.error) {
                setMessage({ text: error.response.data.error, type: 'error' });
            } else {
                setMessage({ text: 'ההתחברות נכשלה, אנא בדוק את הפרטים ונסה שוב.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const responseGoogle = async (credentialResponse) => {
        if (credentialResponse.credential) {
            setIsLoading(true);
            try {
                const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/google`, { tokenId: credentialResponse.credential });
                dispatch(setUser(res.data.user));
                navigate('/');
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    setMessage({
                        text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.',
                        type: 'error'
                    });
                } else {
                    setMessage({
                        text: error.response?.data?.error || 'התחברות גוגל נכשלה.',
                        type: 'error'
                    });
                }
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    const handleClose = () => {
        navigate('/');
    };

    const handleResend = async () => {
        if (!email) return;
        setIsLoading(true);
        try {

            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/resend-verification`, { email });
            setMessage({
                text: `מייל אימות חדש נשלח לכתובת ${email}.`,
                type: 'success' 
            });
        } catch (error) {
            setMessage({ text: 'שליחה מחדש נכשלה. אנא נסה שוב.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const renderStep = () => {
        switch (authStep) {
            case 'enter-password':
                return (
                    <form onSubmit={handlePasswordSubmit} className="email-form">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="סיסמה"
                            required
                            className="form-input"
                            autoFocus
                        />
                        <button type="submit" className="submit-button" disabled={isLoading}>התחבר</button>
                        <a href="/forgot-password" onClick={(e) => { e.preventDefault(); navigate('/forgot-password');}} className="forgot-password-link">
                            שכחתי סיסמה?
                        </a>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </form>
                );
            case 'verification-sent':
                return (
                    <div className="verification-sent-view">
                         <h3>מייל בדרך אליך!</h3>
                         <p className="verification-text">
                             שלחנו הרגע מייל אימות לכתובת <strong>{email}</strong>. לחץ על הקישור שבפנים ומיד תוכל להתחיל. לפעמים המייל מתחבא בתיבת הספאם, כדאי להציץ גם שם.
                         </p>
                         <button onClick={() => handleEmailSubmit()} className="resend-email-button">
                            לא קיבלתי, אפשר לשלוח שוב?
                         </button>
                         <p>
                            לא קיבלתם את המייל? בדקו את תיבת הספאם או <span onClick={handleResend} className="resend-link">לחצו כאן לשליחה חוזרת</span>.
                         </p>
                         {message.text && (
                            <p className={`auth-message ${message.type === 'success' ? 'success-message' : 'error-message'}`}>
                                {message.text}
                            </p>
                        )}
                    </div>
                );
            case 'enter-email':
            default:
                return (
                    <>
                        <GoogleLogin
                            onSuccess={responseGoogle}
                            onError={() => {
                                setMessage({
                                    text: 'התחברות גוגל נכשלה.',
                                    type: 'error'
                                });
                            }}
                            useOneTap
                            shape="pill"
                            width="350px"
                        />
                        <div className="divider">כניסה / הרשמה עם כתובת מייל</div>
                        <form onSubmit={handleEmailSubmit} className="email-form">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="כתובת מייל"
                                required
                                className="form-input"
                            />
                            <button type="submit" className="submit-button" disabled={isLoading}>המשך</button>
                            {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                        </form>
                    </>
                );
        }
    }

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
                    {authStep !== 'verification-sent' && (
                        <>
                            <h2>בואו ניכנס</h2>
                            <p>זה הרגע להתחבר או להירשם</p>
                        </>
                    )}
                    
                    <div className="auth-content">
                        {renderStep()}
                    </div>
                </div>
            </div>
        </GoogleOAuthProvider>
    );
};

export default AuthPage; 