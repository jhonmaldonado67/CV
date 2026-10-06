import React, { useState, useRef, useEffect } from 'react';
import api from '../api';
import { useMusicPlayer } from './MusicPlayer';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: '¡Hola! Soy tu asistente de STREAMMAX. ¿Qué tienes ganas de ver hoy?', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentSong } = useMusicPlayer();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: userMessage });
      setMessages(prev => [...prev, { text: res.data.response, sender: 'ai' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: 'Uy, hubo un error de conexión con mi cerebro. Intenta más tarde.', sender: 'ai' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  const bottomOffset = currentSong ? '100px' : '20px';

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed', bottom: bottomOffset, right: '20px', width: '60px', height: '60px',
          borderRadius: '50%', backgroundColor: 'var(--accent)', color: '#000',
          border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', cursor: 'pointer',
          zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.5rem', transition: 'all 0.3s ease',
          transform: isOpen ? 'scale(0)' : 'scale(1)'
        }}
      >
        <i className="fas fa-robot"></i>
      </button>

      {/* Chat Window */}
      <div style={{
        position: 'fixed', bottom: bottomOffset, right: '20px', width: '350px', height: '500px',
        backgroundColor: 'var(--bg-card)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        zIndex: 10001, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.9)',
        opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'var(--accent)', padding: '15px', color: '#000',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="fas fa-robot" style={{ fontSize: '1.2rem' }}></i>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Asistente AI</h3>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#000', cursor: 'pointer', fontSize: '1.2rem' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? 'var(--bg-elevated)' : 'rgba(var(--accent-rgb), 0.1)',
              border: msg.sender === 'ai' ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: 'var(--text-primary)', padding: '10px 15px', borderRadius: '15px',
              borderBottomRightRadius: msg.sender === 'user' ? '0' : '15px',
              borderBottomLeftRadius: msg.sender === 'ai' ? '0' : '15px',
              maxWidth: '85%', fontSize: '0.9rem', lineHeight: 1.4
            }}>
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Escribiendo...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{
          padding: '10px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px',
          backgroundColor: 'var(--bg-void)'
        }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            style={{
              flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-elevated)', color: '#fff', outline: 'none'
            }}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            style={{
              width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--accent)',
              border: 'none', color: '#000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </>
  );
}
