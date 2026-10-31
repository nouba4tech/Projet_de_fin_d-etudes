import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { ReservationStatus, Room, RoomStatus } from '../types';
import { normalizeRole, readCurrentUser } from '../utils/accessControl';
import RoomAvailabilityPanel from './RoomAvailabilityPanel';
import BookingWizard from './BookingWizard';

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
  const [clientsState, setClientsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  // new bookings: 4-step wizard with the identity check; the modal below only edits
  const [showWizard, setShowWizard] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationDto | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('Tous');

  const currentUser = readCurrentUser();
  const isAdmin = normalizeRole(currentUser?.role) === 'Admin';

  const [formData, setFormData] = useState(emptyFormData);

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => {
    setFlash({ tone, text });
  };

  // Clients and reservations load separately: the reservation list is heavy on a slow connection, and the
  // client dropdown of the form must not wait for it.
  const loadClients = async () => {
    setClientsState('loading');
    try {
      const response = await api.get<ClientDto[]>('/clients');
      setClients(Array.isArray(response.data) ? response.data : []);
      setClientsState('ready');
    } catch (error) {
      setClientsState('error');
      showFlash('error', extractApiMessage(error, 'Impossible de charger les clients.'));
    }
  };

  const loadReservations = async () => {
    setLoading(true);
    try {
      const response = await api.get<ReservationDto[]>('/reservations');
      setReservations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Impossible de charger les réservations.'));
    } finally {
      setLoading(false);
    }
  };

  const loadData = async () => {
    await Promise.all([loadClients(), loadReservations()]);
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
    // keep the room being edited, or the one picked in the availability search (free on its dates, maybe not today)
    const keep = editingReservation?.roomId ?? formData.roomId;
    if (keep) {
      const currentRoom = rooms.find(r => r.id === keep);
      if (currentRoom && !base.some(r => r.id === currentRoom.id)) {
        return [...base, currentRoom];
      }
    }
    return base;
  }, [rooms, editingReservation, formData.roomId]);

  const openBookingForRoom = (_roomId: string, _checkIn: string, _checkOut: string) => {
    setFlash(null);
    setShowWizard(true);
  };

  // Real cancellation (reservations-service): the invoice is cancelled, the room freed and the client notified.
  // Refused by the server when the invoice was already paid or the stay is over.
  const handleCancel = async (reservation: ReservationDto) => {
    const reason = window.prompt(`Motif de l'annulation de la réservation #${reservation.id} :`, '');
    if (reason === null) return;
    try {
      await api.post(`/reservations/${reservation.id}/annulation`, { reason: reason.trim() || null });
      showFlash('success', `Réservation #${reservation.id} annulée : facture annulée, chambre libérée, client prévenu.`);
      await loadReservations();
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Impossible d\'annuler la réservation.'));
    }
  };

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
      await loadReservations();
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
    setFlash(null);
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
      await loadReservations();
    } catch (error) {
      showFlash('error', extractApiMessage(error, 'Erreur lors de la mise à jour du statut.'));
    }
  };

  const statusTag = (status: string) => {
    switch (status) {
      case ReservationStatus.CONFIRMED: return 'gv-tag gv-tag--success';
      case ReservationStatus.PENDING: return 'gv-tag gv-tag--warning';
      case ReservationStatus.CANCELLED: return 'gv-tag gv-tag--error';
      default: return 'gv-tag gv-tag--info';
    }
  };
  const countByStatus = (status: string) => reservations.filter(r => r.status === status).length;
  const scrollTo = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const filterAndShow = (status: string) => (event: React.MouseEvent) => {
    setFilterStatus(status);
    scrollTo('liste-reservations')(event);
  };
  const updatedAt = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  // Page laid out like the French government sites (info.gouv.fr): see the "gv" styles in index.css
  return (
    <div className="gv-page -m-4 md:-m-10 min-h-full">
      <div className="gv-container">
        <nav className="gv-breadcrumb" aria-label="Vous êtes ici">
          <a href="#/dashboard">Accueil</a> <span aria-hidden="true">›</span>{' '}
          <a href="#/reception">Réception</a> <span aria-hidden="true">›</span>{' '}
          <span aria-current="page">Réservations</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_260px] gap-10 xl:gap-14">
          <div className="min-w-0">
            <h1 className="gv-h1">Les réservations de l'hôtel</h1>
            <div className="gv-rule" />
            <p className="gv-meta">Mis à jour le {updatedAt} · {reservations.length} réservation{reservations.length > 1 ? 's' : ''} enregistrée{reservations.length > 1 ? 's' : ''}</p>
            <p className="gv-lead">
              Créez une réservation en quatre étapes, trouvez une chambre libre et suivez les séjours de vos clients.
              L'identité de chaque client est vérifiée avant la confirmation.
            </p>

            <div id="nouvelle-reservation" className="flex flex-wrap gap-3">
              <button type="button" className="gv-btn" onClick={() => { setFlash(null); setShowWizard(true); }}>
                Nouvelle réservation
              </button>
              <a href="#/bookings" className="gv-btn gv-btn--secondary" onClick={scrollTo('chambres-libres')}>
                Voir les chambres libres
              </a>
            </div>

            {flash && (
              <div role="status" className={`gv-alert mt-6 ${flash.tone === 'success' ? 'gv-alert--success' : flash.tone === 'info' ? 'gv-alert--info' : 'gv-alert--error'}`}>
                {flash.text}
              </div>
            )}

            <section id="chambres-libres" className="gv-section">
              <RoomAvailabilityPanel onBook={openBookingForRoom} />
            </section>

            <section id="recherche" className="gv-section">
              <h2 className="gv-h2">Rechercher une réservation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="gv-label" htmlFor="booking-search">Recherche</label>
                  <input
                    id="booking-search"
                    type="text"
                    placeholder="Nom du client, numéro de réservation…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="gv-input"
                  />
                </div>
                <div>
                  <label className="gv-label" htmlFor="booking-status">Statut</label>
                  <select id="booking-status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="gv-input">
                    <option value="Tous">Tous</option>
                    <option value={ReservationStatus.PENDING}>En attente</option>
                    <option value={ReservationStatus.CONFIRMED}>Confirmée</option>
                    <option value={ReservationStatus.CANCELLED}>Annulée</option>
                  </select>
                </div>
              </div>
            </section>

            <section id="liste-reservations" className="gv-section">
              <h2 className="gv-h2">Liste des réservations</h2>
              <p className="gv-mention mb-4">
                {loading ? 'Chargement des réservations...' : `${filteredReservations.length} résultat${filteredReservations.length > 1 ? 's' : ''}`}
                {filterStatus !== 'Tous' && !loading && (
                  <> · statut « {filterStatus} » · <a href="#/bookings" className="gv-link" onClick={(e) => { e.preventDefault(); setFilterStatus('Tous'); }}>tout afficher</a></>
                )}
              </p>
              <div className="gv-table-wrap">
                <table className="gv-table">
                  <thead>
                    <tr>
                      <th className="hidden 2xl:table-cell">N°</th>
                      <th>Client</th>
                      <th className="hidden 2xl:table-cell">Type</th>
                      <th className="hidden 2xl:table-cell">Occupant</th>
                      <th>Chambre</th>
                      <th>Dates</th>
                      <th className="hidden 2xl:table-cell">Montant</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={9} className="text-center py-10">Chargement des réservations...</td></tr>
                    ) : filteredReservations.length === 0 ? (
                      <tr><td colSpan={9} className="text-center py-10">Aucune réservation trouvée.</td></tr>
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

                      return (
                        <tr key={reservation.id}>
                          <td className="hidden 2xl:table-cell whitespace-nowrap">{reservation.id}</td>
                          <td>
                            <div className="gv-strong">{clientDisplayName}</div>
                            {client?.email && <div className="gv-mention">{client.email}</div>}
                            <div className="gv-mention 2xl:hidden">
                              N° {reservation.id} · {Number(reservation.totalAmount || 0).toLocaleString('fr-FR')} FCFA
                            </div>
                          </td>
                          <td className="hidden 2xl:table-cell">
                            <span className="gv-tag gv-tag--neutral">{clientTypeLabel === 'Personne morale' ? 'Société' : 'Particulier'}</span>
                            {clientTypeLabel === 'Personne morale' && <div className="gv-mention mt-1">Paie pour l'occupant</div>}
                          </td>
                          <td className="hidden 2xl:table-cell">
                            <div>{reservation.occupantFirstName} {reservation.occupantLastName}</div>
                            {reservation.occupantPhone && <div className="gv-mention">{reservation.occupantPhone}</div>}
                            {reservation.occupantIdDocument && <div className="gv-mention">{reservation.occupantIdDocument}</div>}
                          </td>
                          <td className="whitespace-nowrap">
                            <div className="gv-strong">Chambre {room?.number || reservation.roomId}</div>
                            <div className="gv-mention">{room?.type || reservation.roomType}</div>
                          </td>
                          <td className="whitespace-nowrap">
                            <div>{checkInDate.toLocaleDateString('fr-FR')}</div>
                            <div className="gv-mention">au {checkOutDate.toLocaleDateString('fr-FR')} · {nights} nuit{nights > 1 ? 's' : ''}</div>
                          </td>
                          <td className="hidden 2xl:table-cell whitespace-nowrap gv-strong">
                            {Number(reservation.totalAmount || 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td><span className={statusTag(reservation.status)}>{reservation.status}</span></td>
                          <td>
                            <div className="flex gap-2">
                              {isAdmin && (
                                <button type="button" onClick={() => handleEdit(reservation)} className="gv-icon-btn" title="Modifier" aria-label="Modifier">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              )}
                              {reservation.status === ReservationStatus.PENDING && (
                                <button type="button" onClick={() => handleStatusUpdate(reservation, ReservationStatus.CONFIRMED)} className="gv-icon-btn gv-icon-btn--ok" title="Confirmer" aria-label="Confirmer">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                              )}
                              {reservation.status !== ReservationStatus.CANCELLED && (
                                <button type="button" onClick={() => handleCancel(reservation)} className="gv-icon-btn gv-icon-btn--danger" title="Annuler" aria-label="Annuler">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </section>
          </div>

          <aside className="lg:pt-2">
            <div className="lg:sticky lg:top-6">
              <div className="gv-aside-block">
                <h2 className="gv-aside-title">Dans cette page</h2>
                <ul className="space-y-3">
                  <li><a href="#/bookings" className="gv-link" onClick={scrollTo('nouvelle-reservation')}>Créer une réservation</a></li>
                  <li><a href="#/bookings" className="gv-link" onClick={scrollTo('chambres-libres')}>Chambres libres sur une période</a></li>
                  <li><a href="#/bookings" className="gv-link" onClick={scrollTo('recherche')}>Rechercher une réservation</a></li>
                  <li><a href="#/bookings" className="gv-link" onClick={scrollTo('liste-reservations')}>Liste des réservations</a></li>
                </ul>
              </div>

              <div className="gv-aside-block">
                <h2 className="gv-aside-title">En chiffres</h2>
                {[
                  { label: 'Toutes', status: 'Tous', value: reservations.length },
                  { label: 'En attente', status: ReservationStatus.PENDING, value: countByStatus(ReservationStatus.PENDING) },
                  { label: 'Confirmées', status: ReservationStatus.CONFIRMED, value: countByStatus(ReservationStatus.CONFIRMED) },
                  { label: 'Annulées', status: ReservationStatus.CANCELLED, value: countByStatus(ReservationStatus.CANCELLED) },
                ].map(stat => (
                  <a key={stat.label} href="#/bookings" className="gv-stat" onClick={filterAndShow(stat.status)}>
                    <span>{stat.label}</span>
                    <strong>{loading ? '…' : stat.value}</strong>
                  </a>
                ))}
              </div>

              <div className="gv-aside-block">
                <h2 className="gv-aside-title">Bon à savoir</h2>
                <p className="gv-text">
                  La pièce d'identité et le selfie du client sont chiffrés, consultables uniquement par l'administration
                  et la réception, puis supprimés 30 jours après le séjour.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Modal d'ajout/modification */}
      {showWizard && (
        <BookingWizard
          clients={clients}
          onClose={() => setShowWizard(false)}
          onCreated={() => { showFlash('success', 'Réservation créée avec succès.'); void loadReservations(); }}
          onClientCreated={client => setClients(prev => [...prev, client as ClientDto])}
        />
      )}

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
                    <option value="">
                      {clientsState === 'loading' ? 'Chargement des clients...' : clientsState === 'error' ? 'Clients indisponibles' : 'Sélectionner un client'}
                    </option>
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

              {flash?.tone === 'error' && (
                <div className="rounded-xl px-4 py-3 text-sm border bg-red-500/10 border-red-500/30 text-red-200">{flash.text}</div>
              )}

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
