import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimeCard from '../components/AnimeCard';
import { useAuth } from '../App';

const SERIE_GENEROS = ['Todos', 'Acción', 'Aventura', 'Fantasía', 'Romance', 'Comedia', 'Thriller', 'Shōnen', 'Seinen'];

export default function Series() {
  const [animes, setAnimes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [generoActivo, setGeneroActivo] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    api.get('/animes')
      .then((res) => {
        const series = res.data.filter((a) => a.tipo === 'Serie' && a.is_anime === false);
        setAnimes(series);
        setFiltered(series);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (generoActivo === 'Todos') {
      setFiltered(animes);
    } else {
      setFiltered(animes.filter((a) =>
        (a.generos || []).some((g) => g.toLowerCase() === generoActivo.toLowerCase())
      ));
    }
  }, [generoActivo, animes]);

  return (
    <>
      <Navbar />
      <main className="series-page" style={{ paddingTop: '68px', minHeight: '100vh' }}>
        <div className="page-header" style={{
          background: 'linear-gradient(to bottom, rgba(124,58,237,0.15), var(--bg-void))',
          padding: '4rem 5% 3rem',
        }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(2.5rem,5vw,4rem)', marginBottom: '0.5rem' }}>
              <i className="fas fa-tv" style={{ marginRight: '1rem', color: 'var(--accent)' }}></i>
              Series
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px' }}>
              Descubre las mejores series para ti
            </p>
          </div>
        </div>

        <div className="genre-section" style={{ padding: '1.5rem 5%', borderBottom: '1px solid var(--border)' }}>
          <div className="genre-filters">
            {SERIE_GENEROS.map((g) => (
              <button
                key={g}
                className={`genre-btn${generoActivo === g ? ' active' : ''}`}
                onClick={() => setGeneroActivo(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <section className="section" style={{ padding: '3rem 5%' }}>
          <div style={{ marginBottom: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filtered.length} serie{filtered.length !== 1 ? 's' : ''} encontrada{filtered.length !== 1 ? 's' : ''}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <i className="fas fa-circle-notch spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
            </div>
          ) : filtered.length > 0 ? (
            <div className="anime-grid">
              {filtered.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p>No se encontraron series</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}