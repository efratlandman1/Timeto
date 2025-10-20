// Centralized responsive breakpoints and helpers

export const BREAKPOINTS = {
    xs: 0,       // phones (small)
    sm: 480,     // phones (large)
    md: 640,     // small tablets
    lg: 768,     // tablets / small landscape
    xl: 1024,    // small desktop (inclusive of iPad Air portrait)
    xxl: 1280    // large desktop
};

export const BREAKPOINT_ORDER = ["xs", "sm", "md", "lg", "xl", "xxl"];

export const getBreakpointName = (width) => {
    if (width >= BREAKPOINTS.xxl) return "xxl";
    if (width >= BREAKPOINTS.xl) return "xl";
    if (width >= BREAKPOINTS.lg) return "lg";
    if (width >= BREAKPOINTS.md) return "md";
    if (width >= BREAKPOINTS.sm) return "sm";
    return "xs";
};

export const isMobileWidth = (width) => width < BREAKPOINTS.lg; // < 768px

// Treat iPad Pro portrait (1024 width) as tablet for menu logic
export const isTabletWidth = (width) => width >= BREAKPOINTS.lg && width <= BREAKPOINTS.xl; // 768-1024 inclusive

export const isDesktopWidth = (width) => width > BREAKPOINTS.xl; // > 1024px

export const getDeviceCategory = (width) => {
    if (isMobileWidth(width)) return "mobile";
    if (isTabletWidth(width)) return "tablet";
    return "desktop";
};


