import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ padding: '2rem', borderTop: '1px solid var(--border)', background: 'var(--bg-void)' }}>
      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
        <div className="logo" style={{ opacity: 0.5 }}>
          <h1 style={{ fontSize: '1rem' }}>STREAM<span>MAX</span></h1>
        </div>
        <p>© {new Date().getFullYear()} STREAMMAX Entertainment Inc. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
