import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  language: 'he', // Default to Hebrew
  direction: 'rtl', // Default to RTL
  theme: 'light',
  sidebar: {
    isOpen: false,
    activeTab: 'home'
  },
  modals: {
    auth: false,
    businessForm: false,
    reviewForm: false,
    confirmation: false,
    imageGallery: false
  },
  notifications: {
    items: []
  },
  loading: {
    global: false,
    page: false
  },
  search: {
    query: '',
    suggestions: [],
    recentSearches: []
  },
  map: {
    center: [32.0853, 34.7818], // Tel Aviv coordinates
    zoom: 10,
    markers: []
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLanguage: (state, action) => {
      const newLanguage = action.payload;
      state.language = newLanguage;
      state.direction = newLanguage === 'he' ? 'rtl' : 'ltr';
      
      // Update localStorage
      localStorage.setItem('language', newLanguage);
      localStorage.setItem('direction', state.direction);
      
      // Update document attributes
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLanguage;
        document.documentElement.dir = state.direction;
      }
    },
    
    setDirection: (state, action) => {
      state.direction = action.payload;
      localStorage.setItem('direction', action.payload);
      if (typeof document !== 'undefined') {
        document.documentElement.dir = action.payload;
      }
    },
    
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    toggleSidebar: (state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    },
    
    setActiveTab: (state, action) => {
      state.sidebar.activeTab = action.payload;
    },
    
    openModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = true;
      }
    },
    
    closeModal: (state, action) => {
      const modalName = action.payload;
      if (state.modals.hasOwnProperty(modalName)) {
        state.modals[modalName] = false;
      }
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    
    addNotification: (state, action) => {
      const notification = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        ...action.payload
      };
      state.notifications.items.push(notification);
    },
    
    removeNotification: (state, action) => {
      state.notifications.items = state.notifications.items.filter(
        item => item.id !== action.payload
      );
    },
    
    clearNotifications: (state) => {
      state.notifications.items = [];
    },
    
    setGlobalLoading: (state, action) => {
      state.loading.global = action.payload;
    },
    
    setPageLoading: (state, action) => {
      state.loading.page = action.payload;
    },
    
    setSearchQuery: (state, action) => {
      state.search.query = action.payload;
    },
    
    setSearchSuggestions: (state, action) => {
      state.search.suggestions = action.payload;
    },
    
    addRecentSearch: (state, action) => {
      const search = action.payload;
      if (!state.search.recentSearches.includes(search)) {
        state.search.recentSearches.unshift(search);
        // Keep only last 10 searches
        if (state.search.recentSearches.length > 10) {
          state.search.recentSearches = state.search.recentSearches.slice(0, 10);
        }
      }
    },
    
    clearRecentSearches: (state) => {
      state.search.recentSearches = [];
    },
    
    setMapCenter: (state, action) => {
      state.map.center = action.payload;
    },
    
    setMapZoom: (state, action) => {
      state.map.zoom = action.payload;
    },
    
    setMapMarkers: (state, action) => {
      state.map.markers = action.payload;
    }
  }
});

export const {
  setLanguage,
  setDirection,
  setTheme,
  toggleSidebar,
  setActiveTab,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearNotifications,
  setGlobalLoading,
  setPageLoading,
  setSearchQuery,
  setSearchSuggestions,
  addRecentSearch,
  clearRecentSearches,
  setMapCenter,
  setMapZoom,
  setMapMarkers
} = uiSlice.actions;

export default uiSlice.reducer; 