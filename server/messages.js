// הודעות מערכת מרכזיות לכל הקונטרולרים
module.exports = {
  // הודעות גנריות לשימוש חוזר
  COMMON: {
    SUCCESS: "הפעולה הושלמה בהצלחה",
    ERROR: "שגיאה בביצוע הפעולה",
    NOT_FOUND: "הפריט לא נמצא",
    UNAUTHORIZED: "אין לך הרשאה לבצע פעולה זו",
    INVALID_DATA: "הנתונים שהוזנו אינם תקינים"
  },
  
  FAVORITES: {
    // הודעות הצלחה
    FAVORITE_ADDED: "העסק נוסף למועדפים",
    FAVORITE_REMOVED: "העסק הוסר מהמועדפים",
    
    // הודעות שגיאה
    INVALID_BUSINESS_ID: "מספר עסק לא תקין.",
    ERROR_TOGGLE_FAVORITE: "שגיאה בעת עדכון המועדפים.",
    ERROR_FETCH_FAVORITES: "שגיאה בטעינת המועדפים.",
    ERROR_CHECK_FAVORITE_STATUS: "שגיאה בבדיקת סטטוס מועדפים."
  },
  
  BUSINESS_MESSAGES: {
    // הודעות הצלחה
    GET_ALL_SUCCESS: "העסקים נטענו בהצלחה",
    GET_BY_ID_SUCCESS: "העסק נטען בהצלחה",
    CREATE_SUCCESS: "העסק נוצר בהצלחה",
    UPDATE_SUCCESS: "העסק עודכן בהצלחה",
    DELETE_SUCCESS: "העסק הוסר בהצלחה",
    RESTORE_SUCCESS: "העסק שוחזר בהצלחה",
    UPLOAD_SUCCESS: "העסק נשמר בהצלחה",
    // הודעות שגיאה
    GET_ALL_ERROR: "שגיאה בטעינת העסקים",
    GET_BY_ID_ERROR: "שגיאה בטעינת העסק",
    CREATE_ERROR: "שגיאה ביצירת העסק",
    UPDATE_ERROR: "שגיאה בעדכון העסק",
    DELETE_ERROR: "שגיאה בהסרת העסק",
    RESTORE_ERROR: "שגיאה בשחזור העסק",
    UPLOAD_ERROR: "שגיאה בשמירת העסק",
    NOT_FOUND: "העסק לא נמצא",
    UNAUTHORIZED_EDIT: "אין לך הרשאה לערוך עסק זה",
    UNAUTHORIZED_DELETE: "אין לך הרשאה להסיר עסק זה",
    UNAUTHORIZED_RESTORE: "אין לך הרשאה לשחזר עסק זה",
    INVALID_COORDINATES: "הכתובת לא נמצאה או לא תקינה"
  },

  AUTH_MESSAGES: {
    // הודעות הצלחה
    LOGIN_SUCCESS: "התחברת בהצלחה",
    REGISTER_SUCCESS: "ההרשמה הצליחה! אנא בדוק את תיבת המייל שלך כדי לאמת את החשבון",
    VERIFICATION_SENT: "מייל אימות נשלח",
    VERIFICATION_RESENT: "הסיסמה שלך עודכנה. אנא בדוק את האימייל שלך כדי לאמת את חשבונך",
    USER_CREATED: "החשבון נוצר. אנא בדוק את האימייל שלך כדי לאמת את חשבונך",
    PASSWORD_RESET_SENT: "אם קיים משתמש עם כתובת אימייל זו, נשלח אליו קישור לאיפוס סיסמה",
    PASSWORD_RESET_SUCCESS: "הסיסמה אופסה בהצלחה. כעת תוכל להתחבר עם הסיסמה החדשה",
    EMAIL_VERIFIED: "כתובת האימייל אומתה בהצלחה",
    
    // הודעות שגיאה
    MISSING_CREDENTIALS: "נדרשים אימייל וסיסמה",
    INVALID_PASSWORD: "הסיסמה חייבת להכיל לפחות 8 תווים",
    INVALID_CREDENTIALS: "סיסמה לא תקינה. אנא נסה שוב",
    EMAIL_EXISTS: "כבר יש חשבון עם כתובת האימייל הזו, אך לא הוגדרה לו סיסמה. תוכל להמשיך על ידי הגדרת סיסמה חדשה",
    ACCOUNT_NOT_VERIFIED: "חשבון זה לא אומת. אנא בדוק את האימייל שלך",
    ACCOUNT_ALREADY_VERIFIED: "חשבון זה כבר מאומת",
    USER_NOT_FOUND: "לא נמצא משתמש עם כתובת אימייל זו",
    INVALID_TOKEN: "ה-token שגוי, פג תוקפו או שכבר נעשה בו שימוש",
    GOOGLE_AUTH_FAILED: "אימות גוגל נכשל עקב שגיאת שרת",
    GOOGLE_NOT_VERIFIED: "חשבון הגוגל אינו מאומת. לא ניתן להמשיך",
    SERVER_ERROR: "אירעה שגיאת שרת פנימית. אנא נסה שוב מאוחר יותר"
  },

  USER_MESSAGES: {
    // הודעות הצלחה
    GET_ALL_SUCCESS: "המשתמשים נטענו בהצלחה",
    GET_BY_ID_SUCCESS: "המשתמש נטען בהצלחה",
    UPDATE_SUCCESS: "המשתמש עודכן בהצלחה",
    DELETE_SUCCESS: "המשתמש הוסר בהצלחה",
    
    // הודעות שגיאה
    GET_ALL_ERROR: "שגיאה בטעינת המשתמשים",
    GET_BY_ID_ERROR: "שגיאה בטעינת המשתמש",
    UPDATE_ERROR: "שגיאה בעדכון המשתמש",
    DELETE_ERROR: "שגיאה בהסרת המשתמש",
    NOT_FOUND: "המשתמש לא נמצא",
    UNAUTHORIZED_UPDATE: "אין לך הרשאה לעדכן משתמש זה",
    UNAUTHORIZED_DELETE: "אין לך הרשאה להסיר משתמש זה"
  },

  CATEGORY_MESSAGES: {
    // הודעות הצלחה
    GET_ALL_SUCCESS: "הקטגוריות נטענו בהצלחה",
    CREATE_SUCCESS: "הקטגוריה נוצרה בהצלחה",
    UPDATE_SUCCESS: "הקטגוריה עודכנה בהצלחה",
    DELETE_SUCCESS: "הקטגוריה הוסרה בהצלחה",
    
    // הודעות שגיאה
    GET_ALL_ERROR: "שגיאה בטעינת הקטגוריות",
    CREATE_ERROR: "שגיאה ביצירת הקטגוריה",
    UPDATE_ERROR: "שגיאה בעדכון הקטגוריה",
    DELETE_ERROR: "שגיאה בהסרת הקטגוריה",
    NOT_FOUND: "הקטגוריה לא נמצאה"
  },

  SERVICE_MESSAGES: {
    // הודעות הצלחה
    GET_ALL_SUCCESS: "השירותים נטענו בהצלחה",
    GET_BY_CATEGORY_SUCCESS: "השירותים לפי קטגוריה נטענו בהצלחה",
    CREATE_SUCCESS: "השירות נוצר בהצלחה",
    UPDATE_SUCCESS: "השירות עודכן בהצלחה",
    DELETE_SUCCESS: "השירות הוסר בהצלחה",
    
    // הודעות שגיאה
    GET_ALL_ERROR: "שגיאה בטעינת השירותים",
    GET_BY_CATEGORY_ERROR: "שגיאה בטעינת השירותים לפי קטגוריה",
    CREATE_ERROR: "שגיאה ביצירת השירות",
    UPDATE_ERROR: "שגיאה בעדכון השירות",
    DELETE_ERROR: "שגיאה בהסרת השירות",
    NOT_FOUND: "השירות לא נמצא"
  },

  FEEDBACK_MESSAGES: {
    // הודעות הצלחה
    CREATE_SUCCESS: "הפידבק נוצר בהצלחה",
    GET_BY_BUSINESS_SUCCESS: "הפידבקים נטענו בהצלחה",
    DELETE_SUCCESS: "הפידבק נמחק בהצלחה",
    
    // הודעות שגיאה
    CREATE_ERROR: "שגיאה ביצירת הפידבק",
    GET_BY_BUSINESS_ERROR: "שגיאה בטעינת הפידבקים",
    DELETE_ERROR: "שגיאה במחיקת הפידבק",
    INVALID_BUSINESS_ID: "מספר עסק לא תקין",
    INVALID_RATING: "אנא בחר דירוג בין 1 ל-5",
    ALREADY_EXISTS: "כבר הגשת פידבק לעסק זה",
    INVALID_FEEDBACK_ID: "מזהה הפידבק לא תקין",
    NOT_FOUND: "הפידבק לא נמצא",
    UNAUTHORIZED_DELETE: "אין לך הרשאה למחוק פידבק זה"
  },

  STATS_MESSAGES: {
    // הודעות הצלחה
    GET_HOME_STATS_SUCCESS: "הסטטיסטיקות נטענו בהצלחה",
    
    // הודעות שגיאה
    GET_HOME_STATS_ERROR: "שגיאה בטעינת הנתונים הסטטיסטיים"
  },

  SUGGESTION_MESSAGES: {
    // הודעות הצלחה
    CREATE_SUCCESS: "ההצעה נשלחה בהצלחה",
    GET_ALL_SUCCESS: "ההצעות נטענו בהצלחה",
    GET_SUCCESS: "ההצעה נטענה בהצלחה",
    UPDATE_SUCCESS: "ההצעה עודכנה בהצלחה",
    DELETE_SUCCESS: "ההצעה הוסרה בהצלחה",
    GET_USER_SUCCESS: "ההצעות שלך נטענו בהצלחה",
    
    // הודעות שגיאה
    CREATE_ERROR: "שגיאה בשליחת ההצעה",
    GET_ALL_ERROR: "שגיאה בטעינת ההצעות",
    GET_ERROR: "שגיאה בטעינת ההצעה",
    UPDATE_ERROR: "שגיאה בעדכון ההצעה",
    DELETE_ERROR: "שגיאה בהסרת ההצעה",
    GET_USER_ERROR: "שגיאה בטעינת ההצעות שלך",
    NOT_FOUND: "ההצעה לא נמצאה",
    INVALID_ID: "מזהה ההצעה לא תקין",
    INVALID_STATUS: "ערך סטטוס לא תקין",
    PARENT_CATEGORY_NOT_FOUND: "קטגוריית האב לא נמצאה"
  }
  ,
  SALE_AD_MESSAGES: {
    GET_ALL_SUCCESS: "מודעות מכירה נטענו בהצלחה",
    GET_ALL_ERROR: "שגיאה בטעינת מודעות המכירה",
    GET_BY_ID_SUCCESS: "מודעת מכירה נטענה בהצלחה",
    GET_BY_ID_ERROR: "שגיאה בטעינת מודעת המכירה",
    CREATE_SUCCESS: "מודעת המכירה נוצרה בהצלחה",
    CREATE_ERROR: "שגיאה ביצירת מודעת המכירה",
    UPDATE_SUCCESS: "מודעת המכירה עודכנה בהצלחה",
    UPDATE_ERROR: "שגיאה בעדכון מודעת המכירה",
    DELETE_SUCCESS: "מודעת המכירה הוסרה בהצלחה",
    DELETE_ERROR: "שגיאה בהסרת מודעת המכירה",
    RESTORE_SUCCESS: "מודעת המכירה שוחזרה בהצלחה",
    RESTORE_ERROR: "שגיאה בשחזור מודעת המכירה",
    NOT_FOUND: "מודעת המכירה לא נמצאה",
    UNAUTHORIZED_EDIT: "אין לך הרשאה לערוך מודעה זו",
    UNAUTHORIZED_DELETE: "אין לך הרשאה להסיר מודעה זו",
    UNAUTHORIZED_RESTORE: "אין לך הרשאה לשחזר מודעה זו",
    INVALID_COORDINATES: "הכתובת/המיקום לא נמצאו או לא תקינים"
  },
  PROMO_AD_MESSAGES: {
    GET_ALL_SUCCESS: "מודעות פרסום נטענו בהצלחה",
    GET_ALL_ERROR: "שגיאה בטעינת מודעות הפרסום",
    GET_BY_ID_SUCCESS: "מודעת פרסום נטענה בהצלחה",
    GET_BY_ID_ERROR: "שגיאה בטעינת מודעת הפרסום",
    CREATE_SUCCESS: "מודעת הפרסום נוצרה בהצלחה",
    CREATE_ERROR: "שגיאה ביצירת מודעת הפרסום",
    UPDATE_SUCCESS: "מודעת הפרסום עודכנה בהצלחה",
    UPDATE_ERROR: "שגיאה בעדכון מודעת הפרסום",
    DELETE_SUCCESS: "מודעת הפרסום הוסרה בהצלחה",
    DELETE_ERROR: "שגיאה בהסרת מודעת הפרסום",
    RESTORE_SUCCESS: "מודעת הפרסום שוחזרה בהצלחה",
    RESTORE_ERROR: "שגיאה בשחזור מודעת הפרסום",
    NOT_FOUND: "מודעת הפרסום לא נמצאה",
    IMAGE_REQUIRED: "יש לצרף תמונה למודעת פרסום",
    UNAUTHORIZED_EDIT: "אין לך הרשאה לערוך מודעה זו",
    UNAUTHORIZED_DELETE: "אין לך הרשאה להסיר מודעה זו",
    UNAUTHORIZED_RESTORE: "אין לך הרשאה לשחזר מודעה זו"
  },
  SALE_CATEGORY_MESSAGES: {
    GET_ALL_SUCCESS: "קטגוריות מכירה נטענו בהצלחה",
    GET_ALL_ERROR: "שגיאה בטעינת קטגוריות המכירה",
    CREATE_SUCCESS: "קטגוריית מכירה נוצרה בהצלחה",
    CREATE_ERROR: "שגיאה ביצירת קטגוריית המכירה",
    UPDATE_SUCCESS: "קטגוריית מכירה עודכנה בהצלחה",
    UPDATE_ERROR: "שגיאה בעדכון קטגוריית המכירה",
    DELETE_SUCCESS: "קטגוריית מכירה הוסרה בהצלחה",
    DELETE_ERROR: "שגיאה בהסרת קטגוריית המכירה",
    NOT_FOUND: "קטגוריית המכירה לא נמצאה"
  },
  SALE_FAVORITES_MESSAGES: {
    ADDED: "המודעה נוספה למועדפים",
    REMOVED: "המודעה הוסרה מהמועדפים",
    INVALID_ID: "מזהה מודעה לא תקין",
    ERROR_TOGGLE: "שגיאה בעת עדכון המועדפים",
    FETCH_SUCCESS: "מועדפים נטענו בהצלחה",
    ERROR_FETCH: "שגיאה בטעינת המועדפים"
  }
}; 