import React, { useState } from 'react';
import '../styles/businessCard.css';

const BusinessCard = ({ business, fromUserItems: fromBusinessesItems, onUpdate }) => {
        const [isEditing, setIsEditing] = useState(false);
        const [formData, setFormData] = useState({
                name: business.name,
                category: business.category,
                description: business.description,
                photoPath: business.photoPath,
                rating: business.rating, // Include rating
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
                        updatedData.append('photo', formData.photoPath);
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
                    {isEditing ? (
                        <div className="business-card-edit">
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Name"
                                />
                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    placeholder="Category"
                                />
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Description"
                                />
                                <input
                                    type="number"
                                    name="rating"
                                    value={formData.rating}
                                    onChange={handleInputChange}
                                    placeholder="Rating (0-5)"
                                    max="5"
                                    min="0"
                                    step="0.1"
                                />
                                <div>
                                        <input type="file" accept="image/*" onChange={handlePhotoChange} />
                                        {formData.logo && !(formData.logo instanceof File) && (
                                            <img
                                                src={process.env.REACT_APP_API_DOMAIN + `/uploads/${formData.logo.split('/').pop()}`}
                                                alt={business.name}
                                                style={{ maxWidth: '100px', maxHeight: '100px' }}
                                            />
                                        )}
                                </div>
                                <button onClick={handleUpdate}>Update</button>
                                <button onClick={() => setIsEditing(false)}>Cancel</button>
                        </div>
                    ) : (
                        <div className="business-card-content">
                                <img
                                    className="business-card-image"
                                    src={process.env.REACT_APP_API_DOMAIN + `/uploads/${business.logo.split('/').pop()}`}
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
                                {fromBusinessesItems && (
                                    <button className="business-card-edit-button" onClick={() => setIsEditing(true)}>
                                            Edit
                                    </button>
                                )}
                        </div>
                    )}
            </div>
        );
};

export default BusinessCard;
