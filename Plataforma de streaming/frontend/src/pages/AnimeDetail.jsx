import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { saveProgress, getContinueWatching } from '../api';
import { useAuth } from '../App';
import { useSection } from '../contexts/SectionContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AnimeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { setSection } = useSection();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [continueData, setContinueData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [trivia, setTrivia] = useState(null);
  const [loadingTrivia, setLoadingTrivia] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/animes/${id}`),
      usuario ? getContinueWatching().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
    ])
      .then(([animeRes, continueRes]) => {
        setAnime(animeRes.data);
        if (animeRes.data.is_anime === false) {
          setSection('streaming');
        } else {
          setSection('anime');
        }
        const found = continueRes.data.find(c => c.anime_id === parseInt(id));
        if (found) setContinueData(found);
      })
      .catch(() => setError('Anime no encontrado'))
      .finally(() => setLoading(false));
  }, [id, usuario]);

  const handlePlay = async () => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    
    if (anime.tipo?.toLowerCase() === 'manga') {
      navigate(`/manga/${id}/leer`);
      return;
    }

    const ep = continueData?.episodio || 1;
    try {
      await saveProgress(parseInt(id), ep, 0);
    } catch {}
    navigate(`/watch/${id}/${ep}`);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  const handleGetTrivia = async () => {
    if (!anime) return;
    setLoadingTrivia(true);
    try {
      const res = await api.post('/ai/trivia', { titulo: anime.titulo });
      setTrivia(res.data.trivia);
    } catch (err) {
      console.error(err);
      setTrivia('Ups, mi cerebro AI falló al intentar buscar curiosidades de este título.');
    } finally {
      setLoadingTrivia(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="detail-loading" style={{ minHeight: '100vh', paddingTop: '68px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-circle-notch spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
        </div>
      </>
    );
  }

  if (error || !anime) {
    return (
      <>
        <Navbar />
        <div className="detail-error" style={{ minHeight: '100vh', paddingTop: '68px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: 'var(--accent)' }}></i>
          <h2>{error || 'Anime no encontrado'}</h2>
          <Link to="/" className="btn-cta-primary">Volver al inicio</Link>
        </div>
      </>
    );
  }

  const episodes = Array.from({ length: anime.episodios || 1 }, (_, i) => i + 1);
  const imgSrc = anime.imagen ? `/img/${anime.imagen}` : `https://placehold.co/400x500/111122/9896b8?text=${encodeURIComponent(anime.titulo)}`;

  return (
    <>
      <Navbar />
      <main className="detail-page" style={{ paddingTop: '68px' }}>
        <div className="detail-hero" style={{
          position: 'relative',
          minHeight: '70vh',
          background: `linear-gradient(to top, var(--bg-void) 0%, transparent 50%), url(${imgSrc}) center/cover no-repeat`,
          backgroundColor: 'var(--bg-deep)',
        }}>
          <div className="detail-backdrop" style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, var(--bg-void) 0%, transparent 60%)',
          }}></div>
          <div className="detail-content" style={{
            position: 'relative', maxWidth: '1200px', margin: '0 auto', padding: '4rem 5%',
            display: 'grid', gridTemplateColumns: '300px 1fr', gap: '3rem', alignItems: 'end',
          }}>
            <div className="detail-poster">
              <img src={imgSrc} alt={anime.titulo}
                style={{
                  width: '100%', borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-card)',
                }}
                onError={(e) => { e.target.src = `https://placehold.co/300x400/111122/9896b8?text=${encodeURIComponent(anime.titulo)}`; }}
              />
            </div>
            <div className="detail-info">
              {anime.badge && (
                <span className="detail-badge" style={{
                  display: 'inline-block',
                  background: anime.badge_color === 'transparent' ? 'rgba(0,0,0,0.7)' : anime.badge_color || 'var(--accent)',
                  color: anime.badge_color === 'transparent' ? 'var(--text-secondary)' : 'white',
                  padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700',
                  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem',
                }}>
                  {anime.badge}
                </span>
              )}
              <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1 }}>
                {anime.titulo}
              </h1>
              <div className="detail-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', margin: '1rem 0', color: 'var(--text-secondary)' }}>
                <span><i className="fas fa-star" style={{ color: 'var(--accent)', marginRight: '6px' }}></i>{anime.rating}</span>
                <span><i className="fas fa-play-circle" style={{ marginRight: '6px' }}></i>{anime.episodios} episodios</span>
                <span><i className="fas fa-calendar" style={{ marginRight: '6px' }}></i>{anime.temporada}</span>
                <span><i className="fas fa-tag" style={{ marginRight: '6px' }}></i>{anime.tipo}</span>
              </div>
              <div className="detail-genres" style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {(anime.generos || []).map((g) => (
                  <span key={g} style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    padding: '4px 12px', borderRadius: '50px', fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                  }}>{g}</span>
                ))}
              </div>
              {anime.descripcion && (
                <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', lineHeight: 1.7 }}>{anime.descripcion}</p>
              )}
              <div className="detail-actions" style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
                <button className="btn-cta-primary" onClick={handlePlay} style={{ padding: '1rem 2.5rem' }}>
                  <i className={`fas ${anime.tipo?.toLowerCase() === 'manga' ? 'fa-book-open' : 'fa-play'}`} style={{ marginRight: '10px' }}></i>
                  {anime.tipo?.toLowerCase() === 'manga' 
                    ? 'Leer Manga' 
                    : continueData ? `Continuar Ep. ${continueData.episodio}` : 'Reproducir'}
                </button>
                <button 
                  className="btn-cta-secondary" 
                  onClick={handleToggleFavorite}
                  style={{ padding: '1rem 1.5rem', minWidth: '120px' }}
                >
                  <i className={`fas fa-heart${isFavorite ? '' : '-o'}`} style={{ marginRight: '8px', color: isFavorite ? '#ef4444' : undefined }}></i>
                  {isFavorite ? 'Favorito' : 'Favorito'}
                </button>
                <button 
                  className="btn-cta-secondary" 
                  onClick={handleGetTrivia}
                  disabled={loadingTrivia}
                  style={{ 
                    padding: '1rem 1.5rem', minWidth: '120px', 
                    background: 'var(--bg-elevated)', border: '1px solid var(--accent)', color: 'var(--text-primary)'
                  }}
                >
                  <i className={`fas ${loadingTrivia ? 'fa-spinner fa-spin' : 'fa-magic'}`} style={{ marginRight: '8px', color: 'var(--accent)' }}></i>
                  {loadingTrivia ? 'Analizando...' : 'Analizar con IA'}
                </button>
              </div>

              {/* AI Trivia Box */}
              {trivia && (
                <div style={{
                  marginTop: '1.5rem', padding: '1rem', background: 'rgba(var(--accent-rgb), 0.1)', 
                  border: '1px solid var(--accent)', borderRadius: '8px', position: 'relative'
                }}>
                  <button 
                    onClick={() => setTrivia(null)} 
                    style={{ position: 'absolute', top: '5px', right: '10px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-robot"></i> Dato Curioso IA
                  </h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.5 }}>
                    {trivia}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {anime.tipo === 'Serie' && episodes.length > 1 && (
          <section className="detail-episodes" style={{ padding: '3rem 5%', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 className="section-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Episodios</h2>
            <div className="episodes-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {episodes.map((ep) => (
                <button
                  key={ep}
                  className={`episode-card${continueData?.episodio === ep ? ' active' : ''}`}
                  onClick={async () => {
                    if (usuario) {
                      await saveProgress(parseInt(id), ep, 0).catch(() => {});
                    }
                    navigate(`/watch/${id}/${ep}`);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    background: continueData?.episodio === ep ? 'var(--accent-dim)' : 'var(--bg-card)',
                    border: `1px solid ${continueData?.episodio === ep ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-md)', padding: '1rem', cursor: 'pointer',
                    textAlign: 'left', color: 'var(--text-primary)', transition: 'var(--transition)',
                  }}
                >
                  <span style={{
                    width: '40px', height: '40px', borderRadius: '8px',
                    background: continueData?.episodio === ep ? 'var(--accent)' : 'var(--bg-elevated)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: '700', fontSize: '0.9rem',
                  }}>{ep}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Episodio {ep}</div>
                    {continueData?.episodio === ep && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Continuar</div>
                    )}
                  </div>
                  <i className="fas fa-play-circle" style={{ color: 'var(--text-muted)' }}></i>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}