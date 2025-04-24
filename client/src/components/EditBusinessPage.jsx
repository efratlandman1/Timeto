import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
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
        logo: null // Changed to null since only one file is allowed
    });
    const [categories, setCategories] = useState([
        { id: 1, name: 'Manicure' },
        { id: 2, name: 'Pedicure' },
        { id: 3, name: 'Hair Styling' },
        { id: 4, name: 'Massage Therapy' }
    ]);
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
                logo: selectedBusiness.logo || null // Set to null if no logo
            });
        }
    }, [selectedBusiness]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'logo') {
            setBusinessData(prev => ({
                ...prev,
                [name]: files && files[0] ? files[0] : null // Only set the first file or null
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

        // Required fields (excluding logo and description)
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

        if (businessData.logo) { // Append logo only if it exists
            formData.append('logo', businessData.logo);
        }

        if (businessData.id) { // Append ID only if it exists
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

    // Upload a new business
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

            <form className='upload-form' onSubmit={handleSubmit}>
                <div className='form-group'>
                    <label htmlFor="name">Business Name:</label>
                    <input type="text" id="name" name="name" value={businessData.name} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="address">Address:</label>
                    <input type="text" id="address" name="address" value={businessData.address} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="phone">Phone Number:</label>
                    <input type="tel" id="phone" name="phone" value={businessData.phone} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="email">Email:</label>
                    <input type="email" id="email" name="email" value={businessData.email} onChange={handleChange} />
                </div>

                <div className='form-group'>
                    <label htmlFor="categoryId">Category:</label>
                    <select id="categoryId" name="categoryId" value={businessData.categoryId} onChange={handleChange}>
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className='form-group'>
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description" value={businessData.description} onChange={handleChange} />
                </div>

                {selectedBusiness?.logo && (
                    <div className='form-group'>
                        <label>Current Logo:</label>
                        <img src={`${process.env.REACT_APP_API_DOMAIN}/uploads/${selectedBusiness.logo.split('/').pop()}`} alt="Current Logo" className="business-logo-preview" />
                    </div>
                )}

                <div className='form-group'>
                    <label htmlFor="logo">Upload New Logo:</label>
                    <input type="file" id="logo" name="logo" onChange={handleChange} />
                </div>

                <button className='submit-business-form' type="submit" disabled={isLoading}>
                    {isLoading ? 'Uploading...' : selectedBusiness ? 'Update Business' : 'Create Business'}
                </button>
            </form>
        </div>
    );
};

export default EditBusinessPage;
