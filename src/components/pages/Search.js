import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Row, Col, Button, Modal, Form, Alert } from 'react-bootstrap';
import '../styles/Search.css';

const Search = () => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchTerm = searchParams.get('q');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showAlert, setShowAlert] = useState({ show: false, message: '' });

    useEffect(() => {
        const fetchSearchResults = async () => {
            try {
                const [drinks, kebabs, paketMakanans, snacks] = await Promise.all([
                    axios.get('http://192.168.1.23:9999/api/Drink'),
                    axios.get('http://192.168.1.23:9999/api/Kebab'),
                    axios.get('http://192.168.1.23:9999/api/PaketMakanan'),
                    axios.get('http://192.168.1.23:9999/api/Snack')
                ]);

                const allItems = [
                    ...drinks.data,
                    ...kebabs.data,
                    ...paketMakanans.data,
                    ...snacks.data
                ];

                const filteredResults = allItems.filter(item => {
                    const itemName = item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack || '';
                    const itemDetails = Object.values(item).join(' ').toLowerCase();

                    if (searchTerm) {
                        return itemName.toLowerCase().includes(searchTerm.toLowerCase()) || itemDetails.includes(searchTerm.toLowerCase());
                    } else if (searchParams.get('category')) {
                        const category = item.nama_Minuman ? 'Minuman' : item.nama_Kebab ? 'Kebab' : item.nama_Paket ? 'Paket Makanan' : item.nama_Snack ? 'Snack' : '';
                        return category.toLowerCase() === searchParams.get('category').toLowerCase();
                    }
                    return true;
                });

                setSearchResults(filteredResults);
                setLoading(false);
            } catch (error) {
                console.error("Gagal mengambil hasil pencarian:", error);
                setLoading(false);
            }
        };

        fetchSearchResults();
    }, [searchTerm, searchParams.get('category')]);

    const formatHarga = (harga) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(harga);
    };

    const getImage = (item, title) => {
        return title === 'Paket Makanan' ? item.image_Paket || '/images/default-paket.png'
            : title === 'Kebab' ? item.imageUrl || '/images/default-food.png'
                : item.image || '/images/default-food.png';
    };

    const handleOrderClick = (item) => {
        setSelectedItem(item);
        setShowModal(true);
    };

    const tambahKeCart = () => {
        if (selectedItem) {
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            const existingItem = cart.find(cartItem => cartItem.id === selectedItem.id);

            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + quantity;
            } else {
                cart.push({ ...selectedItem, quantity });
            }

            localStorage.setItem("cart", JSON.stringify(cart));
            window.dispatchEvent(new Event("cart-updated"));
            setShowModal(false);
            setShowAlert({ show: true, message: 'Berhasil ditambahkan ke keranjang!' });
            setTimeout(() => setShowAlert({ show: false, message: '' }), 3000);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    return (
        <Container className="mt-5 search-results-container">
            <h2>Hasil Pencarian untuk "{searchTerm}"</h2>
            {showAlert.show && <Alert variant="success">{showAlert.message}</Alert>}
            {searchResults.length === 0 && !loading ? (
                <Alert variant="info">Tidak ada hasil ditemukan untuk "{searchTerm}"</Alert>
            ) : (
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {searchResults.map(item => (
                        <Col key={item.id_Drink || item.id_Kebab || item.id_Paket || item.id_Snack}>
                            <Card className="mb-4 h-100"> {/* Tambahkan h-100 */}
                                <div className="image-container">
                                    <Card.Img
                                        variant="top"
                                        src={getImage(item, item.id_Paket ? 'Paket Makanan' : item.id_Kebab ? 'Kebab' : '')}
                                        onError={(e) => e.target.src = '/images/default-food.png'}
                                        style={{ maxHeight: '150px', objectFit: 'cover', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}
                                    />
                                    {item.stock === 0 && <div className="stock-overlay">STOK HABIS</div>}
                                </div>
                                <Card.Body style={{ padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <Card.Title style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack}</Card.Title>
                                    {item.suhu && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Suhu: {item.suhu}</p>}
                                    {item.size && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Ukuran: {item.size}</p>}
                                    {item.level && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Level: {item.level}</p>}
                                    {item.harga_Paket && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Harga Paket: {formatHarga(item.harga_Paket)}</p>}
                                    {item.diskon && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Diskon: {item.diskon}%</p>}
                                    {item.harga_Paket_After_Diskon && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Harga Setelah Diskon: {formatHarga(item.harga_Paket_After_Diskon)}</p>}
                                    {item.nama_Kebab && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Kebab: {item.nama_Kebab}</p>}
                                    {item.nama_Snack && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Snack: {item.nama_Snack}</p>}
                                    {item.nama_Minuman && <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Minuman: {item.nama_Minuman}</p>}
                                    <p style={{ marginBottom: '4px', fontSize: '0.9rem' }}>Stok: {item.stock}</p>
                                    <p className="menu-price" style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '8px', fontSize: '1rem' }}>{formatHarga(item.harga || item.harga_Paket_After_Diskon)}</p>
                                    <Button
                                        variant={item.stock > 0 ? "primary" : "danger"}
                                        className="order-now-btn"
                                        onClick={() => handleOrderClick(item)}
                                        disabled={item.stock === 0}
                                        style={{ width: '100%', marginTop: 'auto', fontSize: '0.9rem', padding: '8px' }}
                                    >
                                        {item.stock > 0 ? 'Pesan Sekarang' : 'Stok Habis'}
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pesan {selectedItem?.nama_Paket || selectedItem?.nama_Minuman || selectedItem?.nama_Kebab || selectedItem?.nama_Snack}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && (
                        <>
                            <img src={getImage(selectedItem, selectedItem.id_Paket ? 'Paket Makanan' : selectedItem.id_Kebab ? 'Kebab' : '')} alt="menu" className="menu-image-modal" style={{ width: '100%', height: 'auto', maxHeight: '300px', objectFit: 'contain' }} />
                            <p>Harga: {formatHarga(selectedItem.harga || selectedItem.harga_Paket_After_Diskon)}</p>
                            <Form.Group controlId="formJumlah">
                                <Form.Label>Pilih Jumlah</Form.Label>
                                <Form.Control
                                    type="number"
                                    min="1"
                                    max={selectedItem.stock}
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(selectedItem.stock, Number(e.target.value))))}
                                />
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
                    <Button variant="primary" onClick={tambahKeCart} disabled={!selectedItem?.stock}>Tambahkan ke Keranjang</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Search;