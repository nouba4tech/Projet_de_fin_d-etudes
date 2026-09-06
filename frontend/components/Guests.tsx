import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type ClientDto = {
  id: number;
  firstName: string;
  lastName: string;
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
};

type GuestRow = {
  id: number;
  fullName: string;
  clientType: string;
  roomNumber: string;
  phone: string;
  email: string;
  totalStays: number;
  lastStay: string;
  balance: number;
  status: string;
  reservationStatus: string;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type ClientFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idDocument: string;
  address: string;
  clientType: string;
  companyName: string;
  status: string;
};

const defaultClientForm = (): ClientFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  idDocument: '',
  address: '',
  clientType: 'Personne physique',
  companyName: '',
  status: 'Actif'
});

const statusClassName = (status: string): string => {
  const normalized = status.toLowerCase();

  if (normalized.includes('vip')) return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  if (normalized.includes('actif') || normalized.includes('cours') || normalized.includes('conf')) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20';
  if (normalized.includes('attente')) return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
  if (normalized.includes('suspend') || normalized.includes('annul') || normalized.includes('black')) return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  return 'bg-slate-500/15 text-slate-300 border border-slate-500/20';
};

const extractApiMessage = (error: unknown): string => {
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
  return 'Impossible de charger les clients.';
};

const isReservationActive = (reservation: ReservationDto): boolean => {
  const status = reservation.status.toLowerCase();
  return !status.includes('annul') && !status.includes('cancel');
};

