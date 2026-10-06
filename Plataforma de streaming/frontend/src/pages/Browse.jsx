import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimeCard from '../components/AnimeCard';
import { useAuth } from '../App';

import { useSection } from '../contexts/SectionContext';

const GENEROS_STREAMING = ['Todos', 'Acción', 'Drama', 'Sci-Fi', 'Comedia', 'Misterio', 'Crimen', 'Fantasía'];
const GENEROS_ANIME = ['Todos', 'Acción', 'Fantasía', 'Shonen', 'Seinen', 'Romance', 'Comedia', 'Thriller', 'Aventura'];
const TIPOS = ['Todos', 'Serie', 'Película'];
const ORDENAR = ['Recientes', 'Rating', 'Nombre', 'Episodios'];

export default function Browse() {
  const { section } = useSection();
  const [searchParams, setSearchParams] = useSearchParams();
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingAI, setLoadingAI] = useState(false);
  const { usuario } = useAuth();

  // If in 'music', we shouldn't really be here, but let's default to streaming logic if needed.
  const isAnimeSection = section === 'anime';
  const GENEROS = isAnimeSection ? GENEROS_ANIME : GENEROS_STREAMING;

  const genero = searchParams.get('genero') || 'Todos';
  const tipo = searchParams.get('tipo') || 'Todos';
  const ordenar = searchParams.get('sort') || 'Recientes';
  const buscar = searchParams.get('q') || '';
  const pagina = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    setLoading(true);
    api.get('/animes')
      .then((res) => setAnimes(res.data))
      .catch(() => setAnimes([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (usuario) {
      setLoadingAI(true);
      api.post('/ai/recommend', { history: 'recently watched' })
        .then(res => {
          if (res.data.recommendations) setRecommendations(res.data.recommendations);
        })
        .catch(err => console.error("Error fetching AI recommendations", err))
        .finally(() => setLoadingAI(false));
    }
  }, [usuario]);

  const filtered = animes.filter((a) => {
    // Context filter (Streaming vs Anime)
    if (isAnimeSection && !a.is_anime) return false;
    if (!isAnimeSection && a.is_anime) return false;

    // Genre filter
    if (genero !== 'Todos' && !(a.generos || []).some((g) => g.toLowerCase() === genero.toLowerCase())) return false;
    
    // Type and Search filters
    if (tipo !== 'Todos' && a.tipo !== tipo) return false;
    if (buscar && !a.titulo.toLowerCase().includes(buscar.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (ordenar === 'Rating') return b.rating - a.rating;
    if (ordenar === 'Nombre') return a.titulo.localeCompare(b.titulo);
    if (ordenar === 'Episodios') return b.episodios - a.episodios;
    return 0;
  });

  const porPagina = 20;
  const totalPaginas = Math.ceil(filtered.length / porPagina);
  const animesPaginados = filtered.slice((pagina - 1) * porPagina, pagina * porPagina);

  const actualizarFiltro = (clave, valor) => {
    const nuevos = new URLSearchParams(searchParams);
    nuevos.set(clave, valor);
    if (clave !== 'page') nuevos.set('page', '1');
    setSearchParams(nuevos);
  };

  const limpiar = () => setSearchParams({});

  return (
    <>
      <Navbar />
      <main className="browse-page" style={{ paddingTop: '68px', minHeight: '100vh' }}>
        <div className="browse-header" style={{
          background: 'linear-gradient(to bottom, var(--bg-deep), var(--bg-void)',
          padding: '3rem 5% 2rem',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '2rem' }}>
            Explorar {isAnimeSection ? 'Anime & Manga' : 'Películas y Series'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="browse-search" style={{ flex: '1 1 300px', position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input
                type="text"
                placeholder="Buscar anime..."
                value={buscar}
                onChange={(e) => actualizarFiltro('q', e.target.value)}
                style={{
                  width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem',
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                }}
              />
            </div>
          </div>
        </div>

        <div className="browse-filters" style={{ padding: '1.5rem 5%', display: 'flex', gap: '2rem', flexWrap: 'wrap', borderBottom: '1px solid var(--border)' }}>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Género</label>
            <div className="filter-pills" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {GENEROS.map((g) => (
                <button
                  key={g}
                  onClick={() => actualizarFiltro('genero', g)}
                  className={`filter-pill${genero === g ? ' active' : ''}`}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '50px', border: 'none',
                    background: genero === g ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: genero === g ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                    transition: 'var(--transition)',
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tipo</label>
            <div className="filter-pills" style={{ display: 'flex', gap: '0.5rem' }}>
              {TIPOS.map((t) => (
                <button
                  key={t}
                  onClick={() => actualizarFiltro('tipo', t)}
                  className={`filter-pill${tipo === t ? ' active' : ''}`}
                  style={{
                    padding: '0.4rem 1rem', borderRadius: '50px', border: 'none',
                    background: tipo === t ? 'var(--accent)' : 'var(--bg-elevated)',
                    color: tipo === t ? 'white' : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.85rem', fontWeight: '500',
                    transition: 'var(--transition)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ordenar</label>
            <select
              value={ordenar}
              onChange={(e) => actualizarFiltro('sort', e.target.value)}
              style={{
                padding: '0.4rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-primary)',
                fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              {ORDENAR.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <div className="browse-results" style={{ padding: '2rem 5%' }}>
          
          {/* AI Recommendations Carousel */}
          {usuario && recommendations.length > 0 && !loadingAI && (
            <div style={{ marginBottom: '3rem', padding: '1.5rem', background: 'rgba(var(--accent-rgb), 0.05)', borderRadius: '12px', border: '1px solid rgba(var(--accent-rgb), 0.2)' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-magic" style={{ color: 'var(--accent)' }}></i> La IA te recomienda
              </h2>
              <div className="anime-grid">
                {recommendations.map(anime => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem' }}>
              <i className="fas fa-circle-notch spin" style={{ fontSize: '2rem', color: 'var(--accent)' }}></i>
            </div>
          ) : animesPaginados.length > 0 ? (
            <>
              <div className="anime-grid">
                {animesPaginados.map((anime) => (
                  <AnimeCard key={anime.id} anime={anime} />
                ))}
              </div>
              {totalPaginas > 1 && (
                <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
                  <button
                    onClick={() => actualizarFiltro('page', String(pagina - 1))}
                    disabled={pagina <= 1}
                    style={{
                      padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      opacity: pagina <= 1 ? 0.5 : 1,
                    }}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <span style={{ padding: '0.6rem 1rem', color: 'var(--text-secondary)' }}>
                    {pagina} / {totalPaginas}
                  </span>
                  <button
                    onClick={() => actualizarFiltro('page', String(pagina + 1))}
                    disabled={pagina >= totalPaginas}
                    style={{
                      padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)', border: '1px solid var(--border)',
                      color: 'var(--text-secondary)', cursor: 'pointer',
                      opacity: pagina >= totalPaginas ? 0.5 : 1,
                    }}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
              <i className="fas fa-search" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
              <p>No se encontraron animes</p>
              <button onClick={limpiar} style={{ marginTop: '1rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}