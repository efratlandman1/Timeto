import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getToken } from '../utils/auth';
import { FaTimes } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css';
import '../styles/SuggestItemPage.css';

const PromoAdProfilePage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const base = process.env.REACT_APP_API_DOMAIN ? `${process.env.REACT_APP_API_DOMAIN}/api/v1` : 'http://localhost:5050/api/v1';
        const res = await fetch(`${base}/promo-ads/${id}`, { headers, credentials: 'include' });
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

  useEffect(() => {
    document.body.classList.add('no-scroll');
    return () => document.body.classList.remove('no-scroll');
  }, []);

  useEffect(() => {
    if (!ad?.image) { setReady(true); return; }
    const src = `${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`;
    const img = new Image();
    img.onload = () => {
      setIsLandscape((img.naturalWidth || 0) >= (img.naturalHeight || 0));
      setReady(true);
    };
    img.onerror = () => setReady(true);
    img.src = src;
  }, [ad]);

  if (loading || !ready) {
    return (
      <div className="modal-overlay-fixed" onClick={() => navigate(-1)}>
        <div className="loader" style={{ margin: '2rem auto' }} />
      </div>
    );
  }

  return (
    <div className="modal-overlay-fixed" onClick={() => navigate(-1)}>
      <div className={`modal-container suggest-modal ads-fullheight ${isLandscape ? 'promo-landscape' : 'promo-portrait'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="promo-modal-title">
        <div className="modal-header">
          <button className="modal-close" aria-label="Close" onClick={() => navigate(-1)}><FaTimes /></button>
          <h1 id="promo-modal-title" className="login-title suggest-modal-title">{ad?.title || ''}</h1>
        </div>
        {error || !ad ? (
          <div className="text-center text-red-600 py-8">{error || 'Not found'}</div>
        ) : (
          <div className="modal-body-scroll">
            <div className="rounded overflow-hidden" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none' }}>
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
        )}
      </div>
    </div>
  );
};

export default PromoAdProfilePage;


