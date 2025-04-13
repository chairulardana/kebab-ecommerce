import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container, Table, Button, Form, Alert,
  Spinner, Modal, Row, Col, Card, Badge,
  Pagination, Dropdown, InputGroup
} from "react-bootstrap";
import { jwtDecode } from "jwt-decode";
import "../styles/Cart.css";

const Cart = () => {
  // State management
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  const [addressError, setAddressError] = useState("");
  const [tempPhoneNumber, setTempPhoneNumber] = useState("");
  const [phoneNumberError, setPhoneNumberError] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const navigate = useNavigate();
  const backendUrl = "http://192.168.1.23:9999/api";
  const transactionsPerPage = 5;

  // Load cart items from localStorage
  const loadCartItems = useCallback(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(savedCart);
  }, []);

  // Fetch transactions from API
  const fetchTransactions = useCallback(
    async (id_User) => {
      try {
        setLoading(true);
        const response = await axios.get(`${backendUrl}/DetailTransaksi`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const decodedToken = jwtDecode(localStorage.getItem("token"));
        console.log("Decoded User ID:", decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);

        const userTransactions = response.data.filter(
          (transaction) => transaction.id_User == id_User
        );
        console.log("User Transactions:", userTransactions);

        // Mapping driver dan items
        const transactionsWithDriverInfo = await Promise.all(
          userTransactions.map(async (transaction) => {
            const item = {
              NamaItem:
                transaction.id_Drink ? transaction.nama_Drink :
                transaction.id_Kebab ? transaction.nama_Kebab :
                transaction.id_Snack ? transaction.nama_Snack :
                transaction.id_Paket ? transaction.nama_Paket : "Tidak diketahui",
              Jumlah: transaction.jumlah,
              TotalHarga: transaction.totalHarga || 0,
            };

            if (transaction.Id_Driver) {
              try {
                const driverResponse = await axios.get(
                  `${backendUrl}/drivers/${transaction.Id_Driver}`,
                  {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                  }
                );
                return { ...transaction, items: [item], driver: driverResponse.data };
              } catch (error) {
                console.error(`Gagal mengambil detail driver:`, error);
                return { ...transaction, items: [item], driver: null };
              }
            }
            return { ...transaction, items: [item], driver: null };
          })
        );

        setTransactions(transactionsWithDriverInfo);
        setFilteredTransactions(transactionsWithDriverInfo);
      } catch (error) {
        console.error("Gagal mengambil riwayat transaksi:", error);
      } finally {
        setLoading(false);
      }
    },
    [backendUrl]
  );

  // Filter transactions based on status (tanpa search)
  useEffect(() => {
    const filtered = transactions.filter(transaction => {
      return filterStatus === "Semua" || transaction.statusTracking === filterStatus;
    });
    setFilteredTransactions(filtered);
    setCurrentPage(1); // Reset halaman ketika filter berubah
  }, [transactions, filterStatus]);

  // Handle order confirmation
  const handleTerimaPesanan = useCallback(
    async (id_DetailTransaksi, id_Driver) => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const response = await axios.put(
          `${backendUrl}/DetailTransaksi/update-status/${id_DetailTransaksi}`,
          { StatusTracking: "Sudah Diterima", id_Driver },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          alert(`Pesanan dengan ID ${id_DetailTransaksi} telah dikonfirmasi diterima.`);
          const decodedToken = jwtDecode(token);
          const idUser = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
          await fetchTransactions(idUser);
        }
      } catch (error) {
        console.error("Gagal mengkonfirmasi pesanan:", error);
        alert(`Terjadi kesalahan: ${error.response?.data?.message || error.message}`);
      }
    },
    [backendUrl, navigate, fetchTransactions]
  );

  // Initialize component
  useEffect(() => {
    loadCartItems();
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const idUser = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
        fetchTransactions(idUser);
        setShowTransactions(true);
      } catch (error) {
        console.error("Gagal mendekode token:", error);
      }
    }
  }, [loadCartItems, fetchTransactions]);

  // Calculate cart total
  const calculateTotal = useCallback(() => {
    return cartItems.reduce(
      (total, item) =>
        total + (item.harga || item.harga_Paket_After_Diskon || 0) * (item.quantity || 0),
      0
    );
  }, [cartItems]);

  // Handle quantity decrease
  const handleDecrease = useCallback(
    (index) => {
      const updatedCart = [...cartItems];
      if (updatedCart[index].quantity > 1) {
        updatedCart[index].quantity -= 1;
      } else {
        updatedCart.splice(index, 1);
      }
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new Event("cart-updated"));
    },
    [cartItems]
  );

  // Process payment (hanya mendukung 1 item seperti sebelumnya)
  const processPayment = useCallback(
    async (finalAddress, finalPhoneNumber) => {
      const token = localStorage.getItem("token");

      if (!paymentMethod) {
        setShowAlert(true);
        return;
      }
      if (!token) {
        navigate("/login");
        return;
      }
      // Membatasi hanya 1 item
      if (cartItems.length !== 1) {
        alert("Pilih tepat satu item untuk transaksi.");
        return;
      }

      setLoading(true);

      try {
        // Mengambil item pertama dari cart
        const item = cartItems[0];
        const transactionData = {
          Id_Drink: item.id_Drink ?? 0,
          Id_Kebab: item.id_Kebab ?? 0,
          Id_Snack: item.id_Snack ?? 0,
          Id_Paket: item.id_Paket ?? 0,
          Jumlah: parseInt(item.quantity || 0),
          Alamat: finalAddress,
          Payment: paymentMethod,
          NomorTelepon: finalPhoneNumber,  
          StatusTracking: "Menunggu Konfirmasi",
          id_Driver: 0,
          totalHarga: item.harga * item.quantity,
          tanggalTransaksi: new Date().toISOString(),
        };

        const response = await axios.post(`${backendUrl}/DetailTransaksi`, transactionData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200 || response.status === 201) {
          const { id_DetailTransaksi, message } = response.data;
          alert(
            `${message} ID Transaksi: ${id_DetailTransaksi}, Total: Rp ${transactionData.totalHarga?.toLocaleString("id-ID")}`
          );
          localStorage.removeItem("cart");
          window.dispatchEvent(new Event("cart-updated"));
          setCartItems([]);
          
          const decodedToken = jwtDecode(token);
          const idUser = decodedToken["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
          await fetchTransactions(idUser);
        }
      } catch (error) {
        console.error("Gagal memproses pembayaran:", error);
        alert(`Gagal memproses pembayaran: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [cartItems, paymentMethod, navigate, backendUrl, fetchTransactions]
  );

  // Address modal handlers
  const handleOpenAddressModal = useCallback(() => {
    const storedAddress = localStorage.getItem("shippingAddress") || "";
    const storedPhoneNumber = localStorage.getItem("userPhoneNumber") || "";
    setTempAddress(storedAddress);
    setTempPhoneNumber(storedPhoneNumber);
    setShowAddressModal(true);
    setAddressError("");
    setPhoneNumberError("");
  }, []);

  const handleCloseAddressModal = useCallback(() => {
    setShowAddressModal(false);
  }, []);

  const handleSaveAddressAndPay = useCallback(async () => {
    setAddressError("");
    setPhoneNumberError("");
    let isValid = true;

    if (!tempAddress.trim()) {
      setAddressError("Alamat tidak boleh kosong.");
      isValid = false;
    }
    if (!tempPhoneNumber.trim()) {
      setPhoneNumberError("Nomor telepon tidak boleh kosong.");
      isValid = false;
    } else if (!/^\d{10,}$/.test(tempPhoneNumber.replace(/\D/g, ""))) {
      setPhoneNumberError("Nomor telepon tidak valid (minimal 10 digit angka).");
      isValid = false;
    }

    if (!isValid) return;

    localStorage.setItem("shippingAddress", tempAddress);
    localStorage.setItem("userPhoneNumber", tempPhoneNumber);

    handleCloseAddressModal();

    await processPayment(tempAddress, tempPhoneNumber);
  }, [tempAddress, tempPhoneNumber, processPayment, handleCloseAddressModal]);

  // Payment handler
  const handlePayment = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    if (cartItems.length === 0) {
      alert("Keranjang Anda kosong.");
      return;
    }
    if (!paymentMethod) {
      setShowAlert(true);
      return;
    }
    setShowAlert(false);
    handleOpenAddressModal();
  }, [navigate, cartItems, paymentMethod, handleOpenAddressModal]);

  // Pagination logic
  const indexOfLast = currentPage * transactionsPerPage;
  const indexOfFirst = indexOfLast - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  return (
    <Container className="cart-container my-4">
      <h2 className="cart-title text-center mb-4">Keranjang & Riwayat Transaksi</h2>
      <Row>
        {/* Cart Column */}
        <Col md={7} className="mb-4">
          <Card>
            <Card.Header as="h4">Keranjang Anda</Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : cartItems.length === 0 ? (
                <Alert variant="info">Keranjang Anda kosong.</Alert>
              ) : (
                <>
                  <Table striped bordered hover responsive="sm">
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
                        <tr key={item.id_Drink || item.id_Kebab || item.id_Snack || item.id_Paket || index}>
                          <td>
                            {item.nama_Paket || item.nama_Minuman || item.nama_Kebab || item.nama_Snack || "Tidak diketahui"}
                          </td>
                          <td>Rp {(item.harga || item.harga_Paket_After_Diskon || 0)?.toLocaleString("id-ID")}</td>
                          <td>
                            <Form.Control
                              type="number"
                              min="1"
                              value={item.quantity || 1}
                              onChange={(e) => {
                                const updatedCart = [...cartItems];
                                updatedCart[index].quantity = parseInt(e.target.value) || 1;
                                setCartItems(updatedCart);
                                localStorage.setItem("cart", JSON.stringify(updatedCart));
                                window.dispatchEvent(new Event("cart-updated"));
                              }}
                            />
                          </td>
                          <td>
                            Rp {((item.harga || item.harga_Paket_After_Diskon || 0) * (item.quantity || 0))?.toLocaleString("id-ID")}
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDecrease(index)}
                              title="Hapus"
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                  <h4 className="text-end mt-3">Total: Rp {calculateTotal()?.toLocaleString("id-ID")}</h4>
                  <Form.Group className="my-3">
                    <Form.Label>Pilih Metode Pembayaran:</Form.Label>
                    <Form.Select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setShowAlert(false);
                      }}
                      aria-label="Metode Pembayaran"
                    >
                      <option value="">-- Pilih Metode --</option>
                      <option value="Transfer Bank">Transfer Bank</option>
                      <option value="E-Wallet">E-Wallet</option>
                      <option value="COD">Cash on Delivery (COD)</option>
                    </Form.Select>
                    {showAlert && (
                      <Alert variant="warning" className="mt-2">
                        Silakan pilih metode pembayaran.
                      </Alert>
                    )}
                  </Form.Group>
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button variant="secondary" onClick={() => navigate("/menu")}>
                      Kembali ke Menu
                    </Button>
                    <Button
                      variant="success"
                      onClick={handlePayment}
                      disabled={loading || cartItems.length === 0}
                    >
                      {loading ? (
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      ) : (
                        "Lanjut ke Pembayaran"
                      )}
                    </Button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Transaction History Column */}
        <Col md={5}>
          <Card>
            <Card.Header as="h4">Riwayat Transaksi</Card.Header>
            <Card.Body>
              <div className="mb-3">
                <InputGroup>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary">
                      Filter: {filterStatus}
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => setFilterStatus("Semua")}>Semua</Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterStatus("Menunggu Konfirmasi")}>Menunggu Konfirmasi</Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterStatus("Menunggu Diterima")}>Menunggu Diterima</Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterStatus("Sudah Diterima")}>Sudah Diterima</Dropdown.Item>
                      <Dropdown.Item onClick={() => setFilterStatus("Dibatalkan")}>Dibatalkan</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </InputGroup>
              </div>

              {loading && showTransactions && transactions.length === 0 && (
                <div className="text-center">
                  <Spinner animation="border" role="status" size="sm">
                    <span className="visually-hidden">Memuat riwayat...</span>
                  </Spinner>
                </div>
              )}

              {showTransactions ? (
                currentTransactions.length > 0 ? (
                  <>
                    {currentTransactions
                      .sort((a, b) => new Date(b.tanggalTransaksi) - new Date(a.tanggalTransaksi))
                      .map((transaction) => (
                        <Card 
                          key={transaction.id_DetailTransaksi} 
                          className="mb-3 transaction-card shadow-sm"
                          onClick={() => setSelectedTransaction(transaction)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Header className="transaction-card-header small py-1 px-2">
                            <Row className="align-items-center">
                              <Col xs={6}>
                                {new Date(transaction.tanggalTransaksi).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </Col>
                              <Col xs={6} className="text-end">
                                Status:{" "}
                                <Badge
                                  pill
                                  bg={transaction.statusTracking === "Sudah Diterima"
                                    ? "success"
                                    : transaction.statusTracking === "Dibatalkan"
                                    ? "danger"
                                    : "warning"}
                                >
                                  {transaction.statusTracking}
                                </Badge>
                              </Col>
                            </Row>
                          </Card.Header>
                          <Card.Body className="p-2 transaction-card-body">
                            <p className="mb-1">
                              <strong>Items:</strong>
                              <ul className="mb-0">
                                {transaction.items.map((item, index) => (
                                  <li key={index}>
                                    {item.NamaItem} (x{item.Jumlah}) - Rp {item.TotalHarga?.toLocaleString("id-ID")}
                                  </li>
                                ))}
                              </ul>
                            </p>
                            <p className="mb-1">
                              <strong>Total:</strong> 
                              Rp {transaction.totalHarga != null ? transaction.totalHarga?.toLocaleString("id-ID") : "N/A"}
                              <span className="float-end small">({transaction.payment || "N/A"})</span>
                            </p>
                          </Card.Body>
                          {transaction.statusTracking === "Menunggu Diterima" && transaction.driver && (
                            <Card.Footer className="text-end transaction-actions py-1 px-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTerimaPesanan(transaction.id_DetailTransaksi, transaction.driver.id_Driver);
                                }}
                                disabled={loading}
                              >
                                Sudah Diterima
                              </Button>
                            </Card.Footer>
                          )}
                        </Card>
                      ))
                    }
                    
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination>
                          <Pagination.Prev 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                            disabled={currentPage === 1} 
                          />
                          {Array.from({ length: totalPages }, (_, i) => (
                            <Pagination.Item
                              key={i + 1}
                              active={i + 1 === currentPage}
                              onClick={() => setCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </Pagination.Item>
                          ))}
                          <Pagination.Next 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                            disabled={currentPage === totalPages} 
                          />
                        </Pagination>
                      </div>
                    )}
                  </>
                ) : (
                  <Alert variant="secondary" className="text-center">
                    {filterStatus === "Semua" 
                      ? "Belum ada riwayat transaksi." 
                      : `Tidak ada transaksi dengan status "${filterStatus}".`}
                  </Alert>
                )
              ) : (
                <Alert variant="warning" className="text-center">
                  Silakan login untuk melihat riwayat transaksi.
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Address & Phone Modal */}
      <Modal show={showAddressModal} onHide={handleCloseAddressModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Alamat & Nomor Telepon Pengiriman</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="shippingAddress">
            <Form.Label>Alamat Lengkap:</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={tempAddress}
              onChange={(e) => setTempAddress(e.target.value)}
              placeholder="Masukkan alamat pengiriman Anda"
              isInvalid={!!addressError}
            />
            <Form.Control.Feedback type="invalid">{addressError}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="userPhoneNumber">
            <Form.Label>Nomor Telepon (Aktif):</Form.Label>
            <Form.Control
              type="tel"
              value={tempPhoneNumber}
              onChange={(e) => setTempPhoneNumber(e.target.value)}
              placeholder="Masukkan nomor telepon Anda (cth: 0812...)"
              isInvalid={!!phoneNumberError}
            />
            <Form.Control.Feedback type="invalid">{phoneNumberError}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAddressModal}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSaveAddressAndPay} disabled={loading}>
            {loading ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              "Simpan & Bayar"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Cart;