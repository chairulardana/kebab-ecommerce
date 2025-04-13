import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavigationBar from './components/common/Navbar';
import Menu from './components/pages/Menu';
import Promo from './components/pages/Promo';
import AboutUs from './components/common/AboutUs';
import OrderButton from './components/common/OrderButton';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Cart from './components/pages/Cart';
import Search from './components/pages/Search';
import './App.css';

function App() {
    const navbarRef = useRef(null);
    const contentRef = useRef(null);

    // Adjust padding to prevent navbar overlapping
    useEffect(() => {
        const handleResize = () => {
            if (navbarRef.current && contentRef.current) {
                contentRef.current.style.paddingTop = `${navbarRef.current.offsetHeight}px`;
            }
        };

        handleResize(); // initial

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <Router>
            <div className="App">
                <NavigationBar ref={navbarRef} />
                <main className="content" ref={contentRef}>
                    <Routes>
                        <Route path="/" element={<Menu />} />
                        <Route path="/menu" element={<Menu />} />
                        <Route path="/promo" element={<Promo />} />
                        <Route path="/about" element={<AboutUs />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/search" element={<Search />} />
                    </Routes>
                </main>
                <OrderButton />
            </div>
        </Router>
    );
}

export default App;
