import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Room, RoomStatus, DashboardStats, User } from './types';
import { INITIAL_ROOMS, ICONS } from './constants';
import api from './services/api';
import { FeatureKey, canAccessFeature, readCurrentUser } from './utils/accessControl';
import { AppSettingsProvider } from './contexts/AppSettingsContext';
import { mapBackendRoomsToFrontend, mapBackendRoomToFrontend } from './utils/roomMapper';

const Auth = lazy(() => import('./components/Auth'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const Rooms = lazy(() => import('./components/Rooms'));
const Bookings = lazy(() => import('./components/Bookings'));
const Guests = lazy(() => import('./components/Guests'));
const Employees = lazy(() => import('./components/Employees'));
const Services = lazy(() => import('./components/Services'));
const Finances = lazy(() => import('./components/Finances'));
const Restaurant = lazy(() => import('./components/Restaurant'));
const Bar = lazy(() => import('./components/Bar'));
const Stock = lazy(() => import('./components/Stock'));
const AIAssistant = lazy(() => import('./components/AIAssistant'));
const Reports = lazy(() => import('./components/Reports'));
const Parametres = lazy(() => import('./components/Parametres'));
const Security = lazy(() => import('./components/Security'));
const Reception = lazy(() => import('./components/Reception'));
const MainCourante = lazy(() => import('./components/MainCourante'));
const Accounting = lazy(() => import('./components/Accounting'));
const CashWorkflow = lazy(() => import('./components/CashWorkflow'));
const Economat = lazy(() => import('./components/Economat'));

type Theme = 'dark' | 'light';

interface NewRoomForm {
  code: string;
  typeLabel: string;
  nightlyRate: number;
  status: RoomStatus;
  cleaningStatus: string;
  capacity: number;
  description: string;
}

const THEME_STORAGE_KEY = 'mirador-theme';

const resolveInitialTheme = (): Theme => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

const QUICK_SEARCH_ROUTES: Array<{ path: string; feature?: FeatureKey; label: string; keywords: string[] }> = [
  { path: '/security', label: 'Sécurité', keywords: ['securite', 'sécurité', 'acces', 'utilisateur'] },
  { path: '/settings', label: 'Gestion des paramètres', keywords: ['parametres', 'paramètre', 'setting', 'config'] },
  { path: '/reception', label: 'Réception', keywords: ['réception', 'accueil', 'reception', 'reservation'] },
  { path: '/bar', feature: 'bar', label: 'Bar', keywords: ['boisson'] },
  { path: '/restaurant', feature: 'restaurant', label: 'Restaurant', keywords: ['resto'] },
  { path: '/accounting', feature: 'accounting', label: 'Gestion comptable', keywords: ['comptable', 'finance', 'facturation'] },
  { path: '/economat', feature: 'economat', label: 'Economat', keywords: ['economat', 'achat', 'approvisionnement'] },
  { path: '/stock', feature: 'stock', label: 'Gestion de stock', keywords: ['stock', 'inventaire'] }
];

type QuickSearchRoute = (typeof QUICK_SEARCH_ROUTES)[number];
type HeaderNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
};

const INITIAL_HEADER_NOTIFICATIONS: HeaderNotification[] = [
  {
    id: 'notif-1',
    title: 'Nouvelle reservation',
    message: 'La chambre 204 a ete reservee pour ce soir.',
    time: 'Il y a 5 min',
    read: false
  },
  {
    id: 'notif-2',
    title: 'Stock faible',
    message: 'Le bar est presque en rupture de boissons premium.',
    time: 'Il y a 24 min',
    read: false
  },
  {
    id: 'notif-3',
    title: 'Paiement confirme',
    message: 'Facture F-2026-0321 validee avec succes.',
    time: 'Il y a 1 h',
    read: true
  }
];

const normalizeSearchText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const matchQuickSearchRoute = (route: QuickSearchRoute, normalizedQuery: string): boolean => {
  const values = [route.label, route.path.replace('/', ''), ...route.keywords].map(normalizeSearchText);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);

  return values.some(value => (
    value.includes(normalizedQuery) ||
    normalizedQuery.includes(value) ||
    tokens.some(token => value.includes(token)) ||
    tokens.every(token => value.includes(token))
  ));
};

