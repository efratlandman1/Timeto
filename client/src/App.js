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
import SearchResultPage from './components/SearchResultPage';
import FeedbackPage from './components/FeedbackPage' ;
import BusinessProfilePage from './components/BusinessProfilePage';
import { useDispatch } from 'react-redux';
import { setUser } from './redux/userSlice';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const dispatch = useDispatch();
    // Handle represh
    let user = JSON.parse(localStorage.getItem('user'));
    if (user) {
         dispatch(setUser({user: user}));
    }

    return (
        <Router>
            <GlobalStyles />
            <Header />
            <ToastContainer
                position="top-center"
                rtl={true}
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
                <Route path="/user-businesses" element={<UserBusinessPage />} />
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
