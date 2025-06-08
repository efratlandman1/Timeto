import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css'; // Reusing the same styles for a consistent look
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
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        firstName: storedUser.firstName || '',
        lastName: storedUser.lastName || '',
        email: storedUser.email || '',
        phone: storedUser.phone || '',
        nickname: storedUser.nickname || '',
        password: '',
        confirmPassword: '',
      });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
  
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('הסיסמאות אינן תואמות');
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

        const response = await axios.put(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users/${user._id}`, payload, config);
  
        // Update localStorage with the new user details
        localStorage.setItem('user', JSON.stringify(response.data));
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
            <FaPhone className="login-input-icon" />
            <input className="login-input" type="tel" name="phone" placeholder="טלפון" value={formData.phone} onChange={handleChange} required />
          </div>

          <div className="login-input-wrapper">
            <FaEnvelope className="login-input-icon" />
            <input className="login-input" type="email" name="email" placeholder="דואר אלקטרוני" value={formData.email} onChange={handleChange} required />
          </div>
          
          <div className="login-input-wrapper">
            <FaUser className="login-input-icon" />
            <input className="login-input" type="text" name="nickname" placeholder="כינוי באפליקציה" value={formData.nickname} onChange={handleChange} required />
          </div>
          
          <hr style={{width: '100%', border: '1px solid #eee', margin: '20px 0'}} />
          <p style={{textAlign: 'center', color: '#666'}}>שנה סיסמה (אופציונלי)</p>

          <div className="login-input-wrapper">
            <FaLock className="login-input-icon" />
            <input className="login-input" type={showPassword ? "text" : "password"} name="password" placeholder="סיסמה חדשה" value={formData.password} onChange={handleChange} />
            <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="login-input-wrapper">
            <FaLock className="login-input-icon" />
            <input className="login-input" type={showPassword ? "text" : "password"} name="confirmPassword" placeholder="אישור סיסמה חדשה" value={formData.confirmPassword} onChange={handleChange} />
          </div>

          <button className="login-button" type="submit">שמור שינויים</button>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage; 