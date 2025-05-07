import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/LoginPage.css';
import { FaUser, FaLock, FaClock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';

const RegistrationPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '', // כינוי באפליקציה
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

//   const handleRegister = async (e) => {
    const handleRegister = async (e) => {
        e.preventDefault();
      
        if (!agreeTerms) {
          alert('יש לאשר את תנאי השימוש כדי להמשיך');
          return;
        }
      
        if (formData.password !== formData.confirmPassword) {
          alert('הסיסמאות אינן תואמות');
          return;
        }
      
        try {
          const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/register', formData);
      
          if (response.data.token && response.data.user) {
            // שמירה ב-localStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
      
            navigate('/user-businesses');  // או כל דף אחר שתרצה
          } else {
            alert('הרשמה נכשלה, נסה שוב');
          }
        } catch (err) {
          console.error('Registration failed:', err);
          alert('הרשמה נכשלה, נסה שוב');
        }
      };
      

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleRegister}>
        <FaClock className="login-logo" />
        <h1 className="login-title">זה הזמן</h1>

        {/* שם פרטי */}
        <div className="login-input-wrapper">
          <FaUser className="login-input-icon" />
          <input
            className="login-input"
            type="text"
            name="firstName"
            placeholder="שם פרטי"
            value={formData.firstName}
            onChange={handleChange}
            required
          />
        </div>

        {/* שם משפחה */}
        <div className="login-input-wrapper">
          <FaUser className="login-input-icon" />
          <input
            className="login-input"
            type="text"
            name="lastName"
            placeholder="שם משפחה"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </div>

        {/* טלפון */}
        <div className="login-input-wrapper">
          <FaPhone className="login-input-icon" />
          <input
            className="login-input"
            type="tel"
            name="phone"
            placeholder="טלפון (050-1234567)"
            pattern="05[0-9]{1}-?[0-9]{7}"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        {/* אימייל */}
        <div className="login-input-wrapper">
          <FaEnvelope className="login-input-icon" />
          <input
            className="login-input"
            type="email"
            name="email"
            placeholder="דואר אלקטרוני"
            value={formData.email}
            onChange={handleChange}
            required
            onInvalid={(e) => e.target.setCustomValidity('אנא הזן כתובת אימייל חוקית')}
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </div>

        {/* כינוי באפליקציה */}
        <div className="login-input-wrapper">
          <FaUser className="login-input-icon" />
          <input
            className="login-input"
            type="text"
            name="username"
            placeholder="כינוי באפליקציה"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>

        {/* סיסמה */}
        <div className="login-input-wrapper">
          <FaLock className="login-input-icon" />
          <input
            className="login-input"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="סיסמה"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        {/* אישור סיסמה */}
        <div className="login-input-wrapper">
          <FaLock className="login-input-icon" />
          <input
            className="login-input"
            type={showPassword ? "text" : "password"}
            name="confirmPassword"
            placeholder="אישור סיסמה"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {/* תנאי שימוש */}
        <div className="login-checkbox">
          <label>
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={() => setAgreeTerms(!agreeTerms)}
            />
            אני מאשר/ת את תנאי השימוש
          </label>
        </div>

        <button className="login-button" type="submit">הרשמה</button>
      </form>
    </div>
  );
};

export default RegistrationPage;
