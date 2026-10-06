import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';

function isValidUsername(u) {
  return u && /^[a-zA-Z0-9_]+$/.test(u) && u.length >= 2 && u.length <= 30;
}

const AVATARS = [
  { id: 'fa-user-astronaut', name: 'Astronaut', rank: 'Cyber Rank S' },
  { id: 'fa-dragon', name: 'Dragon', rank: 'Otaku Elite' },
  { id: 'fa-film', name: 'Cinéfilo', rank: 'Director Pro' },
  { id: 'fa-crown', name: 'VIP', rank: 'Gold Pioneer' },
];
const INTERESTS = [
  { id: 'movies', name: 'Películas', icon: 'fa-film' },
  { id: 'series', name: 'Series', icon: 'fa-tv' },
  { id: 'anime', name: 'Anime', icon: 'fa-fire' },
  { id: 'manga', name: 'Manga', icon: 'fa-book-open' },
  { id: 'originals', name: 'MAX Originals', icon: 'fa-crown' },
  { id: 'docs', name: 'Documentales', icon: 'fa-earth-americas' },
];

export default function Login({ initialTab = 'login' }) {
  const [introStage, setIntroStage] = useState(initialTab === 'register' ? 0 : 2);
  const tab = initialTab;
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState(null); // null | 'expand'
  const [stepKey, setStepKey] = useState(0);
  const [fullscreenReady, setFullscreenReady] = useState(false); // controls step>=3 overlay visibility

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Login
  const [loginId, setLoginId] = useState('');
  const [loginPwd, setLoginPwd] = useState('');
  const [showLoginPwd, setShowLoginPwd] = useState(false);

  // Register
  const [regUser, setRegUser] = useState('');
  const [regPwd, setRegPwd] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPwd, setShowRegPwd] = useState(false);
  const [interests, setInterests] = useState([]);
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [cardFlipped, setCardFlipped] = useState(false);

  // Intro timing (register only)
  useEffect(() => {
    if (initialTab === 'register') {
      const t = setTimeout(() => setIntroStage(2), 2500);
      return () => clearTimeout(t);
    }
  }, [initialTab]);

  const toggleInterest = (id) =>
    setInterests((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ── Animated transition: form collapses → branding expands → new step slides in ──
  const transitionTo = useCallback((nextStep) => {
    setMessage(null);
    setPhase('expand'); // form collapses to right, branding expands

    setTimeout(() => {
      setStep(nextStep);
      setStepKey((k) => k + 1);
      setPhase(null); // branding shrinks back, form re-appears with new content
    }, 1200);
  }, []);

  // ── Step handlers ──
  const handleStep1 = () => {
    setMessage(null);
    if (!regUser || !regPwd) {
      setMessage({ type: 'error', text: 'Completa todos los campos.' }); return;
    }
    if (!isValidUsername(regUser)) {
      setMessage({ type: 'error', text: 'Usuario inválido (2-30 caracteres, sin espacios).' }); return;
    }
    if (regPwd.length < 3) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 3 caracteres.' }); return;
    }
    transitionTo(2);
  };

  const handleStep2 = () => {
    if (interests.length === 0) {
      setMessage({ type: 'error', text: 'Selecciona al menos un interés.' }); return;
    }
    setMessage(null);
    // Phase 1: slide the form panel out to the right
    setPhase('expand');
    // Phase 2: form is gone, now fade out the logo
    setTimeout(() => {
      setPhase('expand fade-logo');
      // Phase 3: logo is gone, mount step 3
      setTimeout(() => {
        setStep(3);
        setFullscreenReady(true);
      }, 700);
    }, 1100);
  };

  const handleStep3 = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        username: regUser, password: regPwd,
        avatar: avatar.id, rango: avatar.rank, intereses: interests,
      });
      login(res.data.usuario, res.data.token);
      setStep(4); // triggers fullscreen card reveal
      setFullscreenReady(true);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al crear la cuenta' });
    } finally { setLoading(false); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!loginId || !loginPwd) {
      setMessage({ type: 'error', text: 'Completa todos los campos.' }); return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: loginId, password: loginPwd });
      login(res.data.usuario, res.data.token);
      navigate('/');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al iniciar sesión' });
    } finally { setLoading(false); }
  };

  // ═══════════════════════════════════════
  //  RENDER: INTRO
  // ═══════════════════════════════════════
  if (introStage === 0) {
    return (
      <div className="intro-sequence">
        <p className="intro-text">Bienvenido.</p>
      </div>
    );
  }

  // ═══════════════════════════════════════
  //  RENDER: SPLIT LAYOUT + CARD OVERLAY
  // ═══════════════════════════════════════
  const brandingText = () => {
    if (tab === 'login') return <p style={{ marginTop: '1.2rem' }}>La experiencia definitiva.</p>;
    if (step === 1) return <p style={{ marginTop: '1.2rem' }}>Únete a la plataforma.</p>;
    if (step === 2) return (
      <>
        <p style={{ marginTop: '0.8rem', fontSize: '0.75rem', color: '#444', letterSpacing: '0.1em' }}>PASO 2 DE 3</p>
        <p style={{ marginTop: '0.3rem', color: '#666' }}>Cuéntanos qué te apasiona.</p>
      </>
    );
    return null;
  };

  const isReversed = step === 2; // Step 2 puts the form on the left

  return (
    <>
      <div className={`login-split-page ${phase && phase.includes('expand') ? 'phase-expand' : ''} ${phase && phase.includes('fade-logo') ? 'fade-logo' : ''} ${isReversed ? 'reversed' : ''}`}>
        {/* ── LEFT/RIGHT: BRANDING ── */}
        <div className="login-branding">
          <div className="login-branding-content">
            <Link to="/" style={{ textDecoration: 'none' }}>
              <h1>STREAM<span>MAX</span></h1>
            </Link>
            {brandingText()}
          </div>
        </div>

        {/* ── RIGHT/LEFT: FORM ── */}
        <div className="login-form-side">
          <div className="login-box" key={stepKey}>

          {message && (
            <div className={`form-message ${message.type}`}>
              <i className={message.type === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'}></i>
              <span>{message.text}</span>
            </div>
          )}

          {/* ──── LOGIN ──── */}
          {tab === 'login' && (
            <div className="step-slide-in">
              <div className="login-header">
                <h2>Iniciar Sesión</h2>
                <p>Ingresa tus datos para continuar</p>
              </div>
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <label className="input-label">Usuario o Correo</label>
                  <div className="input-wrapper">
                    <i className="fas fa-user"></i>
                    <input type="text" placeholder="tu_usuario" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Contraseña</label>
                  <div className="input-wrapper">
                    <i className="fas fa-lock"></i>
                    <input type={showLoginPwd ? 'text' : 'password'} placeholder="••••••••" value={loginPwd} onChange={(e) => setLoginPwd(e.target.value)} />
                    <button type="button" className="toggle-password" onClick={() => setShowLoginPwd(!showLoginPwd)}>
                      <i className={showLoginPwd ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'Entrando...' : 'Entrar'} {!loading && <i className="fas fa-arrow-right"></i>}
                </button>
              </form>
              <p style={{ marginTop: '2rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                ¿No tienes cuenta?{' '}
                <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Crear cuenta</Link>
              </p>
            </div>
          )}

          {/* ──── REGISTER STEP 1: ACCOUNT ──── */}
          {tab === 'register' && step === 1 && (
            <div className="step-slide-in">
              <p className="step-eyebrow">Crear cuenta</p>
              <div className="login-header">
                <h2>Elige tu usuario</h2>
                <p>Solo necesitas un usuario y contraseña.</p>
              </div>
              <div className="input-group">
                <label className="input-label">Usuario único</label>
                <div className="input-wrapper">
                  <i className="fas fa-at"></i>
                  <input type="text" placeholder="Ej: PlayerOne" value={regUser} onChange={(e) => setRegUser(e.target.value)} />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="input-wrapper">
                  <i className="fas fa-lock"></i>
                  <input type={showRegPwd ? 'text' : 'password'} placeholder="Mínimo 3 caracteres" value={regPwd} onChange={(e) => setRegPwd(e.target.value)} />
                  <button type="button" className="toggle-password" onClick={() => setShowRegPwd(!showRegPwd)}>
                    <i className={showRegPwd ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>
              <button type="button" className="login-submit" onClick={handleStep1}>
                Continuar <i className="fas fa-arrow-right"></i>
              </button>
              <p style={{ marginTop: '1.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
              </p>
            </div>
          )}

          {/* ──── REGISTER STEP 2: VIBE ──── */}
          {tab === 'register' && step === 2 && (
            <div className="step-slide-in">
              <p className="step-eyebrow">Tu perfil</p>
              <div className="login-header">
                <h2>¿Qué disfrutas?</h2>
                <p>Selecciona los contenidos que más te apasionan.</p>
              </div>
              <div className="interests-grid">
                {INTERESTS.map((item) => (
                  <div key={item.id} className={`interest-card ${interests.includes(item.id) ? 'selected' : ''}`} onClick={() => toggleInterest(item.id)}>
                    <i className={`fas ${item.icon}`}></i>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="login-submit" onClick={handleStep2}>
                Continuar <i className="fas fa-arrow-right"></i>
              </button>
              <button className="btn-link" style={{ marginTop: '0.8rem', width: '100%', justifyContent: 'center' }} onClick={() => transitionTo(1)}>
                <i className="fas fa-arrow-left"></i> Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ═══════════════════════════════════════
        RENDER: FULLSCREEN OVERLAYS (Step 3 & 4)
        ═══════════════════════════════════════ */}
    {step >= 3 && tab === 'register' && fullscreenReady && (
      <div className="card-fullscreen">
        
        {/* ──── STEP 3: AVATAR FULLSCREEN ──── */}
        {step === 3 && (
          <div className="card-fullscreen-inner" key="step3-avatar">
            <p className="step-eyebrow" style={{ textAlign: 'center' }}>Tu identidad</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: '0.3rem' }}>
              Elige tu avatar
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.95rem', marginBottom: '2.5rem' }}>
              Aparecerá en tu carnet de socio VIP.
            </p>

            <div className="avatar-grid" style={{ maxWidth: '440px', margin: '0 auto 2rem' }}>
              {AVATARS.map((av) => (
                <div key={av.id} className={`avatar-option ${avatar.id === av.id ? 'selected' : ''}`} onClick={() => setAvatar(av)}>
                  <i className={`fas ${av.id}`}></i>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '1rem 1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 auto 2rem', maxWidth: '440px'
            }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rango asignado</p>
                <p style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem', marginTop: '4px' }}>{avatar.rank}</p>
              </div>
              <i className={`fas ${avatar.id}`} style={{ fontSize: '2.2rem', color: 'var(--text-muted)' }}></i>
            </div>

            <div style={{ maxWidth: '440px', margin: '0 auto' }}>
              <button type="button" className="login-submit" onClick={handleStep3} disabled={loading}>
                {loading ? 'Generando carnet...' : <><span>Generar Carnet VIP</span> <i className="fas fa-id-card"></i></>}
              </button>
              <button className="btn-link" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }} onClick={() => {
                setStep(2);
                setPhase(null);
              }}>
                <i className="fas fa-arrow-left"></i> Volver
              </button>
            </div>
          </div>
        )}

        {/* ──── STEP 4: VIP CARD FULLSCREEN ──── */}
        {step === 4 && (
          <div className="card-fullscreen-inner" key="step4-vip">
            <p className="step-eyebrow" style={{ textAlign: 'center' }}>Listo</p>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: '0.2rem' }}>
              Bienvenido, {regUser}
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.88rem', marginBottom: '2rem' }}>
              Tu carnet de socio VIP está listo. Toca para girarlo.
            </p>

            <div className="vip-card-perspective">
              <div className={`vip-card-3d ${cardFlipped ? 'flipped' : ''}`} onClick={() => setCardFlipped(!cardFlipped)}>
                <div className="vip-card-face vip-card-front">
                  <div className="card-header-line">
                    <div className="card-brand">STREAM<span>MAX</span></div>
                    <div className="card-chip"></div>
                  </div>
                  <div className="card-user-info">
                    <div className="card-avatar-circle"><i className={`fas ${avatar.id}`}></i></div>
                    <div className="card-details">
                      <h4>{regUser}</h4>
                      <p>{avatar.rank}</p>
                    </div>
                  </div>
                  <div className="card-footer-line">
                    <div className="card-number">SOCIO #{new Date().getFullYear()}</div>
                    <span className="card-badge-vip">VIP PASS</span>
                  </div>
                </div>
                <div className="vip-card-face vip-card-back">
                  <div className="card-header-line">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ACCESO DIGITAL</span>
                    <i className="fas fa-qrcode" style={{ fontSize: '1.6rem', color: 'var(--accent)' }}></i>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Películas · Series · Anime · Manga<br />Acceso ilimitado en 4K.
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <span>ESTADO: ACTIVO</span>
                    <span>EXP: {new Date().getFullYear() + 1}</span>
                  </div>
                </div>
              </div>
            </div>

            <button className="login-submit card-enter-btn" onClick={() => navigate('/')}>
              Entrar a STREAMMAX <i className="fas fa-arrow-right"></i>
            </button>
          </div>
        )}
      </div>
    )}
    </>
  );
}
