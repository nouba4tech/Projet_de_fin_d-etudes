import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { ReservationStatus } from '../types';
import {
  FACE_MATCH_THRESHOLD, captureFrame, compressImage, faceDistance, headYaw, loadFaceApi, runBackgroundCheck,
  similarityPercent,
} from '../utils/faceCheck';

/**
 * Booking in 4 steps: 1. client, 2. stay, 3. identity check (ID front/back + live selfie, compared by face
 * recognition), 4. payment and confirmation. The server refuses a booking without a verified identity check.
 */

export type WizardClient = {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  clientType: string | null;
  companyName: string | null;
  idDocument?: string | null;
  status?: string | null;
};

type FreeRoom = { id: string; number: string; type: string; price: number; status: string; capacity: number | null };
type ExtraService = { id: string; code: string; name: string; price: number; status: string };
type Verification = { id: number; status: 'EN_COURS' | 'VERIFIEE' | 'A_REVOIR' | 'REJETEE'; faceDistance: number | null; faceMatch: boolean; livenessPassed: boolean };
type CreatedReservation = { id: number; totalAmount: number; invoiceCode: string | null; roomId: string; checkIn: string; checkOut: string };

interface BookingWizardProps {
  /** loaded by the wizard when not given */
  clients?: WizardClient[];
  onClose: () => void;
  /** called once the booking exists (even if the payment or the notification failed afterwards) */
  onCreated: () => void;
  onClientCreated?: (client: WizardClient) => void;
}

