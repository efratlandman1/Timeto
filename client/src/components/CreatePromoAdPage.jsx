import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createPromoAd } from '../redux/promoAdsSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/EditBusinessPage.css';

const CreatePromoAdPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [image, setImage] = useState(null);

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
        <div className="page-header">
          <div className="page-header__content vertical">
            <h1>יצירת מודעת פרסום</h1>
            <p>העלה תמונה בולטת והגדר תוקף</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת *</label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">עיר/אזור *</label>
              <input className="form-input" value={city} onChange={e => setCity(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">תמונה *</label>
              <input className="form-input" type="file" accept="image/*" onChange={e => setImage(e.target.files?.[0] || null)} required />
            </div>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="form-label">תאריך התחלה *</label>
              <input className="form-input" type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} required />
            </div>
            <div>
              <label className="form-label">תאריך סיום *</label>
              <input className="form-input" type="datetime-local" value={validTo} onChange={e => setValidTo(e.target.value)} required />
            </div>
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

export default CreatePromoAdPage;


