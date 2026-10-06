import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';
import { useSection } from '../contexts/SectionContext';
import PlanModal from './PlanModal';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const { section, setSection } = useSection();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  const handleSurpriseMe = async () => {
    setIsRolling(true);
    try {
      const res = await api.get('/animes/random');
      if (res.data && res.data.id) {
        navigate(`/anime/${res.data.id}`);
      }
    } catch (err) {
      console.error('Error al obtener aleatorio', err);
    } finally {
      setIsRolling(false);
    }
  };

  return (
    <header>
      <nav className={`navbar${scrolled ? ' scrolled' : ''}`} id="navbar">
        <Link to="/" className="logo" onClick={closeMenu}>
          <h1>STREAM<span>MAX</span></h1>
          <span className="logo-badge">ULTRA</span>
        </Link>
        <div className={`nav-menu section-tabs ${menuOpen ? 'active' : ''}`} id="navMenu">
          <Link to="/" className={`section-tab ${section === 'streaming' ? 'active' : ''}`} onClick={() => { setSection('streaming'); closeMenu(); }}>
            <i className="fas fa-film"></i> Streaming
          </Link>
          <Link to="/manga" className={`section-tab ${section === 'anime' ? 'active' : ''}`} onClick={() => { setSection('anime'); closeMenu(); }}>
            <i className="fas fa-bolt"></i> Anime
          </Link>
          <Link to="/music" className={`section-tab ${section === 'music' ? 'active' : ''}`} onClick={() => { setSection('music'); closeMenu(); }}>
            <i className="fas fa-music"></i> Música
          </Link>
        </div>
        <div className="nav-search">
          <Link to="/browse" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none' }}>
            <i className="fas fa-search"></i>
            <span>Buscar títulos...</span>
          </Link>
        </div>
        <div className="nav-actions">
          <button 
            onClick={handleSurpriseMe} 
            disabled={isRolling}
            title="¡Sorpréndeme!"
            style={{ 
              background: 'none', border: 'none', color: isRolling ? 'var(--accent)' : '#fff', 
              fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
              transition: 'transform 0.5s'
            }}
          >
            <i className={`fas fa-dice ${isRolling ? 'fa-spin' : ''}`}></i>
          </button>
          
          {usuario ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Link to="/favorites" className="btn-login" style={{ background: 'none', border: 'none' }}>
                <i className="fas fa-heart" style={{ color: 'var(--magenta-neon)' }}></i>
              </Link>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  <i className="fas fa-user-circle" style={{ marginRight: 6, color: 'var(--cyan-neon)' }}></i>
                  {usuario.username}
                </span>
              </Link>
              <button onClick={logout} className="btn-login" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-login">Iniciar Sesión</Link>
              <Link to="/register" className="btn-premium" style={{ textDecoration: 'none' }}>
                <i className="fas fa-user-plus" style={{ fontSize: '0.8rem', marginRight: 6 }}></i>
                Crear Cuenta
              </Link>
            </>
          )}
        </div>
        <button
          className={`hamburger${menuOpen ? ' active' : ''}`}
          id="hamburger"
          aria-label="Menú"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </nav>

      {planModalOpen && <PlanModal onClose={() => setPlanModalOpen(false)} />}
    </header>
  );
}
