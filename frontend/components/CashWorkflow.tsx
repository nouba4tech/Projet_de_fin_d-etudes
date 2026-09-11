import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type CashRegister = {
  id: number;
  scope: string;
  registerNumber: string;
  openingBalance: number;
  currentBalance: number;
  cashIn: number;
  cashOut: number;
  totalSales: number;
  status: string;
  openedBy: string | null;
  closedBy: string | null;
  openedAt: string | null;
  closedAt: string | null;
};

type CashTransfer = {
  id: number;
  scope: string;
  transferNumber: string;
  fromRegister: string;
  toRegister: string;
  amount: number;
  reason: string;
  status: string;
  requestedBy: string;
  approvedBy: string | null;
  transferDate: string;
  completedAt: string | null;
};

type CashJournal = {
  id: number;
  scope: string;
  date: string;
  description: string;
  type: string;
  amount: number;
  balance: number;
  register: string;
  user: string;
  reference: string | null;
  status: string;
  sourceType: string | null;
};

type FlashState = { tone: 'success' | 'error' | 'info'; text: string } | null;

type CashSection = 'registers' | 'transfers' | 'journal';

const SCOPES = ['RECEPTION', 'BAR', 'RESTAURANT', 'ECONOMAT'];

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
  return 'Une erreur est survenue.';
};

