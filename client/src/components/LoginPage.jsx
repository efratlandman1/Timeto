import axios from 'axios';
import React, { useState } from 'react';
import '../styles/LoginPage.css'
// import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    // const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(process.env.REACT_APP_API_DOMAIN + '/api/v1/login', {
                'username': username,
                'password': password
            });
            if (response.data.token) {
                document.cookie = `token=${response.data.token}`;
                window.location.href = '/user-businesses';
            }
        } catch (e) {

        }
    };

    return (
        <form className='login-form' onSubmit={handleLogin}>
            <input className='login-input' type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input className='login-input' type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className='login-button' type="submit">Login</button>
        </form>
    );
}

export default LoginPage;
