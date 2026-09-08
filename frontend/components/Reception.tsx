import React, { useMemo, useState } from 'react';
import { CashJournal, CashRegister, CashTransfer, useBackendCashModule } from '../utils/cashModuleBackend';
import api from '../services/api';
import { useEffect } from 'react';
import { normalizeRole, readCurrentUser } from '../utils/accessControl';
import { FaDownload } from 'react-icons/fa';
import { openInvoiceWindow } from '../utils/invoiceTemplate';


interface Booking {
  id: string;
  bookingNumber: string;
  guestName: string;
  roomNumber: string;
  roomType: string;
  clientId: string;
  occupantFirstName: string;
  occupantLastName: string;
  occupantIdDocument?: string;
  occupantPhone?: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  totalAmount: number;
  status: 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer' | 'mobile';
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

interface BookingDraft {
  clientId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  occupantFirstName: string;
  occupantLastName: string;
  totalAmount: number;
  occupantIdDocument: string;
  occupantPhone: string;
  occupantAddress: string;
  observation: string;
  status?: string;
}

interface Visit {
  id: string;
  visitNumber: string;
  visitorName: string;
  guestName?: string;
  purpose: string;
  visitDate: Date;
  checkInTime: string;
  checkOutTime?: string;
  idNumber: string;
  phone: string;
  status: 'checked_in' | 'checked_out';
  notes?: string;
  receivedBy: string;
}

interface StockItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  totalValue: number;
  minThreshold: number;
  maxThreshold: number;
  status: 'available' | 'low_stock' | 'overstock' | 'out_of_stock';
  lastMovementDate?: Date;
  lastMovementType?: 'entry' | 'exit';
  location: string;
  supplier?: string;
}

interface InternalService {
  id: string;
  serviceNumber: string;
  clientId: string;
  guestName: string;
  roomNumber: string;
  serviceType: 'housekeeping' | 'maintenance' | 'room_service' | 'laundry' | 'transport';
  description: string;
  requestDate: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  completedAt?: Date;
  cost: number;
  paymentStatus: 'pending' | 'paid' | 'charged_to_room';
  requestedBy: string;
}

interface MainCourante {
  id: string;
  entryDate: Date;
  entryTime: string;
  category: 'incident' | 'maintenance' | 'security' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

interface Room {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
}

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
}

interface OccupancyPlanning {
  id: string;
  roomNumber: string;
  roomType: string;
  date: Date;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  guestName?: string;
  checkIn?: Date;
  checkOut?: Date;
  rate?: number;
  cleaningStatus?: 'clean' | 'dirty' | 'cleaning';
}

const ReceptionTabIcon: React.FC<{ tabKey: string; className?: string }> = ({ tabKey, className = 'h-5 w-5' }) => {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true
  };

  if (tabKey === 'hebergement') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 10V5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5V10" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M3 20v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 17h18M7 12V9h4v3M13 12V9h4v3" />
      </svg>
    );
  }

  if (tabKey === 'visite') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M15.5 7.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 20a7 7 0 0 1 14 0M18 8h3M19.5 6.5v3" />
      </svg>
    );
  }

  if (tabKey === 'fiche_stock') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 7.5v9L12 21l8-4.5v-9M12 12v9" />
      </svg>
    );
  }

  if (tabKey === 'services_internes') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M12 6v12M6 12h12" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
      </svg>
    );
  }

  if (tabKey === 'main_courante') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 4h10v16H7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M9.5 8h5M9.5 12h5M9.5 16h3" />
      </svg>
    );
  }

  if (tabKey === 'planning_occupation') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 3v4M17 3v4M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M8 12h3v3H8zM14 12h3v3h-3z" />
      </svg>
    );
  }

  if (tabKey === 'caisse' || tabKey === 'ouverture_fermeture') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 9h14v10H5zM8 9V5h8v4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M8 13h.01M12 13h.01M16 13h.01M8 16h8" />
      </svg>
    );
  }

  if (tabKey === 'impression_factures') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
      </svg>
    );
  }

  if (tabKey === 'transfert_intercaisse') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 7h11l-3-3M17 17H6l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 11h14v2H5z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" />
    </svg>
  );
};

