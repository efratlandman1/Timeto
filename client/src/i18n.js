import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Get stored language preference or default to Hebrew
const getStoredLanguage = () => {
  const stored = localStorage.getItem('language');
  if (stored && (stored === 'he' || stored === 'en')) {
    return stored;
  }
  return 'he'; // Default to Hebrew
};

// Get stored direction preference or calculate from language
const getStoredDirection = () => {
  const stored = localStorage.getItem('direction');
  if (stored && (stored === 'rtl' || stored === 'ltr')) {
    return stored;
  }
  return getStoredLanguage() === 'he' ? 'rtl' : 'ltr';
};

// Initialize language and direction
const initialLanguage = getStoredLanguage();
const initialDirection = getStoredDirection();

// Set initial document attributes
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  document.documentElement.dir = initialDirection;
}

// Dispatch initial language event for Redux integration
if (typeof window !== 'undefined') {
  const event = new CustomEvent('languageChanged', {
    detail: { language: initialLanguage, direction: initialDirection }
  });
  // Use setTimeout to ensure this runs after Redux is initialized
  setTimeout(() => {
    window.dispatchEvent(event);
  }, 0);
}

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'he',
    lng: initialLanguage,
    debug: true, // Enable debug for troubleshooting
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language'
    },
    react: {
      useSuspense: false // Disable suspense to handle loading manually
    }
  });

// Listen for language changes and update document attributes
i18n.on('languageChanged', (lng) => {
  const direction = lng === 'he' ? 'rtl' : 'ltr';
  
  // Update document attributes
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    document.documentElement.dir = direction;
  }
  
  // Save to localStorage
  localStorage.setItem('language', lng);
  localStorage.setItem('direction', direction);
  
  // Dispatch custom event for Redux integration
  const event = new CustomEvent('languageChanged', {
    detail: { language: lng, direction }
  });
  window.dispatchEvent(event);
});

// Helper functions for language management
export const changeLanguage = async (language) => {
  try {
    await i18n.changeLanguage(language);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

export const getCurrentLanguage = () => i18n.language;
export const getCurrentDirection = () => document.documentElement.dir || 'rtl';
export const isRTL = () => getCurrentDirection() === 'rtl';
export const isLTR = () => getCurrentDirection() === 'ltr';

export default i18n; 