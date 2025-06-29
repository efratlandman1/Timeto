import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/AuthPage.css'; // Use the new unified styles

const ForgotPasswordPage = () => {
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
                text: 'אם יש חשבון עם הכתובת שהוזנה – שלחנו אליו קישור לאיפוס. שווה לבדוק גם בספאם 😉',
                type: 'success'
            });
        } catch (error) {
            if (error.response && error.response.status === 429) {
                setMessage({ text: 'ניסית יותר מדי פעמים. אנא נסה שוב מאוחר יותר.', type: 'error' });
            } else {
                setMessage({ text: 'אירעה שגיאה. אנא נסה שוב.', type: 'error' });
            }
        } finally {
            setIsLoading(false);
            setEmail('');
        }
    };

    return (
        <div className="modal-overlay">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="modal-content" /*style={{ opacity: isLoading ? 0.7 : 1 }}*/>
                <Link to="/auth" className="btn btn-ghost btn-circle btn-sm">×</Link>

                {message.type === 'success' ? (
                    <div className="success-view">
                        <h2>בקשה נשלחה!</h2>
                        <p>{message.text}</p>
                        <Link to="/auth" className="btn btn-solid btn-primary" /*style={{textDecoration: 'none', marginTop: '1rem'}}*/>חזרה להתחברות</Link>
                    </div>
                ) : (
                    <>
                        <h2>איפוס סיסמה</h2>
                        <p>הזינו את כתובת האימייל שלכם ונשלח קישור לאיפוס הסיסמה</p>
                        <form className="email-form" onSubmit={handleSubmit}>
                            <div className="input-wrapper">
                                <input
                                    type="email"
                                    placeholder="אימייל"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="actions-container">
                                <button type="submit" className="btn btn-solid btn-primary" disabled={isLoading}>
                                    שלח קישור איפוס
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

export default ForgotPasswordPage; 