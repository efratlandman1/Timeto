import React, { useState } from 'react';
import { FaSearch, FaHome, FaPlus, FaArrowAltCircleDown } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CreateOptionsModal from './CreateOptionsModal';
import '../styles/MobileBottomNav.css';

const MobileBottomNav = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const deferredRef = React.useRef(null);

  React.useEffect(() => {
    const isStandalone = () => {
      const mql = window.matchMedia('(display-mode: standalone)');
      return mql.matches || window.navigator.standalone === true;
    };
    if (window.__deferredPWAInstallPrompt && !isStandalone()) {
      deferredRef.current = window.__deferredPWAInstallPrompt;
      setCanInstall(true);
    }
    const handleBefore = () => {
      if (window.__deferredPWAInstallPrompt && !isStandalone()) {
        deferredRef.current = window.__deferredPWAInstallPrompt;
        setCanInstall(true);
      }
    };
    const handleInstalled = () => {
      setCanInstall(false);
      deferredRef.current = null;
    };
    window.addEventListener('pwa-beforeinstallprompt', handleBefore);
    window.addEventListener('pwa-appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('pwa-beforeinstallprompt', handleBefore);
      window.removeEventListener('pwa-appinstalled', handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const promptEvent = deferredRef.current || window.__deferredPWAInstallPrompt;
    if (!promptEvent) return;
    setInstalling(true);
    try {
      promptEvent.prompt();
      await promptEvent.userChoice;
      setCanInstall(false);
    } finally {
      setInstalling(false);
      deferredRef.current = null;
    }
  };

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
        {canInstall && (
          <button 
            className="nav-item"
            onClick={handleInstall}
            aria-label={t('header.install')}
            title={t('header.install')}
            disabled={installing}
          >
            <FaArrowAltCircleDown className="nav-icon" />
          </button>
        )}
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
