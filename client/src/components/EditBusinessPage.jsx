import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import '../styles/uploadPage.css';

const EditBusinessPage = () => {
    const selectedBusiness = useSelector(state => state.business.selectedBusiness);
    const [businessData, setBusinessData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        categoryId: '',
        description: '',
        logo: []
    });

    useEffect(() => {
        if (selectedBusiness) {
            setBusinessData({
                name: selectedBusiness.name,
                address: selectedBusiness.address,
                phone: selectedBusiness.phone,
                email: selectedBusiness.email,
                categoryId: selectedBusiness.categoryId,
                description: selectedBusiness.description,
                logo: []
            });
        }
    }, [selectedBusiness]);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        if (name === 'logo') {
            setBusinessData(prev => ({
                ...prev,
                [name]: files ? Array.from(files) : []
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
        if (!validateInputs()) return;

        setIsLoading(true);

        // Prepare FormData for multipart/form-data requests
        const formData = new FormData();
        formData.append('name', businessData.name);
        formData.append('categoryId', businessData.categoryId);
        formData.append('description', businessData.description);
        formData.append('address', businessData.address);
        formData.append('phone', businessData.phone);
        formData.append('email', businessData.email);

        businessData.logo.forEach((logo) => {
            formData.append('logo', logo);
        });

        try {
            const token = getToken();
            let response;

            if (businessData._id) {
                // Update existing business
                response = await updateBusiness(token, businessData._id, formData);
            } else {
                // Upload new business
                response = await uploadBusiness(token, formData);
            }

            if (response.status === 201 || response.status === 200) {
                alert(`Business ${businessData._id ? 'updated' : 'uploaded'} successfully`);
            } else {
                alert('Session expired, please log in again');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error submitting business:', error);
            alert('An error occurred while processing the business');
        } finally {
            setIsLoading(false);
        }
    };

// Function to upload a new business
    const uploadBusiness = async (token, formData) => {
        return await axios.post(
            `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
    };

// Function to update an existing business
    const updateBusiness = async (token, businessId, formData) => {
        return axios.put(
            `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/${businessId}`,
            formData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
    };

    return (
        <form className='upload-form' onSubmit={handleSubmit}>
            <input type="text" name="name" value={businessData.name} onChange={handleChange} />
            <input type="text" name="address" value={businessData.address} onChange={handleChange} />
            <input type="tel" name="phone" value={businessData.phone} onChange={handleChange} />
            <input type="email" name="email" value={businessData.email} onChange={handleChange} />
            <textarea name="description" value={businessData.description} onChange={handleChange} />
            <button type="submit">Update Business</button>
        </form>
    );
};

export default EditBusinessPage;
