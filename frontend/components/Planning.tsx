import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Badge, Field, Flash, FlashMessage, Modal, PageHeader, Panel, StatCard,
  apiErrorMessage, ghostButton, inputClass, primaryButton, smallButton
} from './ui';

type Employee = { id: number; firstName: string; lastName: string; position: string | null; department: string | null };

type Shift = {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  post: string;
  notes: string | null;
};

type ShiftForm = { employeeId: string; date: string; startTime: string; endTime: string; post: string; notes: string };

const iso = (d: Date): string => {
  const copy = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return copy.toISOString().slice(0, 10);
};

const mondayOf = (d: Date): Date => {
  const copy = new Date(d);
  const day = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const hhmm = (t: string): string => t.slice(0, 5);

const Planning: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [weekStart, setWeekStart] = useState<Date>(mondayOf(new Date()));
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [form, setForm] = useState<ShiftForm>({ employeeId: '', date: iso(new Date()), startTime: '08:00', endTime: '16:00', post: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { from: iso(days[0]), to: iso(days[6]) };
      if (employeeFilter) params.employeeId = employeeFilter;
      const response = await api.get('/planning', { params });
      setShifts(response.data ?? []);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger le planning.') });
    } finally {
      setLoading(false);
    }
  }, [days, employeeFilter]);

  useEffect(() => {
    api.get('/employees')
      .then((response) => setEmployees(response.data ?? []))
      .catch((error) => setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger les employes.') }));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const byDay = useMemo(() => {
    const map: Record<string, Shift[]> = {};
    shifts.forEach((s) => { (map[s.date] ??= []).push(s); });
    return map;
  }, [shifts]);

  const totalHours = shifts.reduce((sum, s) => sum + s.hours, 0);

  const openCreate = (date?: string) => {
    setEditing(null);
    setForm({ employeeId: employeeFilter || '', date: date ?? iso(days[0]), startTime: '08:00', endTime: '16:00', post: '', notes: '' });
    setFormOpen(true);
  };

  const openEdit = (shift: Shift) => {
    setEditing(shift);
    setForm({ employeeId: String(shift.employeeId), date: shift.date, startTime: hhmm(shift.startTime), endTime: hhmm(shift.endTime), post: shift.post, notes: shift.notes ?? '' });
    setFormOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      date: form.date,
      startTime: `${form.startTime}:00`,
      endTime: `${form.endTime}:00`,
      post: form.post.trim(),
      notes: form.notes.trim() || null
    };
    try {
      if (editing) {
        await api.put(`/planning/${editing.id}`, payload);
      } else {
        await api.post(`/employees/${form.employeeId}/planning`, payload);
      }
      setFormOpen(false);
      setFlash({ tone: 'success', text: editing ? 'Creneau mis a jour.' : 'Creneau ajoute.' });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, "Impossible d'enregistrer le creneau.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (shift: Shift) => {
    if (!window.confirm(`Supprimer le creneau de ${shift.employeeName} le ${shift.date} ?`)) return;
    try {
      await api.delete(`/planning/${shift.id}`);
      setFlash({ tone: 'success', text: 'Creneau supprime.' });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Suppression impossible.') });
    }
  };

  const shiftWeek = (delta: number) => {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
  };

  const todayIso = iso(new Date());

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Ressources humaines"
        title="Planning du personnel"
        description="Creneaux de travail par employe et par poste. Un employe ne peut pas avoir deux creneaux qui se chevauchent."
        actions={<>
          <button onClick={() => void load()} className={ghostButton}>Rafraichir</button>
          <button onClick={() => openCreate()} className={primaryButton}>Nouveau creneau</button>
        </>}
      />

      <FlashMessage flash={flash} onClose={() => setFlash(null)} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Creneaux (semaine)" value={shifts.length} />
        <StatCard label="Heures planifiees" value={`${totalHours.toFixed(1)} h`} />
        <StatCard label="Employes concernes" value={new Set(shifts.map((s) => s.employeeId)).size} />
      </section>

      <Panel>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button className={smallButton} onClick={() => shiftWeek(-1)}>&larr; Semaine precedente</button>
          <button className={smallButton} onClick={() => setWeekStart(mondayOf(new Date()))}>Cette semaine</button>
          <button className={smallButton} onClick={() => shiftWeek(1)}>Semaine suivante &rarr;</button>
          <span className="text-sm text-white/60">
            {days[0].toLocaleDateString('fr-FR')} - {days[6].toLocaleDateString('fr-FR')}
          </span>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className={`${inputClass} ml-auto max-w-xs`}>
            <option value="">Tous les employes</option>
            {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {days.map((day) => {
            const key = iso(day);
            const items = (byDay[key] ?? []).slice().sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={key} className={`rounded-2xl border p-4 ${key === todayIso ? 'border-sky-500/50 bg-sky-500/5' : 'border-slate-700/60 bg-[#10182b]'}`}>
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-sm font-semibold capitalize text-white">{day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}</h4>
                  <button className="text-xs text-sky-300 hover:text-sky-200" onClick={() => openCreate(key)}>+ ajouter</button>
                </div>
                <ul className="space-y-2">
                  {items.map((s) => (
                    <li key={s.id} className="rounded-xl border border-slate-700/60 bg-[#0b1020] p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{hhmm(s.startTime)} - {hhmm(s.endTime)}</span>
                        <Badge tone="sky">{s.post}</Badge>
                      </div>
                      <p className="mt-1 text-white/80">{s.employeeName}</p>
                      {s.notes ? <p className="text-xs text-white/45">{s.notes}</p> : null}
                      <div className="mt-2 flex gap-2">
                        <button className={smallButton} onClick={() => openEdit(s)}>Modifier</button>
                        <button className={smallButton} onClick={() => void remove(s)}>Supprimer</button>
                      </div>
                    </li>
                  ))}
                  {items.length === 0 ? <li className="text-xs text-white/35">Aucun creneau</li> : null}
                </ul>
              </div>
            );
          })}
        </div>
        {loading ? <p className="py-4 text-center text-sm text-white/45">Chargement...</p> : null}
      </Panel>

      {formOpen ? (
        <Modal title={editing ? 'Modifier le creneau' : 'Nouveau creneau'} onClose={() => setFormOpen(false)}>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label="Employe">
                <select required disabled={!!editing} value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} className={inputClass}>
                  <option value="">Choisir...</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}{e.position ? ` - ${e.position}` : ''}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Date"><input required type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} className={inputClass} /></Field>
            <Field label="Poste"><input required value={form.post} onChange={(e) => setForm((p) => ({ ...p, post: e.target.value }))} placeholder="Reception, Bar, Housekeeping..." className={inputClass} /></Field>
            <Field label="Debut"><input required type="time" value={form.startTime} onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))} className={inputClass} /></Field>
            <Field label="Fin"><input required type="time" value={form.endTime} onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))} className={inputClass} /></Field>
            <div className="md:col-span-2">
              <Field label="Notes"><input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputClass} /></Field>
            </div>
            <p className="text-xs text-white/40 md:col-span-2">Un service de nuit se saisit en deux creneaux (jusqu'a 23:59, puis a partir de 00:00).</p>
            <div className="flex justify-end gap-3 md:col-span-2">
              <button type="button" className={ghostButton} onClick={() => setFormOpen(false)}>Annuler</button>
              <button type="submit" className={primaryButton} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Planning;
