import api from '../services/api';
import { isCheckRunning, runBackgroundCheck } from './faceCheck';

// Identity checks still "EN_COURS" (the booking window was closed before the face comparison ended) are finished
// by any open Admin / Reception session, every few minutes, until the server's 10-hour limit.

const PERIOD_MS = 5 * 60 * 1000;

type PendingCheck = { id: number; status: string; livenessPassed: boolean; purged: boolean };

const asDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('lecture impossible'));
  reader.readAsDataURL(blob);
});

const finishPendingChecks = async () => {
  if (!localStorage.getItem('token')) return;
  let checks: PendingCheck[];
  try {
    checks = (await api.get<PendingCheck[]>('/identity-verifications')).data ?? [];
  } catch {
    return; // not allowed for this role, or server unreachable
  }
  for (const check of checks.filter(c => c.status === 'EN_COURS' && !c.purged && !isCheckRunning(c.id))) {
    try {
      const [recto, selfie] = await Promise.all(['recto', 'selfie'].map(async part =>
        asDataUrl((await api.get<Blob>(`/identity-verifications/${check.id}/documents/${part}`, { responseType: 'blob' })).data)));
      runBackgroundCheck(check.id, recto, selfie, check.livenessPassed,
        result => api.post(`/identity-verifications/${check.id}/result`, result));
    } catch {
      // retried at the next round
    }
  }
};

export const startPendingIdentityChecks = () => {
  const first = window.setTimeout(() => void finishPendingChecks(), 20000);
  const timer = window.setInterval(() => void finishPendingChecks(), PERIOD_MS);
  return () => {
    window.clearTimeout(first);
    window.clearInterval(timer);
  };
};
