import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SectionContext = createContext();

export function useSection() {
  return useContext(SectionContext);
}

export function SectionProvider({ children }) {
  const [section, setSection] = useState('streaming');
  const location = useLocation();

  // Auto-detect section from route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/music')) {
      setSection('music');
    } else if (path.startsWith('/manga') || path === '/anime') {
      setSection('anime');
    } else {
      // Keep current section for shared pages like /login, /profile, /
    }
  }, [location.pathname]);

  // Apply data-theme to html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', section);
  }, [section]);

  return (
    <SectionContext.Provider value={{ section, setSection }}>
      {children}
    </SectionContext.Provider>
  );
}
