import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../styles/LoginPage.css'; // Reuse existing CSS
import { FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('הסיסמאות אינן תואמות.');
            return;
        }
        if (password.length < 8) {
            toast.error('הסיסמה חייבת להכיל לפחות 8 תווים.');
            return;
        }
        if (!token) {
            toast.error('אסימון איפוס הסיסמה חסר או לא תקין.');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/reset-password`, { token, newPassword: password });
            toast.success('הסיסמה אופסה בהצלחה! ניתן להתחבר מחדש.');
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'נכשל באיפוס הסיסמה. ייתכן שהקישור פג תוקף.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="narrow-page-container">
            <div className="narrow-page-content">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h1 className="login-title">איפוס סיסמה</h1>
                    <p style={{ color: '#666', marginBottom: '2rem', marginTop: '-1rem' }}>
                        הגדירו סיסמה חדשה לחשבונכם.
                    </p>

                    <div className="login-input-wrapper">
                        <FaLock className="login-input-icon" />
                        <input
                            className="login-input"
                            type={showPassword ? "text" : "password"}
                            placeholder="סיסמה חדשה"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <div className="login-input-wrapper">
                        <FaLock className="login-input-icon" />
                        <input
                            className="login-input"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="אימות סיסמה חדשה"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <span className="login-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </span>
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'מאפס...' : 'אפס סיסמה'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage; 