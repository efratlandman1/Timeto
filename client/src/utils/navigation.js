// מיפוי שמות העמודים
const PAGE_NAMES = {
    '/': 'דף הבית',
    '/search': 'חיפוש עסקים',
    '/edit': 'הוספת עסק',
    '/my-businesses': 'עסקים שלי',
    '/business': 'פרופיל עסק',
    '/suggest': 'הצעת פריט',
    '/feedback': 'משוב',
    '/login': 'התחברות',
    '/register': 'הרשמה'
};

/**
 * מקבל נתיב ומחזיר את שם העמוד המתאים
 */
export const getPageName = (path) => {
    // מנקה פרמטרים מה-URL
    const cleanPath = path.split('?')[0];
    return PAGE_NAMES[cleanPath] || 'דף הבית';
};

/**
 * מחזיר את הנתיב הקודם או דף הבית כברירת מחדל
 */
export const getPreviousPagePath = () => {
    return document.referrer || '/';
};

/**
 * מחזיר את שם העמוד הקודם
 */
export const getPreviousPageName = () => {
    const previousPath = getPreviousPagePath();
    try {
        const url = new URL(previousPath);
        return getPageName(url.pathname);
    } catch {
        return 'דף הבית';
    }
};

/**
 * מחזיר את הטקסט המלא לכפתור החזרה
 */
export const getBackButtonText = () => {
    const pageName = getPreviousPageName();
    return `חזרה ל${pageName}`;
}; 