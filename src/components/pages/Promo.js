import React from 'react';
import '../styles/Promo.css';

const PromoPage = () => {
  const promoItems = [
    {
      title: 'Diskon 50% untuk Kebab Jumbo!',
      description: 'Nikmati Kebab Jumbo dengan potongan harga spesial hanya hari ini!',
      image: '/assets/images/promo-kebab-jumbo.jpg',
      discount: '50%'
    },
    {
      title: 'Gratis Minuman untuk Setiap Pembelian Paket Makanan',
      description: 'Beli paket makanan favoritmu dan dapatkan minuman gratis!',
      image: '/assets/images/promo-paket-minuman.jpg',
      discount: 'Gratis'
    }
  ];

  return (
    <div className="promo-container">
      <h1 className="promo-title">🔥 Promo Spesial Hari Ini! 🔥</h1>
      <div className="promo-list">
        {promoItems.map((promo, index) => (
          <div key={index} className="promo-card">
            <div className="promo-image-container">
              <span className="badge">{promo.discount}</span>
              <img src={promo.image} alt={promo.title} className="promo-image" />
            </div>
            <div className="promo-content">
              <h3>{promo.title}</h3>
              <p>{promo.description}</p>
              <div className="promo-cta">Lihat Detail</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PromoPage;
