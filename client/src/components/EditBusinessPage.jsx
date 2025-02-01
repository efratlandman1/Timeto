import axios from 'axios';
import React, { useState, useEffect } from 'react';
import '../styles/uploadPage.css';

const EditBusinessPage = () => {
    const [businessData, setBusinessData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        categoryId: '',
        description: '',
        logo: ''
    });
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/login';
        }

        // Fetch categories dynamically
        // const fetchCategories = async () => {
        //     try {
        //         const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
        //         setCategories(response.data);
        //     } catch (error) {
        //         console.error('Failed to fetch categories:', error);
        //     }
        // };
        //
        // fetchCategories();
        setCategories([{'name': 'מניקור', 'id': 1},{'name': 'פדיקור', 'id': 2}]);
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

    const validateInputs = () => {
        const newErrors = {};
        if (!businessData.name) newErrors.name = 'Business name is required';
        if (!businessData.address) newErrors.address = 'Address is required';
        if (!businessData.phone) newErrors.phone = 'Phone number is required';
        if (!businessData.email) newErrors.email = 'Email is required';
        if (!businessData.categoryId) newErrors.categoryId = 'Category is required';
        if (!businessData.description) newErrors.description = 'Description is required';
        if (businessData.logo.length === 0) newErrors.logo = 'At least one logo is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateInputs()) return;

        setIsLoading(true);

        // Use FormData for multipart/form-data requests
        const formData = new FormData();
        formData.append('name', businessData.name);
        formData.append('categoryId', businessData.categoryId);
        formData.append('description', businessData.description);
        formData.append('address', businessData.address);
        formData.append('phone', businessData.phone);
        formData.append('email', businessData.email);

        businessData.logo.forEach((logo) => {
            formData.append('logo', logo); // Append each photo
        });

        try {
            const token = getToken();
            const response = await axios.post(
                `${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.status === 201) {
                alert('Business uploaded successfully');
            } else {
                alert('Session expired, please log in again');
                window.location.href = '/login';
            }
        } catch (error) {
            console.error('Error uploading business:', error);
            alert('An error occurred while uploading the business');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className='upload-form' onSubmit={handleSubmit}>
            <div className='form-group'>
                <input
                    className={`upload-input ${errors.name ? 'input-error' : ''}`}
                    type="text"
                    name="name"
                    placeholder="Business Name"
                    onChange={handleChange}
                    required
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className='form-group'>
                <input
                    className={`upload-input ${errors.address ? 'input-error' : ''}`}
                    type="text"
                    name="address"
                    placeholder="Address"
                    onChange={handleChange}
                    required
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            <div className='form-group'>
                <input
                    className={`upload-input ${errors.phone ? 'input-error' : ''}`}
                    type="tel"
                    name="phone"
                    placeholder="Phone number"
                    onChange={handleChange}
                    required
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>

            <div className='form-group'>
                <input
                    className={`upload-input ${errors.email ? 'input-error' : ''}`}
                    type="email"
                    name="email"
                    placeholder="Email"
                    onChange={handleChange}
                    required
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className='form-group'>
                <select
                    className={`categories-dropdown ${errors.categoryId ? 'input-error' : ''}`}
                    name="categoryId"
                    onChange={handleChange}
                    required
                >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
                {errors.categoryId && <span className="error-message">{errors.categoryId}</span>}
            </div>

            <div className='form-group'>
                <textarea
                    className={`upload-textarea ${errors.description ? 'input-error' : ''}`}
                    name="description"
                    placeholder="Description"
                    onChange={handleChange}
                    required
                />
                {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className='form-group'>
                <input
                    className={`upload-input ${errors.logo ? 'input-error' : ''}`}
                    type="file"
                    name="logo"
                    onChange={handleChange}
                    multiple
                    required
                />
                {errors.logo && <span className="error-message">{errors.logo}</span>}
            </div>

            <button className='upload-button' type="submit" disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload Business'}
            </button>
        </form>
    );
};

export default EditBusinessPage;