const ModalShell: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          Fermer
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Guests: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [detailsClient, setDetailsClient] = useState<ClientDto | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [clientForm, setClientForm] = useState<ClientFormState>(defaultClientForm);

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
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const openCreateModal = () => {
    setEditingClientId(null);
    setClientForm(defaultClientForm());
    setModalMode('create');
  };

  const openEditModal = (client: ClientDto) => {
    setEditingClientId(client.id);
    setClientForm({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      idDocument: client.idDocument || '',
      address: client.address || '',
      clientType: client.clientType || 'Personne physique',
      companyName: client.companyName || '',
      status: client.status || 'Actif'
    });
    setModalMode('edit');
  };

  const openDetailsModal = async (client: ClientDto) => {
    setDetailsClient(client);
    setDetailsError(null);
    setDetailsLoading(true);

    try {
      const response = await api.get<ClientDto>(`/clients/${client.id}`);
      setDetailsClient(response.data);
    } catch (error) {
      setDetailsError(extractApiMessage(error));
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setEditingClientId(null);
    setClientForm(defaultClientForm());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (clientForm.clientType === 'Personne physique' && !clientForm.firstName.trim() && !clientForm.lastName.trim()) {
      showFlash('error', 'Veuillez renseigner au moins le prenom ou le nom du client.');
      return;
    }

    if (clientForm.clientType === 'Personne morale' && !clientForm.companyName.trim()) {
      showFlash('error', 'Veuillez renseigner la raison sociale du client.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: clientForm.firstName.trim() || null,
        lastName: clientForm.lastName.trim() || null,
        email: clientForm.email.trim() || null,
        phone: clientForm.phone.trim() || null,
        idDocument: clientForm.idDocument.trim() || null,
        address: clientForm.address.trim() || null,
        clientType: clientForm.clientType,
        companyName: clientForm.companyName.trim() || null,
        status: clientForm.status
      };

      if (modalMode === 'edit' && editingClientId !== null) {
        await api.put(`/clients/${editingClientId}`, payload);
        showFlash('success', 'Client modifie avec succes.');
      } else {
        await api.post('/clients', payload);
        showFlash('success', 'Client cree avec succes.');
      }

      closeModal();
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client: ClientDto) => {
    const confirmed = window.confirm(`Supprimer le client ${client.fullName || `${client.firstName} ${client.lastName}`.trim()} ?`);
    if (!confirmed) return;

    try {
      await api.delete(`/clients/${client.id}`);
      if (detailsClient?.id === client.id) {
        setDetailsClient(null);
      }
      showFlash('success', 'Client supprime avec succes.');
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const guestRows = useMemo<GuestRow[]>(() => {
    const activeReservations = reservations.filter(isReservationActive);
    return clients.map((client) => {
      const reservation = activeReservations.find((item) => item.clientId === client.id) ?? null;
      const displayStatus = reservation?.status || client.status || 'Inconnu';
      return {
        id: client.id,
        fullName: client.fullName || [client.firstName, client.lastName].filter(Boolean).join(' ').trim() || `Client ${client.id}`,
        clientType: client.clientType || 'Personne physique',
        roomNumber: reservation?.roomId || '-',
        phone: client.phone || '-',
        email: client.email || '-',
        totalStays: client.totalStays || 0,
        lastStay: client.lastStay || '-',
        balance: Number(client.balance || 0),
        status: client.status || 'Actif',
        reservationStatus: displayStatus
      };
    });
  }, [clients, reservations]);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return guestRows.filter((guest) => {
      const matchesSearch =
        !query ||
        guest.fullName.toLowerCase().includes(query) ||
        guest.roomNumber.toLowerCase().includes(query) ||
        guest.phone.toLowerCase().includes(query) ||
        guest.email.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === 'all' ||
        guest.status.toLowerCase() === statusFilter.toLowerCase() ||
        guest.reservationStatus.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [guestRows, search, statusFilter]);

  const stats = useMemo(() => {
    const activeReservations = reservations.filter(isReservationActive);
    return {
      activeClients: activeReservations.length,
      vipClients: clients.filter((client) => (client.status || '').toLowerCase().includes('vip')).length,
      pendingReservations: activeReservations.filter((reservation) => reservation.status.toLowerCase().includes('attente')).length,
      totalBalance: clients.reduce((sum, client) => sum + Number(client.balance || 0), 0)
    };
  }, [clients, reservations]);

  const availableStatuses = useMemo(() => {
    const values = new Set<string>();
    guestRows.forEach((guest) => {
      if (guest.status) values.add(guest.status);
      if (guest.reservationStatus) values.add(guest.reservationStatus);
    });
    return Array.from(values).sort((left, right) => left.localeCompare(right));
  }, [guestRows]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#07111f] via-[#0a1220] to-[#111a2e] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Clients</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white/95">Gestion des clients</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">
              Donnees synchronisees avec le backend Spring Boot pour suivre profils clients, reservations actives et soldes.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Clients actifs</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.activeClients}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">VIP</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.vipClients}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">En attente</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.pendingReservations}</p>
            </div>
            <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.25em] text-white/50">Solde cumule</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.totalBalance.toLocaleString('fr-FR')} FCFA</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un client, une chambre ou un contact"
              className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            >
              <option value="all">Tous les statuts</option>
              {availableStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => void loadData()}
              className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Rafraichir
            </button>
            <button
              onClick={openCreateModal}
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              Nouveau client
            </button>
          </div>
        </div>

        {flash ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${
            flash.tone === 'success'
              ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200'
              : flash.tone === 'info'
                ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200'
                : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'
          }`}>
            {flash.text}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement des clients...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1080px]">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-[0.25em] text-white/45">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Chambre</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Sejours</th>
                  <th className="px-4 py-3">Solde</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredGuests.map((guest) => {
                  const sourceClient = clients.find((item) => item.id === guest.id);
                  return (
                    <tr key={guest.id} className="border-b border-slate-800/80 text-sm text-white/80">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-white/95">{guest.fullName}</p>
                        <p className="mt-1 text-xs text-white/45">Dernier sejour: {guest.lastStay}</p>
                      </td>
                      <td className="px-4 py-4">{guest.clientType}</td>
                      <td className="px-4 py-4">{guest.roomNumber}</td>
                      <td className="px-4 py-4">
                        <p>{guest.phone}</p>
                        <p className="mt-1 text-xs text-white/45">{guest.email}</p>
                      </td>
                      <td className="px-4 py-4">{guest.totalStays}</td>
                      <td className="px-4 py-4">{guest.balance.toLocaleString('fr-FR')} FCFA</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(guest.reservationStatus)}`}>
                          {guest.reservationStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => sourceClient && void openDetailsModal(sourceClient)}
                            className="rounded-xl border border-sky-500/25 px-3 py-2 text-xs text-sky-300 transition hover:bg-sky-500/10"
                          >
                            Détails
                          </button>
                          <button
                            type="button"
                            onClick={() => sourceClient && openEditModal(sourceClient)}
                            className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs text-white/80 transition hover:bg-white/5"
                          >
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => sourceClient && void handleDelete(sourceClient)}
                            className="rounded-xl border border-rose-500/25 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10"
                          >
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-white/45">Aucun client ne correspond aux filtres.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {detailsClient ? (
        <ModalShell title="Détails du client" onClose={() => setDetailsClient(null)}>
          <div className="space-y-5">
            {detailsLoading ? (
              <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-sm text-sky-200">
                Chargement des informations actualisées...
              </div>
            ) : null}

            {detailsError ? (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {detailsError}
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-white/45">Client</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">
                    {detailsClient.fullName || [detailsClient.firstName, detailsClient.lastName].filter(Boolean).join(' ').trim() || `Client ${detailsClient.id}`}
                  </h3>
                  <p className="mt-1 text-sm text-white/55">{detailsClient.clientType || 'Personne physique'}</p>
                </div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(detailsClient.status || 'Actif')}`}>
                  {detailsClient.status || 'Actif'}
                </span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Téléphone</p>
                <p className="mt-2 text-sm text-white">{detailsClient.phone || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Email</p>
                <p className="mt-2 text-sm text-white">{detailsClient.email || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Pièce d'identité</p>
                <p className="mt-2 text-sm text-white">{detailsClient.idDocument || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Société</p>
                <p className="mt-2 text-sm text-white">{detailsClient.companyName || '-'}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Séjours</p>
                <p className="mt-2 text-sm text-white">{detailsClient.totalStays || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Solde</p>
                <p className="mt-2 text-sm text-white">{Number(detailsClient.balance || 0).toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.25em] text-white/45">Adresse</p>
                <p className="mt-2 text-sm text-white">{detailsClient.address || '-'}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  openEditModal(detailsClient);
                  setDetailsClient(null);
                }}
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setDetailsClient(null)}
                className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Fermer
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {modalMode ? (
        <ModalShell title={modalMode === 'create' ? 'Nouveau client' : 'Modifier le client'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Type client</span>
                <select
                  value={clientForm.clientType}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, clientType: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="Personne physique">Personne physique</option>
                  <option value="Personne morale">Personne morale</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Statut</span>
                <select
                  value={clientForm.status}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, status: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="Actif">Actif</option>
                  <option value="VIP">VIP</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </label>
            </div>

            {clientForm.clientType === 'Personne morale' ? (
              <label className="space-y-2 text-sm text-white/80">
                <span>Raison sociale</span>
                <input
                  type="text"
                  value={clientForm.companyName}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, companyName: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Entreprise cliente"
                />
              </label>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-white/80">
                  <span>Prenom</span>
                  <input
                    type="text"
                    value={clientForm.firstName}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    placeholder="Prenom"
                  />
                </label>
                <label className="space-y-2 text-sm text-white/80">
                  <span>Nom</span>
                  <input
                    type="text"
                    value={clientForm.lastName}
                    onChange={(event) => setClientForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    placeholder="Nom"
                  />
                </label>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Email</span>
                <input
                  type="email"
                  value={clientForm.email}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="email@client.com"
                />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Telephone</span>
                <input
                  type="text"
                  value={clientForm.phone}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, phone: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="+237..."
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Piece d identite</span>
                <input
                  type="text"
                  value={clientForm.idDocument}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, idDocument: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="CNI ou passport"
                />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Adresse</span>
                <input
                  type="text"
                  value={clientForm.address}
                  onChange={(event) => setClientForm((prev) => ({ ...prev, address: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                  placeholder="Adresse client"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Enregistrement...' : modalMode === 'create' ? 'Creer le client' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Guests;
