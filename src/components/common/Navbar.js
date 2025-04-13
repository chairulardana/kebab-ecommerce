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
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        setIsLoggedIn(!!token);
        if (token) {
            fetchUserData(token);
        }

        // initial load
        updateCartCount();

        // listen dari tab lain (localStorage event)
        window.addEventListener('storage', updateCartCount);

        // listen dari dalam app (custom event)
        window.addEventListener('cart-updated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cart-updated', updateCartCount);
        };
    }, []);

    const updateCartCount = () => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        const totalQuantity = savedCart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(totalQuantity);
    };

    const fetchUserData = async (token) => {
        try {
            const response = await axios.get('http://192.168.52.157:9999/api/users', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const imagePath = response.data.image;
            const baseUrl = 'http://192.168.52.157:9999';
            const imageUrl = imagePath ? `${baseUrl}${imagePath}` : 'default-profile.png';
            setProfileImage(imageUrl);
        } catch (error) {
            console.error('Gagal mengambil data pengguna:', error);
            setProfileImage('default-profile.png');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        navigate('/login');
    };

    return (
        <Navbar bg="dark" variant="dark" expand="lg" className="custom-navbar fixed-top py-1.5">
            <Container>
                <Navbar.Brand as={Link} to="/" className="navbar-logo">
                    Kebab Raja
                </Navbar.Brand>

                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <div className="navbar-search">
                        <FormControl
                            type="search"
                            placeholder="Cari kebab favoritmu..."
                            className="search-input"
                            aria-label="Search"
                        />
                        <Button variant="warning" className="btn-search">Cari</Button>
                    </div>

                    <Nav className="ms-auto">
                        <Nav.Link as={Link} to="/menu">Menu</Nav.Link>
                        <Nav.Link as={Link} to="/promo">Promo</Nav.Link>
                        <Nav.Link as={Link} to="/about">About Us</Nav.Link>

                        <Nav.Link as={Link} to="/cart" className="cart-icon position-relative">
                            <FaShoppingCart color="white" size={20} />
                            {cartCount > 0 && (
                                <Badge pill bg="danger" className="position-absolute top-0 start-100 translate-middle">
                                    {cartCount}
                                </Badge>
                            )}
                        </Nav.Link>

                        {isLoggedIn ? (
                            <div className="profile-container d-flex align-items-center">
                                <img src={profileImage} alt="Profile" className="profile-image" />
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
