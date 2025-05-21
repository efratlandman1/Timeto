import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaSave, FaPlus, FaEdit } from 'react-icons/fa';
import StepBusinessDetails from './StepBusinessDetails';
import StepBusinessServices from './StepBusinessServices';
import StepBusinessHours from './StepBusinessHours';
import '../styles/EditBusinessPage.css';
import { setSelectedBusiness } from '../redux/businessSlice';
import { ToastContainer,toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Steps, StepsProvider, useSteps } from 'react-step-builder';

const ProgressBar = () => {
  const { current, total, jump } = useSteps();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      marginBottom: 20,
      marginTop: 10,
      padding: '0 20px',
    }}>
      {/* פס רקע */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: 4,
        backgroundColor: '#eee',
        zIndex: 0,
        transform: 'translateY(-50%)',
      }} />

      {/* עיגולים */}
      {[...Array(total)].map((_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === current;
        return (
          <div
            key={index}
            onClick={() => jump(stepNumber)}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: '2px solid red',
              backgroundColor: isActive ? 'red' : 'white',
              cursor: 'pointer',
              zIndex: 1,
            }}
            title={`שלב ${stepNumber}`}
          />
        );
      })}
    </div>
  );
};


const NavigationButtons = () => {
  const { next, prev, current, total } = useSteps();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',  // יישור החיצים לצדדים (ימין ושמאל)
      marginTop: 24,
      marginBottom: 24,
      padding: '0 10px'
    }}>
      {/* חץ שמאלי - חזרה */}
      {current > 1 ? (
        <button
          onClick={prev}
          style={{
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '22px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            backgroundColor: 'white',
          }}
          aria-label="Previous step"
        >
         → 
        </button>
      ) : <div style={{ width: '100px' }} />} {/* לשמור רווח שווה */}

      {/* חץ ימני - קדימה */}
      {current < total ? (
        <button
          onClick={next}
          style={{
            border: 'none',
            borderRadius: '8px',
            padding: '10px 24px',
            fontSize: '22px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            backgroundColor: 'white',
          }}
          aria-label="Next step"
        >
          ←
        </button>
      ) : <div style={{ width: '100px' }} />} {/* לשמור רווח שווה */}
    </div>
  );
};

const MySteps = ({ businessData, setBusinessData, categories, handleSubmit, selectedBusiness }) => {
  const { current } = useSteps();

  return (
    <>
      <ProgressBar />

      <Steps>
        <StepBusinessDetails
          title='פרטים כלליים'
          businessData={businessData}
          setBusinessData={setBusinessData}
          categories={categories}
        />
        <StepBusinessServices
          title='שירותי העסק'
          businessData={businessData}
          setBusinessData={setBusinessData}
          categories={categories}
        />
        <StepBusinessHours
          title='שעות פעילות'
          businessData={businessData}
          setBusinessData={setBusinessData}
          categories={categories}
        />
      </Steps>

      <NavigationButtons />

      {current === 3 && (
        <button
          onClick={handleSubmit}
          className="save-button"
          style={{ marginTop: '20px' }}
        >
          {selectedBusiness ? <FaEdit /> : <FaPlus />}
          {selectedBusiness ? 'עדכן פרטי עסק' : 'צור עסק חדש'}
        </button>
      )}
    </>
  );
};

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

  useEffect(() => {
    const loadBusiness = async (businessId) => {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
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
        initializeBusinessData(selectedBusiness); 
      } else {
        loadBusiness(id);
      }
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

    const requiredFields = ["name", "categoryId", "address", "phone", "email"];
    const missingFields = requiredFields.filter(field => !businessData[field] || String(businessData[field]).trim() === "");
    if (missingFields.length > 0) {
      setIsLoading(false);
      toast.error(`נא למלא את השדות הנדרשים: ${missingFields.join(", ")}`);
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
      toast.success(`העסק ${selectedBusiness ? 'עודכן' : 'נוצר'} בהצלחה!`);
    } catch (error) {
      toast.error('אירעה שגיאה בעת שמירת העסק');
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
        {/* {isLoading && (
          <div className="loading-overlay">
            <div className="edit-business-spinner" />
          </div>
        )} */}


        <div className="page-header">
          <h1>{selectedBusiness ? 'עדכון פרטי עסק' : 'הוספת עסק'}</h1>
          <div className="header-line"></div>
        </div>

        <StepsProvider>
          <MySteps
            businessData={businessData}
            setBusinessData={setBusinessData}
            categories={categories}
            handleSubmit={handleSubmit}
            selectedBusiness={selectedBusiness}
          />
        </StepsProvider>

        <ToastContainer />
      </div>
    </div>
  );
};

export default EditBusinessPage;
