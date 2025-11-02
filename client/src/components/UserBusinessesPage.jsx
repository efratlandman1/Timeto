import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BusinessCard from './BusinessCard';
import SaleAdCard from './SaleAdCard';
import PromoAdCard from './PromoAdCard';
import '../styles/userBusinesses.css';
import { FaPlus, FaArrowRight, FaStore, FaTags, FaBullhorn } from "react-icons/fa";
import { getToken } from "../utils/auth";

const UserBusinessesPage = () => {
    const { t } = useTranslation();
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mySaleAds, setMySaleAds] = useState([]);
    const [myPromoAds, setMyPromoAds] = useState([]);
    const [activeTab, setActiveTab] = useState('business'); // business | sale | promo | all
    const navigate = useNavigate();
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const createMenuRef = useRef(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate('/auth', { state: { background: { pathname: '/' } } });
            return;
        }

        const fetchUserBusinesses = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/user-businesses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status !== 200) {
                    navigate('/auth', { state: { background: { pathname: '/' } } });
                    return;
                }
                
                const data = await response.json();
                setMyBusinesses(data.data.businesses || []);

                // sale ads
                const saleRes = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-ads/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const saleJson = await saleRes.json();
                setMySaleAds(saleJson?.data?.ads || []);

                // promo ads
                const promoRes = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/promo-ads/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const promoJson = await promoRes.json();
                setMyPromoAds(promoJson?.data?.ads || []);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBusinesses();
    }, [navigate]);

    // close create menu on outside click / Esc
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setShowCreateMenu(false); };
        const onClick = (e) => {
            if (createMenuRef.current && !createMenuRef.current.contains(e.target)) {
                setShowCreateMenu(false);
            }
        };
        document.addEventListener('keydown', onKey);
        document.addEventListener('mousedown', onClick);
        return () => {
            document.removeEventListener('keydown', onKey);
            document.removeEventListener('mousedown', onClick);
        };
    }, []);

    const counts = useMemo(() => ({
        business: myBusinesses.length,
        sale: mySaleAds.length,
        promo: myPromoAds.length,
        all: myBusinesses.length + mySaleAds.length + myPromoAds.length
    }), [myBusinesses, mySaleAds, myPromoAds]);

    const items = useMemo(() => {
        if (activeTab === 'business') return myBusinesses.map(d => ({ type: 'business', data: d }));
        if (activeTab === 'sale') return mySaleAds.map(d => ({ type: 'sale', data: d }));
        if (activeTab === 'promo') return myPromoAds.map(d => ({ type: 'promo', data: d }));
        return [
            ...myBusinesses.map(d => ({ type: 'business', data: d })),
            ...mySaleAds.map(d => ({ type: 'sale', data: d })),
            ...myPromoAds.map(d => ({ type: 'promo', data: d }))
        ];
    }, [activeTab, myBusinesses, mySaleAds, myPromoAds]);

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content'>
                <button className="nav-button above-header" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                
                <div className="page-header">
                    <div className="page-header__content">
                        <h1 className="login-title">{t('userBusinesses.title')}</h1>
                    </div>
                    <div className="page-header__action" ref={createMenuRef} style={{ position: 'relative' }}>
                        <button 
                            className="add-business-button"
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            aria-expanded={showCreateMenu}
                            aria-haspopup="true"
                            title={t('userBusinesses.create')}
                        >
                            <FaPlus className="add-business-icon" />
                            {t('userBusinesses.create')}
                        </button>
                        {showCreateMenu && (
                            <div 
                                role="menu"
                                aria-label={t('userBusinesses.createMenuAria')}
                                className="dropdown-menu"
                                style={{ position: 'absolute', zIndex: 10, marginTop: 8, left: 0, minWidth: 220 }}
                            >
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/business', { state: { reset: Date.now() } }); }}>
                                    <FaStore style={{ marginInlineEnd: 8 }} /> {t('userBusinesses.createOptions.addBusiness')}
                                </button>
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/ads/sale/new'); }}>
                                    <FaTags style={{ marginInlineEnd: 8 }} /> {t('userBusinesses.createOptions.saleAd')}
                                </button>
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/ads/promo/new'); }}>
                                    <FaBullhorn style={{ marginInlineEnd: 8 }} /> {t('userBusinesses.createOptions.promoAd')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Segmented tabs like MyFavorites - render only once data is loaded */}
                {!loading && (
                <div className="favorites-tabs" role="tablist" aria-label={t('userBusinesses.tabs.aria')}>
                    <button className={`favorites-tab ${activeTab==='business'?'active':''}`} role="tab" aria-selected={activeTab==='business'} onClick={() => setActiveTab('business')}>
                        {t('userBusinesses.tabs.business')} <span className="count">({counts.business})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='sale'?'active':''}`} role="tab" aria-selected={activeTab==='sale'} onClick={() => setActiveTab('sale')}>
                        {t('userBusinesses.tabs.sale')} <span className="count">({counts.sale})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='promo'?'active':''}`} role="tab" aria-selected={activeTab==='promo'} onClick={() => setActiveTab('promo')}>
                        {t('userBusinesses.tabs.promo')} <span className="count">({counts.promo})</span>
                    </button>
                    <button className={`favorites-tab ${activeTab==='all'?'active':''}`} role="tab" aria-selected={activeTab==='all'} onClick={() => setActiveTab('all')}>
                        {t('userBusinesses.tabs.all')} <span className="count">({counts.all})</span>
                    </button>
                </div>
                )}

                <div className="business-cards-grid">
                    {loading ? (
                        <div>{t('common.loading')}</div>
                    ) : items.length === 0 ? (
                        <div>{t('userBusinesses.noBusinesses')}</div>
                    ) : (
                        items.map(item => (
                            item.type === 'business' ? (
                                <BusinessCard key={`biz-${item.data._id}`} business={item.data} fromUserBusinesses={true} />
                            ) : item.type === 'sale' ? (
                                <SaleAdCard key={`sale-${item.data._id}`} ad={{ ...item.data, canManage: true }} />
                            ) : (
                                <PromoAdCard key={`promo-${item.data._id}`} ad={{ ...item.data, canManage: true }} />
                            )
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserBusinessesPage;
