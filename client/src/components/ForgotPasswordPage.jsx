import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';
import '../styles/AuthPage.css';
import '../styles/SuggestItemPage.css';

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
        <div className={`modal-overlay-fixed`} onClick={() => window.history.back()}>
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="modal-container suggest-modal" role="dialog" aria-modal="true" aria-labelledby="forgot-modal-title" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <button className="modal-close" aria-label={t('common.cancel')} onClick={() => window.history.back()}><FaTimes /></button>
                    <h1 id="forgot-modal-title" className="login-title suggest-modal-title">{t('auth.forgotPassword.title')}</h1>
                </div>

                {message.type === 'success' ? (
                    <div className="success-view" style={{padding: '0 1.25rem 1rem'}}>
                        <h2 style={{textAlign: 'center'}}>{t('auth.forgotPassword.requestSent')}</h2>
                        <p style={{textAlign: 'center'}}>{message.text}</p>
                        <Link to="/auth" className="confirm-button" style={{textDecoration: 'none', marginTop: '1rem'}}>{t('auth.forgotPassword.backToLogin')}</Link>
                    </div>
                ) : (
                    <>
                        <p style={{textAlign: 'center', marginInline: '1.25rem'}}>{t('auth.forgotPassword.subtitle')}</p>
                        <form className="email-form" onSubmit={handleSubmit} style={{marginInline: '1.25rem'}}>
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
                        {message.type === 'error' && <p className="auth-message error-message" style={{textAlign:'center', marginInline: '1.25rem'}}>{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 