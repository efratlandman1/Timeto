import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import '../styles/LoginPage.css'; // Reuse existing CSS
import { FaEnvelope } from 'react-icons/fa';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/request-password-reset`, { email });
            toast.success('אם קיים חשבון עם כתובת זו, נשלח אליו קישור לאיפוס סיסמה.');
        } catch (error) {
            if (error.response && error.response.status === 429) {
                // Handle Rate Limit error specifically
                toast.error(error.response.data);
            } else {
                toast.error('אירעה שגיאה. אנא נסו שוב.');
            }
            console.error('Forgot password error:', error.response ? error.response.data : error.message);
        } finally {
            setLoading(false);
            setEmail('');
        }
    };

    return (
        <div className="narrow-page-container">
            <div className="narrow-page-content">
                <form className="login-form" onSubmit={handleSubmit}>
                    <h1 className="login-title">שכחת סיסמה?</h1>
                    <p style={{ color: '#666', marginBottom: '2rem', marginTop: '-1rem' }}>
                        הזינו את כתובת האימייל שלכם ונשלח אליכם קישור לאיפוס.
                    </p>

                    <div className="login-input-wrapper">
                        <FaEnvelope className="login-input-icon" />
                        <input
                            className="login-input"
                            type="email"
                            id="email"
                            placeholder="אימייל"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'שולח...' : 'שלח קישור איפוס'}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                        <Link to="/login">חזרה להתחברות</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage; 