import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowRight,
  FaBuilding,
  FaChevronDown,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaKey,
  FaLock,
  FaShieldAlt,
  FaSignInAlt,
  FaUser,
  FaUserPlus,
  FaUserTie
} from 'react-icons/fa';
import api from '../services/api';

const DEFAULT_FORM_STATE = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  confirmPassword: '',
  role: 'Admin'
};

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Le backend attend { username, password } via AuthDtos.LoginRequest
        const response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password
        });

        // Le backend retourne AuthDtos.AuthResponse:
        // { token, username, role, name, userId, email, active }
        const data = response.data;

        sessionStorage.setItem('authTokens', JSON.stringify({
          accessToken: data.token,
          refreshToken: data.token
        }));
        sessionStorage.setItem('currentUser', JSON.stringify({
          id: data.userId,
          email: data.email || data.username,
          firstName: data.name?.split(' ')[0] || data.username,
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          role: data.role || 'Service',
          groupCode: data.groupCode,
          groupName: data.groupName,
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          isActive: data.active
        }));

        // Stocker aussi le token pour l'intercepteur axios
        localStorage.setItem('token', data.token);
        window.dispatchEvent(new Event('mirador:auth-changed'));

        navigate('/dashboard');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setIsLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setIsLoading(false);
        return;
      }

      // Le backend attend { username, password, name, email, role } via AuthDtos.RegisterRequest
      const response = await api.post('/auth/register', {
        username: formData.username,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email || `${formData.username}@mirador.cm`,
        role: formData.role
      });

      const data = response.data;

      sessionStorage.setItem('authTokens', JSON.stringify({
        accessToken: data.token,
        refreshToken: data.token
      }));
      sessionStorage.setItem('currentUser', JSON.stringify({
        id: data.userId,
        email: data.email || data.username,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: data.role || 'Service',
        groupCode: data.groupCode,
        groupName: data.groupName,
        permissions: Array.isArray(data.permissions) ? data.permissions : [],
        isActive: data.active
      }));

      localStorage.setItem('token', data.token);
      window.dispatchEvent(new Event('mirador:auth-changed'));

      navigate('/dashboard');
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.response && err.response.status === 400) {
        setError('Identifiants invalides. Vérifiez votre nom d\'utilisateur et mot de passe.');
      } else {
        setError('Une erreur est survenue lors de l\'authentification');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleMode = () => {
    setIsLogin((previous) => !previous);
    setError('');
    setFormData(DEFAULT_FORM_STATE);
  };

  return (
    <div className="relative min-h-screen bg-[#040914]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-12 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(96,165,250,0.12),transparent_35%)]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-xl">
        <header className="mb-6 flex items-center justify-center gap-4 sm:gap-5">
          <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-visible sm:h-24 sm:w-40">
            <img src="/assets/logo_mirador_transparent_cropped.png" alt="Mirador Logo" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 text-left">
            <p className="inline-flex rounded-full border border-sky-300/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-100/80">Gestion hoteliere</p>
          </div>
        </header>

        <div className="rounded-[28px] border border-white/10 bg-[#091426]/90 p-5 shadow-[0_30px_80px_rgba(2,6,23,0.6)] backdrop-blur-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/20">
              <FaShieldAlt className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Accès sécurisé</p>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {isLogin ? 'Se connecter' : 'Créer un compte'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <FaUser className="h-3.5 w-3.5 text-sky-300" />
                    Prénom
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required={!isLogin}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <FaUserTie className="h-3.5 w-3.5 text-sky-300" />
                    Nom
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    required={!isLogin}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Mballa"
                  />
                </div>
              </div>
            )}

            <div className={isLogin ? undefined : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FaUser className="h-3.5 w-3.5 text-sky-300" />
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  placeholder="admin"
                />
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <FaBuilding className="h-3.5 w-3.5 text-sky-300" />
                    Votre rôle
                  </label>
                  <div className="relative">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full cursor-pointer appearance-none rounded-2xl border border-white/10 bg-[#0d172a] py-3.5 pl-4 pr-11 text-white transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    >
                      <option value="Admin">Administrateur</option>
                      <option value="Comptable">Comptabilité</option>
                      <option value="Reception">Réception</option>
                      <option value="Service">Service</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                      <FaChevronDown className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FaEnvelope className="h-3.5 w-3.5 text-sky-300" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  placeholder="samuel@mirador.cm"
                />
              </div>
            )}

            <div className={isLogin ? undefined : 'grid grid-cols-1 gap-4 sm:grid-cols-2'}>
              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FaLock className="h-3.5 w-3.5 text-sky-300" />
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-sky-300"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    tabIndex={-1}
                  >
                    {showPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <FaKey className="h-3.5 w-3.5 text-sky-300" />
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      required={!isLogin}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-white/10 bg-[#0d172a] px-4 py-3.5 pr-12 text-white placeholder-slate-500 transition-all duration-200 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((previous) => !previous)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-sky-300"
                      aria-label={showConfirmPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <FaEyeSlash className="h-4 w-4" /> : <FaEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="auth-submit-button flex w-full items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {isLogin ? 'Connexion...' : 'Création...'}
                </>
              ) : (
                <>
                  <span className="auth-submit-icon">
                    {isLogin ? <FaSignInAlt className="h-3.5 w-3.5" /> : <FaUserPlus className="h-3.5 w-3.5" />}
                  </span>
                  <span className="auth-submit-label">{isLogin ? 'Se connecter' : 'Créer un compte'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-2 border-t border-white/10 pt-4 text-xs text-slate-300">
            <span>{isLogin ? 'Pas encore de compte ?' : 'Déjà un compte ?'}</span>
            <button
              type="button"
              onClick={toggleMode}
              className="auth-mode-button"
            >
              <FaUserPlus className="h-3 w-3" aria-hidden="true" />
              {isLogin ? 'Créer un compte' : 'Se connecter'}
            </button>
          </div>
        </div>

        <p className="mt-3 text-center text-[11px] text-slate-500">&copy; 2026 Hôtel Mirador. Tous droits réservés.</p>
      </div>
      </div>
    </div>
  );
};

export default Auth;
