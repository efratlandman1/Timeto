import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaStar } from 'react-icons/fa';
import '../styles/BusinessProfilePage.css'; // שינוי ל-BusinessProfilePage.css

const AdvancedSearchPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedServices, setSelectedServices] = useState([]);
    const [services, setServices] = useState([]);
    const [rating, setRating] = useState(0);

    // שליפת קטגוריות מהשרת
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

    // עדכון שירותים כאשר נבחרת קטגוריה
    useEffect(() => {
        if (selectedCategory) {
            const category = categories.find(c => c.name === selectedCategory);
            if (category) {
                const servicesList = category.subcategories.map(sub => sub.name);
                setServices(servicesList);
            }
        }
    }, [selectedCategory, categories]);

    // טעינת פרמטרים קיימים מה-URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const existingCategory = params.get('categoryName');
        const existingServices = params.getAll('subcategories');
        const existingRating = params.get('rating') || 0;

        if (existingCategory) setSelectedCategory(existingCategory);
        if (existingServices) setSelectedServices(existingServices);
        if (existingRating) setRating(parseInt(existingRating, 10));
    }, [location.search]);

    const handleStarClick = (value) => {
        setRating(value);
    };

    const handleServiceClick = (service) => {
        setSelectedServices(prev =>
            prev.includes(service)
                ? prev.filter(s => s !== service)
                : [...prev, service]
        );
    };

    const handleSubmit = () => {
        const queryParams = new URLSearchParams();
        if (selectedCategory) queryParams.append('categoryName', selectedCategory);
        selectedServices.forEach(service => queryParams.append('subcategories', service));
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

                {/* קטגוריה */}
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

                {/* שירותים - תגים לבחירה */}
                {services.length > 0 && (
                    <div className="form-group tags-section">
                        <label>שירותים</label>
                        <div className="tags-container">
                        {services.map((service, idx) => (
                            <div
                            key={idx}
                            className={`tag selectable ${selectedServices.includes(service) ? 'selected' : ''}`}
                            onClick={() => handleServiceClick(service)}
                            >
                            {service}
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                {/* דירוג */}
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

                {/* כפתורים */}
                <div className="buttons-container">
                    <button className="cancel-button" onClick={handleCancel}>ביטול</button>
                    <button className="confirm-button" onClick={handleSubmit}>אישור</button>
                </div>
            </div>
        </div>
    );
};

export default AdvancedSearchPage;
