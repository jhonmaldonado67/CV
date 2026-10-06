import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import AnimeCard from '../components/AnimeCard';

const MANGA_CATALOG = [
  {
    id: 1,
    titulo: 'Chainsaw Man',
    genero: 'Acción · Fantasía Oscura',
    capitulos: 175,
    rating: 9.6,
    badge: '🔥 Popular',
    imagen: '/img/Chainsawman-mangaport.jpg',
    descripcion: 'Denji es un joven atrapado en la pobreza extrema que lucha contra demonios para pagar las deudas de su difunto padre.',
  },
  {
    id: 2,
    titulo: 'Jujutsu Kaisen',
    genero: 'Acción · Sobrenatural',
    capitulos: 268,
    rating: 9.4,
    badge: 'TENDENCIA',
    imagen: '/img/juju-manga.jpg',
    descripcion: 'Yuji Itadori se traga un objeto maldito de clase especial y se une al Colegio Técnico de Magia Metropolitana de Tokio.',
  },
  {
    id: 3,
    titulo: 'Berserk',
    genero: 'Fantasía Oscura · Seinen',
    capitulos: 376,
    rating: 9.9,
    badge: 'LEYENDA',
    imagen: '/img/berserk-mangaport.jpg',
    descripcion: 'La trágica y violenta epopeya de Guts, el Espadachín Negro, en un mundo brutal plagado de monstruos y traición.',
  },
  {
    id: 4,
    titulo: 'Solo Leveling',
    genero: 'Manhwa · Acción RPG',
    capitulos: 200,
    rating: 9.5,
    badge: 'COLOREADO',
    imagen: '/img/solo-leveling-mangaport.jpg',
    descripcion: 'En un mundo donde portales conectan a monstruos, el cazador más débil Sung Jin-woo obtiene el poder secreto de subir de nivel sin límites.',
  },
  {
    id: 5,
    titulo: 'Spy x Family',
    genero: 'Comedia · Espías',
    capitulos: 102,
    rating: 9.2,
    badge: 'NUEVO',
    imagen: '/img/spyxfamily-mangaport.jpg',
    descripcion: 'Un espía de élite debe formar una familia falsa para cumplir su misión, sin saber que su esposa es una asesina y su hija una telépata.',
  },
  {
    id: 6,
    titulo: 'One Piece Manga',
    genero: 'Aventura · Shonen',
    capitulos: 1120,
    rating: 9.8,
    badge: '🔥 Top 1',
    imagen: '/img/onep-manga.jpg',
    descripcion: 'Luffy y su tripulación navegan por el Grand Line en busca del legendario tesoro One Piece para convertirse en el Rey de los Piratas.',
  },
];

export default function Manga() {
  const [animes, setAnimes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/animes')
      .then(res => {
        // Filter only anime
        setAnimes(res.data.filter(a => a.is_anime === true));
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <main className="manga-hub" style={{ paddingTop: '68px', minHeight: '100vh' }}>
        
        {/* ANIMES SECTION */}
        <section style={{ padding: '3rem 5% 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: "'Inter', sans-serif" }}>Animes Populares</h2>
            <Link to="/browse?tipo=Serie" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>Ver Todos <i className="fas fa-arrow-right"></i></Link>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ color: 'var(--accent)', fontSize: '2rem' }}></i>
            </div>
          ) : (
            <div className="anime-grid" style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem'
            }}>
              {animes.slice(0, 10).map(anime => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </div>
          )}
        </section>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '0 5%' }} />

        {/* MANGAS SECTION */}
        <section style={{ padding: '3rem 5% 4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontFamily: "'Inter', sans-serif" }}>Mangas Destacados</h2>
            <Link to="/browse?tipo=Manga" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 'bold' }}>Ver Todos <i className="fas fa-arrow-right"></i></Link>
          </div>
          
          <div className="manga-grid" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem'
          }}>
            {MANGA_CATALOG.map(manga => (
              <div key={manga.id} className="manga-card" style={{
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden',
                  border: '1px solid var(--border)', transition: 'var(--transition)',
                  display: 'flex', flexDirection: 'column'
                }}>
                  <div className="manga-cover" style={{ position: 'relative', paddingTop: '140%' }}>
                    <img src={manga.imagen} alt={manga.titulo} style={{
                      position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover'
                    }} />
                    {manga.badge && (
                      <span style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(0,0,0,0.7)',
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: '#fff'
                      }}>{manga.badge}</span>
                    )}
                  </div>
                  <div className="manga-info" style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{manga.titulo}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                      {manga.genero}
                    </p>
                    <div style={{ marginTop: 'auto' }}>
                      <Link to={`/manga/${manga.id}/leer`} style={{
                        display: 'block', width: '100%', textAlign: 'center', padding: '0.6rem',
                        background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                        textDecoration: 'none', borderRadius: 'var(--radius-sm)', transition: 'var(--transition)',
                        fontWeight: 'bold'
                      }}
                      onMouseOver={(e) => e.target.style.background = 'var(--accent)'}
                      onMouseOut={(e) => e.target.style.background = 'var(--bg-elevated)'}
                      >
                        <i className="fas fa-book-open"></i> Leer Manga
                      </Link>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </section>

        {/* Categories / Genres */}
        <section style={{ padding: '0 5% 4rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Explorar Géneros</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {['Shonen', 'Seinen', 'Shojo', 'Isekai', 'Mecha', 'Romance', 'Fantasía Oscura'].map(gen => (
              <div key={gen} style={{
                padding: '1rem 2rem', background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontWeight: 'bold',
                transition: 'var(--transition)'
              }} className="genre-pill">
                {gen}
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