const STEPS = ['Informations personnelles', 'Détails de la réservation', "Vérification d'identité", 'Paiement et confirmation'];
const DOCUMENT_TYPES = [
  { value: 'CNI', label: "Carte nationale d'identité" },
  { value: 'PASSEPORT', label: 'Passeport' },
  { value: 'PERMIS', label: 'Permis de conduire' },
  { value: 'CARTE_SEJOUR', label: 'Carte de séjour' },
];
const PAYMENT_METHODS = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'MOBILE_MONEY', label: 'Mobile Money' },
  { value: 'CARTE', label: 'Carte bancaire' },
  { value: 'VIREMENT', label: 'Virement' },
  { value: 'CHEQUE', label: 'Chèque' },
  { value: 'ARRIVEE', label: "Payer à l'arrivée" },
];
const HOTEL_NAME = 'Hôtel Mirador';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelClass = 'block text-sm font-medium text-gray-400 mb-2';
const fcfa = (value: number) => `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
const todayIso = () => new Date().toISOString().slice(0, 10);
const nightsBetween = (from: string, to: string) =>
  from && to ? Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000)) : 0;

const apiMessage = (error: unknown, fallback: string): string => {
  const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string> } } })?.response?.data;
  if (data?.message) return data.message;
  if (data?.errors) return Object.values(data.errors)[0] ?? fallback;
  return fallback;
};

const BookingWizard: React.FC<BookingWizardProps> = ({ clients: givenClients, onClose, onCreated, onClientCreated }) => {
  const [loadedClients, setLoadedClients] = useState<WizardClient[] | null>(null);
  useEffect(() => {
    if (givenClients) return;
    api.get<WizardClient[]>('/clients')
      .then(response => setLoadedClients(Array.isArray(response.data) ? response.data : []))
      .catch(() => setLoadedClients([]));
  }, [givenClients]);
  const clients = useMemo(() => givenClients ?? loadedClients ?? [], [givenClients, loadedClients]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- step 1: client ----
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [clientId, setClientId] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [person, setPerson] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '', city: '' });
  const [createdClient, setCreatedClient] = useState<WizardClient | null>(null);

  // ---- step 2: stay ----
  const [stay, setStay] = useState({ checkIn: todayIso(), checkOut: '', guests: '1' });
  const [freeRooms, setFreeRooms] = useState<FreeRoom[] | null>(null);
  const [roomType, setRoomType] = useState('');
  const [roomId, setRoomId] = useState('');
  const [services, setServices] = useState<ExtraService[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);

  // ---- step 3: identity ----
  const [documentType, setDocumentType] = useState('CNI');
  const [documentNumber, setDocumentNumber] = useState('');
  const [recto, setRecto] = useState<string | null>(null);
  const [verso, setVerso] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [liveness, setLiveness] = useState<'idle' | 'loading' | 'center' | 'turn' | 'back' | 'done' | 'failed'>('idle');
  /** false when the selfie was taken with the manual button, before the head-turn test was passed */
  const [livenessPassed, setLivenessPassed] = useState(false);
  const [manualCapture, setManualCapture] = useState(false);
  const [livenessHint, setLivenessHint] = useState('');
  const [comparison, setComparison] = useState<{ distance: number | null; note: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const livenessRun = useRef(0);

  // ---- step 4: payment ----
  const [paymentMethod, setPaymentMethod] = useState('ESPECES');
  const [result, setResult] = useState<{ reservation: CreatedReservation; payment: string; notification: string } | null>(null);

  const client: WizardClient | null = useMemo(() => {
    if (clientMode === 'new') return createdClient;
    return clients.find(c => String(c.id) === clientId) ?? null;
  }, [clientMode, createdClient, clients, clientId]);

  const filteredClients = useMemo(() => {
    const term = clientSearch.trim().toLowerCase();
    const list = [...clients].sort((a, b) => `${a.lastName ?? ''}`.localeCompare(`${b.lastName ?? ''}`));
    if (!term) return list;
    return list.filter(c => [c.firstName, c.lastName, c.companyName, c.phone, c.email]
      .some(v => (v ?? '').toLowerCase().includes(term)));
  }, [clients, clientSearch]);

  const room = freeRooms?.find(r => r.id === roomId) ?? null;
  const nights = nightsBetween(stay.checkIn, stay.checkOut);
  const chosenServices = services.filter(s => serviceIds.includes(s.id));
  const roomAmount = room ? room.price * Math.max(1, nights) : 0;
  const totalAmount = roomAmount + chosenServices.reduce((sum, s) => sum + s.price, 0);

  const roomTypes = useMemo(() => {
    const groups = new Map<string, { type: string; price: number; rooms: FreeRoom[] }>();
    for (const r of freeRooms ?? []) {
      const group = groups.get(r.type) ?? { type: r.type, price: r.price, rooms: [] };
      group.rooms.push(r);
      group.price = Math.min(group.price, r.price);
      groups.set(r.type, group);
    }
    return [...groups.values()].sort((a, b) => a.price - b.price);
  }, [freeRooms]);

  useEffect(() => {
    api.get<ExtraService[]>('/parametres/services')
      .then(response => setServices((response.data ?? []).filter(s => (s.status ?? 'active') === 'active')
        .map(s => ({ ...s, price: Number(s.price) || 0 }))))
      .catch(() => setServices([]));
  }, []);

  const stopCamera = () => {
    livenessRun.current += 1;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
  };
  useEffect(() => stopCamera, []);

  const clientName = client
    ? (client.clientType === 'Personne morale' ? client.companyName : `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim()) || 'Client'
    : '';

  // ---------------- step 1 ----------------
  const submitStep1 = async () => {
    setError(null);
    if (clientMode === 'existing') {
      if (!client) return setError('Choisissez un client.');
      if (!client.phone && !client.email) return setError("Ce client n'a ni téléphone ni e-mail : complétez sa fiche ou créez un nouveau client.");
      return setStep(1);
    }
    const p = { ...person, firstName: person.firstName.trim(), lastName: person.lastName.trim(), email: person.email.trim(), phone: person.phone.trim() };
    if (!p.firstName || !p.lastName) return setError('Le nom et le prénom sont obligatoires.');
    if (!p.phone) return setError('Le numéro de téléphone est obligatoire.');
    if (p.email && !EMAIL.test(p.email)) return setError("L'adresse e-mail n'est pas valide.");
    if (createdClient) return setStep(1);
    setBusy(true);
    try {
      const address = [person.address.trim(), person.city.trim()].filter(Boolean).join(', ');
      const response = await api.post<WizardClient>('/clients', {
        firstName: p.firstName, lastName: p.lastName, email: p.email || null, phone: p.phone,
        address: address || null, clientType: 'Physique', status: 'Actif',
      });
      setCreatedClient(response.data);
      onClientCreated?.(response.data);
      setStep(1);
    } catch (e) {
      setError(apiMessage(e, "Impossible d'enregistrer le client."));
    } finally {
      setBusy(false);
    }
  };

  // ---------------- step 2 ----------------
  const searchRooms = async () => {
    setError(null);
    if (!stay.checkIn || !stay.checkOut || nights < 1) return setError("La date de départ doit être après la date d'arrivée.");
    if (stay.checkIn < todayIso()) return setError("La date d'arrivée ne peut pas être dans le passé.");
    setBusy(true);
    try {
      const guests = Number(stay.guests) || 1;
      const response = await api.get<FreeRoom[]>('/chambres/disponibles', {
        params: { from: stay.checkIn, to: stay.checkOut, capacite: guests > 1 ? guests : undefined },
      });
      const list = (response.data ?? []).map(r => ({ ...r, price: Number(r.price) || 0, type: r.type || 'Standard' }));
      setFreeRooms(list);
      // pre-select the cheapest type (the receptionist can pick another one)
      const cheapest = [...list].sort((a, b) => a.price - b.price)[0];
      setRoomType(cheapest?.type ?? '');
      setRoomId(cheapest?.id ?? '');
      if (list.length === 0) setError('Aucune chambre libre sur cette période pour ce nombre de personnes.');
    } catch (e) {
      setError(apiMessage(e, 'Impossible de rechercher les chambres libres.'));
    } finally {
      setBusy(false);
    }
  };

  // the free rooms are searched as soon as the dates are valid: no need to press the button first
  useEffect(() => {
    if (step !== 1 || freeRooms !== null || busy) return;
    if (!stay.checkIn || !stay.checkOut || nightsBetween(stay.checkIn, stay.checkOut) < 1 || stay.checkIn < todayIso()) return;
    const timer = window.setTimeout(() => void searchRooms(), 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, stay.checkIn, stay.checkOut, stay.guests, freeRooms]);

  const chooseType = (type: string) => {
    setRoomType(type);
    setRoomId(roomTypes.find(t => t.type === type)?.rooms[0]?.id ?? '');
  };

  const submitStep2 = () => {
    setError(null);
    if (!stay.checkOut || nights < 1) return setError("Choisissez la date de départ (après la date d'arrivée).");
    if (!room) return setError(freeRooms === null ? 'Recherche des chambres libres en cours…' : 'Choisissez un type de chambre.');
    setStep(2);
  };

  // ---------------- step 3 ----------------
  const readDocument = async (file: File | undefined, setter: (value: string) => void) => {
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
      setError('Choisissez une photo (JPEG ou PNG) de la pièce.');
      return;
    }
    try {
      setter(await compressImage(file));
      setComparison(null);
      setVerification(null);
    } catch {
      setError('Photo illisible, réessayez.');
    }
  };

  const startLiveness = async () => {
    setError(null);
    setSelfie(null);
    setComparison(null);
    setVerification(null);
    setLiveness('loading');
    setLivenessPassed(false);
    setManualCapture(false);
    setLivenessHint('Ouverture de la caméra…');
    const run = ++livenessRun.current;
    try {
      // the face models load while the camera opens
      const models = loadFaceApi();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLivenessHint('Chargement de la reconnaissance faciale…');
      await models;
    } catch (e) {
      stopCamera();
      setLiveness('failed');
      setLivenessHint('');
      setError(e instanceof DOMException
        ? "Caméra inaccessible : autorisez l'accès à la caméra dans le navigateur."
        : 'Reconnaissance faciale indisponible (connexion ?). Réessayez.');
      return;
    }
    // short challenge: a face in front of the camera, one head turn (either side), back to the camera: about 3 s
    const hints = {
      center: 'Regardez la caméra.',
      turn: 'Tournez légèrement la tête à gauche ou à droite…',
      back: 'Revenez face à la caméra.',
    } as const;
    let phase: 'center' | 'turn' | 'back' = 'center';
    const started = Date.now();
    while (run === livenessRun.current) {
      if (Date.now() - started > 6000) setManualCapture(true);
      const yaw = videoRef.current ? await headYaw(videoRef.current).catch(() => null) : null;
      if (run !== livenessRun.current) return;
      if (yaw === null) {
        setLiveness(phase);
        setLivenessHint('Visage non détecté : rapprochez-vous, face à la lumière (évitez une fenêtre derrière vous).');
      } else {
        if (phase === 'center' && Math.abs(yaw) < 0.15) phase = 'turn';
        else if (phase === 'turn' && Math.abs(yaw) > 0.09) phase = 'back';
        else if (phase === 'back' && Math.abs(yaw) < 0.08) break;
        setLiveness(phase);
        setLivenessHint(hints[phase]);
      }
      await new Promise(resolve => setTimeout(resolve, 60));
    }
    if (run !== livenessRun.current || !videoRef.current) return;
    await takeSelfie(true);
  };

  /** passed: the head-turn test succeeded; otherwise an administrator will have to validate the identity */
  const takeSelfie = async (passed: boolean) => {
    if (!videoRef.current || !videoRef.current.videoWidth) return;
    const frame = captureFrame(videoRef.current);
    stopCamera();
    setManualCapture(false);
    setSelfie(await compressImage(frame, 960, 0.88));
    setLivenessPassed(passed);
    setLiveness('done');
    setLivenessHint(passed ? 'Présence vérifiée, selfie pris.' : 'Selfie pris sans test de présence : un administrateur devra valider.');
  };

  useEffect(() => {
    if (!recto || !selfie || comparison) return;
    let cancelled = false;
    setComparison({ distance: null, note: 'Comparaison des visages…' });
    faceDistance(recto, selfie)
      .then(r => {
        if (cancelled) return;
        if (r.distance === null) {
          setComparison({ distance: null, note: r.documentFace ? 'Aucun visage trouvé sur le selfie.' : 'Aucun visage trouvé sur le recto de la pièce : reprenez une photo nette.' });
        } else {
          setComparison({ distance: r.distance, note: r.distance <= FACE_MATCH_THRESHOLD ? 'Les visages correspondent.' : 'Les visages ne correspondent pas.' });
        }
      })
      .catch(() => !cancelled && setComparison({ distance: null, note: 'Comparaison automatique impossible.' }));
    return () => { cancelled = true; };
  }, [recto, selfie, comparison]);

  /**
   * Saves the documents and goes on to payment right away. The face comparison carries on in the background
   * (5 minutes at most); the client gets an e-mail with the result.
   */
  const submitIdentity = async () => {
    setError(null);
    if (!client) return setError('Client manquant.');
    if (!documentNumber.trim()) return setError('Saisissez le numéro de la pièce.');
    if (!recto || !verso) return setError('Ajoutez le recto et le verso de la pièce.');
    if (!selfie || liveness !== 'done') return setError('Prenez le selfie du client (test de présence ou photo).');
    if (!consent) return setError('Le consentement du client est obligatoire.');
    if (verification && verification.status !== 'REJETEE') {
      setStep(3);
      return;
    }
    setBusy(true);
    try {
      const known = comparison?.distance ?? null;
      const response = await api.post<Verification>('/identity-verifications', {
        clientId: client.id, documentType, documentNumber: documentNumber.trim(), recto, verso, selfie,
        faceDistance: known, livenessPassed, consent, visualCheck: false,
      });
      const saved = response.data;
      setVerification(saved);
      if (saved.status === 'EN_COURS') {
        runBackgroundCheck(saved.id, recto, selfie, livenessPassed,
          result => api.post(`/identity-verifications/${saved.id}/result`, result));
      }
      if (saved.status === 'REJETEE') {
        setError("Les visages ne correspondent pas : l'identité est rejetée. Reprenez le selfie ou la photo de la pièce.");
        return;
      }
      setStep(3);
    } catch (e) {
      setError(apiMessage(e, "Impossible d'enregistrer la vérification d'identité."));
    } finally {
      setBusy(false);
    }
  };

  // ---------------- step 4 ----------------
  const confirm = async () => {
    if (!client || !room || !verification) return;
    setError(null);
    setBusy(true);
    const payNow = paymentMethod !== 'ARRIVEE';
    let reservation: CreatedReservation;
    try {
      const response = await api.post<CreatedReservation>('/reservations', {
        clientId: client.id,
        roomId: room.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        status: ReservationStatus.PENDING,
        occupantFirstName: client.firstName || clientName,
        occupantLastName: client.lastName || clientName,
        occupantIdDocument: `${documentType} ${documentNumber.trim()}`,
        occupantPhone: client.phone || null,
        identityVerificationId: verification.id,
        serviceIds: chosenServices.map(s => Number(s.id)),
        observation: `${Number(stay.guests) || 1} personne(s)`,
      });
      reservation = response.data;
    } catch (e) {
      setBusy(false);
      setError(apiMessage(e, 'Impossible de créer la réservation.'));
      return;
    }
    onCreated();

    let payment = "À régler à l'arrivée";
    if (payNow && reservation.invoiceCode) {
      try {
        const response = await api.post<{ reference: string; status: string; failureReason: string | null }>('/paiements', {
          invoiceCode: reservation.invoiceCode, amount: reservation.totalAmount, method: paymentMethod,
        });
        payment = response.data.status === 'COMPLETED'
          ? `Payé (${PAYMENT_METHODS.find(m => m.value === paymentMethod)?.label}) — réf. ${response.data.reference}`
          : `Paiement refusé : ${response.data.failureReason ?? 'erreur'}`;
        if (response.data.status === 'COMPLETED') {
          await api.put(`/reservations/${reservation.id}`, {
            clientId: client.id, roomId: room.id, checkIn: stay.checkIn, checkOut: stay.checkOut,
            // room part only: the server keeps the extra services already on the invoice
            status: ReservationStatus.CONFIRMED, totalAmount: roomAmount,
            occupantFirstName: client.firstName || clientName, occupantLastName: client.lastName || clientName,
            occupantIdDocument: `${documentType} ${documentNumber.trim()}`, occupantPhone: client.phone || null,
          }).catch(() => undefined);
        }
      } catch (e) {
        payment = `Paiement non enregistré : ${apiMessage(e, 'erreur')}`;
      }
    }

    let notification = 'Aucun contact pour la confirmation';
    const channel = client.email && EMAIL.test(client.email) ? 'EMAIL' : client.phone ? 'SMS' : null;
    if (channel) {
      try {
        const response = await api.post<{ status: string }>('/notifications', {
          channel,
          recipient: channel === 'EMAIL' ? client.email : client.phone,
          templateCode: 'RESERVATION_CONFIRMATION',
          referenceKey: `RES-${reservation.id}`,
          variables: {
            name: clientName, reservationId: String(reservation.id), room: room.number,
            checkIn: stay.checkIn, checkOut: stay.checkOut, amount: Math.round(reservation.totalAmount).toLocaleString('fr-FR'),
          },
        });
        notification = `${channel === 'EMAIL' ? 'E-mail' : 'SMS'} de confirmation ${response.data.status === 'FAILED' ? 'en échec' : 'envoyé'} à ${channel === 'EMAIL' ? client.email : client.phone}`;
      } catch (e) {
        notification = `Confirmation non envoyée : ${apiMessage(e, 'erreur')}`;
      }
    }
    setResult({ reservation, payment, notification });
    setBusy(false);
  };

  // ---------------- render ----------------
  const goBack = () => {
    setError(null);
    if (step === 2) stopCamera();
    setStep(s => Math.max(0, s - 1));
  };

  const summary = (
    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-sm space-y-1">
      <div className="flex justify-between"><span className="text-gray-400">Hôtel</span><span className="text-white">{HOTEL_NAME}</span></div>
      {room && <div className="flex justify-between"><span className="text-gray-400">Chambre</span><span className="text-white">{room.number} ({room.type})</span></div>}
      <div className="flex justify-between"><span className="text-gray-400">Séjour</span><span className="text-white">{stay.checkIn || '—'} → {stay.checkOut || '—'} · {nights} nuit{nights > 1 ? 's' : ''}</span></div>
      {room && <div className="flex justify-between"><span className="text-gray-400">Hébergement</span><span className="text-white">{fcfa(roomAmount)}</span></div>}
      {chosenServices.map(s => (
        <div key={s.id} className="flex justify-between"><span className="text-gray-400">{s.name}</span><span className="text-white">{fcfa(s.price)}</span></div>
      ))}
      <div className="flex justify-between pt-2 border-t border-white/10 font-bold"><span className="text-gray-300">Total</span><span className="text-blue-300 text-lg">{fcfa(totalAmount)}</span></div>
    </div>
  );

  return (
    // full screen: the whole page is used so that every piece of information stays readable
    <div className="fixed inset-0 z-50 bg-[#050714] overflow-y-auto">
      <div className="min-h-full w-full max-w-7xl mx-auto px-4 sm:px-10 py-6 sm:py-8 flex flex-col">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h3 className="text-3xl font-bold text-white">Nouvelle réservation</h3>
          <span className="text-sm text-gray-400 mt-2">Étape {Math.min(step + 1, 4)} / 4</span>
        </div>

        <ol className="grid grid-cols-4 gap-3 mb-8">
          {STEPS.map((label, index) => (
            <li key={label} className="text-center">
              <div className={`h-2 rounded-full mb-2 ${index < step || result ? 'bg-emerald-500' : index === step ? 'bg-blue-500' : 'bg-white/10'}`} />
              <span className={`text-xs sm:text-sm leading-tight block ${index === step ? 'text-white font-semibold' : 'text-gray-500'}`}>{index + 1}. {label}</span>
            </li>
          ))}
        </ol>

        <div className="flex-1">

        {step === 0 && (
          <div className="space-y-5">
            <div className="flex gap-2" role="radiogroup">
              {(['existing', 'new'] as const).map(mode => (
                <label key={mode} className={`flex-1 cursor-pointer text-center rounded-lg border px-3 py-2 text-sm ${clientMode === mode ? 'border-blue-500 bg-blue-500/15 text-white' : 'border-white/10 text-gray-400'}`}>
                  <input type="radio" className="sr-only" checked={clientMode === mode} onChange={() => { setClientMode(mode); setError(null); }} />
                  {mode === 'existing' ? 'Client existant' : 'Nouveau client'}
                </label>
              ))}
            </div>
            {clientMode === 'existing' ? (
              <div className="space-y-3">
                <input className={inputClass} placeholder="Rechercher par nom, téléphone ou e-mail" value={clientSearch} onChange={e => setClientSearch(e.target.value)} />
                <p className="text-sm text-gray-400">{filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}</p>
                <div role="radiogroup" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[52vh] overflow-y-auto pr-1">
                  {filteredClients.map(c => {
                    const selected = String(c.id) === clientId;
                    return (
                      <label key={c.id} className={`cursor-pointer rounded-xl border p-4 transition-colors ${selected ? 'border-blue-500 bg-blue-500/15' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}>
                        <input type="radio" name="wizard-client" className="sr-only" checked={selected} onChange={() => setClientId(String(c.id))} />
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-base font-semibold text-white truncate">
                            {c.clientType === 'Personne morale' ? c.companyName || 'Société' : `${c.lastName ?? ''} ${c.firstName ?? ''}`.trim()}
                          </span>
                          {c.clientType === 'Personne morale' && <span className="text-[10px] rounded bg-amber-500/20 text-amber-200 px-1.5 py-0.5">Société</span>}
                        </span>
                        <span className="block text-sm text-gray-300 mt-1">{c.phone || 'Pas de téléphone'}</span>
                        <span className="block text-sm text-gray-400 truncate">{c.email || "Pas d'e-mail"}</span>
                      </label>
                    );
                  })}
                  {filteredClients.length === 0 && <p className="text-gray-400 text-sm">Aucun client ne correspond à la recherche.</p>}
                </div>
                {client && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm bg-white/5 border border-white/10 rounded-xl p-4">
                    <span className="text-gray-400">Nom : <span className="text-white">{clientName}</span></span>
                    <span className="text-gray-400">Téléphone : <span className="text-white">{client.phone || '—'}</span></span>
                    <span className="text-gray-400">E-mail : <span className="text-white">{client.email || '—'}</span></span>
                    <span className="text-gray-400">Adresse : <span className="text-white">{client.address || '—'}</span></span>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  ['lastName', 'Nom', 'text', ''], ['firstName', 'Prénom', 'text', ''],
                  ['email', 'Adresse e-mail', 'email', 'client@exemple.com'], ['phone', 'Numéro de téléphone', 'tel', '+237 ...'],
                  ['address', 'Adresse', 'text', 'Quartier, rue'], ['city', 'Ville', 'text', 'Yaoundé'],
                ] as const).map(([key, label, type, placeholder]) => (
                  <div key={key}>
                    <label className={labelClass}>{label}{key === 'lastName' || key === 'firstName' || key === 'phone' ? ' *' : ''}</label>
                    <input type={type} className={inputClass} placeholder={placeholder} value={person[key]} disabled={!!createdClient}
                      onChange={e => setPerson(prev => ({ ...prev, [key]: e.target.value }))} />
                  </div>
                ))}
                {createdClient && <p className="sm:col-span-2 text-sm text-emerald-300">Client enregistré (n°{createdClient.id}).</p>}
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Hôtel</label>
                <div className={`${inputClass} text-gray-300`}>{HOTEL_NAME}</div>
              </div>
              <div>
                <label className={labelClass}>Date d'arrivée</label>
                <input type="date" className={inputClass} min={todayIso()} value={stay.checkIn}
                  onChange={e => { setStay(s => ({ ...s, checkIn: e.target.value })); setFreeRooms(null); setRoomId(''); }} />
              </div>
              <div>
                <label className={labelClass}>Date de départ</label>
                <input type="date" className={inputClass} min={stay.checkIn || todayIso()} value={stay.checkOut}
                  onChange={e => { setStay(s => ({ ...s, checkOut: e.target.value })); setFreeRooms(null); setRoomId(''); }} />
              </div>
              <div>
                <label className={labelClass}>Nombre de personnes</label>
                <input type="number" min={1} max={10} className={inputClass} value={stay.guests}
                  onChange={e => { setStay(s => ({ ...s, guests: e.target.value })); setFreeRooms(null); setRoomId(''); }} />
              </div>
            </div>
            <button type="button" onClick={searchRooms} disabled={busy}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-semibold">
              {busy ? 'Recherche…' : 'Rechercher les chambres libres'}
            </button>

            {freeRooms && freeRooms.length > 0 && (
              <div className="space-y-3">
                <p className={labelClass}>Type de chambre</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roomTypes.map(t => (
                    <label key={t.type} className={`cursor-pointer rounded-xl border p-3 ${roomType === t.type ? 'border-blue-500 bg-blue-500/15' : 'border-white/10 bg-white/5'}`}>
                      <input type="radio" className="sr-only" checked={roomType === t.type} onChange={() => chooseType(t.type)} />
                      <span className="block text-white font-semibold">{t.type}</span>
                      <span className="block text-xs text-gray-400">{t.rooms.length} libre{t.rooms.length > 1 ? 's' : ''} · dès {fcfa(t.price)}/nuit</span>
                    </label>
                  ))}
                </div>
                {roomType && (
                  <div>
                    <label className={labelClass}>Chambre attribuée</label>
                    <select className={inputClass} value={roomId} onChange={e => setRoomId(e.target.value)}>
                      {roomTypes.find(t => t.type === roomType)?.rooms.map(r => (
                        <option key={r.id} value={r.id} className="bg-[#050714]">
                          Chambre {r.number} — {fcfa(r.price)}/nuit{r.capacity ? ` · ${r.capacity} pers.` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {services.length > 0 && (
              <div>
                <p className={labelClass}>Services supplémentaires</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map(s => (
                    <label key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm cursor-pointer">
                      <span className="flex items-center gap-2 text-white">
                        <input type="checkbox" checked={serviceIds.includes(s.id)}
                          onChange={e => setServiceIds(ids => e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id))} />
                        {s.name}
                      </span>
                      <span className="text-gray-400">{fcfa(s.price)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {summary}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
              Étape obligatoire : elle limite les fausses réservations et les usurpations d'identité. Les documents sont chiffrés,
              visibles seulement par l'administration et la réception, et supprimés 30 jours après le séjour.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Type de pièce</label>
                <select className={inputClass} value={documentType} onChange={e => setDocumentType(e.target.value)}>
                  {DOCUMENT_TYPES.map(d => <option key={d.value} value={d.value} className="bg-[#050714]">{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Numéro de la pièce</label>
                <input className={inputClass} value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} placeholder="Ex. 112345678" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {([['recto', 'Recto de la pièce', recto, setRecto], ['verso', 'Verso de la pièce', verso, setVerso]] as const).map(([key, label, value, setter]) => (
                <div key={key}>
                  <p className={labelClass}>1. {label}</p>
                  <label className="block cursor-pointer rounded-xl border border-dashed border-white/20 bg-white/5 h-40 overflow-hidden">
                    <input type="file" accept="image/*" capture="environment" className="sr-only"
                      onChange={e => { void readDocument(e.target.files?.[0], setter); e.target.value = ''; }} />
                    {value
                      ? <img src={value} alt={label} className="w-full h-full object-contain" />
                      : <span className="flex h-full items-center justify-center text-xs text-gray-400 px-3 text-center">Prendre ou choisir une photo</span>}
                  </label>
                </div>
              ))}
              <div>
                <p className={labelClass}>2. Selfie en direct</p>
                <div className="relative rounded-xl border border-white/20 bg-black h-40 overflow-hidden">
                  {selfie && liveness === 'done'
                    ? <img src={selfie} alt="Selfie" className="w-full h-full object-cover" />
                    : <video ref={videoRef} muted playsInline className="w-full h-full object-cover -scale-x-100" />}
                  {liveness === 'idle' && !selfie && (
                    <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-400 px-3 text-center">La caméra s'ouvre au lancement du test</span>
                  )}
                </div>
                <button type="button" onClick={() => void startLiveness()} disabled={busy || ['loading', 'center', 'turn', 'back'].includes(liveness)}
                  className="mt-2 w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm">
                  {liveness === 'done' ? 'Reprendre le selfie' : 'Lancer le test de présence'}
                </button>
                {manualCapture && ['center', 'turn', 'back'].includes(liveness) && (
                  <button type="button" onClick={() => void takeSelfie(false)}
                    className="mt-2 w-full bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 rounded-lg text-sm">
                    Prendre la photo maintenant
                  </button>
                )}
                {livenessHint && <p className="mt-1 text-sm text-sky-300">{livenessHint}</p>}
              </div>
            </div>

            {comparison && (
              <div className={`rounded-xl border p-3 text-sm ${comparison.distance === null ? 'border-white/10 bg-white/5 text-gray-300'
                : comparison.distance <= FACE_MATCH_THRESHOLD ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
                Vérification faciale : {comparison.note}
                {comparison.distance !== null && ` Ressemblance ${similarityPercent(comparison.distance)} % (seuil ${similarityPercent(FACE_MATCH_THRESHOLD)} %).`}
              </div>
            )}

            <div className="space-y-2 text-sm">
              <label className="flex items-start gap-2 text-gray-300">
                <input type="checkbox" className="mt-1" checked={consent} onChange={e => setConsent(e.target.checked)} />
                Le client a été informé et accepte : ses documents servent uniquement à vérifier son identité pour cette réservation,
                sont conservés chiffrés et supprimés 30 jours après la fin du séjour.
              </label>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
              Dès que tout est rempli, cliquez sur Continuer : la vérification se poursuit en arrière-plan (5 minutes au plus)
              pendant que vous terminez la réservation. Le client reçoit un e-mail indiquant si sa vérification a réussi ou non.
            </div>
            {verification?.status === 'REJETEE' && (
              <button type="button" onClick={() => { setVerification(null); setSelfie(null); setLiveness('idle'); setLivenessPassed(false); setLivenessHint(''); setComparison(null); setError(null); }}
                className="underline text-sm text-gray-300">Refaire la vérification</button>
            )}
            <p className="text-[11px] text-gray-500">
              La pièce et le selfie ne prouvent pas à eux seuls l'identité : en cas de doute, demandez la pièce originale à l'arrivée.
            </p>
          </div>
        )}

        {step === 3 && !result && (
          <div className="space-y-5">
            <div className="text-sm bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
              <div className="flex justify-between"><span className="text-gray-400">Client</span><span className="text-white">{clientName}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Contact</span><span className="text-white">{client?.email || client?.phone || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Identité</span><span className={verification?.status === 'VERIFIEE' ? 'text-emerald-300' : 'text-sky-300'}>
                {verification?.status === 'VERIFIEE' ? 'Vérifiée' : 'Vérification en cours (résultat envoyé par e-mail)'} · {DOCUMENT_TYPES.find(d => d.value === documentType)?.label} {documentNumber}
              </span></div>
              <div className="flex justify-between"><span className="text-gray-400">Personnes</span><span className="text-white">{stay.guests}</span></div>
            </div>
            {summary}
            <div>
              <p className={labelClass}>Moyen de paiement</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <label key={m.value} className={`cursor-pointer rounded-lg border px-3 py-2 text-sm text-center ${paymentMethod === m.value ? 'border-blue-500 bg-blue-500/15 text-white' : 'border-white/10 text-gray-400'}`}>
                    <input type="radio" className="sr-only" checked={paymentMethod === m.value} onChange={() => setPaymentMethod(m.value)} />
                    {m.label}
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Le paiement est enregistré par la réception après encaissement ; un échec annule automatiquement l'opération.
              </p>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
              <p className="text-sm text-emerald-200">Réservation validée</p>
              <p className="text-3xl font-black text-white mt-1">N° {result.reservation.id}</p>
              <p className="text-sm text-gray-300 mt-1">Chambre {room?.number} · {stay.checkIn} → {stay.checkOut} · {fcfa(result.reservation.totalAmount)}</p>
            </div>
            <div className="text-sm bg-white/5 border border-white/10 rounded-xl p-4 space-y-1">
              <div className="flex justify-between gap-4"><span className="text-gray-400">Paiement</span><span className="text-white text-right">{result.payment}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-400">Confirmation</span><span className="text-white text-right">{result.notification}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-400">Identité</span><span className="text-white text-right">{verification?.status === 'VERIFIEE' ? 'Vérifiée' : 'Vérification en cours : le client recevra le résultat par e-mail'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-gray-400">Facture</span><span className="text-white text-right">{result.reservation.invoiceCode ?? '—'}</span></div>
            </div>
          </div>
        )}

        {error && <div className="mt-5 rounded-xl px-4 py-3 text-sm border bg-red-500/10 border-red-500/30 text-red-200">{error}</div>}

        </div>

        <div className="sticky bottom-0 bg-[#050714] pt-4 pb-2 flex flex-col-reverse sm:flex-row gap-3 mt-6 border-t border-white/10">
          {result ? (
            <button type="button" onClick={onClose} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold">Terminer</button>
          ) : (
            <>
              <button type="button" onClick={() => { stopCamera(); onClose(); }} className="sm:flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-bold">Annuler</button>
              {step > 0 && (
                <button type="button" onClick={goBack} disabled={busy} className="sm:flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold">Retour</button>
              )}
              {step === 0 && <button type="button" onClick={() => void submitStep1()} disabled={busy} className="sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold">{busy ? 'Enregistrement…' : 'Continuer'}</button>}
              {step === 1 && <button type="button" onClick={submitStep2} disabled={busy} className="sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold">Continuer</button>}
              {step === 2 && <button type="button" onClick={() => void submitIdentity()} disabled={busy} className="sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold">{busy ? 'Envoi…' : 'Continuer'}</button>}
              {step === 3 && <button type="button" onClick={() => void confirm()} disabled={busy} className="sm:flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold">{busy ? 'Validation…' : paymentMethod === 'ARRIVEE' ? 'Confirmer la réservation' : `Payer ${fcfa(totalAmount)} et confirmer`}</button>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingWizard;
