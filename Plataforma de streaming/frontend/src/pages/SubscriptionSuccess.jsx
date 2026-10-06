import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../App';

export default function SubscriptionSuccess() {
  const [searchParams] = useSearchParams();
  const { usuario, login } = useAuth();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const refreshUser = async () => {
      try {
        const res = await api.get('/auth/me');
        const token = localStorage.getItem('token');
        if (res.data && token) {
          login(res.data, token);
        }
        setStatus('success');
      } catch {
        setStatus('success');
      }
    };

    const timer = setTimeout(refreshUser, 2000);
    return () => clearTimeout(timer);
  }, [searchParams, login]);

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px' }}>
          {status === 'loading' ? (
            <>
              <div style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--accent)' }}>
                <i className="fas fa-circle-notch spin"></i>
              </div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '2rem' }}>
                Procesando tu pago...
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Espera un momento mientras confirmamos tu suscripción.
              </p>
            </>
          ) : (
            <>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem', fontSize: '2.5rem', color: '#22c55e',
              }}>
                <i className="fas fa-check"></i>
              </div>
              <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                ¡Suscripción exitosa!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Bienvenido a <strong style={{ color: 'var(--accent)' }}>{usuario?.plan || 'Premium'}</strong>. Ya puedes disfrutar de todo el contenido.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/browse" className="btn-cta-primary" style={{ padding: '0.8rem 2rem' }}>
                  <i className="fas fa-compass" style={{ marginRight: '8px' }}></i>
                  Explorar catálogo
                </Link>
                <Link to="/profile" className="btn-cta-secondary" style={{ padding: '0.8rem 2rem' }}>
                  <i className="fas fa-user" style={{ marginRight: '8px' }}></i>
                  Mi perfil
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
