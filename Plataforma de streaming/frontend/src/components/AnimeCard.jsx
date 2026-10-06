import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AnimeCard({ anime }) {
  const navigate = useNavigate();
  const imgSrc = anime.imagen
    ? `/img/${anime.imagen}`
    : `https://placehold.co/200x300/150d36/cbd5e1?text=${encodeURIComponent(anime.titulo)}`;

  return (
    <div 
      className="anime-card" 
      data-genre={(anime.generos || []).join(' ')}
      onClick={() => navigate(`/anime/${anime.id}`)}
    >
      <div className="anime-card-thumb">
        <img
          src={imgSrc}
          alt={anime.titulo}
          onError={(e) => { e.target.src = `https://placehold.co/200x300/150d36/cbd5e1?text=${encodeURIComponent(anime.titulo)}`; }}
        />
        {anime.badge ? (
          <div className="card-badge">
            {anime.badge}
          </div>
        ) : (
          <div className="card-badge">
            MAX
          </div>
        )}
        <span className="max-tag">4K</span>
        <div className="anime-card-overlay">
          <div className="play-btn"><i className="fas fa-play"></i></div>
        </div>
      </div>
      <div className="anime-card-info">
        <h3>{anime.titulo}</h3>
        <div className="anime-card-meta">
          <span>{anime.tipo || 'Serie'} · {anime.temporada || 'T1'}</span>
          <span className="anime-card-rating">
            <i className="fas fa-star"></i> {anime.rating}
          </span>
        </div>
      </div>
    </div>
  );
}
