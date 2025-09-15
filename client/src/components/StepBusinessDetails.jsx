import React, { useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import { Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import '../styles/StepsStyle.css';
import { PHONE_PREFIXES, PHONE_NUMBER_MAX_LENGTH } from '../constants/globals';
import { useTranslation } from 'react-i18next';

const StepBusinessDetails = ({ businessData, setBusinessData, categories }) => {
  const { t } = useTranslation();
  const [autocomplete, setAutocomplete] = useState(null);
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-maps-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places']
  });


  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (name === 'logo') {
      setBusinessData(prev => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null
      }));
      return;
    }

    setBusinessData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const onLoad = (autocomplete) => {
    setAutocomplete(autocomplete);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setBusinessData(prev => ({
          ...prev,
          address: place.formatted_address
        }));
      }
    }
  };

  const removeLogo = () => {
    setBusinessData(prev => ({
      ...prev,
      logo: null
    }));
  };

  const logoPreviewUrl = businessData.logo
    ? (typeof businessData.logo === 'string'
        ? `${process.env.REACT_APP_API_DOMAIN}${businessData.logo.replace('/app/config', '')}`
        : URL.createObjectURL(businessData.logo))
    : null;

  const RequiredMark = () => <span style={{ color: 'red', marginLeft: 4 }}> * </span>;

  return (
    <div className="step-business-details">
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          {t('businessForm.fields.name')}<RequiredMark />
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={businessData.name || ''}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      

      <div className="form-group">
        <label htmlFor="address" className="form-label">
          {t('businessForm.fields.address')}<RequiredMark />
        </label>
        {mapsLoaded ? (
          <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
            <input
              type="text"
              id="address"
              name="address"
              value={businessData.address || ''}
              onChange={handleChange}
              className="form-input"
              required
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            id="address"
            name="address"
            value={businessData.address || ''}
            onChange={handleChange}
            className="form-input"
            required
          />
        )}
      </div>

      <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <label htmlFor="phonePrefix" className="form-label" style={{ flexShrink: 0, marginTop: '6px' }}>
          {t('businessForm.fields.phone')}<RequiredMark />
        </label>

        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, direction: "ltr", alignItems: 'center' }}>
          <select
            id="phonePrefix"
            name="prefix"
            value={businessData.prefix || ''}
            onChange={handleChange}
            className="form-input"
            style={{ width: '80px', textAlign: 'center' }}
            required
          >
            <option value="">{t('common.select')}</option>
            {PHONE_PREFIXES.map(prefix => (
              <option key={prefix} value={prefix}>{prefix}</option>
            ))}
          </select>

          <input
            type="text"
            id="phone"
            name="phone"
            value={businessData.phone || ''}
            onChange={handleChange}
            className="form-input"
            style={{ flexGrow: 1 }}
            inputMode="numeric"
            maxLength={PHONE_NUMBER_MAX_LENGTH}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', flexShrink: 0, direction: 'rtl' }}>
            <input
              type="checkbox"
              id="hasWhatsapp"
              name="hasWhatsapp"
              checked={!!businessData.hasWhatsapp}
              onChange={handleChange}
            />
            <label htmlFor="hasWhatsapp" className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>
              {t('businessForm.fields.hasWhatsapp')}
            </label>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          {t('businessForm.fields.email')}<RequiredMark />
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={businessData.email || ''}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="categoryId" className="form-label">
          {t('businessForm.fields.category')}<RequiredMark />
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={businessData.categoryId || ''}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">{t('businessForm.fields.selectCategory')}</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">{t('businessForm.fields.description')}</label>
        <input
          type="text"
          id="description"
          name="description"
          value={businessData.description || ''}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="form-group-logo">
        <label htmlFor="logo" className="button file-upload">
          <FaUpload className="icon" />
          {t('businessForm.logo.selectLogo')}
          <input
            type="file"
            id="logo"
            name="logo"
            onChange={handleChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
        </label>

        {logoPreviewUrl && (
          <div className="logo-preview-wrapper">
            <img
              src={logoPreviewUrl}
              alt={t('businessForm.logo.logoPreview')}
              className="business-logo-preview"
              onLoad={() => {
                if (typeof businessData.logo !== 'string') {
                  URL.revokeObjectURL(logoPreviewUrl);
                }
              }}
            />
            <button
              className="remove-logo-button"
              onClick={removeLogo}
              title={t('businessForm.logo.removeLogo')}
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StepBusinessDetails;
