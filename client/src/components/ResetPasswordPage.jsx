import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/AuthPage.css'; // Use the new unified styles
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ text: 'הסיסמאות אינן תואמות.', type: 'error' });
            return;
        }
        if (password.length < 8) {
            setMessage({ text: 'הסיסמה חייבת להכיל לפחות 8 תווים.', type: 'error' });
            return;
        }
        if (!token) {
            setMessage({ text: 'token איפוס הסיסמה חסר או לא תקין.', type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/reset-password`, { token, newPassword: password });
            setMessage({ text: 'סיסמה חדשה? יש ✔ עכשיו אפשר להיכנס', type: 'success' });
            setTimeout(() => navigate('/auth'), 3000);
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.', type: 'error' });
            } else {
                setMessage({ text: error.response?.data?.message || 'נכשל באיפוס הסיסמה. ייתכן שהקישור פג תוקף.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="modal-content" style={{ opacity: isLoading ? 0.7 : 1 }}>
                <Link to="/auth" className="btn btn-ghost btn-circle btn-sm">×</Link>

                {message.type === 'success' ? (
                    <div className="success-view">
                        <h2>🔐 הסיסמה החדשה מוכנה! </h2>
                        {/* <p>{message.text}</p> */}
                        <p>מיד תועבר לדף ההתחברות...</p>
                    </div>
                ) : (
                    <>
                        <h2>איפוס סיסמה</h2>
                        <p>הגדירו סיסמה חדשה לחשבונכם</p>
                        <form className="email-form" onSubmit={handleSubmit}>
                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="סיסמה חדשה"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div className="password-input-wrapper">
                               <input
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="אימות סיסמה"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                 <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <div className="actions-container">
                                <button type="submit" className="btn btn-solid btn-primary" disabled={isLoading}>
                                    אפס סיסמה
                                </button>
                            </div>
                        </form>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage; 