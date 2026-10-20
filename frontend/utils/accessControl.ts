import { User } from '../types';

export type FeatureKey =
  | 'dashboard'
  | 'security'
  | 'settings'
  | 'reception'
  | 'main-courante'
  | 'rooms'
  | 'bookings'
  | 'guests'
  | 'accounting'
  | 'cash-workflow'
  | 'finances'
  | 'reports'
  | 'economat'
  | 'stock'
  | 'restaurant'
  | 'bar'
  | 'employees'
  | 'services'
  | 'ai'
  | 'invoices'
  | 'promotions'
  | 'reviews'
  | 'notifications'
  | 'planning';

export const ROLE_PERMISSIONS: Record<string, FeatureKey[]> = {
  Admin: [
    'dashboard', 'security', 'settings', 'reception', 'main-courante', 'rooms', 'bookings', 'guests',
    'accounting', 'cash-workflow', 'finances', 'reports', 'economat', 'stock', 'restaurant', 'bar',
    'employees', 'services', 'ai', 'invoices', 'promotions', 'reviews', 'notifications', 'planning'
  ],
  Comptable: ['dashboard', 'accounting', 'cash-workflow', 'finances', 'reports', 'invoices'],
  Reception: ['dashboard', 'reception', 'main-courante', 'rooms', 'bookings', 'guests', 'services', 'invoices', 'promotions', 'reviews', 'notifications'],
  Service: ['dashboard']
};

export const normalizeRole = (role?: string): keyof typeof ROLE_PERMISSIONS => {
  const value = (role || 'Service')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (value.includes('admin') || value.includes('directeur') || value.includes('manager')) return 'Admin';
  if (value.includes('comptable') || value.includes('caissier')) return 'Comptable';
  if (value.includes('reception') || value.includes('accueil') || value.includes('concierge')) return 'Reception';
  return 'Service';
};

export const getUserPermissions = (user: User | null): FeatureKey[] => {
  if (!user) return [];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions as FeatureKey[];
  }
  return ROLE_PERMISSIONS[normalizeRole(user.role)] ?? ROLE_PERMISSIONS.Service;
};

export const canAccessFeature = (user: User | null, feature: FeatureKey): boolean =>
  getUserPermissions(user).includes(feature);

export const readCurrentUser = (): User | null => {
  try {
    const saved = sessionStorage.getItem('currentUser');
    if (!saved || saved === 'undefined') return null;
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
};