const exportCsv = (filename: string, rows: Record<string, string | number | undefined>[]) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';')
    )
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const Reception: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('hebergement');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterRegister, setFilterRegister] = useState('all');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [occupancyPlanning, setOccupancyPlanning] = useState<OccupancyPlanning[]>([]);
  const [internalServices, setInternalServices] = useState<InternalService[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [mainCourante, setMainCourante] = useState<MainCourante[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [selectedPlanningRoom, setSelectedPlanningRoom] = useState<OccupancyPlanning | null>(null);
  const [selectedCashRegister, setSelectedCashRegister] = useState<CashRegister | null>(null);
  const [cashMovementRegister, setCashMovementRegister] = useState<CashRegister | null>(null);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [cashMovementDraft, setCashMovementDraft] = useState({ type: 'cash_in', amount: '', description: '' });
  const [selectedService, setSelectedService] = useState<InternalService | null>(null);
  const [editingService, setEditingService] = useState<InternalService | null>(null);
  const [showEditServiceModal, setShowEditServiceModal] = useState(false);
  const [editServiceDraft, setEditServiceDraft] = useState({
    description: '',
    serviceType: 'housekeeping',
    cost: 0,
    status: 'pending',
    paymentStatus: 'pending'
  });
  const [selectedTransfer, setSelectedTransfer] = useState<CashTransfer | null>(null);

  const currentUser = readCurrentUser();
  const isAdmin = normalizeRole(currentUser?.role) === 'Admin';

  const [draftBooking, setDraftBooking] = useState<BookingDraft>({
    clientId: '',
    roomId: '',
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    occupantFirstName: '',
    occupantLastName: '',
    totalAmount: 0,
    occupantIdDocument: '',
    occupantPhone: '',
    occupantAddress: '',
    observation: ''
  });

  const [draftVisit, setDraftVisit] = useState({
    name: '',
    firstName: '',
    observation: '',
    occupantId: ''
  });

  const [draftStock, setDraftStock] = useState({
    itemId: '',
    movementType: 'entry',
    quantity: 0,
    reason: '',
    reference: ''
  });

  const [draftService, setDraftService] = useState({
    clientId: '',
    serviceType: 'housekeeping',
    description: '',
    price: 0
  });

  const [selectedMainEntry, setSelectedMainEntry] = useState<MainCourante | null>(null);
  const [showMainEntryDetails, setShowMainEntryDetails] = useState(false);
  const [showMainEntryForm, setShowMainEntryForm] = useState(false);
  const [newEntryDraft, setNewEntryDraft] = useState({
    dateOperation: new Date().toISOString().slice(0, 10),
    heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    numcompte: '512',
    credit: '0',
    debit: '0',
    libelle: '',
    codeJournal: 'BQ',
    codeDepot: '3'
  });
  const [editingMainEntry, setEditingMainEntry] = useState<MainCourante | null>(null);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editEntryDraft, setEditEntryDraft] = useState({
    dateOperation: new Date().toISOString().slice(0, 10),
    heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    numcompte: '512',
    credit: '0',
    debit: '0',
    libelle: '',
    codeJournal: 'BQ',
    codeDepot: '3'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Reservations (Bookings)
      const resResponse = await api.get('/reservations');
      const resData = resResponse.data;
      const mappedBookings: Booking[] = resData.map((res: any) => ({
        id: String(res.id),
        bookingNumber: `RES-${res.id.toString().padStart(3, '0')}`,
        guestName: `${res.occupantFirstName} ${res.occupantLastName}`,
        clientId: String(res.clientId),
        roomNumber: res.roomId,
        roomType: res.roomType,
        occupantFirstName: res.occupantFirstName,
        occupantLastName: res.occupantLastName,
        occupantIdDocument: res.occupantIdDocument,
        occupantPhone: res.occupantPhone,
        checkIn: new Date(res.checkIn),
        checkOut: new Date(res.checkOut),
        adults: 2,
        children: 0,
        totalAmount: res.totalAmount,
        status: mapStatus(res.status),
        paymentMethod: 'cash',
        createdBy: 'Système',
        createdAt: new Date(res.createdAt)
      }));
      setBookings(mappedBookings);

      // Map to Occupancy Planning
      const mappedPlanning: OccupancyPlanning[] = resData.map((res: any) => ({
        id: String(res.id),
        roomNumber: res.roomId,
        roomType: res.roomType,
        date: new Date(res.checkIn),
        status: 'occupied',
        guestName: `${res.occupantFirstName} ${res.occupantLastName}`,
        checkIn: new Date(res.checkIn),
        checkOut: new Date(res.checkOut),
        rate: res.totalAmount,
        cleaningStatus: 'clean'
      }));
      setOccupancyPlanning(mappedPlanning);

      // Fetch Internal Services
      const srvResponse = await api.get('/services');
      const srvData = srvResponse.data;
      const mappedServices: InternalService[] = srvData.map((s: any) => ({
        id: String(s.id),
        serviceNumber: `SRV-${s.id.toString().padStart(3, '0')}`,
        clientId: String(s.clientId),
        guestName: `Client #${s.clientId}`,
        roomNumber: 'N/A',
        serviceType: s.serviceType.toLowerCase().includes('house') ? 'housekeeping' : 'room_service',
        description: s.description,
        requestDate: new Date(s.requestedAt),
        status: s.status.toLowerCase() === 'completed' ? 'completed' : 'pending',
        cost: s.price,
        paymentStatus: 'pending',
        requestedBy: 'Client'
      }));
      setInternalServices(mappedServices);

      // Fetch Stock (Economat)
      const stockResponse = await api.get('/stock/items');
      const stockData = stockResponse.data;
      const mappedStock: StockItem[] = stockData.map((item: any) => ({
        id: String(item.id),
        productCode: item.code,
        productName: item.name,
        category: item.category,
        currentStock: item.quantity,
        unit: item.unit,
        unitCost: item.unitPrice,
        sellingPrice: 0,
        totalValue: item.quantity * item.unitPrice,
        minThreshold: item.minThreshold,
        maxThreshold: item.minThreshold * 5,
        status: item.quantity > item.minThreshold ? 'available' : 'low_stock',
        location: 'Magasin'
      }));
      setStockItems(mappedStock);

      // Fetch Main Courante (Accounting Operations)
      const opsResponse = await api.get('/accounting/sqlite/operations');
      const opsData = opsResponse.data;
      const mappedOps: MainCourante[] = opsData.map((op: any) => ({
        id: String(op.codeOperation),
        entryDate: new Date(op.dateOperation),
        entryTime: op.heureOperation,
        category: op.typeOperation.toLowerCase().includes('credit') ? 'security' : 'incident',
        priority: 'medium',
        title: op.libelle,
        description: `Opération sur compte ${op.numcompte} (${op.libelleCompte})`,
        location: op.libelleDepot || 'Hôtel',
        reportedBy: 'Système Comptable',
        status: 'resolved'
      }));
      setMainCourante(mappedOps);

      // Fetch Rooms
      const roomsResponse = await api.get('/chambres');
      setRooms(roomsResponse.data.map((r: any) => ({
        id: String(r.id),
        number: r.number,
        type: r.type,
        price: r.price,
        status: r.status
      })));

      // Fetch Clients
      const clientsResponse = await api.get('/clients');
      setClients(clientsResponse.data.map((c: any) => ({
        id: String(c.id),
        firstName: c.firstName,
        lastName: c.lastName,
        fullName: `${c.firstName} ${c.lastName}`
      })));

      // Fetch Visits
      const visitsResponse = await api.get('/visits');
      setVisits(visitsResponse.data.map((v: any) => ({
        id: String(v.id),
        visitNumber: `VIS-${v.id.toString().padStart(3, '0')}`,
        visitorName: `${v.firstName} ${v.name}`,
        purpose: v.observation,
        visitDate: new Date(v.startDate || Date.now()),
        checkInTime: v.startDate ? new Date(v.startDate).toLocaleTimeString() : '--:--',
        idNumber: 'N/A',
        phone: 'N/A',
        status: v.endDate ? 'checked_out' : 'checked_in',
        receivedBy: 'Réception'
      })));
      
    } catch (error) {
      console.error('Error fetching reception data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...draftBooking,
        clientId: Number(draftBooking.clientId),
        roomId: draftBooking.roomId,
        checkIn: draftBooking.checkIn,
        checkOut: draftBooking.checkOut,
        totalAmount: Number(draftBooking.totalAmount),
        occupantFirstName: draftBooking.occupantFirstName,
        occupantLastName: draftBooking.occupantLastName,
        occupantIdDocument: draftBooking.occupantIdDocument || '',
        occupantPhone: draftBooking.occupantPhone || '',
        occupantAddress: draftBooking.occupantAddress || '',
        observation: draftBooking.observation || '',
        status: draftBooking.status || undefined
      };

      if (editingBookingId) {
        await api.put(`/reservations/${editingBookingId}`, payload);
      } else {
        await api.post('/reservations', payload);
      }
      setShowBookingForm(false);
      setEditingBookingId(null);
      setDraftBooking({
        clientId: '',
        roomId: '',
        checkIn: new Date().toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        occupantFirstName: '',
        occupantLastName: '',
        totalAmount: 0,
        occupantIdDocument: '',
        occupantPhone: '',
        occupantAddress: '',
        observation: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette réservation ?')) return;
    try {
      await api.delete(`/reservations/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting booking:', error);
    }
  };

  const saveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        ...draftService,
        clientId: Number(draftService.clientId),
        requestedAt: new Date().toISOString()
      });
      setShowServiceForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleEditService = (service: InternalService) => {
    setEditingService(service);
    setEditServiceDraft({
      description: service.description,
      serviceType: service.serviceType,
      cost: service.cost,
      status: service.status,
      paymentStatus: service.paymentStatus
    });
    setShowEditServiceModal(true);
  };

  const handleSaveEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      await api.put(`/services/${editingService.id}`, {
        clientId: Number(editingService.clientId),
        serviceType: editServiceDraft.serviceType,
        description: editServiceDraft.description,
        status: editServiceDraft.status,
        requestedAt: editingService.requestDate.toISOString(),
        completedAt: editServiceDraft.status === 'completed' ? new Date().toISOString() : null,
        price: Number(editServiceDraft.cost)
      });
      setShowEditServiceModal(false);
      setEditingService(null);
      fetchData();
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const emailBookingInvoice = (booking: Booking) => {
    const subject = encodeURIComponent(`Facture ${booking.bookingNumber} - Mirador Hotel`);
    const body = encodeURIComponent(
      `Bonjour ${booking.guestName},\n\n` +
      `Veuillez trouver ci-dessous les details de votre facture ${booking.bookingNumber}.\n` +
      `Chambre: ${booking.roomNumber}\n` +
      `Montant total: ${booking.totalAmount.toLocaleString('fr-FR')} FCFA\n\n` +
      `Cordialement,\nReception Mirador Hotel`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const saveVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/visits', {
        ...draftVisit,
        startDate: new Date().toISOString()
      });
      setShowVisitForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving visit:', error);
    }
  };

  const deleteVisit = async (id: string) => {
    if (!window.confirm('Supprimer cette visite ?')) return;
    try {
      await api.delete(`/visits/${id}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting visit:', error);
    }
  };

  const saveStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/stock/movements', {
        ...draftStock,
        itemId: Number(draftStock.itemId),
        quantity: Number(draftStock.quantity)
      });
      setShowStockForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving stock movement:', error);
    }
  };

  const handleOpenMainEntryForm = () => {
    setNewEntryDraft({
      dateOperation: new Date().toISOString().slice(0, 10),
      heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      numcompte: '512',
      credit: '0',
      debit: '0',
      libelle: '',
      codeJournal: 'BQ',
      codeDepot: '3'
    });
    setShowMainEntryForm(true);
  };

  const handleAddMainEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const credit = Number(newEntryDraft.credit || 0);
    const debit = Number(newEntryDraft.debit || 0);

    if (!newEntryDraft.libelle.trim() || (!credit && !debit)) {
      return;
    }

    try {
      await api.post('/accounting/sqlite/operations', {
        ...newEntryDraft,
        credit,
        debit,
        codeDepot: Number(newEntryDraft.codeDepot)
      });
      setShowMainEntryForm(false);
      fetchData();
    } catch (error) {
      console.error('Error saving main entry:', error);
    }
  };

  const handleEditMainEntry = (entry: MainCourante) => {
    setEditingMainEntry(entry);
    setEditEntryDraft({
      dateOperation: entry.entryDate.toISOString().slice(0, 10),
      heureOperation: entry.entryTime,
      numcompte: '512',
      credit: '0',
      debit: '0',
      libelle: entry.title,
      codeJournal: 'BQ',
      codeDepot: '3'
    });
    setShowEditEntryModal(true);
  };

  const handleSaveEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMainEntry) return;
    const credit = Number(editEntryDraft.credit || 0);
    const debit = Number(editEntryDraft.debit || 0);
    if (!editEntryDraft.libelle.trim() || (!credit && !debit)) {
      return;
    }
    try {
      await api.put(`/accounting/operations/${editingMainEntry.id}`, {
        label: editEntryDraft.libelle,
        debitAmount: debit,
        creditAmount: credit,
        accountCode: editEntryDraft.numcompte,
        journalCode: editEntryDraft.codeJournal,
        reference: `MC-${editingMainEntry.id}`
      }).catch(async () => {
        await api.post('/accounting/sqlite/operations', {
          ...editEntryDraft,
          credit,
          debit,
          codeDepot: Number(editEntryDraft.codeDepot)
        });
      });
      setShowEditEntryModal(false);
      setEditingMainEntry(null);
      fetchData();
    } catch (error) {
      console.error('Error editing entry:', error);
    }
  };

  const handleSaveCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cashMovementDraft.amount);
    if (!amount || amount <= 0) return;
    try {
      await api.post('/accounting/sqlite/operations', {
        dateOperation: new Date().toISOString().slice(0, 10),
        heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        numcompte: '512',
        credit: cashMovementDraft.type === 'cash_in' ? amount : 0,
        debit: cashMovementDraft.type === 'cash_out' ? amount : 0,
        libelle: cashMovementDraft.description || `Mouvement caisse ${cashMovementRegister?.registerNumber}`,
        codeJournal: 'CA',
        codeDepot: 3
      });
      setShowCashMovementModal(false);
      setCashMovementRegister(null);
      fetchData();
    } catch (error) {
      console.error('Error saving cash movement:', error);
    }
  };

  const mapStatus = (status: string): any => {
    const s = status.toLowerCase();
    if (s.includes('check') && s.includes('in')) return 'checked_in';
    if (s.includes('check') && s.includes('out')) return 'checked_out';
    if (s.includes('annul')) return 'cancelled';
    return 'confirmed';
  };

  const initialCashRegisters: CashRegister[] = [
    {
      id: '1',
      registerNumber: 'Caisse-Réception-01',
      openingBalance: 100000,
      currentBalance: 250000,
      cashIn: 200000,
      cashOut: 50000,
      totalSales: 150000,
      status: 'open',
      openedBy: 'Alice Martin',
      openedAt: new Date('2024-04-10T08:00:00')
    }
  ];

  const initialCashTransfers: CashTransfer[] = [
    {
      id: '1',
      transferNumber: 'TRANSF-REC-2024-001',
      fromRegister: 'Caisse-Réception-01',
      toRegister: 'Caisse-Bar-01',
      amount: 30000,
      reason: 'Approvisionnement bar',
      status: 'completed',
      requestedBy: 'Alice Martin',
      approvedBy: 'Responsable réception',
      transferDate: new Date('2024-04-10T10:30:00'),
      completedAt: new Date('2024-04-10T10:45:00')
    }
  ];

  const initialCashJournal: CashJournal[] = [
    {
      id: '1',
      date: new Date('2024-04-10T08:00:00'),
      description: 'Ouverture caisse réception',
      type: 'opening',
      amount: 100000,
      balance: 100000,
      register: 'Caisse-Réception-01',
      user: 'Alice Martin',
      reference: 'OUV-REC-2024-001'
    },
    {
      id: '2',
      date: new Date('2024-04-10T09:30:00'),
      description: 'Paiement réservation RES-2024-001',
      type: 'sale',
      amount: 250000,
      balance: 350000,
      register: 'Caisse-Réception-01',
      user: 'Alice Martin',
      reference: 'RES-2024-001'
    }
  ];

  const tabs = [
    { key: 'hebergement', label: 'Hébergement', description: 'Gérez les réservations et les séjours des clients' },
    { key: 'visite', label: 'Visite', description: 'Enregistrez les visiteurs et contrôlez les accès' },
    { key: 'fiche_stock', label: 'Fiche de stock', description: 'Consultez les stocks de la réception et services' },
    { key: 'services_internes', label: 'Services internes', description: 'Gérez les services internes demandés par les clients' },
    { key: 'main_courante', label: 'Main courante', description: 'Suivez les incidents et événements de la réception' },
    { key: 'planning_occupation', label: 'Planning d\'occupation', description: 'Visualisez l\'occupation des chambres et planning' },
    { key: 'caisse', label: 'Caisse', description: 'Suivez l\'état des caisses et les transactions' },
    { key: 'impression_factures', label: 'Impression des factures', description: 'Imprimez et gérez les factures clients' },
    { key: 'transfert_intercaisse', label: 'Transfert inter-caisse', description: 'Gérez les transferts entre caisses' },
    { key: 'brouillard_caisse', label: 'Brouillard de caisse', description: 'Consultez le journal détaillé des opérations' },
    { key: 'ouverture_fermeture', label: 'Ouvert/Fermeture Caisse', description: 'Gérez l\'ouverture et la fermeture des caisses' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-500/20 text-blue-400';
      case 'checked_in': return 'bg-green-500/20 text-green-400';
      case 'checked_out': return 'bg-white/50/20 text-gray-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'available': return 'bg-green-500/20 text-green-400';
      case 'occupied': return 'bg-blue-500/20 text-blue-400';
      case 'maintenance': return 'bg-orange-500/20 text-orange-400';
      case 'reserved': return 'bg-purple-500/20 text-purple-400';
      case 'clean': return 'bg-green-500/20 text-green-400';
      case 'dirty': return 'bg-red-500/20 text-red-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'open': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-white/50/20 text-gray-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte bancaire';
      case 'transfer': return 'Virement bancaire';
      case 'mobile': return 'Mobile money';
      default: return method;
    }
  };

  const getInvoiceStatusLabel = (status: Booking['status']) => {
    switch (status) {
      case 'checked_in': return 'En cours';
      case 'checked_out': return 'Payee';
      case 'confirmed': return 'Confirmee';
      case 'cancelled': return 'Annulee';
      default: return status;
    }
  };

  const filteredInvoiceBookings = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return bookings;

    return bookings.filter((booking) =>
      booking.bookingNumber.toLowerCase().includes(normalizedTerm) ||
      booking.guestName.toLowerCase().includes(normalizedTerm) ||
      booking.roomNumber.toLowerCase().includes(normalizedTerm) ||
      booking.roomType.toLowerCase().includes(normalizedTerm)
    );
  }, [bookings, searchTerm]);

  const printBookingInvoice = (booking: Booking) => {
    const nights = Math.max(
      1,
      Math.ceil((booking.checkOut.getTime() - booking.checkIn.getTime()) / 86400000)
    );
    const unitPrice = booking.totalAmount / nights;
    const formatAmount = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;
    const invoiceDate = booking.createdAt.toLocaleDateString('fr-FR');

    openInvoiceWindow({
      documentTitle: `Facture ${booking.bookingNumber}`,
      moduleLabel: 'Reception - Hebergement - Restauration',
      invoiceNumber: booking.bookingNumber,
      invoiceDate,
      statusLabel: getInvoiceStatusLabel(booking.status),
      infoBoxes: [
        {
          title: 'Client',
          lines: [
            { label: 'Nom', value: booking.guestName },
            { label: 'Paiement', value: getPaymentMethodLabel(booking.paymentMethod) }
          ]
        },
        {
          title: 'Sejour',
          lines: [
            { label: 'Chambre', value: booking.roomNumber },
            { label: 'Type', value: booking.roomType || 'Standard' },
            { label: 'Nuitees', value: String(nights) }
          ]
        }
      ],
      columns: [
        { label: 'Designation' },
        { label: 'Periode' },
        { label: 'Qte', align: 'right' },
        { label: 'Prix unitaire', align: 'right' },
        { label: 'Montant', align: 'right' }
      ],
      rows: [[
        `Hebergement - Chambre ${booking.roomNumber} (${booking.roomType || 'Standard'})`,
        `${booking.checkIn.toLocaleDateString('fr-FR')} au ${booking.checkOut.toLocaleDateString('fr-FR')}`,
        nights,
        formatAmount(unitPrice),
        formatAmount(booking.totalAmount)
      ]],
      totals: [
        { label: 'Total HT', value: formatAmount(booking.totalAmount) },
        { label: 'Remise', value: formatAmount(0) },
        { label: 'Net a payer', value: formatAmount(booking.totalAmount), emphasis: true }
      ],
      signatureLabels: ['Signature client', 'Reception Mirador Hotel']
    });
  };

  const renderBookingDetailsModal = () => {
    if (!selectedBooking) return null;

    const nights = Math.max(
      1,
      Math.ceil((selectedBooking.checkOut.getTime() - selectedBooking.checkIn.getTime()) / 86400000)
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
        <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-900 shadow-2xl">
          <div className="flex items-start justify-between border-b border-gray-700/70 bg-gray-800/80 px-6 py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Reservation</p>
              <h3 className="mt-1 text-2xl font-semibold text-white">{selectedBooking.bookingNumber}</h3>
              <p className="mt-1 text-sm text-gray-400">{selectedBooking.guestName}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Fermer les details"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <div className="rounded-xl border border-gray-700/60 bg-white/5 p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Client</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-gray-400">Nom</span><span className="font-medium text-white">{selectedBooking.guestName}</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-400">Paiement</span><span className="font-medium text-white">{getPaymentMethodLabel(selectedBooking.paymentMethod)}</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-400">Statut</span><span className="font-medium text-white">{getInvoiceStatusLabel(selectedBooking.status)}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/60 bg-white/5 p-4">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-300">Sejour</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4"><span className="text-gray-400">Chambre</span><span className="font-medium text-white">{selectedBooking.roomNumber}</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-400">Type</span><span className="font-medium text-white">{selectedBooking.roomType}</span></div>
                <div className="flex justify-between gap-4"><span className="text-gray-400">Nuitees</span><span className="font-medium text-white">{nights}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-700/60 bg-white/5 p-4 md:col-span-2">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Facturation</h4>
              <div className="grid gap-3 text-sm md:grid-cols-3">
                <div>
                  <p className="text-gray-400">Arrivee</p>
                  <p className="mt-1 font-medium text-white">{selectedBooking.checkIn.toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Depart</p>
                  <p className="mt-1 font-medium text-white">{selectedBooking.checkOut.toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Montant</p>
                  <p className="mt-1 font-semibold text-white">{selectedBooking.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-700/70 px-6 py-4">
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/5"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={() => printBookingInvoice(selectedBooking)}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              Imprimer
            </button>
          </div>
        </div>
      </div>
    );
  };

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'housekeeping': return 'Ménage';
      case 'maintenance': return 'Maintenance';
      case 'room_service': return 'Room service';
      case 'laundry': return 'Blanchisserie';
      case 'transport': return 'Transport';
      default: return type;
    }
  };

  const {
    cashRegisters,
    cashTransfers,
    cashJournal,
    transferForm,
    setTransferForm,
    openingForm,
    setOpeningForm,
    closingForm,
    setClosingForm,
    closingRegister,
    closingDifference,
    feedback,
    handleTransferSubmit,
    approveTransfer,
    cancelTransfer,
    deleteTransfer,
    handleOpeningSubmit,
    handleClosingSubmit,
    cancelClosure,
    deleteClosure,
    resetTransferForm
  } = useBackendCashModule('reception', initialCashRegisters, initialCashTransfers, initialCashJournal);

  const filteredCashJournal = useMemo(() => {
    return cashJournal.filter((entry) => {
      const matchesDate = !filterDate || entry.date.toISOString().slice(0, 10) === filterDate;
      const matchesRegister = filterRegister === 'all' || entry.register === filterRegister;
      return matchesDate && matchesRegister;
    });
  }, [cashJournal, filterDate, filterRegister]);

  const exportTransfers = () => {
    const rows = (cashTransfers || []).map((transfer) => {
      const dt = transfer.transferDate ? new Date(transfer.transferDate) : null;
      return {
        'N° Transfert': transfer.transferNumber,
        'Date': dt ? dt.toLocaleDateString('fr-FR') : '-',
        'Heure': dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        'Caisse Source': transfer.fromRegister,
        'Caisse Destination': transfer.toRegister,
        'Montant (FCFA)': transfer.amount,
        'Motif': transfer.reason || '-',
        'Statut': transfer.status === 'completed' ? 'Complété' : transfer.status === 'pending' ? 'En attente' : transfer.status === 'cancelled' ? 'Annulé' : transfer.status,
        'Demandé par': transfer.requestedBy || '-',
        'Approuvé par': transfer.approvedBy || '-'
      };
    });
    exportCsv('transferts_inter_caisses.csv', rows);
  };

  const exportJournal = () => {
    const rows = filteredCashJournal.map((entry) => {
      return {
        'Date': entry.date.toLocaleDateString('fr-FR'),
        'Heure': entry.date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        'Description': entry.description,
        'Type': entry.type === 'Entree' ? 'Entrée' : entry.type === 'Sortie' ? 'Sortie' : entry.type,
        'Montant (FCFA)': entry.amount,
        'Solde (FCFA)': entry.balance,
        'Caisse': entry.register,
        'Utilisateur': entry.user,
        'Référence': entry.reference || '-'
      };
    });
    exportCsv('brouillard_de_caisse.csv', rows);
  };

  const renderStockForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Nouveau Mouvement de Stock
          </h3>
          <p className="text-gray-400 text-sm mt-1">Enregistrez une entrée ou une sortie d'article</p>
        </div>
        <button 
          onClick={() => setShowStockForm(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onSubmit={saveStockMovement} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Article</label>
          <select
            value={draftStock.itemId}
            onChange={(e) => setDraftStock({ ...draftStock, itemId: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="">Sélectionner un article</option>
            {stockItems.map(item => <option key={item.id} value={item.id}>{item.productName} ({item.productCode})</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Type de Mouvement</label>
          <select
            value={draftStock.movementType}
            onChange={(e) => setDraftStock({ ...draftStock, movementType: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="entry">Entrée (Stock +)</option>
            <option value="exit">Sortie (Stock -)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Quantité</label>
          <input
            type="number"
            value={draftStock.quantity}
            onChange={(e) => setDraftStock({ ...draftStock, quantity: Number(e.target.value) })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Raison / Motif</label>
          <input
            type="text"
            value={draftStock.reason}
            onChange={(e) => setDraftStock({ ...draftStock, reason: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            placeholder="Ex: Réapprovisionnement, Utilisation service, etc."
            required
          />
        </div>

        <div className="lg:col-span-3 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => setShowStockForm(false)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 border border-gray-700 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-600 to-orange-600 hover:shadow-lg hover:shadow-yellow-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Valider le Mouvement
          </button>
        </div>
      </form>
    </div>
  );

  const renderVisitForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Enregistrer une Visite
          </h3>
          <p className="text-gray-400 text-sm mt-1">Contrôle des accès et enregistrement des visiteurs</p>
        </div>
        <button 
          onClick={() => setShowVisitForm(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onSubmit={saveVisit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Prénom du Visiteur</label>
          <input
            type="text"
            value={draftVisit.firstName}
            onChange={(e) => setDraftVisit({ ...draftVisit, firstName: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="Prénom"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Nom du Visiteur</label>
          <input
            type="text"
            value={draftVisit.name}
            onChange={(e) => setDraftVisit({ ...draftVisit, name: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="Nom"
            required
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Objet de la visite / Observation</label>
          <textarea
            value={draftVisit.observation}
            onChange={(e) => setDraftVisit({ ...draftVisit, observation: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
            placeholder="Pourquoi cette visite ? Qui vient-on voir ?"
            rows={2}
            required
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => setShowVisitForm(false)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 border border-gray-700 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-lg hover:shadow-orange-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Valider l'Entrée
          </button>
        </div>
      </form>
    </div>
  );

  const renderBookingForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Nouvelle Réservation
          </h3>
          <p className="text-gray-400 text-sm mt-1">Saisissez les détails du séjour et de l'occupant</p>
        </div>
        <button 
          onClick={() => setShowBookingForm(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onSubmit={saveBooking} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Client (Compte)</label>
          <select
            value={draftBooking.clientId}
            onChange={(e) => setDraftBooking({ ...draftBooking, clientId: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Chambre</label>
          <select
            value={draftBooking.roomId}
            onChange={(e) => setDraftBooking({ ...draftBooking, roomId: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="">Sélectionner une chambre</option>
            {rooms.map(r => <option key={r.id} value={r.number}>{r.number} - {r.type} ({r.price} FCFA)</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Montant Total</label>
          <input
            type="number"
            value={draftBooking.totalAmount}
            onChange={(e) => setDraftBooking({ ...draftBooking, totalAmount: Number(e.target.value) })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Date d'Arrivée</label>
          <input
            type="date"
            value={draftBooking.checkIn}
            onChange={(e) => setDraftBooking({ ...draftBooking, checkIn: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Date de Départ</label>
          <input
            type="date"
            value={draftBooking.checkOut}
            onChange={(e) => setDraftBooking({ ...draftBooking, checkOut: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            required
          />
        </div>

        <div className="space-y-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Prénom Occupant</label>
            <input
              type="text"
              value={draftBooking.occupantFirstName}
              onChange={(e) => setDraftBooking({ ...draftBooking, occupantFirstName: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Prénom"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Nom Occupant</label>
            <input
              type="text"
              value={draftBooking.occupantLastName}
              onChange={(e) => setDraftBooking({ ...draftBooking, occupantLastName: e.target.value })}
              className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Nom"
              required
            />
          </div>
        </div>

        <div className="lg:col-span-3 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => setShowBookingForm(false)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 border border-gray-700 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            {editingBookingId ? 'Enregistrer les modifications' : 'Confirmer la Réservation'}
          </button>
        </div>
      </form>
    </div>
  );

  const renderServiceForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Nouveau Service Interne
          </h3>
          <p className="text-gray-400 text-sm mt-1">Demande de service pour un client résident</p>
        </div>
        <button 
          onClick={() => setShowServiceForm(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <form onSubmit={saveService} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Client / Résident</label>
          <select
            value={draftService.clientId}
            onChange={(e) => setDraftService({ ...draftService, clientId: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="">Sélectionner un client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Type de Service</label>
          <select
            value={draftService.serviceType}
            onChange={(e) => setDraftService({ ...draftService, serviceType: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="housekeeping">Ménage / Housekeeping</option>
            <option value="room_service">Room Service</option>
            <option value="maintenance">Maintenance</option>
            <option value="laundry">Blanchisserie</option>
            <option value="transport">Transport</option>
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Description / Instructions</label>
          <textarea
            value={draftService.description}
            onChange={(e) => setDraftService({ ...draftService, description: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            placeholder="Détails de la demande..."
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Coût du Service (FCFA)</label>
          <input
            type="number"
            value={draftService.price}
            onChange={(e) => setDraftService({ ...draftService, price: Number(e.target.value) })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
            placeholder="0"
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => setShowServiceForm(false)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 border border-gray-700 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-green-600 to-blue-600 hover:shadow-lg hover:shadow-green-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Enregistrer le Service
          </button>
        </div>
      </form>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hebergement':
        return (
          <div className="space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-3xl shadow-2xl">
                <div className="px-4 py-5 sm:px-8 sm:py-6 border-b border-gray-700/50">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Gestion des Réservations</h2>
                      <p className="text-sm text-gray-400 mt-1">Gérez les arrivées, départs et planning des chambres</p>
                    </div>
                    {!showBookingForm && (
                      <button
                        onClick={() => {
                          setEditingBookingId(null);
                          setDraftBooking({
                            clientId: '',
                            roomId: '',
                            checkIn: new Date().toISOString().split('T')[0],
                            checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                            occupantFirstName: '',
                            occupantLastName: '',
                            totalAmount: 0,
                            occupantIdDocument: '',
                            occupantPhone: '',
                            occupantAddress: '',
                            observation: ''
                          });
                          setShowBookingForm(true);
                        }}
                        className="relative group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 -z-10"></div>
                        <span className="relative">+ Nouvelle réservation</span>
                      </button>
                    )}
                  </div>
                </div>

                {showBookingForm && <div className="p-8">{renderBookingForm()}</div>}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-b border-gray-700/50">
                      <tr>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">N° Réservation</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chambre</th>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Arrivée</th>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Départ</th>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Montant</th>
                        <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Paiement</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredInvoiceBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/5 transition-colors">
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-medium text-white md:table-cell">{booking.bookingNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {booking.guestName}
                          <div className="mt-0.5 text-[11px] font-normal text-gray-400 md:hidden">
                            {booking.checkIn.toLocaleDateString('fr-FR')} au {booking.checkOut.toLocaleDateString('fr-FR')} · {booking.totalAmount.toLocaleString('fr-FR')} FCFA
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{booking.roomNumber}</td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">{booking.roomType}</td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                          {booking.checkIn.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                          {booking.checkOut.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-semibold text-white md:table-cell">
                          {booking.totalAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">
                          {getPaymentMethodLabel(booking.paymentMethod)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status === 'checked_in' ? 'Présent' : 
                             booking.status === 'checked_out' ? 'Parti' :
                             booking.status === 'confirmed' ? 'Confirmé' : 'Annulé'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="text-blue-400 hover:text-blue-300 font-medium mr-3"
                          >
                            Détails
                          </button>
                          {isAdmin && (
                            <button 
                              type="button"
                              onClick={() => {
                                setShowBookingForm(true);
                                setEditingBookingId(booking.id);
                                setDraftBooking({
                                  clientId: booking.clientId,
                                  roomId: booking.roomNumber,
                                  checkIn: booking.checkIn.toISOString().split('T')[0],
                                  checkOut: booking.checkOut.toISOString().split('T')[0],
                                  occupantFirstName: booking.occupantFirstName,
                                  occupantLastName: booking.occupantLastName,
                                  totalAmount: booking.totalAmount,
                                  occupantIdDocument: booking.occupantIdDocument || '',
                                  occupantPhone: booking.occupantPhone || '',
                                  occupantAddress: booking.occupantIdDocument ? '' : '',
                                  observation: ''
                                });
                              }}
                              className="text-green-400 hover:text-green-300 font-medium mr-3"
                            >
                              Modifier
                            </button>
                          )}
                          <button 
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-400 hover:text-red-300 font-medium mr-3"
                          >
                            Supprimer
                          </button>
                          <button
                            type="button"
                            onClick={() => printBookingInvoice(booking)}
                            className="text-gray-400 hover:text-gray-300 font-medium"
                          >
                            Facture
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        );

      case 'visite':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Registre des Visites</h2>
                  <p className="text-sm text-gray-400 mt-1">Suivi des visiteurs et accès à l'établissement.</p>
                </div>
                {!showVisitForm && (
                  <button 
                    onClick={() => setShowVisitForm(true)}
                    className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105"
                  >
                    + Enregistrer une visite
                  </button>
                )}
              </div>

              {showVisitForm && renderVisitForm()}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                      <th className="px-6 py-4">N° Visite</th>
                      <th className="px-6 py-4">Visiteur</th>
                      <th className="px-6 py-4">Objet / Observation</th>
                      <th className="px-6 py-4">Date & Heure</th>
                      <th className="px-6 py-4">Statut</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/30">
                    {visits.map((visit) => (
                      <tr key={visit.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{visit.visitNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{visit.visitorName}</td>
                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">{visit.purpose}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {visit.visitDate.toLocaleDateString()} à {visit.checkInTime}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(visit.status)}`}>
                            {visit.status === 'checked_in' ? 'Présent' : 'Sorti'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button 
                            onClick={() => deleteVisit(visit.id)}
                            className="text-red-400 hover:text-red-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
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

      case 'fiche_stock':
        return (
          <div className="space-y-8">
            {showStockForm && renderStockForm()}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
              <div className="px-8 py-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2.5 border border-gray-700/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800/50"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDraftStock((prev) => ({ ...prev, itemId: '' }));
                        setShowStockForm(true);
                      }}
                      className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-sm"
                    >
                      Mouvement
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stockItems.map((stock) => (
                    <div key={stock.id} className="bg-white/5 border border-gray-700/50 rounded-xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-medium text-white">{stock.productName}</h3>
                          <p className="text-sm text-gray-400 mt-1">{stock.productCode}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(stock.status)}`}>
                          {stock.status === 'available' ? 'Disponible' : stock.status}
                        </span>
                      </div>
                      
                      <div className="space-y-4 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Stock actuel</span>
                          <span className="text-lg font-semibold text-white">{stock.currentStock} {stock.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Valeur totale</span>
                          <span className="text-lg font-semibold text-white">{stock.totalValue.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Coût unitaire</span>
                          <span className="text-sm text-white">{stock.unitCost.toLocaleString('fr-FR')} FCFA</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Fournisseur</span>
                          <span className="text-sm text-white">{stock.supplier || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Seuil minimum</span>
                          <span className="text-sm text-white">{stock.minThreshold} {stock.unit}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Localisation</span>
                          <span className="text-sm text-white">{stock.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedStockItem(stock);
                            setShowStockDetails(true);
                          }}
                          className="flex-1 bg-gray-800/50 border border-gray-700/50 text-gray-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-all duration-200"
                        >
                          Détails
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDraftStock((prev) => ({ ...prev, itemId: stock.id }));
                            setShowStockForm(true);
                          }}
                          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200"
                        >
                          Mouvement
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {showStockDetails && selectedStockItem && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{selectedStockItem.productName}</h3>
                    <button
                      type="button"
                      onClick={() => setShowStockDetails(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Code produit</dt>
                      <dd className="text-white font-medium">{selectedStockItem.productCode}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Stock actuel</dt>
                      <dd className="text-white font-medium">{selectedStockItem.currentStock} {selectedStockItem.unit}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Valeur totale</dt>
                      <dd className="text-white font-medium">{selectedStockItem.totalValue.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Coût unitaire</dt>
                      <dd className="text-white font-medium">{selectedStockItem.unitCost.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Fournisseur</dt>
                      <dd className="text-white font-medium">{selectedStockItem.supplier || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Seuil minimum</dt>
                      <dd className="text-white font-medium">{selectedStockItem.minThreshold} {selectedStockItem.unit}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Localisation</dt>
                      <dd className="text-white font-medium">{selectedStockItem.location}</dd>
                    </div>
                  </dl>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStockDetails(false);
                        setDraftStock((prev) => ({ ...prev, itemId: selectedStockItem.id }));
                        setShowStockForm(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-all"
                    >
                      Enregistrer un mouvement
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'services_internes':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Services Internes</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les services internes demandés par les clients.
                  </p>
                </div>
                {!showServiceForm && (
                  <button 
                    onClick={() => setShowServiceForm(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300 transform hover:scale-105"
                  >
                    + Nouveau service
                  </button>
                )}
              </div>
              
              {showServiceForm && renderServiceForm()}
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Service</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chambre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Coût</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {internalServices.map((service) => (
                      <tr key={service.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{service.serviceNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{service.guestName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{service.roomNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {getServiceTypeLabel(service.serviceType)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{service.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {service.requestDate.toLocaleDateString('fr-FR')} {service.requestDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {service.cost.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {service.paymentStatus === 'charged_to_room' ? 'Débit chambre' :
                           service.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                            {service.status === 'completed' ? 'Complété' :
                             service.status === 'in_progress' ? 'En cours' :
                             service.status === 'pending' ? 'En attente' : 'Annulé'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedService(service)}
                            className="text-blue-400 hover:text-blue-300 mr-2 text-sm"
                          >
                            Détails
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditService(service)}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedService && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-lg w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{selectedService.serviceNumber}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedService(null)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Client</dt>
                      <dd className="text-white font-medium">{selectedService.guestName}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Chambre</dt>
                      <dd className="text-white font-medium">{selectedService.roomNumber}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Type</dt>
                      <dd className="text-white font-medium">{getServiceTypeLabel(selectedService.serviceType)}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Date</dt>
                      <dd className="text-white font-medium">
                        {selectedService.requestDate.toLocaleDateString('fr-FR')} {selectedService.requestDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Coût</dt>
                      <dd className="text-white font-medium">{selectedService.cost.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Paiement</dt>
                      <dd className="text-white font-medium">
                        {selectedService.paymentStatus === 'charged_to_room' ? 'Débit chambre' :
                         selectedService.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className="text-white font-medium">
                        {selectedService.status === 'completed' ? 'Complété' :
                         selectedService.status === 'in_progress' ? 'En cours' :
                         selectedService.status === 'pending' ? 'En attente' : 'Annulé'}
                      </dd>
                    </div>
                  </dl>
                  {selectedService.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{selectedService.description}</p>
                  )}
                </div>
              </div>
            )}

            {showEditServiceModal && editingService && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-lg w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Modifier le service</h3>
                    <button
                      type="button"
                      onClick={() => setShowEditServiceModal(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <form onSubmit={handleSaveEditService} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                      <input
                        type="text"
                        required
                        value={editServiceDraft.description}
                        onChange={(e) => setEditServiceDraft({ ...editServiceDraft, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</label>
                        <select
                          value={editServiceDraft.serviceType}
                          onChange={(e) => setEditServiceDraft({ ...editServiceDraft, serviceType: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="housekeeping">Ménage</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="room_service">Room Service</option>
                          <option value="laundry">Blanchisserie</option>
                          <option value="transport">Transport</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Coût</label>
                        <input
                          type="number"
                          min="0"
                          value={editServiceDraft.cost}
                          onChange={(e) => setEditServiceDraft({ ...editServiceDraft, cost: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Statut</label>
                        <select
                          value={editServiceDraft.status}
                          onChange={(e) => setEditServiceDraft({ ...editServiceDraft, status: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="pending">En attente</option>
                          <option value="in_progress">En cours</option>
                          <option value="completed">Complété</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Paiement</label>
                        <select
                          value={editServiceDraft.paymentStatus}
                          onChange={(e) => setEditServiceDraft({ ...editServiceDraft, paymentStatus: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        >
                          <option value="pending">En attente</option>
                          <option value="paid">Payé</option>
                          <option value="charged_to_room">Débit chambre</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditServiceModal(false)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'main_courante':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Main Courante Réception</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez les incidents et événements de la réception.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenMainEntryForm}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouvelle entrée
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Titre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priorité</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Localisation</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rapporté par</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {mainCourante.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.entryDate.toLocaleDateString('fr-FR')} {entry.entryTime}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{entry.title}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">
                            {entry.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">
                            {entry.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.location}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.reportedBy}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status === 'in_progress' ? 'En cours' : entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMainEntry(entry);
                              setShowMainEntryDetails(true);
                            }}
                            className="text-blue-400 hover:text-blue-300 mr-2 text-sm"
                          >
                            Détails
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEditMainEntry(entry)}
                            className="text-green-400 hover:text-green-300 text-sm"
                          >
                            Modifier
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {showMainEntryForm && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-lg w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Nouvelle entrée - Main courante</h3>
                    <button
                      type="button"
                      onClick={() => setShowMainEntryForm(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <form onSubmit={handleAddMainEntry} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</label>
                        <input
                          type="date"
                          value={newEntryDraft.dateOperation}
                          onChange={(e) => setNewEntryDraft({ ...newEntryDraft, dateOperation: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Heure</label>
                        <input
                          type="time"
                          value={newEntryDraft.heureOperation}
                          onChange={(e) => setNewEntryDraft({ ...newEntryDraft, heureOperation: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Libellé</label>
                      <input
                        type="text"
                        required
                        value={newEntryDraft.libelle}
                        onChange={(e) => setNewEntryDraft({ ...newEntryDraft, libelle: e.target.value })}
                        placeholder="Description de l'événement"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Crédit</label>
                        <input
                          type="number"
                          min="0"
                          value={newEntryDraft.credit}
                          onChange={(e) => setNewEntryDraft({ ...newEntryDraft, credit: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Débit</label>
                        <input
                          type="number"
                          min="0"
                          value={newEntryDraft.debit}
                          onChange={(e) => setNewEntryDraft({ ...newEntryDraft, debit: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowMainEntryForm(false)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showMainEntryDetails && selectedMainEntry && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{selectedMainEntry.title}</h3>
                    <button
                      type="button"
                      onClick={() => setShowMainEntryDetails(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Date/Heure</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.entryDate.toLocaleDateString('fr-FR')} {selectedMainEntry.entryTime}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Catégorie</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.category}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Priorité</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.priority}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Localisation</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.location}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Rapporté par</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.reportedBy}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className="text-white font-medium">{selectedMainEntry.status}</dd>
                    </div>
                  </dl>
                  {selectedMainEntry.description && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{selectedMainEntry.description}</p>
                  )}
                </div>
              </div>
            )}

            {showEditEntryModal && editingMainEntry && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-lg w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Modifier l'entrée</h3>
                    <button
                      type="button"
                      onClick={() => setShowEditEntryModal(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <form onSubmit={handleSaveEditEntry} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Libellé</label>
                      <input
                        type="text"
                        required
                        value={editEntryDraft.libelle}
                        onChange={(e) => setEditEntryDraft({ ...editEntryDraft, libelle: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Crédit</label>
                        <input
                          type="number"
                          min="0"
                          value={editEntryDraft.credit}
                          onChange={(e) => setEditEntryDraft({ ...editEntryDraft, credit: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Débit</label>
                        <input
                          type="number"
                          min="0"
                          value={editEntryDraft.debit}
                          onChange={(e) => setEditEntryDraft({ ...editEntryDraft, debit: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowEditEntryModal(false)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
                      >
                        Mettre à jour
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'planning_occupation':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Planning d'Occupation</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Visualisez l'occupation des chambres et planning.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => fetchData()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Actualiser
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {occupancyPlanning.map((room) => (
                  <div key={room.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{room.roomNumber}</h3>
                        <p className="text-sm text-gray-400">{room.roomType}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.status)}`}>
                        {room.status === 'occupied' ? 'Occupée' :
                         room.status === 'available' ? 'Disponible' :
                         room.status === 'maintenance' ? 'Maintenance' : 'Réservée'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      {room.guestName && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Client:</span>
                          <span className="text-white">{room.guestName}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tarif:</span>
                        <span className="text-white">{room.rate.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Nettoyage:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(room.cleaningStatus)}`}>
                          {room.cleaningStatus === 'clean' ? 'Propre' :
                           room.cleaningStatus === 'dirty' ? 'Sale' : 'En cours'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlanningRoom(room)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Détails
                      </button>
                      {room.status === 'available' && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBookingId(null);
                            setDraftBooking({
                              clientId: '',
                              roomId: room.roomNumber,
                              checkIn: new Date().toISOString().split('T')[0],
                              checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                              occupantFirstName: '',
                              occupantLastName: '',
                              totalAmount: 0,
                              occupantIdDocument: '',
                              occupantPhone: '',
                              occupantAddress: '',
                              observation: ''
                            });
                            setShowBookingForm(true);
                            setActiveTab('hebergement');
                          }}
                          className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Réserver
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedPlanningRoom && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Chambre {selectedPlanningRoom.roomNumber}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanningRoom(null)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Type</dt>
                      <dd className="text-white font-medium">{selectedPlanningRoom.roomType}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className="text-white font-medium">{selectedPlanningRoom.status}</dd>
                    </div>
                    {selectedPlanningRoom.guestName && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <dt className="text-gray-400">Client</dt>
                        <dd className="text-white font-medium">{selectedPlanningRoom.guestName}</dd>
                      </div>
                    )}
                    {selectedPlanningRoom.checkIn && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <dt className="text-gray-400">Arrivée</dt>
                        <dd className="text-white font-medium">{selectedPlanningRoom.checkIn.toLocaleDateString('fr-FR')}</dd>
                      </div>
                    )}
                    {selectedPlanningRoom.checkOut && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <dt className="text-gray-400">Départ</dt>
                        <dd className="text-white font-medium">{selectedPlanningRoom.checkOut.toLocaleDateString('fr-FR')}</dd>
                      </div>
                    )}
                    {selectedPlanningRoom.rate !== undefined && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <dt className="text-gray-400">Tarif</dt>
                        <dd className="text-white font-medium">{selectedPlanningRoom.rate.toLocaleString('fr-FR')} FCFA</dd>
                      </div>
                    )}
                    {selectedPlanningRoom.cleaningStatus && (
                      <div className="flex justify-between">
                        <dt className="text-gray-400">Ménage</dt>
                        <dd className="text-white font-medium">{selectedPlanningRoom.cleaningStatus}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </div>
            )}
          </div>
        );

      case 'caisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Caisses</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez l'état des caisses et les transactions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('ouverture_fermeture')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Nouvelle caisse
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cashRegisters.map((register) => (
                  <div key={register.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{register.registerNumber}</h3>
                        <p className="text-sm text-gray-400">Ouverte par: {register.openedBy}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(register.status)}`}>
                        {register.status === 'open' ? 'Ouverte' : 'Fermée'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Solde d'ouverture</p>
                        <p className="text-lg font-bold text-white">{register.openingBalance.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Solde actuel</p>
                        <p className="text-lg font-bold text-white">{register.currentBalance.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Entrées</p>
                        <p className="text-sm text-green-400 font-medium">+{register.cashIn.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Sorties</p>
                        <p className="text-sm text-red-400 font-medium">-{register.cashOut.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ventes totales</p>
                        <p className="text-lg font-bold text-blue-400">{register.totalSales.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ouverture</p>
                        <p className="text-sm text-white">{register.openedAt.toLocaleTimeString('fr-FR')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedCashRegister(register)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Détails
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCashMovementRegister(register);
                          setCashMovementDraft({ type: 'cash_in', amount: '', description: '' });
                          setShowCashMovementModal(true);
                        }}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Mouvement
                      </button>
                      {register.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => {
                            setClosingForm((prev: any) => ({ ...prev, registerNumber: register.registerNumber }));
                            setActiveTab('ouverture_fermeture');
                          }}
                          className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          Fermer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCashRegister && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Caisse {selectedCashRegister.registerNumber}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedCashRegister(null)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className="text-white font-medium">{selectedCashRegister.status === 'open' ? 'Ouverte' : 'Fermée'}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Ouverte par</dt>
                      <dd className="text-white font-medium">{selectedCashRegister.openedBy}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Solde d'ouverture</dt>
                      <dd className="text-white font-medium">{selectedCashRegister.openingBalance.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Solde actuel</dt>
                      <dd className="text-white font-medium">{selectedCashRegister.currentBalance.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Entrées</dt>
                      <dd className="text-green-400 font-medium">+{selectedCashRegister.cashIn.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Sorties</dt>
                      <dd className="text-red-400 font-medium">-{selectedCashRegister.cashOut.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Ouverture</dt>
                      <dd className="text-white font-medium">{selectedCashRegister.openedAt.toLocaleTimeString('fr-FR')}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {showCashMovementModal && cashMovementRegister && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-md w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Mouvement - Caisse {cashMovementRegister.registerNumber}</h3>
                    <button
                      type="button"
                      onClick={() => setShowCashMovementModal(false)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <form onSubmit={handleSaveCashMovement} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Type</label>
                      <select
                        value={cashMovementDraft.type}
                        onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, type: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      >
                        <option value="cash_in">Entrée</option>
                        <option value="cash_out">Sortie</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Montant</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={cashMovementDraft.amount}
                        onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, amount: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                      <input
                        type="text"
                        value={cashMovementDraft.description}
                        onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCashMovementModal(false)}
                        className="px-4 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-semibold"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        );

      case 'impression_factures':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Impression des Factures</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Imprimez et gérez les factures clients.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher une facture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Facture</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chambre</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredInvoiceBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{booking.bookingNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{booking.guestName}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{booking.roomNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {booking.createdAt.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {booking.totalAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {getPaymentMethodLabel(booking.paymentMethod)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                            {booking.status === 'checked_in' ? 'En cours' :
                             booking.status === 'checked_out' ? 'Payée' :
                             booking.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(booking)}
                            className="text-blue-400 hover:text-blue-300 mr-2 text-sm"
                          >
                            Voir
                          </button>
                          <button
                            type="button"
                            onClick={() => printBookingInvoice(booking)}
                            className="text-green-400 hover:text-green-300 mr-2 text-sm"
                          >
                            Imprimer
                          </button>
                          <button
                            type="button"
                            onClick={() => emailBookingInvoice(booking)}
                            className="text-gray-300 hover:text-gray-200 text-sm"
                          >
                            Email
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

      case 'transfert_intercaisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Transfert Inter-Caisse</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les transferts entre caisses.
                  </p>
                </div>
              </div>
              {feedback && (
                <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  {feedback}
                </div>
              )}
              <form onSubmit={handleTransferSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Caisse source</label>
                    <select
                      value={transferForm.fromRegister}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, fromRegister: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner la caisse source</option>
                      {cashRegisters.map((register) => (
                        <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Caisse destination</label>
                    <select
                      value={transferForm.toRegister}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, toRegister: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner la caisse destination</option>
                      {cashRegisters.map((register) => (
                        <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Montant</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Date</label>
                    <input
                      type="date"
                      value={transferForm.transferDate}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, transferDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-300 mb-1">Motif</label>
                    <input
                      type="text"
                      value={transferForm.reason}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Motif du transfert..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetTransferForm}
                    className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium hover:bg-white/5"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    Soumettre pour approbation
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white">Historique des transferts</h3>
                <button
                  type="button"
                  onClick={exportTransfers}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <FaDownload /> Exporter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Transfert</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">De</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Vers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Motif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {cashTransfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{transfer.transferNumber}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transfer.fromRegister}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transfer.toRegister}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {transfer.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{transfer.reason}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={'px-2 py-1 text-xs font-medium rounded-full ' + getStatusColor(transfer.status)}>
                            {transfer.status === 'completed' ? 'Complété' : transfer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedTransfer(transfer)}
                            className="text-blue-400 hover:text-blue-300 mr-2 text-sm"
                          >
                            Détails
                          </button>
                          {transfer.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => approveTransfer(transfer.id)}
                              className="text-green-400 hover:text-green-300 text-sm mr-2"
                            >
                              Approuver
                            </button>
                          )}
                          {transfer.status === 'pending' && (
                            <>
                              <button
                                type="button"
                                onClick={() => cancelTransfer(transfer.id)}
                               className="text-yellow-300 hover:text-yellow-200 text-sm mr-2"
                              >
                                Annuler
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteTransfer(transfer.id)}
                                className="text-red-400 hover:text-red-300 text-sm"
                              >
                                Supprimer
                              </button>
                            </>
                          )}
                          {transfer.status === 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => deleteTransfer(transfer.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedTransfer && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-[#0d1327] border border-gray-700/60 rounded-2xl p-8 max-w-lg w-full mx-4">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{selectedTransfer.transferNumber}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedTransfer(null)}
                      className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 hover:border-gray-500 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Date</dt>
                      <dd className="text-white font-medium">
                        {selectedTransfer.transferDate ? new Date(selectedTransfer.transferDate).toLocaleDateString('fr-FR') : '-'}
                      </dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Caisse source</dt>
                      <dd className="text-white font-medium">{selectedTransfer.fromRegister}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Caisse destination</dt>
                      <dd className="text-white font-medium">{selectedTransfer.toRegister}</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Montant</dt>
                      <dd className="text-white font-medium">{selectedTransfer.amount.toLocaleString('fr-FR')} FCFA</dd>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-2">
                      <dt className="text-gray-400">Demandé par</dt>
                      <dd className="text-white font-medium">{selectedTransfer.requestedBy || '-'}</dd>
                    </div>
                    {selectedTransfer.approvedBy && (
                      <div className="flex justify-between border-b border-white/10 pb-2">
                        <dt className="text-gray-400">Approuvé par</dt>
                        <dd className="text-white font-medium">{selectedTransfer.approvedBy}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-400">Statut</dt>
                      <dd className="text-white font-medium">
                        {selectedTransfer.status === 'completed' ? 'Complété' :
                         selectedTransfer.status === 'pending' ? 'En attente' :
                         selectedTransfer.status === 'cancelled' ? 'Annulé' : selectedTransfer.status}
                      </dd>
                    </div>
                  </dl>
                  {selectedTransfer.reason && (
                    <p className="mt-4 text-sm text-gray-300 border-t border-white/10 pt-4">{selectedTransfer.reason}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'brouillard_caisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Brouillard de Caisse</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Consultez le journal détaillé des opérations.
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
                    value={filterRegister}
                    onChange={(e) => setFilterRegister(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les caisses</option>
                    {cashRegisters.map(register => (
                      <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={exportJournal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <FaDownload /> Exporter
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solde</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Caisse</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredCashJournal.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.date.toLocaleDateString('fr-FR')} {entry.date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.description}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
                            {entry.type === 'opening' ? 'Ouverture' :
                             entry.type === 'sale' ? 'Vente' :
                             entry.type === 'cash_in' ? 'Entrée' :
                             entry.type === 'cash_out' ? 'Sortie' :
                             entry.type === 'transfer' ? 'Transfert' : 'Fermeture'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {entry.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {entry.balance.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.register}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.user}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.reference || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {entry.type === 'closing' && entry.sourceType === 'register-closing' && entry.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => cancelClosure(entry.id)}
                              className="text-yellow-300 hover:text-yellow-200 text-sm"
                            >
                              Annuler
                            </button>
                          )}
                          {entry.type === 'closing' && entry.sourceType === 'register-closing' && entry.status === 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => deleteClosure(entry.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Supprimer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'ouverture_fermeture':
        return (
          <>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Ouverture/Fermeture Caisse</h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Gérez l'ouverture et la fermeture des caisses.
                    </p>
                  </div>
                </div>
                {feedback && (
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                    {feedback}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Ouverture de Caisse</h3>
                  <form onSubmit={handleOpeningSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Caisse</label>
                      <select
                        value={openingForm.registerNumber}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, registerNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner une caisse</option>
                        {cashRegisters.filter(r => r.status === 'closed').map(register => (
                          <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Solde d'ouverture</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={openingForm.amount}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Responsable</label>
                      <input
                        type="text"
                        value={openingForm.responsible}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, responsible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nom du responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={openingForm.notes}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notes d'ouverture..."
                      />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                        Ouvrir la caisse
                      </button>
                    </div>
                  </form>
                </div>
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Fermeture de Caisse</h3>
                  <form onSubmit={handleClosingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Caisse</label>
                      <select
                        value={closingForm.registerNumber}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, registerNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner une caisse</option>
                        {cashRegisters.filter(r => r.status === 'open').map(register => (
                          <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Solde théorique</label>
                      <input
                        type="number"
                        readOnly
                        value={closingRegister?.currentBalance ?? 0}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm bg-white/5"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Solde réel</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={closingForm.amount}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Écart</label>
                      <input
                        type="text"
                        readOnly
                        value={closingDifference.toLocaleString('fr-FR') + ' FCFA'}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm font-medium bg-white/5"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Responsable</label>
                      <input
                        type="text"
                        value={closingForm.responsible}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, responsible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nom du responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={closingForm.notes}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notes de fermeture..."
                      />
                    </div>
                    <div>
                      <button type="submit" className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                        Fermer la caisse
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-full mx-auto px-6 lg:px-8 py-8">
        {/* Navigation Tabs épurée */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-8 px-8 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`no-auto-icon inline-flex items-center gap-3 py-4 px-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <ReceptionTabIcon tabKey={tab.key} className="h-[18px] w-[18px] flex-none" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-400">Chargement des données...</span>
              </div>
            ) : renderTabContent()}
          </div>
        </div>
      </div>
      {renderBookingDetailsModal()}
    </div>
  );
};

export default Reception;
