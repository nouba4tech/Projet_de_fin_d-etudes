import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';

interface ChartPoint {
  name: string;
  rev: number;
  occ: number;
}

const FALLBACK_DATA: ChartPoint[] = [
  { name: 'Lun', rev: 0, occ: 0 },
  { name: 'Mar', rev: 0, occ: 0 },
  { name: 'Mer', rev: 0, occ: 0 },
  { name: 'Jeu', rev: 0, occ: 0 },
  { name: 'Ven', rev: 0, occ: 0 },
  { name: 'Sam', rev: 0, occ: 0 },
  { name: 'Dim', rev: 0, occ: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  const rev = payload[0]?.value ?? 0;
  const occ = payload[1]?.value ?? 0;
  return (
    <div style={{
      backgroundColor: 'var(--frame-surface)',
      borderRadius: '14px',
      border: '1px solid var(--frame-border)',
      boxShadow: '0 18px 40px rgba(2, 6, 23, 0.25)',
      padding: '12px 16px',
      minWidth: 160,
    }}>
      <p style={{ color: 'var(--frame-text)', fontWeight: 600, marginBottom: 6 }}>{label}</p>
      <p style={{ color: 'var(--chart-accent-1)', fontSize: 13 }}>
        Revenus : <strong>{Number(rev).toLocaleString('fr-FR')} FCFA</strong>
      </p>
      <p style={{ color: 'var(--chart-accent-2)', fontSize: 13 }}>
        Occupation : <strong>{Number(occ).toFixed(1)}%</strong>
      </p>
    </div>
  );
};

const DashboardRevenueChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartPoint[]>(FALLBACK_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/revenue-chart')
      .then((res) => {
        if (cancelled) return;
        const points: ChartPoint[] = Array.isArray(res.data?.points)
          ? res.data.points.map((p: any) => ({
              name: p.dayLabel ?? '?',
              rev: Number(p.revenue ?? 0),
              occ: Number(p.occupancyRate ?? 0),
            }))
          : FALLBACK_DATA;
        setChartData(points.length >= 2 ? points : FALLBACK_DATA);
      })
      .catch(() => {
        if (!cancelled) setChartData(FALLBACK_DATA);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-sky-400" />
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#e2e8f0', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#e2e8f0', fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="rev" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
          <Area type="monotone" dataKey="occ" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorOcc)" strokeDasharray="5 3" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardRevenueChart;
