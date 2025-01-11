import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import  '../styles/userBusinesses.css';

const UserBusinessesPage = () => {
    const [myBusiness, setMyBusinesses] = useState([]);

    useEffect(() => {
        const token = document.cookie.split('; ').find(row => row.startsWith('token=')).split('=')[1];
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const fetchUserBusinesses = async () => {
            const response = await fetch(process.env.REACT_APP_API_DOMAIN + '/api/v1/businesses/user-businesses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setMyBusinesses(data);
        };

        fetchUserBusinesses().then();
    }, []);

    function apiUpdateBusiness(id, updatedData) {
        console.log(updatedData)

    }

    return (
        <div className='container'>
            <button onClick={() => {window.location.href = '/upload'}}>+</button>
            <br/><br/>
            {myBusiness && myBusiness.map(book => (
                <BusinessCard
                    key={book._id}
                    business={book}
                    fromUserBusinesses={true}
                    onUpdate={(updatedData) => apiUpdateBusiness(business.id, updatedData)}
                />
            ))}
        </div>
    );
}

export default UserBusinessesPage;
