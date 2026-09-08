import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { DashboardStats, Room, RoomStatus } from '../types';
import api from '../services/api';

const DashboardRevenueChart = lazy(() => import('./DashboardRevenueChart'));

type Tone = 'blue' | 'emerald' | 'violet' | 'amber' | 'rose';

const TONE_STYLES: Record<Tone, { icon: string; badge: string; dot: string }> = {
  blue: {
    icon: 'bg-sky-500/10 text-sky-300 ring-1 ring-sky-400/20',
    badge: 'border-sky-400/20 bg-sky-500/10 text-sky-200',
    dot: 'bg-sky-400'
  },
  emerald: {
    icon: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/20',
    badge: 'border-emerald-400/20 bg-emerald-500/10 text-emerald-200',
    dot: 'bg-emerald-400'
  },
  violet: {
    icon: 'bg-violet-500/10 text-violet-300 ring-1 ring-violet-400/20',
    badge: 'border-violet-400/20 bg-violet-500/10 text-violet-200',
    dot: 'bg-violet-400'
  },
  amber: {
    icon: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20',
    badge: 'border-amber-400/20 bg-amber-500/10 text-amber-200',
    dot: 'bg-amber-400'
  },
  rose: {
    icon: 'bg-rose-500/10 text-rose-300 ring-1 ring-rose-400/20',
    badge: 'border-rose-400/20 bg-rose-500/10 text-rose-200',
    dot: 'bg-rose-400'
  }
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  trend: string;
  tone: Tone;
  icon: React.ReactNode;
  note?: string;
}> = ({ label, value, trend, tone, icon, note }) => {
  const styles = TONE_STYLES[tone];

  return (
    <article className="rounded-[18px] border border-white/5 bg-[#0a1220] p-4 transition-colors duration-200 hover:bg-[#0d1729]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.icon}`}>
            {icon}
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
            {note ? <p className="mt-1 text-[10px] text-slate-500">{note}</p> : null}
          </div>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em] ${styles.badge}`}>{trend}</span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
    </article>
  );
};

const SummaryTile: React.FC<{
  label: string;
  value: number;
  tone: Tone;
}> = ({ label, value, tone }) => {
  const styles = TONE_STYLES[tone];

  return (
    <div className="rounded-[16px] border border-white/5 bg-[#101b2d] p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-300">{label}</p>
        <span className={`h-2.5 w-2.5 rounded-full ${styles.dot}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
};

