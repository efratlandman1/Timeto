// emailTemplates.js

function baseTemplate({ title, message, buttonText, buttonLink }) {
    return `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">${title}</h2>
          <p style="font-size: 16px; color: #555;">${message}</p>
          <a href="${buttonLink}" style="display: inline-block; margin-top: 20px; padding: 12px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            ${buttonText}
          </a>
          <p style="margin-top: 40px; font-size: 12px; color: #aaa;">
            אם לא ביקשת את הפעולה הזו, תוכל להתעלם מהמייל הזה.
          </p>
        </div>
      </div>
    `;
  }
  
const emailTemplates = {
    verifyEmail: (link) =>
      baseTemplate({
        title: 'אימות כתובת הדוא"ל שלך',
        message: 'לחץ על הכפתור למטה כדי לאמת את כתובת הדוא"ל שלך ולסיים את ההרשמה.',
        buttonText: 'אמת כתובת דוא"ל',
        buttonLink: link,
      }),
  
    resendVerification: (link) =>
      baseTemplate({
        title: 'שליחה מחדש של קישור אימות',
        message: 'נראה שהקישור הקודם פג תוקף. לחץ על הכפתור למטה כדי לאמת את הדוא"ל שלך מחדש.',
        buttonText: 'אמת עכשיו',
        buttonLink: link,
      }),
  
    resetPassword: (link) =>
      baseTemplate({
        title: 'איפוס סיסמה',
        message: 'לחץ על הכפתור למטה כדי לבחור סיסמה חדשה.',
        buttonText: 'אפס סיסמה',
        buttonLink: link,
      }),
  };
  
  module.exports = { emailTemplates };