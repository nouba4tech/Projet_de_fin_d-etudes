import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { apiRequest } from './api';

export interface CashRegister {
  id: string;
  registerNumber: string;
  openingBalance: number;
  currentBalance: number;
  cashIn: number;
  cashOut: number;
  totalSales: number;
  status: 'open' | 'closed';
  openedBy: string;
  closedBy?: string;
  openedAt?: Date;
  closedAt?: Date;
}

export interface CashTransfer {
  id: string;
  transferNumber: string;
  fromRegister: string;
  toRegister: string;
  amount: number;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  transferDate: Date;
  completedAt?: Date;
}

export interface CashJournal {
  id: string;
  date: Date;
  description: string;
  type: string;
  amount: number;
  balance: number;
  register: string;
  user: string;
  reference?: string;
  status?: string;
  sourceType?: string;
  sourceId?: number;
}

type CashState = {
  cashRegisters: CashRegister[];
  cashTransfers: CashTransfer[];
  cashJournal: CashJournal[];
};

type BackendCashState = {
  cashRegisters: Array<{
    id: number;
    scope: string;
    registerNumber: string;
    openingBalance: number;
    currentBalance: number;
    cashIn: number;
    cashOut: number;
    totalSales: number;
    status: string;
    openedBy?: string;
    closedBy?: string;
    openedAt?: string;
    closedAt?: string;
  }>;
  cashTransfers: Array<{
    id: number;
    scope: string;
    transferNumber: string;
    fromRegister: string;
    toRegister: string;
    amount: number;
    reason: string;
    status: string;
    requestedBy: string;
    approvedBy?: string;
    transferDate: string;
    completedAt?: string;
  }>;
  cashJournal: Array<{
    id: number;
    scope: string;
    date: string;
    description: string;
    type: string;
    amount: number;
    balance: number;
    register: string;
    user: string;
    reference?: string;
    status?: string;
    sourceType?: string;
    sourceId?: number;
  }>;
};

type TransferFormState = {
  fromRegister: string;
  toRegister: string;
  amount: string;
  transferDate: string;
  reason: string;
};

type RegisterOperationFormState = {
  registerNumber: string;
  amount: string;
  responsible: string;
  notes: string;
};

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

const readCurrentUserName = () => {
  if (typeof window === 'undefined') {
    return 'Equipe Mirador';
  }

  try {
    const rawUser = sessionStorage.getItem('currentUser');
    if (!rawUser) {
      return 'Equipe Mirador';
    }

    const currentUser = JSON.parse(rawUser) as {
      firstName?: string;
      lastName?: string;
      role?: string;
      email?: string;
    };

    const fullName = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim();
    return fullName || currentUser.role || currentUser.email || 'Equipe Mirador';
  } catch {
    return 'Equipe Mirador';
  }
};

const toDate = (value?: string) => (value ? new Date(value) : undefined);

const normalizeStatus = (value: string): 'pending' | 'completed' | 'cancelled' => {
  const lower = (value || '').toLowerCase();
  if (lower === 'completed' || lower === 'complete' || lower === 'done') return 'completed';
  if (lower === 'cancelled' || lower === 'canceled' || lower === 'annule') return 'cancelled';
  return 'pending';
};

const mapState = (backend: BackendCashState): CashState => {
  const registersMap = new Map<string, CashRegister>();
  
  (backend.cashRegisters || []).forEach((item) => {
    registersMap.set(item.registerNumber, {
      id: String(item.id),
      registerNumber: item.registerNumber,
      openingBalance: Number(item.openingBalance ?? 0),
      currentBalance: Number(item.currentBalance ?? 0),
      cashIn: Number(item.cashIn ?? 0),
      cashOut: Number(item.cashOut ?? 0),
      totalSales: Number(item.totalSales ?? 0),
      status: (String(item.status || '').toLowerCase() === 'open' ? 'open' : 'closed'),
      openedBy: item.openedBy || '',
      closedBy: item.closedBy || undefined,
      openedAt: toDate(item.openedAt),
      closedAt: toDate(item.closedAt)
    });
  });

  return {
    cashRegisters: Array.from(registersMap.values()),
    cashTransfers: backend.cashTransfers.map((item) => ({
      id: String(item.id),
      transferNumber: item.transferNumber,
      fromRegister: item.fromRegister,
      toRegister: item.toRegister,
      amount: Number(item.amount ?? 0),
      reason: item.reason,
      status: normalizeStatus(item.status),
      requestedBy: item.requestedBy,
      approvedBy: item.approvedBy || undefined,
      transferDate: new Date(item.transferDate),
      completedAt: toDate(item.completedAt)
    })),
    cashJournal: backend.cashJournal.map((item) => ({
      id: String(item.id),
      date: new Date(item.date),
      description: item.description,
      type: item.type,
      amount: Number(item.amount ?? 0),
      balance: Number(item.balance ?? 0),
      register: item.register,
      user: item.user,
      reference: item.reference,
      status: item.status,
      sourceType: item.sourceType,
      sourceId: item.sourceId
    }))
  };
};