const formatTrend = (delta: number, unit: '%' | 'pts'): string => {
  const rounded = Math.round(delta * 10) / 10;
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded.toLocaleString('fr-FR')}${unit === '%' ? '%' : ' pts'}`;
};

const Dashboard: React.FC<{ stats: DashboardStats; rooms: Room[] }> = ({ stats, rooms }) => {
  const [trends, setTrends] = useState<{ occupancy: string; revenue: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/revenue-chart')
      .then((res) => {
        if (cancelled) return;
        const points = Array.isArray(res.data?.points) ? res.data.points : [];
        if (points.length < 2) return;

        const today = points[points.length - 1];
        const yesterday = points[points.length - 2];
        const occupancyDelta = Number(today.occupancyRate ?? 0) - Number(yesterday.occupancyRate ?? 0);
        const yesterdayRevenue = Number(yesterday.revenue ?? 0);
        const todayRevenue = Number(today.revenue ?? 0);
        const revenueTrend = yesterdayRevenue > 0
          ? formatTrend(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100, '%')
          : (todayRevenue > 0 ? 'Nouveau' : '—');

        setTrends({
          occupancy: formatTrend(occupancyDelta, 'pts'),
          revenue: revenueTrend
        });
      })
      .catch(() => {
        if (!cancelled) setTrends(null);
      });
    return () => { cancelled = true; };
  }, []);

  const roomSummary = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter(room => room.status === RoomStatus.AVAILABLE).length;
    const occupied = rooms.filter(room => room.status === RoomStatus.OCCUPIED).length;
    const cleaning = rooms.filter(room => room.status === RoomStatus.CLEANING).length;
    const maintenance = rooms.filter(room => room.status === RoomStatus.MAINTENANCE).length;

    return {
      total,
      available,
      occupied,
      cleaning,
      maintenance
    };
  }, [rooms]);

  const priorities = useMemo(() => ([
    {
      title: 'Check-ins à confirmer',
      detail: `${stats.pendingCheckins} dossier${stats.pendingCheckins > 1 ? 's' : ''} restant${stats.pendingCheckins > 1 ? 's' : ''} aujourd'hui`,
      tone: 'violet' as Tone
    },
    {
      title: 'Nettoyage à suivre',
      detail: roomSummary.cleaning > 0
        ? `${roomSummary.cleaning} chambre${roomSummary.cleaning > 1 ? 's' : ''} en préparation`
        : 'Aucune chambre en nettoyage à cet instant',
      tone: 'blue' as Tone
    },
    {
      title: 'Maintenance',
      detail: roomSummary.maintenance > 0
        ? `${roomSummary.maintenance} chambre${roomSummary.maintenance > 1 ? 's' : ''} à vérifier`
        : 'Aucune alerte de maintenance',
      tone: 'amber' as Tone
    }
  ]), [roomSummary.cleaning, roomSummary.maintenance, stats.pendingCheckins]);

  return (
    <div className="-m-4 md:-m-10 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] bg-[#050b17] px-4 py-5 md:px-8 md:py-6">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <header className="flex flex-col gap-3 border-b border-white/5 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.26em] text-slate-400">Accueil</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-white">Tableau de bord</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
            <span className="rounded-full border border-white/5 bg-[#0d1729] px-2.5 py-1.5 whitespace-nowrap">{roomSummary.total} chambres</span>
            <span className="rounded-full border border-white/5 bg-[#0d1729] px-2.5 py-1.5 whitespace-nowrap">{stats.pendingCheckins} restants</span>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Occupation"
            value={`${stats.occupancyRate}%`}
            trend={trends?.occupancy ?? '—'}
            tone="blue"
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/95" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            )}
          />

          <MetricCard
            label="Revenus du jour"
            value={`${stats.revenueToday.toLocaleString('fr-FR')} FCFA`}
            trend={trends?.revenue ?? '—'}
            tone="emerald"
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/95" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          />

          <MetricCard
            label="Check-ins"
            value={stats.pendingCheckins}
            trend="En attente"
            tone="violet"
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/95" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          />

          <MetricCard
            label="Service"
            value={stats.roomsCleaning}
            trend="À suivre"
            tone="amber"
            icon={(
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/95" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.8fr)]">
          <div className="rounded-[18px] border border-white/5 bg-[#0b1321] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">Revenus</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Analyse des revenus</h2>
              </div>
              <span className="rounded-full border border-white/5 bg-[#101b2d] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-slate-300">
                7 jours
              </span>
            </div>

            <div className="mt-4">
              <Suspense
                fallback={(
                  <div className="flex h-72 items-center justify-center">
                    <div className="relative">
                      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-sky-400" />
                    </div>
                  </div>
                )}
              >
                <DashboardRevenueChart />
              </Suspense>
            </div>
          </div>

          <aside className="space-y-3">
            <div className="rounded-[18px] border border-white/5 bg-[#0b1321] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">État des chambres</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <SummaryTile label="Libres" value={roomSummary.available} tone="emerald" />
                <SummaryTile label="Occupées" value={roomSummary.occupied} tone="rose" />
                <SummaryTile label="Nettoyage" value={roomSummary.cleaning} tone="blue" />
                <SummaryTile label="Maintenance" value={roomSummary.maintenance} tone="amber" />
              </div>
            </div>

            <div className="rounded-[18px] border border-white/5 bg-[#0b1321] p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-slate-400">À surveiller</p>
              <div className="mt-3 space-y-2.5">
                {priorities.map(priority => {
                  const styles = TONE_STYLES[priority.tone];

                  return (
                    <div key={priority.title} className="flex items-start gap-3 rounded-[14px] border border-white/5 bg-[#101b2d] p-2.5">
                      <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${styles.dot}`} />
                      <div>
                        <p className="text-sm font-medium text-white">{priority.title}</p>
                        <p className="mt-1 text-[11px] leading-5 text-slate-300">{priority.detail}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
