import React, { useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import { Autocomplete } from '@react-google-maps/api';
import '../styles/StepsStyle.css';

const phonePrefixes = [
  '050', '052', '053', '054', '055', '057', '058',
  '02', '03', '04', '08', '09',
  '072', '073', '074', '076',
].sort((a, b) => Number(a) - Number(b));

const StepBusinessDetails = ({ businessData, setBusinessData, categories }) => {
  const [autocomplete, setAutocomplete] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === 'logo') {
      setBusinessData(prev => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null
      }));
      return;
    }

    setBusinessData(prev => ({
      ...prev,
      [name]: value
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
          שם העסק<RequiredMark />
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
          כתובת<RequiredMark />
        </label>
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
        >
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
      </div>

      <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <label htmlFor="phonePrefix" className="form-label" style={{ flexShrink: 0, marginTop: '6px' }}>
          טלפון<RequiredMark />
        </label>

        <div style={{ display: 'flex', gap: '8px', flexGrow: 1, direction: "ltr" }}>
          <select
            id="phonePrefix"
            name="prefix"
            value={businessData.prefix || ''}
            onChange={handleChange}
            className="form-input"
            style={{ width: '80px', textAlign: 'center' }}
            required
          >
            {phonePrefixes.map(prefix => (
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
            maxLength={7}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          כתובת דואר אלקטרונית<RequiredMark />
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
          תחום שירות<RequiredMark />
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={businessData.categoryId || ''}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">בחר תחום</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">תיאור העסק</label>
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
        <label htmlFor="logo" className="btn btn-dashed btn-primary">
          <FaUpload className="icon" />
          {'בחירת לוגו'}
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
              alt="תצוגת לוגו"
              className="business-logo-preview"
              onLoad={() => {
                if (typeof businessData.logo !== 'string') {
                  URL.revokeObjectURL(logoPreviewUrl);
                }
              }}
            />
            <button
              className="btn btn-solid btn-delete btn-circle btn-sm remove-logo-button"
              onClick={removeLogo}
              title="הסר לוגו"
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
