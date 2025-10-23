import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser as setReduxUser } from '../redux/userSlice';
import '../styles/LoginPage.css'; // Reusing the same styles for a consistent look
import { FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getToken } from '../utils/auth';
import { toast } from 'react-toastify'; // Import toast
import { PHONE_PREFIXES, PHONE_NUMBER_MAX_LENGTH } from '../constants/globals';
import { useTranslation } from 'react-i18next';

const UserProfilePage = () => {
  const { t, ready } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phonePrefix: '',
    phone: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redirect to auth if no token (protected page)
  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate('/auth', { state: { background: { pathname: '/' } } });
    }
  }, [navigate]);
  
  useEffect(() => {
    // Load user data from Redux store
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phonePrefix: user.phonePrefix || '',
        phone: user.phone || '',
        nickname: user.nickname || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);
  
  useEffect(() => {
    // Load user data from Redux store
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phonePrefix: user.phonePrefix || '',
        phone: user.phone || '',
        nickname: user.nickname || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);
  
  // Wait for translations to load
  if (!ready) {
    return (
      <div className="narrow-page-container">
        <div className="narrow-page-content">
          <div className="loading-container">
            <span>Loading translations...</span>
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
  
    if (formData.password && formData.password.length < 8) {
      toast.error(t('userProfile.messages.passwordLength'));
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error(t('userProfile.messages.passwordMismatch'));
      return;
    }
  
    if (!user || !user.id) {
        toast.error(t('userProfile.messages.userNotFound'));
        return;
    }
  
    try {
        const token = getToken();
        const payload = { ...formData };
        if (!payload.password) {
            // Do not send password field if it's empty
            delete payload.password;
        }
        delete payload.confirmPassword; // Don't send this to the backend

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        const response = await axios.put(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users/${user.id}`, payload, config);
  
        const updatedUser = response.data.data;
        dispatch(setReduxUser(updatedUser.user));
        localStorage.setItem('user', JSON.stringify(updatedUser.user));
        
        toast.success(t('userProfile.messages.updateSuccess'));
        
        // Navigate after a short delay to allow user to see the toast
        setTimeout(() => {
            navigate('/');
        }, 1500);
      
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err.response?.data?.message || t('userProfile.messages.updateFailed');
      toast.error(errorMessage);
    }
  };

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <form className="login-form profile-form" onSubmit={handleUpdate}>
          <h1 className="login-title">{t('userProfile.title')}</h1>

          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="firstName" placeholder={t('userProfile.fields.firstName')} value={formData.firstName} onChange={handleChange} required />
          </div>

          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="lastName" placeholder={t('userProfile.fields.lastName')} value={formData.lastName} onChange={handleChange} required />
          </div>

          <div className="login-input-wrapper">
            <FaEnvelope className="login-input-icon" />
            <input className="login-input" type="email" name="email" placeholder={t('userProfile.fields.email')} value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="login-input-wrapper phone-split">
            <div className="phone-inputs-container">
              <div className="phone-prefix-wrapper">
                <FaPhone className="login-input-icon inside-prefix" />
                <select
                  name="phonePrefix"
                  value={formData.phonePrefix}
                  onChange={handleChange}
                  className={`phone-prefix-select with-icon ${!formData.phonePrefix ? 'empty' : ''}`}
                >
                  <option value="">{t('userProfile.fields.phonePrefix')}</option>
                  {PHONE_PREFIXES.map(prefix => (
                    <option key={prefix} value={prefix}>{prefix}</option>
                  ))}
                </select>
              </div>
              <input
                className="phone-number-input"
                type="text"
                name="phone"
                placeholder={t('userProfile.fields.phone')}
                value={formData.phone}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={PHONE_NUMBER_MAX_LENGTH}
              />
            </div>
          </div>
          
          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="nickname" placeholder={t('userProfile.fields.nickname')} value={formData.nickname} onChange={handleChange} required />
          </div>
          
          <hr style={{width: '100%', border: '1px solid #eee', margin: '20px 0'}} />
          <p style={{textAlign: 'center', color: '#666'}}>{t('userProfile.changePassword')}</p>

          <div className="login-input-wrapper">
            <input className="login-input" type={showPassword ? "text" : "password"} name="password" placeholder={t('userProfile.fields.password')} value={formData.password} onChange={handleChange} />
            <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="login-input-wrapper">
            <input className="login-input" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder={t('userProfile.fields.confirmPassword')} value={formData.confirmPassword} onChange={handleChange} />
            <span className="login-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="submit-button" type="submit">{t('userProfile.saveChanges')}</button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage; 