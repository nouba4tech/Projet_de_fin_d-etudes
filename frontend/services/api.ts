import axios from 'axios';

// Configuration de base pour toutes les requêtes HTTP vers le backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification s'il existe
api.interceptors.request.use(
  (config) => {
    // Vérifier d'abord localStorage (défini par Auth.tsx), puis sessionStorage
    let token = localStorage.getItem('token');
    if (!token) {
      try {
        const authTokens = sessionStorage.getItem('authTokens');
        if (authTokens) {
          const parsed = JSON.parse(authTokens);
          token = parsed.accessToken || null;
        }
      } catch { /* ignore */ }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs globalement (ex: token expiré)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Gérer la déconnexion si non autorisé
      console.error("Non autorisé, veuillez vous reconnecter.");
      localStorage.removeItem('token');
      // Optionnellement rediriger vers la page de connexion
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
