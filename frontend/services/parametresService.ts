import api from './api';

// Type definitions matching backend DTOs
export interface RoomType {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  status: 'active' | 'inactive';
  floor: number;
  createdAt: string;
  createdBy: string;
}

export interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  cleaningStatus: 'clean' | 'dirty' | 'in_progress';
  notes?: string;
  lastCleaned?: string;
  createdAt: string;
  createdBy: string;
}

export interface Personnel {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: 'active' | 'on_leave' | 'terminated';
  permissions: string[];
  createdAt: string;
  createdBy: string;
}

export interface CashRegister {
  id: string;
  code: string;
  name: string;
  location: string;
  openingBalance: number;
  currentBalance: number;
  currency: string;
  status: 'active' | 'inactive';
  responsiblePerson: string;
  createdAt: string;
  createdBy: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  paymentTerms: string;
  taxId: string;
  rating: number;
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

export interface Client {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idNumber: string;
  idType: 'cni' | 'passport' | 'residence_permit';
  nationality: string;
  dateOfBirth: string;
  vipStatus: boolean;
  status: 'active' | 'inactive' | 'blacklisted';
  preferences: string[];
  createdAt: string;
  createdBy: string;
}

export interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'accommodation' | 'food_beverage' | 'wellness' | 'business' | 'other';
  price: number;
  unit: 'per_night' | 'per_person' | 'per_hour' | 'flat_rate';
  status: 'active' | 'inactive';
  createdAt: string;
  createdBy: string;
}

export interface Parameter {
  id: string;
  code: string;
  name: string;
  category: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'date';
  value: string | number | boolean;
  options?: string[];
  description: string;
  isRequired: boolean;
  status: 'active' | 'inactive';
  updatedAt: string;
  updatedBy: string;
}

// Room Types API
export const roomTypeApi = {
  list: async () => {
    const { data } = await api.get<RoomType[]>('/parametres/room-types');
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<RoomType>(`/parametres/room-types/${id}`);
    return data;
  },
  create: async (roomType: Partial<RoomType>) => {
    const { data } = await api.post<RoomType>('/parametres/room-types', roomType);
    return data;
  },
  update: async (id: string, roomType: Partial<RoomType>) => {
    const { data } = await api.put<RoomType>(`/parametres/room-types/${id}`, roomType);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/room-types/${id}`);
  },
};

// Rooms API
export const roomApi = {
  list: async (status?: string) => {
    const { data } = await api.get<Room[]>('/parametres/rooms', { params: { status } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Room>(`/parametres/rooms/${id}`);
    return data;
  },
  create: async (room: Partial<Room>) => {
    const { data } = await api.post<Room>('/parametres/rooms', room);
    return data;
  },
  update: async (id: string, room: Partial<Room>) => {
    const { data } = await api.put<Room>(`/parametres/rooms/${id}`, room);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/rooms/${id}`);
  },
};

// Personnel API
export const personnelApi = {
  list: async (status?: string) => {
    const { data } = await api.get<Personnel[]>('/parametres/personnel', { params: { status } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Personnel>(`/parametres/personnel/${id}`);
    return data;
  },
  create: async (personnel: Partial<Personnel>) => {
    const { data } = await api.post<Personnel>('/parametres/personnel', personnel);
    return data;
  },
  update: async (id: string, personnel: Partial<Personnel>) => {
    const { data } = await api.put<Personnel>(`/parametres/personnel/${id}`, personnel);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/personnel/${id}`);
  },
};

// Cash Registers API
export const cashRegisterApi = {
  list: async (status?: string) => {
    const { data } = await api.get<CashRegister[]>('/parametres/cash-registers', { params: { status } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<CashRegister>(`/parametres/cash-registers/${id}`);
    return data;
  },
  create: async (register: Partial<CashRegister>) => {
    const { data } = await api.post<CashRegister>('/parametres/cash-registers', register);
    return data;
  },
  update: async (id: string, register: Partial<CashRegister>) => {
    const { data } = await api.put<CashRegister>(`/parametres/cash-registers/${id}`, register);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/cash-registers/${id}`);
  },
};

// Suppliers API
export const supplierApi = {
  list: async (status?: string) => {
    const { data } = await api.get<Supplier[]>('/parametres/suppliers', { params: { status } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Supplier>(`/parametres/suppliers/${id}`);
    return data;
  },
  create: async (supplier: Partial<Supplier>) => {
    const { data } = await api.post<Supplier>('/parametres/suppliers', supplier);
    return data;
  },
  update: async (id: string, supplier: Partial<Supplier>) => {
    const { data } = await api.put<Supplier>(`/parametres/suppliers/${id}`, supplier);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/suppliers/${id}`);
  },
};

// Clients API
export const clientApi = {
  list: async (status?: string) => {
    const { data } = await api.get<Client[]>('/parametres/clients', { params: { status } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Client>(`/parametres/clients/${id}`);
    return data;
  },
  create: async (client: Partial<Client>) => {
    const { data } = await api.post<Client>('/parametres/clients', client);
    return data;
  },
  update: async (id: string, client: Partial<Client>) => {
    const { data } = await api.put<Client>(`/parametres/clients/${id}`, client);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/clients/${id}`);
  },
};

// Services API
export const serviceApi = {
  list: async (category?: string) => {
    const { data } = await api.get<Service[]>('/parametres/services', { params: { category } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Service>(`/parametres/services/${id}`);
    return data;
  },
  create: async (service: Partial<Service>) => {
    const { data } = await api.post<Service>('/parametres/services', service);
    return data;
  },
  update: async (id: string, service: Partial<Service>) => {
    const { data } = await api.put<Service>(`/parametres/services/${id}`, service);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/services/${id}`);
  },
};

// Parameters API
export const parameterApi = {
  list: async (category?: string) => {
    const { data } = await api.get<Parameter[]>('/parametres/parameters', { params: { category } });
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get<Parameter>(`/parametres/parameters/${id}`);
    return data;
  },
  create: async (parameter: Partial<Parameter>) => {
    const { data } = await api.post<Parameter>('/parametres/parameters', parameter);
    return data;
  },
  update: async (id: string, parameter: Partial<Parameter>) => {
    const { data } = await api.put<Parameter>(`/parametres/parameters/${id}`, parameter);
    return data;
  },
  delete: async (id: string) => {
    await api.delete(`/parametres/parameters/${id}`);
  },
};
