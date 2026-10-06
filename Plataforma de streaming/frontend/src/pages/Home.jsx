import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import HeroSlider from '../components/HeroSlider';
import AnimeCard from '../components/AnimeCard';
import { useAuth } from '../App';

export default function Home() {
  const [animes, setAnimes] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const { usuario } = useAuth();

  useEffect(() => {
    api.get('/animes')
      .then((res) => {
        const western = res.data.filter(a => a.is_anime === false);
        setAnimes(western.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (usuario) {
      api.get('/animes/continue')
        .then((res) => {
          const western = res.data.filter(a => a.is_anime === false);
          setContinueWatching(western.slice(0, 4));
        })
        .catch(() => setContinueWatching([]));
    } else {
      setContinueWatching([]);
    }
  }, [usuario]);

  const destacados = animes.slice(0, 8);

  return (
    <>
      <Navbar />
      <main>
        <HeroSlider />

        {/* Brand Hubs Row (HBO Max style) */}
        <section className="hubs-section">
          <div className="hubs-grid">
            <Link to="/movies" className="hub-card">
              <div className="hub-content">
                <i className="fas fa-film"></i>
                <span>PELÍCULAS</span>
              </div>
            </Link>
            <Link to="/series" className="hub-card">
              <div className="hub-content">
                <i className="fas fa-tv"></i>
                <span>SERIES</span>
              </div>
            </Link>
            <Link to="/browse" className="hub-card">
              <div className="hub-content">
                <i className="fas fa-crown" style={{ color: 'var(--magenta-neon)' }}></i>
                <span>MAX ORIGINALS</span>
              </div>
            </Link>
            <Link to="/browse" className="hub-card">
              <div className="hub-content">
                <i className="fas fa-fire"></i>
                <span>ANIME & MANGAS</span>
              </div>
            </Link>
            <Link to="/browse" className="hub-card">
              <div className="hub-content">
                <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                <span>MÁS POPULARES</span>
              </div>
            </Link>
          </div>
        </section>

        {continueWatching.length > 0 && (
          <section className="section" style={{ paddingTop: '2rem' }}>
            <div className="section-header">
              <h2 className="section-title">Continuar Viendo</h2>
              <Link to="/profile" className="section-link">Ver todo mi historial <i className="fas fa-arrow-right"></i></Link>
            </div>
            <div className="continue-row">
              {continueWatching.map((item) => (
                <Link to={`/anime/${item.anime_id}`} className="continue-card" key={item.id}>
                  <div className="continue-thumb">
                    <img 
                      src={item.imagen ? `/img/${item.imagen}` : `https://placehold.co/280x160/150d36/cbd5e1?text=${encodeURIComponent(item.titulo)}`} 
                      alt={item.titulo}
                      onError={(e) => { e.target.src = `https://placehold.co/280x160/150d36/cbd5e1?text=${encodeURIComponent(item.titulo)}`; }}
                    />
                    <div className="continue-overlay"><i className="fas fa-play-circle"></i></div>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${item.progreso || 0}%` }}></div></div>
                  <div className="continue-info">
                    <h4>{item.titulo}</h4>
                    <span>Ep. {item.episodio}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="section" id="trending">
          <div className="section-header">
            <h2 className="section-title">Destacados en STREAMMAX</h2>
            <Link to="/browse" className="section-link">Explorar todo <i className="fas fa-arrow-right"></i></Link>
          </div>
          <div className="anime-grid">
            {destacados.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
          </div>
        </section>

        <div className="trending-banner">
          <div className="trending-banner-text">
            <h3>⚡ TODO TU ENTRETENIMIENTO EN UN SOLO PLAN</h3>
            <p>Accede a estrenos simultáneos, películas taquilleras y series galardonadas en 4K Ultra HD.</p>
          </div>
          <Link to="/browse" className="trending-banner-cta">
            <i className="fas fa-bolt" style={{ marginRight: '8px' }}></i>
            Ver Planes MAX
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}