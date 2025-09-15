# Middleware Documentation

## סוגי מידלוור זמינים:

### 1. `requireAuth` - אימות משתמש רגיל
**מתי להשתמש:** כאשר הראוט דורש משתמש מחובר ומאומת
**דוגמאות:** עדכון פרופיל, הוספת מועדפים, יצירת פידבק

```javascript
const { requireAuth } = require('../middlewares/authMiddleware');

router.put('/profile', requireAuth, userController.updateProfile);
router.post('/favorites', requireAuth, favoritesController.addFavorite);
```

### 2. `requireAdmin` - אימות אדמין
**מתי להשתמש:** כאשר הראוט דורש הרשאות אדמין
**דוגמאות:** ניהול קטגוריות, ניהול שירותים, ניהול משתמשים

```javascript
const { requireAdmin } = require('../middlewares/authMiddleware');

router.post('/categories', requireAdmin, categoryController.createCategory);
router.delete('/users/:id', requireAdmin, userController.deleteUser);
```

### 3. `optionalAuth` - אימות אופציונלי
**מתי להשתמש:** כאשר הראוט יכול לעבוד עם או בלי משתמש מחובר
**דוגמאות:** הצגת עסקים (עם מידע מועדפים אם מחובר), חיפוש

```javascript
const { optionalAuth } = require('../middlewares/authMiddleware');

router.get('/businesses', optionalAuth, businessController.getBusinesses);
router.get('/search', optionalAuth, searchController.search);
```

### 4. `publicRoute` - ראוט ציבורי
**מתי להשתמש:** כאשר הראוט פתוח לכולם
**דוגמאות:** התחברות, הרשמה, אימות אימייל

```javascript
const { publicRoute } = require('../middlewares/authMiddleware');

router.post('/auth', publicRoute, authController.login);
router.get('/verify-email', publicRoute, authController.verifyEmail);
```

## איך להשתמש:

### בקובץ ראוטר:
```javascript
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin, optionalAuth, publicRoute } = require('../middlewares/authMiddleware');

// ראוטים ציבוריים
router.post('/auth', publicRoute, authController.login);

// ראוטים עם אימות אופציונלי
router.get('/businesses', optionalAuth, businessController.getBusinesses);

// ראוטים עם אימות רגיל
router.put('/profile', requireAuth, userController.updateProfile);

// ראוטים עם אימות אדמין
router.post('/categories', requireAdmin, categoryController.createCategory);
```

### גישה למשתמש בקונטרולר:
```javascript
// עם requireAuth או requireAdmin
exports.updateProfile = async (req, res) => {
    const userId = req.user._id; // המשתמש זמין
    // ...
};

// עם optionalAuth
exports.getBusinesses = async (req, res) => {
    if (req.user) {
        // משתמש מחובר - אפשר להוסיף מידע נוסף
        const userId = req.user._id;
    } else {
        // משתמש לא מחובר - רק מידע בסיסי
    }
    // ...
};
```

## יתרונות המערכת החדשה:

1. **אחידות** - כל המידלוור מרוכז במקום אחד
2. **פשטות** - אין צורך לבדוק טוקן ידנית בכל קונטרולר
3. **גמישות** - אימות אופציונלי מאפשר גמישות
4. **אבטחה** - הפרדה ברורה בין רמות הרשאה
5. **תחזוקה** - שינוי אחד משפיע על כל המערכת 