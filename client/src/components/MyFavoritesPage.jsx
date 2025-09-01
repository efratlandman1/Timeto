import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BusinessCard from './BusinessCard';
import '../styles/userBusinesses.css';
import { FaArrowRight } from "react-icons/fa";
import { getToken } from "../utils/auth";

const MyFavoritesPage = () => {
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();        
        if (!token) {
            navigate('/auth');
            return;
        }

        const fetchFavorites = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/favorites/user-favorites`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status !== 200) {
                    navigate('/auth');
                    return;
                }
                
                const res = await response.json();
                setFavorites(res.data.favorites || []);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [navigate]);

    // Map favorites to businesses
    const businesses = favorites.map(fav => fav.business_id).filter(biz => biz && biz._id);

    if (loading) {
        return <div className="loading">{t('favorites.loading')}</div>;
    }

    return (
        <div className="wide-page-container">
            <div className="wide-page-content">
                <button className="nav-button above-header" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    חזרה לדף הבית
                </button>
                
                <div className="page-header">
                    <div className="page-header__content vertical">
                        <h1>העסקים המועדפים שלי</h1>
                        <p>כל העסקים שסימנת כמועדפים במקום אחד</p>
                    </div>
                </div>

                {businesses.length === 0 ? (
                    <div className="empty-state">
                        <p>עדיין לא סימנת עסקים כמועדפים</p>
                        <button className="primary-button" onClick={() => navigate('/')}>
                            חפש עסקים
                        </button>
                    </div>
                ) : (
                    <div className="business-cards-grid">
                        {businesses.map((business) => (
                            <BusinessCard
                                key={business._id}
                                business={business}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavoritesPage; 