import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createPromoAd } from '../redux/promoAdsSlice';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import '../styles/EditBusinessPage.css';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import ImageUploader from './common/ImageUploader';
import ActionBar from './common/ActionBar';
import { FaArrowRight } from 'react-icons/fa';
import { getToken } from '../utils/auth';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const CreatePromoAdPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [image, setImage] = useState(null);
  const [auto, setAuto] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isEditMode = Boolean(searchParams.get('edit'));

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const onAutoLoad = (instance) => setAuto(instance);
  const onPlaceChanged = () => {
    if (!auto) return;
    const place = auto.getPlace();
    const comps = place?.address_components || [];
    const cityComp = comps.find(c => c.types.includes('locality'))
      || comps.find(c => c.types.includes('administrative_area_level_2'))
      || comps.find(c => c.types.includes('administrative_area_level_1'));
    const value = cityComp?.long_name || place?.name || place?.formatted_address || '';
    if (value) setCity(value);
  };

  // Always start at the top when entering this page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Load business categories for promo ads
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_DOMAIN || ''}/api/v1/categories`);
        const json = await res.json();
        setCategories(json?.data?.categories || []);
      } catch {}
    })();
  }, []);
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth', { state: { background: { pathname: '/' } } });
    }
  }, [navigate]);

  // Load for edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    // Prefer prefilled state if provided
    const stateAd = location.state?.ad;
    if (stateAd) {
      setTitle(stateAd.title || '');
      setCity(stateAd.city || '');
      setValidFrom(stateAd.validFrom ? new Date(stateAd.validFrom).toISOString().slice(0,16) : '');
      setValidTo(stateAd.validTo ? new Date(stateAd.validTo).toISOString().slice(0,16) : '');
      if (stateAd.image) setImage(stateAd.image);
      setCategoryId(stateAd.categoryId?._id || stateAd.categoryId || '');
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/promo-ads/${editId}`);
        const json = await res.json();
        if (res.ok && json?.data?.ad) {
          const a = json.data.ad;
          setTitle(a.title || '');
          setCity(a.city || '');
          setValidFrom(a.validFrom ? new Date(a.validFrom).toISOString().slice(0,16) : '');
          setValidTo(a.validTo ? new Date(a.validTo).toISOString().slice(0,16) : '');
          if (a.image) setImage(a.image);
          setCategoryId(a.categoryId?._id || a.categoryId || '');
        }
      } catch {}
    })();
  }, [searchParams, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Pre-submit validation
    const missing = [];
    if (!title.trim()) missing.push(t('promoAd.fields.title'));
    if (!city.trim()) missing.push(t('promoAd.fields.city'));
    if (!validFrom) missing.push(t('promoAd.fields.validFrom'));
    if (!validTo) missing.push(t('promoAd.fields.validTo'));
    if (!image) missing.push(t('promoAd.fields.image'));
    if (missing.length) {
      toast.error(`נא למלא את השדות הנדרשים: ${missing.join(', ')}`, { position: 'top-center', className: 'custom-toast' });
      return;
    }
    if (validFrom && validTo && new Date(validTo) <= new Date(validFrom)) {
      toast.error('טווח תוקף לא תקין', { position: 'top-center', className: 'custom-toast' });
      return;
    }
    const fd = new FormData();
    fd.append('title', title);
    fd.append('city', city);
    fd.append('validFrom', validFrom);
    fd.append('validTo', validTo);
    if (categoryId) fd.append('categoryId', categoryId);
    // Append image only if a new File was chosen; keep existing string filename as-is
    if (image && typeof image !== 'string') fd.append('image', image);
    const editId = searchParams.get('edit');
    let res;
    if (editId) {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const putRes = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/promo-ads/${editId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: fd
      });
      res = { meta: { requestStatus: putRes.ok ? 'fulfilled' : 'rejected' } };
    } else {
      res = await dispatch(createPromoAd(fd));
    }
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success(editId ? 'המודעה נערכה בהצלחה' : 'המודעה פורסמה בהצלחה', { position: 'top-center', className: 'custom-toast' });
      setTimeout(() => {
        if (editId) navigate('/user-businesses'); else navigate('/');
      }, 800);
    } else {
      toast.error(t('common.generalError'), { position: 'top-center', className: 'custom-toast' });
    }
  };

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <button className="nav-button above-header" onClick={() => {
          if (isEditMode) navigate('/user-businesses'); else navigate('/');
        }}>
          <FaArrowRight className="icon" />
          {isEditMode ? t('common.backToBusinesses') : t('common.backToHome')}
        </button>
        <h1 className="login-title" style={{ textAlign: 'center', marginTop: '8px' }}>{t('promoAd.pageTitleNew')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('promoAd.fields.title')} <span className="required-asterisk">*</span></label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{t('promoAd.fields.category') !== 'promoAd.fields.category' ? t('promoAd.fields.category') : 'קטגוריה'}</label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value || '')}>
              <option value="">{t('common.select') !== 'common.select' ? t('common.select') : 'בחר'}</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{t('promoAd.fields.city')} <span className="required-asterisk">*</span></label>
            {mapsLoaded ? (
              <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                <input className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
              </Autocomplete>
            ) : (
              <input className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
            )}
          </div>
          <div className="form-group">
            <div>
              <label className="form-label">{t('promoAd.fields.image')} <span className="required-asterisk">*</span></label>
              <ImageUploader
                multiple={false}
                file={image}
                label={t('promoAd.fields.image')}
                onAdd={(filesList) => setImage(filesList?.[0] || null)}
                onRemove={() => setImage(null)}
              />
            </div>
          </div>
          <div className="form-group two-col-grid date-grid" style={{ direction: 'ltr' }}>
            <div>
              <label className="form-label">{t('promoAd.fields.validFrom')} <span className="required-asterisk">*</span></label>
              <input className="form-input" type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} required style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div>
              <label className="form-label">{t('promoAd.fields.validTo')} <span className="required-asterisk">*</span></label>
              <input className="form-input" type="datetime-local" value={validTo} onChange={e => setValidTo(e.target.value)} required style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
          </div>
          <ActionBar
            onCancel={() => {
              const editId = searchParams.get('edit');
              if (editId) navigate('/user-businesses'); else navigate('/');
            }}
            onConfirm={handleSubmit}
            cancelText={t('promoAd.actions.cancel')}
            confirmText={searchParams.get('edit') ? t('promoAd.actions.save') : t('promoAd.actions.publish')}
          />
        </form>
      </div>
    </div>
  );
};

export default CreatePromoAdPage;


