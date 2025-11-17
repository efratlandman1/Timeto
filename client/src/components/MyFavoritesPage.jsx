import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
    const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('favoritesActiveTab') || 'all'); // all | business | sale | promo
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const token = getToken();        
        if (!token) {
            navigate('/auth', { state: { background: location } });
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
                    navigate('/auth', { state: { background: location } });
                    return;
                }

                const [bizJson, saleJson, promoJson] = await Promise.all([
                    bizRes.json(), saleRes.json(), promoRes.json()
                ]);

                const bizFavs = (bizJson?.data?.favorites || []).map(f => {
                    if (f.business_id) f.business_id.isFavorite = true;
                    return { type: 'business', data: f.business_id };
                }).filter(x => x.data && x.data._id);
                const saleFavs = (saleJson?.data?.favorites || []).map(f => {
                    if (f.saleAdId) f.saleAdId.isFavorite = true;
                    return { type: 'sale', data: f.saleAdId };
                }).filter(x => x.data && x.data._id);
                // Promo favorites: support both populated objects and raw IDs (fetch details if needed)
                const rawPromoFavs = Array.isArray(promoJson?.data?.favorites) ? promoJson.data.favorites : [];
                const idsToFetch = [];
                const promoFavsPre = [];
                for (const f of rawPromoFavs) {
                    const ad = f?.promoAdId;
                    if (ad && typeof ad === 'object') {
                        ad.isFavorite = true;
                        promoFavsPre.push({ type: 'promo', data: ad });
                    } else if (typeof ad === 'string') {
                        idsToFetch.push(ad);
                    }
                }
                let fetchedAds = [];
                if (idsToFetch.length) {
                    try {
                        fetchedAds = await Promise.all(idsToFetch.map(async (id) => {
                            const r = await fetch(`${API}/api/v1/promo-ads/${id}`, { headers });
                            const j = await r.json();
                            const ad = j?.data?.ad;
                            return ad ? { type: 'promo', data: { ...ad, isFavorite: true } } : null;
                        }));
                        fetchedAds = fetchedAds.filter(Boolean);
                    } catch {}
                }
                // Fallback: some environments may return ads list directly
                let promoFromAds = [];
                if (Array.isArray(promoJson?.data?.ads)) {
                    promoFromAds = promoJson.data.ads.map(ad => ({ type: 'promo', data: { ...ad, isFavorite: true } }));
                }
                const promoFavs = [...promoFavsPre, ...fetchedAds, ...promoFromAds];

                setFavorites([...bizFavs, ...saleFavs, ...promoFavs]);
            } catch (error) {
                console.error("Error fetching favorites:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [navigate]);

    const bizItems = useMemo(() => favorites.filter(f => f.type === 'business').map(f => f.data), [favorites]);
    const saleItems = useMemo(() => favorites.filter(f => f.type === 'sale').map(f => f.data), [favorites]);
    const promoItems = useMemo(() => favorites.filter(f => f.type === 'promo').map(f => f.data), [favorites]);

    const counts = { business: bizItems.length, sale: saleItems.length, promo: promoItems.length, all: favorites.length };

    useEffect(() => {
        sessionStorage.setItem('favoritesActiveTab', activeTab);
    }, [activeTab]);

    const items = useMemo(() => {
        if (activeTab === 'business') return bizItems.map(d => ({ type: 'business', data: d }));
        if (activeTab === 'sale') return saleItems.map(d => ({ type: 'sale', data: d }));
        if (activeTab === 'promo') return promoItems.map(d => ({ type: 'promo', data: d }));
        return favorites;
    }, [activeTab, favorites, bizItems, saleItems, promoItems]);

    // Derive subtitle (optional)
    const rawSubtitle = t('favorites.subtitle');
    const subtitle = rawSubtitle && rawSubtitle !== 'favorites.subtitle' ? rawSubtitle : '';

    // Contextual empty message (no hooks to avoid conditional hook issues)
    const emptyMessage = activeTab === 'business'
        ? t('favorites.emptyBusiness')
        : activeTab === 'sale'
        ? t('favorites.emptySale')
        : activeTab === 'promo'
        ? t('favorites.emptyPromo')
        : t('favorites.empty');

    if (loading) {
        return <div className="loading">{t('favorites.loading')}</div>;
    }

    return (
        <div className="wide-page-container">
            <div className="wide-page-content">
                <button className="nav-button above-header" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                
                <div className="sticky-header-block">
                    <div className="page-header">
                        <div className="page-header__content vertical">
                            <h1 className="login-title">{t('favorites.title')}</h1>
                        </div>
                    </div>
                    {/* Segmented tabs - show only after initial load */}
                    {!loading && (
                    <div className="favorites-tabs" role="tablist" aria-label="favorites categories">
                    <button className={`favorites-tab ${activeTab==='all'?'active':''}`} role="tab" aria-selected={activeTab==='all'} onClick={() => setActiveTab('all')}>
                        {t('favorites.tabs.all')} <span className="count">({counts.all})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='business'?'active':''}`} role="tab" aria-selected={activeTab==='business'} onClick={() => setActiveTab('business')}>
                        {t('favorites.tabs.business')} <span className="count">({counts.business})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='sale'?'active':''}`} role="tab" aria-selected={activeTab==='sale'} onClick={() => setActiveTab('sale')}>
                        {t('favorites.tabs.sale')} <span className="count">({counts.sale})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='promo'?'active':''}`} role="tab" aria-selected={activeTab==='promo'} onClick={() => setActiveTab('promo')}>
                        {t('favorites.tabs.promo')} <span className="count">({counts.promo})</span>
                    </button>
                    </div>
                    )}
                </div>
                <div style={{ height: 8 }} />

                {items.length === 0 ? (
                    <div className="empty-state">
                        <p>{emptyMessage}</p>
                    </div>
                ) : (
                    <div className="business-cards-grid">
                        {items.map((item) => (
                            item.type === 'business' ? (
                                <BusinessCard 
                                    key={`biz-${item.data._id}`} 
                                    business={item.data} 
                                    onFavoriteRemoved={() => {
                                        setFavorites(prev => prev.filter(p => !(p.type==='business' && p.data._id === item.data._id)));
                                    }}
                                />
                            ) : item.type === 'sale' ? (
                                <SaleAdCard 
                                    key={`sale-${item.data._id}`} 
                                    ad={item.data} 
                                    onFavoriteRemoved={() => {
                                        setFavorites(prev => prev.filter(p => !(p.type==='sale' && p.data._id === item.data._id)));
                                    }}
                                />
                            ) : (
                                <PromoAdCard 
                                    key={`promo-${item.data._id}`} 
                                    ad={item.data} 
                                    onFavoriteRemoved={() => {
                                        setFavorites(prev => prev.filter(p => !(p.type==='promo' && p.data._id === item.data._id)));
                                    }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyFavoritesPage; 