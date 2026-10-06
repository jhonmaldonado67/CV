import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    }
    return Promise.reject(err);
  }
);

export const saveProgress = (animeId, episodio, progreso = 0) => 
  api.post('/animes/continue', { animeId, episodio, progreso });

export const getContinueWatching = () => 
  api.get('/animes/continue');

export const removeProgress = (animeId) => 
  api.delete(`/animes/continue/${animeId}`);

export default api;
