import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Read() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 20; // Fake number of pages

  useEffect(() => {
    // Simulate loading manga data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0b10', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <i className="fas fa-circle-notch fa-spin" style={{ color: 'var(--accent)', fontSize: '3rem' }}></i>
      </div>
    );
  }

  // Placeholder images from unsplash simulating manga pages
  const pageImage = `https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80&sig=${currentPage}`; // just adding sig to force image reload if needed or we just use placehold.co
  const mangaPage = `https://placehold.co/800x1200/1a1b26/ffffff?text=Página+${currentPage}+de+Manga+${id}`;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0b10', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        padding: '1rem 2rem', background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)' }}>Manga ID: {id} - Capítulo 1</h2>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Página {currentPage} de {totalPages}
        </div>
      </header>

      {/* Reader Area */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'relative' }}>
        
        {/* Prev Area (Left side click) */}
        <div 
          onClick={prevPage}
          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'w-resize', zIndex: 5 }}
        ></div>
        
        {/* Next Area (Right side click) */}
        <div 
          onClick={nextPage}
          style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'e-resize', zIndex: 5 }}
        ></div>

        {/* Page Image */}
        <img 
          src={mangaPage} 
          alt={`Página ${currentPage}`} 
          style={{ 
            maxHeight: '85vh', maxWidth: '100%', objectFit: 'contain',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            userSelect: 'none'
          }} 
        />

      </main>

      {/* Footer Controls */}
      <footer style={{ 
        padding: '1rem 2rem', background: 'var(--bg-deep)', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem'
      }}>
        <button 
          onClick={prevPage} 
          disabled={currentPage === 1}
          style={{ 
            padding: '0.5rem 1.5rem', background: 'var(--bg-elevated)', border: 'none', 
            borderRadius: '4px', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <i className="fas fa-chevron-left"></i> Anterior
        </button>
        <span style={{ color: 'var(--text-primary)' }}>{currentPage} / {totalPages}</span>
        <button 
          onClick={nextPage} 
          disabled={currentPage === totalPages}
          style={{ 
            padding: '0.5rem 1.5rem', background: 'var(--accent)', border: 'none', 
            borderRadius: '4px', color: '#000', fontWeight: 'bold',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Siguiente <i className="fas fa-chevron-right"></i>
        </button>
      </footer>
    </div>
  );
}
