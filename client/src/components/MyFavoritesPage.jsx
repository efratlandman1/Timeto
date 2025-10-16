import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BusinessCard from './BusinessCard';
import SaleAdCard from './SaleAdCard';
import PromoAdCard from './PromoAdCard';
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
                const API = process.env.REACT_APP_API_DOMAIN || 'http://localhost:5050';
                const headers = { 'Authorization': `Bearer ${token}` };

                const [bizRes, saleRes, promoRes] = await Promise.all([
                    fetch(`${API}/api/v1/favorites/user-favorites`, { headers }),
                    fetch(`${API}/api/v1/sale-favorites/my`, { headers }),
                    fetch(`${API}/api/v1/promo-favorites/my`, { headers })
                ]);

                if (bizRes.status === 401 || saleRes.status === 401 || promoRes.status === 401) {
                    navigate('/auth');
                    return;
                }

                const [bizJson, saleJson, promoJson] = await Promise.all([
                    bizRes.json(), saleRes.json(), promoRes.json()
                ]);

                const bizFavs = (bizJson?.data?.favorites || []).map(f => ({ type: 'business', data: f.business_id })).filter(x => x.data && x.data._id);
                const saleFavs = (saleJson?.data?.favorites || []).map(f => ({ type: 'sale', data: f.saleAdId })).filter(x => x.data && x.data._id);
                const promoFavs = (promoJson?.data?.favorites || []).map(f => ({ type: 'promo', data: f.promoAdId })).filter(x => x.data && x.data._id);

                setFavorites([...bizFavs, ...saleFavs, ...promoFavs]);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [navigate]);

    const items = favorites;

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
                        <h1>המועדפים שלי</h1>
                        <p>כל הפריטים שסימנת כמועדפים במקום אחד</p>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="empty-state">
                        <p>עדיין לא סימנת מועדפים</p>
                        <button className="primary-button" onClick={() => navigate('/')}>
                            חפש עסקים
                        </button>
                    </div>
                ) : (
                    <div className="business-cards-grid">
                        {items.map((item) => (
                            item.type === 'business' ? (
                                <BusinessCard key={`biz-${item.data._id}`} business={item.data} />
                            ) : item.type === 'sale' ? (
                                <SaleAdCard key={`sale-${item.data._id}`} ad={item.data} />
                            ) : (
                                <PromoAdCard key={`promo-${item.data._id}`} ad={item.data} />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavoritesPage; 