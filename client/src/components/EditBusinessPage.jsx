// ... כל הייבוא נשאר כמו שהיה
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams,useNavigate  } from 'react-router-dom';
import axios from 'axios';
import { FaSave, FaPlus, FaEdit } from 'react-icons/fa';
import StepBusinessDetails from './StepBusinessDetails';
import StepBusinessServices from './StepBusinessServices';
import StepBusinessHours from './StepBusinessHours';
import '../styles/EditBusinessPage.css';
import { setSelectedBusiness } from '../redux/businessSlice';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Steps, StepsProvider, useSteps } from 'react-step-builder';
import {getToken} from "../utils/auth";

const requiredFields = ["name", "categoryId", "address", "phone", "prefix", "email"];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => {
  const cleaned = phone.replace(/[-\s]/g, '');
  return /^\d{6,7}$/.test(cleaned); 
};

const isValidOpeningHours = (openingHours = []) => {
  return openingHours.every(day => {
    if (day.closed) return true; // סגור = תקין

    if (!Array.isArray(day.ranges) || day.ranges.length === 0) return false;

    return day.ranges.every(range => {
      if (!range.open || !range.close) return false;

      const [openHour, openMinute] = range.open.split(':').map(Number);
      const [closeHour, closeMinute] = range.close.split(':').map(Number);

      const openTotalMinutes = openHour * 60 + openMinute;
      const closeTotalMinutes = closeHour * 60 + closeMinute;

      return closeTotalMinutes > openTotalMinutes;
    });
  });
};



