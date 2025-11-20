import React, { useState, useEffect, useRef } from 'react';
import { FaStar, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import '../styles/SuggestItemPage.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
const GOOGLE_LIBRARIES = ['places'];

const MAX_DISTANCE_KM = 1000;

const AdvancedSearchModal = ({ isOpen, onClose, filters, onFilterChange }) => {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState([]); // business categories
  const [saleCategories, setSaleCategories] = useState([]); // sale ad categories
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSaleSubId, setSelectedSaleSubId] = useState('');
  const [saleSubcategories, setSaleSubcategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [services, setServices] = useState([]);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [distance, setDistance] = useState(0);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [city, setCity] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [addedWithin, setAddedWithin] = useState('');
  const [includeNoPrice, setIncludeNoPrice] = useState(false);
  const cityAutoRef = useRef(null);
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_LIBRARIES,
    language: 'he',
    region: 'IL'
  });
  const navigate = useNavigate();
  const location = useLocation();
  const prevCategoryRef = useRef('');

  // Reset all selections when modal is opened
  useEffect(() => {
    if (isOpen) {
      setSelectedCategory('');
      setSelectedServices([]);
      setRating(0);
      setHoveredRating(0);
      setDistance(0);
      setPriceMin('');
      setPriceMax('');
      setCity('');
      setOpenNow(false);
      
      setAddedWithin('');
      setIncludeNoPrice(false);
      // Freeze background scroll while modal is open
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedCategory && prevCategoryRef.current !== selectedCategory) {
      setSelectedServices([]);  // מנקה שירותים כשקטגוריה משתנה
      prevCategoryRef.current = selectedCategory;
      setSelectedSaleSubId('');
      const saleCat = (saleCategories || []).find(sc => sc.name === selectedCategory);
      if (saleCat?._id) {
        (async () => {
          try {
            const res = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-subcategories/category/${saleCat._id}`);
            setSaleSubcategories(res.data?.data?.subcategories || []);
          } catch {
            setSaleSubcategories([]);
          }
        })();
      } else {
        setSaleSubcategories([]);
      }
    }
  }, [selectedCategory]);
  
  useEffect(() => {
    const fetchBoth = async () => {
      try {
        const [bizRes, saleRes] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`),
          axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-categories`).catch(() => ({ data: { data: { categories: [] } } }))
        ]);
        setCategories(bizRes.data?.data?.categories || []);
        setSaleCategories(saleRes.data?.data?.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchBoth();
  }, []);

  useEffect(() => {
    if (!selectedCategory) { setServices([]); return; }
    const category = categories.find(c => c.name === selectedCategory);
    // Only business categories have services to fetch
    if (!category) { setServices([]); return; }
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/byCategory/${category._id}`);
        setServices(response.data.data.services || []);
      } catch (error) {
        console.error('Error fetching services:', error);
        setServices([]);
      }
    };
    fetchServices();
  }, [selectedCategory, categories]);
 
  useEffect(() => {
    if (services.length > 0 && filters?.services) {
      const servicesList = Array.isArray(filters.services) 
        ? filters.services 
        : filters.services.split(',');
        
      // בודקים שרק השירותים שקיימים באמת ב-services יישארו
      const validServices = servicesList.filter(s => services.some(service => service.name === s));
      setSelectedServices(validServices);
    }
  }, [services, filters]);
  
  useEffect(() => {
    if (filters) {
      if (filters.categoryName) {
        setSelectedCategory(filters.categoryName);
      }
      if (filters.city) setCity(filters.city);
      if (filters.priceMin) setPriceMin(filters.priceMin);
      if (filters.priceMax) setPriceMax(filters.priceMax);
      if (filters.openNow) setOpenNow(filters.openNow === 'true' || filters.openNow === true);
      
      if (filters.addedWithin) setAddedWithin(filters.addedWithin);
      if (filters.includeNoPrice) setIncludeNoPrice(filters.includeNoPrice === 'true' || filters.includeNoPrice === true);
      // if (filters.services) {
      //   // Handle both string and array formats from URL
      //   const servicesList = Array.isArray(filters.services) 
      //     ? filters.services 
      //     : filters.services.split(',');
      //   setSelectedServices(servicesList);
      // }
      if (filters.rating) {
        setRating(parseInt(filters.rating));
      }
      if (filters.maxDistance) {
        setDistance(Number(filters.maxDistance));
      }
    }
  }, [filters]);

  const handleServiceClick = (serviceName) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceName)) {
        return prev.filter(s => s !== serviceName);
      }
      return [...prev, serviceName];
    });
  };

  const handleClearAll = () => {
    setSelectedCategory('');
    setSelectedServices([]);
    setRating(0);
    setHoveredRating(0);
    setDistance(0);
    setPriceMin('');
    setPriceMax('');
    setCity('');
    setOpenNow(false);
    
    setAddedWithin('');
  };

  const handleSubmit = () => {
    const currentParams = new URLSearchParams(location.search);
    const newParams = new URLSearchParams();
    const searchQuery = currentParams.get('q');
    const sortParam = currentParams.get('sort');
    if (searchQuery) newParams.set('q', searchQuery);
    if (sortParam) newParams.set('sort', sortParam);
    if (selectedCategory) {
      newParams.set('categoryName', selectedCategory);
      // If selectedCategory is a sale category, also include saleCategoryId for server-side filtering
      const saleCat = (saleCategories || []).find(sc => sc.name === selectedCategory);
      if (selectedSaleSubId) newParams.set('saleSubcategoryId', selectedSaleSubId);
      else if (saleCat?._id) newParams.set('saleCategoryId', saleCat._id);
      else {
        newParams.delete('saleCategoryId');
        newParams.delete('saleSubcategoryId');
      }
    } else {
      newParams.delete('saleCategoryId');
      newParams.delete('saleSubcategoryId');
    }
    selectedServices.forEach(service => newParams.append('services', service));
    if (rating > 0) newParams.set('rating', rating.toString());
    if (distance > 0) newParams.set('maxDistance', distance.toString());
    if (priceMin) newParams.set('priceMin', priceMin);
    if (priceMax) newParams.set('priceMax', priceMax);
    if (city) newParams.set('city', city);
    if (openNow) newParams.set('openNow', 'true');
    if (addedWithin) newParams.set('addedWithin', addedWithin);
    if (includeNoPrice) newParams.set('includeNoPrice', 'true');
    navigate({ pathname: location.pathname, search: newParams.toString() });
    onClose();
  };

  const renderStarRating = () => {
    return (
      <div className="rating-selector">
        <div className="rating-stars-row">
          <div className="stars-wrapper">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`rating-star ${star <= (hoveredRating || rating) ? 'active' : ''}`}
                onClick={() => setRating(star === rating ? 0 : star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-fixed" onClick={onClose}>
      <div className="modal-container suggest-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose} aria-label={t('advancedSearch.buttons.cancel')}>
            <FaTimes />
          </button>
          <h1 className="login-title suggest-modal-title">{t('advancedSearch.title')}</h1>
        </div>

        <div className="modal-scroll-content">
          <div className="form-group">
            <label>{t('advancedSearch.category.title')}</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-select"
            >
              <option value="">{t('advancedSearch.category.select')}</option>
              {categories?.length > 0 && (
                <optgroup label={t('advancedSearch.categories.business') || 'עסקים'}>
                  {categories.map((cat) => (
                    <option key={`biz-${cat._id}`} value={cat.name}>{cat.name}</option>
                  ))}
                </optgroup>
              )}
              {saleCategories?.length > 0 && (
                <optgroup label={t('advancedSearch.categories.sale') || 'מכירה'}>
                  {saleCategories.map((cat) => (
                    <option key={`sale-${cat._id || cat.name}`} value={cat.name}>{cat.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* Sale subcategories from dedicated collection */}
          {saleSubcategories.length > 0 && (
            <div className="form-group">
              <label>תת קטגוריה</label>
              <select className="form-select" value={selectedSaleSubId} onChange={(e) => setSelectedSaleSubId(e.target.value)}>
                <option value="">{t('advancedSearch.category.select')}</option>
                {saleSubcategories.map(sc => (
                  <option key={`sale-sub-${sc._id}`} value={sc._id}>{sc.name}</option>
                ))}
              </select>
            </div>
          )}

          {services.length > 0 && (
            <div className="form-group tags-section">
              <label>{t('advancedSearch.services.title')}</label>
              <div className="tags-container">
                {services.map((service) => (
                  <div
                    key={service._id}
                    className={`tag selectable ${selectedServices.includes(service.name) ? 'selected' : ''}`}
                    onClick={() => handleServiceClick(service.name)}
                  >
                    {service.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* City */}
          <div className="form-group">
            <label>{t('advancedSearch.city') || 'עיר'}</label>
            {mapsLoaded ? (
              <Autocomplete
                onLoad={(ac) => { cityAutoRef.current = ac; }}
                onPlaceChanged={() => {
                  const place = cityAutoRef.current?.getPlace();
                  if (!place) return;
                  const comp = place.address_components || [];
                  const cityComp = comp.find(c => c.types.includes('locality')) || comp.find(c => c.types.includes('administrative_area_level_2')) || comp.find(c => c.types.includes('administrative_area_level_1'));
                  setCity(cityComp?.long_name || place.name || '');
                }}
                options={{ types: ['(cities)'], componentRestrictions: { country: 'il' } }}
              >
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t('advancedSearch.cityPlaceholder') || 'לדוגמה: תל אביב'}
                />
              </Autocomplete>
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('advancedSearch.cityPlaceholder') || 'לדוגמה: תל אביב'}
              />
            )}
          </div>

          {/* Price range */}
          <div className="form-group">
            <label>{t('advancedSearch.priceRange') || 'טווח מחיר'}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                placeholder={t('advancedSearch.min') || 'מינימום'}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder={t('advancedSearch.max') || 'מקסימום'}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
              <label className="radio-label" style={{ margin: 0 }}>
                <input type="checkbox" checked={includeNoPrice} onChange={(e)=>setIncludeNoPrice(e.target.checked)} /> {t('advancedSearch.includeNoPrice') || 'כלול גם ללא מחיר'}
              </label>
            </div>
          </div>

          {/* Open now only - inline label + checkbox */}
          <label className="radio-label" style={{ marginInline: '1.25rem' }}>
            <input
              type="checkbox"
              checked={openNow}
              onChange={(e) => setOpenNow(e.target.checked)}
              aria-label={t('advancedSearch.openNow') || 'פתוח עכשיו'}
            />
            {t('advancedSearch.openNow') || 'פתוח עכשיו'}
          </label>

          {/* Added within */}
          <div className="form-group">
            <label>{t('advancedSearch.addedWithin') || 'נוספו ב־'}</label>
            <select value={addedWithin} onChange={(e) => setAddedWithin(e.target.value)} className="form-select">
              <option value="">{t('advancedSearch.anytime') || 'כל הזמן'}</option>
              <option value="7d">{t('advancedSearch.last7d') || '7 הימים האחרונים'}</option>
              <option value="30d">{t('advancedSearch.last30d') || '30 הימים האחרונים'}</option>
            </select>
          </div>

          <div className="form-group">
            <label>{t('advancedSearch.rating.title')}</label>
            {renderStarRating()}
          </div>
          <div className="form-group">
            <label htmlFor="distance-slider">{t('advancedSearch.distance.title')}</label>
            <div className="distance-slider-row">
              <input
                id="distance-slider"
                type="range"
                min={0}
                max={MAX_DISTANCE_KM}
                value={distance}
                onChange={e => setDistance(Number(e.target.value))}
                step={1}
              />
              <span className="distance-value">{distance} {t('advancedSearch.distance.km')}</span>
            </div>
          </div>
        </div>

        <div className="button-row fullwidth" style={{ gap: '8px' }}>
          <button className="submit-button clean-full secondary" onClick={handleClearAll}>{t('advancedSearch.buttons.clear')}</button>
          <button className="submit-button clean-full" onClick={handleSubmit}>{t('advancedSearch.buttons.apply')}</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal; 