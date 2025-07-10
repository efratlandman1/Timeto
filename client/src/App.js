import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import EditBusinessPage from './components/EditBusinessPage';
import UserBusinessPage from './components/UserBusinessesPage';
import AuthPage from './components/AuthPage';
// import LoginPage from './components/LoginPage';
import Header from './components/Header';
// import RegistrationPage from "./components/RegistrationPage";
import GlobalStyles from './GlobalStyles';
import SearchResultPage from './components/SearchResultPage';
import FeedbackPage from './components/FeedbackPage';
import BusinessProfilePage from './components/BusinessProfilePage';
import SuggestItemPage from './components/SuggestItemPage';
import MyFavoritesPage from './components/MyFavoritesPage';
import TermsPage from './components/TermsPage';
import AdminPanelPage from './components/AdminPanelPage';
import UserProfilePage from './components/UserProfilePage';
import ForgotPasswordPage from './components/ForgotPasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
// import SetPasswordPage from './components/SetPasswordPage';
import { useDispatch } from 'react-redux';
import { setUser } from './redux/userSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Accessibility from './components/Accessibility';
import './styles/global/index.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import { fetchUserLocation } from './redux/locationSlice';

function App() {
    const dispatch = useDispatch();
    const { i18n } = useTranslation();
    
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            dispatch(setUser(user));
        }
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchUserLocation());
    }, [dispatch]);

    // Update document direction when language changes
    useEffect(() => {
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
        document.body.style.direction = i18n.dir();
    }, [i18n.language]);

    return (
        <Router>
            <GlobalStyles />
            <div className="app" style={{ direction: i18n.dir() }}>
                <Header />
                <ToastContainer
                    position="top-center"
                    rtl={i18n.dir() === 'rtl'}
                    autoClose={3000}
                    hideProgressBar={false}
                    closeOnClick
                    pauseOnHover
                    draggable
                />
                <Routes>
                    <Route path="/" element={<MainPage />} />
                    <Route path="/business" element={<EditBusinessPage />} />
                    <Route path="/business/:id" element={<EditBusinessPage />} />
                    <Route path="/user-businesses" element={<UserBusinessPage />} />
                    <Route path="/user-favorites" element={<MyFavoritesPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    {/* <Route path="/login" element={<AuthPage />} /> */}
                    {/* <Route path="/register" element={<AuthPage />} /> */}
                    {/* <Route path="/login" element={<LoginPage />} /> */}
                    {/* <Route path="/register" element={<RegistrationPage />} /> */}
                    <Route path="/user-profile" element={<UserProfilePage />} />
                    <Route path="/search-results" element={<SearchResultPage />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/business-profile/:id" element={<BusinessProfilePage />} />
                    <Route path="/suggest-item" element={<SuggestItemPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/admin" element={<AdminPanelPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    {/* <Route path="/set-password" element={<SetPasswordPage />} /> */}
                </Routes>
                <Accessibility />
            </div>
        </Router>
    );
}

export default App;
