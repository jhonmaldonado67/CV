import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../App';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['Catálogo básico', 'Calidad 720p', 'Anuncios'],
    popular: false,
  },
  {
    id: 'fan',
    name: 'Fan',
    price: 4.99,
    features: ['Sin anuncios', 'Calidad 1080p', 'Acceso completo'],
    popular: true,
  },
  {
    id: 'mega-fan',
    name: 'Mega Fan',
    price: 9.99,
    features: ['Todo lo de Fan', 'Calidad 4K', 'Descargas offline', '5 dispositivos'],
    popular: false,
  },
];

export default function PlanModal({ onClose }) {
  const navigate = useNavigate();
  const { usuario, login: updateUser } = useAuth();
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleSelectPlan = async (planName, price) => {
    if (price === 0) {
      if (usuario) {
        updateUser({ ...usuario, plan: 'Free' }, localStorage.getItem('token'));
      }
      onClose();
      return;
    }

    if (!usuario) {
      navigate('/login');
      return;
    }

    setLoading(planName);
    try {
      const res = await api.post('/stripe/create-checkout-session', { planName });
      window.location.href = res.data.url;
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar el pago');
      setLoading(null);
    }
  };

  return (
    <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: '900px' }}>
        <button className="modal-close" onClick={onClose}><i className="fas fa-times"></i></button>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontFamily: "'Inter',sans-serif", fontSize: '2.5rem' }}>
            Elige tu plan
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Desbloquea todo el contenido de MiAnime
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
        }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${plan.popular ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                position: 'relative',
                transition: 'var(--transition)',
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--accent)',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Más popular
                </div>
              )}
              <h3 style={{ fontFamily: "'Inter',sans-serif", fontSize: '1.8rem', marginBottom: '0.5rem' }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <span style={{ fontSize: '2.5rem', fontWeight: '700' }}>${plan.price}</span>
                {plan.price > 0 && <span style={{ color: 'var(--text-muted)' }}>/mes</span>}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <i className="fas fa-check" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}></i>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSelectPlan(plan.name, plan.price)}
                disabled={loading === plan.name}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  background: plan.price === 0 ? 'var(--bg-elevated)' : 'var(--accent)',
                  color: plan.price === 0 ? 'var(--text-secondary)' : 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  transition: 'var(--transition)',
                  opacity: loading === plan.name ? 0.7 : 1,
                }}
              >
                {loading === plan.name ? (
                  <i className="fas fa-circle-notch spin"></i>
                ) : plan.price === 0 ? (
                  'Comenzar gratis'
                ) : (
                  `Suscribirse — $${plan.price}/mes`
                )}
              </button>
            </div>
          ))}
        </div>

        {usuario && usuario.plan && usuario.plan !== 'Free' && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Plan actual: <strong style={{ color: 'var(--accent)' }}>{usuario.plan}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
