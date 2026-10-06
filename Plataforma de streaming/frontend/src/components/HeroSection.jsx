import React from 'react';

export default function HeroSection() {
  return (
    <section className="hero">
      <div className="hero-bg-lines"></div>
      <div className="hero-inner">
        <div className="hero-content">
          <div className="hero-label">
            <i className="fas fa-fire"></i>
            Temporada Primavera 2025
          </div>
          <h2>
            El universo
            <span className="highlight">Anime</span>
            a tu alcance
          </h2>
          <p>Miles de episodios en HD, subtitulados y doblados. Nuevos episodios cada semana, sin interrupciones.</p>
          <div className="hero-cta">
            <a href="#suscripciones" className="btn-cta-primary">
              <i className="fas fa-play"></i>
              Empezar Gratis
            </a>
            <a href="#featured" className="btn-cta-secondary">
              <i className="fas fa-compass"></i>
              Explorar Catálogo
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">15K+</span>
              <span className="stat-label">Episodios</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Series</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4K</span>
              <span className="stat-label">Calidad</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-stack">
            <div className="hero-card-behind left"></div>
            <div className="hero-card-behind right"></div>
            <div className="hero-card-main">
              <img src="/img/onep.jpg" alt="One Piece" onError={(e) => { e.target.style.background = 'linear-gradient(145deg,#1a0a2e,#0d0d1a)'; e.target.style.display = 'block'; }} />
            </div>
            <div className="hero-card-badge">
              <span className="badge-title">One Piece</span>
              <span className="badge-sub">▶ Ep. 1089 disponible</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
