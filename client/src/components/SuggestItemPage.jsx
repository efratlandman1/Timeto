import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/SuggestItemPage.css';
import { useTranslation } from 'react-i18next';

const SuggestItemPage = () => {
  const { t, ready } = useTranslation();
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
        setCategories(response.data.data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error(t('businessForm.errors.categories'));
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);
  
  // Wait for translations to load
  if (!ready) {
    return (
      <div className="narrow-page-container">
        <div className="narrow-page-content">
          <div className="loading-container">
            <span>Loading translations...</span>
          </div>
        </div>
      </div>
    );
  }

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
      
      toast.success(t('suggestItem.messages.success'), {
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
      toast.error(t('suggestItem.messages.error'));
    }
  };

  const RequiredMark = () => <span style={{ color: '#d32f2f', marginRight: '4px' }}>*</span>;

  return (
    <div className="narrow-page-container">
      <div className="narrow-page-content">
        <button className="nav-button above-header" onClick={() => navigate('/')}>
          <FaArrowRight className="icon" />
          {t('common.backToHome')}
        </button>

        <div className="page-header">
          <div className="page-header__content vertical">
            <h1>{t('suggestItem.title')}</h1>
            <p>{t('suggestItem.description')}</p>
          </div>
        </div>

        <form className="suggest-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              {t('suggestItem.form.type.label')}<RequiredMark />
            </label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="category"
                  checked={formData.type === 'category'}
                  onChange={handleChange}
                />
                {t('suggestItem.form.type.category')}
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="type"
                  value="service"
                  checked={formData.type === 'service'}
                  onChange={handleChange}
                />
                {t('suggestItem.form.type.service')}
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name_he" className="form-label">
              {t('suggestItem.form.name.he')}<RequiredMark />
            </label>
            <input
              type="text"
              id="name_he"
              name="name_he"
              value={formData.name_he}
              onChange={handleChange}
              required
              placeholder={t('suggestItem.form.name.he.placeholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="name_en" className="form-label">
              {t('suggestItem.form.name.en')}<RequiredMark />
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
            <div className="form-group">
              <label htmlFor="parent_category_id" className="form-label">
                {t('suggestItem.form.parentCategory')}<RequiredMark />
              </label>
              <select
                id="parent_category_id"
                name="parent_category_id"
                value={formData.parent_category_id}
                onChange={handleChange}
                required
              >
                <option value="">{t('businessForm.fields.selectCategory')}</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason" className="form-label">
              {t('suggestItem.form.reason')}
            </label>
            <textarea
              id="reason"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder={t('suggestItem.form.reason.placeholder')}
              rows={3}
            />
          </div>

          <button type="submit" className="submit-button">
            <FaPaperPlane />
            {t('suggestItem.form.submit')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SuggestItemPage; 