import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Container, Table, Button, Form, Alert, Spinner } from 'react-bootstrap';
import '../styles/Cart.css';
import { jwtDecode } from 'jwt-decode';

const Cart = () => {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(savedCart);
        setLoading(false);
    }, []);

    const calculateTotal = () => {
        return cartItems.reduce((total, item) => total + (item.harga || item.harga_Paket_After_Diskon || 0) * (item.quantity || 0), 0);
    };

    const updateStock = (cart) => {
        const storedStocks = JSON.parse(localStorage.getItem("stocks")) || {};
        cart.forEach(item => {
            const category = item.nama_Minuman ? "drinks" :
                item.nama_Kebab ? "kebabs" :
                    item.nama_Paket ? "paketMakanans" :
                        item.nama_Snack ? "snacks" : null;

            if (storedStocks[category]) {
                storedStocks[category] = storedStocks[category].map((x) =>
                    x.id === item.id ? { ...x, stock: Math.max(x.stock - item.quantity, 0) } : x
                );
            }
        });
        localStorage.setItem("stocks", JSON.stringify(storedStocks));
    };

    const handleDecrease = (index) => {
        const updatedCart = [...cartItems];
        if (updatedCart[index].quantity > 1) {
            updatedCart[index].quantity -= 1;
        } else {
            updatedCart.splice(index, 1);
        }
        setCartItems(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
        window.dispatchEvent(new Event("cart-updated")); // 🚩 trigger update
    };

    const handlePayment = async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login');
            return;
        }

        if (!paymentMethod) {
            setShowAlert(true);
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const idUser = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

            for (const item of cartItems) {
                let transactionData = {
                    id_User: parseInt(idUser),
                    tanggalTransaksi: new Date().toISOString(),
                    jumlah: parseInt(item.quantity || 0),
                    totalHarga: parseFloat(((item.harga || item.harga_Paket_After_Diskon || 0) * (item.quantity || 0)).toFixed(2)) || 0,
                };

                if (item.nama_Minuman) transactionData.id_Drink = item.id_Drink;
                else if (item.nama_Kebab) transactionData.id_Kebab = item.id_Kebab;
                else if (item.nama_Snack) transactionData.id_Snack = item.id_Snack;
                else if (item.nama_Paket) transactionData.id_Paket = item.id_Paket;

                const response = await axios.post('http://192.168.52.157:9999/api/DetailTransaksi', transactionData, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.status !== 200) {
                    throw new Error(`Gagal memproses pembayaran untuk ${item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack || "item tidak dikenal"}.`);
                }
            }

            alert(`Pembayaran berhasil menggunakan ${paymentMethod}!`);
            updateStock(cartItems);
            localStorage.removeItem("cart");
            window.dispatchEvent(new Event("cart-updated")); // 🚩 trigger update
            setCartItems([]);
            navigate('/menu');

        } catch (error) {
            console.error("Gagal memproses pembayaran:", error.response?.data || error.message);
            alert("Terjadi kesalahan saat menyimpan transaksi: " + (error.response?.data?.message || error.message));
        }
    };

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;

    return (
        <Container className="cart-container">
            <h2 className="cart-title">Keranjang Anda</h2>
            {cartItems.length === 0 ? (
                <Alert variant="info">Keranjang Anda kosong.</Alert>
            ) : (
                <>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Nama Menu</th>
                                <th>Harga</th>
                                <th>Jumlah</th>
                                <th>Subtotal</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.nama_Paket || item.nama_Minuman || item.nama_Kebab || item.nama_Snack || "Tidak diketahui"}</td>
                                    <td>Rp {(item.harga || item.harga_Paket_After_Diskon || 0).toLocaleString('id-ID')}</td>
                                    <td>{item.quantity || 0}</td>
                                    <td>Rp {((item.harga || item.harga_Paket_After_Diskon || 0) * (item.quantity || 0)).toLocaleString('id-ID')}</td>
                                    <td>
                                        <Button variant="danger" size="sm" onClick={() => handleDecrease(index)}>
                                            -
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>

                    <h4 className="total-harga">Total: Rp {calculateTotal().toLocaleString('id-ID')}</h4>

                    <Form.Group className="payment-method">
                        <Form.Label>Pilih Metode Pembayaran:</Form.Label>
                        <Form.Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                            <option value="">Pilih Metode</option>
                            <option value="Transfer Bank">Transfer Bank</option>
                            <option value="E-Wallet">E-Wallet</option>
                            <option value="COD">Cash on Delivery (COD)</option>
                        </Form.Select>
                    </Form.Group>

                    {showAlert && <Alert variant="warning">Silakan pilih metode pembayaran.</Alert>}

                    <Button variant="success" onClick={handlePayment} className="pay-button">
                        Bayar Sekarang
                    </Button>

                    <Button variant="secondary" onClick={() => navigate('/menu')} className="back-button">
                        Kembali ke Menu
                    </Button>
                </>
            )}
        </Container>
    );
};

export default Cart;
