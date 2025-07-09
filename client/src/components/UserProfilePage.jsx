import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser as setReduxUser } from '../redux/userSlice';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getToken } from '../utils/auth';
import { toast } from 'react-toastify'; // Import toast

const UserProfilePage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nickname: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from Redux store
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        nickname: user.nickname || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
  
    if (formData.password && formData.password.length < 8) {
      toast.error('הסיסמה חייבת להכיל לפחות 8 תווים.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
  
    if (!user || !user.id) {
        toast.error('לא ניתן לעדכן פרופיל, משתמש לא זוהה.');
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
  
        const updatedUser = response.data;
        dispatch(setReduxUser(updatedUser.user));
        localStorage.setItem('user', JSON.stringify(updatedUser.user));
        
        toast.success('הפרופיל עודכן בהצלחה');
        
        // Navigate after a short delay to allow user to see the toast
        setTimeout(() => {
            navigate('/');
        }, 1500);
      
    } catch (err) {
      console.error('Update failed:', err);
      const errorMessage = err.response?.data?.message || 'עדכון הפרופיל נכשל, נסה שוב';
      toast.error(errorMessage);
    }
  };

  const RequiredMark = () => <span className="required-mark"> * </span>;

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        

         <div className="page-header">
            {/* <div className="page-header__content vertical"> */}
              <h1>עריכת פרופיל</h1>
            {/* </div> */}
          </div>

        <div className="form-field-container">
          <label htmlFor="firstName">
            שם פרטי<RequiredMark />
          </label>
          <div className="input-with-icon-container">
            <FaUser className="input-icon" />
            <input 
              type="text" 
              id="firstName"
              name="firstName" 
              placeholder="שם פרטי" 
              value={formData.firstName} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-field-container">
          <label htmlFor="lastName">
            שם משפחה<RequiredMark />
          </label>
          <div className="input-with-icon-container">
            <FaUser className="input-icon" />
            <input 
              type="text" 
              id="lastName"
              name="lastName" 
              placeholder="שם משפחה" 
              value={formData.lastName} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-field-container">
          <label htmlFor="phone">
            טלפון<RequiredMark />
          </label>
          <div className="input-with-icon-container">
            <FaPhone className="input-icon" />
            <input 
              type="tel" 
              id="phone"
              name="phone" 
              placeholder="טלפון" 
              value={formData.phone} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>

        <div className="form-field-container">
          <label htmlFor="email">
            דואר אלקטרוני<RequiredMark />
          </label>
          <div className="input-with-icon-container">
            <FaEnvelope className="input-icon" />
            <input 
              type="email" 
              id="email"
              name="email" 
              placeholder="דואר אלקטרוני" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <div className="form-field-container">
          <label htmlFor="nickname">
            כינוי באפליקציה<RequiredMark />
          </label>
          <div className="input-with-icon-container">
            <FaUser className="input-icon" />
            <input 
              type="text" 
              id="nickname"
              name="nickname" 
              placeholder="כינוי באפליקציה" 
              value={formData.nickname} 
              onChange={handleChange} 
              required 
            />
          </div>
        </div>
        
        <hr/>
        <p>שנה סיסמה (אופציונלי)</p>

        <div className="form-field-container">
          <label htmlFor="password">
            סיסמה חדשה
          </label>
          <div className="input-with-icon-container">
            <input 
              type={showPassword ? "text" : "password"} 
              id="password"
              name="password" 
              placeholder="סיסמה חדשה" 
              value={formData.password} 
              onChange={handleChange} 
            />
            <span className="input-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <div className="form-field-container">
          <label htmlFor="confirmPassword">
            אישור סיסמה חדשה
          </label>
          <div className="input-with-icon-container">
            <input 
              type={showPassword ? "text" : "password"} 
              id="confirmPassword"
              name="confirmPassword" 
              placeholder="אישור סיסמה חדשה" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
            />
            <span className="input-icon" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
        </div>

        <div className="actions-container">
          <button 
            className="btn btn-solid btn-primary" 
            type="button"
            onClick={handleUpdate}
          >
            שמור שינויים
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 