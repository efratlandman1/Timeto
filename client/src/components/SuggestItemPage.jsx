import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
// import '../styles/SuggestItemPage.css';

const SuggestItemPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'category',
    name_he: '',
    name_en: '',
    parent_category_id: '',
    reason: ''
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
        if (response.data && Array.isArray(response.data)) {
          setCategories(response.data);
        } else if (response.data && Array.isArray(response.data.data)) {
          setCategories(response.data.data);
        } else {
          console.error('Unexpected categories data structure:', response.data);
          setCategories([]);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('שגיאה בטעינת הקטגוריות');
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
      // Reset parent_category_id when switching from service to category
      ...(name === 'type' && value === 'category' ? { parent_category_id: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_DOMAIN}/api/v1/suggestions`,
        formData
      );
      
      toast.success('ההצעה נשלחה בהצלחה!', {
        onClose: () => {
          navigate('/');
        }
      });

      setFormData({
        type: 'category',
        name_he: '',
        name_en: '',
        parent_category_id: '',
        reason: ''
      });

      // Navigate to home page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error('שגיאה בשליחת ההצעה');
    }
  };

  const RequiredMark = () => <span className="required-mark">*</span>;

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          <FaArrowRight className="icon" />
          חזרה לדף הבית
        </button>

        <div className="page-header">
          <div className="page-header__content vertical">
            <h1>הצעת עסק חדש</h1>
            <p>מלא את הפרטים הבאים כדי להציע עסק חדש</p>
          </div>
        </div>

        <form className="suggest-form" onSubmit={handleSubmit}>
          <div className="form-field-container">
            <label>
              סוג הצעה<RequiredMark />
            </label>
            <div className="form-field-vertical-container">
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

          <div className="form-field-container">
            <label htmlFor="name_he">
              שם בעברית<RequiredMark />
            </label>
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

          <div className="form-field-container">
            <label htmlFor="name_en">
              שם באנגלית<RequiredMark />
            </label>
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

          {formData.type === 'service' && categories.length > 0 && (
            <div className="form-field-container">
              <label htmlFor="parent_category_id">
                קטגוריית אב<RequiredMark />
              </label>
              <select
                id="parent_category_id"
                name="parent_category_id"
                value={formData.parent_category_id}
                onChange={handleChange}
                required
              >
                <option value="">בחר קטגוריה</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field-container">
            <label htmlFor="reason">
              סיבה או תיאור קצר
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="מדוע אתה חושב שפריט זה נחוץ?"
              rows={3}
            />
          </div>

          <div className="actions-container">
            <button type="submit" className="btn btn-solid btn-primary">
              שלח הצעה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestItemPage; 