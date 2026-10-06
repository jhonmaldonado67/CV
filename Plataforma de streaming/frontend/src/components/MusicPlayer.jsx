import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { SONGS, ALBUMS } from '../data/musicData';

const MusicPlayerContext = createContext();

export const useMusicPlayer = () => useContext(MusicPlayerContext);

export const MusicPlayerProvider = ({ children }) => {
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);

  const playSong = (song) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const nextSong = () => {
    if (queue.length > 0 && currentSong) {
      const idx = queue.findIndex(s => s.id === currentSong.id);
      if (idx !== -1 && idx < queue.length - 1) {
        setCurrentSong(queue[idx + 1]);
        setIsPlaying(true);
      } else if (idx === queue.length - 1) {
        // Stop or loop? Let's just stop or go to start. We'll just stop
        setIsPlaying(false);
      }
    }
  };

  const prevSong = () => {
    if (queue.length > 0 && currentSong) {
      const idx = queue.findIndex(s => s.id === currentSong.id);
      if (idx > 0) {
        setCurrentSong(queue[idx - 1]);
        setIsPlaying(true);
      }
    }
  };

  return (
    <MusicPlayerContext.Provider value={{ currentSong, isPlaying, queue, setQueue, playSong, togglePlay, nextSong, prevSong }}>
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const MusicPlayer = () => {
  const { currentSong, isPlaying, togglePlay, nextSong, prevSong } = useMusicPlayer();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  // Sync play/pause with audio element
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.log('Audio play error:', err));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentSong]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const seekTime = (e.nativeEvent.offsetX / e.currentTarget.offsetWidth) * duration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const [volume, setVolume] = useState(0.8);

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  if (!currentSong) return null;

  const currentAlbum = ALBUMS.find(a => a.title === currentSong.album);
  const coverImage = currentAlbum?.cover || currentSong.image;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, height: '80px',
      background: 'rgba(10, 11, 16, 0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)', zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 2rem', color: '#fff'
    }}>
      {/* Left: Track Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '30%', minWidth: '200px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '4px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {coverImage ? (
            <img src={coverImage} alt="cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <i className="fas fa-music" style={{ color: 'var(--accent)' }}></i>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentSong.title}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{currentSong.artist}</div>
        </div>
        <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginLeft: '0.5rem' }}>
          <i className="far fa-heart"></i>
        </button>
      </div>
      
      {/* Center: Player Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '40%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '8px' }}>
          <button onClick={prevSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-step-backward"></i></button>
          <button onClick={togglePlay} style={{ 
            width: '36px', height: '36px', borderRadius: '50%', background: '#fff', color: '#000', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
            transition: 'transform 0.1s'
          }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} style={{ marginLeft: isPlaying ? '0' : '3px' }}></i>
          </button>
          <button onClick={nextSong} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}><i className="fas fa-step-forward"></i></button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span>{Math.floor(currentTime / 60)}:{(Math.floor(currentTime) % 60).toString().padStart(2, '0')}</span>
          <div onClick={handleSeek} style={{ 
            flex: 1, height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer',
            position: 'relative', display: 'flex', alignItems: 'center'
          }}>
            <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', background: '#fff', borderRadius: '2px', position: 'relative' }}>
              <div style={{ position: 'absolute', right: '-4px', top: '-4px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' }} className="progress-knob"></div>
            </div>
          </div>
          <span>{duration ? `${Math.floor(duration / 60)}:${(Math.floor(duration) % 60).toString().padStart(2, '0')}` : '0:00'}</span>
        </div>
      </div>

      {/* Right: Volume & Extra */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '1rem', width: '30%', minWidth: '200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
          <i className={volume === 0 ? "fas fa-volume-mute" : (volume < 0.5 ? "fas fa-volume-down" : "fas fa-volume-up")} style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
          <input 
            type="range" 
            min="0" max="1" step="0.05" 
            value={volume} 
            onChange={handleVolumeChange}
            style={{ width: '80px', accentColor: '#fff', cursor: 'pointer', height: '4px' }}
          />
        </div>
      </div>

      <audio 
        ref={audioRef} 
        src={currentSong.src} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={nextSong}
      />
    </div>
  );
};
