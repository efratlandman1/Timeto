import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { FaSave, FaTrash } from 'react-icons/fa';
import MultiStep from 'react-multistep';
import StepBusinessDetails from './StepBusinessDetails';
import StepBusinessServices from './StepBusinessServices';
import StepBusinessHours from './StepBusinessHours';
import '../styles/EditBusinessPage.css';



const EditBusinessPage = () => {
    const selectedBusiness = useSelector(state => state.business.selectedBusiness);
    const [businessData, setBusinessData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        categoryId: '',
        description: '',
        logo: null
    });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => { 
        if (selectedBusiness) {
            setBusinessData({
                id: selectedBusiness._id,
                name: selectedBusiness.name,
                address: selectedBusiness.address,
                phone: selectedBusiness.phone,
                email: selectedBusiness.email,
                categoryId: selectedBusiness.categoryId,
                description: selectedBusiness.description,
                logo: selectedBusiness.logo || null
            });
        }
        fetchCategories();
    }, []);

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
        e.preventDefault();
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
                <div className="header-line"></div> {/* אלמנט אדום קטן מתחת לכותרת */}
            </div>

            <div class='step-page-container'>
                <MultiStep activeStep={0}
                            showNavigation={true}
                            prevButton={{
                                title: '→',
                                style: {
                                  backgroundColor: '#444',         // אפור כהה
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '10px 24px',
                                  fontSize: '22px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                  marginInlineStart: '10px',
                                  marginTop: '24px'                // רווח מהתוכן שמעל
                                }
                              }}
                              nextButton={{
                                title: '←',
                                style: {
                                  backgroundColor: '#d32f2f',      // אדום האפליקציה
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '10px 24px',
                                  fontSize: '22px',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                                  marginInlineStart: '10px',
                                  marginTop: '24px'                // רווח מהתוכן שמעל
                                }
                              }}
                            >
                    <StepBusinessDetails    title='פרטים כלליים'    businessData={businessData}  setBusinessData={setBusinessData} categories={categories} />
                    <StepBusinessServices   title='שירותי העסק'     businessData={businessData}  setBusinessData={setBusinessData} categories={categories} />
                    <StepBusinessHours      title='שעות פעילות'     businessData={businessData}  setBusinessData={setBusinessData} categories={categories} />
                </MultiStep>
            </div>
        </div>
    );
};

export default EditBusinessPage;
