import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ALBUMS, SONGS, ARTISTS } from '../data/musicData';
import { useMusicPlayer } from '../components/MusicPlayer';

export default function Album() {
  const { id } = useParams();
  const navigate = useNavigate();
  const album = ALBUMS ? ALBUMS.find(a => a.id === parseInt(id) || a.id === id) : null;
  const artist = album && ARTISTS ? ARTISTS.find(a => a.name === album.artist) : null;
  const { playSong, currentSong, setQueue } = useMusicPlayer();

  const albumSongs = album && SONGS ? SONGS.filter(song => album.songIds.includes(song.id)) : [];

  useEffect(() => {
    if (albumSongs.length > 0 && setQueue) {
      setQueue(albumSongs);
    }
  }, [album, setQueue]);

  if (!album) {
    return (
      <div className="music-hub" style={{ minHeight: '100vh', paddingTop: '68px' }}>
        <Navbar />
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>Álbum no encontrado</div>
        <Footer />
      </div>
    );
  }

  const handlePlayAlbum = () => {
    if (albumSongs.length > 0) {
      playSong(albumSongs[0]);
    }
  };

  return (
    <div className="music-hub" style={{ minHeight: '100vh', paddingTop: '68px', backgroundColor: 'var(--bg-void)' }}>
      <Navbar />
      
      <header style={{ 
        padding: '3rem 5%', 
        background: `linear-gradient(to bottom, ${album.color || 'var(--accent)'}40, var(--bg-void))`,
        display: 'flex', alignItems: 'flex-end', gap: '2rem'
      }}>
        <div style={{ 
          width: '230px', height: '230px', backgroundColor: '#222', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '8px', flexShrink: 0 
        }}>
          {artist && artist.image && (
             <img src={artist.image} alt={album.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
          )}
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Álbum</span>
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 900, margin: '0.5rem 0', letterSpacing: '-1.5px', lineHeight: 1 }}>
            {album.title}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {artist && artist.image && (
              <img src={artist.image} alt={artist.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
            )}
            <span style={{ fontWeight: 700, color: '#fff', cursor: 'pointer' }} onClick={() => artist && navigate(`/music/artist/${artist.id}`)}>
              {album.artist}
            </span>
            <span>•</span>
            <span>{album.year}</span>
            <span>•</span>
            <span>{albumSongs.length} canciones</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '2rem 5%' }}>
        <button 
          onClick={handlePlayAlbum}
          style={{
            width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent)',
            border: 'none', color: '#000', fontSize: '1.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem',
            transition: 'transform 0.2s', boxShadow: '0 8px 16px rgba(0,0,0,0.3)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="fas fa-play"></i>
        </button>

        <div className="song-list">
          <div style={{ display: 'flex', padding: '0 1rem 0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ width: '40px' }}>#</div>
            <div style={{ flex: 1 }}>Título</div>
            <div style={{ width: '50px', textAlign: 'right' }}><i className="far fa-clock"></i></div>
          </div>
          
          {albumSongs.map((song, index) => (
            <div 
              key={song.id} 
              className={`song-row ${currentSong?.id === song.id ? 'active' : ''}`} 
              onClick={() => playSong(song)}
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
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, color: currentSong?.id === song.id ? 'var(--accent)' : '#fff', marginBottom: '2px' }}>{song.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{song.artist}</div>
              </div>
              <div style={{ width: '50px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {song.duration || '3:00'}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
