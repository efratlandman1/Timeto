import axios from 'axios';
import React, { useState } from 'react';
import {Form, Input, LoginButton, RegisterButton} from '../styles/LoginPageStyles';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate();
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
                window.location.href = '/';
            }
        } catch (e) {

        }
    };

    return (
        <Form onSubmit={handleLogin}>
            <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <LoginButton type="submit">Login</LoginButton>
        </Form>
    );
}

export default LoginPage;
