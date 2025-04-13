import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/auth.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const Register = () => {
    const [namaLengkap, setNamaLengkap] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async () => {
        setError('');
    
        // Validasi password dan konfirmasi password
        if (password !== konfirmasiPassword) {
            setError('Password dan Konfirmasi Password tidak cocok.');
            return;
        }
    
        // Validasi panjang password
        if (password.length < 8) {
            setError('Password harus minimal 8 karakter.');
            return;
        }
    
        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Format email tidak valid.');
            return;
        }
    
        try {
            const response = await axios.post('http://192.168.1.23:9999/api/auth/register', {
                name: namaLengkap,
                email: email,
                password: password,
            });
    
            console.log("Response Data:", response.data);
    
            if (response.data && response.data.token) {
                localStorage.setItem('token', response.data.token);
                alert('Registrasi berhasil! Silakan login.');
                navigate('/login'); // Langsung arahkan ke halaman login
            } else {
                setError('Registrasi berhasil, tetapi token tidak valid.');
            }
        } catch (error) {
            console.error('Register failed:', error);
            console.log(error.response);
    
            if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else if (error.response && error.response.status === 400) {
                setError('Data tidak valid atau email/nama pengguna sudah terdaftar.');
            } else {
                setError('Register gagal. Periksa data Anda.');
            }
        }
    };
    

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1 className="auth-title">Register</h1>
                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="namaLengkap">Nama Lengkap</label>
                    <input
                        type="text"
                        id="namaLengkap"
                        className="auth-input"
                        value={namaLengkap}
                        onChange={(e) => setNamaLengkap(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        className="auth-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            className="auth-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            className="password-toggle-icon"
                            onClick={togglePasswordVisibility}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="konfirmasiPassword">Konfirmasi Password</label>
                    <div className="password-input">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="konfirmasiPassword"
                            className="auth-input"
                            value={konfirmasiPassword}
                            onChange={(e) => setKonfirmasiPassword(e.target.value)}
                        />
                        <FontAwesomeIcon
                            icon={showPassword ? faEyeSlash : faEye}
                            className="password-toggle-icon"
                            onClick={togglePasswordVisibility}
                        />
                    </div>
                </div>

                <button className="auth-button" onClick={handleRegister}>Register</button>
                <p>Sudah punya akun? <a href="/login" className="auth-link">Login di sini</a></p>
            </div>
        </div>
    );
};

export default Register;