import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './redux/store';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ResponsiveProvider } from './utils/ResponsiveProvider';

// Global PWA install prompt handling to avoid missing early events
if (typeof window !== 'undefined') {
    window.__deferredPWAInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.__deferredPWAInstallPrompt = e;
        window.dispatchEvent(new CustomEvent('pwa-beforeinstallprompt'));
    });
    window.addEventListener('appinstalled', () => {
        window.__deferredPWAInstallPrompt = null;
        window.dispatchEvent(new CustomEvent('pwa-appinstalled'));
    });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        {/* <Suspense fallback="Loading..."> */}
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <Provider store={store}>
                    <ResponsiveProvider>
                        <App />
                    </ResponsiveProvider>
                </Provider>
        {/* </Suspense> */}
            </GoogleOAuthProvider>
        </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
        navigator.serviceWorker
            .register(swUrl)
            .catch(() => {
                // no-op
            });
    });
}
