import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import axios from 'axios';
import '../styles/MainPage.css';

const MainPage = () => {
    const [business, setBusiness] = useState([]);
    const [filteredBusinesses, setFilteredBusinesses] = useState([]);
    const [category, setCategory] = useState('');

    useEffect(() => {
        fetchBusinesses().then(response => {
            setBusiness(response);
            setFilteredBusinesses(response);
        });
    }, []);

    const fetchBusinesses = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_DOMAIN + '/api/v1/businesses');
            return response.data;
        } catch (err) {
        }
    };


    const handleFilterChange = (selectedCategory) => {
        setCategory(selectedCategory);

        if (selectedCategory === "") {
            // Show all business when "All Categories" is clicked
            setFilteredBusinesses(business);
        } else {
            // Filter business by the selected category
            setFilteredBusinesses(business.filter((business) => business.category === selectedCategory));
        }
    };

    // const categories = [
    //     { name: "Category 1", icon: "icon1.png" },
    //     { name: "Category 2", icon: "icon2.png" },
    //     { name: "Category 3", icon: "icon3.png" },
    //     // Add more categories dynamically
    // ];
    //
    // const categoryContainer = document.querySelector(".categories");
    //
    // categories.forEach((category) => {
    //     const business = document.createElement("div");
    //     business.className = "category-business";
    //
    //     business.innerHTML = `
    //     <img src="${category.icon}" alt="${category.name}" />
    //     <span>${category.name}</span>
    // `;
    //
    //     categoryContainer.appendChild(business);
    // });

    return (
        <div className='main-page-container'>
            <div className="category-container">
                <div className="categories">
                    <div className="category-business" onClick={() => handleFilterChange("Fiction")}>
                        <div className="category-icon-wrapper">
                           <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 1" />
                            <span>Category 1</span>
                        </div>
                    
                    
                    </div>
                    <div className="category-business" onClick={() => handleFilterChange("Non-Fiction")}>
                        <div className="category-icon-wrapper">
                            <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 2" />
                            <span>Category 2</span>
                        </div>
                    </div>
                    <div className="category-business">
                        <div className="category-icon-wrapper">
                            <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 3" />
                            <span>Category 3</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="card-slider">
                {filteredBusinesses && filteredBusinesses.map(business => (
                    <BusinessCard key={business._id} business={business} />
                ))}
            </div>
        </div>
    );
}

export default MainPage;
