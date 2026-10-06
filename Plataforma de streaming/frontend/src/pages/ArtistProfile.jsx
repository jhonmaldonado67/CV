import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ARTISTS, SONGS, ALBUMS } from '../data/musicData';
import { useMusicPlayer } from '../components/MusicPlayer';

export default function ArtistProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const artist = ARTISTS ? ARTISTS.find(a => a.id === parseInt(id) || a.id === id) : null;
  const { playSong, currentSong, setQueue } = useMusicPlayer();

  const artistSongs = artist && SONGS ? SONGS.filter(song => song.artist === artist.name) : [];
  const artistAlbums = artist && ALBUMS ? ALBUMS.filter(album => album.artist === artist.name) : [];

  if (!artist) {
    return (
      <div className="music-hub" style={{ minHeight: '100vh', paddingTop: '68px' }}>
        <Navbar />
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>Artista no encontrado</div>
        <Footer />
      </div>
    );
  }

  const handlePlayAll = () => {
    if (artistSongs.length > 0) {
      if (setQueue) setQueue(artistSongs);
      playSong(artistSongs[0]);
    }
  };

  return (
    <div className="music-hub" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-void)' }}>
      <Navbar />
      
      {/* Spotify-like Banner */}
      <header style={{ 
        position: 'relative', height: '400px', display: 'flex', alignItems: 'flex-end', padding: '3rem 5%',
        marginTop: '68px' // Below navbar
      }}>
        {/* Background Blur */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: `url(${artist.banner || artist.image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(10px) brightness(0.3)',
          zIndex: 0
        }}></div>
        
        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-end', gap: '2rem' }}>
          <div style={{ width: '230px', height: '230px', borderRadius: '50%', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', border: '4px solid rgba(255,255,255,0.1)' }}>
            <img src={artist.image} alt={artist.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
              <i className="fas fa-check-circle" style={{ color: '#3b82f6' }}></i>
              <span>Artista verificado • {artist.genre}</span>
            </div>
            <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', fontWeight: 900, margin: '0', letterSpacing: '-2px', color: '#fff', lineHeight: 1 }}>
              {artist.name}
            </h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '1rem', marginBottom: '1rem' }}>
              {artist.followers} oyentes mensuales
            </div>
            {artist.bio && (
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', lineHeight: '1.6', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {artist.bio}
              </p>
            )}
          </div>
        </div>
      </header>

      <div style={{ 
        padding: '2rem 5%', position: 'relative', zIndex: 2, 
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, var(--bg-void) 300px)',
        minHeight: '600px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <button 
              onClick={handlePlayAll}
              style={{
                width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--accent)',
                border: 'none', color: '#000', fontSize: '1.8rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'transform 0.2s', boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className="fas fa-play" style={{ marginLeft: '4px' }}></i>
            </button>
            <button style={{
              padding: '8px 24px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.3)',
              background: 'transparent', color: '#fff', fontSize: '0.9rem', fontWeight: 'bold',
              cursor: 'pointer', transition: 'border-color 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.borderColor = '#fff'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'}>
              Seguir
            </button>
          </div>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fff' }}>Populares</h2>
            <div className="song-list" style={{ maxWidth: '800px' }}>
              {artistSongs.slice(0, 5).map((song, index) => (
                <div 
                  key={song.id} 
                  className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} 
                  onClick={() => {
                    if (setQueue) setQueue(artistSongs);
                    playSong(song);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', borderRadius: '8px',
                    cursor: 'pointer', transition: 'background 0.2s',
                    backgroundColor: currentSong?.id === song.id ? 'rgba(255,255,255,0.1)' : 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = currentSong?.id === song.id ? 'rgba(255,255,255,0.1)' : 'transparent'}
                >
                  <div style={{ width: '40px', color: currentSong?.id === song.id ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {currentSong?.id === song.id ? <i className="fas fa-volume-up"></i> : index + 1}
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img src={artist.image} style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} alt="" />
                    <div style={{ fontWeight: 500, color: currentSong?.id === song.id ? 'var(--accent)' : '#fff' }}>{song.title}</div>
                  </div>
                  <div style={{ width: '50px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    {song.duration || '3:00'}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {artistAlbums.length > 0 && (
            <section style={{ paddingBottom: '80px' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff' }}>Discografía</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.5rem' }}>
                {artistAlbums.map((album) => (
                  <div 
                    key={album.id} 
                    onClick={() => navigate(`/music/album/${album.id}`)}
                    style={{ 
                      background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', cursor: 'pointer',
                      transition: 'background 0.3s', display: 'flex', flexDirection: 'column'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-card)'}
                  >
                    <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#333', borderRadius: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
                      <img src={album.cover || artist.image} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <h3 style={{ fontSize: '1rem', color: '#fff', margin: '0 0 0.2rem 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{album.year} • Álbum</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
