import React, { useState, useEffect } from 'react';
import BusinessCard from './BusinessCard';
import '../styles/userBusinesses.css';
import { FaPlus } from "react-icons/fa";
import { getToken } from "../utils/auth";

const UserBusinessesPage = () => {
    const [myBusinesses, setMyBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const fetchUserBusinesses = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/user-businesses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.status !== 200) {
                    window.location.href = '/login';
                    return;
                }
                
                const data = await response.json();
                setMyBusinesses(data);
            } catch (error) {
                console.error("Error fetching businesses:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserBusinesses();
    }, []);

    return (
        <div className='container'>
            <div className="business-cards-grid">
                {loading ? (
                    <div>טוען...</div>
                ) : myBusinesses.length === 0 ? (
                    <div>אין לך עסקים עדיין</div>
                ) : (
                    myBusinesses.map(business => (
                        <BusinessCard
                            key={business._id}
                            business={business}
                            fromUserBusinesses={true}
                        />
                    ))
                )}
            </div>
            
            <div className="add-business-container">
                <button 
                    className="add-business-button"
                    onClick={() => window.location.href = '/edit'}
                >
                    <FaPlus className="add-business-icon" />
                    <span className="tooltip">הוספת עסק חדש</span>
                </button>
            </div>
        </div>
    );
}

export default UserBusinessesPage;
