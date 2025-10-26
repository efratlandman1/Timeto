import React, { useState } from 'react';
import { FaSearch, FaHome, FaPlus } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CreateOptionsModal from './CreateOptionsModal';
import '../styles/MobileBottomNav.css';

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleSearchClick = () => {
    navigate('/search-results');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handlePlusClick = () => {
    setShowCreateModal(true);
  };

  return (
    <>
      <div className="mobile-bottom-nav">
        <button 
          className={`nav-item ${isActive('/search-results') ? 'active' : ''}`}
          onClick={handleSearchClick}
          aria-label={t('search.search')}
        >
          <FaSearch className="nav-icon" />
        </button>
        
        <button 
          className={`nav-item ${isActive('/') ? 'active' : ''}`}
          onClick={handleHomeClick}
          aria-label={t('mainPage.title')}
        >
          <FaHome className="nav-icon" />
        </button>
        
        <button 
          className="nav-item"
          onClick={handlePlusClick}
          aria-label={t('common.create')}
        >
          <FaPlus className="nav-icon" />
        </button>
      </div>
      
      <CreateOptionsModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </>
  );
};

export default MobileBottomNav;
