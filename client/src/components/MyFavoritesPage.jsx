import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BusinessCard from './BusinessCard';
import '../styles/userBusinesses.css';
import { FaArrowRight } from "react-icons/fa";
import { getToken } from "../utils/auth";

const MyFavoritesPage = () => {
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
                
                const data = await response.json();
                setFavorites(data);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [navigate]);

    if (loading) {
        return <div className="loading">טוען מועדפים...</div>;
    }

    return (
        <div className="wide-page-container">
            <div className="wide-page-content">
                <button className="btn btn-ghost" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    חזרה לדף הבית
                </button>
                
                <div className="page-header">
                    <div className="page-header__content vertical">
                        <h1>העסקים המועדפים שלי</h1>
                        <p>כל העסקים שסימנת כמועדפים במקום אחד</p>
                    </div>
                </div>

                {favorites.length === 0 ? (
                    <div className="empty-state">
                        <p>עדיין לא סימנת עסקים כמועדפים</p>
                        <button className="btn btn-solid btn-primary" onClick={() => navigate('/')}>
                            חפש עסקים
                        </button>
                    </div>
                ) : (
                    <div className="business-cards-grid">
                        {favorites.map((business) => (
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