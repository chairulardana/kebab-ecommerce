import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios.post('http://192.168.52.157:9999/api/auth/login', {
                email: email,
                password: password,
            });

            const token = response.data.token;
            const decodedToken = jwtDecode(token);

            const role = decodedToken["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

            if (role !== 'User') {
                alert('Hanya pengguna dengan role "User" yang dapat login.');
                return;
            }

            localStorage.setItem('token', token);
            navigate('/menu');
        } catch (error) {
            console.error('Login failed:', error.response?.data || error.message);
            alert('Login gagal. Periksa email dan password Anda.');
        }
    };

    return (
        <div className="auth-container">
            <h1 className="auth-title">Login</h1>
            <input
                type="email"
                placeholder="Email"
                className="auth-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button className="auth-button" onClick={handleLogin}>Login</button>
            <p>Belum punya akun? <a href="/register" className="auth-link">Daftar di sini</a></p>
        </div>
    );
};

export default Login;
