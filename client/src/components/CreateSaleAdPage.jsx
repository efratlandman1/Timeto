import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSaleAd } from '../redux/saleAdsSlice';
import { fetchSaleCategories } from '../redux/saleCategoriesSlice';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EditBusinessPage.css';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { PHONE_PREFIXES, PHONE_NUMBER_MAX_LENGTH } from '../constants/globals';

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
        <div className="page-header">
          <div className="page-header__content vertical">
            <h1>יצירת מודעת מכירה</h1>
            <p>מלאי את פרטי המודעה באופן קצר וקולע</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת *</label>
            <input className="form-input" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">עיר/אזור *</label>
              {mapsLoaded ? (
                <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                  <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
                </Autocomplete>
              ) : (
                <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
              )}
            </div>
            <div>
              <label className="form-label">טלפון *</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <select className="form-input" style={{ width: '80px', textAlign: 'center' }} value={prefix} onChange={e => setPrefix(e.target.value)}>
                  <option value="">בחרי</option>
                  {PHONE_PREFIXES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input className="form-input" name="phone" value={phone} onChange={e => setPhone(e.target.value)} inputMode="numeric" maxLength={PHONE_NUMBER_MAX_LENGTH} required />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />
                  <label className="form-label" style={{ margin: 0 }}>וואטסאפ</label>
                </div>
              </div>
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">מחיר</label>
              <input className="form-input" name="price" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
              <label className="form-label">מטבע</label>
              <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="ILS">₪ ILS</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">קטגוריה</label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">בחרי קטגוריה</option>
              {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">תיאור</label>
            <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="form-group-logo">
            <label className="button file-upload">
              תמונות (עד 10)
              <input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} style={{ display: 'none' }} />
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="nav-button" onClick={() => navigate('/ads')}>ביטול</button>
            <button type="submit" className="save-button">פרסם</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSaleAdPage;


