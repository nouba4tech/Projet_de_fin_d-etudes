import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import {
  Badge, Field, Flash, FlashMessage, Modal, PageHeader, Panel, StatCard, Table,
  apiErrorMessage, formatDate, formatMoney, ghostButton, inputClass, primaryButton, smallButton
} from './ui';

type Promotion = {
  id: number;
  code: string;
  label: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
  currentlyValid: boolean;
};

type PromotionForm = {
  code: string;
  label: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string;
  minAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  active: boolean;
};

type ValidationResult = { valid: boolean; discount: number; finalAmount: number; reason: string | null };

const today = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

const emptyForm = (): PromotionForm => ({
  code: '', label: '', discountType: 'PERCENT', discountValue: '10', minAmount: '0',
  startDate: today(), endDate: today(30), usageLimit: '', active: true
});

const describeDiscount = (p: Promotion): string =>
  p.discountType === 'PERCENT' ? `-${p.discountValue} %` : `-${formatMoney(p.discountValue)}`;

const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);
  const [onlyValid, setOnlyValid] = useState(false);

  const [editing, setEditing] = useState<Promotion | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<PromotionForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const [testCode, setTestCode] = useState('');
  const [testAmount, setTestAmount] = useState('100000');
  const [testResult, setTestResult] = useState<ValidationResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/promotions');
      setPromotions(response.data ?? []);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger les promotions.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => promotions.filter((p) => !onlyValid || p.currentlyValid), [promotions, onlyValid]);
  const usable = promotions.filter((p) => p.currentlyValid).length;
  const totalUses = promotions.reduce((sum, p) => sum + p.usedCount, 0);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setFormOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      code: p.code, label: p.label, discountType: p.discountType, discountValue: String(p.discountValue),
      minAmount: String(p.minAmount ?? 0), startDate: p.startDate, endDate: p.endDate,
      usageLimit: p.usageLimit == null ? '' : String(p.usageLimit), active: p.active
    });
    setFormOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = {
      code: form.code.trim(),
      label: form.label.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minAmount: Number(form.minAmount || 0),
      startDate: form.startDate,
      endDate: form.endDate,
      usageLimit: form.usageLimit === '' ? null : Number(form.usageLimit),
      active: form.active
    };
    try {
      if (editing) {
        await api.put(`/promotions/${editing.id}`, payload);
      } else {
        await api.post('/promotions', payload);
      }
      setFormOpen(false);
      setFlash({ tone: 'success', text: editing ? 'Promotion mise a jour.' : 'Promotion creee.' });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, "Impossible d'enregistrer la promotion.") });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Promotion) => {
    if (!window.confirm(`Supprimer la promotion ${p.code} ?`)) return;
    try {
      await api.delete(`/promotions/${p.id}`);
      setFlash({ tone: 'success', text: `Promotion ${p.code} supprimee.` });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Suppression impossible.') });
    }
  };

  const runTest = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await api.post('/promotions/validate', { code: testCode.trim(), amount: Number(testAmount) });
      setTestResult(response.data);
    } catch (error) {
      setTestResult(null);
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Simulation impossible.') });
    }
  };

  const set = <K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Offres tarifaires"
        title="Promotions"
        description="Codes promotionnels appliques a la reservation (reduction en pourcentage ou en montant fixe, periode, limite d'utilisation)."
        actions={<>
          <button onClick={() => void load()} className={ghostButton}>Rafraichir</button>
          <button onClick={openCreate} className={primaryButton}>Nouvelle promotion</button>
        </>}
      />

      <FlashMessage flash={flash} onClose={() => setFlash(null)} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Promotions" value={promotions.length} />
        <StatCard label="Utilisables aujourd'hui" value={usable} />
        <StatCard label="Utilisations" value={totalUses} />
      </section>

      <Panel>
        <h3 className="mb-4 text-lg font-semibold text-white">Simuler un code</h3>
        <form onSubmit={runTest} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1"><Field label="Code"><input value={testCode} onChange={(e) => setTestCode(e.target.value)} className={inputClass} required placeholder="BIENVENUE10" /></Field></div>
          <div className="min-w-[180px] flex-1"><Field label="Montant (FCFA)"><input type="number" min={1} value={testAmount} onChange={(e) => setTestAmount(e.target.value)} className={inputClass} required /></Field></div>
          <button type="submit" className={primaryButton}>Calculer</button>
        </form>
        {testResult ? (
          <p className={`mt-4 text-sm ${testResult.valid ? 'text-emerald-300' : 'text-rose-300'}`}>
            {testResult.valid
              ? `Code valide : remise ${formatMoney(testResult.discount)}, montant final ${formatMoney(testResult.finalAmount)}.`
              : `Code refuse : ${testResult.reason}`}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-white/40">La simulation ne consomme aucune utilisation du code.</p>
      </Panel>

      <Panel>
        <div className="mb-5 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/75">
            <input type="checkbox" checked={onlyValid} onChange={(e) => setOnlyValid(e.target.checked)} />
            Seulement celles utilisables aujourd'hui
          </label>
        </div>
        <Table headers={['Code', 'Libelle', 'Remise', 'Minimum', 'Periode', 'Utilisations', 'Statut', 'Actions']} isEmpty={!loading && visible.length === 0} empty="Aucune promotion.">
          {visible.map((p) => (
            <tr key={p.id}>
              <td className="px-3 py-3 font-mono text-xs font-semibold">{p.code}</td>
              <td className="px-3 py-3">{p.label}</td>
              <td className="px-3 py-3">{describeDiscount(p)}</td>
              <td className="px-3 py-3">{p.minAmount > 0 ? formatMoney(p.minAmount) : '-'}</td>
              <td className="px-3 py-3 text-xs">{formatDate(p.startDate)} - {formatDate(p.endDate)}</td>
              <td className="px-3 py-3">{p.usedCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}</td>
              <td className="px-3 py-3">
                {p.currentlyValid ? <Badge tone="green">Utilisable</Badge>
                  : !p.active ? <Badge tone="slate">Desactivee</Badge>
                  : p.usageLimit != null && p.usedCount >= p.usageLimit ? <Badge tone="amber">Epuisee</Badge>
                  : new Date(p.endDate) < new Date(today()) ? <Badge tone="rose">Expiree</Badge>
                  : <Badge tone="sky">A venir</Badge>}
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button className={smallButton} onClick={() => openEdit(p)}>Modifier</button>
                  <button className={smallButton} onClick={() => void remove(p)}>Supprimer</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {loading ? <p className="py-6 text-center text-sm text-white/45">Chargement...</p> : null}
      </Panel>

      {formOpen ? (
        <Modal title={editing ? `Modifier ${editing.code}` : 'Nouvelle promotion'} onClose={() => setFormOpen(false)}>
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field label="Code"><input required pattern="[A-Za-z0-9_-]{3,40}" title="3 a 40 caracteres alphanumeriques" value={form.code} onChange={(e) => set('code', e.target.value)} className={inputClass} /></Field>
            <Field label="Libelle"><input required value={form.label} onChange={(e) => set('label', e.target.value)} className={inputClass} /></Field>
            <Field label="Type de remise">
              <select value={form.discountType} onChange={(e) => set('discountType', e.target.value as 'PERCENT' | 'FIXED')} className={inputClass}>
                <option value="PERCENT">Pourcentage</option>
                <option value="FIXED">Montant fixe (FCFA)</option>
              </select>
            </Field>
            <Field label={form.discountType === 'PERCENT' ? 'Valeur (%)' : 'Valeur (FCFA)'}>
              <input required type="number" min={0.01} max={form.discountType === 'PERCENT' ? 100 : undefined} step="0.01" value={form.discountValue} onChange={(e) => set('discountValue', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Montant minimum (FCFA)"><input type="number" min={0} value={form.minAmount} onChange={(e) => set('minAmount', e.target.value)} className={inputClass} /></Field>
            <Field label="Limite d'utilisation (vide = illimitee)"><input type="number" min={0} value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} className={inputClass} /></Field>
            <Field label="Debut"><input required type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} /></Field>
            <Field label="Fin"><input required type="date" min={form.startDate} value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className={inputClass} /></Field>
            <label className="flex items-center gap-2 text-sm text-white/75 md:col-span-2">
              <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} /> Promotion active
            </label>
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

export default Promotions;
