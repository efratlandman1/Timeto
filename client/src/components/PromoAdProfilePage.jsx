import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getToken } from '../utils/auth';
import { FaMapMarkerAlt, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css';
import '../styles/SuggestItemPage.css';

const PromoAdProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/promo-ads/${id}`, { headers, credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to load promo ad');
        setAd(json.data.ad);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAd();
  }, [id]);

  if (loading) {
    return (
      <div className="wide-page-container">
        <div className="wide-page-content">
          <div className="loader"></div>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="wide-page-container">
        <div className="wide-page-content">
          <div className="text-center text-red-600 py-8">{error || 'Not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay-fixed" onClick={() => navigate(-1)}>
      <div className="modal-container suggest-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="promo-modal-title">
        <div className="modal-header">
          <button className="modal-close" aria-label="Close" onClick={() => navigate(-1)}><FaTimes /></button>
          <h1 id="promo-modal-title" className="login-title suggest-modal-title">{ad.title}</h1>
        </div>
        <div className="rounded overflow-hidden border" style={{ width: '100%', height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa' }}>
          {ad.image ? (
            <img
              src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`}
              alt={ad.title}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">אין תמונה</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoAdProfilePage;


