import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SubscriptionCancel() {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem', fontSize: '2.5rem', color: '#ef4444',
          }}>
            <i className="fas fa-times"></i>
          </div>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Pago cancelado
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            No te preocupes, no se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/browse" className="btn-cta-primary" style={{ padding: '0.8rem 2rem', textDecoration: 'none' }}>
              <i className="fas fa-compass" style={{ marginRight: '8px' }}></i>
              Seguir explorando
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
