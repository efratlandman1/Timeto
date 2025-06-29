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

  const RequiredMark = () => <span className="required-mark"> * </span>;

  return (
    <div className="step-business-details">
      <div className="form-field-container">
        <label htmlFor="name">
          שם העסק<RequiredMark />
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={businessData.name || ''}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field-container">
        <label htmlFor="address">
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
            required
          />
        </Autocomplete>
      </div>

      <div className="form-field-container start-container">
        <label htmlFor="phonePrefix">
          טלפון<RequiredMark />
        </label>

        <div className="active-filters-container ltr-container">
          <select
            id="phonePrefix"
            name="prefix"
            value={businessData.prefix || ''}
            onChange={handleChange}
            className="narrow-select"
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
            inputMode="numeric"
            maxLength={7}
          />
        </div>
      </div>

      <div className="form-field-container">
        <label htmlFor="email">
          כתובת דואר אלקטרונית<RequiredMark />
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={businessData.email || ''}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-field-container">
        <label htmlFor="categoryId">
          תחום שירות<RequiredMark />
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={businessData.categoryId || ''}
          onChange={handleChange}
          required
        >
          <option value="">בחר תחום</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="form-field-container">
        <label htmlFor="description">תיאור העסק</label>
        <input
          type="text"
          id="description"
          name="description"
          value={businessData.description || ''}
          onChange={handleChange}
        />
      </div>

      <div className="form-field-container">
        <label htmlFor="logo">לוגו העסק</label>
        <div className="logo-container">
          <label htmlFor="logo" className="btn btn-dashed btn-primary">
            <FaUpload  />
            {'בחירת לוגו'}
            <input
              type="file"
              id="logo"
              name="logo"
              onChange={handleChange}
              style={{display: "none"}}
              accept="image/*"
            />
          </label>

          {logoPreviewUrl && (
            <div className="logo-preview-wrapper">
              <img
                src={logoPreviewUrl}
                alt="תצוגת לוגו"
                className="logo-preview"
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
    </div>
  );
};

export default StepBusinessDetails;
