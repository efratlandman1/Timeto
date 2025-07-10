import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setUser as setReduxUser } from '../redux/userSlice';
import '../styles/LoginPage.css'; // Reusing the same styles for a consistent look
import { FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
import { getToken } from '../utils/auth';
import { toast } from 'react-toastify'; // Import toast

const phonePrefixes = [
  '050', '052', '053', '054', '055', '057', '058',
  '02', '03', '04', '08', '09',
  '072', '073', '074', '076',
].sort((a, b) => Number(a) - Number(b));

const UserProfilePage = () => {
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
  
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

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <form className="login-form" onSubmit={handleUpdate}>
          <h1 className="login-title">עריכת פרופיל</h1>

          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="firstName" placeholder="שם פרטי" value={formData.firstName} onChange={handleChange} required />
          </div>

          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="lastName" placeholder="שם משפחה" value={formData.lastName} onChange={handleChange} required />
          </div>

          <div className="login-input-wrapper">
            <FaEnvelope className="login-input-icon" />
            <input className="login-input" type="email" name="email" placeholder="דואר אלקטרוני" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="login-input-wrapper phone-split">
            <FaPhone className="login-input-icon" />
            <div className="phone-inputs-container">
              <select
                name="phonePrefix"
                value={formData.phonePrefix}
                onChange={handleChange}
                className="phone-prefix-select"
              >
                <option value="">קידומת</option>
                {phonePrefixes.map(prefix => (
                  <option key={prefix} value={prefix}>{prefix}</option>
                ))}
              </select>

              <input
                className="phone-number-input"
                type="text"
                name="phone"
                placeholder="מספר טלפון"
                value={formData.phone}
                onChange={handleChange}
                inputMode="numeric"
                maxLength={7}
              />
            </div>
          </div>
          
          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="nickname" placeholder="כינוי באפליקציה" value={formData.nickname} onChange={handleChange} required />
          </div>
          
          <hr style={{width: '100%', border: '1px solid #eee', margin: '20px 0'}} />
          <p style={{textAlign: 'center', color: '#666'}}>שנה סיסמה (אופציונלי)</p>

          <div className="login-input-wrapper">
            <input className="login-input" type={showPassword ? "text" : "password"} name="password" placeholder="סיסמה חדשה" value={formData.password} onChange={handleChange} />
            <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="login-input-wrapper">
            <input className="login-input" type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="אישור סיסמה חדשה" value={formData.confirmPassword} onChange={handleChange} />
            <span className="login-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <button className="login-button" type="submit">שמור שינויים</button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage; 