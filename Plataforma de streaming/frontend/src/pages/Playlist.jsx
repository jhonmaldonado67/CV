import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PLAYLISTS, SONGS } from '../data/musicData';
import { useMusicPlayer } from '../components/MusicPlayer';

const Playlist = () => {
  const { id } = useParams();
  const playlist = PLAYLISTS ? PLAYLISTS.find(p => p.id === parseInt(id) || p.id === id) : null;
  const { playSong, currentSong, setQueue } = useMusicPlayer();

  const playlistSongs = playlist && SONGS ? SONGS.filter(song => playlist.songIds.includes(song.id)) : [];

  useEffect(() => {
    if (playlistSongs.length > 0 && setQueue) {
      setQueue(playlistSongs);
    }
  }, [playlist, setQueue]);

  if (!playlist) {
    return (
      <div className="music-hub" style={{ minHeight: '100vh', paddingTop: '68px' }}>
        <Navbar />
        <div style={{ padding: '40px', color: '#fff', textAlign: 'center' }}>Playlist no encontrada</div>
        <Footer />
      </div>
    );
  }

  const handlePlayPlaylist = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0]);
    }
  };

  return (
    <div className="music-hub" style={{ minHeight: '100vh', paddingTop: '68px', backgroundColor: 'var(--bg-void)' }}>
      <Navbar />
      
      <header style={{ 
        padding: '3rem 5%', 
        background: `linear-gradient(to bottom, ${playlist.color || 'var(--accent)'}40, var(--bg-void))`,
        display: 'flex', alignItems: 'flex-end', gap: '2rem'
      }}>
        <div style={{ 
          width: '230px', height: '230px', backgroundColor: playlist.color || '#222', 
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)', borderRadius: '8px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <i className="fas fa-music" style={{ fontSize: '5rem', color: 'rgba(255,255,255,0.2)' }}></i>
        </div>
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase' }}>Playlist Pública</span>
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 900, margin: '0.5rem 0', letterSpacing: '-1.5px', lineHeight: 1 }}>
            {playlist.name}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', marginBottom: '1rem', maxWidth: '600px' }}>
            {playlist.description}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 700, color: '#fff' }}>STREAMMAX</span>
            <span>•</span>
            <span>{playlistSongs.length} canciones</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '2rem 5%' }}>
        <button 
          onClick={handlePlayPlaylist}
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
          
          {playlistSongs.map((song, index) => (
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
};

export default Playlist;
