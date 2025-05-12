import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage';
import EditBusinessPage from './components/EditBusinessPage';
import UserBusinessPage from './components/UserBusinessesPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import RegistrationPage from "./components/RegistrationPage";
import GlobalStyles from './GlobalStyles';
import AdvancedSearchPage from './components/AdvancedSearchPage';
import SearchResultPage from './components/SearchResultPage';  // הוסף את הדף החדש
import FeedbackPage from './components/FeedbackPage' ;
import BusinessProfilePage from './components/BusinessProfilePage';



function App() {
    const getToken = () => {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('token='));
        return cookie ? cookie.split('=')[1] : null;
    };

    return (
        <Router>
            <GlobalStyles />
            <Header />
            <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/edit" element={getToken() ? <EditBusinessPage /> : <Navigate to="/login" />} />
                <Route path="/user-businesses" element={getToken() ? <UserBusinessPage /> : <Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />
                <Route path="/advanced-search-page" element={<AdvancedSearchPage />} />
                <Route path="/search-results" element={<SearchResultPage />} />
                <Route path="/feedback-page" element={<FeedbackPage />} />
                {/* <Route path="/business-profile" element={<BusinessProfilePage />} />  */}
                <Route path="/business-profile/:id" element={<BusinessProfilePage />} />
            </Routes>
        </Router>
    );
}

export default App;
