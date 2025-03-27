import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';

const Register = () => {
    const [namaLengkap, setNamaLengkap] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
    const navigate = useNavigate();

    const handleRegister = async () => {
        if (password !== konfirmasiPassword) {
            alert('Password dan Konfirmasi Password tidak cocok.');
            return;
        }

        try {
            const response = await axios.post('http://192.168.52.157:9999/api/auth/register', {
                namaLengkap: namaLengkap,
                email: email,
                password: password,
            });

            localStorage.setItem('token', response.data.token);
            navigate('/menu'); // Arahkan ke halaman menu setelah register berhasil
        } catch (error) {
            console.error('Register failed:', error.response?.data || error.message);
            alert('Register gagal. Periksa data Anda.');
        }
    };

    return (
        <div className="auth-container">
            <h1 className="auth-title">Register</h1>
            <input
                type="text"
                placeholder="Nama Lengkap"
                className="auth-input"
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
            />
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
            <input
                type="password"
                placeholder="Konfirmasi Password"
                className="auth-input"
                value={konfirmasiPassword}
                onChange={(e) => setKonfirmasiPassword(e.target.value)}
            />
            <button className="auth-button" onClick={handleRegister}>Register</button>
            <p>Sudah punya akun? <a href="/login" className="auth-link">Login di sini</a></p>
        </div>
    );
};

export default Register;