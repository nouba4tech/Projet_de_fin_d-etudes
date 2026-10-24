import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Badge, apiErrorMessage, formatDate, formatMoney } from './ui';

type Loyalty = {
  points: number;
  tier: string;
  benefits: string;
  nextTier: string | null;
  pointsToNextTier: number;
  totalSpent: number;
  completedStays: number;
};

type Stay = {
  reservationId: number;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: string;
  amount: number;
  invoiceCode: string | null;
  completed: boolean;
};

type History = { reservations: number; completedStays: number; cancelled: number; totalSpent: number; stays: Stay[] };

const TIER_LABEL: Record<string, string> = { BRONZE: 'Bronze', ARGENT: 'Argent', OR: 'Or', PLATINE: 'Platine' };
const TIER_THRESHOLD: Record<string, number> = { BRONZE: 0, ARGENT: 100, OR: 500, PLATINE: 1500 };
const TIER_STYLE: Record<string, string> = {
  BRONZE: 'from-amber-900/40 to-amber-700/20 border-amber-700/40',
  ARGENT: 'from-slate-400/30 to-slate-200/10 border-slate-300/40',
  OR: 'from-yellow-500/30 to-yellow-300/10 border-yellow-400/40',
  PLATINE: 'from-cyan-400/30 to-indigo-300/10 border-cyan-300/40'
};

const statusTone = (status: string): 'green' | 'amber' | 'rose' | 'sky' | 'slate' => {
  const s = status.toLowerCase();
  if (s.startsWith('annul')) return 'rose';
  if (s.startsWith('termin')) return 'slate';
  if (s.startsWith('confirm') || s.startsWith('en cours')) return 'green';
  if (s.startsWith('en attente')) return 'amber';
  return 'sky';
};

/** Loyalty status and stay history of one client (clients-service, computed from reservations). */
const ClientLoyaltyPanel: React.FC<{ clientId: number }> = ({ clientId }) => {
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoyalty(null);
    setHistory(null);
    setError(null);
    Promise.all([api.get<Loyalty>(`/clients/${clientId}/fidelite`), api.get<History>(`/clients/${clientId}/historique`)])
      .then(([l, h]) => {
        if (alive) {
          setLoyalty(l.data);
          setHistory(h.data);
        }
      })
      .catch((err) => alive && setError(apiErrorMessage(err, 'Fidélité et historique indisponibles.')));
    return () => {
      alive = false;
    };
  }, [clientId]);

  if (error) {
    return <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>;
  }
  if (!loyalty || !history) {
    return <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm text-white/55">Chargement de la fidélité...</div>;
  }

  const start = TIER_THRESHOLD[loyalty.tier] ?? 0;
  const end = loyalty.nextTier ? TIER_THRESHOLD[loyalty.nextTier] : start;
  const progress = loyalty.nextTier ? Math.min(100, Math.round(((loyalty.points - start) / Math.max(1, end - start)) * 100)) : 100;

  return (
    <div className="space-y-4">
      <div className={`rounded-2xl border bg-gradient-to-br p-5 ${TIER_STYLE[loyalty.tier] ?? TIER_STYLE.BRONZE}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-white/55">Fidélité</p>
            <p className="mt-1 text-2xl font-semibold text-white">Niveau {TIER_LABEL[loyalty.tier] ?? loyalty.tier}</p>
          </div>
          <p className="text-3xl font-bold text-white">{loyalty.points.toLocaleString('fr-FR')} <span className="text-sm font-normal text-white/60">points</span></p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-white/80" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-white/65">
          {loyalty.nextTier
            ? `Encore ${loyalty.pointsToNextTier.toLocaleString('fr-FR')} points pour le niveau ${TIER_LABEL[loyalty.nextTier] ?? loyalty.nextTier}`
            : 'Niveau maximal atteint'}
          {' · '}1 point par 1 000 FCFA de séjours réalisés
        </p>
        <p className="mt-3 text-sm text-white/85">Avantages : {loyalty.benefits}</p>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs uppercase tracking-[0.25em] text-white/45">Historique des séjours</p>
          <p className="text-xs text-white/55">
            {history.reservations} réservation(s) · {history.completedStays} réalisé(s) · {history.cancelled} annulée(s) · {formatMoney(history.totalSpent)}
          </p>
        </div>
        {history.stays.length === 0 ? (
          <p className="text-sm text-white/45">Aucun séjour.</p>
        ) : (
          <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {history.stays.map((stay) => (
              <li key={stay.reservationId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-3 py-2 text-sm">
                <span className="text-white">
                  #{stay.reservationId} · Chambre {stay.roomId} · {formatDate(stay.checkIn)} → {formatDate(stay.checkOut)}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-white/70">{formatMoney(stay.amount)}</span>
                  <Badge tone={statusTone(stay.status)}>{stay.status}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClientLoyaltyPanel;
