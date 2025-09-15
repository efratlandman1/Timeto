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
    textAlign: 'right',
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

    // Contrast
    document.body.className = newSettings.contrast === 'high' ? 'high-contrast' : '';

    // Cursor Size
    document.documentElement.style.setProperty(
      '--cursor-size',
      newSettings.cursorSize === 'large' ? '32px' : '16px'
    );

    // Text Alignment
    document.documentElement.style.setProperty(
      '--text-align',
      newSettings.textAlign
    );

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
        aria-label={t('accessibility.openSettings')}
      >
        <FaUniversalAccess />
      </button>

      {isOpen && (
        <div className="accessibility-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="accessibility-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="close-button"
              onClick={() => setIsOpen(false)}
              aria-label={t('accessibility.closeSettings')}
            >
              ×
            </button>

            <h2 className="accessibility-title">
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

              <div className="option-group">
                <h3><FaAlignRight /> {t('accessibility.textAlign')}</h3>
                <div className="button-group">
                                      <button 
                      className={settings.textAlign === 'right' ? 'active' : ''}
                      onClick={() => updateSetting('textAlign', 'right')}
                    >
                      {t('accessibility.right')}
                    </button>
                    <button 
                      className={settings.textAlign === 'center' ? 'active' : ''}
                      onClick={() => updateSetting('textAlign', 'center')}
                    >
                      {t('accessibility.center')}
                    </button>
                    <button 
                      className={settings.textAlign === 'left' ? 'active' : ''}
                      onClick={() => updateSetting('textAlign', 'left')}
                    >
                      {t('accessibility.left')}
                    </button>
                </div>
              </div>

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