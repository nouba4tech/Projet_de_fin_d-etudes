import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import {
  Badge, Field, Flash, FlashMessage, Modal, PageHeader, Panel, StatCard,
  apiErrorMessage, formatDateTime, ghostButton, inputClass, primaryButton, smallButton
} from './ui';

type Review = {
  id: number;
  clientId: number;
  clientName: string | null;
  reservationId: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE';
  flagged: boolean;
  moderationComment: string | null;
  moderatedBy: string | null;
  moderatedAt: string | null;
  createdAt: string;
};

type Summary = { count: number; average: number; distribution: Record<string, number> };

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: 'EN_ATTENTE', label: 'A moderer' },
  { value: 'APPROUVE', label: 'Approuves' },
  { value: 'REJETE', label: 'Rejetes' },
  { value: '', label: 'Tous' }
];

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span aria-label={`${value} sur 5`} className="text-lg tracking-widest text-amber-300">
    {'★'.repeat(value)}<span className="text-white/20">{'★'.repeat(5 - value)}</span>
  </span>
);

const Reviews: React.FC = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState('EN_ATTENTE');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const [target, setTarget] = useState<{ review: Review; decision: 'APPROUVE' | 'REJETE' } | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, stats] = await Promise.all([
        api.get('/avis', { params: status ? { status } : {} }),
        api.get('/avis/public/summary')
      ]);
      setReviews(list.data ?? []);
      setSummary(stats.data ?? null);
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger les avis.') });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { void load(); }, [load]);

  const moderate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target) return;
    setSaving(true);
    try {
      await api.put(`/avis/${target.review.id}/moderation`, { decision: target.decision, comment: comment.trim() || null });
      setFlash({ tone: 'success', text: target.decision === 'APPROUVE' ? 'Avis approuve : il est maintenant public.' : 'Avis rejete.' });
      setTarget(null);
      setComment('');
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Moderation impossible.') });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (review: Review) => {
    if (!window.confirm('Supprimer definitivement cet avis ?')) return;
    try {
      await api.delete(`/avis/${review.id}`);
      setFlash({ tone: 'success', text: 'Avis supprime.' });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Suppression impossible.') });
    }
  };

  const total = summary?.count ?? 0;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Satisfaction"
        title="Avis des clients"
        description="Les avis collectes attendent une moderation. Seuls les avis approuves sont publics, avec le prenom du client uniquement."
        actions={<button onClick={() => void load()} className={ghostButton}>Rafraichir</button>}
      />

      <FlashMessage flash={flash} onClose={() => setFlash(null)} />

      <section className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Note moyenne" value={total ? `${summary?.average.toFixed(1)} / 5` : '-'} hint={`${total} avis publies`} />
        <Panel className="lg:col-span-2">
          <p className="mb-3 text-xs uppercase tracking-[0.28em] text-white/50">Repartition des avis publies</p>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const n = summary?.distribution?.[String(star)] ?? 0;
              return (
                <div key={star} className="flex items-center gap-3 text-sm text-white/75">
                  <span className="w-8">{star} ★</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-amber-300" style={{ width: total ? `${(n / total) * 100}%` : '0%' }} />
                  </div>
                  <span className="w-8 text-right">{n}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </section>

      <Panel>
        <div className="mb-5 flex flex-wrap gap-3">
          {STATUS_TABS.map((tab) => (
            <button key={tab.label} onClick={() => setStatus(tab.value)} className={`rounded-full px-4 py-2 text-sm transition ${status === tab.value ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 bg-[#10182b] text-white/80'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className={`rounded-2xl border p-5 ${review.flagged ? 'border-rose-500/40 bg-rose-500/5' : 'border-slate-700/60 bg-[#10182b]'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={review.rating} />
                    <h4 className="font-semibold text-white">{review.title || 'Sans titre'}</h4>
                    {review.flagged ? <Badge tone="rose">Signale automatiquement</Badge> : null}
                    <Badge tone={review.status === 'APPROUVE' ? 'green' : review.status === 'REJETE' ? 'rose' : 'amber'}>
                      {review.status === 'EN_ATTENTE' ? 'A moderer' : review.status === 'APPROUVE' ? 'Approuve' : 'Rejete'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    {review.clientName ?? `Client #${review.clientId}`}
                    {review.reservationId ? ` - reservation #${review.reservationId}` : ''} - {formatDateTime(review.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {review.status === 'EN_ATTENTE' ? (
                    <>
                      <button className={smallButton} onClick={() => { setTarget({ review, decision: 'APPROUVE' }); setComment(''); }}>Approuver</button>
                      <button className={smallButton} onClick={() => { setTarget({ review, decision: 'REJETE' }); setComment(''); }}>Rejeter</button>
                    </>
                  ) : null}
                  <button className={smallButton} onClick={() => void remove(review)}>Supprimer</button>
                </div>
              </div>
              {review.comment ? <p className="mt-3 text-sm leading-6 text-white/80">{review.comment}</p> : null}
              {review.moderatedBy ? (
                <p className="mt-3 text-xs text-white/40">
                  Modere par {review.moderatedBy} le {formatDateTime(review.moderatedAt)}{review.moderationComment ? ` - ${review.moderationComment}` : ''}
                </p>
              ) : null}
            </article>
          ))}
          {!loading && reviews.length === 0 ? <p className="py-10 text-center text-sm text-white/45">Aucun avis dans cette categorie.</p> : null}
          {loading ? <p className="py-6 text-center text-sm text-white/45">Chargement...</p> : null}
        </div>
      </Panel>

      {target ? (
        <Modal title={target.decision === 'APPROUVE' ? 'Approuver cet avis' : 'Rejeter cet avis'} onClose={() => setTarget(null)}>
          <form onSubmit={moderate} className="space-y-4">
            <p className="text-sm text-white/70">
              <Stars value={target.review.rating} /> {target.review.title}
            </p>
            <Field label="Commentaire de moderation (optionnel)">
              <textarea rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} className={inputClass} />
            </Field>
            <div className="flex justify-end gap-3">
              <button type="button" className={ghostButton} onClick={() => setTarget(null)}>Annuler</button>
              <button type="submit" className={primaryButton} disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
};

export default Reviews;
