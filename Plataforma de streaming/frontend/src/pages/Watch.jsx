import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Watch() {
  const { id, ep } = useParams();
  const navigate = useNavigate();
  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  
  let controlsTimeout = useRef(null);

  useEffect(() => {
    api.get(`/animes/${id}`)
      .then(res => {
        setMedia(res.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(controlsTimeout.current);
      controlsTimeout.current = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTime = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      setProgress((current / duration) * 100);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ color: 'var(--accent)', fontSize: '3rem' }}></i>
      </div>
    );
  }

  if (!media) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        <h2>Video no encontrado</h2>
        <button onClick={() => navigate(-1)} style={{ marginTop: '1rem', padding: '0.8rem 2rem', background: 'var(--accent)', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#fff' }}>Volver</button>
      </div>
    );
  }

  // Support local videos - use video_local from DB, fallback to name-based detection
  let videoSrc = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  
  if (media.video_local) {
    videoSrc = media.video_local;
  } else if (media.titulo && media.titulo.toLowerCase().includes('jujutsu kaisen')) {
    videoSrc = "/videos/jujutsu-kaisen/1.mp4";
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000', position: 'fixed', top: 0, left: 0, zIndex: 99999, overflow: 'hidden' }}>
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoSrc}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onTimeUpdate={handleTimeUpdate}
        onClick={togglePlay}
        autoPlay
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      ></video>

      {/* Back Button */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, padding: '2rem', 
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)',
        opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease',
        display: 'flex', alignItems: 'center', gap: '1rem'
      }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
        >
          <i className="fas fa-arrow-left"></i>
        </button>
        <h2 style={{ color: '#fff', fontSize: '1.2rem', margin: 0 }}>
          {media.titulo} <span style={{ opacity: 0.7, fontSize: '0.9rem', marginLeft: '0.5rem' }}>Episodio {ep}</span>
        </h2>
      </div>

      {/* Custom Controls */}
      <div style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
        opacity: showControls ? 1 : 0, transition: 'opacity 0.3s ease',
      }}>
        <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '2px', cursor: 'pointer', marginBottom: '1rem' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent)', borderRadius: '2px', position: 'relative' }}>
            <div style={{ position: 'absolute', right: '-6px', top: '-4px', width: '12px', height: '12px', background: '#fff', borderRadius: '50%' }}></div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={togglePlay} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
            </button>
            <button onClick={() => skipTime(-10)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} title="Retroceder 10s">
              <i className="fas fa-undo"></i>
            </button>
            <button onClick={() => skipTime(10)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} title="Adelantar 10s">
              <i className="fas fa-redo"></i>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <i className={volume === 0 ? "fas fa-volume-mute" : "fas fa-volume-up"} style={{ fontSize: '1.2rem' }}></i>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                value={volume}
                onChange={handleVolumeChange}
                style={{ width: '80px', cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>
              <i className="fas fa-step-forward"></i>
            </button>
            <button style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                document.documentElement.requestFullscreen();
              }
            }}>
              <i className="fas fa-expand"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
