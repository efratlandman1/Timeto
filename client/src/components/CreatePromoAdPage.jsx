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

const CreatePromoAdPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [image, setImage] = useState(null);
  const [auto, setAuto] = useState(null);
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
    if (auto) {
      const place = auto.getPlace();
      const value = place?.formatted_address || place?.name || '';
      if (value) setCity(value);
    }
  };

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
        }
      } catch {}
    })();
  }, [searchParams, location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', title);
    fd.append('city', city);
    fd.append('validFrom', validFrom);
    fd.append('validTo', validTo);
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
      if (editId) navigate('/user-businesses'); else navigate('/');
    }
  };

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <button className="nav-button above-header" onClick={() => {
          if (isEditMode) navigate('/user-businesses'); else navigate('/');
        }}>
          <FaArrowRight className="icon" />
          {isEditMode ? 'חזרה לעסקים שלי' : 'חזרה לעמוד הבית'}
        </button>
        <h1 className="login-title" style={{ textAlign: 'center', marginTop: '8px' }}>הוספת מודעת פרסום</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">כותרת <span className="required-asterisk">*</span></label>
            <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group two-col-grid">
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
          <div className="form-group two-col-grid date-grid">
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
            onCancel={() => {
              const editId = searchParams.get('edit');
              if (editId) navigate('/user-businesses'); else navigate('/');
            }}
            onConfirm={handleSubmit}
            cancelText="ביטול"
            confirmText={searchParams.get('edit') ? 'שמור' : 'פרסם'}
          />
        </form>
      </div>
    </div>
  );
};

export default CreatePromoAdPage;


