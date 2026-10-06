import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimeCard from '../components/AnimeCard';
import { useAuth } from '../App';

export default function Favorites() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    setLoading(false);
  }, [usuario, navigate]);

  if (!usuario) return null;

  return (
    <>
      <Navbar />
      <main className="favorites-page" style={{ paddingTop: '68px', minHeight: '100vh' }}>
        <div className="page-header" style={{
          background: 'linear-gradient(to bottom, rgba(239,68,68,0.15), var(--bg-void))',
          padding: '4rem 5% 3rem',
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', marginBottom: '0.5rem' }}>
              <i className="fas fa-heart" style={{ marginRight: '1rem', color: '#ef4444' }}></i>
              Mis Favoritos
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>
              Tus anime guardados para ver después
            </p>
          </div>
        </div>

        <section className="section" style={{ padding: '3rem 5%' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <i className="fas fa-circle-notch spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
            </div>
          ) : favorites.length > 0 ? (
            <>
              <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {favorites.length} anime en favoritos
              </div>
              <div className="anime-grid">
                {favorites.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-heart" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p style={{ marginBottom: '0.5rem' }}>No tienes favoritos aún</p>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>Explora el catálogo y guarda tus animes favoritos</p>
              <Link to="/browse" className="btn-cta-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}>
                <i className="fas fa-search"></i> Explorar
              </Link>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}