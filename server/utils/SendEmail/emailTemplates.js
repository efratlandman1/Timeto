// emailTemplates.js

function baseTemplate({ title, message, buttonText, buttonLink }) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; padding: 30px; direction: rtl; text-align: right;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
        <h2 style="color: #d32f2f; font-size: 24px; margin-bottom: 20px;">${title}</h2>
        <p style="font-size: 16px; color: #444; line-height: 1.6;">${message}</p>
        <a href="${buttonLink}" style="
          display: inline-block;
          margin-top: 30px;
          padding: 14px 28px;
          background-color: #d32f2f;
          color: white;
          text-decoration: none;
          font-weight: bold;
          border-radius: 8px;
          box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          transition: background-color 0.3s ease;">
          ${buttonText}
        </a>
        <p style="margin-top: 50px; font-size: 12px; color: #888;">
          אם לא ביקשת את הפעולה הזו, תוכל להתעלם מהמייל הזה – לא יתבצע שום שינוי.
        </p>
      </div>
    </div>
  `;
}

  
const emailTemplates = {
    verifyEmail: (link) =>
      baseTemplate({
        title: 'אימות כתובת הדוא"ל שלך',
        message: 'נשאר רק צעד אחד – לחצו על הכפתור ואשרו את כתובת המייל שלכם',
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
        message: 'בואו לבחור סיסמה חדשה ולהיכנס מחדש בבטחה',
        buttonText: 'אפס סיסמה',
        buttonLink: link,
      }),
  };
  
  module.exports = { emailTemplates };