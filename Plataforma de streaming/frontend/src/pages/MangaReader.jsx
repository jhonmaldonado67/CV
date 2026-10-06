import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function MangaReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 56; // Hardcoded for Jujutsu Kaisen chapter 1 demo

  // Memoized navigation handlers to use in useEffect
  const handleNext = useCallback(() => {
    setCurrentPage(prev => (prev < totalPages ? prev + 1 : prev));
  }, [totalPages]);

  const handlePrev = useCallback(() => {
    setCurrentPage(prev => (prev > 1 ? prev - 1 : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'Escape') navigate(-1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, navigate]);

  // Click navigation (left/right sides of image)
  const handleImageClick = (e) => {
    const { clientX, target } = e;
    const { left, width } = target.getBoundingClientRect();
    const clickX = clientX - left;
    
    if (clickX > width / 2) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const handleSelectChange = (e) => {
    setCurrentPage(Number(e.target.value));
  };

  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      backgroundColor: '#050505',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    }}>
      {/* Top Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        background: 'rgba(10, 10, 10, 0.9)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <button 
          onClick={() => navigate(-1)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-secondary)',
            fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <i className="fas fa-arrow-left"></i> Volver
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Pág {currentPage} de {totalPages}
          </span>
          <select 
            value={currentPage} 
            onChange={handleSelectChange}
            style={{
              background: '#222', color: '#fff', border: '1px solid #444',
              borderRadius: '4px', padding: '4px 8px', outline: 'none', cursor: 'pointer'
            }}
          >
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <option key={p} value={p}>Página {p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Reader Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '2rem 1rem',
        cursor: 'ew-resize'
      }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img 
            src={`/mangas/jujutsu-kaisen/cap1/pag${currentPage}.jpg`} 
            alt={`Página ${currentPage}`}
            onClick={handleImageClick}
            style={{
              maxHeight: '90vh',
              maxWidth: '100%',
              objectFit: 'contain',
              boxShadow: '0 0 30px rgba(0,0,0,0.8)',
              userSelect: 'none'
            }}
          />
          
          {/* Invisible Overlay Controls for better UX */}
          <div 
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '40%' }} 
            onClick={handlePrev}
            title="Página anterior"
          ></div>
          <div 
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '40%' }} 
            onClick={handleNext}
            title="Siguiente página"
          ></div>
        </div>
      </div>
    </div>
  );
}
