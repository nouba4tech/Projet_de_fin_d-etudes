import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type FinanceTransactionDto = {
  id: number;
  type: string;
  category: string;
  description: string;
  amount: number;
  transactionDate: string;
  reference: string | null;
  createdAt: string | null;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type FinanceFormState = {
  type: string;
  category: string;
  description: string;
  amount: string;
  transactionDate: string;
  reference: string;
};

const defaultFinanceForm = (): FinanceFormState => ({
  type: 'Recette',
  category: 'Hebergement',
  description: '',
  amount: '0',
  transactionDate: new Date().toISOString().slice(0, 10),
  reference: ''
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
  return 'Impossible de charger les transactions financieres.';
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

const Finances: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [entries, setEntries] = useState<FinanceTransactionDto[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [financeForm, setFinanceForm] = useState<FinanceFormState>(defaultFinanceForm);

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => setFlash({ tone, text });

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const response = await api.get<FinanceTransactionDto[]>('/finances/transactions');
      setEntries(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions();
  }, []);

  const openCreateModal = () => {
    setEditingEntryId(null);
    setFinanceForm(defaultFinanceForm());
    setModalMode('create');
  };

  const openEditModal = (entry: FinanceTransactionDto) => {
    setEditingEntryId(entry.id);
    setFinanceForm({
      type: entry.type || 'Recette',
      category: entry.category || 'Hebergement',
      description: entry.description || '',
      amount: String(Number(entry.amount || 0)),
      transactionDate: entry.transactionDate || new Date().toISOString().slice(0, 10),
      reference: entry.reference || ''
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setEditingEntryId(null);
    setFinanceForm(defaultFinanceForm());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!financeForm.type.trim() || !financeForm.category.trim() || !financeForm.description.trim()) {
      showFlash('error', 'Veuillez renseigner le type, la categorie et la description.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        type: financeForm.type,
        category: financeForm.category.trim(),
        description: financeForm.description.trim(),
        amount: Number(financeForm.amount || 0),
        transactionDate: financeForm.transactionDate,
        reference: financeForm.reference.trim() || null
      };

      if (modalMode === 'edit' && editingEntryId !== null) {
        await api.put(`/finances/transactions/${editingEntryId}`, payload);
        showFlash('success', 'Transaction modifiee avec succes.');
      } else {
        await api.post('/finances/transactions', payload);
        showFlash('success', 'Transaction creee avec succes.');
      }

      closeModal();
      await loadTransactions();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (entry: FinanceTransactionDto) => {
    const confirmed = window.confirm(`Supprimer la transaction #${entry.id} ?`);
    if (!confirmed) return;
    try {
      await api.delete(`/finances/transactions/${entry.id}`);
      showFlash('success', 'Transaction supprimee avec succes.');
      await loadTransactions();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const filteredEntries = useMemo(() => entries.filter((entry) => typeFilter === 'all' || entry.type === typeFilter), [entries, typeFilter]);

  const stats = useMemo(() => {
    const income = entries.filter((entry) => entry.type.toLowerCase().includes('recette') || entry.type.toLowerCase().includes('income')).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    const expense = entries.filter((entry) => entry.type.toLowerCase().includes('depense') || entry.type.toLowerCase().includes('expense')).reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    return { income, expense, balance: income - expense };
  }, [entries]);

  const types = useMemo(() => Array.from(new Set(entries.map((entry) => entry.type))), [entries]);

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#07111f] via-[#0a1220] to-[#13213b] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Facturation</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-white/95">Gestion de la facturation</h1>
            <p className="mt-3 text-sm leading-7 text-white/70">Transactions chargees depuis Spring Boot avec categories, references et soldes reels.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadTransactions()} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Rafraichir
            </button>
            <button onClick={openCreateModal} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              Nouvelle ecriture
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Recettes</p><p className="mt-3 text-3xl font-semibold text-emerald-300">{stats.income.toLocaleString('fr-FR')} FCFA</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Depenses</p><p className="mt-3 text-3xl font-semibold text-rose-300">{stats.expense.toLocaleString('fr-FR')} FCFA</p></div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6"><p className="text-xs uppercase tracking-[0.28em] text-white/50">Solde net</p><p className="mt-3 text-3xl font-semibold text-white">{stats.balance.toLocaleString('fr-FR')} FCFA</p></div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setTypeFilter('all')} className={`rounded-full px-4 py-2 text-sm transition ${typeFilter === 'all' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>Toutes</button>
          {types.map((type) => (
            <button key={type} onClick={() => setTypeFilter(type)} className={`rounded-full px-4 py-2 text-sm transition ${typeFilter === type ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/75 hover:bg-white/5'}`}>{type}</button>
          ))}
        </div>

        {flash ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${flash.tone === 'success' ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : flash.tone === 'info' ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200' : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
            {flash.text}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement des transactions...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-slate-700/60 text-left text-xs uppercase tracking-[0.25em] text-white/45">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Libelle</th>
                  <th className="px-4 py-3">Categorie</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Montant</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-800/80 text-sm text-white/80">
                    <td className="px-4 py-4">{entry.transactionDate}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-white/95">{entry.description}</p>
                      <p className="mt-1 text-xs text-white/45">Transaction {entry.id}</p>
                    </td>
                    <td className="px-4 py-4">{entry.category}</td>
                    <td className="px-4 py-4">{entry.reference || '-'}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${entry.type.toLowerCase().includes('recette') || entry.type.toLowerCase().includes('income') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-300 border border-rose-500/20'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">{Number(entry.amount || 0).toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEditModal(entry)} className="rounded-xl border border-slate-700/60 px-3 py-2 text-xs text-white/80 transition hover:bg-white/5">
                          Modifier
                        </button>
                        <button type="button" onClick={() => void handleDelete(entry)} className="rounded-xl border border-rose-500/25 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/10">
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filteredEntries.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-white/45">Aucune transaction ne correspond au filtre.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalMode ? (
        <ModalShell title={modalMode === 'create' ? 'Nouvelle transaction' : 'Modifier la transaction'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Type</span>
                <select value={financeForm.type} onChange={(event) => setFinanceForm((prev) => ({ ...prev, type: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  <option value="Recette">Recette</option>
                  <option value="Depense">Depense</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Categorie</span>
                <input type="text" value={financeForm.category} onChange={(event) => setFinanceForm((prev) => ({ ...prev, category: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Hebergement, restauration..." />
              </label>
            </div>
            <label className="space-y-2 text-sm text-white/80">
              <span>Description</span>
              <textarea value={financeForm.description} onChange={(event) => setFinanceForm((prev) => ({ ...prev, description: event.target.value }))} rows={4} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" placeholder="Detaillez l ecriture" />
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-white/80">
                <span>Montant</span>
                <input type="number" min="0" value={financeForm.amount} onChange={(event) => setFinanceForm((prev) => ({ ...prev, amount: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Date transaction</span>
                <input type="date" value={financeForm.transactionDate} onChange={(event) => setFinanceForm((prev) => ({ ...prev, transactionDate: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Reference</span>
                <input type="text" value={financeForm.reference} onChange={(event) => setFinanceForm((prev) => ({ ...prev, reference: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Enregistrement...' : modalMode === 'create' ? 'Creer la transaction' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Finances;
