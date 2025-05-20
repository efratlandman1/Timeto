import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaSave, FaPlus, FaEdit } from 'react-icons/fa';
import MultiStep from 'react-multistep';
import StepBusinessDetails from './StepBusinessDetails';
import StepBusinessServices from './StepBusinessServices';
import StepBusinessHours from './StepBusinessHours';
import '../styles/EditBusinessPage.css';
import { setSelectedBusiness } from '../redux/businessSlice'; // ודא שיש פעולה כזו

const EditBusinessPage = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const selectedBusiness = useSelector(state =>
    state.business.selectedBusiness && state.business.selectedBusiness._id === id
      ? state.business.selectedBusiness
      : null
  );

  const [businessData, setBusinessData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    categoryId: '',
    description: '',
    logo: null,
    services: [],
    openingHours: []
  });

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // פונקציה פנימית לטעינת העסק
    const loadBusiness = async (businessId) => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
      if (!token) {
        window.location.href = '/login';
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${businessId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const biz = response.data;
        dispatch(setSelectedBusiness(biz));
        initializeBusinessData(biz);
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const initializeBusinessData = (biz) => {
      const deepCopiedHours = JSON.parse(JSON.stringify(biz.openingHours || []));
      setBusinessData({
        id: biz._id,
        name: biz.name,
        address: biz.address,
        phone: biz.phone,
        email: biz.email,
        categoryId: biz.categoryId,
        description: biz.description,
        logo: biz.logo || null,
        services: biz.services || [],
        openingHours: deepCopiedHours
      });
    };

    fetchCategories();

    if (id) {
      if (selectedBusiness) {
        // יש כבר עסק ברידקס עם ה-ID המבוקש, נאתחל ישירות
        initializeBusinessData(selectedBusiness);
      } else {
        // אין ברידקס, נטען מה-API
        loadBusiness(id);
      }
    } else {
      // אין ID, אתחל לעסק חדש (כמו שהייתה ההגדרה ההתחלתית)
      setBusinessData({
        name: '',
        address: '',
        phone: '',
        email: '',
        categoryId: '',
        description: '',
        logo: null,
        services: [],
        openingHours: []
      });
    }
  }, [id, selectedBusiness, dispatch]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // --- שאר הקוד שלך בלי שינוי ---

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setBusinessData(prev => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null
      }));
    } else {
      setBusinessData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setIsLoading(true);
    setMessage(null);

    const requiredFields = ["name", "categoryId", "address", "phone", "email"];
    const missingFields = requiredFields.filter(field => !businessData[field] || String(businessData[field]).trim() === "");
    if (missingFields.length > 0) {
      setIsLoading(false);
      setMessage({ type: 'error', text: `Please fill in the required fields: ${missingFields.join(", ")}` });
      return;
    }

    const formData = new FormData();
    formData.append('name', businessData.name);
    formData.append('categoryId', businessData.categoryId);
    formData.append('description', businessData.description);
    formData.append('address', businessData.address);
    formData.append('phone', businessData.phone);
    formData.append('email', businessData.email);
    if (businessData.services && businessData.services.length > 0) {
      formData.append('services', JSON.stringify(businessData.services));
    }
    const sortedHours = [...businessData.openingHours].sort((a, b) => a.day - b.day);
    formData.append('openingHours', JSON.stringify(sortedHours));

    if (businessData.logo) {
      formData.append('logo', businessData.logo);
    }

    if (businessData.id) {
      formData.append('id', businessData.id);
    }

    try {
      const token = getToken();
      await uploadBusiness(token, formData);
      setMessage({ type: 'success', text: `Business ${selectedBusiness ? 'updated' : 'created'} successfully!` });
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while processing the business' });
    } finally {
      setIsLoading(false);
    }
  };

  const getToken = () => {
    const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  };

  const uploadBusiness = async (token, formData) => {
    return await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`, formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });
  };

  return (
    <div className={`page-container ${isLoading ? 'disabled' : ''}`}>
      <div className='step-page-container'>
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-animation">🕺💃 Loading... Please dance with me! 🎵</div>
          </div>
        )}

        {message && (
          <div className={`message-box ${message.type === 'success' ? 'success' : 'error'}`}>
            {message.text}
          </div>
        )}

        <div className="page-header">
          <h1>{selectedBusiness ? 'עדכון פרטי עסק' : 'הוספת עסק'}</h1>
          <div className="header-line"></div>
        </div>

        <MultiStep
          showNavigation={true}
          prevButton={{
            title: '→',
            style: {
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              marginInlineStart: '10px',
              marginTop: '14px',
              marginBottom: '24px'
            }
          }}
          nextButton={{
            title: '←',
            style: {
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '22px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              marginInlineStart: '10px',
              marginTop: '14px',
              marginBottom: '24px'
            }
          }}
        >
          <StepBusinessDetails title='פרטים כלליים' businessData={businessData} setBusinessData={setBusinessData} categories={categories} />
          <StepBusinessServices title='שירותי העסק' businessData={businessData} setBusinessData={setBusinessData} categories={categories} />
          <StepBusinessHours title='שעות פעילות' businessData={businessData} setBusinessData={setBusinessData} categories={categories} />
        </MultiStep>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="save-button"
        >
          {selectedBusiness ? <FaEdit /> : <FaPlus />}
          {selectedBusiness ? 'עדכן פרטי עסק' : 'צור עסק חדש'}
        </button>
      </div>
    </div>
  );
};

export default EditBusinessPage;
