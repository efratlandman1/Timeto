import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import EditBusinessPage from './components/EditBusinessPage';
import UserBusinessPage from './components/UserBusinessesPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import RegistrationPage from "./components/RegistrationPage";
import GlobalStyles from './GlobalStyles';
import SearchResultPage from './components/SearchResultPage';
import FeedbackPage from './components/FeedbackPage';
import BusinessProfilePage from './components/BusinessProfilePage';
import SuggestItemPage from './components/SuggestItemPage';
import MyFavoritesPage from './components/MyFavoritesPage';
import TermsPage from './components/TermsPage';
import { useDispatch } from 'react-redux';
import { setUser } from './redux/userSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Accessibility from './components/Accessibility';
import './styles/global/index.css';
import './i18n';
import { useTranslation } from 'react-i18next';

function App() {
    const dispatch = useDispatch();
    const { i18n } = useTranslation();
    
    // Handle refresh
    let user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        dispatch(setUser({user: user}));
    }

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
                    <Route path="/edit" element={<EditBusinessPage />} />
                    <Route path="/edit/:id" element={<EditBusinessPage />} />
                    <Route path="/my-businesses" element={<UserBusinessPage />} />
                    <Route path="/my-favorites" element={<MyFavoritesPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegistrationPage />} />
                    <Route path="/search-results" element={<SearchResultPage />} />
                    <Route path="/feedback-page" element={<FeedbackPage />} />
                    <Route path="/business-profile/:id" element={<BusinessProfilePage />} />
                    <Route path="/suggest" element={<SuggestItemPage />} />
                    <Route path="/terms" element={<TermsPage />} />
                </Routes>
                <Accessibility />
            </div>
        </Router>
    );
}

export default App;