const buildLocalDateTime = (dateInput: string) => `${dateInput}T00:00:00`;

export const useBackendCashModule = (
  scope: string,
  initialCashRegisters: CashRegister[],
  initialCashTransfers: CashTransfer[],
  initialCashJournal: CashJournal[]
) => {
  const initialState = useMemo<CashState>(
    () => ({
      cashRegisters: initialCashRegisters,
      cashTransfers: initialCashTransfers,
      cashJournal: initialCashJournal
    }),
    [initialCashJournal, initialCashRegisters, initialCashTransfers]
  );

  const [cashState, setCashState] = useState<CashState>(initialState);
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    fromRegister: '',
    toRegister: '',
    amount: '',
    transferDate: getTodayInputValue(),
    reason: ''
  });
  const [openingForm, setOpeningForm] = useState<RegisterOperationFormState>({
    registerNumber: '',
    amount: '',
    responsible: readCurrentUserName(),
    notes: ''
  });
  const [closingForm, setClosingForm] = useState<RegisterOperationFormState>({
    registerNumber: '',
    amount: '',
    responsible: readCurrentUserName(),
    notes: ''
  });
  const [feedback, setFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refresh = async () => {
    setIsLoading(true);
    try {
      const state = await apiRequest<BackendCashState>('GET', `/api/cash/${scope}`);
      const mapped = mapState(state);
      setCashState(mapped);

      if (mapped.cashRegisters.length === 0 && initialCashRegisters.length > 0) {
        const bootstrapBody = {
          cashRegisters: initialCashRegisters.map((item) => ({
            registerNumber: item.registerNumber,
            openingBalance: item.openingBalance,
            currentBalance: item.currentBalance,
            cashIn: item.cashIn,
            cashOut: item.cashOut,
            totalSales: item.totalSales,
            status: item.status,
            openedBy: item.openedBy || null,
            closedBy: item.closedBy || null,
            openedAt: item.openedAt ? item.openedAt.toISOString().slice(0, 19) : null,
            closedAt: item.closedAt ? item.closedAt.toISOString().slice(0, 19) : null
          })),
          cashTransfers: initialCashTransfers?.map((item) => ({
            transferNumber: item.transferNumber,
            fromRegister: item.fromRegister,
            toRegister: item.toRegister,
            amount: item.amount,
            reason: item.reason,
            status: item.status,
            requestedBy: item.requestedBy,
            approvedBy: item.approvedBy || null,
            transferDate: item.transferDate.toISOString().slice(0, 19),
            completedAt: item.completedAt ? item.completedAt.toISOString().slice(0, 19) : null
          })),
          cashJournal: initialCashJournal?.map((item) => ({
            date: item.date.toISOString().slice(0, 19),
            description: item.description,
            type: item.type,
            amount: item.amount,
            balance: item.balance,
            register: item.register,
            user: item.user,
            reference: item.reference || null,
            status: item.status || null,
            sourceType: item.sourceType || null
          }))
        };

        const bootstrapped = await apiRequest<BackendCashState>('POST', `/api/cash/${scope}/bootstrap`, bootstrapBody);
        setCashState(mapState(bootstrapped));
      }
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de charger les donnees de caisse.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope]);

  const cashRegisters = cashState.cashRegisters;
  const cashTransfers = cashState.cashTransfers;
  const cashJournal = cashState.cashJournal;

  const sortedTransfers = useMemo(
    () => [...cashTransfers].sort((left, right) => right.transferDate.getTime() - left.transferDate.getTime()),
    [cashTransfers]
  );

  const sortedJournal = useMemo(
    () => [...cashJournal].sort((left, right) => right.date.getTime() - left.date.getTime()),
    [cashJournal]
  );

  const closingRegister = useMemo(
    () => cashRegisters.find((register) => register.registerNumber === closingForm.registerNumber),
    [cashRegisters, closingForm.registerNumber]
  );

  const closingDifference = useMemo(() => {
    if (!closingRegister || closingForm.amount.trim() === '') {
      return 0;
    }

    const realBalance = Number(closingForm.amount);
    if (Number.isNaN(realBalance)) {
      return 0;
    }

    return realBalance - closingRegister.currentBalance;
  }, [closingForm.amount, closingRegister]);

  const resetTransferForm = () => {
    setTransferForm({
      fromRegister: '',
      toRegister: '',
      amount: '',
      transferDate: getTodayInputValue(),
      reason: ''
    });
  };

  const handleTransferSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');

    const amount = Number(transferForm.amount);
    if (!transferForm.fromRegister || !transferForm.toRegister) {
      setFeedback('Selectionnez une caisse source et une caisse destination valides.');
      return;
    }
    if (transferForm.fromRegister === transferForm.toRegister) {
      setFeedback('La caisse source et la caisse destination doivent etre differentes.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback('Renseignez un montant valide.');
      return;
    }
    if (!transferForm.reason.trim()) {
      setFeedback('Renseignez un motif.');
      return;
    }

    try {
      await apiRequest('POST', `/api/cash/${scope}/transfers`, {
        fromRegister: transferForm.fromRegister,
        toRegister: transferForm.toRegister,
        amount,
        reason: transferForm.reason.trim(),
        requestedBy: readCurrentUserName(),
        transferDate: buildLocalDateTime(transferForm.transferDate)
      });
      resetTransferForm();
      await refresh();
      setFeedback('Transfert enregistre. En attente de validation.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de creer le transfert.');
    }
  };

  const approveTransfer = async (transferId: string) => {
    setFeedback('');
    try {
      await apiRequest('PUT', `/api/cash/${scope}/transfers/${transferId}/approve`, {
        approvedBy: readCurrentUserName()
      });
      await refresh();
      setFeedback('Transfert valide.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de valider le transfert.');
    }
  };

  const cancelTransfer = async (transferId: string) => {
    setFeedback('');
    try {
      await apiRequest('PUT', `/api/cash/${scope}/transfers/${transferId}/cancel`);
      await refresh();
      setFeedback('Transfert annule.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible d’annuler le transfert.');
    }
  };

  const deleteTransfer = async (transferId: string) => {
    setFeedback('');
    try {
      await apiRequest('DELETE', `/api/cash/${scope}/transfers/${transferId}`);
      await refresh();
      setFeedback('Transfert supprime.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de supprimer le transfert.');
    }
  };

  const handleOpeningSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');

    const amount = Number(openingForm.amount);
    if (!openingForm.registerNumber) {
      setFeedback('Selectionnez une caisse.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFeedback('Renseignez un solde initial valide.');
      return;
    }

    try {
      await apiRequest('POST', `/api/cash/${scope}/registers/open`, {
        registerNumber: openingForm.registerNumber,
        openingBalance: amount,
        responsible: (openingForm.responsible || readCurrentUserName()).trim(),
        notes: openingForm.notes
      });
      await refresh();
      setFeedback('Caisse ouverte.');
      setOpeningForm({
        registerNumber: '',
        amount: '',
        responsible: readCurrentUserName(),
        notes: ''
      });
    } catch (error: any) {
      setFeedback(error?.message || "Impossible d'ouvrir la caisse.");
    }
  };

  const handleClosingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback('');

    const amount = Number(closingForm.amount);
    if (!closingForm.registerNumber) {
      setFeedback('Selectionnez une caisse.');
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      setFeedback('Renseignez un solde reel valide.');
      return;
    }

    try {
      await apiRequest('POST', `/api/cash/${scope}/registers/close`, {
        registerNumber: closingForm.registerNumber,
        realBalance: amount,
        responsible: (closingForm.responsible || readCurrentUserName()).trim(),
        notes: closingForm.notes
      });
      await refresh();
      setFeedback('Cloture enregistree.');
      setClosingForm({
        registerNumber: '',
        amount: '',
        responsible: readCurrentUserName(),
        notes: ''
      });
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de cloturer la caisse.');
    }
  };

  const cancelClosure = async (journalEntryId: string) => {
    setFeedback('');
    try {
      await apiRequest('PUT', `/api/cash/${scope}/closures/${journalEntryId}/cancel`);
      await refresh();
      setFeedback('Cloture annulee.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible d’annuler la cloture.');
    }
  };

  const deleteClosure = async (journalEntryId: string) => {
    setFeedback('');
    try {
      await apiRequest('DELETE', `/api/cash/${scope}/closures/${journalEntryId}`);
      await refresh();
      setFeedback('Cloture supprimee.');
    } catch (error: any) {
      setFeedback(error?.message || 'Impossible de supprimer la cloture.');
    }
  };

  return {
    cashRegisters,
    cashTransfers: sortedTransfers,
    cashJournal: sortedJournal,
    transferForm,
    setTransferForm,
    openingForm,
    setOpeningForm,
    closingForm,
    setClosingForm,
    closingRegister,
    closingDifference,
    feedback,
    isLoading,
    refresh,
    handleTransferSubmit,
    approveTransfer,
    cancelTransfer,
    deleteTransfer,
    handleOpeningSubmit,
    handleClosingSubmit,
    cancelClosure,
    deleteClosure,
    resetTransferForm
  };
};

