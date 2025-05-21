import React, { useState, useEffect } from 'react';
import { FaSave, FaEdit, FaUpload } from 'react-icons/fa';
import '../styles/StepsStyle.css';

const StepBusinessDetails = ({ businessData, setBusinessData, categories }) => {
  const [errors, setErrors] = useState({
    phone: '',
    email: '',
  });

  // בדיקת תקינות טלפון (כמו בדף הרישום)
  const validatePhone = (phone) => {
    const phoneRegex = /^05[0-9]{1}-?[0-9]{7}$/;
    return phoneRegex.test(phone);
  };

  // בדיקת תקינות אימייל סטנדרטית
  const validateEmail = (email) => {
    // שימוש ב-HTML5 דיפולטיבי דרך onInvalid הוא אפשרות, אבל פה עושים בדיקה ידנית
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setBusinessData(prev => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null
      }));
      // ניקוי שגיאות במקרה ונבחר לוגו חדש
      setErrors(prev => ({ ...prev, logo: '' }));
    } else {
      setBusinessData(prev => ({
        ...prev,
        [name]: value
      }));
      // אם המשתמש משנה טלפון או אימייל, מנקים שגיאה קודם
      if (name === 'phone' || name === 'email') {
        setErrors(prev => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === 'phone' && value) {
      if (!validatePhone(value)) {
        setErrors(prev => ({ ...prev, phone: 'נא להזין טלפון תקין בפורמט 05X-XXXXXXX' }));
      } else {
        setErrors(prev => ({ ...prev, phone: '' }));
      }
    }
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        setErrors(prev => ({ ...prev, email: 'נא להזין כתובת אימייל תקינה' }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    }
  };

  const removeLogo = () => {
    setBusinessData(prev => ({
      ...prev,
      logo: null
    }));
  };

  // יצירת URL זמני לתצוגת הלוגו (קובץ חדש)
  const logoPreviewUrl = businessData.logo
    ? (typeof businessData.logo === 'string'
        ? `${process.env.REACT_APP_API_DOMAIN}${businessData.logo.replace('/app/config', '')}`
        : URL.createObjectURL(businessData.logo))
    : null;

  // כוכבית אדומה לשדות חובה
  const RequiredMark = () => <span style={{ color: 'red', marginLeft: 4 }}>*</span>;

  return (
    <div className="step-business-details">
      <h1 className="step-title">פרטי העסק</h1>

      <div className="form-group">
        <label htmlFor="name" className="form-label">
          שם העסק<RequiredMark />
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={businessData.name}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="address" className="form-label">
          כתובת<RequiredMark />
        </label>
        <input
          type="text"
          id="address"
          name="address"
          value={businessData.address}
          onChange={handleChange}
          className="form-input"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">
          טלפון<RequiredMark />
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={businessData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input"
          required
          placeholder="051-234567"
        />
        {errors.phone && <div className="input-error">{errors.phone}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          כתובת דואר אלקטרונית<RequiredMark />
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={businessData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          className="form-input"
          required
          placeholder="example@mail.com"
        />
        {errors.email && <div className="input-error">{errors.email}</div>}
      </div>

      <div className="form-group">
        <label htmlFor="categoryId" className="form-label">
          תחום שירות<RequiredMark />
        </label>
        <select
          id="categoryId"
          name="categoryId"
          value={businessData.categoryId}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">בחר תחום</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">תיאור העסק</label>
        <input
          type="text"
          id="description"
          name="description"
          value={businessData.description}
          onChange={handleChange}
          className="form-input"
        />
      </div>

      <div className="form-group-logo">
        <label htmlFor="logo" className="button file-upload">
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
                className="remove-logo-button"
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
