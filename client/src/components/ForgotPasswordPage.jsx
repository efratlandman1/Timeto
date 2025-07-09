import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async () => {
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

    const RequiredMark = () => <span className="required-mark"> * </span>;

    return (
        <div className="modal-overlay">
            {isLoading && (
                <div className="spinner-overlay">
                    <div className="spinner"></div>
                </div>
            )}
            <div className="modal-content modal-center" /*style={{ opacity: isLoading ? 0.7 : 1 }}*/>
                <Link to="/auth" className="btn btn-ghost btn-circle btn-close">
                    <FaTimes />
                </Link>

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
                            <div className="form-field-container">
                                <label htmlFor="email">
                                    כתובת דואר אלקטרונית<RequiredMark />
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="אימייל"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="actions-container">
                                <button 
                                    type="button" 
                                    className="btn btn-solid btn-primary" 
                                    disabled={isLoading}
                                    onClick={handleSubmit}
                                >
                                    שלח קישור איפוס
                                </button>
                            </div>
                        {message.type === 'error' && <p className="auth-message error-message">{message.text}</p>}
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 