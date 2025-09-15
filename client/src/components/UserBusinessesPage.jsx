import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BusinessCard from './BusinessCard';
import '../styles/userBusinesses.css';
import { FaPlus, FaArrowRight } from "react-icons/fa";
import { getToken } from "../utils/auth";

const UserBusinessesPage = () => {
    const { t } = useTranslation();
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchUserBusinesses = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/user-businesses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status !== 200) {
                    navigate('/auth');
                    return;
                }
                
                const data = await response.json();
                setMyBusinesses(data.data.businesses || []);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBusinesses();
    }, [navigate]);

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content'>
                <button className="nav-button above-header" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                
                <div className="page-header">
                    <div className="page-header__content">
                        <h1>{t('userBusinesses.title')}</h1>
                        <p>{t('userBusinesses.subtitle')}</p>
                    </div>
                    <div className="page-header__action">
                        <button 
                            className="add-business-button"
                            onClick={() => navigate('/business')}
                        >
                            <FaPlus className="add-business-icon" />
                            {t('userBusinesses.addNewBusiness')}
                        </button>
                    </div>
                </div>

                <div className="business-cards-grid">
                    {loading ? (
                        <div>{t('common.loading')}</div>
                    ) : myBusinesses.length === 0 ? (
                        <div>{t('userBusinesses.noBusinesses')}</div>
                    ) : (
                        myBusinesses.map(business => (
                            <BusinessCard
                                key={business._id}
                                business={business}
                                fromUserBusinesses={true}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserBusinessesPage;
