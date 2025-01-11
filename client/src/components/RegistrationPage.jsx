import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/registrationPage.css';

const RegistrationPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/register', { username, password });
            document.cookie = `token=${response.data.token}`;
            navigate('/');
        } catch (err) {
            console.error('Registration failed:', err);
        }
    };

    return (
        <from className='registration-from' onSubmit={handleRegister}>
            <input className='registration-input' type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input className='registration-input' type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className='registration-button' type="submit">Send</button>
        </from>
    );
};

export default RegistrationPage;
