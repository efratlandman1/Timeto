import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSaleAd } from '../redux/saleAdsSlice';
import { fetchSaleCategories } from '../redux/saleCategoriesSlice';
import { getToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/EditBusinessPage.css';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { PHONE_PREFIXES, PHONE_NUMBER_MAX_LENGTH } from '../constants/globals';
import ImageUploader from './common/ImageUploader';
import ActionBar from './common/ActionBar';
import { FaArrowRight } from 'react-icons/fa';

const CreateSaleAdPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories } = useSelector(s => s.saleCategories);
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [prefix, setPrefix] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [auto, setAuto] = useState(null);

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });

  const onAutoLoad = (instance) => setAuto(instance);
  const onPlaceChanged = () => {
    if (auto) {
      const place = auto.getPlace();
      const value = place?.formatted_address || place?.name || '';
      if (value) setCity(value);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth');
      return;
    }
    dispatch(fetchSaleCategories());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    fd.append('city', city);
    fd.append('phone', phone);
    if (price) fd.append('price', price);
    if (currency) fd.append('currency', currency);
    if (prefix) fd.append('prefix', prefix);
    fd.append('hasWhatsapp', String(!!hasWhatsapp));
    if (categoryId) fd.append('categoryId', categoryId);
    if (description) fd.append('description', description);
    Array.from(images).forEach(f => fd.append('images', f));
    const res = await dispatch(createSaleAd(fd));
    if (res.meta.requestStatus === 'fulfilled') {
      navigate('/ads');
    }
  };

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <button className="nav-button above-header" onClick={() => navigate('/') }>
          <FaArrowRight className="icon" />
          חזרה לעמוד הבית
        </button>
        <div className="page-header">
          <div className="page-header__content vertical">
            <h1>יצירת מודעת מכירה</h1>
            <p>מלאי את פרטי המודעה באופן קצר וקולע</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת <span className="required-asterisk">*</span></label>
            <input className="form-input" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <div>
              <label className="form-label">עיר/אזור <span className="required-asterisk">*</span></label>
              {mapsLoaded ? (
                <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                  <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
                </Autocomplete>
              ) : (
                <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
              )}
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <label htmlFor="phone" className="form-label" style={{ flexShrink: 0, marginTop: '6px' }}>
              טלפון <span className="required-asterisk">*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', flexGrow: 1, direction: 'ltr', alignItems: 'center' }}>
              <select
                id="phonePrefix"
                name="prefix"
                className="form-input"
                style={{ width: '80px', textAlign: 'center' }}
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
              >
                <option value="">בחרי</option>
                {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input
                type="text"
                id="phone"
                name="phone"
                className="form-input"
                style={{ flexGrow: 1 }}
                value={phone}
                onChange={e => setPhone(e.target.value)}
                inputMode="numeric"
                maxLength={PHONE_NUMBER_MAX_LENGTH}
                required
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0, direction: 'rtl' }}>
                <input
                  type="checkbox"
                  id="hasWhatsapp"
                  checked={!!hasWhatsapp}
                  onChange={e => setHasWhatsapp(e.target.checked)}
                />
                <label htmlFor="hasWhatsapp" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  יש וואטסאפ
                </label>
              </div>
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
            <label className="form-label">מחיר <span className="required-asterisk">*</span></label>
              <input className="form-input" name="price" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
            <label className="form-label">מטבע <span className="required-asterisk">*</span></label>
              <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="ILS">₪ ILS</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">קטגוריה <span className="required-asterisk">*</span></label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">בחרי קטגוריה</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">תיאור <span className="required-asterisk">*</span></label>
            <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <ImageUploader
            multiple
            files={Array.from(images || [])}
            label="תמונות (עד 10)"
            onAdd={(filesList) => setImages(filesList)}
            onRemove={(idx) => {
              const arr = Array.from(images || []);
              arr.splice(idx, 1);
              // Note: FileList is read-only; keep as array for previews and append in submit
              setImages(arr);
            }}
          />
          <ActionBar
            onCancel={() => navigate('/')}
            onConfirm={handleSubmit}
            cancelText="ביטול"
            confirmText="פרסם"
          />
        </form>
      </div>
    </div>
  );
};

export default CreateSaleAdPage;


