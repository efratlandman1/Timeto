import axios from 'axios';
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Textarea, Button } from '../styles/UploadPageStyles';

const UploadPage = () => {
    const [businessData, setBusinessData] = useState({
        name: '',
        category: '',
        description: '',
        photos: [] // Store multiple photos
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

        if (name === 'photos') {
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
        formData.append('category', businessData.category);
        formData.append('description', businessData.description);
        businessData.photos.forEach((photo, index) => {
            formData.append(`photos`, photo); // Append each photo
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
        <Form onSubmit={handleSubmit}>
            <Input type="text" name="name" placeholder="Business Name" onChange={handleChange} required />
            <Input type="text" name="address" placeholder="Address" onChange={handleChange} required />
            <Input type="tel" name="phone" placeholder="Phone number" onChange={handleChange} required />
            <Input type="tel" name="email" placeholder="Email" onChange={handleChange} required />
            <Select name="categoryId" onChange={handleChange} required>
                <option value="">Select Category</option>
                <option value="Fiction">Fiction</option>
                <option value="Non-Fiction">Non-Fiction</option>
            </Select>
            <Textarea name="description" placeholder="Description" onChange={handleChange} required />
            <Input type="file" name="logo" onChange={handleChange} multiple required />
            <Button type="submit">Upload Book</Button>
        </Form>
    );
}

export default UploadPage;
