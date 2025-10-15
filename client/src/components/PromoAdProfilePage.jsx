import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getToken } from '../utils/auth';
import { FaMapMarkerAlt } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css';

const PromoAdProfilePage = () => {
  const { id } = useParams();
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
    <div className="wide-page-container">
      <div className="wide-page-content">
        <div className="page-header">
          <div className="page-header__content">
            <h1>{ad.title}</h1>
            <p>{ad.city}{ad.address ? `, ${ad.address}` : ''}</p>
          </div>
        </div>

        {/* Image as the main content */}
        <div className="rounded overflow-hidden border">
          {ad.image ? (
            <img
              src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${ad.image}`}
              alt={ad.title}
              className="w-full object-cover"
            />
          ) : (
            <div className="w-full h-72 flex items-center justify-center bg-gray-100">אין תמונה</div>
          )}
        </div>

        {/* Contact below the image */}
        <div className="contact-section">
          <div className="contact-grid">
            {(ad.address || ad.city) && (
              <div className="contact-card">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ad.address || ''} ${ad.city || ''}`.trim())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="contact-icon"><FaMapMarkerAlt /></div>
                  <span className="contact-label">כתובת</span>
                  <span className="contact-value">{ad.address ? `${ad.address}, ` : ''}{ad.city}</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Removed details section per request - only contact info remains */}
      </div>
    </div>
  );
};

export default PromoAdProfilePage;


