// import React, { useState } from 'react';
// import axios from 'axios';
// import { useNavigate, Link } from 'react-router-dom';
// import '../styles/LoginPage.css';
// import { FaUser, FaLock, FaClock, FaEnvelope, FaPhone, FaEye, FaEyeSlash } from 'react-icons/fa';
// import { toast } from 'react-toastify';
// import { GoogleLogin } from '@react-oauth/google';
// import { useDispatch } from 'react-redux';
// import { setUser } from '../redux/userSlice';

// const RegistrationPage = () => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     email: '',
//     phone: '',
//     username: '', // כינוי באפליקציה
//     password: '',
//     confirmPassword: '',
//   });
//   const [showPassword, setShowPassword] = useState(false);
//   const [agreeTerms, setAgreeTerms] = useState(false);
//   const navigate = useNavigate();
//   const [isLoading, setIsLoading] = useState(false);
//   const dispatch = useDispatch();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);

//     if (!agreeTerms) {
//       toast.warn('יש לאשר את תנאי השימוש כדי להמשיך');
//       setIsLoading(false);
//       return;
//     }
  
//     if (formData.password !== formData.confirmPassword) {
//       toast.error('הסיסמאות אינן תואמות');
//       setIsLoading(false);
//       return;
//     }
  
//     try {
//       // The API endpoint for registration is in usersController
//       const response = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users/register`, formData);
      
//       // On success, the backend now sends a message, not a token
//       toast.success(response.data.message);
      
//       // Optionally, redirect to login page after a delay
//       setTimeout(() => {
//         navigate('/login');
//       }, 3000);

//     } catch (err) {
//       const errorMessage = err.response?.data?.error || 'הרשמה נכשלה, נסה שוב';
//       toast.error(errorMessage);
//       console.error('Registration failed:', err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Logic from LoginPage for Google Sign-In
//   const handleGoogleLoginSuccess = async (credentialResponse) => {
//     setIsLoading(true);
//     try {
//         const response = await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/google`, {
//             tokenId: credentialResponse.credential
//         });

//         if (response.data.token && response.data.user) {
//             toast.success('התחברת בהצלחה עם גוגל!');
//             dispatch(setUser({user: response.data.user}));
//             document.cookie = `token=${response.data.token}; path=/`;
//             localStorage.setItem('user', JSON.stringify(response.data.user));
//             console.log(" document.cookie ");
//             navigate('/my-businesses');
//             console.log(" after navigate ");
//         } else {
//             toast.error('ההתחברות עם גוגל נכשלה. נסה שוב');
//         }
//     } catch (e) {
//         toast.error('התחברות גוגל נכשלה');
//     } finally {
//         setIsLoading(false);
//     }
//   };

//   const handleGoogleLoginError = () => {
//     toast.error('התחברות גוגל נכשלה');
//   };

//   return (
//     <div className="narrow-page-container">
//       <div className="narrow-page-content">
//         <form className="login-form" onSubmit={handleRegister}>
//           <FaClock className="login-logo" />
//           <h1 className="login-title">הרשמה </h1>

//           {/* שם פרטי */}
//           <div className="login-input-wrapper">
//             <FaUser className="login-input-icon" />
//             <input
//               className="login-input"
//               type="text"
//               name="firstName"
//               placeholder="שם פרטי"
//               value={formData.firstName}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {/* שם משפחה */}
//           <div className="login-input-wrapper">
//             <FaUser className="login-input-icon" />
//             <input
//               className="login-input"
//               type="text"
//               name="lastName"
//               placeholder="שם משפחה"
//               value={formData.lastName}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {/* טלפון */}
//           <div className="login-input-wrapper">
//             <FaPhone className="login-input-icon" />
//             <input
//               className="login-input"
//               type="tel"
//               name="phone"
//               placeholder="טלפון (050-1234567)"
//               pattern="05[0-9]{1}-?[0-9]{7}"
//               value={formData.phone}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {/* אימייל */}
//           <div className="login-input-wrapper">
//             <FaEnvelope className="login-input-icon" />
//             <input
//               className="login-input"
//               type="email"
//               name="email"
//               placeholder="דואר אלקטרוני"
//               value={formData.email}
//               onChange={handleChange}
//               required
//               onInvalid={(e) => e.target.setCustomValidity('אנא הזן כתובת אימייל חוקית')}
//               onInput={(e) => e.target.setCustomValidity('')}
//             />
//           </div>

//           {/* כינוי באפליקציה */}
//           <div className="login-input-wrapper">
//             <FaUser className="login-input-icon" />
//             <input
//               className="login-input"
//               type="text"
//               name="username"
//               placeholder="כינוי באפליקציה"
//               value={formData.username}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {/* סיסמה */}
//           <div className="login-input-wrapper">
//             <FaLock className="login-input-icon" />
//             <input
//               className="login-input"
//               type={showPassword ? "text" : "password"}
//               name="password"
//               placeholder="סיסמה"
//               value={formData.password}
//               onChange={handleChange}
//               required
//             />
//             <span className="login-password-toggle" onClick={() => setShowPassword(!showPassword)}>
//               {showPassword ? <FaEyeSlash /> : <FaEye />}
//             </span>
//           </div>

//           {/* אישור סיסמה */}
//           <div className="login-input-wrapper">
//             <FaLock className="login-input-icon" />
//             <input
//               className="login-input"
//               type={showPassword ? "text" : "password"}
//               name="confirmPassword"
//               placeholder="אישור סיסמה"
//               value={formData.confirmPassword}
//               onChange={handleChange}
//               required
//             />
//           </div>

//           {/* תנאי שימוש */}
//           <div className="login-checkbox">
//             <label>
//               <input
//                 type="checkbox"
//                 checked={agreeTerms}
//                 onChange={() => setAgreeTerms(!agreeTerms)}
//               />
//               אני מאשר/ת את תנאי השימוש
//             </label>
//           </div>

//           <button className="login-button" type="submit" disabled={isLoading}>
//             {isLoading ? 'רושם...' : 'הרשמה'}
//           </button>

//           <div className="login-separator">
//             <span>או</span>
//           </div>

//           <div className="google-login-container">
//             <GoogleLogin
//                 onSuccess={handleGoogleLoginSuccess}
//                 onError={handleGoogleLoginError}
//                 text="signup_with"
//                 locale="he"
//             />
//           </div>

//           <div className="login-footer">
//             <span>כבר יש לך חשבון? </span>
//             <Link to="/login">התחבר</Link>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default RegistrationPage;
