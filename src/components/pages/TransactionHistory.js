import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Container, Table } from 'react-bootstrap';

const TransactionHistory = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await axios.get('http://192.168.1.23:9999/api/DetailTransaksi/my-transactions'); // Sesuaikan dengan endpoint API Anda
                setTransactions(response.data);
            } catch (error) {
                console.error("Gagal memuat riwayat transaksi:", error);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <Container className="mt-4">
            <h2>Riwayat Transaksi</h2>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID Transaksi</th>
                        <th>Tanggal</th>
                        <th>Total Harga</th>
                        <th>Detail Item</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id_Transaksi}>
                            <td>{transaction.id_Transaksi}</td>
                            <td>{new Date(transaction.tanggal_Transaksi).toLocaleDateString()}</td>
                            <td>Rp {transaction.total_Harga.toLocaleString('id-ID')}</td>
                            <td>{transaction.detail_Item}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </Container>
    );
};

export default TransactionHistory;