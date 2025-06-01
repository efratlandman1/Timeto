import React, { useState } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/SuggestItemPage.css';

const SuggestItemPage = () => {
  const [formData, setFormData] = useState({
    type: 'category',
    name_he: '',
    name_en: '',
    parent_category_id: '',
    reason: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_DOMAIN}/api/v1/suggestions`,
        formData
      );
      
      if (response.status === 201) {
        toast.success('ההצעה נשלחה בהצלחה!', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        // Reset form
        setFormData({
          type: 'category',
          name_he: '',
          name_en: '',
          parent_category_id: '',
          reason: ''
        });
      }
    } catch (error) {
      toast.error('אירעה שגיאה בשליחת ההצעה. אנא נסה שוב מאוחר יותר.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      console.error('Error submitting suggestion:', error);
    }
  };

  return (
    <div className="suggest-item-container">
      <div className="suggest-item-content">
        <h1>הצע פריט חדש</h1>
        <p className="subtitle">יש לך רעיון לקטגוריה או שירות שחסרים? ספר לנו!</p>
        
        <form onSubmit={handleSubmit} className="suggest-form">
          <div className="form-group">
            <label>סוג הצעה</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="category"
                  checked={formData.type === 'category'}
                  onChange={handleChange}
                />
                קטגוריה
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="service"
                  checked={formData.type === 'service'}
                  onChange={handleChange}
                />
                שירות
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name_he">שם בעברית *</label>
            <input
              type="text"
              id="name_he"
              name="name_he"
              value={formData.name_he}
              onChange={handleChange}
              required
              placeholder="לדוגמה: אינסטלציה מתקדמת"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name_en">שם באנגלית *</label>
            <input
              type="text"
              id="name_en"
              name="name_en"
              value={formData.name_en}
              onChange={handleChange}
              required
              placeholder="e.g., Advanced Plumbing"
            />
          </div>

          {formData.type === 'service' && (
            <div className="form-group">
              <label htmlFor="parent_category_id">קטגוריית אב</label>
              <input
                type="text"
                id="parent_category_id"
                name="parent_category_id"
                value={formData.parent_category_id}
                onChange={handleChange}
                placeholder="הזן את מזהה קטגוריית האב"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason">סיבה או תיאור קצר</label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="מדוע אתה חושב שפריט זה נחוץ?"
              rows={4}
            />
          </div>

          <button type="submit" className="submit-button">
            <FaPaperPlane />
            שלח הצעה
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuggestItemPage; 