const featureFromPath = (path: string): FeatureKey => path.replace(/^\//, '') as FeatureKey;

const SidebarItem: React.FC<{ to: string; label: string; icon: React.FC; allowed: boolean; theme: Theme }> = ({ to, label, icon: Icon, allowed, theme }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  if (!allowed) {
    return (
      <button
        type="button"
        disabled
        title="Acces non autorise pour votre groupe"
        className={`flex w-full cursor-not-allowed items-center gap-4 px-6 py-3.5 text-left opacity-55 ${
          theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
        }`}
      >
        <Icon />
        <span className="font-medium text-[15px]">{label}</span>
      </button>
    );
  }

  const activeClasses = theme === 'dark'
    ? 'bg-[#0d1b3e] text-blue-400 border-r-4 border-blue-500'
    : 'bg-blue-50 text-blue-700 border-r-4 border-blue-600';
  const inactiveClasses = theme === 'dark'
    ? 'text-gray-400 hover:text-white hover:bg-white/5'
    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50';

  return (
    <Link
      to={to}
      className={`flex items-center gap-4 px-6 py-3.5 transition-all ${isActive ? activeClasses : inactiveClasses}`}
    >
      <Icon />
      <span className="font-medium text-[15px]">{label}</span>
    </Link>
  );
};

const PageLoader: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = false }) => {
  return (
    <div className={`flex items-center justify-center ${fullScreen ? 'min-h-screen bg-[#050714]' : 'min-h-[calc(100vh-160px)]'}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-gray-300">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-blue-500" />
        Chargement du module...
      </div>
    </div>
  );
};

const MiradorSidebar: React.FC<{ theme: Theme }> = ({ theme }) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem('currentUser');
      if (!saved || saved === 'undefined') return null;
      return JSON.parse(saved);
    } catch (e) {
      console.warn("Impossible de lire les données utilisateur du cache", e);
      return null;
    }
  });

  useEffect(() => {
    console.log("Sidebar montée. Utilisateur actuel:", currentUser);
  }, [currentUser]);

  const handleLogout = () => {
    sessionStorage.removeItem('authTokens');
    sessionStorage.removeItem('currentUser');
    navigate('/auth');
  };

  const displayName = currentUser 
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || 'Utilisateur'
    : 'Administrateur';

  const isDark = theme === 'dark';

  return (
    <aside className={`w-[280px] flex flex-col fixed h-full z-20 overflow-y-auto ${
      isDark ? 'bg-[#050714] border-r border-white/5' : 'bg-white border-r border-gray-200'
    }`}>
      <div className="p-8 pb-10 flex flex-col items-center">
        <div className="w-36 h-36 flex items-center justify-center overflow-hidden">
          <img src="/assets/logo_mirador_transparent_cropped.png" alt="Mirador Hotel" className="w-full h-full object-contain" />
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <SidebarItem to="/dashboard" label="Tableau de bord" icon={ICONS.Dashboard} allowed={canAccessFeature(currentUser, 'dashboard')} theme={theme} />
        <SidebarItem to="/security" label="Sécurité" icon={ICONS.Security} allowed={canAccessFeature(currentUser, 'security')} theme={theme} />
        <SidebarItem to="/settings" label="Gestion des paramètres" icon={ICONS.Settings} allowed={canAccessFeature(currentUser, 'settings')} theme={theme} />
        <SidebarItem to="/reception" label="Réception" icon={ICONS.Reception} allowed={canAccessFeature(currentUser, 'reception')} theme={theme} />
        <SidebarItem to="/bar" label="Bar" icon={ICONS.Bar} allowed={canAccessFeature(currentUser, 'bar')} theme={theme} />
        <SidebarItem to="/restaurant" label="Restaurant" icon={ICONS.Restaurant} allowed={canAccessFeature(currentUser, 'restaurant')} theme={theme} />
        <SidebarItem to="/accounting" label="Gestion comptable" icon={ICONS.Accounting} allowed={canAccessFeature(currentUser, 'accounting')} theme={theme} />
        <SidebarItem to="/cash-workflow" label="Gestion de caisse" icon={ICONS.CashWorkflow} allowed={canAccessFeature(currentUser, 'cash-workflow')} theme={theme} />
        <SidebarItem to="/economat" label="Economat" icon={ICONS.Economat} allowed={canAccessFeature(currentUser, 'economat')} theme={theme} />
        <SidebarItem to="/stock" label="Gestion de stock" icon={ICONS.Stock} allowed={canAccessFeature(currentUser, 'stock')} theme={theme} />
      </nav>

      <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </span>
          </div>
          <div className="flex flex-col">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {currentUser ? currentUser.role : 'Session Active'}
            </p>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{displayName}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-3 py-3 rounded-xl transition-all font-bold text-sm border ${
            isDark
              ? 'bg-white/5 hover:bg-rose-500/10 text-rose-400 border-white/5'
              : 'bg-gray-50 hover:bg-rose-50 text-rose-600 border-gray-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Deconnexion
        </button>
      </div>
    </aside>
  );
};


const AccessDenied: React.FC = () => (
  <div className="flex min-h-[calc(100vh-160px)] items-center justify-center">
    <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <h3 className="text-lg font-bold text-white">Acces limite</h3>
      <p className="mt-2 text-sm leading-6 text-white/65">
        Votre groupe utilisateur ne dispose pas des droits pour utiliser cette fonctionnalite.
      </p>
    </div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode; feature?: FeatureKey }> = ({ children, feature }) => {
  const authTokens = sessionStorage.getItem('authTokens');
  const currentUser = sessionStorage.getItem('currentUser');

  if (!authTokens || !currentUser) {
    return <Navigate to="/auth" replace />;
  }

  const parsedUser = readCurrentUser();
  if (feature && !canAccessFeature(parsedUser, feature)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

const MainLayout: React.FC<{
  children: React.ReactNode;
  title: string;
  theme: Theme;
  onToggleTheme: () => void;
  feature: FeatureKey;
}> = ({ children, title, theme, onToggleTheme, feature }) => {
  const navigate = useNavigate();
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<HeaderNotification[]>(INITIAL_HEADER_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter(notification => !notification.read).length,
    [notifications]
  );

  const handleQuickSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedQuery = normalizeSearchText(quickSearch);
    if (!normalizedQuery) {
      return;
    }

    const currentUser = readCurrentUser();
    const matchedRoute = QUICK_SEARCH_ROUTES.find(route => (
      canAccessFeature(currentUser, route.feature ?? featureFromPath(route.path)) &&
      matchQuickSearchRoute(route, normalizedQuery)
    ));

    if (matchedRoute) {
      navigate(matchedRoute.path);
      setQuickSearch('');
      return;
    }

    navigate(`/reception?search=${encodeURIComponent(quickSearch.trim())}`);
    setQuickSearch('');
  };

  const toggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(notification => (
      notification.id === id ? { ...notification, read: true } : notification
    )));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  useEffect(() => {
    if (!showNotifications) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationPanelRef.current && !notificationPanelRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <ProtectedRoute feature={feature}>
      <div
        data-app-shell="true"
        className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#050714] text-white' : 'bg-slate-100 text-gray-900'}`}
      >
        <MiradorSidebar theme={theme} />
        <main className={`flex-1 ml-[280px] h-full overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#050714]' : 'bg-slate-100'}`}>
          <header className={`h-20 border-b flex items-center justify-between px-10 shrink-0 ${theme === 'dark' ? 'bg-[#06101d] border-slate-700/60' : 'bg-white border-gray-200'}`}>
            <h2 className={`text-xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h2>
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <form onSubmit={handleQuickSearch} className="relative">
                  <input
                    type="text"
                    value={quickSearch}
                    onChange={(event) => {
                      setQuickSearch(event.target.value);
                    }}
                    placeholder="Recherche rapide..."
                    list="quick-search-options"
                    className={`rounded-full pl-5 pr-12 py-2 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                      theme === 'dark'
                        ? 'bg-gray-800 border border-gray-600 text-white placeholder-gray-400'
                        : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <datalist id="quick-search-options">
                    {QUICK_SEARCH_ROUTES.filter(route => canAccessFeature(readCurrentUser(), route.feature ?? featureFromPath(route.path))).map(route => (
                      <option key={route.path} value={route.label} />
                    ))}
                  </datalist>
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
                    aria-label="Lancer la recherche rapide"
                    title="Lancer la recherche rapide"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 110-16 8 8 0 010 16z" />
                    </svg>
                  </button>
                </form>
              </div>
              <button
                onClick={onToggleTheme}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shadow-sm ${
                  theme === 'dark'
                    ? 'bg-[#10182b] border-slate-700 text-amber-400 hover:bg-[#16213a]'
                    : 'bg-gray-100 border-gray-300 text-slate-600 hover:bg-gray-200'
                }`}
                title={`Passer en ${theme === 'dark' ? 'mode clair' : 'mode sombre'}`}
                aria-label={`Passer en ${theme === 'dark' ? 'mode clair' : 'mode sombre'}`}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 16a4 4 0 100-8 4 4 0 000 8z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
                  </svg>
                )}
              </button>
              <div className="relative" ref={notificationPanelRef}>
                <button
                  onClick={toggleNotifications}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors ${
                    theme === 'dark'
                      ? 'bg-[#10182b] border-slate-700 text-white/75 hover:bg-[#16213a]'
                      : 'bg-gray-100 border-gray-300 text-gray-400 hover:bg-gray-200'
                  }`}
                  aria-label="Afficher les notifications"
                  aria-expanded={showNotifications}
                  title="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${theme === 'dark' ? 'text-white/75' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                {showNotifications ? (
                  <div className={`absolute right-0 mt-3 w-80 rounded-2xl border p-4 z-50 ${
                    theme === 'dark'
                      ? 'border-slate-700/60 bg-[#0b1020] shadow-[0_20px_40px_rgba(2,6,23,0.5)]'
                      : 'border-gray-200 bg-white shadow-xl'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-bold ${theme === 'dark' ? 'text-white/95' : 'text-gray-900'}`}>Notifications</h3>
                      <button
                        onClick={markAllNotificationsAsRead}
                        className={`text-xs transition-colors ${theme === 'dark' ? 'text-sky-300 hover:text-sky-200' : 'text-blue-600 hover:text-blue-700'}`}
                      >
                        Tout lire
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                      {notifications.map(notification => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markNotificationAsRead(notification.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            theme === 'dark'
                              ? (notification.read ? 'bg-[#10182b] border-slate-700/60' : 'bg-sky-500/10 border-sky-500/20')
                              : (notification.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200')
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className={`text-xs font-bold ${theme === 'dark' ? 'text-white/95' : 'text-gray-900'}`}>{notification.title}</p>
                            <span className={`text-[10px] whitespace-nowrap ${theme === 'dark' ? 'text-white/55' : 'text-gray-400'}`}>{notification.time}</span>
                          </div>
                          <p className={`mt-1 text-xs leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>{notification.message}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

const DEFAULT_STATS: DashboardStats = {
  occupancyRate: 0,
  revenueToday: 0,
  pendingCheckins: 0,
  roomsCleaning: 0
};

const BUTTON_ICON_RULES: Array<{ icon: string; keywords: string[] }> = [
  { icon: 'delete', keywords: ['supprimer', 'effacer'] },
  { icon: 'edit', keywords: ['modifier', 'editer'] },
  { icon: 'save', keywords: ['enregistrer', 'sauvegarder'] },
  { icon: 'validate', keywords: ['valider', 'confirmer'] },
  { icon: 'close', keywords: ['fermer', 'annuler'] },
  { icon: 'add', keywords: ['nouveau', 'nouvelle', 'ajouter', 'creer'] },
  { icon: 'view', keywords: ['voir', 'details', 'detail'] },
  { icon: 'print', keywords: ['imprimer'] },
  { icon: 'email', keywords: ['email'] },
  { icon: 'search', keywords: ['rechercher', 'recherche'] },
  { icon: 'pay', keywords: ['payer', 'paiement'] },
  { icon: 'transfer', keywords: ['transferer', 'transfert'] },
  { icon: 'export', keywords: ['exporter', 'export'] },
  { icon: 'status', keywords: ['statut'] },
  { icon: 'previous', keywords: ['precedent'] },
  { icon: 'next', keywords: ['suivant'] },
  { icon: 'read', keywords: ['lire'] }
];

const normalizeButtonText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const resolveButtonIcon = (button: HTMLButtonElement): string | null => {
  const label = normalizeButtonText(button.textContent ?? '');
  if (!label) {
    return null;
  }

  const matchedRule = BUTTON_ICON_RULES.find(rule => (
    rule.keywords.some(keyword => label.includes(keyword))
  ));

  return matchedRule?.icon ?? 'default';
};

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem('token')) return;
      try {
        const [roomsRes, statsRes] = await Promise.all([
          api.get('/chambres'),
          api.get('/dashboard')
        ]);
        if (Array.isArray(roomsRes.data) && roomsRes.data.length > 0) {
          // Map backend response to frontend format
          setRooms(mapBackendRoomsToFrontend(roomsRes.data));
        }
        if (statsRes.data) {
          setStats({
            occupancyRate: statsRes.data.occupancyRate ?? 0,
            revenueToday: statsRes.data.revenueToday ?? 0,
            pendingCheckins: statsRes.data.pendingCheckins ?? 0,
            roomsCleaning: statsRes.data.roomsCleaning ?? 0
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données initiales", err);
      }
    };

    fetchData();
    window.addEventListener('mirador:auth-changed', fetchData);
    return () => window.removeEventListener('mirador:auth-changed', fetchData);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.remove('theme-dark', 'theme-light');
    document.body.classList.add(`theme-${theme}`);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    let frameId = 0;

    const applyButtonIcons = () => {
      document.querySelectorAll<HTMLButtonElement>('button:not(.no-auto-icon)').forEach(button => {
        const icon = resolveButtonIcon(button);
        if (icon) {
          button.dataset.buttonIcon = icon;
        } else {
          delete button.dataset.buttonIcon;
        }
      });
    };

    const scheduleApplyButtonIcons = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(applyButtonIcons);
    };

    scheduleApplyButtonIcons();

    const observer = new MutationObserver(scheduleApplyButtonIcons);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, []);

  const updateRoomStatus = async (roomId: string, status: RoomStatus) => {
    const currentRoom = rooms.find(room => room.id === roomId);
    try {
      await api.put(`/chambres/${roomId}`, {
        code: roomId,
        typeLabel: currentRoom?.type ?? 'Standard',
        nightlyRate: currentRoom?.price ?? 0,
        status,
        cleaningStatus: 'Pret'
      });
    } catch (err) {
      console.error("Erreur lors de la mise à jour du statut", err);
      return;
    }
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  };

  const updateRoom = async (roomId: string, room: NewRoomForm) => {
    try {
      const response = await api.put(`/chambres/${roomId}`, {
        code: room.code,
        typeLabel: room.typeLabel,
        nightlyRate: room.nightlyRate,
        status: room.status === RoomStatus.AVAILABLE ? 'Disponible' :
                room.status === RoomStatus.OCCUPIED ? 'Occupé' :
                room.status === RoomStatus.CLEANING ? 'Nettoyage' :
                room.status === RoomStatus.MAINTENANCE ? 'Maintenance' :
                'Disponible',
        cleaningStatus: room.cleaningStatus || 'Prêt',
        description: room.description || '',
        capacity: room.capacity
      });

      const updatedRoom = mapBackendRoomToFrontend(response.data);
      setRooms(prev => prev.map(r => r.id === roomId ? updatedRoom : r));
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la chambre", err);
      throw err;
    }
  };

  const createRoom = async (room: NewRoomForm) => {
    try {
      const response = await api.post('/chambres', {
        code: room.code,
        typeLabel: room.typeLabel,
        nightlyRate: room.nightlyRate,
        status: room.status === RoomStatus.AVAILABLE ? 'Disponible' :
                room.status === RoomStatus.OCCUPIED ? 'Occupé' :
                room.status === RoomStatus.CLEANING ? 'Nettoyage' :
                room.status === RoomStatus.MAINTENANCE ? 'Maintenance' :
                'Disponible',
        cleaningStatus: room.cleaningStatus || 'Prêt',
        description: room.description || '',
        capacity: room.capacity
      });
      
      // Map backend response to frontend format
      const createdRoom = mapBackendRoomToFrontend(response.data);
      setRooms(prev => [...prev.filter(existing => existing.id !== createdRoom.id), createdRoom]);
    } catch (err) {
      console.error("Erreur lors de la création de la chambre", err);
      throw err;
    }
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const renderPage = (title: string, feature: FeatureKey, element: React.ReactNode) => (
    <MainLayout title={title} theme={theme} onToggleTheme={toggleTheme} feature={feature}>
      <Suspense fallback={<PageLoader />}>
        {element}
      </Suspense>
    </MainLayout>
  );

  return (
    <AppSettingsProvider>
      <Router>
        <Routes>
          <Route
            path="/auth"
            element={(
              <Suspense fallback={<PageLoader fullScreen />}>
                <Auth />
              </Suspense>
            )}
          />

          <Route path="/" element={<Navigate to="/reception" replace />} />

          <Route path="/security" element={renderPage('Sécurité', 'security', <Security />)} />
          <Route path="/reception" element={renderPage('Réception', 'reception', <Reception />)} />
          <Route path="/main-courante" element={renderPage('Main courante', 'main-courante', <MainCourante />)} />
          <Route path="/accounting" element={renderPage('Gestion comptable', 'accounting', <Accounting />)} />
          <Route path="/cash-workflow" element={renderPage('Gestion de caisse', 'cash-workflow', <CashWorkflow />)} />
          <Route path="/economat" element={renderPage('Economat', 'economat', <Economat />)} />

          <Route path="/dashboard" element={renderPage('Tableau de bord', 'dashboard', <Dashboard stats={stats} rooms={rooms} />)} />
          <Route path="/rooms" element={renderPage('Gestion des Chambres', 'rooms', <Rooms rooms={rooms} onUpdateStatus={updateRoomStatus} onCreateRoom={createRoom} onUpdateRoom={updateRoom} />)} />
          <Route path="/bookings" element={renderPage('Gestion des Réservations', 'bookings', <Bookings rooms={rooms} onUpdateRoomStatus={updateRoomStatus} />)} />
          <Route path="/guests" element={renderPage('Gestion des Clients', 'guests', <Guests />)} />
          <Route path="/employees" element={renderPage('Gestion du Personnel', 'employees', <Employees />)} />
          <Route path="/services" element={renderPage('Services et Prestations', 'services', <Services />)} />
          <Route path="/finances" element={renderPage('Gestion de la Facturation', 'finances', <Finances />)} />
          <Route path="/restaurant" element={renderPage('Restaurant', 'restaurant', <Restaurant />)} />
          <Route path="/bar" element={renderPage('Bar', 'bar', <Bar />)} />
          <Route path="/stock" element={renderPage('Gestion de stock', 'stock', <Stock />)} />
          <Route path="/reports" element={renderPage('Rapports', 'reports', <Reports />)} />
          <Route path="/settings" element={renderPage('Gestion des paramètres', 'settings', <Parametres />)} />
          <Route path="/ai" element={renderPage('Assistant hotel', 'ai', <AIAssistant stats={stats} rooms={rooms} />)} />

          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </Router>
    </AppSettingsProvider>
  );
};

export default App;
