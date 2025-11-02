import React from 'react';
import { FaTimes, FaStore, FaTag, FaBullhorn } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import '../styles/CreateOptionsModal.css';

const CreateOptionsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.user.user);

  if (!isOpen) return null;

  const handleOptionClick = (path) => {
    console.log('User state:', user);
    console.log('Is user logged in:', !!user);
    
    if (!user) {
      console.log('User not logged in, navigating to auth');
      // אם המשתמש לא מחובר, נווט לדף ההתחברות
      navigate('/auth', { state: { background: location } });
    } else {
      console.log('User logged in, navigating to:', path);
      // אם המשתמש מחובר, נווט לדף הרלוונטי
      if (path === '/business') {
        navigate(path, { state: { reset: Date.now() } });
      } else {
        navigate(path);
      }
    }
    onClose();
  };

  const options = [
    {
      id: 'business',
      title: t('header.addBusiness'),
      description: t('mainPage.joinBanner.joinNowAndDiscover'),
      icon: <FaStore />,
      path: '/business'
    },
    {
      id: 'sale',
      title: 'מודעת מכירה',
      description: 'פרסם מוצרים למכירה',
      icon: <FaTag />,
      path: '/ads/sale/new'
    },
    {
      id: 'promo',
      title: 'מודעת פרסום',
      description: 'פרסם מבצעים והנחות',
      icon: <FaBullhorn />,
      path: '/ads/promo/new'
    }
  ];

  return (
    <div className="modal-overlay-fixed" onClick={onClose}>
      <div className="modal-container create-options-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <FaTimes />
          </button>
          <h2 className="modal-title">צור</h2>
        </div>
        
        <div className="create-options-list">
          {options.map((option) => (
            <button
              key={option.id}
              className="create-option-item"
              onClick={() => handleOptionClick(option.path)}
            >
              <div className="option-icon">
                {option.icon}
              </div>
              <div className="option-content">
                <h3 className="option-title">{option.title}</h3>
                <p className="option-description">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreateOptionsModal;
