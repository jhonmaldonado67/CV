import React, { useState, useRef } from 'react';

export default function VipCard({ user }) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const isUltra = user?.plan?.toLowerCase() === 'ultra';
  
  // Theme based on plan
  const cardBg = isUltra 
    ? 'linear-gradient(135deg, #111 0%, #222 100%)' 
    : 'linear-gradient(135deg, #2a2a2a 0%, #3d3d3d 100%)';
  const accentColor = isUltra ? 'var(--accent)' : '#fbbf24'; // Neon blue/accent vs Gold
  const shadowColor = isUltra ? 'rgba(0, 212, 170, 0.3)' : 'rgba(251, 191, 36, 0.3)';

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15; // Max 15 deg
    const rotateY = ((x - centerX) / centerX) * 15;
    
    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  // Convert created_at or default to current year
  const memberSince = user?.created_at 
    ? new Date(user.created_at).getFullYear() 
    : new Date().getFullYear();

  return (
    <div 
      style={{
        perspective: '1000px',
        width: '340px',
        height: '200px',
        cursor: 'pointer',
      }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transition: 'transform 0.1s ease, box-shadow 0.3s ease',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          background: cardBg,
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: `0 20px 40px rgba(0,0,0,0.5), 0 0 40px ${shadowColor}`,
          border: `1px solid ${isUltra ? 'rgba(0,212,170,0.4)' : 'rgba(251,191,36,0.4)'}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#fff'
        }}
      >
        {/* Holographic overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: `linear-gradient(125deg, transparent 20%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.3) 50%, transparent 60%)`,
          backgroundSize: '200% 200%',
          animation: 'shimmer 3s infinite linear',
          pointerEvents: 'none',
          zIndex: 1
        }}></div>

        {/* Global style for animation */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>

        {/* Content (Z-index above holographic) */}
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              STREAM<span style={{ color: accentColor }}>MAX</span>
            </h2>
            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '2px' }}>
              Member Card
            </div>
          </div>
          <div style={{ 
            background: accentColor, color: '#000', padding: '4px 10px', 
            borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase',
            boxShadow: `0 0 10px ${accentColor}`
          }}>
            {user?.plan || 'VIP'}
          </div>
        </div>

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase' }}>
              {user?.username || 'GUEST USER'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
              {user?.email || 'user@streammax.com'}
            </div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              MEMBER SINCE
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {memberSince}
            </div>
          </div>
        </div>
        
        {/* Simulated Chip */}
        <div style={{
          position: 'absolute', top: '50%', left: '1.5rem', transform: 'translateY(-50%)',
          width: '45px', height: '35px', borderRadius: '4px',
          background: 'linear-gradient(135deg, #d4af37 0%, #ffdf73 50%, #aa7700 100%)',
          zIndex: 2, opacity: 0.8,
          border: '1px solid rgba(0,0,0,0.2)'
        }}>
          {/* Chip lines */}
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.3)' }}></div>
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(0,0,0,0.3)' }}></div>
          <div style={{ position: 'absolute', top: '25%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.3)' }}></div>
          <div style={{ position: 'absolute', top: '75%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.3)' }}></div>
        </div>
      </div>
    </div>
  );
}
