import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type ClientDto = {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
};

type ReservationDto = {
  id: number;
  clientId: number;
  roomId: string;
  checkIn?: string;
  checkOut?: string;
  status?: string;
};

type ServiceDto = {
  id: number;
  clientId: number;
  serviceType: string;
  description: string;
  status: string;
  requestedAt: string | null;
  completedAt: string | null;
  price: number;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type ServiceFormState = {
  clientId: string;
  reservationId: string;
  serviceType: string;
  description: string;
  status: string;
  requestedAt: string;
  completedAt: string;
  price: string;
};

const defaultServiceForm = (): ServiceFormState => ({
  clientId: '',
  reservationId: '',
  serviceType: '',
  description: '',
  status: 'Demande',
  requestedAt: new Date().toISOString().slice(0, 16),
  completedAt: '',
  price: '0'
});

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
  return 'Impossible de charger les services.';
};

const serviceStatusClassName = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes('demand') || normalized.includes('attente')) return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  if (normalized.includes('cours') || normalized.includes('progress')) return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
  if (normalized.includes('term') || normalized.includes('compl')) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20';
  if (normalized.includes('annul') || normalized.includes('cancel')) return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  return 'bg-slate-500/15 text-slate-300 border border-slate-500/20';
};

const formatDateTime = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const toOffsetDateTime = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
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
        <button type="button" onClick={onClose} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white">
          Fermer
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Services: React.FC = () => {
  const [activeStatus, setActiveStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => setFlash({ tone, text });

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesResponse, clientsResponse, reservationsResponse] = await Promise.all([
        api.get<ServiceDto[]>('/services'),
        api.get<ClientDto[]>('/clients'),
        api.get<ReservationDto[]>('/reservations')
      ]);
      const clientData = Array.isArray(clientsResponse.data) ? clientsResponse.data : [];
      const reservationData = Array.isArray(reservationsResponse.data) ? reservationsResponse.data : [];
      setServices(Array.isArray(servicesResponse.data) ? servicesResponse.data : []);
      setClients(clientData);
      setReservations(reservationData);
      if (!serviceForm.clientId && clientData[0]) {
        const firstClientId = String(clientData[0].id);
        const firstReservation = reservationData.find((reservation) => String(reservation.clientId) === firstClientId);
        setServiceForm((prev) => ({
          ...prev,
          clientId: firstClientId,
          reservationId: firstReservation ? String(firstReservation.id) : ''
        }));
      }
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
    setEditingServiceId(null);
    setServiceForm((prev) => ({
      ...defaultServiceForm(),
      clientId: prev.clientId || (clients[0] ? String(clients[0].id) : ''),
      reservationId: prev.reservationId || ''
    }));
    setModalMode('create');
  };

  const openEditModal = (service: ServiceDto) => {
    const matchingReservation = reservations.find((reservation) => reservation.clientId === service.clientId);
    setEditingServiceId(service.id);
    setServiceForm({
      clientId: String(service.clientId),
      reservationId: matchingReservation ? String(matchingReservation.id) : '',
      serviceType: service.serviceType || '',
      description: service.description || '',
      status: service.status || 'Demande',
      requestedAt: service.requestedAt ? service.requestedAt.slice(0, 16) : new Date().toISOString().slice(0, 16),
      completedAt: service.completedAt ? service.completedAt.slice(0, 16) : '',
      price: String(Number(service.price || 0))
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setEditingServiceId(null);
    setServiceForm(defaultServiceForm());
  };

  const reservationsForSelectedClient = useMemo(
    () => reservations.filter((reservation) => String(reservation.clientId) === serviceForm.clientId),
    [reservations, serviceForm.clientId]
  );

  const selectedReservation = useMemo(
    () => reservationsForSelectedClient.find((reservation) => String(reservation.id) === serviceForm.reservationId) || reservationsForSelectedClient[0] || null,
    [reservationsForSelectedClient, serviceForm.reservationId]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!serviceForm.clientId || !serviceForm.serviceType.trim() || !serviceForm.description.trim()) {
      showFlash('error', 'Veuillez renseigner le client, le type de service et la description.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        clientId: Number(serviceForm.clientId),
        serviceType: serviceForm.serviceType.trim(),
        description: serviceForm.description.trim(),
        status: serviceForm.status,
        requestedAt: toOffsetDateTime(serviceForm.requestedAt),
        completedAt: toOffsetDateTime(serviceForm.completedAt),
        price: Number(serviceForm.price || 0)
      };

      if (modalMode === 'edit' && editingServiceId !== null) {
        await api.put(`/services/${editingServiceId}`, payload);
        showFlash('success', 'Service modifie avec succes.');
      } else {
        await api.post('/services', payload);
        showFlash('success', 'Service cree avec succes.');
      }

      closeModal();
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (service: ServiceDto) => {
    const confirmed = window.confirm(`Supprimer la demande de service #${service.id} ?`);
    if (!confirmed) return;
    try {
      await api.delete(`/services/${service.id}`);
      showFlash('success', 'Service supprime avec succes.');
      await loadData();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const enrichedServices = useMemo(() => {
    const clientMap = new Map(clients.map((client) => [
      client.id,
      client.fullName || `${client.firstName} ${client.lastName}`.trim() || `Client ${client.id}`
    ]));
    const reservationMap = new Map<number, ReservationDto>();
    reservations.forEach((reservation) => {
      if (!reservationMap.has(reservation.clientId)) {
        reservationMap.set(reservation.clientId, reservation);
      }
    });
    return services.map((service) => ({
      ...service,
      guestName: clientMap.get(service.clientId) || `Client ${service.clientId}`,
      roomNumber: reservationMap.get(service.clientId)?.roomId || '-'
    }));
  }, [clients, reservations, services]);

  const filteredRequests = useMemo(
    () => enrichedServices.filter((request) => activeStatus === 'all' || request.status === activeStatus),
    [activeStatus, enrichedServices]
  );

  const stats = useMemo(() => ({
    pending: services.filter((request) => request.status.toLowerCase().includes('demand') || request.status.toLowerCase().includes('attente')).length,
    inProgress: services.filter((request) => request.status.toLowerCase().includes('cours') || request.status.toLowerCase().includes('progress')).length,
    completed: services.filter((request) => request.status.toLowerCase().includes('term') || request.status.toLowerCase().includes('compl')).length,
    revenue: services.filter((request) => request.status.toLowerCase().includes('term') || request.status.toLowerCase().includes('compl')).reduce((sum, request) => sum + Number(request.price || 0), 0)
  }), [services]);

  const statuses = useMemo(() => Array.from(new Set(services.map((service) => service.status))), [services]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#0a1220] via-[#0d1627] to-[#12213a] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Prestations</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/95">Services et prestations</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">Demandes clients synchronisees avec Spring Boot, enrichies avec le client et la chambre associes.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadData()} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Rafraichir
            </button>
            <button onClick={openCreateModal} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Nouvelle demande
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">En attente</p><p className="mt-3 text-3xl font-semibold text-white">{stats.pending}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">En cours</p><p className="mt-3 text-3xl font-semibold text-white">{stats.inProgress}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Termines</p><p className="mt-3 text-3xl font-semibold text-white">{stats.completed}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">CA realise</p><p className="mt-3 text-3xl font-semibold text-white">{stats.revenue.toLocaleString('fr-FR')} FCFA</p></div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveStatus('all')} className={`rounded-full px-4 py-2 text-sm transition ${activeStatus === 'all' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Tous</button>
          {statuses.map((status) => (
            <button key={status} onClick={() => setActiveStatus(status)} className={`rounded-full px-4 py-2 text-sm transition ${activeStatus === status ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>{status}</button>
          ))}
        </div>

        {flash ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${flash.tone === 'success' ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : flash.tone === 'info' ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200' : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
            {flash.text}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement des services...</div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredRequests.map((request) => (
              <article key={request.id} className="rounded-3xl border border-slate-700/60 bg-[#10182b] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white/95">{request.serviceType}</p>
                    <p className="mt-1 text-sm text-white/55">{request.guestName} · Chambre {request.roomNumber}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${serviceStatusClassName(request.status)}`}>{request.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/70">{request.description}</p>
                <div className="mt-5 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
                  <p>Demande: {formatDateTime(request.requestedAt)}</p>
                  <p>Cloture: {formatDateTime(request.completedAt)}</p>
                  <p>Reference: {request.id}</p>
                  <p>Montant: {Number(request.price || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => openEditModal(request)} className="rounded-xl border border-slate-700/60 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">
                    Modifier
                  </button>
                  <button type="button" onClick={() => void handleDelete(request)} className="rounded-xl border border-rose-500/25 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
            {!filteredRequests.length ? (
              <div className="rounded-3xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/45 xl:col-span-2">Aucun service ne correspond au filtre.</div>
            ) : null}
          </div>
        )}
      </section>

      {modalMode ? (
        <ModalShell title={modalMode === 'create' ? 'Nouvelle demande de service' : 'Modifier la demande'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Client</span>
                <select
                  value={serviceForm.clientId}
                  onChange={(event) => {
                    const nextClientId = event.target.value;
                    const nextReservations = reservations.filter((reservation) => String(reservation.clientId) === nextClientId);
                    setServiceForm((prev) => ({
                      ...prev,
                      clientId: nextClientId,
                      reservationId: nextReservations[0] ? String(nextReservations[0].id) : ''
                    }));
                  }}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.fullName || `${client.firstName} ${client.lastName}`.trim()}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Type de service</span>
                <input type="text" value={serviceForm.serviceType} onChange={(event) => setServiceForm((prev) => ({ ...prev, serviceType: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Room service, blanchisserie..." />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Reservation liee</span>
                <select
                  value={serviceForm.reservationId}
                  onChange={(event) => setServiceForm((prev) => ({ ...prev, reservationId: event.target.value }))}
                  className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="">Aucune reservation specifique</option>
                  {reservationsForSelectedClient.map((reservation) => (
                    <option key={reservation.id} value={reservation.id}>
                      Reservation #{reservation.id} · Chambre {reservation.roomId}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-sm text-white/80">
                <span>Contexte sejour</span>
                <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white/75">
                  {selectedReservation ? (
                    <div className="space-y-1">
                      <p>Chambre: {selectedReservation.roomId}</p>
                      <p>Statut reservation: {selectedReservation.status || 'Inconnu'}</p>
                      <p>
                        Sejour: {selectedReservation.checkIn || '-'} au {selectedReservation.checkOut || '-'}
                      </p>
                    </div>
                  ) : (
                    <p>Aucune reservation active associee a ce client.</p>
                  )}
                </div>
              </div>
            </div>
            <label className="space-y-2 text-sm text-white/80">
              <span>Description</span>
              <textarea value={serviceForm.description} onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Detaillez la demande du client" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Statut</span>
                <select value={serviceForm.status} onChange={(event) => setServiceForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  <option value="Demande">Demande</option>
                  <option value="En cours">En cours</option>
                  <option value="Termine">Termine</option>
                  <option value="Annule">Annule</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Prix</span>
                <input type="number" min="0" value={serviceForm.price} onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Demande le</span>
                <input type="datetime-local" value={serviceForm.requestedAt} onChange={(event) => setServiceForm((prev) => ({ ...prev, requestedAt: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Cloture le</span>
                <input type="datetime-local" value={serviceForm.completedAt} onChange={(event) => setServiceForm((prev) => ({ ...prev, completedAt: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Enregistrement...' : modalMode === 'create' ? 'Creer la demande' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Services;
