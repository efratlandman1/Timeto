import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import '../styles/AuthPage.css'; // Use the new unified styles

const ForgotPasswordPage = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/request-password-reset`, { email });
            setMessage({
                text: t('auth.forgotPassword.messages.resetLinkSent'),
                type: 'success'
            });
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: t('common.tooManyAttempts'), type: 'error' });
            } else {
                setMessage({ text: t('common.generalError'), type: 'error' });
            }
        } finally {
            setIsLoading(false);
            setEmail('');
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
                <button onClick={() => window.location.href = '/auth'} className="close-button">×</button>

                {message.type === 'success' ? (
                    <div className="success-view">
                        <h2>{t('auth.forgotPassword.requestSent')}</h2>
                        <p>{message.text}</p>
                        <Link to="/auth" className="confirm-button" style={{textDecoration: 'none', marginTop: '1rem'}}>{t('auth.forgotPassword.backToLogin')}</Link>
                    </div>
                ) : (
                    <>
                        <h2>{t('auth.forgotPassword.title')}</h2>
                        <p>{t('auth.forgotPassword.subtitle')}</p>
                        <form className="email-form" onSubmit={handleSubmit}>
                            <div className="input-wrapper">
                                <input
                                    className="form-input"
                                    type="email"
                                    placeholder={t('auth.forgotPassword.email')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="confirm-button" disabled={isLoading}>
                                {t('auth.forgotPassword.submit')}
                            </button>
                        </form>
                        <button className="cancel-button" type="button" onClick={() => window.location.href = '/auth'} style={{marginTop: '1rem'}}>
                            {t('common.cancel')}
                        </button>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 