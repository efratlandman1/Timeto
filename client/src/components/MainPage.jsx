import React, { useState, useEffect } from 'react';
import { Container, Filter } from '../styles/MainPageStyles';
import ItemCard from './ItemCard';
import axios from 'axios';
import '../styles/MainPage.css';

const MainPage = () => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [category, setCategory] = useState('');

    useEffect(() => {
        fetchBooks().then(response => {
            setBooks(response);
            setFilteredBooks(response);
        });
    }, []);

    const fetchBooks = async () => {
        try {
            const response = await axios.get(process.env.REACT_APP_API_DOMAIN + '/api/v1/items');
            return response.data;
        } catch (err) {
        }
    };


    const handleFilterChange = (selectedCategory) => {
        setCategory(selectedCategory);

        if (selectedCategory === "") {
            // Show all books when "All Categories" is clicked
            setFilteredBooks(books);
        } else {
            // Filter books by the selected category
            setFilteredBooks(books.filter((book) => book.category === selectedCategory));
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
    //     const item = document.createElement("div");
    //     item.className = "category-item";
    //
    //     item.innerHTML = `
    //     <img src="${category.icon}" alt="${category.name}" />
    //     <span>${category.name}</span>
    // `;
    //
    //     categoryContainer.appendChild(item);
    // });

    return (
        <Container>
            <div className="category-container">
                <div className="categories">
                    <div className="category-item" onClick={() => handleFilterChange("Fiction")}>
                        <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 1" />
                        <span>Category 1</span>
                    </div>
                    <div className="category-item" onClick={() => handleFilterChange("Non-Fiction")}>
                        <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 2" />
                        <span>Category 2</span>
                    </div>
                    <div className="category-item">
                        <img src="/home/dev-it/docker/server/config/uploads/1734539710124.png" alt="Category 3" />
                        <span>Category 3</span>
                    </div>
                </div>
            </div>
            <div className="card-slider">
                {filteredBooks && filteredBooks.map(book => (
                    <ItemCard key={book._id} book={book} />
                ))}
            </div>
        </Container>
    );
}

export default MainPage;
