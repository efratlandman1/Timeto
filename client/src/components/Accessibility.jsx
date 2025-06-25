import React, { useState, useEffect } from 'react';
import { FaUniversalAccess, FaFont, FaTimes, FaAdjust, FaMousePointer, FaAlignRight, FaKeyboard } from 'react-icons/fa';
import '../styles/Accessibility.css';

const Accessibility = () => {
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
        aria-label="פתח הגדרות נגישות"
      >
        <FaUniversalAccess />
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="btn btn-ghost btn-circle btn-sm btn-close"
              onClick={() => setIsOpen(false)}
              aria-label="סגור הגדרות נגישות"
            >
              <FaTimes />
            </button>

            <h2 className="accessibility-title">
              <FaUniversalAccess /> הגדרות נגישות
            </h2>

            <div className="accessibility-options">
              <div className="option-group">
                <h3><FaFont /> גודל טקסט</h3>
                <div className="button-group">
                  <button 
                    className={settings.fontSize === 'normal' ? 'active' : ''}
                    onClick={() => updateSetting('fontSize', 'normal')}
                  >
                    רגיל
                  </button>
                  <button 
                    className={settings.fontSize === 'large' ? 'active' : ''}
                    onClick={() => updateSetting('fontSize', 'large')}
                  >
                    גדול
                  </button>
                  <button 
                    className={settings.fontSize === 'larger' ? 'active' : ''}
                    onClick={() => updateSetting('fontSize', 'larger')}
                  >
                    גדול מאוד
                  </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaAdjust /> ניגודיות</h3>
                <div className="button-group">
                  <button 
                    className={settings.contrast === 'normal' ? 'active' : ''}
                    onClick={() => updateSetting('contrast', 'normal')}
                  >
                    רגיל
                  </button>
                  <button 
                    className={settings.contrast === 'high' ? 'active' : ''}
                    onClick={() => updateSetting('contrast', 'high')}
                  >
                    ניגודיות גבוהה
                  </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaMousePointer /> גודל סמן</h3>
                <div className="button-group">
                  <button 
                    className={settings.cursorSize === 'normal' ? 'active' : ''}
                    onClick={() => updateSetting('cursorSize', 'normal')}
                  >
                    רגיל
                  </button>
                  <button 
                    className={settings.cursorSize === 'large' ? 'active' : ''}
                    onClick={() => updateSetting('cursorSize', 'large')}
                  >
                    גדול
                  </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaAlignRight /> יישור טקסט</h3>
                <div className="button-group">
                  <button 
                    className={settings.textAlign === 'right' ? 'active' : ''}
                    onClick={() => updateSetting('textAlign', 'right')}
                  >
                    ימין
                  </button>
                  <button 
                    className={settings.textAlign === 'center' ? 'active' : ''}
                    onClick={() => updateSetting('textAlign', 'center')}
                  >
                    מרכז
                  </button>
                  <button 
                    className={settings.textAlign === 'left' ? 'active' : ''}
                    onClick={() => updateSetting('textAlign', 'left')}
                  >
                    שמאל
                  </button>
                </div>
              </div>

              <div className="option-group">
                <h3><FaKeyboard /> ניווט מקלדת</h3>
                <div className="button-group">
                  <button 
                    className={settings.keyboardNav ? 'active' : ''}
                    onClick={() => updateSetting('keyboardNav', !settings.keyboardNav)}
                  >
                    {settings.keyboardNav ? 'פעיל' : 'כבוי'}
                  </button>
                </div>
              </div>

              <button className="btn btn-solid btn-primary" onClick={resetSettings}>
                אפס הגדרות
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Accessibility; 