const money = (value: number): string => `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;

const formatDateTime = (value: string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const statusBadge = (status: string): string => {
  const normalized = status.toLowerCase();
  if (['open', 'active', 'approved'].includes(normalized)) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20';
  if (['pending'].includes(normalized)) return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  if (['closed'].includes(normalized)) return 'bg-slate-500/15 text-slate-300 border border-slate-500/20';
  if (['cancelled', 'rejected'].includes(normalized)) return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
};

const ModalShell: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white">Fermer</button>
      </div>
      {children}
    </div>
  </div>
);

const CashWorkflow: React.FC = () => {
  const [activeSection, setActiveSection] = useState<CashSection>('registers');
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [transfers, setTransfers] = useState<CashTransfer[]>([]);
  const [journal, setJournal] = useState<CashJournal[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<FlashState>(null);

  const [openModalVisible, setOpenModalVisible] = useState(false);
  const [openForm, setOpenForm] = useState({ scope: SCOPES[0], registerNumber: '', openingBalance: '0', responsible: '', notes: '' });

  const [closingRegister, setClosingRegister] = useState<CashRegister | null>(null);
  const [closeForm, setCloseForm] = useState({ realBalance: '0', responsible: '', notes: '' });

  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferForm, setTransferForm] = useState({ scope: SCOPES[0], fromRegister: '', toRegister: '', amount: '0', reason: '', requestedBy: '', transferDate: new Date().toISOString().slice(0, 16) });

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => setFlash({ tone, text });

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 5000);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const loadState = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/cash/accounting');
      setRegisters(Array.isArray(data.cashRegisters) ? data.cashRegisters : []);
      setTransfers(Array.isArray(data.cashTransfers) ? data.cashTransfers : []);
      setJournal(Array.isArray(data.cashJournal) ? data.cashJournal : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadState();
  }, []);

  const openRegisters = useMemo(() => registers.filter((register) => register.status === 'open'), [registers]);
  const totalCash = useMemo(() => openRegisters.reduce((sum, register) => sum + Number(register.currentBalance || 0), 0), [openRegisters]);
  const pendingTransfers = useMemo(() => transfers.filter((transfer) => transfer.status === 'pending'), [transfers]);

  const submitOpenRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!openForm.registerNumber.trim() || !openForm.responsible.trim()) {
      showFlash('error', 'Veuillez renseigner le numero de caisse et le responsable.');
      return;
    }
    try {
      await api.post(`/cash/${openForm.scope}/registers/open`, {
        registerNumber: openForm.registerNumber.trim(),
        openingBalance: Number(openForm.openingBalance || 0),
        responsible: openForm.responsible.trim(),
        notes: openForm.notes.trim() || null
      });
      showFlash('success', `Caisse ${openForm.registerNumber} ouverte.`);
      setOpenModalVisible(false);
      setOpenForm({ scope: SCOPES[0], registerNumber: '', openingBalance: '0', responsible: '', notes: '' });
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const openCloseModal = (register: CashRegister) => {
    setClosingRegister(register);
    setCloseForm({ realBalance: String(register.currentBalance ?? 0), responsible: '', notes: '' });
  };

  const submitCloseRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!closingRegister || !closeForm.responsible.trim()) {
      showFlash('error', 'Veuillez renseigner le responsable de la fermeture.');
      return;
    }
    try {
      await api.post(`/cash/${closingRegister.scope}/registers/close`, {
        registerNumber: closingRegister.registerNumber,
        realBalance: Number(closeForm.realBalance || 0),
        responsible: closeForm.responsible.trim(),
        notes: closeForm.notes.trim() || null
      });
      showFlash('success', `Caisse ${closingRegister.registerNumber} fermee.`);
      setClosingRegister(null);
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const submitTransfer = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!transferForm.fromRegister.trim() || !transferForm.toRegister.trim() || !transferForm.reason.trim() || !transferForm.requestedBy.trim()) {
      showFlash('error', 'Veuillez completer tous les champs du virement.');
      return;
    }
    try {
      await api.post(`/cash/${transferForm.scope}/transfers`, {
        fromRegister: transferForm.fromRegister.trim(),
        toRegister: transferForm.toRegister.trim(),
        amount: Number(transferForm.amount || 0),
        reason: transferForm.reason.trim(),
        requestedBy: transferForm.requestedBy.trim(),
        transferDate: new Date(transferForm.transferDate).toISOString()
      });
      showFlash('success', 'Virement cree.');
      setTransferModalVisible(false);
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const approveTransfer = async (transfer: CashTransfer) => {
    const approvedBy = window.prompt('Nom du responsable qui approuve ce virement ?');
    if (!approvedBy || !approvedBy.trim()) return;
    try {
      await api.put(`/cash/${transfer.scope}/transfers/${transfer.id}/approve`, { approvedBy: approvedBy.trim() });
      showFlash('success', `Virement ${transfer.transferNumber} approuve.`);
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const cancelTransfer = async (transfer: CashTransfer) => {
    const confirmed = window.confirm(`Annuler le virement ${transfer.transferNumber} ?`);
    if (!confirmed) return;
    try {
      await api.put(`/cash/${transfer.scope}/transfers/${transfer.id}/cancel`, {});
      showFlash('success', `Virement ${transfer.transferNumber} annule.`);
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const deleteTransfer = async (transfer: CashTransfer) => {
    const confirmed = window.confirm(`Supprimer definitivement le virement ${transfer.transferNumber} ?`);
    if (!confirmed) return;
    try {
      await api.delete(`/cash/${transfer.scope}/transfers/${transfer.id}`);
      showFlash('success', `Virement ${transfer.transferNumber} supprime.`);
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const cancelClosure = async (entry: CashJournal) => {
    const confirmed = window.confirm('Annuler cette cloture de caisse et rouvrir le registre ?');
    if (!confirmed) return;
    try {
      await api.put(`/cash/${entry.scope}/closures/${entry.id}/cancel`);
      showFlash('success', 'Cloture annulee, la caisse est reouverte.');
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const deleteClosure = async (entry: CashJournal) => {
    const confirmed = window.confirm('Supprimer definitivement cette entree de cloture ?');
    if (!confirmed) return;
    try {
      await api.delete(`/cash/${entry.scope}/closures/${entry.id}`);
      showFlash('success', 'Entree de cloture supprimee.');
      await loadState();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  return (
    <div className="space-y-8">
      {flash ? (
        <div className={`rounded-2xl px-4 py-3 text-sm ${flash.tone === 'success' ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : flash.tone === 'info' ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200' : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
          {flash.text}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#0a1220] via-[#0d1627] to-[#12213a] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Tresorerie</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/95">Gestion de caisse</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">Ouverture/fermeture des caisses, virements inter-caisses et journal de tresorerie, tous modules confondus.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadState()} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">Rafraichir</button>
            <button onClick={() => setOpenModalVisible(true)} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Ouvrir une caisse</button>
            <button onClick={() => setTransferModalVisible(true)} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">Nouveau virement</button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Caisses ouvertes</p><p className="mt-3 text-3xl font-semibold text-white">{openRegisters.length}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Solde total en caisse</p><p className="mt-3 text-2xl font-semibold text-white">{money(totalCash)}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Virements en attente</p><p className="mt-3 text-3xl font-semibold text-amber-400">{pendingTransfers.length}</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Ecritures au journal</p><p className="mt-3 text-3xl font-semibold text-white">{journal.length}</p></div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setActiveSection('registers')} className={`rounded-full px-4 py-2 text-sm transition ${activeSection === 'registers' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Caisses</button>
          <button onClick={() => setActiveSection('transfers')} className={`rounded-full px-4 py-2 text-sm transition ${activeSection === 'transfers' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Virements</button>
          <button onClick={() => setActiveSection('journal')} className={`rounded-full px-4 py-2 text-sm transition ${activeSection === 'journal' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Journal</button>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement...</div>
        ) : (
          <div className="mt-6">
            {activeSection === 'registers' ? (
              <div className="grid gap-4 xl:grid-cols-2">
                {registers.map((register) => (
                  <article key={register.id} className="rounded-3xl border border-slate-700/60 bg-[#10182b] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-white/95">Caisse {register.registerNumber}</p>
                        <p className="mt-1 text-sm text-white/55">{register.scope}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(register.status)}`}>{register.status === 'open' ? 'Ouverte' : 'Fermee'}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">
                      <p>Ouverture: {money(register.openingBalance)}</p>
                      <p>Solde actuel: {money(register.currentBalance)}</p>
                      <p>Entrees: {money(register.cashIn)}</p>
                      <p>Sorties: {money(register.cashOut)}</p>
                      <p>Ventes: {money(register.totalSales)}</p>
                    </div>
                    <div className="mt-4 text-xs text-white/50">
                      <p>Ouverte par {register.openedBy || '-'} le {formatDateTime(register.openedAt)}</p>
                      {register.status === 'closed' ? <p>Fermee par {register.closedBy || '-'} le {formatDateTime(register.closedAt)}</p> : null}
                    </div>
                    {register.status === 'open' ? (
                      <div className="mt-5">
                        <button type="button" onClick={() => openCloseModal(register)} className="rounded-xl border border-rose-500/25 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10">
                          Fermer la caisse
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
                {!registers.length ? <div className="rounded-3xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/45 xl:col-span-2">Aucune caisse enregistree.</div> : null}
              </div>
            ) : null}

            {activeSection === 'transfers' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-slate-700/60 text-xs uppercase tracking-[0.18em] text-white/50">
                    <tr>
                      <th className="px-4 py-3">Reference</th>
                      <th className="hidden px-4 py-3 md:table-cell">De</th>
                      <th className="hidden px-4 py-3 md:table-cell">Vers</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {transfers.map((transfer) => (
                      <tr key={transfer.id}>
                        <td className="px-4 py-3 text-white/85">
                          {transfer.transferNumber}
                          <span className="mt-0.5 block text-xs font-normal text-white/50 md:hidden">{transfer.fromRegister} → {transfer.toRegister}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-white/70 md:table-cell">{transfer.fromRegister}</td>
                        <td className="hidden px-4 py-3 text-white/70 md:table-cell">{transfer.toRegister}</td>
                        <td className="px-4 py-3 text-white/85">{money(transfer.amount)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(transfer.status)}`}>{transfer.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {transfer.status === 'pending' ? (
                              <>
                                <button type="button" onClick={() => void approveTransfer(transfer)} className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/10">Approuver</button>
                                <button type="button" onClick={() => void cancelTransfer(transfer)} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10">Annuler</button>
                              </>
                            ) : null}
                            <button type="button" onClick={() => void deleteTransfer(transfer)} className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10">Supprimer</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!transfers.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-white/45">Aucun virement enregistre.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            ) : null}

            {activeSection === 'journal' ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-700/60 text-xs uppercase tracking-[0.18em] text-white/50">
                    <tr>
                      <th className="hidden px-4 py-3 md:table-cell">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="hidden px-4 py-3 md:table-cell">Caisse</th>
                      <th className="px-4 py-3">Montant</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {journal.map((entry) => (
                      <tr key={entry.id}>
                        <td className="hidden px-4 py-3 text-white/70 md:table-cell">{formatDateTime(entry.date)}</td>
                        <td className="px-4 py-3 text-white/85">
                          {entry.description}
                          <span className="mt-0.5 block text-xs font-normal text-white/50 md:hidden">{entry.register}</span>
                        </td>
                        <td className="hidden px-4 py-3 text-white/70 md:table-cell">{entry.register}</td>
                        <td className="px-4 py-3 text-white/85">{money(entry.amount)}</td>
                        <td className="px-4 py-3"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(entry.status)}`}>{entry.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          {entry.sourceType === 'register-closing' && entry.status === 'active' ? (
                            <button type="button" onClick={() => void cancelClosure(entry)} className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs text-amber-300 hover:bg-amber-500/10">Annuler la cloture</button>
                          ) : null}
                          {entry.sourceType === 'register-closing' && entry.status === 'cancelled' ? (
                            <button type="button" onClick={() => void deleteClosure(entry)} className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10">Supprimer</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {!journal.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-white/45">Aucune ecriture au journal.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {openModalVisible ? (
        <ModalShell title="Ouvrir une caisse" onClose={() => setOpenModalVisible(false)}>
          <form onSubmit={submitOpenRegister} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Module</span>
                <select value={openForm.scope} onChange={(event) => setOpenForm((prev) => ({ ...prev, scope: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  {SCOPES.map((scope) => (<option key={scope} value={scope}>{scope}</option>))}
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Numero de caisse</span>
                <input type="text" value={openForm.registerNumber} onChange={(event) => setOpenForm((prev) => ({ ...prev, registerNumber: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="CR-01" />
              </label>
            </div>
            <label className="space-y-2 text-sm text-white/80">
              <span>Fond de caisse initial</span>
              <input type="number" min="0" value={openForm.openingBalance} onChange={(event) => setOpenForm((prev) => ({ ...prev, openingBalance: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Responsable</span>
              <input type="text" value={openForm.responsible} onChange={(event) => setOpenForm((prev) => ({ ...prev, responsible: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Notes</span>
              <textarea value={openForm.notes} onChange={(event) => setOpenForm((prev) => ({ ...prev, notes: event.target.value }))} rows={2} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setOpenModalVisible(false)} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">Annuler</button>
              <button type="submit" className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Ouvrir</button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {closingRegister ? (
        <ModalShell title={`Fermer la caisse ${closingRegister.registerNumber}`} onClose={() => setClosingRegister(null)}>
          <form onSubmit={submitCloseRegister} className="space-y-4">
            <label className="space-y-2 text-sm text-white/80">
              <span>Solde reel compte</span>
              <input type="number" min="0" value={closeForm.realBalance} onChange={(event) => setCloseForm((prev) => ({ ...prev, realBalance: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Responsable</span>
              <input type="text" value={closeForm.responsible} onChange={(event) => setCloseForm((prev) => ({ ...prev, responsible: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Notes</span>
              <textarea value={closeForm.notes} onChange={(event) => setCloseForm((prev) => ({ ...prev, notes: event.target.value }))} rows={2} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setClosingRegister(null)} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">Annuler</button>
              <button type="submit" className="rounded-2xl bg-rose-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-rose-400">Fermer la caisse</button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {transferModalVisible ? (
        <ModalShell title="Nouveau virement entre caisses" onClose={() => setTransferModalVisible(false)}>
          <form onSubmit={submitTransfer} className="space-y-4">
            <label className="space-y-2 text-sm text-white/80">
              <span>Module</span>
              <select value={transferForm.scope} onChange={(event) => setTransferForm((prev) => ({ ...prev, scope: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                {SCOPES.map((scope) => (<option key={scope} value={scope}>{scope}</option>))}
              </select>
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Caisse source</span>
                <input type="text" value={transferForm.fromRegister} onChange={(event) => setTransferForm((prev) => ({ ...prev, fromRegister: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="CR-01" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Caisse destination</span>
                <input type="text" value={transferForm.toRegister} onChange={(event) => setTransferForm((prev) => ({ ...prev, toRegister: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="CR-02" />
              </label>
            </div>
            <label className="space-y-2 text-sm text-white/80">
              <span>Montant</span>
              <input type="number" min="0" value={transferForm.amount} onChange={(event) => setTransferForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <label className="space-y-2 text-sm text-white/80">
              <span>Motif</span>
              <input type="text" value={transferForm.reason} onChange={(event) => setTransferForm((prev) => ({ ...prev, reason: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Demande par</span>
                <input type="text" value={transferForm.requestedBy} onChange={(event) => setTransferForm((prev) => ({ ...prev, requestedBy: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Date</span>
                <input type="datetime-local" value={transferForm.transferDate} onChange={(event) => setTransferForm((prev) => ({ ...prev, transferDate: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setTransferModalVisible(false)} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">Annuler</button>
              <button type="submit" className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">Creer le virement</button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default CashWorkflow;
