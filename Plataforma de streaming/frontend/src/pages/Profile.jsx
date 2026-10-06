import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api, { getContinueWatching } from '../api';
import { useAuth } from '../App';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PlanModal from '../components/PlanModal';
import VipCard from '../components/VipCard';

export default function Profile() {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [continueWatching, setContinueWatching] = useState([]);
  const [stats, setStats] = useState({ vistos: 0, favoritos: 0, horas: 0 });
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getContinueWatching();
        setContinueWatching(res.data);

        const horas = res.data.reduce((acc, a) => acc + (a.episodio * 24), 0);
        setStats({
          vistos: res.data.length,
          favoritos: 0,
          horas: horas,
        });
      } catch {}
      finally { setLoading(false); }
    };

    fetchData();
  }, [usuario, navigate]);

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const res = await api.post('/stripe/create-portal-session');
      window.location.href = res.data.url;
    } catch {
      setPlanModalOpen(true);
    } finally {
      setPortalLoading(false);
    }
  };

  const handleSimularPago = async () => {
    try {
      // Small easter egg to update DB and local state
      await api.post('/auth/upgrade-plan', { plan: 'Ultra' });
      window.location.reload(); // Reload to refresh auth context and data
    } catch (err) {
      console.error(err);
      alert('Error simulando pago. Asegúrate de tener el endpoint creado.');
    }
  };

  if (!usuario) return null;

  return (
    <>
      <Navbar />
      <main className="profile-page" style={{ paddingTop: '68px', minHeight: '100vh' }}>
        <div className="profile-header" style={{
          background: 'linear-gradient(to bottom, var(--bg-deep), var(--bg-void))',
          padding: '4rem 5%',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <div className="profile-avatar" style={{
                width: '120px', height: '120px', borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '3rem', color: 'white', fontWeight: '700',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
              }}>
                {usuario.username?.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '-1px' }}>
                  {usuario.username}
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.8rem', fontSize: '1.1rem' }}>{usuario.email}</p>
                <button
                  onClick={() => setPlanModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: usuario.plan !== 'Free' ? 'var(--accent-dim)' : 'rgba(255,255,255,0.1)',
                    color: usuario.plan !== 'Free' ? 'var(--accent)' : '#fff',
                    padding: '6px 16px',
                    borderRadius: '50px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    border: usuario.plan !== 'Free' ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <i className="fas fa-crown"></i>
                  Plan {usuario.plan || 'Free'} — Cambiar
                </button>
                {usuario.plan === 'Free' && (
                  <button
                    onClick={handleSimularPago}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #00d4aa, #7c3aed)',
                      color: '#fff',
                      padding: '6px 16px',
                      borderRadius: '50px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: 'none',
                      cursor: 'pointer',
                      marginLeft: '10px'
                    }}
                  >
                    <i className="fas fa-magic"></i> Simular Pago (Ultra)
                  </button>
                )}
              </div>
            </div>

            {/* VIP Card Generator */}
            <div style={{ flexShrink: 0 }}>
              {usuario.plan !== 'Free' ? (
                <VipCard user={usuario} />
              ) : (
                <div style={{ 
                  background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', 
                  padding: '2rem', borderRadius: '16px', textAlign: 'center', width: '340px'
                }}>
                  <i className="fas fa-star" style={{ fontSize: '2rem', color: '#fbbf24', marginBottom: '1rem' }}></i>
                  <h3 style={{ margin: '0 0 0.5rem 0' }}>Conviértete en VIP</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Desbloquea tu tarjeta de membresía holográfica exclusiva.</p>
                  <button onClick={() => setPlanModalOpen(true)} style={{ background: '#fbbf24', color: '#000', border: 'none', padding: '8px 16px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>Mejorar Plan</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="profile-stats" style={{ padding: '2rem 5%', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
            <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fas fa-play-circle" style={{ fontSize: '1.5rem', color: 'var(--accent)', marginBottom: '0.5rem' }}></i>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.vistos}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>En progreso</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fas fa-heart" style={{ fontSize: '1.5rem', color: '#ef4444', marginBottom: '0.5rem' }}></i>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.favoritos}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Favoritos</div>
            </div>
            <div className="stat-card" style={{ textAlign: 'center', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
              <i className="fas fa-clock" style={{ fontSize: '1.5rem', color: 'var(--purple)', marginBottom: '0.5rem' }}></i>
              <div style={{ fontSize: '2rem', fontWeight: '700' }}>{stats.horas}h</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Visto</div>
            </div>
          </div>
        </section>

        <section className="profile-continue" style={{ padding: '3rem 5%' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '1.8rem', marginBottom: '1.5rem' }}>
              <i className="fas fa-play" style={{ marginRight: '0.5rem' }}></i>
              Continuar Viendo
            </h2>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <i className="fas fa-circle-notch spin" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
              </div>
            ) : continueWatching.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {continueWatching.slice(0, 6).map((item) => (
                  <Link to={`/anime/${item.anime_id}`} key={item.id} className="continue-card" style={{ display: 'block', textDecoration: 'none' }}>
                    <div className="continue-thumb">
                      <img
                        src={item.imagen ? `/img/${item.imagen}` : `https://placehold.co/280x160/111122/9896b8?text=${encodeURIComponent(item.titulo)}`}
                        alt={item.titulo}
                        style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                      />
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.progreso || 0}%` }}></div>
                    </div>
                    <div className="continue-info">
                      <h4 style={{ color: 'var(--text-primary)' }}>{item.titulo}</h4>
                      <span>Episodio {item.episodio}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <i className="fas fa-play-circle" style={{ fontSize: '2rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                <p>No has empezado ningún anime aún</p>
                <Link to="/browse" style={{ color: 'var(--accent)', marginTop: '1rem', display: 'inline-block' }}>
                  Explorar catálogo
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="profile-actions" style={{ padding: '2rem 5%', borderTop: '1px solid var(--border)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/browse')} className="btn-cta-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <i className="fas fa-search"></i> Explorar
            </button>
            <button onClick={() => navigate('/favorites')} className="btn-cta-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <i className="fas fa-heart"></i> Favoritos
            </button>
            {usuario.plan !== 'Free' && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="btn-cta-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
              >
                <i className="fas fa-credit-card"></i>
                {portalLoading ? 'Cargando...' : 'Gestionar suscripción'}
              </button>
            )}
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="btn-login"
              style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}
            >
              <i className="fas fa-sign-out-alt" style={{ marginRight: '0.5rem' }}></i> Cerrar sesión
            </button>
          </div>
        </section>
      </main>
      <Footer />

      {planModalOpen && <PlanModal onClose={() => setPlanModalOpen(false)} />}
    </>
  );
}
