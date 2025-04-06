import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/MainPage.css';

const MainPage = () => {
    const [businesses, setBusinesses] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    useEffect(() => {
        fetchCategories();
        fetchBusinesses();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
            setCategories(response.data);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const fetchBusinesses = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses`);
            setBusinesses(response.data);
            setFilteredBusinesses(response.data);
        } catch (error) {
            console.error("Error fetching businesses:", error);
        }
    };

    const handleFilterChange = (category) => {
        setSelectedCategory(category);
        if (category === "") {
            setFilteredBusinesses(businesses);
        } else {
            setFilteredBusinesses(businesses.filter(b => b.category === category));
        }
    };

    return (
        <div className='main-page-container'>
            <div className="category-container">
                <div className="categories">
                    <div className="category-business" onClick={() => handleFilterChange("")}>
                        <img src="/path/to/default-icon.png" alt="All" />
                        <span>All Categories</span>
                    </div>
                    {categories.map((category) => (
                        <div key={category._id} className="category-business" onClick={() => handleFilterChange(category.name)}>
                            <img src={category.icon || "/path/to/default-icon.png"} alt={category.name} />
                            <span>{category.name}</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="card-slider">
                {filteredBusinesses.map((business) => (
                    <BusinessCard key={business._id} business={business} />
                ))}
            </div>
        </div>
    );
}

export default MainPage;
