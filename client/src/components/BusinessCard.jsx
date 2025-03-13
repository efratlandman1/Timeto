import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedBusiness } from '../redux/businessSlice';
import { useNavigate } from 'react-router-dom';
import '../styles/businessCard.css';

const BusinessCard = ({ business }) => {
        const dispatch = useDispatch();
        const navigate = useNavigate();

        const handleEdit = () => {
                dispatch(setSelectedBusiness(business));
                navigate('/edit');
        };

        const [formData, setFormData] = useState({
                name: business.name,
                category: business.category,
                description: business.description,
                photoPath: business.photoPath,
                rating: business.rating, // Include rating
                address: business.address,
                phone: business.phone,
                email: business.email,
                categoryId: business.categoryId,
                logo: business.logo // Store multiple photos
        });

        const handleInputChange = (e) => {
                const { name, value } = e.target;
                setFormData((prev) => ({ ...prev, [name]: value }));
        };

        const handlePhotoChange = (e) => {
                const file = e.target.files[0];
                setFormData((prev) => ({ ...prev, logo: file }));
        };

        const handleUpdate = async () => {
                const updatedData = new FormData();
                updatedData.append('name', formData.name);
                updatedData.append('category', formData.category);
                updatedData.append('description', formData.description);
                updatedData.append('rating', formData.rating);
                if (formData.photoPath instanceof File) {
                        updatedData.append('logo', formData.photoPath);
                }

                try {
                        await onUpdate(updatedData); // Call the update function passed as a prop
                        setIsEditing(false);
                } catch (error) {
                        console.error('Failed to update business:', error);
                }
        };

        return (
            <div className="business-card">
                    <div className="business-card-content">
                            <button onClick={handleEdit}>Edit</button>
                            <img
                                className="business-card-image"
                                src={
                                        business.logo
                                            ? `${process.env.REACT_APP_API_DOMAIN}/uploads/${business.logo.split('/').pop()}`
                                            : "default-logo.png" // Provide a fallback image
                                }
                                alt={business.name}
                            />
                            <div className="business-card-details">
                                    <h3 className="business-card-name">{business.name}</h3>
                                    <p className="business-card-category">{business.category}</p>
                                    <p className="business-card-description">{business.description}</p>
                                    <div className="business-card-rating">
                                            <span>1</span>
                                            <span>⭐</span>
                                    </div>
                            </div>
                    </div>
            </div>
        );
};

export default BusinessCard;
