import React, { useState, useEffect } from 'react';
import { FaUniversalAccess, FaFont, FaTimes, FaAdjust, FaMousePointer, FaAlignRight, FaKeyboard } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import '../styles/Accessibility.css';

const Accessibility = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 'normal',
    contrast: 'normal',
    cursorSize: 'normal',
    keyboardNav: false
  });

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('accessibilitySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
      applySettings(JSON.parse(savedSettings));
    }
  }, []);

  const applySettings = (newSettings) => {
    // Font Size
    document.documentElement.style.setProperty(
      '--base-font-size',
      newSettings.fontSize === 'large' ? '18px' : 
      newSettings.fontSize === 'larger' ? '20px' : '16px'
    );

    // Contrast (avoid overwriting existing body classes like rtl/ltr)
    if (newSettings.contrast === 'high') {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }

    // Cursor Size
    if (newSettings.cursorSize === 'large') {
      document.documentElement.classList.add('cursor-large');
    } else {
      document.documentElement.classList.remove('cursor-large');
    }

    // Text Alignment removed – alignment controlled by language direction (dir="rtl"/"ltr")

    // Keyboard Navigation
    if (newSettings.keyboardNav) {
      document.documentElement.classList.add('keyboard-nav');
    } else {
      document.documentElement.classList.remove('keyboard-nav');
    }

    // Save to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(newSettings));
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    applySettings(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings = {
      fontSize: 'normal',
      contrast: 'normal',
      cursorSize: 'normal',
      textAlign: 'right',
      keyboardNav: false
    };
    setSettings(defaultSettings);
    applySettings(defaultSettings);
  };

  return (
    <>
      <button 
        className="accessibility-button"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={t('accessibility.openSettings')}
      >
        <FaUniversalAccess />
      </button>

      {isOpen && (
        <div className="accessibility-modal-overlay" onClick={() => setIsOpen(false)}>
          <div
            className="accessibility-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="accessibility-title"
          >
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label={t('accessibility.closeSettings')}
            >
              ×
            </button>

            <h2 id="accessibility-title" className="accessibility-title">
              <FaUniversalAccess /> {t('accessibility.title')}
            </h2>

            <div className="accessibility-options">
              <div className="option-group">
                <h3><FaFont /> {t('accessibility.fontSize')}</h3>
                <div className="button-group">
                                      <button 
                      className={settings.fontSize === 'normal' ? 'active' : ''}
                      onClick={() => updateSetting('fontSize', 'normal')}
                    >
                      {t('accessibility.normal')}
                    </button>
                    <button 
                      className={settings.fontSize === 'large' ? 'active' : ''}
                      onClick={() => updateSetting('fontSize', 'large')}
                    >
                      {t('accessibility.large')}
                    </button>
                    <button 
                      className={settings.fontSize === 'larger' ? 'active' : ''}
                      onClick={() => updateSetting('fontSize', 'larger')}
                    >
                      {t('accessibility.veryLarge')}
                    </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaAdjust /> {t('accessibility.contrast')}</h3>
                <div className="button-group">
                                      <button 
                      className={settings.contrast === 'normal' ? 'active' : ''}
                      onClick={() => updateSetting('contrast', 'normal')}
                    >
                      {t('accessibility.normal')}
                    </button>
                    <button 
                      className={settings.contrast === 'high' ? 'active' : ''}
                      onClick={() => updateSetting('contrast', 'high')}
                    >
                      {t('accessibility.highContrast')}
                    </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaMousePointer /> {t('accessibility.cursorSize')}</h3>
                <div className="button-group">
                                      <button 
                      className={settings.cursorSize === 'normal' ? 'active' : ''}
                      onClick={() => updateSetting('cursorSize', 'normal')}
                    >
                      {t('accessibility.normal')}
                    </button>
                    <button 
                      className={settings.cursorSize === 'large' ? 'active' : ''}
                      onClick={() => updateSetting('cursorSize', 'large')}
                    >
                      {t('accessibility.large')}
                    </button>
                </div>
              </div>

              {/* Text alignment control removed */}

              <div className="option-group">
                <h3><FaKeyboard /> {t('accessibility.keyboardNav')}</h3>
                <div className="button-group">
                  <button 
                    className={settings.keyboardNav ? 'active' : ''}
                    onClick={() => updateSetting('keyboardNav', !settings.keyboardNav)}
                  >
                    {settings.keyboardNav ? t('accessibility.active') : t('accessibility.inactive')}
                  </button>
                </div>
              </div>

              <button className="reset-button" onClick={resetSettings}>
                {t('accessibility.resetSettings')}
              </button>
              <button className="reset-button" style={{ background: '#4caf50' }} onClick={() => setIsOpen(false)}>
                {t('accessibility.apply')}
              </button>
              <button className="cancel-button" type="button" onClick={() => setIsOpen(false)} style={{marginTop: '1.5rem', width: '100%'}}>
                {t('accessibility.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Accessibility; 