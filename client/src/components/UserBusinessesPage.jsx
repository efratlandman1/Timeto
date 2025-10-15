import React, { useState, useEffect, useRef } from 'react';
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
    const navigate = useNavigate();
    const [showCreateMenu, setShowCreateMenu] = useState(false);
    const createMenuRef = useRef(null);

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

    return (
        <div className='wide-page-container'>
            <div className='wide-page-content'>
                <button className="nav-button above-header" onClick={() => navigate('/')}>
                    <FaArrowRight className="icon" />
                    {t('common.backToHome')}
                </button>
                
                <div className="page-header">
                    <div className="page-header__content">
                        <h1>אזור אישי</h1>
                        <p>{t('userBusinesses.subtitle')}</p>
                    </div>
                    <div className="page-header__action" ref={createMenuRef} style={{ position: 'relative' }}>
                        <button 
                            className="add-business-button"
                            onClick={() => setShowCreateMenu(!showCreateMenu)}
                            aria-expanded={showCreateMenu}
                            aria-haspopup="true"
                            title="צור חדש"
                        >
                            <FaPlus className="add-business-icon" />
                            צור
                        </button>
                        {showCreateMenu && (
                            <div 
                                role="menu"
                                aria-label="Create dropdown"
                                className="dropdown-menu"
                                style={{ position: 'absolute', zIndex: 10, marginTop: 8, left: 0, minWidth: 220 }}
                            >
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/business'); }}>
                                    <FaStore style={{ marginInlineEnd: 8 }} /> הוספת עסק
                                </button>
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/ads/sale/new'); }}>
                                    <FaTags style={{ marginInlineEnd: 8 }} /> מודעת מכירה
                                </button>
                                <button className="dropdown-item" role="menuitem" onClick={() => { setShowCreateMenu(false); navigate('/ads/promo/new'); }}>
                                    <FaBullhorn style={{ marginInlineEnd: 8 }} /> מודעת פרסום
                                </button>
                            </div>
                        )}
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

                {/* My Sale Ads */}
                <div className="page-header" style={{ marginTop: '24px' }}>
                    <div className="page-header__content">
                        <h2>המודעות שלי - מכירה</h2>
                    </div>
                </div>
                <div className="business-cards-grid">
                    {mySaleAds.map(ad => (
                        <SaleAdCard key={ad._id} ad={{ ...ad, canManage: true }} />
                    ))}
                </div>

                {/* My Promo Ads */}
                <div className="page-header" style={{ marginTop: '24px' }}>
                    <div className="page-header__content">
                        <h2>המודעות שלי - פרסום</h2>
                    </div>
                </div>
                <div className="business-cards-grid">
                    {myPromoAds.map(ad => (
                        <PromoAdCard key={ad._id} ad={{ ...ad, canManage: true }} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default UserBusinessesPage;
