import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BREAKPOINTS, BREAKPOINT_ORDER, getBreakpointName, getDeviceCategory, isDesktopWidth, isMobileWidth, isTabletWidth } from './responsive';

const ResponsiveContext = createContext({
    width: 0,
    height: 0,
    breakpoint: 'xs',
    isMobile: true,
    isTablet: false,
    isDesktop: false,
    deviceCategory: 'mobile',
    up: () => false,
    down: () => false,
    between: () => false
});

const getWindowSize = () => {
    if (typeof window === 'undefined') {
        return { width: 0, height: 0 };
    }
    return { width: window.innerWidth, height: window.innerHeight };
};

const removeBodyClassesByPrefix = (prefix) => {
    if (typeof document === 'undefined') return;
    const toRemove = Array.from(document.body.classList).filter(c => c.startsWith(prefix));
    toRemove.forEach(c => document.body.classList.remove(c));
};

export const ResponsiveProvider = ({ children }) => {
    const initial = getWindowSize();
    const [size, setSize] = useState(initial);
    const resizeTimeoutRef = useRef(null);

    const breakpoint = useMemo(() => getBreakpointName(size.width), [size.width]);
    const isMobile = useMemo(() => isMobileWidth(size.width), [size.width]);
    const isTablet = useMemo(() => isTabletWidth(size.width), [size.width]);
    const isDesktop = useMemo(() => isDesktopWidth(size.width), [size.width]);
    const deviceCategory = useMemo(() => getDeviceCategory(size.width), [size.width]);

    const up = useCallback((bp) => {
        const min = BREAKPOINTS[bp] ?? 0;
        return size.width >= min;
    }, [size.width]);

    const down = useCallback((bp) => {
        const max = BREAKPOINTS[bp] ?? Number.MAX_SAFE_INTEGER;
        return size.width < max;
    }, [size.width]);

    const between = useCallback((minBp, maxBp) => {
        const min = BREAKPOINTS[minBp] ?? 0;
        const max = BREAKPOINTS[maxBp] ?? Number.MAX_SAFE_INTEGER;
        return size.width >= min && size.width < max;
    }, [size.width]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
                setSize(getWindowSize());
            }, 120);
        };
        window.addEventListener('resize', handleResize, { passive: true });
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) clearTimeout(resizeTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        removeBodyClassesByPrefix('bp-');
        removeBodyClassesByPrefix('device-');
        document.body.classList.add(`bp-${breakpoint}`);
        document.body.classList.add(`device-${deviceCategory}`);
        document.body.setAttribute('data-breakpoint', breakpoint);
        document.body.setAttribute('data-device', deviceCategory);
    }, [breakpoint, deviceCategory]);

    const value = useMemo(() => ({
        width: size.width,
        height: size.height,
        breakpoint,
        isMobile,
        isTablet,
        isDesktop,
        deviceCategory,
        up,
        down,
        between,
        BREAKPOINTS,
        BREAKPOINT_ORDER
    }), [size.width, size.height, breakpoint, isMobile, isTablet, isDesktop, deviceCategory, up, down, between]);

    return (
        <ResponsiveContext.Provider value={value}>
            {children}
        </ResponsiveContext.Provider>
    );
};

export const useResponsive = () => useContext(ResponsiveContext);

export default ResponsiveProvider;


