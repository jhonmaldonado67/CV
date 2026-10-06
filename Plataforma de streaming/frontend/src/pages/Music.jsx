import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PLAYLISTS, ALBUMS, ARTISTS } from '../data/musicData';
import { useMusicPlayer } from '../components/MusicPlayer';

const Music = () => {
  const navigate = useNavigate();

  return (
    <div className="music-hub">
      <Navbar />
      <div className="music-hero" style={{ 
        padding: '80px 40px', 
        background: 'url("https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1600&q=80") center/cover',
        position: 'relative',
        border: 'none'
      }}>
        {/* Dark overlay that fades to the background color at the bottom */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(10,11,16,0.95) 0%, rgba(10,11,16,0.6) 100%)' }}></div>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(10,11,16,1) 100%)' }}></div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: '800', margin: '0 0 10px 0', letterSpacing: '-1px' }}>Descubre tu sonido</h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', margin: 0, maxWidth: '500px' }}>Tu música favorita en calidad ultra, sin interrupciones. Explora los últimos éxitos y déjate llevar.</p>
        </div>
      </div>

      <section style={{ padding: '20px' }}>
        <h2>Playlists para ti</h2>
        <div className="playlist-grid">
          {PLAYLISTS && PLAYLISTS.map((playlist) => (
            <div key={playlist.id} className="playlist-card" onClick={() => navigate(`/music/playlist/${playlist.id}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div className="cover" style={{ 
                background: `linear-gradient(135deg, ${playlist.color || '#333'} 0%, #111 100%)`, 
                height: '150px', borderRadius: '8px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <i className="fas fa-music" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)' }}></i>
              </div>
              <h3 style={{ margin: '0 0 5px 0' }}>{playlist.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{playlist.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '20px' }}>
        <h2>Álbumes recientes</h2>
        <div className="playlist-grid">
          {ALBUMS && ALBUMS.map((album) => (
            <div key={album.id} className="playlist-card" onClick={() => navigate(`/music/album/${album.id}`)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <div className="cover" style={{ backgroundColor: '#333', height: '150px', borderRadius: '8px', marginBottom: '10px', overflow: 'hidden' }}>
                <img src={album.cover || '/img/placeholder.jpg'} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ margin: '0 0 5px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{album.artist}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '20px' }}>
        <h2>Artistas destacados</h2>
        <div className="artists-row" style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 0' }}>
          {ARTISTS && ARTISTS.map((artist) => (
            <div key={artist.id} className="artist-circle" onClick={() => navigate(`/music/artist/${artist.id}`)} style={{ textAlign: 'center', minWidth: '120px', cursor: 'pointer' }}>
              <img src={artist.image} alt={artist.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto', display: 'block', backgroundColor: '#444' }} />
              <h3 style={{ marginTop: '10px', fontSize: '1rem' }}>{artist.name}</h3>
            </div>
          ))}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Music;
