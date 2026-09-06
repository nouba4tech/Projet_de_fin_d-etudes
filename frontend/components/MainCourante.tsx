import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type MainCouranteEntry = {
  id: number;
  entryDate: string;
  entryTime: string | null;
  category: string;
  priority: string;
  title: string;
  description: string | null;
  location: string | null;
  reportedBy: string | null;
  assignedTo: string | null;
  status: string;
  resolution: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type EntryFormState = {
  entryDate: string;
  entryTime: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  assignedTo: string;
  status: string;
};

const CATEGORIES = ['Maintenance', 'Securite', 'Client', 'Menage', 'Technique'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['open', 'in_progress', 'resolved'];

const defaultEntryForm = (): EntryFormState => ({
  entryDate: new Date().toISOString().slice(0, 10),
  entryTime: new Date().toTimeString().slice(0, 5),
  category: CATEGORIES[0],
  priority: 'medium',
  title: '',
  description: '',
  location: '',
  reportedBy: '',
  assignedTo: '',
  status: 'open'
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
  return 'Impossible de charger la main courante.';
};

const priorityClassName = (priority: string): string => {
  const normalized = priority.toLowerCase();
  if (normalized === 'high') return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  if (normalized === 'medium') return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
};

const priorityLabel = (priority: string): string => {
  const normalized = priority.toLowerCase();
  if (normalized === 'high') return 'Haute';
  if (normalized === 'medium') return 'Moyenne';
  return 'Basse';
};

const statusClassName = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'resolved') return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20';
  if (normalized === 'in_progress') return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
  return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
};

const statusLabel = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized === 'resolved') return 'Resolu';
  if (normalized === 'in_progress') return 'En cours';
  return 'Ouvert';
};

