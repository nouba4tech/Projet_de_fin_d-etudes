import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  FaCog,
  FaBed,
  FaHotel,
  FaUser,
  FaUserPlus,
  FaUsers,
  FaTruck,
  FaConciergeBell,
  FaCashRegister,
  FaWarehouse,
  FaGlassMartiniAlt,
  FaUtensils,
  FaWineGlass,
  FaListAlt,
  FaExchangeAlt,
  FaBookOpen,
  FaEye,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaDatabase
} from 'react-icons/fa';
import api from '../services/api';
import { roomTypeApi, roomApi as paramRoomApi, personnelApi, cashRegisterApi, supplierApi as paramSupplierApi, clientApi as paramClientApi, serviceApi as paramServiceApi, parameterApi } from '../services/parametresService';

interface Parameter {
  id: string;
  raisonSociale: string;
  activite: string;
  contact: string;
  ville: string;
  niu: string;
  status: 'active' | 'inactive';
  updatedAt: Date;
  updatedBy: string;
}

interface RoomType {
  id: string;
  code: string;
  name: string;
  description: string;
  capacity: number;
  basePrice: number;
  amenities: string[];
  status: 'active' | 'inactive';
  floor: number;
  createdAt: Date;
  createdBy: string;
}

interface Room {
  id: string;
  number: string;
  roomTypeId: string;
  roomTypeName: string;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'out_of_order';
  cleaningStatus: 'clean' | 'dirty' | 'in_progress';
  lastCleaned?: Date;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

interface Client {
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
  dateOfBirth: Date;
  vipStatus: boolean;
  preferences: string[];
  status: 'active' | 'inactive' | 'blacklisted';
  createdAt: Date;
  createdBy: string;
}

interface Personnel {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: Date;
  salary: number;
  status: 'active' | 'on_leave' | 'terminated';
  permissions: string[];
  createdAt: Date;
  createdBy: string;
}

interface Supplier {
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
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface Service {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'accommodation' | 'food_beverage' | 'wellness' | 'business' | 'other';
  price: number;
  unit: 'per_night' | 'per_person' | 'per_hour' | 'flat_rate';
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

interface CashRegister {
  id: string;
  code: string;
  name: string;
  location: string;
  openingBalance: number;
  currency: string;
  status: 'active' | 'inactive';
  responsiblePerson: string;
  createdAt: Date;
  createdBy: string;
}

interface StorageDepot {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  currentOccupancy: number;
  manager: string;
  temperature?: number;
  humidity?: number;
  securityLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive';
  createdAt: Date;
  createdBy: string;
}

interface Beverage {
  id: string;
  code: string;
  name: string;
  category: 'alcoholic' | 'non_alcoholic' | 'hot' | 'cold';
  brand: string;
  volume: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  alcoholPercentage?: number;
  supplierId: string;
  supplierName: string;
  status: 'active' | 'discontinued';
  createdAt: Date;
  createdBy: string;
}

interface Dish {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  price: number;
  preparationTime: number;
  ingredients: string[];
  allergens: string[];
  isAvailable: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  status: 'active' | 'inactive';
  createdAt: Date;
  createdBy: string;
}

interface Drink {
  id: string;
  code: string;
  name: string;
  category: 'alcoholic' | 'non_alcoholic' | 'hot' | 'cold';
  type: string;
  volume: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  supplierId: string;
  supplierName: string;
  status: 'active' | 'discontinued';
  createdAt: Date;
  createdBy: string;
}

interface DishType {
  id: string;
  code: string;
  name: string;
  description: string;
  parentCategoryId?: string;
  parentCategoryName?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  createdBy: string;
}

interface Transaction {
  id: string;
  reference: string;
  type: 'sale' | 'purchase' | 'expense' | 'transfer' | 'adjustment';
  category: string;
  description: string;
  amount: number;
  currency: string;
  date: Date;
  createdBy: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  attachments?: string[];
}

interface JournalEntry {
  id: string;
  reference: string;
  date: Date;
  account: string;
  accountNumber: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  category: string;
  createdBy: string;
  approvedBy?: string;
  status: 'draft' | 'posted' | 'reversed';
}

const Parametres: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('parametrage');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [chambreForm, setChambreForm] = useState({ code: '', typeId: '' });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomFeedback, setRoomFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [parametersLoading, setParametersLoading] = useState(true);
  const [parameterSaving, setParameterSaving] = useState(false);
  const [parameterFeedback, setParameterFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [demoSeeding, setDemoSeeding] = useState(false);
  const [demoFeedback, setDemoFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [demoCounts, setDemoCounts] = useState<Record<string, number> | null>(null);
  const [parameterForm, setParameterForm] = useState({
    id: '',
    raisonSociale: '',
    activite: '',
    contact: '',
    ville: '',
    niu: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [roomTypesLoading, setRoomTypesLoading] = useState(true);
  const [showRoomTypeForm, setShowRoomTypeForm] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState<string | null>(null);
  const [roomTypeSaving, setRoomTypeSaving] = useState(false);
  const [roomTypeFeedback, setRoomTypeFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [roomTypeForm, setRoomTypeForm] = useState({
    code: '',
    name: '',
    basePrice: '',
    description: '',
    capacity: '1',
    status: 'active' as 'active' | 'inactive'
  });

  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);

  const [loadErrors, setLoadErrors] = useState<Record<string, string>>({});
  const reportLoadError = useCallback((key: string, error: unknown) => {
    console.error(`Erreur de chargement (${key})`, error);
    setLoadErrors((prev) => ({ ...prev, [key]: 'Impossible de charger ces données. Vérifiez votre connexion et réessayez.' }));
  }, []);
  const clearLoadError = useCallback((key: string) => {
    setLoadErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [personnelLoading, setPersonnelLoading] = useState(true);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(true);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierDetailsLoading, setSupplierDetailsLoading] = useState(false);
  const [supplierDetailsError, setSupplierDetailsError] = useState<string | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    numero: '',
    nom: '',
    contact: '',
    solde: 0
  });

  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [cashRegistersLoading, setCashRegistersLoading] = useState(true);
  const [showCashRegisterForm, setShowCashRegisterForm] = useState(false);
  const [editingCashRegisterId, setEditingCashRegisterId] = useState<string | null>(null);
  const [cashRegisterForm, setCashRegisterForm] = useState({
    code: '',
    name: '',
    location: '',
    openingBalance: 0,
    currency: 'XAF',
    status: 'active',
    responsiblePerson: ''
  });

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [serviceDetailsLoading, setServiceDetailsLoading] = useState(false);
  const [serviceDetailsError, setServiceDetailsError] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClientId, setEditingClientId] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientDetailsLoading, setClientDetailsLoading] = useState(false);
  const [clientDetailsError, setClientDetailsError] = useState<string | null>(null);
  const [clientForm, setClientForm] = useState({
    code: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    idType: 'cni',
    nationality: '',
    vipStatus: false,
    status: 'active'
  });
  const [showPersonnelForm, setShowPersonnelForm] = useState(false);
  const [editingPersonnelId, setEditingPersonnelId] = useState<string | null>(null);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [personnelDetailsLoading, setPersonnelDetailsLoading] = useState(false);
  const [personnelDetailsError, setPersonnelDetailsError] = useState<string | null>(null);
  const [personnelForm, setPersonnelForm] = useState({
    employeeNumber: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    status: 'active'
  });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    code: '',
    name: '',
    description: '',
    category: 'other',
    price: 0,
    unit: 'flat_rate',
    status: 'active'
  });
  const [showDepotForm, setShowDepotForm] = useState(false);
  const [editingDepotId, setEditingDepotId] = useState<string | null>(null);
  const [detailsDepot, setDetailsDepot] = useState<StorageDepot | null>(null);
  const [depotSaving, setDepotSaving] = useState(false);
  const [depotError, setDepotError] = useState<string | null>(null);
  const DEFAULT_DEPOT_FORM = {
    code: '',
    name: '',
    location: '',
    capacity: 0,
    currentOccupancy: 0,
    manager: '',
    securityLevel: 'medium' as 'low' | 'medium' | 'high',
    status: 'active' as 'active' | 'inactive'
  };
  const [depotForm, setDepotForm] = useState(DEFAULT_DEPOT_FORM);
  const [showBeverageForm, setShowBeverageForm] = useState(false);
  const [editingBeverageId, setEditingBeverageId] = useState<string | null>(null);
  const [beverageForm, setBeverageForm] = useState({
    code: '',
    name: '',
    category: 'non_alcoholic' as 'alcoholic' | 'non_alcoholic' | 'hot' | 'cold',
    brand: '',
    volume: 0,
    unit: 'ml',
    unitCost: 0,
    sellingPrice: 0,
    supplierName: '',
    status: 'active' as 'active' | 'discontinued'
  });
  const [detailsBeverage, setDetailsBeverage] = useState<Beverage | null>(null);
  const [detailsDish, setDetailsDish] = useState<Dish | null>(null);
  const [detailsTransaction, setDetailsTransaction] = useState<Transaction | null>(null);
  const [detailsJournalEntry, setDetailsJournalEntry] = useState<JournalEntry | null>(null);
  const [showDishForm, setShowDishForm] = useState(false);
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishForm, setDishForm] = useState({
    code: '',
    name: '',
    description: '',
    categoryName: '',
    price: 0,
    preparationTime: 0,
    isAvailable: true
  });
  const [drinks, setDrinks] = useState<Drink[]>([
    {
      id: '1',
      code: 'DRK-001',
      name: 'Jus d\'orange frais',
      category: 'non_alcoholic',
      type: 'Fruit juice',
      volume: 250,
      unit: 'ml',
      unitCost: 500,
      sellingPrice: 800,
      supplierId: '1',
      supplierName: 'Fournisseur Alimentaire SA',
      status: 'active',
      createdAt: new Date('2024-04-10'),
      createdBy: 'Admin'
    }
  ]);
  const [showDrinkForm, setShowDrinkForm] = useState(false);
  const [editingDrinkId, setEditingDrinkId] = useState<string | null>(null);
  const [drinkForm, setDrinkForm] = useState({
    code: '',
    name: '',
    category: 'non_alcoholic' as 'alcoholic' | 'non_alcoholic' | 'hot' | 'cold',
    type: '',
    volume: 0,
    unit: 'ml',
    unitCost: 0,
    sellingPrice: 0,
    supplierName: '',
    status: 'active' as 'active' | 'discontinued'
  });
  const [detailsDrink, setDetailsDrink] = useState<Drink | null>(null);

