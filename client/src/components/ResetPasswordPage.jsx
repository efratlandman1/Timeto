import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/AuthPage.css';
import '../styles/SuggestItemPage.css';
import { FaTimes } from 'react-icons/fa';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPasswordPage = () => {
    const { t } = useTranslation();
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
            setMessage({ text: t('userProfile.messages.passwordMismatch'), type: 'error' });
            return;
        }
        if (password.length < 8) {
            setMessage({ text: t('auth.resetPassword.errors.passwordTooShort'), type: 'error' });
            return;
        }
        if (!token) {
            setMessage({ text: t('common.generalError'), type: 'error' });
            return;
        }

        setIsLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/reset-password`, { token, newPassword: password });
            setMessage({ text: t('auth.resetPassword.success'), type: 'success' });
            setTimeout(() => navigate('/auth', { state: { background: { pathname: '/' } } }), 3000);
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: t('auth.resetPassword.errors.tooManyAttempts'), type: 'error' });
            } else {
                setMessage({ text: error.response?.data?.message || t('common.generalError'), type: 'error' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="modal-overlay-fixed" onClick={() => navigate(-1)}>
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="modal-container suggest-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title" style={{ opacity: isLoading ? 0.7 : 1 }}>
                <div className="modal-header">
                    <button className="modal-close" aria-label={t('common.cancel')} onClick={() => navigate(-1)}><FaTimes /></button>
                    <h1 id="reset-modal-title" className="login-title suggest-modal-title">{t('auth.resetPassword.title')}</h1>
                </div>

                {message.type === 'success' ? (
                    <div className="success-view">
                        <h2 style={{textAlign:'center'}}>{t('auth.resetPassword.success')}</h2>
                        {/* <p>{message.text}</p> */}
                        <p style={{textAlign:'center'}}>{t('auth.resetPassword.redirecting')}</p>
                    </div>
                ) : (
                    <>
                        <p style={{textAlign:'center', marginInline: '1.25rem'}}>{t('auth.resetPassword.description')}</p>
                        <form className="email-form" onSubmit={handleSubmit} style={{marginInline: '1.25rem'}}>
                            <div className="password-input-wrapper">
                                <input
                                    className="form-input"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t('common.password')}
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
                                    placeholder={t('userProfile.fields.confirmPassword')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                 <span className="password-toggle-icon" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </span>
                            </div>
                            <button type="submit" className="confirm-button" disabled={isLoading}>
                                {t('auth.resetPassword.submit')}
                            </button>
                        </form>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage; 