// ProgressBar
const ProgressBar = ({ businessData }) => {
  const { current, jump, total } = useSteps();

  const canJumpForward = requiredFields.every(
    (field) => businessData[field] && String(businessData[field]).trim() !== ''
  ) && isValidEmail(businessData.email) && isValidPhone(businessData.phone);

  const handleJump = (stepNumber) => {
    if (stepNumber > current && !canJumpForward) {
      if (!isValidEmail(businessData.email)) {
        toast.error('כתובת האימייל אינה תקינה');
      } else if (!isValidPhone(businessData.phone)) {
        toast.error('מספר הטלפון אינו תקין');
      } else {
        toast.error('נא למלא את כל השדות החובה לפני המעבר לשלב הבא');
      }
      return;
    }
    jump(stepNumber);
  };

  const progressBarStyle = {
    '--current-step': current,
    '--total-steps': total,
  };

  const steps = ['פרטי עסק', 'שירותי העסק', 'שעות פעילות'].reverse();

  return (
    <div className="edit-business-progress-bar" style={progressBarStyle}>
      <div className="edit-business-progress-bar-line" />
      {steps.map((label, index) => {
        const actualIndex = steps.length - 1 - index;
        const stepNumber = actualIndex + 1;
        const isActive = stepNumber === current;
        const isCompleted = stepNumber < current;
        return (
          <div
            key={index}
            onClick={() => handleJump(stepNumber)}
            className={`edit-business-progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div
              className={`edit-business-progress-circle ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
              title={`שלב ${stepNumber}`}
            >
              {stepNumber}
            </div>
            <span className="edit-business-step-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

// NavigationButtons
const NavigationButtons = ({ businessData }) => {
  const { next, prev, current, total } = useSteps();

  const canGoNext = requiredFields.every(
    (field) => businessData[field] && String(businessData[field]).trim() !== ''
  ) && isValidEmail(businessData.email) && isValidPhone(businessData.phone);

  const handleNext = () => {
    if (!canGoNext) {
      if (!isValidEmail(businessData.email)) {
        toast.error('כתובת האימייל אינה תקינה');
      } else if (!isValidPhone(businessData.phone)) {
        toast.error('מספר הטלפון אינו תקין');
      } else {
        toast.error('נא למלא את כל שדות החובה לפני המעבר לשלב הבא');
      }
      return;
    }
    next();
  };

  return (
    <div className="edit-business-navigation-buttons">
      {current > 1 ? (
        <button onClick={prev} className="edit-business-arrow-button" aria-label="Previous step">
          →
        </button>
      ) : (
        <div className="edit-business-arrow-spacer" />
      )}
      {current < total ? (
        <button onClick={handleNext} className="edit-business-arrow-button" aria-label="Next step">
          ←
        </button>
      ) : (
        <div className="edit-business-arrow-spacer" />
      )}
    </div>
  );
};

const MySteps = ({
  businessData,
  setBusinessData,
  categories,
  handleSubmit,
  selectedBusiness,
}) => {
  const { current } = useSteps();

  return (
    <>
      <ProgressBar businessData={businessData} />
      <Steps>
        <StepBusinessDetails {...{ businessData, setBusinessData, categories }} />
        <StepBusinessServices {...{ businessData, setBusinessData, categories }} />
        <StepBusinessHours {...{ businessData, setBusinessData, categories }} />
      </Steps>
      <NavigationButtons businessData={businessData} />
      {/* {current === 3 && isValidOpeningHours(businessData.openingHours) &&  ( */}
      {current === 3  &&  (
        <button onClick={handleSubmit} className="save-button">
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
  const navigate = useNavigate();

  const selectedBusiness = useSelector(
    (state) =>
      state.business.selectedBusiness && state.business.selectedBusiness._id === id
        ? state.business.selectedBusiness
        : null
  );

  const [businessData, setBusinessData] = useState({
    name: '',
    address: '',
    prefix: '',
    phone: '',
    email: '',
    categoryId: '',
    description: '',
    logo: null,
    services: [],
    openingHours: [],
  });

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadBusiness = async (businessId) => {
      const token = getToken();
      if (!token) {
        window.location.href = '/login';
        return;
      }
      setIsLoading(true);
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${businessId}`, {
          headers: { Authorization: `Bearer ${token}` },
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
        prefix: biz.prefix,
        phone: biz.phone,
        email: biz.email,
        categoryId: biz.categoryId && typeof biz.categoryId === 'object' ? biz.categoryId._id : biz.categoryId,
        description: biz.description,
        logo: biz.logo || null,
        services: biz.services || [],
        openingHours: deepCopiedHours,
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
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setBusinessData((prev) => ({
        ...prev,
        [name]: files && files[0] ? files[0] : null,
      }));
    } else {
      setBusinessData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    setIsLoading(true);

    const missingFields = requiredFields.filter(
      (field) => !businessData[field] || String(businessData[field]).trim() === ''
    );
    if (missingFields.length > 0) {
      setIsLoading(false);
      toast.error(`נא למלא את השדות הנדרשים: ${missingFields.join(', ')}`);
      return;
    }

    if (!isValidEmail(businessData.email)) {
      setIsLoading(false);
      toast.error('כתובת האימייל אינה תקינה');
      return;
    }

    if (!isValidPhone(businessData.phone)) {
      setIsLoading(false);
      toast.error('מספר הטלפון אינו תקין');
      return;
    }

    if (!isValidOpeningHours(businessData.openingHours)) {
      setIsLoading(false);
      toast.error('יש להשלים שעות פתיחה ו/או סגירה עבור ימים פתוחים');
      return;
}

    const formData = new FormData();
    formData.append('name', businessData.name);
    formData.append('categoryId', businessData.categoryId);
    formData.append('description', businessData.description);
    formData.append('address', businessData.address);
    formData.append('prefix', businessData.prefix);
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
      toast.success(`העסק ${selectedBusiness ? 'עודכן' : 'נוצר'} בהצלחה!`, {
        position: 'top-center',
        className: 'custom-toast',
      });
      setTimeout(() => {
        navigate('/user-businesses');
      }, 1500);
    } catch (error) {
      toast.error('אירעה שגיאה בעת שמירת העסק');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadBusiness = async (token, formData) => {
    return await axios.post(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  };

  return (
    <div className={`page-container ${isLoading ? 'disabled' : ''}`}>
      <div className="step-page-container">
        <div className="page-header">
          <h1>{selectedBusiness ? 'עדכון פרטי עסק' : 'הוספת עסק חדש'}</h1>
          <p>מלא את הפרטים להלן כדי להוסיף או לעדכן עסק במדריך</p>
          {/* <div className="header-line"></div> */}
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