  const [dishTypes, setDishTypes] = useState<DishType[]>([
    {
      id: '1',
      code: 'CAT-001',
      name: 'Plats principaux',
      description: 'Plats principaux du restaurant',
      status: 'active',
      createdAt: new Date('2024-04-10'),
      createdBy: 'Admin'
    }
  ]);
  const [showDishTypeForm, setShowDishTypeForm] = useState(false);
  const [editingDishTypeId, setEditingDishTypeId] = useState<string | null>(null);
  const [dishTypeForm, setDishTypeForm] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive'
  });

  const handleDrinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const drink: Drink = { ...drinkForm, id: editingDrinkId ?? Date.now().toString(), supplierId: '', createdAt: new Date(), createdBy: 'Admin' };
    setDrinks((items) => editingDrinkId ? items.map((item) => item.id === editingDrinkId ? drink : item) : [drink, ...items]);
    setEditingDrinkId(null);
    setDrinkForm({ code: '', name: '', category: 'non_alcoholic', type: '', volume: 0, unit: 'ml', unitCost: 0, sellingPrice: 0, supplierName: '', status: 'active' });
    setShowDrinkForm(false);
  };

  const handleDrinkEdit = (drink: Drink) => {
    setEditingDrinkId(drink.id);
    setDrinkForm({ code: drink.code, name: drink.name, category: drink.category, type: drink.type, volume: drink.volume, unit: drink.unit, unitCost: drink.unitCost, sellingPrice: drink.sellingPrice, supplierName: drink.supplierName, status: drink.status });
    setShowDrinkForm(true);
  };

  const handleDishTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dishType: DishType = { ...dishTypeForm, id: editingDishTypeId ?? Date.now().toString(), createdAt: new Date(), createdBy: 'Admin' };
    setDishTypes((items) => editingDishTypeId ? items.map((item) => item.id === editingDishTypeId ? dishType : item) : [dishType, ...items]);
    setEditingDishTypeId(null);
    setDishTypeForm({ code: '', name: '', description: '', status: 'active' });
    setShowDishTypeForm(false);
  };

  const handleDishTypeEdit = (dishType: DishType) => {
    setEditingDishTypeId(dishType.id);
    setDishTypeForm({ code: dishType.code, name: dishType.name, description: dishType.description, status: dishType.status });
    setShowDishTypeForm(true);
  };

  const loadParameters = useCallback(async () => {
    setParametersLoading(true);
    try {
      const data = await parameterApi.list();
      const mapped = data.map((p: any) => ({
        id: String(p.id),
        raisonSociale: p.raisonSociale ?? '',
        activite: p.activite ?? '',
        contact: p.contact ?? '',
        ville: p.ville ?? '',
        niu: p.niu ?? '',
        status: p.status ?? 'active',
        updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
        updatedBy: p.updatedBy ?? 'System'
      }));
      setParameters(mapped);
      if (mapped.length > 0) {
        setParameterForm({
          id: mapped[0].id,
          raisonSociale: mapped[0].raisonSociale,
          activite: mapped[0].activite,
          contact: mapped[0].contact,
          ville: mapped[0].ville,
          niu: mapped[0].niu,
          status: mapped[0].status
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres', error);
    } finally {
      setParametersLoading(false);
    }
  }, []);

  const handleParameterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setParameterSaving(true);
    setParameterFeedback(null);
    try {
      const payload = {
        raisonSociale: parameterForm.raisonSociale,
        activite: parameterForm.activite,
        contact: parameterForm.contact,
        ville: parameterForm.ville,
        niu: parameterForm.niu,
        status: parameterForm.status
      };

      if (parameterForm.id) {
        await parameterApi.update(parameterForm.id, payload);
      } else {
        await parameterApi.create(payload);
      }
      await loadParameters();
      setParameterFeedback({ type: 'success', message: 'Paramètres enregistrés en base de données.' });
    } catch (error) {
      console.error('Erreur lors de l’enregistrement des paramètres', error);
      setParameterFeedback({ type: 'error', message: 'Impossible de sauvegarder les paramètres. Vérifiez la connexion à la base.' });
    } finally {
      setParameterSaving(false);
    }
  };

  const fetchDemoStatus = useCallback(async () => {
    try {
      const response = await api.get('/demo/status');
      if (response.data?.counts) {
        setDemoCounts(response.data.counts);
      }
    } catch {
      /* backend indisponible */
    }
  }, []);

  const handleLoadDemoData = async () => {
    if (!window.confirm(
      'Charger les données de démonstration ?\n\n' +
      '10 lignes seront insérées par module (réservations, visites, stock, finances, commandes bar/restaurant…).\n' +
      'Les données applicatives existantes de ces modules seront remplacées.'
    )) {
      return;
    }
    setDemoSeeding(true);
    setDemoFeedback(null);
    try {
      const response = await api.post('/demo/seed');
      setDemoCounts(response.data?.counts ?? null);
      setDemoFeedback({
        type: 'success',
        message: response.data?.message ?? 'Données démo chargées avec succès.'
      });
    } catch (error) {
      console.error('Erreur chargement données démo', error);
      setDemoFeedback({
        type: 'error',
        message: 'Impossible de charger les données démo. Vérifiez que MySQL et le backend sont démarrés.'
      });
    } finally {
      setDemoSeeding(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'parametrage') {
      fetchDemoStatus();
    }
  }, [activeTab, fetchDemoStatus]);

  const loadRoomTypes = useCallback(async () => {
    setRoomTypesLoading(true);
    try {
      const data = await roomTypeApi.list();
      setRoomTypes(data.map((rt: any) => ({
        id: String(rt.id), code: rt.code ?? '', name: rt.name ?? '', description: rt.description ?? '',
        capacity: rt.capacity ?? 0, basePrice: rt.basePrice ?? 0, amenities: rt.amenities ?? [],
        status: rt.status ?? 'active', floor: rt.floor ?? 1, createdAt: new Date(), createdBy: rt.createdBy ?? 'System'
      })));
      clearLoadError('roomTypes');
    } catch (error) { reportLoadError('roomTypes', error); }
    finally { setRoomTypesLoading(false); }
  }, []);

  const loadRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const data = await paramRoomApi.list();
      setRooms(data.map((r: any) => ({
        id: String(r.id), number: r.number ?? '', roomTypeId: String(r.roomTypeId ?? ''),
        roomTypeName: r.roomTypeName ?? 'Standard', floor: r.floor ?? 1,
        status: r.status ?? 'available', cleaningStatus: r.cleaningStatus ?? 'clean',
        lastCleaned: r.lastCleaned ? new Date(r.lastCleaned) : undefined,
        notes: r.notes, createdAt: new Date(), createdBy: r.createdBy ?? 'System'
      })));
      clearLoadError('rooms');
    } catch (error) { reportLoadError('rooms', error); }
    finally { setRoomsLoading(false); }
  }, []);

  const loadClients = useCallback(async () => {
    setClientsLoading(true);
    try {
      const data = await paramClientApi.list();
      setClients(data.map((c: any) => ({
        id: String(c.id), code: c.code ?? '', firstName: c.firstName ?? '', lastName: c.lastName ?? '',
        email: c.email ?? '', phone: c.phone ?? '', address: c.address ?? '',
        idNumber: c.idNumber ?? '', idType: c.idType ?? 'cni', nationality: c.nationality ?? '',
        dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth) : new Date(),
        vipStatus: c.vipStatus ?? false, preferences: c.preferences ?? [],
        status: c.status ?? 'active', createdAt: new Date(), createdBy: c.createdBy ?? 'System'
      })));
      clearLoadError('clients');
    } catch (error) { reportLoadError('clients', error); }
    finally { setClientsLoading(false); }
  }, []);

  const mapClient = (c: any): Client => {
    const preferences = Array.isArray(c.preferences)
      ? c.preferences
      : typeof c.preferences === 'string' && c.preferences.trim()
        ? c.preferences.split(',').map((item: string) => item.trim()).filter(Boolean)
        : [];

    return {
      id: String(c.id),
      code: c.code ?? '',
      firstName: c.firstName ?? '',
      lastName: c.lastName ?? '',
      email: c.email ?? '',
      phone: c.phone ?? '',
      address: c.address ?? '',
      idNumber: c.idNumber ?? '',
      idType: c.idType ?? 'cni',
      nationality: c.nationality ?? '',
      dateOfBirth: c.dateOfBirth ? new Date(c.dateOfBirth) : new Date(),
      vipStatus: c.vipStatus ?? false,
      preferences,
      status: c.status ?? 'active',
      createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
      createdBy: c.createdBy ?? 'System'
    };
  };

  const loadPersonnel = useCallback(async () => {
    setPersonnelLoading(true);
    try {
      const data = await personnelApi.list();
      setPersonnel(data.map(mapPersonnel));
      clearLoadError('personnel');
    } catch (error) { reportLoadError('personnel', error); }
    finally { setPersonnelLoading(false); }
  }, []);

  const mapPersonnel = (p: any): Personnel => ({
    id: String(p.id),
    employeeNumber: p.employeeNumber ?? '',
    firstName: p.firstName ?? '',
    lastName: p.lastName ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    position: p.position ?? '',
    department: p.department ?? '',
    hireDate: p.hireDate ? new Date(p.hireDate) : new Date(),
    salary: Number(p.salary ?? 0),
    status: p.status ?? 'active',
    permissions: Array.isArray(p.permissions) ? p.permissions : [],
    createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
    createdBy: p.createdBy ?? 'System'
  });

  const mapSupplier = (f: any): Supplier => ({
    id: String(f.id),
    code: f.code ?? '',
    name: f.name ?? '',
    contactPerson: f.contactPerson ?? '',
    email: f.email ?? '',
    phone: f.phone ?? '',
    address: f.address ?? '',
    category: f.category ?? 'Général',
    paymentTerms: f.paymentTerms ?? 'Comptant',
    taxId: f.taxId ?? '',
    rating: f.rating ?? 5,
    isActive: f.status === 'active',
    createdAt: f.createdAt ? new Date(f.createdAt) : new Date(),
    createdBy: f.createdBy ?? 'System'
  });

  const loadSuppliers = useCallback(async () => {
    setSuppliersLoading(true);
    try {
      const data = await paramSupplierApi.list();
      setSuppliers(data.map(mapSupplier));
      clearLoadError('suppliers');
    } catch (error) { reportLoadError('suppliers', error); }
    finally { setSuppliersLoading(false); }
  }, []);

  const mapService = (s: any): Service => ({
    id: String(s.id),
    code: s.code ?? '',
    name: s.name ?? '',
    description: s.description ?? '',
    category: s.category ?? 'other',
    price: s.price ?? 0,
    unit: s.unit ?? 'flat_rate',
    isActive: s.status === 'active',
    createdAt: s.createdAt ? new Date(s.createdAt) : new Date(),
    createdBy: s.createdBy ?? 'System'
  });

  const loadServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const data = await paramServiceApi.list();
      setServices(data.map(mapService));
      clearLoadError('services');
    } catch (error) { reportLoadError('services', error); }
    finally { setServicesLoading(false); }
  }, []);

  const loadCashRegisters = useCallback(async () => {
    setCashRegistersLoading(true);
    try {
      const data = await cashRegisterApi.list();
      setCashRegisters(data.map((cr: any) => ({
        id: String(cr.id), code: cr.code ?? '', name: cr.name ?? '', location: cr.location ?? '',
        openingBalance: cr.openingBalance ?? 0, currency: cr.currency ?? 'XAF',
        status: cr.status ?? 'active', responsiblePerson: cr.responsiblePerson ?? '',
        createdAt: new Date(), createdBy: cr.createdBy ?? 'System'
      })));
      clearLoadError('cashRegisters');
    } catch (error) { reportLoadError('cashRegisters', error); }
    finally { setCashRegistersLoading(false); }
  }, []);

  useEffect(() => {
    loadParameters();
    loadRoomTypes();
    loadRooms();
    loadClients();
    loadPersonnel();
    loadSuppliers();
    loadServices();
    loadCashRegisters();
  }, []);

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const supplierPayload = {
        code: supplierForm.numero,
        name: supplierForm.nom,
        contactPerson: supplierForm.contact
      };

      if (editingSupplierId) {
        await paramSupplierApi.update(editingSupplierId, supplierPayload);
      } else {
        await paramSupplierApi.create(supplierPayload);
      }

      await loadSuppliers();
      setShowSupplierForm(false);
      setEditingSupplierId(null);
      setSupplierForm({ numero: '', nom: '', contact: '', solde: 0 });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du fournisseur", error);
    }
  };

  const handleSupplierDetails = async (supplier: Supplier) => {
    setSupplierDetailsError(null);
    setSupplierDetailsLoading(true);
    try {
      const freshSupplier = await paramSupplierApi.get(supplier.id);
      setSelectedSupplier(mapSupplier(freshSupplier));
    } catch (error) {
      console.error("Erreur lors du chargement des détails du fournisseur", error);
      setSupplierDetailsError("Impossible de charger les détails actualisés de ce fournisseur.");
      setSelectedSupplier(supplier);
    } finally {
      setSupplierDetailsLoading(false);
    }
  };

  const handleSupplierEdit = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierForm({
      numero: supplier.code,
      nom: supplier.name,
      contact: supplier.contactPerson,
      solde: 0
    });
    setShowSupplierForm(true);
  };

  const handleSupplierDelete = async (supplierId: string) => {
    try {
      await paramSupplierApi.delete(supplierId);
      await loadSuppliers();
    } catch (error) {
      console.error("Erreur lors de la suppression du fournisseur", error);
    }
  };

  const handleCashRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: cashRegisterForm.code,
        name: cashRegisterForm.name,
        location: cashRegisterForm.location,
        openingBalance: cashRegisterForm.openingBalance,
        currency: cashRegisterForm.currency,
        status: cashRegisterForm.status,
        responsiblePerson: cashRegisterForm.responsiblePerson
      };

      if (editingCashRegisterId) {
        await cashRegisterApi.update(editingCashRegisterId, payload);
      } else {
        await cashRegisterApi.create(payload);
      }

      await loadCashRegisters();
      setShowCashRegisterForm(false);
      setEditingCashRegisterId(null);
      setCashRegisterForm({
        code: '',
        name: '',
        location: '',
        openingBalance: 0,
        currency: 'XAF',
        status: 'active',
        responsiblePerson: ''
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la caisse", error);
    }
  };

  const handleCashRegisterEdit = (register: CashRegister) => {
    setEditingCashRegisterId(register.id);
    setCashRegisterForm({
      code: register.code,
      name: register.name,
      location: register.location ?? '',
      openingBalance: register.openingBalance ?? 0,
      currency: register.currency ?? 'XAF',
      status: register.status ?? 'active',
      responsiblePerson: register.responsiblePerson ?? ''
    });
    setShowCashRegisterForm(true);
  };

  const handleCashRegisterDelete = async (registerId: string) => {
    try {
      await cashRegisterApi.delete(registerId);
      await loadCashRegisters();
    } catch (error) {
      console.error("Erreur lors de la suppression de la caisse", error);
    }
  };

  const resetClientForm = () => {
    setEditingClientId(null);
    setClientForm({ code: '', firstName: '', lastName: '', email: '', phone: '', address: '', idNumber: '', idType: 'cni', nationality: '', vipStatus: false, status: 'active' });
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...clientForm, dateOfBirth: new Date().toISOString().slice(0, 10) };
    if (editingClientId) {
      await paramClientApi.update(editingClientId, payload as any);
    } else {
      await paramClientApi.create(payload as any);
    }
    await loadClients();
    resetClientForm();
    setShowClientForm(false);
  };

  const handleClientEdit = (client: Client) => {
    setEditingClientId(client.id);
    setClientForm({
      code: client.code,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      idNumber: client.idNumber,
      idType: client.idType,
      nationality: client.nationality,
      vipStatus: client.vipStatus,
      status: client.status
    });
    setShowClientForm(true);
  };

  const handleClientDetails = async (client: Client) => {
    setSelectedClient(client);
    setClientDetailsError(null);
    setClientDetailsLoading(true);

    try {
      const freshClient = await paramClientApi.get(client.id);
      setSelectedClient(mapClient(freshClient));
    } catch (error) {
      console.error('Erreur lors du chargement du client', error);
      setClientDetailsError("Impossible de charger les details actualises de ce client.");
    } finally {
      setClientDetailsLoading(false);
    }
  };

  const handleClientDelete = async (clientId: string) => {
    await paramClientApi.delete(clientId);
    if (selectedClient?.id === clientId) {
      setSelectedClient(null);
    }
    await loadClients();
  };

  const resetPersonnelForm = () => {
    setEditingPersonnelId(null);
    setPersonnelForm({ employeeNumber: '', firstName: '', lastName: '', email: '', phone: '', position: '', department: '', salary: 0, status: 'active' });
  };

  const handlePersonnelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...personnelForm, hireDate: new Date().toISOString().slice(0, 10) };
    if (editingPersonnelId) {
      await personnelApi.update(editingPersonnelId, payload as any);
    } else {
      await personnelApi.create(payload as any);
    }
    await loadPersonnel();
    resetPersonnelForm();
    setShowPersonnelForm(false);
  };

  const handlePersonnelEdit = (person: Personnel) => {
    setEditingPersonnelId(person.id);
    setPersonnelForm({
      employeeNumber: person.employeeNumber,
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      position: person.position,
      department: person.department,
      salary: person.salary,
      status: person.status
    });
    setShowPersonnelForm(true);
  };

  const handlePersonnelDetails = async (person: Personnel) => {
    setSelectedPersonnel(person);
    setPersonnelDetailsError(null);
    setPersonnelDetailsLoading(true);

    try {
      const freshPerson = await personnelApi.get(person.id);
      setSelectedPersonnel(mapPersonnel(freshPerson));
    } catch (error) {
      console.error('Erreur lors du chargement du personnel', error);
      setPersonnelDetailsError("Impossible de charger les details actualises de cet employe.");
    } finally {
      setPersonnelDetailsLoading(false);
    }
  };

  const handlePersonnelDelete = async (personId: string) => {
    await personnelApi.delete(personId);
    if (selectedPersonnel?.id === personId) {
      setSelectedPersonnel(null);
    }
    await loadPersonnel();
  };

  const resetServiceForm = () => {
    setEditingServiceId(null);
    setServiceForm({ code: '', name: '', description: '', category: 'other', price: 0, unit: 'flat_rate', status: 'active' });
  };

  const handleServiceDetails = async (service: Service) => {
    setServiceDetailsError(null);
    setServiceDetailsLoading(true);
    try {
      const freshService = await paramServiceApi.get(service.id);
      setSelectedService(mapService(freshService));
    } catch (error) {
      console.error("Erreur lors du chargement des détails du service", error);
      setServiceDetailsError("Impossible de charger les détails actualisés de ce service.");
      setSelectedService(service);
    } finally {
      setServiceDetailsLoading(false);
    }
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingServiceId) {
      await paramServiceApi.update(editingServiceId, serviceForm as any);
    } else {
      await paramServiceApi.create(serviceForm as any);
    }
    await loadServices();
    resetServiceForm();
    setShowServiceForm(false);
  };

  const handleServiceEdit = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceForm({
      code: service.code,
      name: service.name,
      description: service.description,
      category: service.category,
      price: service.price,
      unit: service.unit,
      status: service.isActive ? 'active' : 'inactive'
    });
    setShowServiceForm(true);
  };

  const handleServiceDelete = async (serviceId: string) => {
    try {
      await paramServiceApi.delete(serviceId);
      await loadServices();
      if (selectedService?.id === serviceId) {
        setSelectedService(null);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du service", error);
    }
  };

  const handleDepotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const depot: StorageDepot = { ...depotForm, id: editingDepotId ?? Date.now().toString(), temperature: undefined, humidity: undefined, createdAt: new Date(), createdBy: 'Admin' };
    setStorageDepots((items) => editingDepotId ? items.map((item) => item.id === editingDepotId ? depot : item) : [depot, ...items]);
    setEditingDepotId(null);
    setDepotForm({ code: '', name: '', location: '', capacity: 0, currentOccupancy: 0, manager: '', securityLevel: 'medium', status: 'active' });
    setShowDepotForm(false);
  };

  const handleDepotEdit = (depot: StorageDepot) => {
    setEditingDepotId(depot.id);
    setDepotForm({ code: depot.code, name: depot.name, location: depot.location, capacity: depot.capacity, currentOccupancy: depot.currentOccupancy, manager: depot.manager, securityLevel: depot.securityLevel, status: depot.status });
    setShowDepotForm(true);
  };

  const handleBeverageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const beverage: Beverage = { ...beverageForm, id: editingBeverageId ?? Date.now().toString(), alcoholPercentage: undefined, supplierId: '', createdAt: new Date(), createdBy: 'Admin' };
    setBeverages((items) => editingBeverageId ? items.map((item) => item.id === editingBeverageId ? beverage : item) : [beverage, ...items]);
    setEditingBeverageId(null);
    setBeverageForm({ code: '', name: '', category: 'non_alcoholic', brand: '', volume: 0, unit: 'ml', unitCost: 0, sellingPrice: 0, supplierName: '', status: 'active' });
    setShowBeverageForm(false);
  };

  const handleBeverageEdit = (beverage: Beverage) => {
    setEditingBeverageId(beverage.id);
    setBeverageForm({ code: beverage.code, name: beverage.name, category: beverage.category, brand: beverage.brand, volume: beverage.volume, unit: beverage.unit, unitCost: beverage.unitCost, sellingPrice: beverage.sellingPrice, supplierName: beverage.supplierName, status: beverage.status });
    setShowBeverageForm(true);
  };

  const handleDishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dish: Dish = { ...dishForm, id: editingDishId ?? Date.now().toString(), categoryId: '', ingredients: [], allergens: [], isVegetarian: false, isVegan: false, status: dishForm.isAvailable ? 'active' : 'inactive', createdAt: new Date(), createdBy: 'Admin' };
    setDishes((items) => editingDishId ? items.map((item) => item.id === editingDishId ? dish : item) : [dish, ...items]);
    setEditingDishId(null);
    setDishForm({ code: '', name: '', description: '', categoryName: '', price: 0, preparationTime: 0, isAvailable: true });
    setShowDishForm(false);
  };

  const handleDishEdit = (dish: Dish) => {
    setEditingDishId(dish.id);
    setDishForm({ code: dish.code, name: dish.name, description: dish.description, categoryName: dish.categoryName, price: dish.price, preparationTime: dish.preparationTime, isAvailable: dish.isAvailable });
    setShowDishForm(true);
  };

  const filteredRooms = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rooms;
    return rooms.filter((room) =>
      room.number.toLowerCase().includes(term) ||
      room.roomTypeName.toLowerCase().includes(term)
    );
  }, [rooms, searchTerm]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const resetRoomTypeForm = () => {
    setEditingRoomTypeId(null);
    setRoomTypeForm({
      code: '',
      name: '',
      basePrice: '',
      description: '',
      capacity: '1',
      status: 'active'
    });
    setRoomTypeFeedback(null);
  };

  const openNewRoomTypeForm = () => {
    resetRoomTypeForm();
    setShowRoomTypeForm(true);
  };

  const handleRoomTypeEdit = (type: RoomType) => {
    setEditingRoomTypeId(type.id);
    setRoomTypeForm({
      code: type.code,
      name: type.name,
      basePrice: String(type.basePrice ?? 0),
      description: type.description ?? '',
      capacity: String(type.capacity || 1),
      status: type.status ?? 'active'
    });
    setRoomTypeFeedback(null);
    setShowRoomTypeForm(true);
  };

  const handleRoomTypeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = roomTypeForm.code.trim();
    const name = roomTypeForm.name.trim();

    if (!code || !name) {
      setRoomTypeFeedback({ type: 'error', message: 'Renseignez le code et le nom du type de chambre.' });
      return;
    }

    setRoomTypeSaving(true);
    setRoomTypeFeedback(null);
    try {
      const isEditing = Boolean(editingRoomTypeId);
      const payload = {
        code,
        name,
        description: roomTypeForm.description.trim(),
        capacity: Number(roomTypeForm.capacity) || 1,
        basePrice: Number(roomTypeForm.basePrice) || 0,
        status: roomTypeForm.status
      };

      if (editingRoomTypeId) {
        await roomTypeApi.update(editingRoomTypeId, payload);
      } else {
        await roomTypeApi.create(payload);
      }

      await loadRoomTypes();
      resetRoomTypeForm();
      setShowRoomTypeForm(false);
      setRoomTypeFeedback({
        type: 'success',
        message: isEditing ? 'Type de chambre modifie avec succes.' : 'Type de chambre cree avec succes.'
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du type de chambre", error);
      setRoomTypeFeedback({ type: 'error', message: "Impossible d'enregistrer le type de chambre." });
    } finally {
      setRoomTypeSaving(false);
    }
  };

  const handleRoomTypeDelete = async (typeId: string) => {
    setRoomTypeSaving(true);
    setRoomTypeFeedback(null);
    try {
      await roomTypeApi.delete(typeId);
      if (chambreForm.typeId === typeId) {
        setChambreForm({ ...chambreForm, typeId: '' });
      }
      await loadRoomTypes();
      setRoomTypeFeedback({ type: 'success', message: 'Type de chambre supprime avec succes.' });
    } catch (error) {
      console.error('Erreur lors de la suppression du type de chambre', error);
      setRoomTypeFeedback({
        type: 'error',
        message: 'Impossible de supprimer ce type. Verifiez qu aucune chambre ne l utilise.'
      });
    } finally {
      setRoomTypeSaving(false);
    }
  };

  const resetChambreForm = () => {
    setSelectedRoomId(null);
    setChambreForm({ code: '', typeId: '' });
    setRoomFeedback(null);
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoomId(room.id);
    setChambreForm({ code: room.number, typeId: room.roomTypeId });
    setRoomFeedback(null);
  };

  const handleRoomSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chambreForm.code.trim() || !chambreForm.typeId) {
      setRoomFeedback({ type: 'error', message: 'Renseignez le code et le type de chambre.' });
      return;
    }

    setRoomSaving(true);
    setRoomFeedback(null);
    try {
      const payload = {
        number: chambreForm.code.trim(),
        roomTypeId: chambreForm.typeId,
        floor: 1,
        status: selectedRoom?.status ?? 'available',
        cleaningStatus: selectedRoom?.cleaningStatus ?? 'clean',
        notes: selectedRoom?.notes ?? ''
      };

      const successMessage = selectedRoomId
        ? 'Chambre modifiee avec succes.'
        : 'Chambre enregistree avec succes.';

      if (selectedRoomId) {
        await paramRoomApi.update(selectedRoomId, payload);
      } else {
        await paramRoomApi.create(payload);
      }

      await loadRooms();
      resetChambreForm();
      setRoomFeedback({ type: 'success', message: successMessage });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la chambre", error);
      setRoomFeedback({ type: 'error', message: "Impossible d'enregistrer la chambre." });
    } finally {
      setRoomSaving(false);
    }
  };

  const handleRoomDelete = async () => {
    if (!selectedRoomId) {
      setRoomFeedback({ type: 'error', message: 'Selectionnez une chambre a supprimer.' });
      return;
    }

    setRoomSaving(true);
    setRoomFeedback(null);
    try {
      await paramRoomApi.delete(selectedRoomId);
      await loadRooms();
      resetChambreForm();
      setRoomFeedback({ type: 'success', message: 'Chambre supprimee avec succes.' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la chambre', error);
      setRoomFeedback({ type: 'error', message: 'Impossible de supprimer la chambre.' });
    } finally {
      setRoomSaving(false);
    }
  };

  const [storageDepots, setStorageDepots] = useState<StorageDepot[]>([
    {
      id: '1',
      code: 'DEP-001',
      name: 'Dépot Principal',
      location: 'Sous-sol',
      capacity: 1000,
      currentOccupancy: 750,
      manager: 'Chef de stock',
      temperature: 18,
      humidity: 60,
      securityLevel: 'high',
      status: 'active',
      createdAt: new Date('2024-04-10'),
      createdBy: 'Admin'
    }
  ]);

  const [beverages, setBeverages] = useState<Beverage[]>([
    {
      id: '1',
      code: 'BEV-001',
      name: 'Bière Castel',
      category: 'alcoholic',
      brand: 'Castel',
      volume: 650,
      unit: 'ml',
      unitCost: 1000,
      sellingPrice: 1500,
      alcoholPercentage: 5.5,
      supplierId: '1',
      supplierName: 'Boissons du Cameroun',
      status: 'active',
      createdAt: new Date('2024-04-10'),
      createdBy: 'Admin'
    }
  ]);

  const [dishes, setDishes] = useState<Dish[]>([
    {
      id: '1',
      code: 'DISH-001',
      name: 'Poulet DG',
      description: 'Poulet sauce tomate avec légumes',
      categoryId: 'CAT-001',
      categoryName: 'Plats principaux',
      price: 12000,
      preparationTime: 25,
      ingredients: ['Poulet', 'Tomate', 'Oignon', 'Ail', 'Huile'],
      allergens: ['Gluten'],
      isAvailable: true,
      isVegetarian: false,
      isVegan: false,
      status: 'active',
      createdAt: new Date('2024-04-10'),
      createdBy: 'Admin'
    }
  ]);


  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const normalizeTransactionType = (rawType: string): Transaction['type'] => {
    const type = rawType.toLowerCase();
    if (type.includes('vente') || type.includes('sale') || type.includes('recette')) return 'sale';
    if (type.includes('achat') || type.includes('purchase')) return 'purchase';
    if (type.includes('depense') || type.includes('dépense') || type.includes('expense')) return 'expense';
    if (type.includes('transfert') || type.includes('transfer')) return 'transfer';
    return 'adjustment';
  };

  const loadTransactions = useCallback(async () => {
    try {
      const response = await api.get('/finances/transactions');
      const mapped: Transaction[] = (Array.isArray(response.data) ? response.data : []).map((t: any) => ({
        id: String(t.id),
        reference: t.reference || `TRX-${t.id}`,
        type: normalizeTransactionType(t.type || ''),
        category: t.category || 'Divers',
        description: t.description || '',
        amount: Number(t.amount) || 0,
        currency: 'XAF',
        date: new Date(t.transactionDate),
        createdBy: 'Système',
        status: 'completed'
      }));
      setTransactions(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions', error);
    }
  }, []);

  const loadJournalEntries = useCallback(async () => {
    try {
      const response = await api.get('/accounting/sqlite/operations');
      const rows = Array.isArray(response.data) ? response.data : [];
      let runningBalance = 0;
      const mapped: JournalEntry[] = rows.map((op: any) => {
        const debit = Number(op.debit) || 0;
        const credit = Number(op.credit) || 0;
        runningBalance += credit - debit;
        return {
          id: String(op.codeOperation),
          reference: `JE-${op.codeOperation}`,
          date: new Date(op.dateOperation),
          account: op.libelleCompte || op.numcompte || 'N/A',
          accountNumber: op.numcompte || '',
          description: op.libelle || '',
          debit,
          credit,
          balance: runningBalance,
          category: op.codeJournal || 'Divers',
          createdBy: 'Système Comptable',
          status: 'posted'
        };
      });
      setJournalEntries(mapped);
    } catch (error) {
      console.error('Erreur lors du chargement des journaux comptables', error);
    }
  }, []);

  useEffect(() => {
    void loadTransactions();
    void loadJournalEntries();
  }, [loadTransactions, loadJournalEntries]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesDate = !filterDate || t.date.toISOString().slice(0, 10) === filterDate;
      const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchesDate && matchesCategory;
    });
  }, [transactions, filterDate, filterCategory]);

  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      const matchesDate = !filterDate || entry.date.toISOString().slice(0, 10) === filterDate;
      const matchesCategory = filterCategory === 'all' || entry.category === filterCategory;
      return matchesDate && matchesCategory;
    });
  }, [journalEntries, filterDate, filterCategory]);

  const exportToCsv = (filename: string, rows: Record<string, string | number>[]) => {
    if (rows.length === 0) return;
    const csvContent = [
      Object.keys(rows[0]).join(','),
      ...rows.map((row) => Object.values(row).map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTransactionsCsv = () => {
    exportToCsv(`transactions_${new Date().toISOString().slice(0, 10)}.csv`, filteredTransactions.map((t) => ({
      Reference: t.reference,
      Type: t.type,
      Categorie: t.category,
      Description: t.description,
      Montant: t.amount,
      Devise: t.currency,
      Date: t.date.toLocaleDateString('fr-FR'),
      Statut: t.status
    })));
  };

  const exportJournalCsv = () => {
    exportToCsv(`journaux_comptables_${new Date().toISOString().slice(0, 10)}.csv`, filteredJournalEntries.map((entry) => ({
      Reference: entry.reference,
      Date: entry.date.toLocaleDateString('fr-FR'),
      Compte: entry.account,
      Description: entry.description,
      Debit: entry.debit,
      Credit: entry.credit,
      Solde: entry.balance,
      Categorie: entry.category,
      Statut: entry.status
    })));
  };

  const tabIcons: Record<string, React.ReactNode> = {
    parametrage: <FaCog className="h-4 w-4" aria-hidden="true" />,
    type_chambre: <FaBed className="h-4 w-4" aria-hidden="true" />,
    chambre: <FaHotel className="h-4 w-4" aria-hidden="true" />,
    client: <FaUser className="h-4 w-4" aria-hidden="true" />,
    personnel: <FaUsers className="h-4 w-4" aria-hidden="true" />,
    fournisseur: <FaTruck className="h-4 w-4" aria-hidden="true" />,
    service: <FaConciergeBell className="h-4 w-4" aria-hidden="true" />,
    caisse: <FaCashRegister className="h-4 w-4" aria-hidden="true" />,
    depot_stockage: <FaWarehouse className="h-4 w-4" aria-hidden="true" />,
    boisson: <FaGlassMartiniAlt className="h-4 w-4" aria-hidden="true" />,
    plat: <FaUtensils className="h-4 w-4" aria-hidden="true" />,
    vivre: <FaWineGlass className="h-4 w-4" aria-hidden="true" />,
    type_plat: <FaListAlt className="h-4 w-4" aria-hidden="true" />,
    transactions: <FaExchangeAlt className="h-4 w-4" aria-hidden="true" />,
    journaux: <FaBookOpen className="h-4 w-4" aria-hidden="true" />
  };

  const tabs = [
    { key: 'parametrage', label: 'Paramétrage', description: 'Configurez les paramètres généraux du système' },
    { key: 'type_chambre', label: 'Type de chambre', description: 'Gérez les types de chambres et leurs caractéristiques' },
    { key: 'chambre', label: 'Chambre', description: 'Gérez les chambres individuelles et leur statut' },
    { key: 'client', label: 'Client', description: 'Gérez la base de données des clients' },
    { key: 'personnel', label: 'Personnel', description: 'Gérez les employés et leurs accès' },
    { key: 'fournisseur', label: 'Fournisseur', description: 'Gérez les fournisseurs et leurs informations' },
    { key: 'service', label: 'Service', description: 'Définissez les services offerts par l\'hôtel' },
    { key: 'caisse', label: 'Caisse', description: 'Configurez les caisses et leurs paramètres' },
    { key: 'depot_stockage', label: 'Dépot de stockage', description: 'Gérez les entrepôts et zones de stockage' },
    { key: 'boisson', label: 'Boisson', description: 'Gérez le catalogue des boissons' },
    { key: 'plat', label: 'Plat', description: 'Gérez le catalogue des plats du restaurant' },
    { key: 'vivre', label: 'Vivre', description: 'Gérez le catalogue des boissons et rafraîchissements' },
    { key: 'type_plat', label: 'Type de plat', description: 'Définissez les catégories de plats' },
    { key: 'transactions', label: 'Transactions', description: 'Suivez toutes les transactions financières' },
    { key: 'journaux', label: 'Journaux', description: 'Consultez les journaux comptables' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'inactive': return 'bg-white/50/20 text-gray-400';
      case 'available': return 'bg-green-500/20 text-green-400';
      case 'occupied': return 'bg-blue-500/20 text-blue-400';
      case 'maintenance': return 'bg-orange-500/20 text-orange-400';
      case 'out_of_order': return 'bg-red-500/20 text-red-400';
      case 'clean': return 'bg-green-500/20 text-green-400';
      case 'dirty': return 'bg-red-500/20 text-red-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'approved': return 'bg-green-500/20 text-green-400';
      case 'rejected': return 'bg-red-500/20 text-red-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'on_leave': return 'bg-yellow-500/20 text-yellow-400';
      case 'terminated': return 'bg-red-500/20 text-red-400';
      case 'posted': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-white/50/20 text-gray-400';
      case 'reversed': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'parametrage':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Paramètres entreprise</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Enregistrez les informations de l'entreprise et le régime fiscal.
                  </p>
                </div>
              </div>

              <form onSubmit={handleParameterSubmit} className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Raison sociale</label>
                    <input
                      type="text"
                      required
                      value={parameterForm.raisonSociale}
                      onChange={(e) => setParameterForm({ ...parameterForm, raisonSociale: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Activité</label>
                    <input
                      type="text"
                      value={parameterForm.activite}
                      onChange={(e) => setParameterForm({ ...parameterForm, activite: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Contact</label>
                    <input
                      type="text"
                      value={parameterForm.contact}
                      onChange={(e) => setParameterForm({ ...parameterForm, contact: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Ville</label>
                    <input
                      type="text"
                      value={parameterForm.ville}
                      onChange={(e) => setParameterForm({ ...parameterForm, ville: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">NIU / régime fiscal</label>
                    <input
                      type="text"
                      value={parameterForm.niu}
                      onChange={(e) => setParameterForm({ ...parameterForm, niu: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                    />
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    Dernière mise à jour : {parameters[0]?.updatedAt ? parameters[0].updatedAt.toLocaleDateString('fr-FR') : '—'}
                    {parameters[0]?.updatedBy ? ` par ${parameters[0].updatedBy}` : ''}
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    {parameterFeedback ? (
                      <div className={`rounded-md px-3 py-2 text-sm ${parameterFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-200 border border-rose-500/20'}`}>
                        {parameterFeedback.message}
                      </div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={parameterSaving}
                      className={`inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors ${parameterSaving ? 'cursor-not-allowed opacity-80' : 'hover:bg-blue-700'}`}
                    >
                      <FaSave className="mr-2 h-4 w-4" aria-hidden="true" />
                      {parameterSaving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Données de démonstration</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Chargez 10 enregistrements par module pour tester l&apos;application complète et l&apos;impression des factures (Réception et Bar).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadDemoData}
                  disabled={demoSeeding}
                  className={`inline-flex items-center justify-center rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-colors ${demoSeeding ? 'cursor-not-allowed opacity-80' : 'hover:bg-emerald-700'}`}
                >
                  <FaDatabase className="mr-2 h-4 w-4" aria-hidden="true" />
                  {demoSeeding ? 'Chargement...' : 'Charger les données démo'}
                </button>
              </div>

              {demoFeedback ? (
                <div className={`mb-4 rounded-md px-3 py-2 text-sm ${demoFeedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-200 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-200 border border-rose-500/20'}`}>
                  {demoFeedback.message}
                </div>
              ) : null}

              {demoCounts ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-sm">
                  {Object.entries(demoCounts).map(([key, value]) => (
                    <div key={key} className="rounded-lg border border-gray-700/50 bg-gray-900/40 px-3 py-2">
                      <div className="text-gray-400 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                      <div className="text-white font-semibold">{value}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Connectez le backend pour voir l&apos;état des données.</p>
              )}

              <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                <strong>Test impression facture :</strong> après chargement, allez dans <em>Réception → Impression factures</em> (réservations hébergement) ou <em>Bar → Impression facture</em> (commandes restaurant payées).
              </div>
            </div>
          </div>
        );

      case 'type_chambre':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Types de Chambres</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Gérez les types de chambres et leurs caractéristiques.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openNewRoomTypeForm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouveau type
                </button>
              </div>
              {roomTypeFeedback && (
                <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
                  roomTypeFeedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                }`}>
                  {roomTypeFeedback.message}
                </div>
              )}

              {showRoomTypeForm && (
                <form onSubmit={handleRoomTypeSubmit} className="mb-6 rounded-xl border border-slate-700 bg-slate-950/50 p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-sky-300">
                        {editingRoomTypeId ? 'Modification' : 'Creation'}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">
                        {editingRoomTypeId ? 'Modifier le type de chambre' : 'Nouveau type de chambre'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetRoomTypeForm();
                        setShowRoomTypeForm(false);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-slate-300 transition hover:border-slate-500 hover:text-white"
                      aria-label="Fermer"
                    >
                      <FaTimes className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="room-type-code">Code</label>
                      <input
                        id="room-type-code"
                        type="text"
                        value={roomTypeForm.code}
                        onChange={(event) => setRoomTypeForm({ ...roomTypeForm, code: event.target.value })}
                        placeholder="Ex: STD"
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="room-type-name">Nom</label>
                      <input
                        id="room-type-name"
                        type="text"
                        value={roomTypeForm.name}
                        onChange={(event) => setRoomTypeForm({ ...roomTypeForm, name: event.target.value })}
                        placeholder="Ex: Standard"
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="room-type-price">Prix nuit</label>
                      <input
                        id="room-type-price"
                        type="number"
                        min="0"
                        value={roomTypeForm.basePrice}
                        onChange={(event) => setRoomTypeForm({ ...roomTypeForm, basePrice: event.target.value })}
                        placeholder="0"
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="room-type-capacity">Capacite</label>
                      <input
                        id="room-type-capacity"
                        type="number"
                        min="1"
                        value={roomTypeForm.capacity}
                        onChange={(event) => setRoomTypeForm({ ...roomTypeForm, capacity: event.target.value })}
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="room-type-description">Description</label>
                      <textarea
                        id="room-type-description"
                        rows={3}
                        value={roomTypeForm.description}
                        onChange={(event) => setRoomTypeForm({ ...roomTypeForm, description: event.target.value })}
                        placeholder="Caracteristiques principales du type de chambre"
                        className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      disabled={roomTypeSaving}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaSave className="h-4 w-4" aria-hidden="true" />
                      {roomTypeSaving ? 'Enregistrement...' : editingRoomTypeId ? 'Modifier' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Capacité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix base</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Étage</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {roomTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{type.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.capacity} personnes</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {type.basePrice.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.floor}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(type.status)}`}>
                            {type.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button className="text-blue-400 hover:text-blue-300 mr-2">Détails</button>
                          <button type="button" onClick={() => handleRoomTypeEdit(type)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button type="button" onClick={() => handleRoomTypeDelete(type.id)} disabled={roomTypeSaving} className="text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50">Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'chambre':
        return (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-[#0b1220] shadow-2xl">
              <div className="flex flex-col gap-4 border-b border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/25">
                    <FaHotel className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Chambres</h2>
                    <p className="mt-1 text-sm text-slate-400">Creation et mise a jour des chambres de l'hotel.</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-2">
                    <p className="text-[11px] font-semibold uppercase text-slate-500">Nombre</p>
                    <p className="text-lg font-bold text-white">{rooms.length}</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetChambreForm}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-200 transition hover:border-sky-500/60 hover:text-white"
                  >
                    Nouveau
                  </button>
                </div>
              </div>

              <div className="grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                <div className="min-w-0 rounded-xl border border-slate-700/70 bg-slate-950/45">
                  <div className="flex flex-col gap-3 border-b border-slate-700/70 p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Liste des chambres</h3>
                      <p className="mt-1 text-xs text-slate-500">{filteredRooms.length} resultat(s) affiche(s)</p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Rechercher par code ou type..."
                        className="h-10 w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 !pl-9 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                      <FaListAlt className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[560px] text-left">
                      <thead className="sticky top-0 z-10 bg-slate-950 text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Code</th>
                          <th className="px-4 py-3 font-semibold">Type</th>
                          <th className="px-4 py-3 font-semibold">Statut</th>
                          <th className="px-4 py-3 font-semibold">Nettoyage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {roomsLoading ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                              Chargement des chambres...
                            </td>
                          </tr>
                        ) : filteredRooms.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                              Aucune chambre trouvee.
                            </td>
                          </tr>
                        ) : (
                          filteredRooms.map((room) => (
                            <tr
                              key={room.id}
                              onClick={() => handleRoomSelect(room)}
                              className={`cursor-pointer transition ${
                                selectedRoomId === room.id
                                  ? 'bg-sky-500/15 ring-1 ring-inset ring-sky-500/30'
                                  : 'hover:bg-white/[0.04]'
                              }`}
                            >
                              <td className="px-4 py-3">
                                <span className="font-semibold text-white">{room.number}</span>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-300">{room.roomTypeName || 'Non defini'}</td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(room.status)}`}>
                                  {room.status === 'available' ? 'Disponible' :
                                   room.status === 'occupied' ? 'Occupee' :
                                   room.status === 'maintenance' ? 'Maintenance' : 'Hors service'}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(room.cleaningStatus)}`}>
                                  {room.cleaningStatus === 'clean' ? 'Propre' :
                                   room.cleaningStatus === 'dirty' ? 'A nettoyer' : 'En cours'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <form onSubmit={handleRoomSubmit} className="rounded-xl border border-slate-700/70 bg-slate-950/45">
                  <div className="border-b border-slate-700/70 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
                      {selectedRoomId ? 'Modification' : 'Enregistrement'}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold text-white">
                      {selectedRoomId ? `Chambre ${chambreForm.code}` : 'Nouvelle chambre'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Selectionnez une ligne pour modifier une chambre existante.
                    </p>
                  </div>

                  <div className="space-y-5 p-5">
                    {roomFeedback && (
                      <div className={`rounded-lg border px-4 py-3 text-sm ${
                        roomFeedback.type === 'success'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                      }`}>
                        {roomFeedback.message}
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="chambre-code">Code chambre</label>
                      <input
                        id="chambre-code"
                        type="text"
                        value={chambreForm.code}
                        onChange={(event) => setChambreForm({ ...chambreForm, code: event.target.value })}
                        placeholder="Ex: 101"
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="chambre-type">Type de chambre</label>
                      <select
                        id="chambre-type"
                        value={chambreForm.typeId}
                        onChange={(event) => setChambreForm({ ...chambreForm, typeId: event.target.value })}
                        className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="">Choisir un type</option>
                        {roomTypes.map((type) => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                      {roomTypesLoading && <p className="mt-2 text-xs text-slate-500">Chargement des types...</p>}
                      {!roomTypesLoading && roomTypes.length === 0 && (
                        <p className="mt-2 text-xs text-amber-300">Creez d'abord un type de chambre.</p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          openNewRoomTypeForm();
                          setActiveTab('type_chambre');
                        }}
                        className="mt-3 inline-flex h-9 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 text-xs font-semibold text-sky-200 transition hover:bg-sky-500/20"
                      >
                        Creer un type de chambre
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">Selection</p>
                        <p className="mt-1 truncate text-sm font-semibold text-white">{selectedRoom ? selectedRoom.roomTypeName : 'Aucune'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
                        <p className="text-[11px] font-semibold uppercase text-slate-500">Mode</p>
                        <p className="mt-1 text-sm font-semibold text-white">{selectedRoomId ? 'Edition' : 'Creation'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-700/70 bg-slate-950/70 p-5 sm:flex-row sm:justify-end">
                    <button
                      type="submit"
                      disabled={roomSaving}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-950/30 transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaSave className="h-4 w-4" aria-hidden="true" />
                      {selectedRoomId ? 'Modifier' : 'Enregistrer'}
                    </button>
                    <button
                      type="button"
                      disabled={!selectedRoomId || roomSaving}
                      onClick={handleRoomDelete}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaTrash className="h-4 w-4" aria-hidden="true" />
                      Supprimer
                    </button>
                    <button
                      type="button"
                      onClick={resetChambreForm}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
                    >
                      <FaTimes className="h-4 w-4" aria-hidden="true" />
                      Fermer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        );

      case 'client':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Clients</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez la base de données des clients.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetClientForm();
                      setShowClientForm(true);
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FaUserPlus className="h-4 w-4" aria-hidden="true" />
                    Nouveau client
                  </button>
                </div>
              </div>

              {showClientForm && (
                <div className="mb-6 p-6 border border-gray-700/50 rounded-xl bg-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">{editingClientId ? 'Modifier le client' : 'Ajouter un client'}</h3>
                  <form onSubmit={handleClientSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input required placeholder="Code" value={clientForm.code} onChange={(e) => setClientForm({ ...clientForm, code: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input required placeholder="Prenom" value={clientForm.firstName} onChange={(e) => setClientForm({ ...clientForm, firstName: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input required placeholder="Nom" value={clientForm.lastName} onChange={(e) => setClientForm({ ...clientForm, lastName: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Telephone" value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Nationalite" value={clientForm.nationality} onChange={(e) => setClientForm({ ...clientForm, nationality: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Adresse" value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Piece d'identite" value={clientForm.idNumber} onChange={(e) => setClientForm({ ...clientForm, idNumber: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <label className="flex items-center gap-2 text-sm text-gray-300"><input type="checkbox" checked={clientForm.vipStatus} onChange={(e) => setClientForm({ ...clientForm, vipStatus: e.target.checked })} /> VIP</label>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => { resetClientForm(); setShowClientForm(false); }} className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5">Annuler</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">{editingClientId ? 'Sauvegarder' : 'Enregistrer'}</button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nationalité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {clients.map((client) => (
                      <tr key={client.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{client.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {client.firstName} {client.lastName}
                          {client.vipStatus && <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">VIP</span>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{client.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{client.phone}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{client.nationality}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(client.status)}`}>
                            {client.status === 'active' ? 'Actif' :
                             client.status === 'inactive' ? 'Inactif' : 'Liste noire'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => handleClientDetails(client)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2"
                          >
                            <FaEye className="h-4 w-4" aria-hidden="true" />
                            Détails
                          </button>
                          <button type="button" onClick={() => handleClientEdit(client)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button type="button" onClick={() => handleClientDelete(client.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedClient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                  <div className="w-full max-w-3xl rounded-xl border border-gray-700/70 bg-gray-900 shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 px-6 py-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">{selectedClient.code}</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">
                          {selectedClient.firstName} {selectedClient.lastName}
                          {selectedClient.vipStatus && <span className="ml-2 align-middle px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">VIP</span>}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedClient(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-700/70 text-gray-300 hover:bg-white/5 hover:text-white"
                        aria-label="Fermer les details du client"
                      >
                        <FaTimes className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="px-6 py-5">
                      {clientDetailsLoading && (
                        <p className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                          Chargement des informations actualisees...
                        </p>
                      )}

                      {clientDetailsError && (
                        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                          {clientDetailsError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Telephone</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Nationalite</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.nationality || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Statut</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedClient.status)}`}>
                            {selectedClient.status === 'active' ? 'Actif' :
                             selectedClient.status === 'inactive' ? 'Inactif' : 'Liste noire'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Piece d'identite</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.idNumber || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Type de piece</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.idType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Date de naissance</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.dateOfBirth.toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Cree par</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.createdBy || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-gray-500">Adresse</p>
                          <p className="mt-1 text-sm text-white">{selectedClient.address || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-gray-500">Preferences</p>
                          <p className="mt-1 text-sm text-white">
                            {selectedClient.preferences.length > 0 ? selectedClient.preferences.join(', ') : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleClientEdit(selectedClient);
                            setSelectedClient(null);
                          }}
                          className="px-4 py-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedClient(null)}
                          className="px-4 py-2 rounded-md border border-gray-700/70 text-sm font-medium text-gray-300 hover:bg-white/5"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'personnel':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion du Personnel</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les employés et leurs accès.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un employé..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetPersonnelForm();
                      setShowPersonnelForm(true);
                    }}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FaPlus className="h-4 w-4" aria-hidden="true" />
                    Nouvel employé
                  </button>
                </div>
              </div>
              
              {showPersonnelForm && (
                <div className="mb-6 p-6 border border-gray-700/50 rounded-xl bg-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingPersonnelId ? 'Modifier employe' : 'Ajouter un employe'}
                  </h3>
                  <form onSubmit={handlePersonnelSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input required placeholder="Matricule" value={personnelForm.employeeNumber} onChange={(e) => setPersonnelForm({ ...personnelForm, employeeNumber: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input required placeholder="Prenom" value={personnelForm.firstName} onChange={(e) => setPersonnelForm({ ...personnelForm, firstName: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input required placeholder="Nom" value={personnelForm.lastName} onChange={(e) => setPersonnelForm({ ...personnelForm, lastName: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Email" value={personnelForm.email} onChange={(e) => setPersonnelForm({ ...personnelForm, email: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Telephone" value={personnelForm.phone} onChange={(e) => setPersonnelForm({ ...personnelForm, phone: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input required placeholder="Poste" value={personnelForm.position} onChange={(e) => setPersonnelForm({ ...personnelForm, position: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input placeholder="Departement" value={personnelForm.department} onChange={(e) => setPersonnelForm({ ...personnelForm, department: e.target.value })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                      <input type="number" placeholder="Salaire" value={personnelForm.salary} onChange={(e) => setPersonnelForm({ ...personnelForm, salary: parseFloat(e.target.value) || 0 })} className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                    </div>
                    <div className="flex justify-end gap-3">
                      <button type="button" onClick={() => { resetPersonnelForm(); setShowPersonnelForm(false); }} className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5">Annuler</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">{editingPersonnelId ? 'Sauvegarder' : 'Enregistrer'}</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Matricule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Poste</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Département</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Salaire</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {personnel.map((person) => (
                      <tr key={person.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{person.employeeNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {person.firstName} {person.lastName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{person.position}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{person.department}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{person.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {person.salary.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(person.status)}`}>
                            {person.status === 'active' ? 'Actif' :
                             person.status === 'on_leave' ? 'Congé' : 'Terminé'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => handlePersonnelDetails(person)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2"
                          >
                            <FaEye className="h-4 w-4" aria-hidden="true" />
                            Détails
                          </button>
                          <button type="button" onClick={() => handlePersonnelEdit(person)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button type="button" onClick={() => handlePersonnelDelete(person.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPersonnel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                  <div className="w-full max-w-3xl rounded-xl border border-gray-700/70 bg-gray-900 shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 px-6 py-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">{selectedPersonnel.employeeNumber}</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">
                          {selectedPersonnel.firstName} {selectedPersonnel.lastName}
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">{selectedPersonnel.position || '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPersonnel(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-700/70 text-gray-300 hover:bg-white/5 hover:text-white"
                        aria-label="Fermer les details de l'employe"
                      >
                        <FaTimes className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="px-6 py-5">
                      {personnelDetailsLoading && (
                        <p className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                          Chargement des informations actualisees...
                        </p>
                      )}

                      {personnelDetailsError && (
                        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                          {personnelDetailsError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Telephone</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Departement</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.department || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Statut</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedPersonnel.status)}`}>
                            {selectedPersonnel.status === 'active' ? 'Actif' :
                             selectedPersonnel.status === 'on_leave' ? 'Conge' : 'Termine'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Date d'embauche</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.hireDate.toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Salaire</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.salary.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Cree par</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.createdBy || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Cree le</p>
                          <p className="mt-1 text-sm text-white">{selectedPersonnel.createdAt.toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-gray-500">Permissions</p>
                          <p className="mt-1 text-sm text-white">
                            {selectedPersonnel.permissions.length > 0 ? selectedPersonnel.permissions.join(', ') : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handlePersonnelEdit(selectedPersonnel);
                            setSelectedPersonnel(null);
                          }}
                          className="px-4 py-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPersonnel(null)}
                          className="px-4 py-2 rounded-md border border-gray-700/70 text-sm font-medium text-gray-300 hover:bg-white/5"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'fournisseur':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Fournisseurs</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les fournisseurs et leurs informations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un fournisseur..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button 
                    onClick={() => setShowSupplierForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nouveau fournisseur
                  </button>
                </div>
              </div>

              {showSupplierForm && (
                <div className="mb-6 p-6 border border-gray-700/50 rounded-xl bg-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingSupplierId ? 'Modifier le fournisseur' : 'Ajouter un nouveau fournisseur'}
                  </h3>
                  <form onSubmit={handleSupplierSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Numéro/Code</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={supplierForm.numero}
                          onChange={e => setSupplierForm({...supplierForm, numero: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Nom du fournisseur</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={supplierForm.nom}
                          onChange={e => setSupplierForm({...supplierForm, nom: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Contact (Tél/Email)</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={supplierForm.contact}
                          onChange={e => setSupplierForm({...supplierForm, contact: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Solde initial</label>
                        <input 
                          type="number" 
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={supplierForm.solde}
                          onChange={e => setSupplierForm({...supplierForm, solde: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowSupplierForm(false);
                          setEditingSupplierId(null);
                          setSupplierForm({ numero: '', nom: '', contact: '', solde: 0 });
                        }}
                        className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        {editingSupplierId ? 'Sauvegarder' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Nom</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Contact</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Catégorie</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Conditions</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Évaluation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {suppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {supplier.code}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{supplier.name}</span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{supplier.name}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{supplier.contactPerson}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{supplier.category}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{supplier.paymentTerms}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          <div className="flex items-center">
                            <span className="mr-1">{supplier.rating}</span>
                            <div className="flex text-yellow-400">
                              {[...Array(5)].map((_, i) => (
                                <svg key={i} className={`w-3 h-3 ${i < Math.floor(supplier.rating) ? 'fill-current' : 'fill-gray-300'}`} viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${supplier.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {supplier.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => void handleSupplierDetails(supplier)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2"
                          >
                            <FaEye className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden md:inline">Détails</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSupplierEdit(supplier)}
                            className="text-green-400 hover:text-green-300 mr-2"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSupplierDelete(supplier.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedSupplier && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                  <div className="w-full max-w-3xl rounded-xl border border-gray-700/70 bg-gray-900 shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 px-6 py-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">{selectedSupplier.code}</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">{selectedSupplier.name}</h3>
                        <p className="mt-1 text-sm text-gray-400">{selectedSupplier.contactPerson || '-'}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedSupplier(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-700/70 text-gray-300 hover:bg-white/5 hover:text-white"
                        aria-label="Fermer les details du fournisseur"
                      >
                        <FaTimes className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="px-6 py-5">
                      {supplierDetailsLoading && (
                        <p className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                          Chargement des informations actualisées...
                        </p>
                      )}

                      {supplierDetailsError && (
                        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                          {supplierDetailsError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.email || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Téléphone</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.phone || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Catégorie</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.category || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Conditions</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.paymentTerms || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Taxe</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.taxId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Évaluation</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.rating}/5</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Statut</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedSupplier.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {selectedSupplier.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Créé par</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.createdBy || '-'}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-gray-500">Adresse</p>
                          <p className="mt-1 text-sm text-white">{selectedSupplier.address || '-'}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleSupplierEdit(selectedSupplier);
                            setSelectedSupplier(null);
                          }}
                          className="px-4 py-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSupplier(null)}
                          className="px-4 py-2 rounded-md border border-gray-700/70 text-sm font-medium text-gray-300 hover:bg-white/5"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'service':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Services</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Définissez les services offerts par l'hôtel.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      resetServiceForm();
                      setShowServiceForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nouveau service
                  </button>
                </div>
              </div>

              {showServiceForm && (
                <div className="mb-6 p-6 border border-gray-700/50 rounded-xl bg-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingServiceId ? 'Modifier le service' : 'Ajouter un nouveau service'}
                  </h3>
                  <form onSubmit={handleServiceSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.code}
                          onChange={(e) => setServiceForm({ ...serviceForm, code: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.name}
                          onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                        <textarea
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.description}
                          onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Catégorie</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.category}
                          onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value as any })}
                        >
                          <option value="accommodation">Hébergement</option>
                          <option value="food_beverage">Restauration</option>
                          <option value="wellness">Bien-être</option>
                          <option value="business">Affaires</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Prix (FCFA)</label>
                        <input
                          type="number"
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.price}
                          onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Unité</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.unit}
                          onChange={(e) => setServiceForm({ ...serviceForm, unit: e.target.value as any })}
                        >
                          <option value="per_night">Par nuit</option>
                          <option value="per_person">Par personne</option>
                          <option value="per_hour">Par heure</option>
                          <option value="flat_rate">Forfait</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={serviceForm.status}
                          onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value as any })}
                        >
                          <option value="active">Actif</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          resetServiceForm();
                          setShowServiceForm(false);
                        }}
                        className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        {editingServiceId ? 'Sauvegarder' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {services.map((service) => (
                      <tr key={service.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{service.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{service.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{service.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {service.category === 'accommodation' ? 'Hébergement' :
                           service.category === 'food_beverage' ? 'Restauration' :
                           service.category === 'wellness' ? 'Bien-être' :
                           service.category === 'business' ? 'Affaires' : 'Autre'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {service.price.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {service.unit === 'per_night' ? 'Par nuit' :
                           service.unit === 'per_person' ? 'Par personne' :
                           service.unit === 'per_hour' ? 'Par heure' : 'Forfait'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${service.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {service.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => void handleServiceDetails(service)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2"
                          >
                            <FaEye className="h-4 w-4" aria-hidden="true" />
                            Détails
                          </button>
                          <button
                            type="button"
                            onClick={() => handleServiceEdit(service)}
                            className="text-green-400 hover:text-green-300 mr-2"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleServiceDelete(service.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedService && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
                  <div className="w-full max-w-3xl rounded-xl border border-gray-700/70 bg-gray-900 shadow-2xl">
                    <div className="flex items-start justify-between gap-4 border-b border-gray-700/70 px-6 py-5">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">{selectedService.code}</p>
                        <h3 className="mt-1 text-xl font-semibold text-white">{selectedService.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedService(null)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-700/70 text-gray-300 hover:bg-white/5 hover:text-white"
                        aria-label="Fermer les détails du service"
                      >
                        <FaTimes className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="px-6 py-5">
                      {serviceDetailsLoading && (
                        <p className="mb-4 rounded-md border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                          Chargement des informations actualisées...
                        </p>
                      )}

                      {serviceDetailsError && (
                        <p className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                          {serviceDetailsError}
                        </p>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Catégorie</p>
                          <p className="mt-1 text-sm text-white">
                            {selectedService.category === 'accommodation' ? 'Hébergement' :
                             selectedService.category === 'food_beverage' ? 'Restauration' :
                             selectedService.category === 'wellness' ? 'Bien-être' :
                             selectedService.category === 'business' ? 'Affaires' : 'Autre'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Prix</p>
                          <p className="mt-1 text-sm text-white">{selectedService.price.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Unité</p>
                          <p className="mt-1 text-sm text-white">
                            {selectedService.unit === 'per_night' ? 'Par nuit' :
                             selectedService.unit === 'per_person' ? 'Par personne' :
                             selectedService.unit === 'per_hour' ? 'Par heure' : 'Forfait'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Statut</p>
                          <span className={`mt-1 inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedService.isActive ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {selectedService.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Créé par</p>
                          <p className="mt-1 text-sm text-white">{selectedService.createdBy || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Créé le</p>
                          <p className="mt-1 text-sm text-white">{selectedService.createdAt.toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-xs uppercase tracking-wider text-gray-500">Description</p>
                          <p className="mt-1 text-sm text-white">{selectedService.description || '-'}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            handleServiceEdit(selectedService);
                            setSelectedService(null);
                          }}
                          className="px-4 py-2 rounded-md bg-green-600 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedService(null)}
                          className="px-4 py-2 rounded-md border border-gray-700/70 text-sm font-medium text-gray-300 hover:bg-white/5"
                        >
                          Fermer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'caisse':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Caisses</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Configurez les caisses et leurs paramètres.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCashRegisterForm(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouvelle caisse
                </button>
              </div>

              {showCashRegisterForm && (
                <div className="mb-6 p-6 border border-gray-700/50 rounded-xl bg-white/5">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {editingCashRegisterId ? 'Modifier la caisse' : 'Ajouter une nouvelle caisse'}
                  </h3>
                  <form onSubmit={handleCashRegisterSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Numéro</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.code}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, code: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Libellé</label>
                        <input
                          type="text"
                          required
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.name}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Localisation</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.location}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, location: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Responsable</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.responsiblePerson}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, responsiblePerson: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Solde d'ouverture</label>
                        <input
                          type="number"
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.openingBalance}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, openingBalance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Devise</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent"
                          value={cashRegisterForm.currency}
                          onChange={(e) => setCashRegisterForm({ ...cashRegisterForm, currency: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowCashRegisterForm(false);
                          setEditingCashRegisterId(null);
                          setCashRegisterForm({ code: '', name: '', location: '', openingBalance: 0, currency: 'XAF', status: 'active', responsiblePerson: '' });
                        }}
                        className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium text-gray-300 hover:bg-white/5"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                      >
                        {editingCashRegisterId ? 'Sauvegarder' : 'Enregistrer'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cashRegisters.map((register) => (
                  <div key={register.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{register.name}</h3>
                        <p className="text-sm text-gray-400">{register.code}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(register.status)}`}>
                        {register.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Localisation:</span>
                        <span className="text-white">{register.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Devise:</span>
                        <span className="text-white">{register.currency}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Solde d'ouverture:</span>
                        <span className="text-white">{register.openingBalance.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Responsable:</span>
                        <span className="text-white">{register.responsiblePerson}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                        Détails
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCashRegisterEdit(register)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCashRegisterDelete(register.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'depot_stockage':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Dépôts de Stockage</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les entrepôts et zones de stockage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDepotId(null);
                    setDepotForm(DEFAULT_DEPOT_FORM);
                    setShowDepotForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouveau dépot
                </button>
              </div>

              {showDepotForm && (
                <form onSubmit={handleDepotSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-700/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                    <input type="text" required value={depotForm.code} onChange={(e) => setDepotForm({ ...depotForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                    <input type="text" required value={depotForm.name} onChange={(e) => setDepotForm({ ...depotForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Localisation</label>
                    <input type="text" value={depotForm.location} onChange={(e) => setDepotForm({ ...depotForm, location: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Capacité (m³)</label>
                    <input type="number" min="0" value={depotForm.capacity} onChange={(e) => setDepotForm({ ...depotForm, capacity: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Occupation (m³)</label>
                    <input type="number" min="0" value={depotForm.currentOccupancy} onChange={(e) => setDepotForm({ ...depotForm, currentOccupancy: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Gérant</label>
                    <input type="text" value={depotForm.manager} onChange={(e) => setDepotForm({ ...depotForm, manager: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Niveau de sécurité</label>
                    <select value={depotForm.securityLevel} onChange={(e) => setDepotForm({ ...depotForm, securityLevel: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="low" className="bg-[#0d1327]">Faible</option>
                      <option value="medium" className="bg-[#0d1327]">Moyenne</option>
                      <option value="high" className="bg-[#0d1327]">Élevée</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                    <select value={depotForm.status} onChange={(e) => setDepotForm({ ...depotForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="active" className="bg-[#0d1327]">Actif</option>
                      <option value="inactive" className="bg-[#0d1327]">Inactif</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowDepotForm(false)} className="px-4 py-2 rounded-md border border-gray-600/50 text-gray-300 hover:bg-white/5 text-sm font-medium">Annuler</button>
                    <button type="submit" className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">{editingDepotId ? 'Mettre à jour' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {storageDepots.map((depot) => (
                  <div key={depot.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{depot.name}</h3>
                        <p className="text-sm text-gray-400">{depot.code}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(depot.status)}`}>
                        {depot.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Localisation:</span>
                        <span className="text-white">{depot.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Capacité:</span>
                        <span className="text-white">{depot.capacity} m³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Occupation:</span>
                        <span className="text-white">{depot.currentOccupancy} m³</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Taux occupation:</span>
                        <span className="text-white">{Math.round((depot.currentOccupancy / depot.capacity) * 100)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Gérant:</span>
                        <span className="text-white">{depot.manager}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Sécurité:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          depot.securityLevel === 'high' ? 'bg-red-500/20 text-red-400' :
                          depot.securityLevel === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>
                          {depot.securityLevel === 'high' ? 'Élevée' :
                           depot.securityLevel === 'medium' ? 'Moyenne' : 'Faible'}
                        </span>
                      </div>
                      {depot.temperature && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Température:</span>
                          <span className="text-white">{depot.temperature}°C</span>
                        </div>
                      )}
                      {depot.humidity && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Humidité:</span>
                          <span className="text-white">{depot.humidity}%</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailsDepot(depot)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDepotEdit(depot)}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {detailsDepot && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsDepot.name}</h3>
                    <button type="button" onClick={() => setDetailsDepot(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Code</dt><dd className="text-white font-medium">{detailsDepot.code}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Localisation</dt><dd className="text-white font-medium">{detailsDepot.location}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Capacité</dt><dd className="text-white font-medium">{detailsDepot.capacity} m³</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Occupation</dt><dd className="text-white font-medium">{detailsDepot.currentOccupancy} m³</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Gérant</dt><dd className="text-white font-medium">{detailsDepot.manager || 'N/A'}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Statut</dt><dd className="text-white font-medium">{detailsDepot.status === 'active' ? 'Actif' : 'Inactif'}</dd></div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        );

      case 'boisson':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Catalogue des Boissons</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez le catalogue des boissons.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher une boisson..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBeverageId(null);
                      setBeverageForm({ code: '', name: '', category: 'non_alcoholic', brand: '', volume: 0, unit: 'ml', unitCost: 0, sellingPrice: 0, supplierName: '', status: 'active' });
                      setShowBeverageForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nouvelle boisson
                  </button>
                </div>
              </div>

              {showBeverageForm && (
                <form onSubmit={handleBeverageSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-700/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                    <input type="text" required value={beverageForm.code} onChange={(e) => setBeverageForm({ ...beverageForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                    <input type="text" required value={beverageForm.name} onChange={(e) => setBeverageForm({ ...beverageForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Catégorie</label>
                    <select value={beverageForm.category} onChange={(e) => setBeverageForm({ ...beverageForm, category: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="alcoholic" className="bg-[#0d1327]">Alcoolisée</option>
                      <option value="non_alcoholic" className="bg-[#0d1327]">Non alcoolisée</option>
                      <option value="hot" className="bg-[#0d1327]">Chaude</option>
                      <option value="cold" className="bg-[#0d1327]">Froide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Marque</label>
                    <input type="text" value={beverageForm.brand} onChange={(e) => setBeverageForm({ ...beverageForm, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Volume</label>
                    <input type="number" min="0" value={beverageForm.volume} onChange={(e) => setBeverageForm({ ...beverageForm, volume: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Unité</label>
                    <input type="text" value={beverageForm.unit} onChange={(e) => setBeverageForm({ ...beverageForm, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Coût unitaire</label>
                    <input type="number" min="0" value={beverageForm.unitCost} onChange={(e) => setBeverageForm({ ...beverageForm, unitCost: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Prix de vente</label>
                    <input type="number" min="0" value={beverageForm.sellingPrice} onChange={(e) => setBeverageForm({ ...beverageForm, sellingPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Fournisseur</label>
                    <input type="text" value={beverageForm.supplierName} onChange={(e) => setBeverageForm({ ...beverageForm, supplierName: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                    <select value={beverageForm.status} onChange={(e) => setBeverageForm({ ...beverageForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="active" className="bg-[#0d1327]">Actif</option>
                      <option value="discontinued" className="bg-[#0d1327]">Discontinué</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowBeverageForm(false)} className="px-4 py-2 rounded-md border border-gray-600/50 text-gray-300 hover:bg-white/5 text-sm font-medium">Annuler</button>
                    <button type="submit" className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">{editingBeverageId ? 'Mettre à jour' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Marque</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Coût</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix vente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fournisseur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {beverages.map((beverage) => (
                      <tr key={beverage.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{beverage.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{beverage.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            beverage.category === 'alcoholic' ? 'bg-red-500/20 text-red-400' :
                            beverage.category === 'non_alcoholic' ? 'bg-green-500/20 text-green-400' :
                            beverage.category === 'hot' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {beverage.category === 'alcoholic' ? 'Alcoolisée' :
                             beverage.category === 'non_alcoholic' ? 'Non alcoolisée' :
                             beverage.category === 'hot' ? 'Chaude' : 'Froide'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{beverage.brand}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{beverage.volume} {beverage.unit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {beverage.unitCost.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {beverage.sellingPrice.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{beverage.supplierName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${beverage.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {beverage.status === 'active' ? 'Actif' : 'Discontinué'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setDetailsBeverage(beverage)}
                            className="text-blue-400 hover:text-blue-300 mr-2"
                          >
                            Détails
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBeverageEdit(beverage)}
                            className="text-green-400 hover:text-green-300 mr-2"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer la boisson ${beverage.name} ?`)) {
                                setBeverages((items) => items.filter((item) => item.id !== beverage.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailsBeverage && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsBeverage.name}</h3>
                    <button type="button" onClick={() => setDetailsBeverage(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Code</dt><dd className="text-white font-medium">{detailsBeverage.code}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Catégorie</dt><dd className="text-white font-medium">{detailsBeverage.category}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Marque</dt><dd className="text-white font-medium">{detailsBeverage.brand || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Volume</dt><dd className="text-white font-medium">{detailsBeverage.volume} {detailsBeverage.unit}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Coût unitaire</dt><dd className="text-white font-medium">{detailsBeverage.unitCost.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Prix de vente</dt><dd className="text-white font-medium">{detailsBeverage.sellingPrice.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Fournisseur</dt><dd className="text-white font-medium">{detailsBeverage.supplierName || 'N/A'}</dd></div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        );

      case 'plat':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Catalogue des Plats</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez le catalogue des plats du restaurant.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un plat..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDishId(null);
                      setDishForm({ code: '', name: '', description: '', categoryName: '', price: 0, preparationTime: 0, isAvailable: true });
                      setShowDishForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nouveau plat
                  </button>
                </div>
              </div>

              {showDishForm && (
                <form onSubmit={handleDishSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-700/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                    <input type="text" required value={dishForm.code} onChange={(e) => setDishForm({ ...dishForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                    <input type="text" required value={dishForm.name} onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Catégorie</label>
                    <input type="text" value={dishForm.categoryName} onChange={(e) => setDishForm({ ...dishForm, categoryName: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                    <input type="text" value={dishForm.description} onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Prix</label>
                    <input type="number" min="0" value={dishForm.price} onChange={(e) => setDishForm({ ...dishForm, price: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Temps de préparation (min)</label>
                    <input type="number" min="0" value={dishForm.preparationTime} onChange={(e) => setDishForm({ ...dishForm, preparationTime: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div className="flex items-end gap-2 pb-2">
                    <input type="checkbox" id="dish-available" checked={dishForm.isAvailable} onChange={(e) => setDishForm({ ...dishForm, isAvailable: e.target.checked })} className="h-4 w-4" />
                    <label htmlFor="dish-available" className="text-sm text-gray-300">Disponible</label>
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowDishForm(false)} className="px-4 py-2 rounded-md border border-gray-600/50 text-gray-300 hover:bg-white/5 text-sm font-medium">Annuler</button>
                    <button type="submit" className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">{editingDishId ? 'Mettre à jour' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Temps préparation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {dishes.map((dish) => (
                      <tr key={dish.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{dish.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{dish.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{dish.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{dish.categoryName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {dish.price.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{dish.preparationTime} min</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${dish.isAvailable ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {dish.isAvailable ? 'Disponible' : 'Indisponible'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button type="button" onClick={() => setDetailsDish(dish)} className="text-blue-400 hover:text-blue-300 mr-2">Détails</button>
                          <button type="button" onClick={() => handleDishEdit(dish)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer le plat ${dish.name} ?`)) {
                                setDishes((items) => items.filter((item) => item.id !== dish.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailsDish && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsDish.name}</h3>
                    <button type="button" onClick={() => setDetailsDish(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Code</dt><dd className="text-white font-medium">{detailsDish.code}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Catégorie</dt><dd className="text-white font-medium">{detailsDish.categoryName || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Prix</dt><dd className="text-white font-medium">{detailsDish.price.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Temps de préparation</dt><dd className="text-white font-medium">{detailsDish.preparationTime} min</dd></div>
                  </dl>
                  {detailsDish.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{detailsDish.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'vivre':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Catalogue des Vivres</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez le catalogue des boissons et rafraîchissements.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDrinkId(null);
                      setDrinkForm({ code: '', name: '', category: 'non_alcoholic', type: '', volume: 0, unit: 'ml', unitCost: 0, sellingPrice: 0, supplierName: '', status: 'active' });
                      setShowDrinkForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Nouvel article
                  </button>
                </div>
              </div>

              {showDrinkForm && (
                <form onSubmit={handleDrinkSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-gray-700/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                    <input type="text" required value={drinkForm.code} onChange={(e) => setDrinkForm({ ...drinkForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                    <input type="text" required value={drinkForm.name} onChange={(e) => setDrinkForm({ ...drinkForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Catégorie</label>
                    <select value={drinkForm.category} onChange={(e) => setDrinkForm({ ...drinkForm, category: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="alcoholic" className="bg-[#0d1327]">Alcoolisée</option>
                      <option value="non_alcoholic" className="bg-[#0d1327]">Non alcoolisée</option>
                      <option value="hot" className="bg-[#0d1327]">Chaude</option>
                      <option value="cold" className="bg-[#0d1327]">Froide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Type</label>
                    <input type="text" value={drinkForm.type} onChange={(e) => setDrinkForm({ ...drinkForm, type: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Volume</label>
                    <input type="number" min="0" value={drinkForm.volume} onChange={(e) => setDrinkForm({ ...drinkForm, volume: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Unité</label>
                    <input type="text" value={drinkForm.unit} onChange={(e) => setDrinkForm({ ...drinkForm, unit: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Coût unitaire</label>
                    <input type="number" min="0" value={drinkForm.unitCost} onChange={(e) => setDrinkForm({ ...drinkForm, unitCost: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Prix de vente</label>
                    <input type="number" min="0" value={drinkForm.sellingPrice} onChange={(e) => setDrinkForm({ ...drinkForm, sellingPrice: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Fournisseur</label>
                    <input type="text" value={drinkForm.supplierName} onChange={(e) => setDrinkForm({ ...drinkForm, supplierName: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                    <select value={drinkForm.status} onChange={(e) => setDrinkForm({ ...drinkForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="active" className="bg-[#0d1327]">Actif</option>
                      <option value="discontinued" className="bg-[#0d1327]">Discontinué</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowDrinkForm(false)} className="px-4 py-2 rounded-md border border-gray-600/50 text-gray-300 hover:bg-white/5 text-sm font-medium">Annuler</button>
                    <button type="submit" className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">{editingDrinkId ? 'Mettre à jour' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Volume</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Coût</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix vente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Fournisseur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {drinks.map((drink) => (
                      <tr key={drink.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{drink.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{drink.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            drink.category === 'alcoholic' ? 'bg-red-500/20 text-red-400' :
                            drink.category === 'non_alcoholic' ? 'bg-green-500/20 text-green-400' :
                            drink.category === 'hot' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {drink.category === 'alcoholic' ? 'Alcoolisée' :
                             drink.category === 'non_alcoholic' ? 'Non alcoolisée' :
                             drink.category === 'hot' ? 'Chaude' : 'Froide'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{drink.type}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{drink.volume} {drink.unit}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {drink.unitCost.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {drink.sellingPrice.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{drink.supplierName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${drink.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/50/20 text-gray-400'}`}>
                            {drink.status === 'active' ? 'Actif' : 'Discontinué'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button type="button" onClick={() => setDetailsDrink(drink)} className="text-blue-400 hover:text-blue-300 mr-2">Détails</button>
                          <button type="button" onClick={() => handleDrinkEdit(drink)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer l'article ${drink.name} ?`)) {
                                setDrinks((items) => items.filter((item) => item.id !== drink.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailsDrink && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsDrink.name}</h3>
                    <button type="button" onClick={() => setDetailsDrink(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Code</dt><dd className="text-white font-medium">{detailsDrink.code}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Type</dt><dd className="text-white font-medium">{detailsDrink.type || 'N/A'}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Volume</dt><dd className="text-white font-medium">{detailsDrink.volume} {detailsDrink.unit}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Coût unitaire</dt><dd className="text-white font-medium">{detailsDrink.unitCost.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Prix de vente</dt><dd className="text-white font-medium">{detailsDrink.sellingPrice.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Fournisseur</dt><dd className="text-white font-medium">{detailsDrink.supplierName || 'N/A'}</dd></div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        );

      case 'type_plat':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Types de Plats</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Définissez les catégories de plats.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDishTypeId(null);
                    setDishTypeForm({ code: '', name: '', description: '', status: 'active' });
                    setShowDishTypeForm(true);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouvelle catégorie
                </button>
              </div>

              {showDishTypeForm && (
                <form onSubmit={handleDishTypeSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-700/50 rounded-lg p-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Code</label>
                    <input type="text" required value={dishTypeForm.code} onChange={(e) => setDishTypeForm({ ...dishTypeForm, code: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Nom</label>
                    <input type="text" required value={dishTypeForm.name} onChange={(e) => setDishTypeForm({ ...dishTypeForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                    <input type="text" value={dishTypeForm.description} onChange={(e) => setDishTypeForm({ ...dishTypeForm, description: e.target.value })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                    <select value={dishTypeForm.status} onChange={(e) => setDishTypeForm({ ...dishTypeForm, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-transparent">
                      <option value="active" className="bg-[#0d1327]">Actif</option>
                      <option value="inactive" className="bg-[#0d1327]">Inactif</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowDishTypeForm(false)} className="px-4 py-2 rounded-md border border-gray-600/50 text-gray-300 hover:bg-white/5 text-sm font-medium">Annuler</button>
                    <button type="submit" className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium">{editingDishTypeId ? 'Mettre à jour' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie parente</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {dishTypes.map((type) => (
                      <tr key={type.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{type.code}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{type.parentCategoryName || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(type.status)}`}>
                            {type.status === 'active' ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button type="button" onClick={() => handleDishTypeEdit(type)} className="text-green-400 hover:text-green-300 mr-2">Modifier</button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Supprimer la catégorie ${type.name} ?`)) {
                                setDishTypes((items) => items.filter((item) => item.id !== type.id));
                              }
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Journal des Transactions</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez toutes les transactions financières.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes catégories</option>
                    <option value="Hébergement">Hébergement</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Bar">Bar</option>
                  </select>
                  <button
                    type="button"
                    onClick={exportTransactionsCsv}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Exporter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Créé par</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-sm text-gray-400">Aucune transaction trouvée.</td></tr>
                    ) : filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{transaction.reference}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            transaction.type === 'sale' ? 'bg-green-500/20 text-green-400' :
                            transaction.type === 'purchase' ? 'bg-blue-500/20 text-blue-400' :
                            transaction.type === 'expense' ? 'bg-red-500/20 text-red-400' :
                            transaction.type === 'transfer' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-white/50/20 text-gray-400'
                          }`}>
                            {transaction.type === 'sale' ? 'Vente' :
                             transaction.type === 'purchase' ? 'Achat' :
                             transaction.type === 'expense' ? 'Dépense' :
                             transaction.type === 'transfer' ? 'Transfert' : 'Ajustement'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transaction.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transaction.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {transaction.amount.toLocaleString('fr-FR')} {transaction.currency}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {transaction.date.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transaction.createdBy}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transaction.status)}`}>
                            {transaction.status === 'completed' ? 'Complété' :
                             transaction.status === 'approved' ? 'Approuvé' :
                             transaction.status === 'pending' ? 'En attente' : 'Rejeté'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button type="button" onClick={() => setDetailsTransaction(transaction)} className="text-blue-400 hover:text-blue-300">Détails</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailsTransaction && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsTransaction.reference}</h3>
                    <button type="button" onClick={() => setDetailsTransaction(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Type</dt><dd className="text-white font-medium">{detailsTransaction.type}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Catégorie</dt><dd className="text-white font-medium">{detailsTransaction.category}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Montant</dt><dd className="text-white font-medium">{detailsTransaction.amount.toLocaleString('fr-FR')} {detailsTransaction.currency}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Date</dt><dd className="text-white font-medium">{detailsTransaction.date.toLocaleDateString('fr-FR')}</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Statut</dt><dd className="text-white font-medium">{detailsTransaction.status}</dd></div>
                  </dl>
                  {detailsTransaction.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{detailsTransaction.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'journaux':
        return (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Journaux Comptables</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Consultez les journaux comptables.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes catégories</option>
                    <option value="Revenus">Revenus</option>
                    <option value="Dépenses">Dépenses</option>
                    <option value="Actif">Actif</option>
                    <option value="Passif">Passif</option>
                  </select>
                  <button
                    type="button"
                    onClick={exportJournalCsv}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Exporter
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Compte</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Débit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Crédit</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solde</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredJournalEntries.length === 0 ? (
                      <tr><td colSpan={10} className="px-4 py-8 text-center text-sm text-gray-400">Aucune écriture trouvée.</td></tr>
                    ) : filteredJournalEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{entry.reference}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.date.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.account}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.debit > 0 ? entry.debit.toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.credit > 0 ? entry.credit.toLocaleString('fr-FR') : '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {entry.balance.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status === 'posted' ? 'Validé' :
                             entry.status === 'draft' ? 'Brouillon' : 'Annulé'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button type="button" onClick={() => setDetailsJournalEntry(entry)} className="text-blue-400 hover:text-blue-300">Détails</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detailsJournalEntry && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{detailsJournalEntry.reference}</h3>
                    <button type="button" onClick={() => setDetailsJournalEntry(null)} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white">Fermer</button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Compte</dt><dd className="text-white font-medium">{detailsJournalEntry.account}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Date</dt><dd className="text-white font-medium">{detailsJournalEntry.date.toLocaleDateString('fr-FR')}</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Débit</dt><dd className="text-white font-medium">{detailsJournalEntry.debit.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between border-b border-white/10 pb-2"><dt className="text-gray-400">Crédit</dt><dd className="text-white font-medium">{detailsJournalEntry.credit.toLocaleString('fr-FR')} FCFA</dd></div>
                    <div className="flex justify-between"><dt className="text-gray-400">Catégorie</dt><dd className="text-white font-medium">{detailsJournalEntry.category}</dd></div>
                  </dl>
                  {detailsJournalEntry.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{detailsJournalEntry.description}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-full mx-auto px-6 lg:px-8 py-8">
        {/* Header épuré */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Gestion des Paramètres</h1>
          <p className="text-gray-400 mt-1">Configurez et gérez tous les paramètres du système hôtelier</p>
        </div>

        {/* Navigation Tabs épurée */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl mb-8">
          <div className="border-b border-gray-700/50">
            <nav className="flex space-x-2 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600/50'
                  }`}
                >
                  <span className="inline-flex items-center justify-center text-lg">
                    {tabIcons[tab.key]}
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          
          {/* Description minimaliste */}
          <div className="px-6 py-3 bg-white/5 border-b border-gray-700/50">
            <p className="text-sm text-gray-400">
              {tabs.find(tab => tab.key === activeTab)?.description}
            </p>
          </div>
        </div>

        {Object.keys(loadErrors).length > 0 && (
          <div className="mb-8 rounded-xl border border-red-500/40 bg-red-500/10 px-6 py-4 flex items-center justify-between gap-4">
            <p className="text-sm text-red-300">
              {Object.values(loadErrors)[0]}
              {Object.keys(loadErrors).length > 1 ? ` (+${Object.keys(loadErrors).length - 1} autre${Object.keys(loadErrors).length - 1 > 1 ? 's' : ''})` : ''}
            </p>
            <button
              type="button"
              onClick={() => {
                loadRoomTypes(); loadRooms(); loadClients(); loadPersonnel();
                loadSuppliers(); loadServices(); loadCashRegisters();
              }}
              className="shrink-0 rounded-lg border border-red-400/50 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Parametres;
