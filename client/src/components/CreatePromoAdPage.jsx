import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPromoAd } from '../redux/promoAdsSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/EditBusinessPage.css';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import ImageUploader from './common/ImageUploader';
import ActionBar from './common/ActionBar';
import { FaArrowRight } from 'react-icons/fa';

const CreatePromoAdPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [image, setImage] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    fd.append('city', city);
    fd.append('validFrom', validFrom);
    fd.append('validTo', validTo);
    if (image) fd.append('image', image);
    const res = await dispatch(createPromoAd(fd));
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
            <h1>יצירת מודעת פרסום</h1>
            <p>העלה תמונה בולטת והגדר תוקף</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת <span className="required-asterisk">*</span></label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">עיר/אזור <span className="required-asterisk">*</span></label>
              {mapsLoaded ? (
                <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                  <input className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
                </Autocomplete>
              ) : (
                <input className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
              )}
            </div>
          </div>
          <div className="form-group">
            <div>
              <label className="form-label">תמונה <span className="required-asterisk">*</span></label>
              <ImageUploader
                multiple={false}
                file={image}
                label="בחרי תמונה"
                onAdd={(filesList) => setImage(filesList?.[0] || null)}
                onRemove={() => setImage(null)}
              />
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">תאריך התחלה <span className="required-asterisk">*</span></label>
              <input className="form-input" type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">תאריך סיום <span className="required-asterisk">*</span></label>
              <input className="form-input" type="datetime-local" value={validTo} onChange={e => setValidTo(e.target.value)} required />
            </div>
          </div>
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

export default CreatePromoAdPage;


