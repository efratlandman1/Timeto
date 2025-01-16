import axios from 'axios';
import React, { useState, useEffect } from 'react';
import '../styles/uploadPage.css';
import { Form, Input, Select, Textarea, Button } from '../styles/UploadPageStyles';

const UploadPage = () => {
    const [businessData, setBusinessData] = useState({
        name: '',
<<<<<<< Updated upstream
=======
        address: '',
        phone: '',
        email: '',
>>>>>>> Stashed changes
        categoryId: '',
        description: '',
        logo: [] // Store multiple photos
    });

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/login';
        }
    }, []);

    const getToken = () => {
        const tokenCookie = document.cookie.split('; ').find(row => row.startsWith('token='));
        return tokenCookie ? tokenCookie.split('=')[1] : null;
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (name === 'logo') {
            setBusinessData(prev => ({
                ...prev,
                [name]: files ? Array.from(files) : [] // Convert FileList to Array
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
        const token = getToken();

        // Use FormData for multipart/form-data requests
        const formData = new FormData();
        formData.append('name', businessData.name);
<<<<<<< Updated upstream
        formData.append('categoryId', businessData.categoryId);
        formData.append('description', businessData.description);
        formData.append('address', businessData.address);
        formData.append('phone', businessData.phone);
        formData.append('email', businessData.email);

        businessData.logo.forEach((logo, index) => {
            formData.append(`logo`, logo); // Append each photo
=======
        formData.append('address', businessData.address);
        formData.append('phone', businessData.phone);
        formData.append('email', businessData.email);
        formData.append('categoryId', businessData.categoryId);
        formData.append('description', businessData.description);
        businessData.logo.forEach((photo, index) => {
            formData.append(`logo`, photo); // Append each photo
>>>>>>> Stashed changes
        });

        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/businesses', formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (response.status === 201) {
                alert('Book uploaded successfully');
            } else {
                alert('Session expired, please log in again');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error uploading book:', error);
            alert('An error occurred while uploading the book');
        }
    };

    return (
        <form className='upload-form' onSubmit={handleSubmit}>
            <input className='upload-input' type="text" name="name" placeholder="Business Name" onChange={handleChange} required />
            <input className='upload-input' type="text" name="address" placeholder="Address" onChange={handleChange} required />
            <input className='upload-input' type="tel" name="phone" placeholder="Phone number" onChange={handleChange} required />
            <input className='upload-input' type="tel" name="email" placeholder="Email" onChange={handleChange} required />
            <select className='categories-dropdown' name="categoryId" onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
            </select>
            <textarea className='upload-textarea' name="description" placeholder="Description" onChange={handleChange} required />
            <input className='upload-input' type="file" name="logo" onChange={handleChange} multiple required />
            <button className='upload-button' type="submit">Upload Book</button>
        </form>
    );
}

export default UploadPage;
