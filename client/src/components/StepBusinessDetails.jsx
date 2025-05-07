import React, { useState, useEffect } from 'react';
import { FaSave, FaEdit, FaUpload } from 'react-icons/fa';
import '../styles/StepsStyle.css';

const StepBusinessDetails = ({ businessData, setBusinessData, categories }) => {

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

    return (
        <div className="step-business-details">
            <h1 className="step-title">פרטי העסק</h1>

            <div className="form-group">
                <label htmlFor="name" className="form-label">שם העסק</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={businessData.name}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="address" className="form-label">כתובת</label>
                <input
                    type="text"
                    id="address"
                    name="address"
                    value={businessData.address}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="phone" className="form-label">טלפון</label>
                <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={businessData.phone}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="email" className="form-label">כתובת דואר אלקטרונית</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={businessData.email}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="categoryId" className="form-label">תחום שירות</label>
                <select
                    id="categoryId"
                    name="categoryId"
                    value={businessData.categoryId}
                    onChange={handleChange}
                    className="form-select"
                >
                    <option value="">בחר תחום</option>
                    {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="description" className="form-label">תיאור העסק</label>
                <input
                    type="text"
                    id="description"
                    name="description"
                    value={businessData.description}
                    onChange={handleChange}
                    className="form-input"
                />
            </div>

            <div className='form-group'>
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
                        <img 
                                src={`${process.env.REACT_APP_API_DOMAIN}/uploads/business3.jpg`} 
                                alt="Current Logo" 
                                className="business-logo-preview" 
                        />
                </div>
        </div>
    );
};

export default StepBusinessDetails;
