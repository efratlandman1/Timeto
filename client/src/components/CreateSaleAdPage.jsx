import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSaleAd } from '../redux/saleAdsSlice';
import { fetchSaleCategories } from '../redux/saleCategoriesSlice';
import { getToken } from '../utils/auth';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import '../styles/EditBusinessPage.css';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { PHONE_PREFIXES, PHONE_NUMBER_MAX_LENGTH } from '../constants/globals';
import ImageUploader from './common/ImageUploader';
import ActionBar from './common/ActionBar';
import { FaArrowRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const CreateSaleAdPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: categories, loading: catLoading } = useSelector(s => s.saleCategories || { items: [], loading: false });
  const [fallbackCategories, setFallbackCategories] = useState([]);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isEditMode = Boolean(searchParams.get('edit'));
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [prefix, setPrefix] = useState('');
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('ILS');
  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [originalImages, setOriginalImages] = useState([]); // for edit mode diff
  const [auto, setAuto] = useState(null);

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
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth', { state: { background: { pathname: '/' } } });
      return;
    }
    dispatch(fetchSaleCategories());
  }, [dispatch]);

  // Fallback fetch if Redux did not populate for any reason
  useEffect(() => {
    if ((categories || []).length > 0) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/sale-categories`);
        const json = await res.json();
        const list = json?.data?.categories || [];
        if (Array.isArray(list) && list.length) setFallbackCategories(list);
      } catch {}
    })();
  }, [categories]);

  // Load for edit mode
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (!editId) return;
    const stateAd = location.state?.ad;
    if (stateAd) {
      setTitle(stateAd.title || '');
      setCity(stateAd.city || '');
      setPhone(stateAd.phone || '');
      setPrefix(stateAd.prefix || '');
      setHasWhatsapp(stateAd.hasWhatsapp !== false);
      setPrice(stateAd.price != null ? String(stateAd.price) : '');
      setCurrency(stateAd.currency || 'ILS');
      setCategoryId(stateAd.categoryId?._id || stateAd.categoryId || '');
      setDescription(stateAd.description || '');
      if (Array.isArray(stateAd.images)) {
        setImages(stateAd.images);
        setOriginalImages(stateAd.images);
      }
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/sale-ads/${editId}`);
        const json = await res.json();
        if (res.ok && json?.data?.ad) {
          const a = json.data.ad;
          setTitle(a.title || '');
          setCity(a.city || '');
          setPhone(a.phone || '');
          setPrefix(a.prefix || '');
          setHasWhatsapp(a.hasWhatsapp !== false);
          setPrice(a.price != null ? String(a.price) : '');
          setCurrency(a.currency || 'ILS');
          setCategoryId(a.categoryId?._id || a.categoryId || '');
          setDescription(a.description || '');
          if (Array.isArray(a.images)) {
            setImages(a.images);
            setOriginalImages(a.images);
          }
        }
      } catch {}
    })();
  }, [searchParams, location.state]);

  // Reset subcategory when category changes
  useEffect(() => {
    setSubCategoryId('');
    if (!categoryId) { setSubcategories([]); return; }
    // Fetch subcategories from API
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/sale-subcategories/category/${categoryId}`);
        const json = await res.json();
        setSubcategories(json?.data?.subcategories || []);
      } catch {
        setSubcategories([]);
      }
    })();
  }, [categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const editId = searchParams.get('edit');
    // Pre-submit validation
    const missing = [];
    if (!title.trim()) missing.push(t('saleAd.fields.title'));
    if (!city.trim()) missing.push(t('saleAd.fields.city'));
    if (!prefix.trim()) missing.push(t('saleAd.fields.prefix'));
    if (!phone.trim()) missing.push(t('saleAd.fields.phone'));
    if (!categoryId) missing.push(t('saleAd.fields.category'));
    if (missing.length) {
      toast.error(`נא למלא את השדות הנדרשים: ${missing.join(', ')}`, { position: 'top-center', className: 'custom-toast' });
      return;
    }
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 6) {
      toast.error(t('editBusiness.validation.phone'), { position: 'top-center', className: 'custom-toast' });
      return;
    }
    const fd = new FormData();
    fd.append('title', title);
    fd.append('city', city);
    fd.append('phone', phone);
    if (price) fd.append('price', price);
    if (currency) fd.append('currency', currency);
    if (prefix) fd.append('prefix', prefix);
    fd.append('hasWhatsapp', String(!!hasWhatsapp));
    // Prefer subcategory if selected
    if (categoryId) fd.append('categoryId', categoryId);
    if (subCategoryId) fd.append('subcategoryId', subCategoryId);
    if (description) fd.append('description', description);
    // Append only new files; existing strings are already in DB
    Array.from(images).filter(f => typeof f !== 'string').forEach(f => fd.append('images', f));
    // For edit mode, compute removed images
    if (editId) {
      const currentNames = Array.from(images).filter(f => typeof f === 'string');
      const removed = (originalImages || []).filter(name => !currentNames.includes(name));
      removed.forEach(name => fd.append('removeImages', name));
    }
    let res;
    if (editId) {
      const token = getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const putRes = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:5050/api/v1'}/sale-ads/${editId}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: fd
      });
      res = { meta: { requestStatus: putRes.ok ? 'fulfilled' : 'rejected' } };
    } else {
      res = await dispatch(createSaleAd(fd));
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
        <h1 className="login-title" style={{ textAlign: 'center', marginTop: '8px' }}>{t('saleAd.pageTitleNew')}</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('saleAd.fields.title')} <span className="required-asterisk">*</span></label>
            <input className="form-input" name="title" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <div>
              <label className="form-label">{t('saleAd.fields.city')} <span className="required-asterisk">*</span></label>
              {mapsLoaded ? (
                <Autocomplete onLoad={onAutoLoad} onPlaceChanged={onPlaceChanged}>
                  <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
                </Autocomplete>
              ) : (
                <input className="form-input" name="city" value={city} onChange={e => setCity(e.target.value)} required />
              )}
            </div>
          </div>
          <div className="form-group" style={{ display: 'flex' }}>
            <label htmlFor="phonePrefix" className="form-label" style={{ flexShrink: 0, marginTop: '6px' }}>
              {t('saleAd.fields.phone')} <span className="required-asterisk">*</span>
            </label>
            <div className="phone-row" style={{ display: 'flex', gap: '8px', flexGrow: 1, direction: 'ltr', alignItems: 'center' }}>
              <select
                id="phonePrefix"
                name="prefix"
                className="form-input phone-prefix-select"
                style={{ width: '110px', textAlign: 'center' }}
                value={prefix}
                onChange={e => setPrefix(e.target.value)}
              >
                <option value="">{t('saleAd.placeholders.prefix', 'קידומת')}</option>
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
                placeholder={t('saleAd.placeholders.phoneNumber', 'מספר')}
                required
              />
              <div className="whatsapp-inline" style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0, direction: 'rtl' }}>
                <input
                  type="checkbox"
                  id="hasWhatsapp"
                  checked={!!hasWhatsapp}
                  onChange={e => setHasWhatsapp(e.target.checked)}
                />
                <label htmlFor="hasWhatsapp" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
                  {t('saleAd.fields.hasWhatsapp')}
                </label>
              </div>
            </div>
          </div>
          <div className="form-group two-col-grid">
            <div>
            <label className="form-label">{t('saleAd.fields.price')} <span className="required-asterisk">*</span></label>
              <input className="form-input" name="price" value={price} onChange={e => setPrice(e.target.value)} />
            </div>
            <div>
            <label className="form-label">{t('saleAd.fields.currency')} <span className="required-asterisk">*</span></label>
              <select className="form-select" value={currency} onChange={e => setCurrency(e.target.value)}>
                <option value="ILS">₪ ILS</option>
                <option value="USD">$ USD</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('saleAd.fields.category')} <span className="required-asterisk">*</span></label>
            <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)} disabled={catLoading}>
              <option value="">{t('saleAd.placeholders.selectCategory')}</option>
              {(categories.length ? categories : fallbackCategories).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          {/* Subcategory (if exists) */}
          {categoryId && subcategories.length > 0 && (
            <div className="form-group">
              <label className="form-label">תת קטגוריה</label>
              <select className="form-select" value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)}>
                <option value="">{t('saleAd.placeholders.selectCategory')}</option>
                {subcategories.map(sc => (
                  <option key={sc._id} value={sc._id}>{sc.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('saleAd.fields.description')}</label>
            <textarea className="form-input" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <ImageUploader
            multiple
            files={Array.from(images || [])}
            label={t('saleAd.fields.images')}
            onAdd={(filesList) => setImages(prev => {
              const prevArr = Array.isArray(prev) ? prev : Array.from(prev || []);
              const nextArr = Array.from(filesList || []);
              return [...prevArr, ...nextArr];
            })}
            onRemove={(idx) => {
              const arr = Array.from(images || []);
              arr.splice(idx, 1);
              // Note: FileList is read-only; keep as array for previews and append in submit
              setImages(arr);
            }}
          />
          <ActionBar
          onCancel={() => {
            const editId = searchParams.get('edit');
            if (editId) navigate('/user-businesses'); else navigate('/');
          }}
            onConfirm={handleSubmit}
            cancelText={t('saleAd.actions.cancel')}
          confirmText={searchParams.get('edit') ? t('saleAd.actions.save') : t('saleAd.actions.publish')}
          />
        </form>
      </div>
    </div>
  );
};

export default CreateSaleAdPage;


