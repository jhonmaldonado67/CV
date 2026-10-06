import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function HeroSlider() {
  const [animes, setAnimes] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/animes')
      .then((res) => {
        const western = res.data.filter(a => a.is_anime === false);
        const datos = western.slice(0, 5);
        setAnimes(datos);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % animes.length);
  }, [animes.length]);

  useEffect(() => {
    if (animes.length <= 1) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [animes.length, nextSlide]);

  const goToSlide = (index) => {
    setCurrent(index);
  };

  if (loading || animes.length === 0) {
    return (
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-label">
              <i className="fas fa-bolt"></i>
              MAX EXCLUSIVOS & TENDENCIAS
            </div>
            <h2>
              TODO EL ENTRETENIMIENTO EN
              <span className="highlight"> UN SOLO LUGAR</span>
            </h2>
            <p>Películas, Series, Documentales, Anime y Producciones Originales en Ultra HD 4K.</p>
            <div className="hero-cta">
              <a href="/browse" className="btn-cta-primary">
                <i className="fas fa-play"></i>
                Comenzar Prueba MAX
              </a>
              <a href="/browse" className="btn-cta-secondary">
                <i className="fas fa-compass"></i>
                Explorar Catálogo
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const anime = animes[current];
  const bgImage = anime.imagen 
    ? `/img/${anime.imagen}` 
    : `https://placehold.co/1920x1080/0f0a24/9896b8?text=${encodeURIComponent(anime.titulo)}`;

  return (
    <section className="hero hero-slider" style={{ position: 'relative', minHeight: '85vh', overflow: 'hidden' }}>
      <div className="hero-slider-track" style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `linear-gradient(to right, var(--bg-void) 0%, rgba(7, 4, 20, 0.4) 40%, rgba(7, 4, 20, 0.9) 100%), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%',
        transition: 'background-image 0.8s ease-in-out',
        filter: 'brightness(0.9)',
      }}></div>
      <div className="hero-slider-gradient" style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, var(--bg-void) 0%, transparent 60%, rgba(7, 4, 20, 0.7) 100%)',
      }}></div>

      <div className="hero-inner" style={{ position: 'relative', zIndex: 2 }}>
        <div className="hero-content" style={{ opacity: 1, transform: 'translateY(0)' }}>
          <div className="hero-label">
            <i className="fas fa-crown" style={{ color: 'var(--cyan-neon)' }}></i>
            MAX EXCLUSIVO · {anime.tipo || 'Serie'}
          </div>
          <h2 style={{ transition: 'all 0.5s ease', marginBottom: '0.8rem' }}>
            {anime.titulo}
          </h2>
          <div className="hero-meta" style={{ display: 'flex', gap: '1rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.95rem' }}>
              <i className="fas fa-star" style={{ marginRight: '6px' }}></i>
              {anime.rating}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
              4K Ultra HD
            </span>
            <span style={{ background: 'rgba(112,0,255,0.3)', border: '1px solid rgba(112,0,255,0.5)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {anime.temporada || 'T1'}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {(anime.generos || []).slice(0, 3).join(' · ')}
            </span>
          </div>
          <p style={{ maxWidth: '520px', color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {anime.descripcion || `Disfruta de ${anime.titulo} con calidad cinematográfica, audio envolvente 5.1 y doblaje multiplataforma.`}
          </p>
          <div className="hero-cta">
            <button onClick={() => navigate(`/anime/${anime.id}`)} className="btn-cta-primary">
              <i className="fas fa-play"></i>
              Reproducir Ahora
            </button>
            <button onClick={() => navigate('/browse')} className="btn-cta-secondary">
              <i className="fas fa-plus"></i>
              Mi Lista
            </button>
          </div>
        </div>

        <div className="hero-slider-indicators" style={{
          position: 'absolute',
          bottom: '2.5rem',
          right: '5%',
          display: 'flex',
          gap: '0.6rem',
          zIndex: 10,
        }}>
          {animes.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`slider-indicator${index === current ? ' active' : ''}`}
              aria-label={`Ir a título ${index + 1}`}
              style={{
                width: index === current ? '32px' : '10px',
                height: '8px',
                borderRadius: '4px',
                border: 'none',
                background: index === current ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.2)',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                boxShadow: index === current ? '0 0 15px rgba(112,0,255,0.8)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}