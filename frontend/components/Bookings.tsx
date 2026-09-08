import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { ReservationStatus, Room, RoomStatus } from '../types';
import { normalizeRole, readCurrentUser } from '../utils/accessControl';

interface BookingsProps {
  rooms?: Room[];
  onUpdateRoomStatus?: (roomId: string, status: RoomStatus) => Promise<void>;
}

type ClientDto = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  idDocument: string | null;
  address: string | null;
  clientType: string | null;
  companyName: string | null;
  balance: number;
  totalStays: number;
  lastStay: string | null;
  createdAt: string | null;
  status: string | null;
};

type ReservationDto = {
  id: number;
  clientId: number;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  clientType: string | null;
  companyName: string | null;
  occupantFirstName: string | null;
  occupantLastName: string | null;
  occupantIdDocument: string | null;
  occupantPhone: string | null;
  roomType: string | null;
  clientName: string | null;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

const emptyFormData = {
  clientId: '',
  roomId: '',
  checkIn: '',
  checkOut: '',
  occupantFirstName: '',
  occupantLastName: '',
  occupantIdDocument: '',
  occupantPhone: ''
};

const extractApiMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: string; errors?: Record<string, string> } | string };
      message?: string;
    };
    const data = maybeError.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data === 'object' && data !== null) {
      const message = data.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return firstError;
      }
    }
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
  }
  return fallback;
};

