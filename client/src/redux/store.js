import { configureStore } from '@reduxjs/toolkit';
import businessReducer from './businessSlice';
import userReducer from './userSlice';
import servicesReducer from './servicesSlice';
import saleAdsReducer from './saleAdsSlice';
import promoAdsReducer from './promoAdsSlice';
import saleCategoriesReducer from './saleCategoriesSlice';
import saleFavoritesReducer from './saleFavoritesSlice';
import promoFavoritesReducer from './promoFavoritesSlice';
import locationReducer from './locationSlice';
import uiReducer from './uiSlice';

// Get initial UI state from localStorage
const getInitialUIState = () => {
  try {
    const storedLanguage = localStorage.getItem('language') || 'he';
    const storedDirection = localStorage.getItem('direction') || 'rtl';
    const storedTheme = localStorage.getItem('theme') || 'light';
    
    const initialState = {
      language: storedLanguage,
      direction: storedDirection,
      theme: storedTheme,
      sidebar: { isOpen: false, activeTab: 'home' },
      modals: {
        auth: false,
        businessForm: false,
        reviewForm: false,
        confirmation: false,
        imageGallery: false
      },
      notifications: { items: [] },
      loading: { global: false, page: false },
      search: { query: '', suggestions: [], recentSearches: [] },
      map: { center: [32.0853, 34.7818], zoom: 10, markers: [] }
    };
    
    console.log('Initial UI State loaded:', initialState);
    return initialState;
  } catch (error) {
    console.warn('Failed to load UI state from localStorage:', error);
    return undefined;
  }
};

const store = configureStore({
    reducer: {
        business: businessReducer,
        user: userReducer,
        services: servicesReducer,
        location: locationReducer,
        ui: uiReducer,
        saleAds: saleAdsReducer,
        promoAds: promoAdsReducer,
        saleCategories: saleCategoriesReducer,
        saleFavorites: saleFavoritesReducer,
        promoFavorites: promoFavoritesReducer
    },
    preloadedState: {
        ui: getInitialUIState()
    }
});

console.log('Redux Store created with preloaded state:', store.getState());

export default store;
