import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Badge, Field, Flash, FlashMessage, Modal, PageHeader, Panel, StatCard, Table,
  apiErrorMessage, formatDate, formatDateTime, formatMoney, ghostButton, inputClass, primaryButton, smallButton
} from './ui';

type Invoice = {
  code: string;
  clientId: number | null;
  clientName: string | null;
  date: string | null;
  total: number;
  discount: number;
  net: number;
  totalPaid: number;
  remaining: number;
  paid: boolean;
  status: string;
  archivedAt: string | null;
  archivedBy: string | null;
};

type InvoiceStats = {
  total: number;
  issued: number;
  partiallyPaid: number;
  paid: number;
  archived: number;
  totalAmount: number;
  totalCollected: number;
  totalOutstanding: number;
};

type InvoiceEvent = { type: string; detail: string | null; at: string };
type SagaStep = { name: string; status: string; detail: string | null; at: string };
type Payment = {
  id: number;
  reference: string;
  invoiceCode: string;
  amount: number;
  method: string;
  status: string;
  failureReason: string | null;
  createdAt: string;
  saga: { id: number; status: string; steps: SagaStep[] } | null;
};

const STATUS_LABELS: Record<string, string> = {
  EMISE: 'Emise',
  PARTIELLEMENT_PAYEE: 'Partiellement payee',
  PAYEE: 'Payee',
  ARCHIVEE: 'Archivee',
  ANNULEE: 'Annulee'
};

const STEP_LABELS: Record<string, string> = {
  VALIDATE_INVOICE: 'Validation de la facture',
  REGISTER_PAYMENT_ON_INVOICE: 'Enregistrement sur la facture',
  RECORD_FINANCE_TRANSACTION: 'Ecriture financiere',
  CONFIRM_RESERVATION: 'Confirmation de la reservation',
  NOTIFY_CLIENT: 'Recu envoye au client'
};

const METHODS: Array<{ value: string; label: string }> = [
  { value: 'ESPECES', label: 'Especes' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARTE', label: 'Carte bancaire' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Cheque' }
];

const statusTone = (status: string): 'green' | 'amber' | 'sky' | 'rose' | 'slate' | 'violet' => {
  switch (status) {
    case 'PAYEE': return 'green';
    case 'PARTIELLEMENT_PAYEE': return 'amber';
    case 'EMISE': return 'sky';
    case 'ARCHIVEE': return 'violet';
    case 'ANNULEE': return 'rose';
    default: return 'slate';
  }
};

const stepTone = (status: string): 'green' | 'amber' | 'sky' | 'rose' | 'slate' | 'violet' => {
  if (status === 'DONE') return 'green';
  if (status === 'FAILED' || status === 'COMPENSATION_FAILED') return 'rose';
  if (status === 'COMPENSATED') return 'amber';
  return 'slate';
};

