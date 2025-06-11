import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import '../styles/AuthPage.css'; // Reuse the same styles
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons

const SetPasswordPage = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for visibility
    const [message, setMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false); // Spinner state
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch(); // Redux dispatch
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    useEffect(() => {
        if (error) {
            const errorMessage = error === 'invalid_token'
                ? 'הקישור לאימות אינו תקין או שפג תוקפו. אנא נסו להירשם מחדש.'
                : 'אירעה שגיאת שרת. אנא נסה שוב מאוחר יותר.';
            setMessage({ text: errorMessage, type: 'error' });
        } else if (!token) {
            setMessage({ text: 'לא נמצא אסימון אימות. נסה להשתמש בקישור מהמייל שוב.', type: 'error' });
        }
    }, [error, token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ text: 'הסיסמאות אינן תואמות.', type: 'error' });
            return;
        }
        if (password.length < 6) {
            setMessage({ text: 'הסיסמה חייבת להכיל לפחות 6 תווים.', type: 'error' });
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/set-password`, {
                token: token,
                newPassword: password
            });

            dispatch(setUser(res.data.user)); // Dispatch user data to Redux
            setMessage({ text: res.data.message, type: 'success' });

            // Redirect to home page after a short delay
            setTimeout(() => {
                navigate('/');
            }, 0);

        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.', type: 'error' });
            } else {
                setMessage({ text: error.response?.data?.message || 'הגדרת הסיסמה נכשלה. ייתכן שהאסימון פג תוקף.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-page-overlay">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="auth-modal" style={{ opacity: isLoading ? 0.7 : 1 }}>
                <Link to="/auth" className="close-button">×</Link>
                
                {error || !token ? (
                     <div className="success-view">
                        <h2>שגיאה באימות</h2>
                        {message.text && <p className="auth-message error-message">{message.text}</p>}
                        <Link to="/auth" className="submit-button" style={{textDecoration: 'none', marginTop: '1rem'}}>חזרה להתחברות</Link>
                    </div>
                ) : message.type === 'success' ? (
                     <div className="success-view">
                        <h2>הסיסמה נקבעה!</h2>
                        <p>{message.text}</p>
                        <p>מיד תועבר לדף הבית...</p>
                    </div>
                ) : (
                    <>
                        <h2>קביעת סיסמה</h2>
                        <p>אנא הגדר סיסמה חדשה לחשבונך.</p>
                        <form onSubmit={handleSubmit} className="email-form">
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="סיסמה חדשה"
                                    required
                                    className="form-input"
                                />
                                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div className="password-input-wrapper">
                                <input
                                     type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="אימות סיסמה"
                                    required
                                    className="form-input"
                                />
                                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <button type="submit" className="submit-button" disabled={isLoading}>קבע סיסמה והתחבר</button>
                        </form>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default SetPasswordPage; 