import React, { useState, useEffect } from 'react';
import ItemCard from './ItemCard';
import  '../styles/userItems.css';

const UserItemsPage = () => {
    const [myBooks, setMyBooks] = useState([]);

    useEffect(() => {
        const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const fetchMyBooks = async () => {
            const response = await fetch(process.env.REACT_APP_API_DOMAIN + '/api/v1/items/user-items', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setMyBooks(data);
        };

        fetchMyBooks().then();
    }, []);

    function apiUpdateBook(id, updatedData) {
        console.log(updatedData)

    }

    return (
        <div className='container'>
            <button onClick={() => {window.location.href = '/upload'}}>+</button>
            <br/><br/>
            {myBooks && myBooks.map(book => (
                <ItemCard
                    key={book._id}
                    book={book}
                    fromUserItems={true}
                    onUpdate={(updatedData) => apiUpdateBook(book.id, updatedData)}
                />
            ))}
        </div>
    );
}

export default UserItemsPage;
