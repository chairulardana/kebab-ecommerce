import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, FormControl, Button, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Navbar.css';

const NavigationBar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [userInitials, setUserInitials] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = JSON.parse(localStorage.getItem('userData'));
        setIsLoggedIn(!!token);

        if (token && storedUser?.name) {
            setUserInitials(generateInitials(storedUser.name));
        } else if (token) {
            fetchUserData(token);
        }

        updateCartCount();

        window.addEventListener('storage', updateCartCount);
        window.addEventListener('cart-updated', updateCartCount);

        const handleLoginSuccess = () => {
            setIsLoggedIn(true);
            const token = localStorage.getItem('token');
            if (token) {
                fetchUserData(token);
            }
        };
        window.addEventListener('login-success', handleLoginSuccess);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cart-updated', updateCartCount);
            window.removeEventListener('login-success', handleLoginSuccess);
        };
    }, []);

    const updateCartCount = () => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalQuantity = savedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(totalQuantity);
    };

    const generateInitials = (name) => {
        if (!name || typeof name !== 'string') return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase(); // Farhan → FA
        return parts.map(p => p[0]).join('').slice(0, 2).toUpperCase();    // Farhan A → FA
    };

    const fetchUserData = async (token) => {
        try {
            // Ganti dengan endpoint user spesifik jika memungkinkan
            const response = await axios.get('http://192.168.1.23:9999/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            // Dapatkan nama dari user yang login
            const userDataFromStorage = JSON.parse(localStorage.getItem("userData"));
            const nameFromStorage = userDataFromStorage?.name?.trim();

            const userData = Array.isArray(response.data)
                ? response.data.find(u => u.name === nameFromStorage)
                : response.data;

            const name = userData?.name?.trim() || 'User';
            const imagePath = userData?.image;
            const baseUrl = 'http://192.168.1.23:9999';
            const imageUrl = imagePath ? `${baseUrl}${imagePath}` : null;

            setUserInitials(generateInitials(name));
            setProfileImage(imageUrl);
            localStorage.setItem('userData', JSON.stringify({ name }));

            console.log("Nama dari API:", name);
            console.log("Inisial:", generateInitials(name));
        } catch (error) {
            console.error('Gagal mengambil data pengguna:', error);
            setProfileImage(null);

            const storedUser = JSON.parse(localStorage.getItem("userData"));
            const name = storedUser?.name || 'User';
            setUserInitials(generateInitials(name));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        navigate('/login');
    };

    const handleSearchInputChange = (event) => setSearchTerm(event.target.value);

    const handleSearchSubmit = () => {
        if (searchTerm.trim()) {
            navigate(`/search?q=${searchTerm}`);
        }
    };

    const handleSearchKeyPress = (event) => {
        if (event.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleImageError = () => setProfileImage(null);

    return (
        <Navbar expand="lg" className="custom-navbar fixed-top py-1.5">
            <Container>
                <Navbar.Brand as={Link} to="/" className="navbar-logo">Kebab Raja</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <div className="navbar-search">
                        <FormControl
                            type="search"
                            placeholder="Cari kebab favoritmu..."
                            className="search-input"
                            aria-label="Search"
                            value={searchTerm}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        <Button variant="warning" className="btn-search" onClick={handleSearchSubmit}>
                            Cari
                        </Button>
                    </div>

                    <Nav className="ms-auto navbar-icons">
                        <Nav.Link as={Link} to="/menu">Menu</Nav.Link>
                        <Nav.Link as={Link} to="/promo">Promo</Nav.Link>
                        <Nav.Link as={Link} to="/about">About Us</Nav.Link>

                        <Nav.Link as={Link} to="/cart" className="cart-icon position-relative">
                            <FaShoppingCart size={20} />
                            {cartCount > 0 && (
                                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                                    {cartCount}
                                </Badge>
                            )}
                        </Nav.Link>

                        {isLoggedIn ? (
                            <div className="profile-container d-flex align-items-center ms-2">
                                {profileImage ? (
                                    <img
                                        src={profileImage}
                                        alt="Profile"
                                        className="profile-image rounded-circle"
                                        width="35"
                                        height="35"
                                        onError={handleImageError}
                                    />
                                ) : (
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                        style={{
                                            width: '35px',
                                            height: '35px',
                                            backgroundColor: '#1976d2',
                                            fontSize: '14px'
                                        }}
                                    >
                                        {userInitials || 'U'}
                                    </div>
                                )}
                                <Button variant="outline-light" className="ms-2 btn-logout" onClick={handleLogout}>
                                    Logout
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button variant="outline-light" className="me-2 btn-login" as={Link} to="/login">
                                    Login
                                </Button>
                                <Button variant="warning" className="btn-register" as={Link} to="/register">
                                    Register
                                </Button>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

export default NavigationBar;
