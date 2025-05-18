import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { setServices } from '../redux/servicesSlice';
import { FaStar } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css';

const AdvancedSearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [services, setServicesLocal] = useState([]);
    const [rating, setRating] = useState(0);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
                setCategories(response.data);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            const category = categories.find(c => c.name === selectedCategory);
            if (category) {
                const fetchServices = async () => {
                    try {
                        const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/byCategory/${category._id}`);
                        setServicesLocal(response.data);
                        // לא מעדכנים את רידקס כאן! רק ב-local state
                    } catch (error) {
                        console.error("Error fetching services:", error);
                        setServicesLocal([]);
                    }
                };
                fetchServices();
            } else {
                setServicesLocal([]);
            }
        } else {
            setServicesLocal([]);
        }
    }, [selectedCategory, categories]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const existingCategory = params.get('categoryName');
        const existingServices = params.getAll('services');
        const existingRating = params.get('rating') || 0;

        if (existingCategory) setSelectedCategory(existingCategory);
        if (existingServices) setSelectedServices(existingServices);
        if (existingRating) setRating(parseInt(existingRating, 10));
    }, [location.search]);

    const handleStarClick = (value) => setRating(value);

    const handleServiceClick = (serviceName) => {
        setSelectedServices(prev => {
            let updatedServices;
            if (prev.includes(serviceName)) {
                updatedServices = prev.filter(s => s !== serviceName);
            } else {
                updatedServices = [...prev, serviceName];
            }

            // מעדכנים את הרידקס רק כאן, עם השירותים שנבחרו
            const servicesToSet = services
                .filter(service => updatedServices.includes(service.name))
                .map(s => ({ id: s._id, name: s.name }));

            dispatch(setServices(servicesToSet));

            return updatedServices;
        });
    };

    const handleSubmit = () => {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('categoryName', selectedCategory);
        selectedServices.forEach(service => queryParams.append('services', service));
        if (rating) queryParams.append('rating', rating);
        navigate(`/search-results?${queryParams.toString()}`);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={handleCancel}>×</button>
                <h2>חיפוש מורחב</h2>

                <div className="form-group">
                    <label>קטגוריה</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                        <option value="">בחר קטגוריה</option>
                        {categories.map((cat) => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {services.length > 0 && (
                    <div className="form-group tags-section">
                        <label>שירותים</label>
                        <div className="tags-container">
                            {services.map((service) => (
                                <div
                                    key={service._id}
                                    className={`tag selectable ${selectedServices.includes(service.name) ? 'selected' : ''}`}
                                    onClick={() => handleServiceClick(service.name)}
                                >
                                    {service.name}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="form-group rating-group">
                    <label>דירוג (החל מ)</label>
                    <div className="star-rating">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar
                                key={star}
                                size={30}
                                onClick={() => handleStarClick(star)}
                                className={rating >= star ? "star filled" : "star empty"}
                            />
                        ))}
                    </div>
                </div>

                <div className="buttons-container">
                    <button className="cancel-button" onClick={handleCancel}>ביטול</button>
                    <button className="confirm-button" onClick={handleSubmit}>אישור</button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearchPage;
