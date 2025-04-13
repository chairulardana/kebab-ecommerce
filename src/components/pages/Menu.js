import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Button, Alert, Modal, Form } from 'react-bootstrap';
import '../styles/Menu.css';

const Menu = () => {
    const [drinks, setDrinks] = useState([]);
    const [kebabs, setKebabs] = useState([]);
    const [paketMakanan, setPaketMakanan] = useState([]);
    const [snacks, setSnacks] = useState([]);
    const [cart, setCart] = useState([]);
    const [showAlert, setShowAlert] = useState({ show: false, message: '' });
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
                setSnacks(snacksData.data);

                const paketMakananWithNames = paketMakananData.data.map((paket) => {
                    const kebab = kebabsData.data.find(k => k.id_Kebab === paket.id_Kebab);
                    const snack = snacksData.data.find(s => s.id_Snack === paket.id_Snack);
                    const drink = drinksData.data.find(d => d.id_Drink === paket.id_Drink);

                    return {
                        ...paket,
                        nama_Kebab: kebab?.nama_Kebab || 'Tidak Diketahui',
                        nama_Snack: snack?.nama_Snack || 'Tidak Diketahui',
                        nama_Minuman: drink?.nama_Minuman || 'Tidak Diketahui',
                        stock: paket.stok,
                        image_Paket: paket.image_Paket
                    };
                });

                setPaketMakanan(paketMakananWithNames);
            } catch (err) {
                console.error(`Gagal memuat data: ${err.message}. Silakan coba lagi.`);
            }
        };

        fetchData();
        setCart(JSON.parse(localStorage.getItem("cart")) || []);
    }, []);

    const formatHarga = (harga) => {
        if (harga === undefined || harga === null) {
            return 'Harga Tidak Tersedia';
        }
        return `Rp ${harga.toLocaleString('id-ID')}`;
    };

    const handleOrderClick = (item) => {
        setSelectedItem({ ...item });
        setQuantity(1);
        setShowModal(true);
    };

    const tambahKeCart = async () => {
        if (!selectedItem || quantity < 1) return;
        if (selectedItem.stock >= quantity) {
            const newItem = {
                ...selectedItem,
                quantity,
                nama: selectedItem.nama_Paket || selectedItem.nama_Minuman || selectedItem.nama_Kebab || selectedItem.nama_Snack
            };
            const newCart = [...cart, newItem];
            setCart(newCart);
            localStorage.setItem("cart", JSON.stringify(newCart));
            window.dispatchEvent(new Event("cart-updated")); // trigger navbar update ✅

            if (selectedItem.id_Paket) {
                try {
                    await axios.put(`http://192.168.52.157:9999/api/PaketMakanan/${selectedItem.id_Paket}`, {
                        ...selectedItem,
                        stok: selectedItem.stock - quantity
                    });

                    const updatedPaketMakanan = paketMakanan.map(paket => {
                        if (paket.id_Paket === selectedItem.id_Paket) {
                            return { ...paket, stock: paket.stock - quantity };
                        }
                        return paket;
                    });
                    setPaketMakanan(updatedPaketMakanan);
                } catch (error) {
                    console.error("Gagal memperbarui stok paket makanan:", error);
                }
            }

            setShowAlert({ show: true, message: 'Item berhasil ditambahkan ke keranjang!' });
            setShowModal(false);
        } else {
            setShowAlert({ show: true, message: 'Stok tidak tersedia!' });
        }
    };

    const getImage = (item, title) => {
        if (title === 'Paket Makanan') return item.image_Paket || '/images/default-paket.png';
        return item.image || '/images/default-food.png';
    };

    const renderMenu = (title, items) => (
        <div className="menu-category" key={title}>
            <h2>{title}</h2>
            <div className="menu-items">
                {items.map((item) => {
                    const imageSrc =
                        title === 'Paket Makanan' ? item.image_Paket || '/images/default-paket.png'
                        : title === 'Kebab' ? item.imageUrl || '/images/default-food.png'
                        : item.image || '/images/default-food.png';
    
                    return (
                        <div className="menu-item-custom" key={item.id_Drink || item.id_Kebab || item.id_Paket || item.id_Snack}>
                            <div className="image-container">
                                <img
                                    src={imageSrc}
                                    alt={item.nama_Minuman || item.nama_Kebab || item.nama_Paket || item.nama_Snack}
                                    className="menu-image"
                                    onError={(e) => e.target.src = '/images/default-food.png'}
                                />
                                {item.stock === 0 && <div className="stock-overlay">STOK HABIS</div>}
                            </div>
                            <div className="menu-item-body">
                                <h3>{title === 'Paket Makanan' ? item.nama_Paket : item.nama_Minuman || item.nama_Kebab || item.nama_Snack}</h3>
                                {title === 'Minuman' && (<><p>Suhu: {item.suhu}</p><p>Stok: {item.stock}</p></>)}
                                {title === 'Kebab' && (<>{item.size && <p>Ukuran: {item.size}</p>}{item.level && <p>Level: {item.level}</p>}<p>Stok: {item.stock}</p></>)}
                                {title === 'Paket Makanan' && (<><p>Harga Paket: {formatHarga(item.harga_Paket)}</p><p>Diskon: {item.diskon}%</p><p>Harga Setelah Diskon: {formatHarga(item.harga_Paket_After_Diskon)}</p><p>Kebab: {item.nama_Kebab}</p><p>Snack: {item.nama_Snack}</p><p>Minuman: {item.nama_Minuman}</p><p>Stok: {item.stock}</p></>)}
                                {title === 'Snack' && (<p>Stok: {item.stock}</p>)}
                                <p className="menu-price">{formatHarga(item.harga || item.harga_Paket_After_Diskon)}</p>
                                <Button
                                    variant={item.stock > 0 ? "primary" : "danger"}
                                    className="order-now-btn"
                                    onClick={() => handleOrderClick(item)}
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

    return (
        <Container className="menu-content-area">
            {showAlert.show && <Alert variant="success">{showAlert.message}</Alert>}
            {renderMenu('Minuman', drinks)}
            {renderMenu('Kebab', kebabs)}
            {renderMenu('Paket Makanan', paketMakanan)}
            {renderMenu('Snack', snacks)}

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Pesan {selectedItem?.nama_Paket || selectedItem?.nama_Minuman || selectedItem?.nama_Kebab || selectedItem?.nama_Snack}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedItem && (
                        <>
                            <img src={getImage(selectedItem, selectedItem.id_Paket ? 'Paket Makanan' : '')} alt="menu" className="menu-image-modal" style={{ width: '100%', height: 'auto' }} />
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

export default Menu;
