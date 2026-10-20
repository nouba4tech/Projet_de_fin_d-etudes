import React from 'react';

/** Small building blocks shared by the pages of the newer microservices (invoices, promotions, reviews...). */

export type Flash = { tone: 'success' | 'error' | 'info'; text: string } | null;

export const apiErrorMessage = (error: unknown, fallback = 'Une erreur est survenue.'): string => {
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      response?: { data?: { message?: string; errors?: Record<string, string> } | string };
      message?: string;
    };
    const data = e.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data === 'object' && data !== null) {
      if (data.errors && Object.keys(data.errors).length > 0) return Object.values(data.errors)[0];
      if (typeof data.message === 'string' && data.message.trim()) return data.message;
    }
    if (typeof e.message === 'string' && e.message.trim()) return e.message;
  }
  return fallback;
};

export const formatMoney = (value: number | string | null | undefined): string =>
  `${Math.round(Number(value ?? 0)).toLocaleString('fr-FR')} FCFA`;

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('fr-FR');
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const PageHeader: React.FC<{
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}> = ({ eyebrow, title, description, actions }) => (
  <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#0a1220] via-[#0d1627] to-[#12213a] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/95">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-white/70">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  </section>
);

export const StatCard: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6">
    <p className="text-xs uppercase tracking-[0.28em] text-white/50">{label}</p>
    <p className="mt-3 text-3xl font-semibold text-white/95">{value}</p>
    {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
  </div>
);

export const Panel: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <section className={`rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)] ${className}`}>
    {children}
  </section>
);

export const FlashMessage: React.FC<{ flash: Flash; onClose?: () => void }> = ({ flash, onClose }) => {
  if (!flash) return null;
  const tones = {
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-200'
  } as const;
  return (
    <div className={`flex items-start justify-between gap-4 rounded-2xl border px-5 py-3 text-sm ${tones[flash.tone]}`}>
      <span>{flash.text}</span>
      {onClose ? (
        <button type="button" onClick={onClose} className="text-xs uppercase tracking-wider opacity-70 hover:opacity-100">
          Fermer
        </button>
      ) : null}
    </div>
  );
};

export const Badge: React.FC<{ tone: 'green' | 'amber' | 'sky' | 'rose' | 'slate' | 'violet'; children: React.ReactNode }> = ({ tone, children }) => {
  const tones = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    sky: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
    slate: 'bg-slate-500/15 text-slate-300 border-slate-500/20',
    violet: 'bg-violet-500/15 text-violet-300 border-violet-500/20'
  } as const;
  return <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className={`max-h-[90vh] w-full overflow-y-auto rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] ${wide ? 'max-w-4xl' : 'max-w-xl'}`}>
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

export const inputClass =
  'w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-sky-500/60 focus:outline-none focus:ring-2 focus:ring-sky-500/20';
export const labelClass = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/55';
export const primaryButton =
  'rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50';
export const ghostButton =
  'rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50';
export const smallButton =
  'rounded-lg border border-slate-700/60 bg-[#10182b] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40';

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className={labelClass}>{label}</span>
    {children}
  </label>
);

export const Table: React.FC<{ headers: string[]; children: React.ReactNode; empty?: string; isEmpty?: boolean }> = ({ headers, children, empty, isEmpty }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[720px] text-left text-sm text-white/85">
      <thead>
        <tr className="border-b border-slate-700/60 text-xs uppercase tracking-wider text-white/50">
          {headers.map((h) => (
            <th key={h} className="px-3 py-3 font-semibold">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/70">{children}</tbody>
    </table>
    {isEmpty ? <p className="py-10 text-center text-sm text-white/45">{empty ?? 'Aucun element.'}</p> : null}
  </div>
);
