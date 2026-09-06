import React, { useEffect, useState, useMemo } from 'react';
import api from '../services/api';

// ─── Icônes SVG inline ───────────────────────────────────────────────────────

const IconTrendUp = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);
const IconHotel = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const IconRestaurant = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0L5.4 5M7 13l-1.5 6M17 13l1.5 6M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
  </svg>
);
const IconBar = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);
const IconEmployees = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const IconDownload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);
const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardSummary {
  occupancyRate: number;
  todayRevenue: number;
  pendingCheckins: number;
  roomsCleaning: number;
  totalRooms: number;
  occupiedRooms: number;
  activeClients: number;
  activeReservations: number;
}

interface ReservationRecord {
  id: number;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  status: string;
}

interface RestaurantOrder {
  id: number;
  tableNumber: number;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface BarProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  minThreshold: number;
  available: boolean;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  salary: number;
  status: string;
}

interface FinanceTransaction {
  id: number;
  transactionType: string;
  description: string;
  amount: number;
  transactionDate: string;
  category: string;
}

type ReportSection = 'overview' | 'hebergement' | 'restaurant' | 'bar' | 'employes' | 'finances';

const SECTIONS: { key: ReportSection; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: <IconTrendUp />, color: 'from-purple-500 to-indigo-500' },
  { key: 'hebergement', label: 'Hébergement', icon: <IconHotel />, color: 'from-blue-500 to-cyan-500' },
  { key: 'restaurant', label: 'Restaurant', icon: <IconRestaurant />, color: 'from-orange-500 to-amber-500' },
  { key: 'bar', label: 'Bar', icon: <IconBar />, color: 'from-yellow-500 to-lime-500' },
  { key: 'employes', label: 'Employés', icon: <IconEmployees />, color: 'from-emerald-500 to-teal-500' },
  { key: 'finances', label: 'Finances', icon: <IconTrendUp />, color: 'from-rose-500 to-pink-500' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-FR');
const fmtCurrency = (n: number) => `${fmt(Math.round(n))} FCFA`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const StatCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ label, value, sub, color = 'from-blue-500 to-indigo-500', icon }) => (
  <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5 overflow-hidden group hover:border-gray-600/70 transition-all duration-300">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-full -translate-y-8 translate-x-8 group-hover:opacity-10 transition-opacity`} />
    <div className="flex items-start justify-between mb-3">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      {icon && (
        <div className={`p-2 rounded-xl bg-gradient-to-br ${color} bg-opacity-20 text-white`}>{icon}</div>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

// ─── Section Overview ─────────────────────────────────────────────────────────

const OverviewSection: React.FC<{ data: DashboardSummary | null; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState message="Impossible de charger les données du tableau de bord." />;

  const stats = [
    { label: 'Taux d\'occupation', value: fmtPct(data.occupancyRate), sub: `${data.occupiedRooms} / ${data.totalRooms} chambres`, color: 'from-blue-500 to-indigo-500' },
    { label: 'Revenus du jour', value: fmtCurrency(data.todayRevenue), sub: 'Hébergement + Finances', color: 'from-emerald-500 to-teal-500' },
    { label: 'Check-ins en attente', value: String(data.pendingCheckins), sub: 'Arrivées prévues', color: 'from-amber-500 to-orange-500' },
    { label: 'Chambres en nettoyage', value: String(data.roomsCleaning), sub: 'En cours de préparation', color: 'from-purple-500 to-pink-500' },
    { label: 'Clients actifs', value: fmt(data.activeClients), sub: 'Dans la base clients', color: 'from-cyan-500 to-blue-500' },
    { label: 'Réservations actives', value: fmt(data.activeReservations), sub: 'Non expirées', color: 'from-rose-500 to-red-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} color={s.color} />
        ))}
      </div>

      {/* Jauge taux occupation */}
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Taux d'occupation global</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-700/50 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(data.occupancyRate, 100)}%` }}
            />
          </div>
          <span className="text-2xl font-bold text-white w-16 text-right">{fmtPct(data.occupancyRate)}</span>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          <span>0%</span>
          <span className="text-yellow-400">⚠ Seuil critique 60%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

// ─── Section Hébergement ──────────────────────────────────────────────────────

const HebergementSection: React.FC<{ data: ReservationRecord[]; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const total = data.reduce((sum, r) => sum + (r.totalAmount || 0), 0);
  const confirmed = data.filter(r => r.status?.includes('Confirm')).length;
  const cancelled = data.filter(r => r.status?.includes('Annul')).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total réservations" value={fmt(data.length)} color="from-blue-500 to-indigo-500" />
        <StatCard label="Confirmées" value={fmt(confirmed)} color="from-emerald-500 to-teal-500" />
        <StatCard label="Annulées" value={fmt(cancelled)} color="from-rose-500 to-red-500" />
        <StatCard label="Revenus totaux" value={fmtCurrency(total)} color="from-amber-500 to-orange-500" />
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Dernières réservations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {['Client', 'Chambre', 'Arrivée', 'Départ', 'Montant', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {data.slice(0, 15).map(r => (
                <tr key={r.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-white font-medium">{r.guestName || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{r.roomNumber || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{r.checkIn ? new Date(r.checkIn).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{r.checkOut ? new Date(r.checkOut).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{fmtCurrency(r.totalAmount || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      r.status?.includes('Confirm') ? 'bg-emerald-500/20 text-emerald-400' :
                      r.status?.includes('Annul') ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{r.status || 'N/A'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState message="Aucune réservation trouvée." />}
        </div>
      </div>
    </div>
  );
};

// ─── Section Restaurant ───────────────────────────────────────────────────────

const RestaurantSection: React.FC<{ data: RestaurantOrder[]; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const totalRevenue = data.filter(o => o.status === 'Payé').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const paid = data.filter(o => o.status === 'Payé').length;
  const pending = data.filter(o => o.status !== 'Payé' && o.status !== 'Annulée').length;

  // Revenus par table (top 5)
  const byTable = data.reduce((acc: Record<number, number>, o) => {
    acc[o.tableNumber] = (acc[o.tableNumber] || 0) + (o.totalAmount || 0);
    return acc;
  }, {});
  const topTables = Object.entries(byTable)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Commandes totales" value={fmt(data.length)} color="from-orange-500 to-amber-500" />
        <StatCard label="Payées" value={fmt(paid)} color="from-emerald-500 to-teal-500" />
        <StatCard label="En attente" value={fmt(pending)} color="from-yellow-500 to-orange-500" />
        <StatCard label="Revenus (payées)" value={fmtCurrency(totalRevenue)} color="from-amber-500 to-orange-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top tables */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Top 5 Tables (par revenus)</h3>
          <div className="space-y-3">
            {topTables.map(([table, rev], i) => {
              const maxRev = topTables[0][1] || 1;
              return (
                <div key={table}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">Table {table}</span>
                    <span className="text-white font-medium">{fmtCurrency(rev)}</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                      style={{ width: `${(rev / maxRev) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {topTables.length === 0 && <p className="text-gray-400 text-sm">Aucune donnée disponible.</p>}
          </div>
        </div>

        {/* Statut des commandes */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Répartition des commandes</h3>
          <div className="space-y-3">
            {[
              { label: 'Payées', count: paid, color: 'from-emerald-500 to-teal-500' },
              { label: 'En attente', count: pending, color: 'from-yellow-500 to-orange-500' },
              { label: 'Annulées', count: data.filter(o => o.status === 'Annulée').length, color: 'from-rose-500 to-red-500' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-sm text-gray-300">{s.label}</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full bg-gradient-to-r ${s.color} text-white`}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Dernières commandes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {['#', 'Table', 'Montant', 'Statut', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {data.slice(0, 15).map(o => (
                <tr key={o.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-400">#{o.id}</td>
                  <td className="px-4 py-3 text-sm text-white font-medium">Table {o.tableNumber}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{fmtCurrency(o.totalAmount || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      o.status === 'Payé' ? 'bg-emerald-500/20 text-emerald-400' :
                      o.status === 'Annulée' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>{o.status || 'N/A'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState message="Aucune commande trouvée." />}
        </div>
      </div>
    </div>
  );
};

// ─── Section Bar ──────────────────────────────────────────────────────────────

const BarSection: React.FC<{ data: BarProduct[]; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const totalValue = data.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const lowStock = data.filter(p => p.stock <= p.minThreshold).length;
  const outOfStock = data.filter(p => p.stock === 0).length;

  // Grouper par catégorie
  const byCategory = data.reduce((acc: Record<string, { count: number; value: number }>, p) => {
    const cat = p.category || 'Autre';
    if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
    acc[cat].count++;
    acc[cat].value += p.price * p.stock;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Produits en stock" value={fmt(data.length)} color="from-yellow-500 to-lime-500" />
        <StatCard label="Stock faible" value={fmt(lowStock)} sub="≤ seuil minimum" color="from-amber-500 to-orange-500" />
        <StatCard label="Rupture de stock" value={fmt(outOfStock)} color="from-rose-500 to-red-500" />
        <StatCard label="Valeur du stock" value={fmtCurrency(totalValue)} color="from-emerald-500 to-teal-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Par catégorie */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Stock par catégorie</h3>
          <div className="space-y-3">
            {Object.entries(byCategory).map(([cat, info]) => (
              <div key={cat} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{cat}</p>
                  <p className="text-xs text-gray-400">{info.count} produits</p>
                </div>
                <span className="text-sm font-medium text-yellow-400">{fmtCurrency(info.value)}</span>
              </div>
            ))}
            {Object.keys(byCategory).length === 0 && <p className="text-gray-400 text-sm">Aucune donnée.</p>}
          </div>
        </div>

        {/* Produits en alerte */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Alertes stock</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.filter(p => p.stock <= p.minThreshold).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="text-sm text-white">{p.name}</span>
                <div className="text-right">
                  <span className={`text-xs font-medium ${p.stock === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                    {p.stock === 0 ? '⛔ Rupture' : `⚠ ${p.stock} restants`}
                  </span>
                </div>
              </div>
            ))}
            {lowStock === 0 && <p className="text-emerald-400 text-sm text-center py-4">✓ Tous les stocks sont OK</p>}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Inventaire complet</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {['Produit', 'Catégorie', 'Prix vente', 'Stock', 'Seuil min', 'Valeur', 'État'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {data.map(p => (
                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{p.category}</td>
                  <td className="px-4 py-3 text-sm text-white">{fmtCurrency(p.price)}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{fmt(p.stock)}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{fmt(p.minThreshold)}</td>
                  <td className="px-4 py-3 text-sm font-medium text-yellow-400">{fmtCurrency(p.price * p.stock)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      p.stock === 0 ? 'bg-red-500/20 text-red-400' :
                      p.stock <= p.minThreshold ? 'bg-amber-500/20 text-amber-400' :
                      'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {p.stock === 0 ? 'Rupture' : p.stock <= p.minThreshold ? 'Stock faible' : 'OK'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState message="Aucun produit trouvé." />}
        </div>
      </div>
    </div>
  );
};

// ─── Section Employés ─────────────────────────────────────────────────────────

const EmployesSection: React.FC<{ data: Employee[]; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const totalSalary = data.reduce((sum, e) => sum + (e.salary || 0), 0);
  const byDept = data.reduce((acc: Record<string, number>, e) => {
    acc[e.department || 'Non défini'] = (acc[e.department || 'Non défini'] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total employés" value={fmt(data.length)} color="from-emerald-500 to-teal-500" />
        <StatCard label="Masse salariale" value={fmtCurrency(totalSalary)} color="from-blue-500 to-indigo-500" />
        <StatCard label="Départements" value={fmt(Object.keys(byDept).length)} color="from-purple-500 to-pink-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Par département */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Effectifs par département</h3>
          <div className="space-y-3">
            {Object.entries(byDept).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
              const maxCount = Math.max(...Object.values(byDept), 1);
              return (
                <div key={dept}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300">{dept}</span>
                    <span className="text-white font-medium">{count} employé{count > 1 ? 's' : ''}</span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top salaires */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Salaires (Top 5)</h3>
          <div className="space-y-2">
            {[...data].sort((a, b) => (b.salary || 0) - (a.salary || 0)).slice(0, 5).map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">{e.firstName} {e.lastName}</p>
                  <p className="text-xs text-gray-400">{e.position || e.department || '—'}</p>
                </div>
                <span className="text-sm font-medium text-emerald-400">{fmtCurrency(e.salary || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Liste des employés</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {['Nom', 'Poste', 'Département', 'Salaire', 'Statut'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {data.map(e => (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{e.firstName} {e.lastName}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{e.position || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">{e.department || '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-white">{fmtCurrency(e.salary || 0)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      e.status === 'Actif' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{e.status || 'N/A'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState message="Aucun employé trouvé." />}
        </div>
      </div>
    </div>
  );
};

// ─── Section Finances ─────────────────────────────────────────────────────────

const FinancesSection: React.FC<{ data: FinanceTransaction[]; loading: boolean }> = ({ data, loading }) => {
  if (loading) return <LoadingSpinner />;

  const totalRecettes = data.filter(t => t.transactionType === 'Recette').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalDepenses = data.filter(t => t.transactionType === 'Dépense').reduce((sum, t) => sum + (t.amount || 0), 0);
  const solde = totalRecettes - totalDepenses;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Total recettes" value={fmtCurrency(totalRecettes)} color="from-emerald-500 to-teal-500" />
        <StatCard label="Total dépenses" value={fmtCurrency(totalDepenses)} color="from-rose-500 to-red-500" />
        <StatCard
          label="Solde net"
          value={fmtCurrency(Math.abs(solde))}
          sub={solde >= 0 ? '▲ Positif' : '▼ Négatif'}
          color={solde >= 0 ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-red-500'}
        />
      </div>

      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 border border-gray-700/50 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-700/50">
          <h3 className="text-lg font-semibold text-white">Transactions récentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                {['Type', 'Description', 'Catégorie', 'Montant', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {data.slice(0, 20).map(t => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      t.transactionType === 'Recette' ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>{t.transactionType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">{t.description || '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-400">{t.category || '—'}</td>
                  <td className={`px-4 py-3 text-sm font-medium ${
                    t.transactionType === 'Recette' ? 'text-emerald-400' : 'text-red-400'
                  }`}>{t.transactionType === 'Recette' ? '+' : '-'}{fmtCurrency(t.amount || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {t.transactionDate ? new Date(t.transactionDate).toLocaleDateString('fr-FR') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && <EmptyState message="Aucune transaction trouvée." />}
        </div>
      </div>
    </div>
  );
};

// ─── Composants utilitaires ───────────────────────────────────────────────────

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
    <p className="text-gray-400 text-sm">Chargement des données…</p>
  </div>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    <p className="text-sm">{message}</p>
  </div>
);

// ─── Export CSV ───────────────────────────────────────────────────────────────

const exportToCSV = (data: any[], filename: string) => {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.click();
  URL.revokeObjectURL(link.href);
};

// ─── Composant principal ──────────────────────────────────────────────────────

const Reports: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ReportSection>('overview');
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [barProducts, setBarProducts] = useState<BarProduct[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [finances, setFinances] = useState<FinanceTransaction[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<ReportSection, boolean>>({
    overview: false, hebergement: false, restaurant: false, bar: false, employes: false, finances: false,
  });
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const setLoading = (section: ReportSection, value: boolean) =>
    setLoadingMap(prev => ({ ...prev, [section]: value }));

  const loadDashboard = async () => {
    setLoading('overview', true);
    try {
      const res = await api.get('/dashboard');
      const d = res.data;
      setDashboard({
        occupancyRate: d.occupancyRate ?? 0,
        todayRevenue: Number(d.todayRevenue ?? 0),
        pendingCheckins: d.pendingCheckins ?? 0,
        roomsCleaning: d.roomsCleaning ?? 0,
        totalRooms: d.totalRooms ?? 0,
        occupiedRooms: d.occupiedRooms ?? 0,
        activeClients: d.activeClients ?? 0,
        activeReservations: d.activeReservations ?? 0,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading('overview', false);
    }
  };

  const loadReservations = async () => {
    setLoading('hebergement', true);
    try {
      const res = await api.get('/reservations');
      const data = Array.isArray(res.data) ? res.data : res.data?.content ?? [];
      setReservations(data.map((r: any) => ({
        id: r.id ?? r.codeOccupation,
        guestName: r.guestName ?? r.nomClient ?? `${r.prenom ?? ''} ${r.nom ?? ''}`.trim(),
        roomNumber: r.roomNumber ?? r.numeroChambre ?? String(r.codeChambre ?? ''),
        checkIn: r.checkIn ?? r.dateDebut,
        checkOut: r.checkOut ?? r.dateFin,
        totalAmount: Number(r.totalAmount ?? r.net ?? r.montant ?? 0),
        status: r.status ?? r.statusLabel ?? 'N/A',
      })));
    } catch (err) {
      console.error('Reservations error:', err);
    } finally {
      setLoading('hebergement', false);
    }
  };

  const loadRestaurantOrders = async () => {
    setLoading('restaurant', true);
    try {
      const res = await api.get('/restaurant/orders');
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data.map((o: any) => ({
        id: o.id,
        tableNumber: o.tableNumber,
        status: o.status,
        totalAmount: Number(o.totalAmount ?? 0),
        createdAt: o.createdAt,
      })));
    } catch (err) {
      console.error('Orders error:', err);
    } finally {
      setLoading('restaurant', false);
    }
  };

  const loadBarProducts = async () => {
    setLoading('bar', true);
    try {
      const res = await api.get('/bar/products');
      const data = Array.isArray(res.data) ? res.data : [];
      setBarProducts(data.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? 0),
        minThreshold: Number(p.minThreshold ?? 0),
        available: p.available ?? true,
      })));
    } catch (err) {
      console.error('Bar products error:', err);
    } finally {
      setLoading('bar', false);
    }
  };

  const loadEmployees = async () => {
    setLoading('employes', true);
    try {
      const res = await api.get('/employees');
      const data = Array.isArray(res.data) ? res.data : [];
      setEmployees(data.map((e: any) => ({
        id: e.id,
        firstName: e.firstName ?? e.prenom ?? '',
        lastName: e.lastName ?? e.nom ?? '',
        position: e.position ?? e.poste ?? '',
        department: e.department ?? e.departement ?? '',
        salary: Number(e.salary ?? e.salaire ?? 0),
        status: e.status ?? 'Actif',
      })));
    } catch (err) {
      console.error('Employees error:', err);
    } finally {
      setLoading('employes', false);
    }
  };

  const loadFinances = async () => {
    setLoading('finances', true);
    try {
      const res = await api.get('/finances/transactions');
      const data = Array.isArray(res.data) ? res.data : [];
      setFinances(data.map((t: any) => ({
        id: t.id,
        transactionType: t.transactionType ?? t.type ?? 'N/A',
        description: t.description ?? t.libelle ?? '',
        amount: Number(t.amount ?? t.montant ?? t.amountValue ?? 0),
        transactionDate: t.transactionDate ?? t.date ?? '',
        category: t.category ?? t.categorie ?? '',
      })));
    } catch (err) {
      console.error('Finances error:', err);
    } finally {
      setLoading('finances', false);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadDashboard();
    loadReservations();
    loadRestaurantOrders();
    loadBarProducts();
    loadEmployees();
    loadFinances();
  }, []);

  const handleRefresh = () => {
    loadDashboard();
    loadReservations();
    loadRestaurantOrders();
    loadBarProducts();
    loadEmployees();
    loadFinances();
    setLastRefresh(new Date());
  };

  const handleExport = () => {
    switch (activeSection) {
      case 'hebergement': exportToCSV(reservations, 'reservations'); break;
      case 'restaurant': exportToCSV(orders, 'commandes_restaurant'); break;
      case 'bar': exportToCSV(barProducts, 'stock_bar'); break;
      case 'employes': exportToCSV(employees, 'employes'); break;
      case 'finances': exportToCSV(finances, 'transactions_finances'); break;
      default:
        if (dashboard) exportToCSV([dashboard], 'rapport_global');
    }
  };

  const isLoading = loadingMap[activeSection];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-full mx-auto space-y-8">

        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Rapports & Analyses
            </h1>
            <p className="text-gray-400 mt-1 text-sm">
              Dernière mise à jour : {lastRefresh.toLocaleTimeString('fr-FR')}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
            >
              <IconRefresh /> Actualiser
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-lg hover:shadow-blue-500/25 rounded-xl text-sm font-medium text-white transition-all"
            >
              <IconDownload /> Exporter CSV
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200 ${
                activeSection === s.key
                  ? `bg-gradient-to-br ${s.color} border-transparent text-white shadow-lg`
                  : 'bg-gray-800/60 border-gray-700/50 text-gray-400 hover:text-white hover:border-gray-600/70'
              }`}
            >
              <div className={activeSection === s.key ? 'text-white' : ''}>{s.icon}</div>
              <span className="text-xs font-medium text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            {activeSection === 'overview' && <OverviewSection data={dashboard} loading={isLoading} />}
            {activeSection === 'hebergement' && <HebergementSection data={reservations} loading={isLoading} />}
            {activeSection === 'restaurant' && <RestaurantSection data={orders} loading={isLoading} />}
            {activeSection === 'bar' && <BarSection data={barProducts} loading={isLoading} />}
            {activeSection === 'employes' && <EmployesSection data={employees} loading={isLoading} />}
            {activeSection === 'finances' && <FinancesSection data={finances} loading={isLoading} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
