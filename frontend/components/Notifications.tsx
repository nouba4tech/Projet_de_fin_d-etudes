import React, { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import {
  Badge, Field, Flash, FlashMessage, Modal, PageHeader, Panel, StatCard, Table,
  apiErrorMessage, formatDateTime, ghostButton, inputClass, primaryButton, smallButton
} from './ui';

type NotificationDto = {
  id: number;
  channel: 'EMAIL' | 'SMS';
  recipient: string;
  templateCode: string | null;
  referenceKey: string | null;
  subject: string | null;
  body: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

type ReminderResult = { date: string; reservations: number; sent: number; alreadySent: number; failed: number };

const tomorrow = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
};

/** "name=Awa" per line -> { name: 'Awa' } */
const parseVariables = (text: string): Record<string, string> => {
  const result: Record<string, string> = {};
  text.split('\n').forEach((line) => {
    const index = line.indexOf('=');
    if (index > 0) result[line.slice(0, index).trim()] = line.slice(index + 1).trim();
  });
  return result;
};

const Notifications: React.FC = () => {
  const [items, setItems] = useState<NotificationDto[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState<Flash>(null);

  const [composeOpen, setComposeOpen] = useState(false);
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL');
  const [recipient, setRecipient] = useState('');
  const [mode, setMode] = useState<'template' | 'free'>('template');
  const [templateCode, setTemplateCode] = useState('');
  const [variables, setVariables] = useState('name=\nreservationId=\nroom=\ncheckIn=');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const [reminderDate, setReminderDate] = useState(tomorrow());
  const [reminderResult, setReminderResult] = useState<ReminderResult | null>(null);
  const [runningReminders, setRunningReminders] = useState(false);
  const [detail, setDetail] = useState<NotificationDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { limit: 200 };
      if (statusFilter) params.status = statusFilter;
      if (channelFilter) params.channel = channelFilter;
      const [list, tpl] = await Promise.all([api.get('/notifications', { params }), api.get('/notifications/templates')]);
      setItems(list.data ?? []);
      const codes: string[] = Array.isArray(tpl.data) ? tpl.data : [];
      setTemplates(codes);
      setTemplateCode((current) => current || codes[0] || '');
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Impossible de charger les notifications.') });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter]);

  useEffect(() => { void load(); }, [load]);

  const sent = items.filter((n) => n.status === 'SENT').length;
  const failed = items.filter((n) => n.status === 'FAILED').length;

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const payload = mode === 'template'
        ? { channel, recipient: recipient.trim(), templateCode, variables: parseVariables(variables) }
        : { channel, recipient: recipient.trim(), subject: channel === 'EMAIL' ? subject : null, body };
      const response = await api.post('/notifications', payload);
      setFlash({ tone: response.data?.status === 'FAILED' ? 'error' : 'success', text: response.data?.status === 'FAILED' ? `Envoi en echec : ${response.data.errorMessage}` : 'Notification envoyee.' });
      setComposeOpen(false);
      setRecipient('');
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, "Impossible d'envoyer la notification.") });
    } finally {
      setSending(false);
    }
  };

  const retry = async (item: NotificationDto) => {
    try {
      const response = await api.post(`/notifications/${item.id}/retry`);
      setFlash({ tone: response.data?.status === 'SENT' ? 'success' : 'error', text: response.data?.status === 'SENT' ? 'Notification renvoyee.' : `Nouvel echec : ${response.data?.errorMessage ?? ''}` });
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Renvoi impossible.') });
    }
  };

  const runReminders = async () => {
    setRunningReminders(true);
    setReminderResult(null);
    try {
      const response = await api.post('/notifications/reminders/run', null, { params: { date: reminderDate } });
      setReminderResult(response.data);
      await load();
    } catch (error) {
      setFlash({ tone: 'error', text: apiErrorMessage(error, 'Rappels impossibles (service reservations ou clients indisponible ?).') });
    } finally {
      setRunningReminders(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Communication"
        title="Notifications"
        description="E-mails et SMS : confirmations de reservation, recus de paiement et rappels d'arrivee. Chaque message est conserve avec son statut."
        actions={<>
          <button onClick={() => void load()} className={ghostButton}>Rafraichir</button>
          <button onClick={() => setComposeOpen(true)} className={primaryButton}>Nouveau message</button>
        </>}
      />

      <FlashMessage flash={{ tone: 'info', text: "Mode d'envoi simule par defaut : les messages sont enregistres et journalises mais pas transmis tant qu'un serveur SMTP (e-mail) ou un fournisseur SMS n'est pas configure." }} />
      <FlashMessage flash={flash} onClose={() => setFlash(null)} />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Messages" value={items.length} />
        <StatCard label="Envoyes" value={sent} />
        <StatCard label="En echec" value={failed} />
      </section>

      <Panel>
        <h3 className="mb-4 text-lg font-semibold text-white">Rappels d'arrivee</h3>
        <div className="flex flex-wrap items-end gap-4">
          <Field label="Arrivees du"><input type="date" value={reminderDate} onChange={(e) => setReminderDate(e.target.value)} className={inputClass} /></Field>
          <button onClick={() => void runReminders()} className={primaryButton} disabled={runningReminders}>{runningReminders ? 'Envoi...' : 'Envoyer les rappels'}</button>
        </div>
        {reminderResult ? (
          <p className="mt-4 text-sm text-emerald-300">
            {reminderResult.reservations} arrivee(s) le {reminderResult.date} : {reminderResult.sent} message(s) envoye(s),
            {' '}{reminderResult.alreadySent} deja envoye(s), {reminderResult.failed} en echec.
          </p>
        ) : null}
        <p className="mt-2 text-xs text-white/40">Un rappel automatique part chaque matin a 8 h pour les arrivees du lendemain ; relancer ne cree jamais de doublon.</p>
      </Panel>

      <Panel>
        <div className="mb-5 flex flex-wrap gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} max-w-[180px]`}>
            <option value="">Tous les statuts</option>
            <option value="SENT">Envoyes</option>
            <option value="FAILED">En echec</option>
            <option value="PENDING">En attente</option>
          </select>
          <select value={channelFilter} onChange={(e) => setChannelFilter(e.target.value)} className={`${inputClass} max-w-[180px]`}>
            <option value="">Tous les canaux</option>
            <option value="EMAIL">E-mail</option>
            <option value="SMS">SMS</option>
          </select>
        </div>
        <Table headers={['Date', 'Canal', 'Destinataire', 'Modele', 'Objet / message', 'Statut', '']} isEmpty={!loading && items.length === 0} empty="Aucune notification.">
          {items.map((n) => (
            <tr key={n.id}>
              <td className="px-3 py-3 text-xs">{formatDateTime(n.createdAt)}</td>
              <td className="px-3 py-3"><Badge tone={n.channel === 'EMAIL' ? 'sky' : 'violet'}>{n.channel}</Badge></td>
              <td className="px-3 py-3">{n.recipient}</td>
              <td className="px-3 py-3 text-xs">{n.templateCode ?? '-'}</td>
              <td className="max-w-xs truncate px-3 py-3" title={n.body}>{n.subject || n.body}</td>
              <td className="px-3 py-3">
                <Badge tone={n.status === 'SENT' ? 'green' : n.status === 'FAILED' ? 'rose' : 'amber'}>{n.status === 'SENT' ? 'Envoye' : n.status === 'FAILED' ? 'Echec' : 'En attente'}</Badge>
                {n.errorMessage ? <div className="mt-1 max-w-[200px] text-xs text-rose-300/80">{n.errorMessage}</div> : null}
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <button className={smallButton} onClick={() => setDetail(n)}>Voir</button>
                  {n.status === 'FAILED' ? <button className={smallButton} onClick={() => void retry(n)}>Renvoyer</button> : null}
                </div>
              </td>
            </tr>
          ))}
        </Table>
        {loading ? <p className="py-6 text-center text-sm text-white/45">Chargement...</p> : null}
      </Panel>

      {composeOpen ? (
        <Modal title="Nouveau message" onClose={() => setComposeOpen(false)}>
          <form onSubmit={send} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Canal">
                <select value={channel} onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'SMS')} className={inputClass}>
                  <option value="EMAIL">E-mail</option>
                  <option value="SMS">SMS</option>
                </select>
              </Field>
              <Field label={channel === 'EMAIL' ? 'Adresse e-mail' : 'Numero de telephone'}>
                <input required value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder={channel === 'EMAIL' ? 'client@mail.cm' : '+237 6XX XX XX XX'} className={inputClass} />
              </Field>
            </div>
            <div className="flex gap-3 text-sm">
              <button type="button" onClick={() => setMode('template')} className={`rounded-full px-4 py-1.5 ${mode === 'template' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 text-white/80'}`}>Modele</button>
              <button type="button" onClick={() => setMode('free')} className={`rounded-full px-4 py-1.5 ${mode === 'free' ? 'bg-sky-500 text-slate-950' : 'border border-slate-700/60 text-white/80'}`}>Message libre</button>
            </div>
            {mode === 'template' ? (
              <>
                <Field label="Modele">
                  <select value={templateCode} onChange={(e) => setTemplateCode(e.target.value)} className={inputClass}>
                    {templates.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Variables (une par ligne : cle=valeur)">
                  <textarea rows={5} value={variables} onChange={(e) => setVariables(e.target.value)} className={`${inputClass} font-mono`} />
                </Field>
              </>
            ) : (
              <>
                {channel === 'EMAIL' ? <Field label="Objet"><input required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} /></Field> : null}
                <Field label="Message"><textarea required rows={5} value={body} onChange={(e) => setBody(e.target.value)} className={inputClass} /></Field>
              </>
            )}
            <div className="flex justify-end gap-3">
              <button type="button" className={ghostButton} onClick={() => setComposeOpen(false)}>Annuler</button>
              <button type="submit" className={primaryButton} disabled={sending}>{sending ? 'Envoi...' : 'Envoyer'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {detail ? (
        <Modal title={`${detail.channel} - ${detail.recipient}`} onClose={() => setDetail(null)}>
          {detail.subject ? <p className="mb-3 font-semibold text-white">{detail.subject}</p> : null}
          <pre className="whitespace-pre-wrap rounded-xl border border-slate-700/60 bg-[#10182b] p-4 text-sm text-white/85">{detail.body}</pre>
          <p className="mt-3 text-xs text-white/45">
            Cree le {formatDateTime(detail.createdAt)}{detail.sentAt ? ` - envoye le ${formatDateTime(detail.sentAt)}` : ''}{detail.referenceKey ? ` - reference ${detail.referenceKey}` : ''}
          </p>
        </Modal>
      ) : null}
    </div>
  );
};

export default Notifications;
