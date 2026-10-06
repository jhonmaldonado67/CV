import React, { createContext, useContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Browse from './pages/Browse';
import Series from './pages/Series';
import Movies from './pages/Movies';
import Manga from './pages/Manga';
import MangaReader from './pages/MangaReader';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import AnimeDetail from './pages/AnimeDetail';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import Music from './pages/Music';
import Playlist from './pages/Playlist';
import Album from './pages/Album';
import ArtistProfile from './pages/ArtistProfile';
import Watch from './pages/Watch';
import Read from './pages/Read';
import { SectionProvider } from './contexts/SectionContext';
import { MusicPlayerProvider, MusicPlayer } from './components/MusicPlayer';
import AIChatbot from './components/AIChatbot';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function App() {
  const [usuario, setUsuario] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (user, token) => {
    localStorage.setItem('usuario', JSON.stringify(user));
    localStorage.setItem('token', token);
    setUsuario(user);
  };

  const logout = () => {
    localStorage.removeItem('usuario');
    localStorage.removeItem('token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      <SectionProvider>
        <MusicPlayerProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login initialTab="login" />} />
            <Route path="/register" element={usuario ? <Navigate to="/" /> : <Login initialTab="register" />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/series" element={<Series />} />
            <Route path="/movies" element={<Movies />} />
            <Route path="/manga" element={<Manga />} />
            <Route path="/manga/:id/leer" element={<MangaReader />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/anime/:id" element={<AnimeDetail />} />
            <Route path="/subscription/success" element={<SubscriptionSuccess />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
            <Route path="/music" element={<Music />} />
            <Route path="/music/playlist/:id" element={<Playlist />} />
            <Route path="/music/album/:id" element={<Album />} />
            <Route path="/music/artist/:id" element={<ArtistProfile />} />
            <Route path="/watch/:id/:ep" element={<Watch />} />
            <Route path="/read/:id" element={<Read />} />
          </Routes>
          <MusicPlayer />
          <AIChatbot />
        </MusicPlayerProvider>
      </SectionProvider>
    </AuthContext.Provider>
  );
}
