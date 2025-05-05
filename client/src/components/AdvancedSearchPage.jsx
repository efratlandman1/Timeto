import React, { useState , useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AdvancedSearchPage.css';
import { FaStar } from 'react-icons/fa';

const AdvancedSearchPage = () => {
    const navigate = useNavigate();

    const [categories/*, setCategories*/] = useState([
        { name: "מניקור", services: ["לק ג'ל", "בניית ציפורניים", "מניקור קלאסי"] },
        { name: "פדיקור", services: ["פדיקור רפואי", "טיפוח רגליים"] },
        { name: "עיצוב שיער", services: ["פן", "תספורת", "צבע לשיער"] },
        { name: "מסאז'", services: ["מסאז' רגליים", "מסאז' גוף מלא"] }
    ]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedService, setSelectedService] = useState('');
    const [priceRange, setPriceRange] = useState([0, 2000]);
    const [distance, setDistance] = useState(10);
    const [rating, setRating] = useState(0);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log(position.coords.latitude, position.coords.longitude);
            },
            (error) => {
                console.error(error);
            }
        );
    }, []);

    const handleSubmit = () => {
        const filters = {
            category: selectedCategory,
            service: selectedService,
            minPrice: priceRange[0],
            maxPrice: priceRange[1],
            distance: distance,
            rating: rating
        };
        console.log("Filters to send:", filters);
        // navigate('/search-results');
        navigate('/search-results', { state: { filters } });

    };

    const handleClose = () => {
        navigate(-1);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    const handleStarClick = (value) => {
        setRating(value);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={handleClose}>×</button>
                <h2>חיפוש מורחב</h2>

                {/* קטגוריה */}
                <div className="form-group">
                    <label>קטגוריה</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                        <option value="">בחר קטגוריה</option>
                        {categories.map((cat, idx) => (
                            <option key={idx} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                {/* שירות */}
                <div className="form-group">
                    <label>שירות</label>
                    <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
                        <option value="">בחר שירות</option>
                        {categories.find(c => c.name === selectedCategory)?.services.map((service, idx) => (
                            <option key={idx} value={service}>{service}</option>
                        ))}
                    </select>
                </div>

                {/* מחיר */}
                <div className="form-group price-range-group">
                    <label>טווח מחירים</label>
                    <div className="price-inputs">
                        <input
                            type="number"
                            placeholder="מ"
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                        />
                        <input
                            type="number"
                            placeholder="עד"
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        />
                    </div>
                </div>

                {/* מרחק */}
                <div className="form-group distance-group">
                    <label className="distance-label">מרחק בקילומטר</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={distance}
                        onChange={(e) => setDistance(Number(e.target.value))}
                        className="slider"
                    />
                    <span className="distance-value">{distance} ק"מ</span>
                </div>


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
