export const routeNames = {
  '/': 'דף הבית',
  '/auth': 'התחברות',
  '/business': 'הוספת עסק',
  '/user-businesses': 'העסקים שלי',
  '/user-favorites': 'המועדפים שלי',
  '/user-profile': 'הפרופיל שלי',
  '/admin': 'ניהול מערכת',
  '/search-results': 'תוצאות חיפוש',
  '/suggest-item': 'הצע פריט',
  '/feedback': 'משוב',
  '/terms': 'תנאי שימוש'
};

/**
 * מקבל נתיב ומחזיר את שם העמוד המתאים
 */
export const getPageName = (path) => {
    // מנקה פרמטרים מה-URL
    const cleanPath = path.split('?')[0];
    return routeNames[cleanPath] || 'דף הבית';
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