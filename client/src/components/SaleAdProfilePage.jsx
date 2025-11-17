import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getToken } from '../utils/auth';
import { FaMapMarkerAlt, FaPhoneAlt, FaWhatsapp, FaTags, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css';
import '../styles/SuggestItemPage.css';

const SaleAdProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const images = Array.isArray(ad?.images) ? ad.images : [];

  useEffect(() => {
    if (Array.isArray(ad?.images) && ad.images.length) {
      setSelectedImage(ad.images[0]);
      setCurrentIdx(0);
    } else {
      setSelectedImage(null);
      setCurrentIdx(0);
    }
  }, [ad]);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const token = getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/sale-ads/${id}`, { headers, credentials: 'include' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Failed to load sale ad');
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
      <div className="modal-container suggest-modal ads-fullheight" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="sale-modal-title">
        <div className="modal-header">
          <button className="modal-close" aria-label="Close" onClick={() => navigate(-1)}><FaTimes /></button>
          <h1 id="sale-modal-title" className="login-title suggest-modal-title">{ad.title}</h1>
        </div>

        {/* In modal view, show contact below the image for less scrolling and better fit */}
        <div className="modal-body-scroll">
        <div className="two-column-section" style={{ display: 'block' }}>
          {/* Image Top */}
          <div className="column-card" style={{ marginBottom: 16 }}>
            <div style={{ position: 'relative', minHeight: 320 }}>
              {selectedImage ? (
                <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: 12 }}>
                  <img
                    src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${selectedImage}`}
                    alt={ad.title}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-100">אין תמונה</div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    aria-label={t('common.prevImage', 'Previous image')}
                    className="category-arrow left"
                    style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: 22 }}
                    onClick={() => {
                      const next = (currentIdx - 1 + images.length) % images.length;
                      setCurrentIdx(next);
                      setSelectedImage(images[next]);
                    }}
                  >
                    <FaChevronLeft />
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.nextImage', 'Next image')}
                    className="category-arrow right"
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 48, height: 48, fontSize: 22 }}
                    onClick={() => {
                      const next = (currentIdx + 1) % images.length;
                      setCurrentIdx(next);
                      setSelectedImage(images[next]);
                    }}
                  >
                    <FaChevronRight />
                  </button>
                </>
              )}
            </div>
            {images.length > 0 && (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <div style={{ display: 'flex', gap: 8, padding: '6px 0' }} role="listbox" aria-label="גלריית תמונות">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => { setSelectedImage(img); setCurrentIdx(idx); }}
                      aria-label={`תמונה ${idx + 1}`}
                      className={`${selectedImage === img ? 'thumb-selected' : ''}`}
                      style={{ flex: '0 0 auto', width: 80, height: 80, border: selectedImage === img ? '2px solid #2563eb' : '2px solid transparent', borderRadius: 8, padding: 0, overflow: 'hidden', background: 'transparent' }}
                    >
                      <img
                        src={`${process.env.REACT_APP_API_DOMAIN || ''}/uploads/${img}`}
                        alt={`${ad.title} ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Contact + Details Below */}
          <div className="column-card">
            <div className="contact-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
              {(ad.address || ad.city) && (
                <div className="contact-card">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ad.address || ''} ${ad.city || ''}`.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="contact-icon"><FaMapMarkerAlt /></div>
                    <span className="contact-label">{t('common.address', 'Address')}</span>
                    <span className="contact-value">{ad.address ? `${ad.address}, ` : ''}{ad.city}</span>
                  </a>
                </div>
              )}

              {ad.phone && (
                <div className="contact-card">
                  <a href={`tel:${(ad.prefix || '')}${ad.phone}`}>
                    <div className="contact-icon"><FaPhoneAlt /></div>
                    <span className="contact-label">{t('common.phone', 'Phone')}</span>
                    <span className="contact-value">{(ad.prefix || '')}{ad.phone}</span>
                  </a>
                </div>
              )}

              {ad.hasWhatsapp && ad.phone && (
                <div className="contact-card">
                  <a
                    href={`https://wa.me/${(ad.prefix || '').replace('+','')}${ad.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="contact-icon"><FaWhatsapp /></div>
                    <span className="contact-label">{t('common.whatsapp', 'WhatsApp')}</span>
                    <span className="contact-value">{(ad.prefix || '')}{ad.phone}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="info-card-header" style={{ marginTop: '16px' }}>
              <FaTags />
              <h3 className="info-card-title">{t('common.details', 'Details')}</h3>
            </div>
            <div className="services-grid">
              {ad.categoryId?.name && (<div className="service-tag">{ad.categoryId.name}</div>)}
              {ad.price !== undefined && (<div className="service-tag">{ad.price} {ad.currency || 'ILS'}</div>)}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SaleAdProfilePage;


