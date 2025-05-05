import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import '../styles/EditBusinessPage.css';
import { FaSave, FaTrash, FaPlus, FaUpload ,FaEdit} from 'react-icons/fa';
import MultiStep from 'react-multistep'


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

            <form className='upload-form' onSubmit={handleSubmit}>
                <div className='form-group'>
                    <label htmlFor="name">שם העסק</label>
                    <input type="text" id="name" name="name" value={businessData.name} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="address">כתובת</label>
                    <input type="text" id="address" name="address" value={businessData.address} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="phone">טלפון</label>
                    <input type="tel" id="phone" name="phone" value={businessData.phone} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="email">כתובת דואר אלקטרונית</label>
                    <input type="email" id="email" name="email" value={businessData.email} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="categoryId">תחום שירות</label>
                    <select id="categoryId" name="categoryId" value={businessData.categoryId} onChange={handleChange}>
                        <option value="">בחר תחום</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className='form-group'>
                    <label htmlFor="description">תיאור העסק</label>
                    <input type="text" id="description" name="description" value={businessData.description} onChange={handleChange} />
                </div>
{/* 
                {selectedBusiness?.logo && (
                    <div className='form-group'>
                        <label>לוגו</label>
                        <img src={`${process.env.REACT_APP_API_DOMAIN}/uploads/${selectedBusiness.logo.split('/').pop()}`} alt="Current Logo" className="business-logo-preview" />
                    </div>
                )}

                <div className='form-group'>
                    <input type="file" id="logo" name="logo" onChange={handleChange} />
                </div> */}

                <div className='form-group'>
                    {/* אם יש לוגו, הצג את כפתור עדכון */}
                    {selectedBusiness?.logo ? (
                        <>
                            <label htmlFor="logo" className="button file-upload">
                                <FaEdit className="icon" />
                                עריכת לוגו
                                <input 
                                    type="file" 
                                    id="logo" 
                                    name="logo" 
                                    onChange={handleChange} 
                                    style={{ display: 'none' }} 
                                />
                            </label>

                            {/* הצג את הלוגו */}
                            <img 
                                src={`${process.env.REACT_APP_API_DOMAIN}/uploads/${selectedBusiness.logo.split('/').pop()}`} 
                                alt="Current Logo" 
                                className="business-logo-preview" 
                            />
                        </>
                    ) : (
                        // אם אין לוגו, הצג כפתור בחירת לוגו
                        <label htmlFor="logo" className="button file-upload">
                            <FaUpload className="icon" />
                            {'בחירת לוגו'}
                            <input 
                                type="file" 
                                id="logo" 
                                name="logo" 
                                onChange={handleChange} 
                                style={{ display: 'none' }} 
                            />
                        </label>
                    )}
                </div>


            {/* <div className='form-group'>
                <label htmlFor="logo" className="button file-upload">
                    <FaUpload className="icon" />
                    {selectedBusiness?.logo ? 'עדכון לוגו' : 'בחירת לוגו'}
                    <input 
                        type="file" 
                        id="logo" 
                        name="logo" 
                        onChange={handleChange} 
                        style={{ display: 'none' }} 
                    />
                </label>
            </div> */}




                <div className="button-container">
                    {/* כפתור עדכון עם אייקון שמירה */}
                    <button className='button update' type="submit" disabled={isLoading}>
                        {isLoading ? 'Uploading...' : selectedBusiness ? (
                            <>
                                <FaSave className="icon" />
                                שמירה  
                            </>
                        ) : (
                            <>
                                {/* <FaPlus className="icon" /> */}
                                הוספת עסק 
                            </>
                        )}
                    </button>

                    {/* כפתור מחיקה */}
                    {selectedBusiness && (
                        <button
                            className='button delete'
                            type="button"
                            onClick={() => handleDeleteBusiness(selectedBusiness._id)}
                        >
                            <FaTrash className="icon" />
                            מחיקה
                        </button>
                    )}
                </div>

                
            </form>
        </div>
    );
};

export default EditBusinessPage;