const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const [payTarget, setPayTarget] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('ESPECES');
  const [paying, setPaying] = useState(false);
  const [payResult, setPayResult] = useState<Payment | null>(null);

  const [trackTarget, setTrackTarget] = useState<Invoice | null>(null);
  const [events, setEvents] = useState<InvoiceEvent[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, summary] = await Promise.all([api.get('/factures'), api.get('/factures/stats')]);
      setInvoices(list.data ?? []);
      setStats(summary.data ?? null);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger les factures.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) =>
      (statusFilter === 'all' || inv.status === statusFilter)
      && (!q || inv.code.toLowerCase().includes(q) || (inv.clientName ?? '').toLowerCase().includes(q)));
  }, [invoices, statusFilter, search]);

  const openPay = (inv: Invoice) => {
    setPayTarget(inv);
    setPayAmount(String(Math.round(inv.remaining)));
    setPayMethod('ESPECES');
    setPayResult(null);
  };

  const submitPayment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    setPayResult(null);
    try {
      const response = await api.post('/paiements', { invoiceCode: payTarget.code, amount: Number(payAmount), method: payMethod });
      setPayResult(response.data);
      setFlash({ tone: 'success', text: `Paiement ${response.data.reference} enregistre.` });
      await load();
    } catch (error) {
      // A failed saga answers 422 WITH the payment and its compensated steps in the body: show it.
      const body = (error as { response?: { status?: number; data?: Payment } })?.response;
      if (body?.status === 422 && body.data?.saga) {
        setPayResult(body.data);
        setFlash({ tone: 'error', text: 'Paiement refuse : les operations deja effectuees ont ete annulees.' });
      } else {
        setFlash({ tone: 'error', text: apiErrorMessage(error, 'Le paiement a echoue.') });
      }
      await load();
    } finally {
      setPaying(false);
    }
  };

  const openTracking = async (inv: Invoice) => {
    setTrackTarget(inv);
    setEvents([]);
    setPayments([]);
    try {
      const [tracking, history] = await Promise.all([
        api.get(`/factures/${inv.code}/suivi`),
        api.get('/paiements', { params: { invoiceCode: inv.code } })
      ]);
      setEvents(tracking.data?.events ?? []);
      setPayments(history.data ?? []);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger le suivi.') });
    }
  };

  const openDocument = async (inv: Invoice) => {
    try {
      const response = await api.get(`/factures/${inv.code}/document`, { responseType: 'text', headers: { Accept: 'text/html' } });
      const blob = new Blob([response.data as string], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (!win) setFlash({ tone: 'info', text: 'Autorisez les fenetres surgissantes pour afficher la facture.' });
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de generer le document.') });
    }
  };

  const archive = async (inv: Invoice) => {
    if (!window.confirm(`Archiver la facture ${inv.code} ? Elle ne pourra plus etre modifiee ni payee.`)) return;
    try {
      await api.post(`/factures/${inv.code}/archive`);
      setFlash({ tone: 'success', text: `Facture ${inv.code} archivee.` });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, "Impossible d'archiver la facture.") });
    }
  };

  const statusKeys = ['EMISE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'ARCHIVEE'];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Facturation"
        title="Factures et paiements"
        description="Generation du document, encaissement par saga (annulation automatique en cas d'echec), archivage et suivi."
        actions={<button onClick={() => void load()} className={ghostButton}>Rafraichir</button>}
      />

      <FlashMessage flash={flash} onClose={() => setFlash(null)} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Factures" value={stats?.total ?? '-'} hint={`${stats?.paid ?? 0} payees - ${stats?.archived ?? 0} archivees`} />
        <StatCard label="Facture" value={formatMoney(stats?.totalAmount)} />
        <StatCard label="Encaisse" value={formatMoney(stats?.totalCollected)} />
        <StatCard label="Reste a encaisser" value={formatMoney(stats?.totalOutstanding)} hint={`${(stats?.issued ?? 0) + (stats?.partiallyPaid ?? 0)} facture(s) ouverte(s)`} />
      </section>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <button onClick={() => setStatusFilter('all')} className={`rounded-full px-4 py-2 text-sm transition ${statusFilter === 'all' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/80'}`}>Toutes</button>
          {statusKeys.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-full px-4 py-2 text-sm transition ${statusFilter === s ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/80'}`}>{STATUS_LABELS[s]}</button>
          ))}
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher (code, client)" className={`${inputClass} ml-auto max-w-xs`} />
        </div>

        <Table headers={['Facture', 'Client', 'Date', 'Net', 'Paye', 'Reste', 'Statut', 'Actions']} isEmpty={!loading && visible.length === 0} empty="Aucune facture.">
          {visible.map((inv) => (
            <tr key={inv.code} className="align-middle">
              <td className="px-3 py-3 font-mono text-xs">{inv.code}</td>
              <td className="px-3 py-3">{inv.clientName ?? (inv.clientId ? `Client #${inv.clientId}` : '-')}</td>
              <td className="px-3 py-3">{formatDate(inv.date)}</td>
              <td className="px-3 py-3">{formatMoney(inv.net)}</td>
              <td className="px-3 py-3">{formatMoney(inv.totalPaid)}</td>
              <td className="px-3 py-3">{formatMoney(inv.remaining)}</td>
              <td className="px-3 py-3"><Badge tone={statusTone(inv.status)}>{STATUS_LABELS[inv.status] ?? inv.status}</Badge></td>
              <td className="px-3 py-3">
                <div className="flex flex-wrap gap-2">
                  <button className={smallButton} onClick={() => void openDocument(inv)}>Document</button>
                  <button className={smallButton} onClick={() => void openTracking(inv)}>Suivi</button>
                  <button className={smallButton} disabled={inv.remaining <= 0 || inv.status === 'ARCHIVEE' || inv.status === 'ANNULEE'} onClick={() => openPay(inv)}>Payer</button>
                  <button className={smallButton} disabled={inv.status !== 'PAYEE'} onClick={() => void archive(inv)}>Archiver</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {loading ? <p className="py-6 text-center text-sm text-white/45">Chargement...</p> : null}
      </Panel>

      {payTarget ? (
        <Modal title={`Payer la facture ${payTarget.code}`} onClose={() => setPayTarget(null)}>
          <p className="mb-4 text-sm text-white/70">
            Net {formatMoney(payTarget.net)} - deja paye {formatMoney(payTarget.totalPaid)} - <strong>reste {formatMoney(payTarget.remaining)}</strong>
          </p>
          {!payResult || payResult.status === 'FAILED' ? (
            <form onSubmit={submitPayment} className="space-y-4">
              <Field label="Montant (FCFA)">
                <input type="number" min={1} max={Math.round(payTarget.remaining)} required value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className={inputClass} />
              </Field>
              <Field label="Mode de paiement">
                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className={inputClass}>
                  {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
              <div className="flex justify-end gap-3">
                <button type="button" className={ghostButton} onClick={() => setPayTarget(null)}>Annuler</button>
                <button type="submit" className={primaryButton} disabled={paying}>{paying ? 'Traitement...' : 'Encaisser'}</button>
              </div>
            </form>
          ) : null}

          {payResult ? (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">Deroulement du paiement {payResult.reference}</h4>
                <Badge tone={payResult.status === 'COMPLETED' ? 'green' : 'rose'}>{payResult.status === 'COMPLETED' ? 'Reussi' : 'Echec - annule'}</Badge>
              </div>
              {payResult.failureReason ? <p className="text-sm text-rose-300">{payResult.failureReason}</p> : null}
              <ul className="space-y-2">
                {(payResult.saga?.steps ?? []).filter((s) => s.status !== 'STARTED').map((s, i) => (
                  <li key={`${s.name}-${i}`} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2 text-sm">
                    <span>{STEP_LABELS[s.name] ?? s.name}</span>
                    <Badge tone={stepTone(s.status)}>{s.status}</Badge>
                  </li>
                ))}
              </ul>
              {payResult.status === 'COMPLETED' ? (
                <div className="flex justify-end"><button className={primaryButton} onClick={() => setPayTarget(null)}>Terminer</button></div>
              ) : null}
            </div>
          ) : null}
        </Modal>
      ) : null}

      {trackTarget ? (
        <Modal title={`Suivi de la facture ${trackTarget.code}`} onClose={() => setTrackTarget(null)} wide>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/55">Historique</h4>
          <ul className="mb-6 space-y-2">
            {events.map((e, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2 text-sm">
                <span><Badge tone="sky">{e.type}</Badge> <span className="ml-2 text-white/70">{e.detail ?? ''}</span></span>
                <span className="text-xs text-white/45">{formatDateTime(e.at)}</span>
              </li>
            ))}
            {events.length === 0 ? <li className="text-sm text-white/45">Aucun evenement.</li> : null}
          </ul>
          <h4 className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/55">Paiements</h4>
          <Table headers={['Reference', 'Montant', 'Mode', 'Statut', 'Date']} isEmpty={payments.length === 0} empty="Aucun paiement.">
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2 font-mono text-xs">{p.reference}</td>
                <td className="px-3 py-2">{formatMoney(p.amount)}</td>
                <td className="px-3 py-2">{p.method}</td>
                <td className="px-3 py-2"><Badge tone={p.status === 'COMPLETED' ? 'green' : p.status === 'FAILED' ? 'rose' : 'amber'}>{p.status}</Badge>
                  {p.failureReason ? <div className="mt-1 max-w-xs text-xs text-rose-300/80">{p.failureReason}</div> : null}</td>
                <td className="px-3 py-2">{formatDateTime(p.createdAt)}</td>
              </tr>
            ))}
          </Table>
        </Modal>
      ) : null}
    </div>
  );
};

export default Invoices;