const Bookings: React.FC<BookingsProps> = ({ rooms = [], onUpdateRoomStatus }) => {
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');

  const currentUser = readCurrentUser();
  const isAdmin = normalizeRole(currentUser?.role) === 'Admin';

  const [formData, setFormData] = useState(emptyFormData);

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => {
    setFlash({ tone, text });
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientsResponse, reservationsResponse] = await Promise.all([
        api.get<ClientDto[]>('/clients'),
        api.get<ReservationDto[]>('/reservations')
      ]);
      setClients(Array.isArray(clientsResponse.data) ? clientsResponse.data : []);
      setReservations(Array.isArray(reservationsResponse.data) ? reservationsResponse.data : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Impossible de charger les réservations.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const clientsSorted = useMemo(() => {
    return [...clients].sort((a, b) => {
      const isPM = (c: ClientDto) => (c.clientType === 'Personne morale' ? 1 : 0);
      return isPM(b) - isPM(a);
    });
  }, [clients]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case ReservationStatus.PENDING: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case ReservationStatus.CANCELLED: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default: return 'bg-white/5 text-gray-400 border-gray-500/20';
    }
  };

  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const client = clients.find(c => c.id === reservation.clientId);
      const occupantFullName = `${reservation.occupantFirstName || ''} ${reservation.occupantLastName || ''}`.toLowerCase();
      const search = searchTerm.toLowerCase();
      const matchesSearch = search === '' ||
        (reservation.clientName || '').toLowerCase().includes(search) ||
        (client?.email || '').toLowerCase().includes(search) ||
        String(reservation.id).toLowerCase().includes(search) ||
        occupantFullName.includes(search);
      const matchesStatus = filterStatus === 'Tous' || reservation.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reservations, clients, searchTerm, filterStatus]);

  const selectableRooms = useMemo(() => {
    const base = rooms.filter(room => room.status === RoomStatus.AVAILABLE);
    if (editingReservation) {
      const currentRoom = rooms.find(r => r.id === editingReservation.roomId);
      if (currentRoom && !base.some(r => r.id === currentRoom.id)) {
        return [...base, currentRoom];
      }
    }
    return base;
  }, [rooms, editingReservation]);

  const calculateTotalAmount = (roomId: string, checkIn: string, checkOut: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room || !checkIn || !checkOut) return 0;

    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights * room.price : 0;
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => String(c.id) === clientId);
    const isCompany = client?.clientType === 'Personne morale';
    setFormData(prev => ({
      ...prev,
      clientId,
      occupantFirstName: isCompany ? '' : (client?.firstName || ''),
      occupantLastName: isCompany ? '' : (client?.lastName || ''),
      occupantIdDocument: isCompany ? '' : (client?.idDocument || ''),
      occupantPhone: isCompany ? '' : (client?.phone || '')
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.roomId) return;

    const totalAmount = calculateTotalAmount(formData.roomId, formData.checkIn, formData.checkOut);

    setSubmitting(true);
    try {
      const payload = {
        clientId: Number(formData.clientId),
        roomId: formData.roomId,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        status: editingReservation ? editingReservation.status : ReservationStatus.PENDING,
        totalAmount,
        occupantFirstName: formData.occupantFirstName.trim(),
        occupantLastName: formData.occupantLastName.trim(),
        occupantIdDocument: formData.occupantIdDocument.trim(),
        occupantPhone: formData.occupantPhone.trim()
      };

      if (editingReservation) {
        await api.put(`/reservations/${editingReservation.id}`, payload);
        showFlash('success', 'Réservation mise à jour avec succès.');
      } else {
        await api.post('/reservations', payload);
        showFlash('success', 'Réservation créée avec succès.');
      }

      setShowAddModal(false);
      setEditingReservation(null);
      setFormData(emptyFormData);
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Erreur lors de l\'enregistrement de la réservation.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (reservation: ReservationDto) => {
    if (!isAdmin) return;
    setEditingReservation(reservation);
    setFormData({
      clientId: String(reservation.clientId),
      roomId: reservation.roomId,
      checkIn: reservation.checkIn.slice(0, 10),
      checkOut: reservation.checkOut.slice(0, 10),
      occupantFirstName: reservation.occupantFirstName || '',
      occupantLastName: reservation.occupantLastName || '',
      occupantIdDocument: reservation.occupantIdDocument || '',
      occupantPhone: reservation.occupantPhone || ''
    });
    setShowAddModal(true);
  };

  const handleStatusUpdate = async (reservation: ReservationDto, status: ReservationStatus) => {
    try {
      await api.put(`/reservations/${reservation.id}`, {
        clientId: reservation.clientId,
        roomId: reservation.roomId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        status,
        totalAmount: reservation.totalAmount,
        occupantFirstName: reservation.occupantFirstName || '',
        occupantLastName: reservation.occupantLastName || '',
        occupantIdDocument: reservation.occupantIdDocument || '',
        occupantPhone: reservation.occupantPhone || ''
      });

      if (onUpdateRoomStatus) {
        if (status === ReservationStatus.CONFIRMED) {
          await onUpdateRoomStatus(reservation.roomId, RoomStatus.OCCUPIED);
        } else if (status === ReservationStatus.CANCELLED) {
          await onUpdateRoomStatus(reservation.roomId, RoomStatus.AVAILABLE);
        }
      }

      showFlash('success', 'Statut de la réservation mis à jour.');
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Erreur lors de la mise à jour du statut.'));
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Gestion des Réservations</h2>
          <p className="text-gray-400 font-medium">Suivi complet des réservations de vos clients</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Réservation
        </button>
      </div>

      {flash && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${
          flash.tone === 'success'
            ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
            : flash.tone === 'info'
              ? 'border-sky-500/25 bg-sky-500/10 text-sky-300'
              : 'border-rose-500/25 bg-rose-500/10 text-rose-300'
        }`}>
          {flash.text}
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Recherche</label>
            <input
              type="text"
              placeholder="Nom du client, ID réservation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Tous">Tous</option>
              <option value={ReservationStatus.PENDING}>En attente</option>
              <option value={ReservationStatus.CONFIRMED}>Confirmée</option>
              <option value={ReservationStatus.CANCELLED}>Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tableau des réservations */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Client</th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Payeur</th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Occupant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Chambre</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Dates</th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Nuitées</th>
                <th className="hidden px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Montant</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-400">Chargement des réservations...</td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-10 text-center text-sm text-gray-400">Aucune réservation trouvée.</td>
                </tr>
              ) : filteredReservations.map((reservation) => {
                const client = clients.find(c => c.id === reservation.clientId);
                const room = rooms.find(r => r.id === reservation.roomId);
                const checkInDate = new Date(reservation.checkIn);
                const checkOutDate = new Date(reservation.checkOut);
                const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
                const clientTypeLabel = reservation.clientType || client?.clientType || 'Personne physique';
                const clientDisplayName = clientTypeLabel === 'Personne morale'
                  ? reservation.companyName || client?.companyName || reservation.clientName
                  : reservation.clientName || `${client?.firstName || ''} ${client?.lastName || ''}`.trim();
                const payorLabel = clientTypeLabel === 'Personne morale'
                  ? reservation.companyName || client?.companyName || 'Société (payeur)'
                  : `${reservation.occupantFirstName || ''} ${reservation.occupantLastName || ''}`.trim();

                return (
                  <tr key={reservation.id} className="hover:bg-white/5 transition-colors">
                    <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-400 md:table-cell">
                      #{reservation.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{clientDisplayName}</div>
                      <div className="text-xs text-gray-400">{client?.email}</div>
                      <div className="mt-1 text-[11px] text-gray-400 md:hidden">
                        {clientTypeLabel} · {nights} nuitée{nights > 1 ? 's' : ''} · {Number(reservation.totalAmount || 0).toLocaleString('fr-FR')} FCFA
                      </div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                      <span className="px-2 py-1 rounded-full border border-white/10 text-xs text-gray-200 bg-white/5">
                        {clientTypeLabel}
                      </span>
                      {(reservation.companyName || client?.companyName) && (
                        <div className="text-[11px] text-gray-400 mt-1">{reservation.companyName || client?.companyName}</div>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                      <div className="text-sm font-medium text-white">{payorLabel}</div>
                      {clientTypeLabel === 'Personne morale' && (
                        <div className="text-[11px] text-gray-400">Paie pour l'occupant</div>
                      )}
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                      <div className="text-sm font-medium text-white">{reservation.occupantFirstName} {reservation.occupantLastName}</div>
                      <div className="text-xs text-gray-400">{reservation.occupantPhone}</div>
                      <div className="text-[11px] text-gray-400">{reservation.occupantIdDocument}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      Chambre {room?.number || reservation.roomId} ({room?.type || reservation.roomType})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <div>{checkInDate.toLocaleDateString('fr-FR')}</div>
                      <div className="text-xs text-gray-400">au {checkOutDate.toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-300 md:table-cell">
                      {nights} nuitée{nights > 1 ? 's' : ''}
                    </td>
                    <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400 md:table-cell">
                      {Number(reservation.totalAmount || 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(reservation.status)}`}>
                        {reservation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(reservation)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                            title="Modifier"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        )}
                        {reservation.status === ReservationStatus.PENDING && (
                          <button
                            onClick={() => handleStatusUpdate(reservation, ReservationStatus.CONFIRMED)}
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title="Confirmer"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {reservation.status !== ReservationStatus.CANCELLED && (
                          <button
                            onClick={() => handleStatusUpdate(reservation, ReservationStatus.CANCELLED)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                            title="Annuler"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#050714] border border-white/10 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingReservation ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Client</label>
                  <select
                    required
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {clientsSorted.map(client => (
                      <option key={client.id} value={String(client.id)} className="bg-[#050714]">
                        {client.clientType === 'Personne morale'
                          ? `${client.companyName || 'Société'} (PM)`
                          : `${client.firstName || ''} ${client.lastName || ''}`.trim()}
                      </option>
                    ))}
                  </select>
                  {formData.clientId && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Type client : {clients.find(c => String(c.id) === formData.clientId)?.clientType || 'Personne physique'}
                      {clients.find(c => String(c.id) === formData.clientId)?.companyName ? ` • ${clients.find(c => String(c.id) === formData.clientId)?.companyName}` : ''}
                    </p>
                  )}
                  {!formData.clientId && (
                    <p className="text-[11px] text-gray-400 mt-2">
                      Astuce : les clients personnes morales sont marqués « (PM) » et affichés en premier. Ils peuvent payer pour un occupant physique.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Chambre</label>
                  <select
                    required
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner une chambre</option>
                    {selectableRooms.map(room => (
                      <option key={room.id} value={room.id} className="bg-[#050714]">
                        Chambre {room.number} ({room.type}) - {room.price.toLocaleString('fr-FR')} FCFA/nuit
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-sm font-semibold text-white mb-3">
                    Occupant (toujours personne physique) {clients.find(c => String(c.id) === formData.clientId)?.clientType === 'Personne morale' ? '— le client (personne morale) paie pour cet occupant' : ''}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Prénom</label>
                      <input
                        type="text"
                        required
                        value={formData.occupantFirstName}
                        onChange={(e) => setFormData({ ...formData, occupantFirstName: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Prénom de l'occupant"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Nom</label>
                      <input
                        type="text"
                        required
                        value={formData.occupantLastName}
                        onChange={(e) => setFormData({ ...formData, occupantLastName: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Nom de l'occupant"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Document d'identité</label>
                      <input
                        type="text"
                        required
                        value={formData.occupantIdDocument}
                        onChange={(e) => setFormData({ ...formData, occupantIdDocument: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="CNI / Passeport"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">Téléphone</label>
                      <input
                        type="text"
                        required
                        value={formData.occupantPhone}
                        onChange={(e) => setFormData({ ...formData, occupantPhone: e.target.value })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+237 ..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date d'arrivée</label>
                  <input
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    min={editingReservation ? undefined : new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Date de départ</label>
                  <input
                    type="date"
                    required
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    min={formData.checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Aperçu du calcul */}
              {formData.roomId && formData.checkIn && formData.checkOut && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">Montant estimé :</span>
                    <span className="text-lg font-bold text-blue-400">
                      {calculateTotalAmount(formData.roomId, formData.checkIn, formData.checkOut).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Enregistrement...' : editingReservation ? 'Mettre à jour' : 'Créer la réservation'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReservation(null);
                    setFormData(emptyFormData);
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookings;
