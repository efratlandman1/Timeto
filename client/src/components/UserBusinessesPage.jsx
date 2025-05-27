import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import '../styles/userBusinesses.css';
import { FaPlus } from "react-icons/fa";
import {getToken} from "../utils/auth";

const UserBusinessesPage = () => {
    const [myBusiness, setMyBusinesses] = useState([]);

    useEffect(() => {

        const token = getToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const fetchUserBusinesses = async () => {
            const response = await fetch(process.env.REACT_APP_API_DOMAIN + '/api/v1/businesses/user-businesses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status !== 200) {
                window.location.href = '/login';
                return;
            }
            const data = await response.json();
            setMyBusinesses(data);
        };

        fetchUserBusinesses().then();
    }, []);

    return (
        <div className='container'>
            <div className="add-business-container">
                <button className="add-business-button" onClick={() => window.location.href = '/edit'}>
                    <FaPlus className="add-business-icon" />
                    <span className="tooltip">הוספת עסק חדש</span>
                </button>
            </div>
            {/* <br /><br /> */}
            {myBusiness && myBusiness.map(business => (
                <div className='businessCard' key={business._id}>
                    <BusinessCard
                        business={business}
                        fromUserBusinesses={true}
                    />
                </div>
            ))}
        </div>

    );
}

export default UserBusinessesPage;
