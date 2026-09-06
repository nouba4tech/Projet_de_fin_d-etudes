
export enum RoomStatus {
  AVAILABLE = 'Disponible',
  OCCUPIED = 'Occupé',
  CLEANING = 'Nettoyage',
  MAINTENANCE = 'Maintenance'
}

export enum RoomType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  SUITE = 'Suite',
  DELUXE = 'Deluxe'
}

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  typeLabel?: string;
  price: number;
  status: RoomStatus;
  cleaningStatus?: string;
  description?: string;
  capacity?: number;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  status: 'Actif' | 'En repos' | 'Congé';
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minThreshold: number;
}

export interface DashboardStats {
  occupancyRate: number;
  revenueToday: number;
  pendingCheckins: number;
  roomsCleaning: number;
}

// Types pour le module Réservations
export enum ReservationStatus {
  PENDING = 'En attente',
  CONFIRMED = 'Confirmée',
  CANCELLED = 'Annulée'
}

export interface Reservation {
  id: string;
  clientId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: ReservationStatus;
  totalAmount: number;
  createdAt: Date;
  // Gestion du type de client et de l'occupant physique
  clientType?: 'Personne physique' | 'Personne morale';
  companyName?: string;
  occupantFirstName?: string;
  occupantLastName?: string;
  occupantIdDocument?: string;
  occupantPhone?: string;
}

// Types pour le module Clients
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocument: string;
  address: string;
  stayHistory: Reservation[];
  createdAt: Date;
}

// Types pour le module Employés
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  status: 'Actif' | 'En repos' | 'Congé';
  userRole: 'Admin' | 'Manager' | 'Receptionniste' | 'Service';
}

// Types pour le module Services
export enum ServiceType {
  SPA = 'Spa',
  GYM = 'Gym',
  TRANSPORT = 'Transport',
  ROOM_SERVICE = 'Room Service',
  LAUNDRY = 'Laundry'
}

export enum ServiceStatus {
  REQUESTED = 'Demandé',
  IN_PROGRESS = 'En cours',
  COMPLETED = 'Terminé',
  CANCELLED = 'Annulé'
}

export interface Service {
  id: string;
  clientId: string;
  type: ServiceType;
  description: string;
  status: ServiceStatus;
  requestedAt: Date;
  completedAt?: Date;
  price: number;
}

// Types pour le module Finances
export enum TransactionType {
  INCOME = 'Recette',
  EXPENSE = 'Dépense'
}

export enum TransactionCategory {
  ROOM_REVENUE = 'Réservations',
  RESTAURANT_REVENUE = 'Restaurant',
  SALARY_EXPENSE = 'Salaires',
  STOCK_EXPENSE = 'Stocks',
  MAINTENANCE_EXPENSE = 'Maintenance',
  OTHER = 'Autre'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  amount: number;
  date: Date;
  reference?: string;
}

// Types pour le module Restaurant
export enum OrderStatus {
  PENDING = 'En attente',
  PREPARING = 'En préparation',
  SERVED = 'Servi',
  PAID = 'Payé'
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'Plat' | 'Boisson' | 'Dessert' | 'Entrée';
  available: boolean;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  totalAmount: number;
  createdAt: Date;
  servedAt?: Date;
}

export interface OrderItem {
  menuItemId: string;
  quantity: number;
  price: number;
}

// Types pour le module Stock
export interface StockItem {
  id: string;
  name: string;
  code: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minThreshold: number;
  supplier?: string;
  lastUpdated: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  reason: string;
  date: Date;
  reference?: string;
}

// Types pour l'authentification
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  groupCode?: number;
  groupName?: string;
  permissions?: string[];
  isActive: boolean;
  lastLogin?: Date;
}

export enum UserRole {
  ADMIN = 'Admin',
  CLIENT = 'Client',
  COMPTABLE = 'Comptable',
  FOURNISSEUR = 'Fournisseur',
  RECEPTION = 'Reception',
  SERVICE = 'Service'
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
