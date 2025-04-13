import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../styles/AboutUs.css';
import { Form, Button, Alert } from 'react-bootstrap';

function AboutUs() {
    const navigate = useNavigate();
    const [saranKritik, setSaranKritik] = useState('');
    const [pesan, setPesan] = useState('');
    const [error, setError] = useState('');

    const handleInputChange = (e) => {
        setSaranKritik(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        if (!token) {
            setError('Anda harus login terlebih dahulu untuk memberikan saran dan kritik.');
            setTimeout(() => setError(''), 5000);
            navigate('/login');
            return;
        }

        if (!saranKritik.trim()) {
            setError('Saran dan kritik tidak boleh kosong.');
            setTimeout(() => setError(''), 5000);
            return;
        }

        try {
            const decodedToken = jwtDecode(token);
            const idUser = decodedToken['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];

            const response = await fetch('http://192.168.52.157:9999/api/SaranKritik', { // Ganti dengan endpoint API Anda
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    idUser: parseInt(idUser),
                    isiSaranKritik: saranKritik,
                    tanggal: new Date().toISOString(),
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPesan('Terima kasih atas saran dan kritik Anda!');
                setSaranKritik('');
                setTimeout(() => setPesan(''), 5000);
            } else {
                setError(`Terjadi kesalahan: ${data.message || response.statusText}`);
                setTimeout(() => setError(''), 5000);
            }

        } catch (err) {
            setError(`Terjadi kesalahan jaringan: ${err.message}`);
            setTimeout(() => setError(''), 5000);
        }
    };

    return (
        <div className="menu-content-area">
            <header className="menu-category">
                <h2>Tentang KEBAB ECOMMERCE Kami</h2>
            </header>

            <section className="section">
                <h3>Selamat Datang di KEBAB ECOMMERCE!</h3>
                <p>
                    Kami adalah toko <i>online</i> yang bersemangat menyajikan kebab lezat dan berkualitas tinggi langsung ke pintu Anda di Jakarta dan sekitarnya.
                </p>
                <p>
                    Berawal dari kecintaan kami terhadap cita rasa kebab yang otentik dan keinginan untuk membuatnya lebih mudah diakses oleh semua orang, KEBAB ECOMMERCE hadir untuk memuaskan selera Anda kapan saja dan di mana saja.
                </p>
            </section>

            <section className="section">
                <h3>Misi Kami</h3>
                <p>
                    Misi kami adalah untuk menyediakan pengalaman memesan kebab <i>online</i> yang mudah, cepat, dan menyenangkan, sambil tetap menjaga kualitas rasa dan bahan-bahan terbaik. Kami berkomitmen untuk:
                </p>
                <ul>
                    <li>Menggunakan daging dan bahan-bahan segar pilihan.</li>
                    <li>Menyajikan kebab dengan cita rasa yang otentik dan menggugah selera.</li>
                    <li>Memberikan pelayanan pelanggan yang ramah dan responsif.</li>
                    <li>Memastikan pengiriman yang cepat dan aman.</li>
                </ul>
            </section>

            <section className="section">
                <h3>Kenapa Memilih Kami?</h3>
                <ul>
                    <li><strong>Kualitas Terjamin:</strong> Kami hanya menggunakan bahan-bahan terbaik untuk setiap kebab yang kami buat.</li>
                    <li><strong>Pilihan Varian:</strong> Nikmati berbagai pilihan kebab yang menggugah selera, dari yang klasik hingga kreasi spesial kami.</li>
                    <li><strong>Kemudahan Pemesanan:</strong> Pesan kebab favorit Anda dengan mudah melalui platform <i>online</i> kami yang praktis.</li>
                    <li><strong>Pengiriman Cepat:</strong> Kami mengerti betapa pentingnya pesanan Anda, oleh karena itu kami berusaha untuk mengirimkannya secepat mungkin.</li>
                    <li><strong>Dukungan Pelanggan:</strong> Tim dukungan pelanggan kami siap membantu Anda dengan pertanyaan atau masukan.</li>
                </ul>
            </section>

            <section className="section contact-info">
                <h3>Hubungi Kami</h3>
                <p>
                    Kami senang mendengar dari Anda! Jika Anda memiliki pertanyaan, saran, atau masukan, jangan ragu untuk menghubungi kami melalui:
                </p>
                <ul>
                    <li><strong>Email:</strong> [RajaKebab@gmail.com]</li>
                    <li><strong>Telepon/WhatsApp:</strong> [0812345678]</li>
                    {/* Tambahkan informasi kontak media sosial jika ada */}
                </ul>
            </section>

            <section className="section">
                <h3>Berikan Saran dan Kritik Anda</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                {pesan && <Alert variant="success">{pesan}</Alert>}
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="saranKritik">
                        <Form.Label>Masukkan saran dan kritik Anda di sini:</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={4}
                            value={saranKritik}
                            onChange={handleInputChange}
                        />
                    </Form.Group>
                    <Button variant="primary" type="submit">Kirim Saran & Kritik</Button>
                </Form>
            </section>

            <footer>
                &copy; {new Date().getFullYear()} Raja Kebab. Hak Cipta Dilindungi.
            </footer>
        </div>
    );
}

export default AboutUs;