const formatDateTime = (date: string | null, time?: string | null): string => {
  if (!date) return '-';
  const composed = time ? `${date}T${time}` : date;
  const parsed = new Date(composed);
  if (Number.isNaN(parsed.getTime())) return `${date} ${time ?? ''}`.trim();
  return parsed.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ModalShell: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
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

const MainCourante: React.FC = () => {
  const [entries, setEntries] = useState<MainCouranteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [entryForm, setEntryForm] = useState<EntryFormState>(defaultEntryForm);
  const [resolvingEntry, setResolvingEntry] = useState<MainCouranteEntry | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [resolvedByText, setResolvedByText] = useState('');

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => setFlash({ tone, text });

  const loadEntries = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MainCouranteEntry[]>('/main-courante');
      setEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 5000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const openCreateModal = () => {
    setEntryForm(defaultEntryForm());
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    if (submitting) return;
    setCreateModalOpen(false);
  };

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!entryForm.title.trim() || !entryForm.entryDate) {
      showFlash('error', 'Veuillez renseigner au minimum la date et le titre.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/main-courante', {
        entryDate: entryForm.entryDate,
        entryTime: entryForm.entryTime,
        category: entryForm.category,
        priority: entryForm.priority,
        title: entryForm.title.trim(),
        description: entryForm.description.trim() || null,
        location: entryForm.location.trim() || null,
        reportedBy: entryForm.reportedBy.trim() || null,
        assignedTo: entryForm.assignedTo.trim() || null,
        status: entryForm.status
      });
      showFlash('success', 'Entree ajoutee a la main courante.');
      setCreateModalOpen(false);
      await loadEntries();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (entry: MainCouranteEntry, status: string) => {
    try {
      await api.put(`/main-courante/${entry.id}/status`, { status });
      showFlash('success', `Statut mis a jour: ${statusLabel(status)}.`);
      await loadEntries();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const openResolveModal = (entry: MainCouranteEntry) => {
    setResolvingEntry(entry);
    setResolutionText(entry.resolution ?? '');
    setResolvedByText(entry.resolvedBy ?? '');
  };

  const closeResolveModal = () => {
    setResolvingEntry(null);
    setResolutionText('');
    setResolvedByText('');
  };

  const submitResolution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolvingEntry) return;

    try {
      await api.post(`/main-courante/${resolvingEntry.id}/resolve`, {
        resolution: resolutionText.trim() || null,
        resolvedBy: resolvedByText.trim() || null
      });
      showFlash('success', 'Entree marquee comme resolue.');
      closeResolveModal();
      await loadEntries();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const deleteEntry = async (entry: MainCouranteEntry) => {
    const confirmed = window.confirm(`Supprimer l'entree "${entry.title}" ?`);
    if (!confirmed) return;
    try {
      await api.delete(`/main-courante/${entry.id}`);
      showFlash('success', 'Entree supprimee.');
      await loadEntries();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const filteredEntries = useMemo(
    () => entries.filter((entry) => activeStatus === 'all' || entry.status === activeStatus),
    [entries, activeStatus]
  );

  const stats = useMemo(() => ({
    open: entries.filter((entry) => entry.status === 'open').length,
    inProgress: entries.filter((entry) => entry.status === 'in_progress').length,
    resolved: entries.filter((entry) => entry.status === 'resolved').length,
    high: entries.filter((entry) => entry.priority.toLowerCase() === 'high' && entry.status !== 'resolved').length
  }), [entries]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#0a1220] via-[#0d1627] to-[#12213a] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Journal des evenements</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/95">Main courante</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">Suivi des incidents, demandes et evenements survenus dans l'hotel.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadEntries()} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Rafraichir
            </button>
            <button onClick={openCreateModal} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
              Nouvelle entree
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Ouvertes</p><p className="mt-3 text-3xl font-semibold text-white">{stats.open}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">En cours</p><p className="mt-3 text-3xl font-semibold text-white">{stats.inProgress}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Resolues</p><p className="mt-3 text-3xl font-semibold text-white">{stats.resolved}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Priorite haute active</p><p className="mt-3 text-3xl font-semibold text-rose-400">{stats.high}</p></div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveStatus('all')} className={`rounded-full px-4 py-2 text-sm transition ${activeStatus === 'all' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Toutes</button>
          {STATUSES.map((status) => (
            <button key={status} onClick={() => setActiveStatus(status)} className={`rounded-full px-4 py-2 text-sm transition ${activeStatus === status ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>{statusLabel(status)}</button>
          ))}
        </div>

        {flash ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${flash.tone === 'success' ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : flash.tone === 'info' ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200' : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
            {flash.text}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement de la main courante...</div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredEntries.map((entry) => (
              <article key={entry.id} className="rounded-3xl border border-slate-700/60 bg-[#10182b] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white/95">{entry.title}</p>
                    <p className="mt-1 text-sm text-white/55">{entry.category} {entry.location ? `· ${entry.location}` : ''}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityClassName(entry.priority)}`}>{priorityLabel(entry.priority)}</span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClassName(entry.status)}`}>{statusLabel(entry.status)}</span>
                  </div>
                </div>
                {entry.description ? <p className="mt-4 text-sm leading-6 text-white/70">{entry.description}</p> : null}
                <div className="mt-5 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
                  <p>Signale: {formatDateTime(entry.entryDate, entry.entryTime)}</p>
                  <p>Par: {entry.reportedBy || '-'}</p>
                  <p>Assigne a: {entry.assignedTo || '-'}</p>
                  <p>Reference: #{entry.id}</p>
                </div>
                {entry.status === 'resolved' && entry.resolution ? (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                    <p className="font-semibold">Resolution</p>
                    <p className="mt-1 text-emerald-100/80">{entry.resolution}</p>
                    {entry.resolvedBy ? <p className="mt-1 text-xs text-emerald-200/60">Par {entry.resolvedBy} · {formatDateTime(entry.resolvedAt)}</p> : null}
                  </div>
                ) : null}
                <div className="mt-5 flex flex-wrap gap-2">
                  {entry.status !== 'in_progress' && entry.status !== 'resolved' ? (
                    <button type="button" onClick={() => void changeStatus(entry, 'in_progress')} className="rounded-xl border border-sky-500/25 px-4 py-2 text-sm text-sky-300 transition hover:bg-sky-500/10">
                      Prendre en charge
                    </button>
                  ) : null}
                  {entry.status !== 'resolved' ? (
                    <button type="button" onClick={() => openResolveModal(entry)} className="rounded-xl border border-emerald-500/25 px-4 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/10">
                      Resoudre
                    </button>
                  ) : (
                    <button type="button" onClick={() => void changeStatus(entry, 'open')} className="rounded-xl border border-amber-500/25 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/10">
                      Reouvrir
                    </button>
                  )}
                  <button type="button" onClick={() => void deleteEntry(entry)} className="rounded-xl border border-rose-500/25 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
            {!filteredEntries.length ? (
              <div className="rounded-3xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/45 xl:col-span-2">Aucune entree ne correspond au filtre.</div>
            ) : null}
          </div>
        )}
      </section>

      {createModalOpen ? (
        <ModalShell title="Nouvelle entree de main courante" onClose={closeCreateModal}>
          <form onSubmit={handleCreateSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Date</span>
                <input type="date" value={entryForm.entryDate} onChange={(event) => setEntryForm((prev) => ({ ...prev, entryDate: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Heure</span>
                <input type="time" value={entryForm.entryTime} onChange={(event) => setEntryForm((prev) => ({ ...prev, entryTime: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <label className="space-y-2 text-sm text-white/80">
              <span>Titre</span>
              <input type="text" value={entryForm.title} onChange={(event) => setEntryForm((prev) => ({ ...prev, title: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Ex: Fuite d'eau chambre 204" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Description</span>
              <textarea value={entryForm.description} onChange={(event) => setEntryForm((prev) => ({ ...prev, description: event.target.value }))} rows={3} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Details de l'evenement" />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-white/80">
                <span>Categorie</span>
                <select value={entryForm.category} onChange={(event) => setEntryForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  {CATEGORIES.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Priorite</span>
                <select value={entryForm.priority} onChange={(event) => setEntryForm((prev) => ({ ...prev, priority: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  {PRIORITIES.map((priority) => (<option key={priority} value={priority}>{priorityLabel(priority)}</option>))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Lieu</span>
                <input type="text" value={entryForm.location} onChange={(event) => setEntryForm((prev) => ({ ...prev, location: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Chambre 204" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Signale par</span>
                <input type="text" value={entryForm.reportedBy} onChange={(event) => setEntryForm((prev) => ({ ...prev, reportedBy: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Assigne a</span>
                <input type="text" value={entryForm.assignedTo} onChange={(event) => setEntryForm((prev) => ({ ...prev, assignedTo: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeCreateModal} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Enregistrement...' : 'Creer l\'entree'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {resolvingEntry ? (
        <ModalShell title={`Resoudre: ${resolvingEntry.title}`} onClose={closeResolveModal}>
          <form onSubmit={submitResolution} className="space-y-5">
            <label className="space-y-2 text-sm text-white/80">
              <span>Resolution</span>
              <textarea value={resolutionText} onChange={(event) => setResolutionText(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Comment le probleme a-t-il ete resolu ?" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Resolu par</span>
              <input type="text" value={resolvedByText} onChange={(event) => setResolvedByText(event.target.value)} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeResolveModal} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400">
                Marquer comme resolue
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default MainCourante;
