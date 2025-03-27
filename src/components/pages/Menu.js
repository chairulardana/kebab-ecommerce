import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Button, Alert, Spinner, Modal, Form } from 'react-bootstrap';
import '../styles/Menu.css';
import { drinkImages, snackImages, kebabImages } from '../common/imageMapping';


const Menu = () => {
    const [drinks, setDrinks] = useState([]);
    const [kebabs, setKebabs] = useState([]);
    const [paketMakanan, setPaketMakanan] = useState([]);
    const [snacks, setSnacks] = useState([]);
    const [cart, setCart] = useState([]);
    const [showAlert, setShowAlert] = useState({ show: false, message: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [drinksData, kebabsData, paketMakananData, snacksData] = await Promise.all([
                    axios.get('http://192.168.52.157:9999/api/Drink'),
                    axios.get('http://192.168.52.157:9999/api/Kebab'),
                    axios.get('http://192.168.52.157:9999/api/PaketMakanan'),
                    axios.get('http://192.168.52.157:9999/api/Snack')
                ]);
                setDrinks(drinksData.data);
                setKebabs(kebabsData.data);
                setPaketMakanan(paketMakananData.data);
                setSnacks(snacksData.data);
            } catch (err) {
                setError(`Gagal memuat data: ${err.message}. Silakan coba lagi.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setCart(JSON.parse(localStorage.getItem("cart")) || []);
    }, []);

    const formatHarga = (harga) => `Rp ${harga.toLocaleString('id-ID')}`;

    const handleOrderClick = (item, title) => {
        let gambarItem = item.gambar;

        if (!gambarItem) {
            if (title === 'Minuman') {
                gambarItem = drinkImages[item.id_Drink] || '/images/default-food.png';
            } else if (title === 'Kebab') {
                gambarItem = kebabImages[item.id_Kebab] || '/images/default-food.png';
            } else if (title === 'Snack') {
                gambarItem = snackImages[item.id_Snack] || '/images/default-food.png';
            } else {
                gambarItem = '/images/default-food.png'; // Default jika tidak ada gambar atau title tidak cocok
            }
        }

        setSelectedItem({ ...item, gambar: gambarItem }); // Tambahkan properti gambar
        setQuantity(1);
        setShowModal(true);
    };

    const tambahKeCart = () => {
        if (!selectedItem || quantity < 1) return;
        if (selectedItem.stock >= quantity) {
            const newCart = [...cart, { ...selectedItem, quantity }];
            setCart(newCart);
            localStorage.setItem("cart", JSON.stringify(newCart));

            setShowAlert({ show: true, message: 'Item berhasil ditambahkan ke keranjang!' });

            const updateStock = (items) => items.map(x =>
                x.id === selectedItem.id ? { ...x, stock: Math.max(0, x.stock - quantity) } : x
            );

            if (drinks.some(item => item.id === selectedItem.id)) {
                setDrinks(updateStock(drinks));
            } else if (kebabs.some(item => item.id === selectedItem.id)) {
                setKebabs(updateStock(kebabs));
            } else if (paketMakanan.some(item => item.id === selectedItem.id)) {
                setPaketMakanan(updateStock(paketMakanan));
            } else if (snacks.some(item => item.id === selectedItem.id)) {
                setSnacks(updateStock(snacks));
            }

            setShowModal(false);
        } else {
            setShowAlert({ show: true, message: 'Jumlah melebihi stok tersedia!' });
        }
    };

    const renderMenu = (title, items) => (
        <div className="menu-category" key={title}>
            <h2>{title}</h2>
            <div className="menu-items">
                {items.map((item) => {
                    const gambarItem = item.gambar ||
                        (title === 'Minuman' && drinkImages[item.id_Drink]) ||
                        (title === 'Kebab' && kebabImages[item.id_Kebab]) ||
                        (title === 'Snack' && snackImages[item.id_Snack]) ||
                        '/images/default-food.png';
    
                    return (
                        <div className="menu-item-custom" key={item.id_Drink || item.id_Kebab || item.id_Paket || item.id_Snack}>
                            <div className="image-container">
                                <img
                                    src={gambarItem}
                                    alt={item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack}
                                    className="menu-image"
                                    onError={(e) => e.target.src = '/images/default-food.png'}
                                />
                                {item.stock === 0 && <div className="stock-overlay">STOK HABIS</div>}
                            </div>
                            <div className="menu-item-body">
                                <h3>{item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack}</h3>
                                {/* Data untuk Minuman, Kebab, Paket Makanan, dan Snack */}
                                {title === 'Minuman' && (
                                    <>
                                        <p>Suhu: {item.suhu}</p>
                                        <p>Stok: {item.stock}</p>
                                    </>
                                )}
                                {title === 'Kebab' && (
                                    <>
                                        {item.size && <p>Ukuran: {item.size}</p>}
                                        {item.level && <p>Level: {item.level}</p>}
                                        <p>Stok: {item.stock}</p>
                                    </>
                                )}
                                {title === 'Paket Makanan' && (
                                    <>
                                        <p>Harga Paket: {formatHarga(item.harga_Paket)}</p>
                                        <p>Diskon: {item.diskon}%</p>
                                        <p>Harga Setelah Diskon: {formatHarga(item.harga_Paket_After_Diskon)}</p>
                                        <p>ID Kebab: {item.id_Kebab}</p>
                                        <p>ID Snack: {item.id_Snack}</p>
                                        <p>ID Minuman: {item.id_Drink}</p>
                                    </>
                                )}
                                {title === 'Snack' && (
                                    <p>Stok: {item.stock}</p>
                                )}
                                <p className="menu-price">{formatHarga(item.harga || item.harga_Paket_After_Diskon)}</p>
                                <Button
                                    variant={item.stock > 0 ? "primary" : "danger"}
                                    className="order-now-btn"
                                    onClick={() => handleOrderClick(item, title)} // Memasukkan parameter title
                                    disabled={item.stock === 0}
                                >
                                    {item.stock > 0 ? 'Pesan Sekarang' : 'Stok Habis'}
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
    
    

    if (loading) return <Spinner animation="border" role="status"><span className="visually-hidden">Loading...</span></Spinner>;
    if (error) return <Alert variant="danger">{error}</Alert>;

    return (
        <Container className="menu-content-area">
            {showAlert.show && <Alert variant="success">{showAlert.message}</Alert>}
            {renderMenu('Minuman', drinks, 'nama_Minuman')}
            {renderMenu('Kebab', kebabs, 'nama_Kebab')}
            {renderMenu('Paket Makanan', paketMakanan, 'nama_Paket', 'harga_Paket_After_Diskon')}
            {renderMenu('Snack', snacks, 'nama_Snack')}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pesan {selectedItem?.nama_Kebab || selectedItem?.nama_Minuman || selectedItem?.nama_Paket || selectedItem?.nama_Snack}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && (
                        <>
                            <img src={selectedItem.gambar || '/images/default-food.png'} alt={selectedItem.nama_Kebab} className="menu-image" />
                            <p>Harga: {formatHarga(selectedItem.harga || selectedItem.harga_Paket_After_Diskon)}</p>
                            {selectedItem.size && <p>Ukuran: {selectedItem.size}</p>}
                            {selectedItem.level && <p>Level: {selectedItem.level}</p>}
                            <p>Stok: {selectedItem.stock}</p>
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
                    <Button variant="primary" onClick={tambahKeCart}>Tambahkan ke Keranjang</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Menu;
