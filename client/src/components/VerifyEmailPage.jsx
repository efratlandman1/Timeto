import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';
import { toast } from 'react-toastify';
import '../styles/LoginPage.css';
import { FaClock, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const VerifyEmailPage = () => {
    const [statusMessage, setStatusMessage] = useState('מאמת את כתובת המייל שלך, אנא המתן...');
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const verifyEmail = async () => {
            const params = new URLSearchParams(location.search);
            const token = params.get('token');
            const apiUrl = process.env.REACT_APP_API_DOMAIN;

            if (!token) {
                setStatusMessage('אסימון אימות לא נמצא. אנא בדוק את הקישור.');
                setIsLoading(false);
                setIsError(true);
                return;
            }

            try {
                const response = await axios.get(`${apiUrl}/api/v1/verify-email?token=${token}`);
                
                // toast.success('האימייל אומת בהצלחה! מתחבר...');
                setStatusMessage('האימייל אומת בהצלחה! מעביר אותך לאזור האישי...');
                setIsLoading(false);
                setIsError(false);

                dispatch(setUser({ user: response.data.user }));
                document.cookie = `token=${response.data.token}; path=/`;
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                setTimeout(() => {
                    navigate('/my-businesses');
                }, 2000);

            } catch (error) {
                const errorMessage = error.response?.data?.message || 'אימות נכשל. ייתכן שהקישור אינו חוקי או שפג תוקפו.';
                setStatusMessage(errorMessage);
                setIsLoading(false);
                setIsError(true);
            }
        };

        verifyEmail();
    }, [location, navigate, dispatch]);

    return (
        <div className="narrow-page-container">
            <div className="narrow-page-content">
                <div className="login-form">
                    <FaClock className="login-logo" />
                    <h1 className="login-title">אימות כתובת מייל</h1>

                    <div style={{ textAlign: 'center', margin: '20px 0' }}>
                        {isLoading ? (
                            <div className="spinner" style={{ margin: 'auto' }}></div>
                        ) : isError ? (
                            <FaExclamationCircle style={{ fontSize: '4rem', color: '#dc3545' }} />
                        ) : (
                            <FaCheckCircle style={{ fontSize: '4rem', color: '#28a745' }} />
                        )}
                    </div>
                    
                    <p style={{ textAlign: 'center', fontSize: '1.1rem', minHeight: '40px' }}>
                        {statusMessage}
                    </p>

                    {!isLoading && isError && (
                        <button className="login-button" onClick={() => navigate('/login')}>
                            חזרה להתחברות
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VerifyEmailPage; 