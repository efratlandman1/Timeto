import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './components/MainPage';
import UploadPage from './components/UploadPage';
import UserItemsPage from './components/UserItemsPage';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import RegistrationPage from "./components/RegistrationPage";
import GlobalStyles from './GlobalStyles';

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
                <Route path="/upload" element={getToken() ? <UploadPage /> : <Navigate to="/login" />} />
                <Route path="/user-items" element={getToken() ? <UserItemsPage /> : <Navigate to="/login" />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegistrationPage />} />
            </Routes>
        </Router>
    );
}

export default App;
