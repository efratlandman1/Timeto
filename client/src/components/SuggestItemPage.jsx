import React, { useState, useEffect } from 'react';
import { FaArrowRight, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/SuggestItemPage.css';
import { useTranslation } from 'react-i18next';

const SuggestItemPage = () => {
  const { t, ready } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState('business'); // business | sale
  const [formData, setFormData] = useState({
    domain: 'business',
    type: 'category',
    name_he: '',
    parent_category_id: '',
    sale_category_id: '',
    reason: '',
    notifyEmail: '',
    notifyPhone: ''
  });

  const [categories, setCategories] = useState([]);
  const [saleCategories, setSaleCategories] = useState([]);
  
    useEffect(() => {
    const fetchData = async () => {
      try {
        const [resCat, resSale] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`),
          axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/sale-categories`)
        ]);
        setCategories(resCat.data.data.categories || []);
        setSaleCategories(resSale.data.data.categories || []);
      } catch (error) {
        console.error('Error fetching suggestion metadata:', error);
        toast.error('שגיאה בטעינת נתוני מטה');
      }
    };
    fetchData();
  }, []);
  
  // Reset relevant fields when switching mode (gating)
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      domain: mode,
      type: 'category',
      parent_category_id: '',
      sale_category_id: ''
    }));
  }, [mode]);
  
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
      const payload = {
        domain: formData.domain,
        type: formData.type,
        name_he: formData.name_he,
        // backend no longer requires english
        reason: formData.reason,
        notifyEmail: formData.notifyEmail || undefined,
        notifyPhone: formData.notifyPhone || undefined,
        ...(mode === 'business' && formData.type === 'service' ? { parent_category_id: formData.parent_category_id } : {}),
        ...(mode === 'sale' && formData.type === 'subcategory' ? { sale_category_id: formData.sale_category_id } : {})
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_DOMAIN}/api/v1/suggestions`,
        payload
      );
      
      toast.success(t('suggestItem.messages.success'));

      setFormData({
        domain: mode,
        type: 'category',
        name_he: '',
        parent_category_id: '',
        sale_category_id: '',
        reason: '',
        notifyEmail: '',
        notifyPhone: ''
      });

      // Close modal after short delay
      setTimeout(() => {
        navigate(-1);
      }, 300);
      
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      toast.error(t('suggestItem.messages.error'));
    }
  };

  const RequiredMark = () => <span className="required-asterisk">*</span>;
  const handleClose = () => navigate(-1);

  return (
    <div className="modal-overlay-fixed" onClick={handleClose}>
      <div className="modal-container suggest-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="suggest-modal-title">
        <div className="modal-header">
          <button className="modal-close" aria-label={t('common.cancel')} onClick={handleClose}><FaTimes /></button>
          <h1 id="suggest-modal-title" className="login-title suggest-modal-title">{t('suggestItem.title')}</h1>
        </div>

        <form className="suggest-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('suggestItem.contextLabel')}</label>
            <div className="segmented-control" role="tablist" aria-label="context selector">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'business'}
                className={`segment ${mode === 'business' ? 'active' : ''}`}
                onClick={() => setMode('business')}
              >
                {t('suggestItem.modes.business')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'sale'}
                className={`segment ${mode === 'sale' ? 'active' : ''}`}
                onClick={() => setMode('sale')}
              >
                {t('suggestItem.modes.sale')}
              </button>
            </div>
          </div>

          {mode === 'business' && (
            <div className="form-group">
              <label className="form-label">{t('suggestItem.form.type.label')}</label>
              <div className="segmented-control" role="tablist" aria-label="type selector">
                <button
                  type="button"
                  role="tab"
                  aria-selected={formData.type === 'category'}
                  className={`segment ${formData.type === 'category' ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'type', value: 'category' } })}
                >
                  {t('suggestItem.form.type.category')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={formData.type === 'service'}
                  className={`segment ${formData.type === 'service' ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'type', value: 'service' } })}
                >
                  {t('suggestItem.form.type.service')}
                </button>
              </div>
            </div>
          )}

          {mode === 'sale' && (
            <div className="form-group">
              <label className="form-label">סוג הצעה</label>
              <div className="segmented-control" role="tablist" aria-label="sale type selector">
                <button
                  type="button"
                  role="tab"
                  aria-selected={formData.type === 'category'}
                  className={`segment ${formData.type === 'category' ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'type', value: 'category' } })}
                >
                  קטגוריה
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={formData.type === 'subcategory'}
                  className={`segment ${formData.type === 'subcategory' ? 'active' : ''}`}
                  onClick={() => handleChange({ target: { name: 'type', value: 'subcategory' } })}
                >
                  תת קטגוריה
                </button>
              </div>
            </div>
          )}

          <div className="section-card">
            <div className="form-group">
              <label htmlFor="name_he" className="form-label">
                שם ההצעה<RequiredMark />
              </label>
              <input
                type="text"
                id="name_he"
                name="name_he"
                value={formData.name_he}
                onChange={handleChange}
                required
                placeholder={t('suggestItem.form.name.placeholder')}
              />
            </div>
          </div>

          {mode === 'business' && formData.type === 'service' && categories.length > 0 && (
            <div className="form-group standalone-field">
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

          

          {mode === 'sale' && formData.type === 'subcategory' && (
            <div className="section-card">
              <div className="form-group">
                <label className="form-label">{t('suggestItem.form.saleCategory')} <span className="required-asterisk">*</span></label>
                <select
                  className="form-select"
                  value={formData.sale_category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, sale_category_id: e.target.value }))}
                  required
                >
                  <option value="">{t('suggestItem.form.selectSaleCategory')}</option>
                  {saleCategories.map(sc => (
                    <option key={sc._id} value={sc._id}>{sc.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="reason" className="form-label">סיבה והסבר (אופציונלי)</label>
            <textarea id="reason" name="reason" value={formData.reason} onChange={handleChange} rows={3} />
          </div>

          <div className="section-card">
            <div className="two-col">
              <div className="form-group">
                <label className="form-label" htmlFor="notifyEmail">אימייל לעדכון (אופציונלי)</label>
                <input type="email" id="notifyEmail" name="notifyEmail" value={formData.notifyEmail} onChange={handleChange} placeholder="name@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="notifyPhone">טלפון לעדכון (אופציונלי)</label>
                <input type="tel" id="notifyPhone" name="notifyPhone" value={formData.notifyPhone} onChange={handleChange} placeholder="050-0000000" />
              </div>
            </div>
          </div>

          <div className="button-row fullwidth">
            <button type="submit" className="submit-button clean-full">{t('suggestItem.form.submit')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestItemPage; 