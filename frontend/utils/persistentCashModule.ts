import { useEffect, useMemo, useState, type FormEvent } from 'react';

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
  openedAt: Date;
  closedAt?: Date;
}

export interface CashTransfer {
  id: string;
  transferNumber: string;
  fromRegister: string;
  toRegister: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  requestedBy: string;
  approvedBy?: string;
  transferDate: Date;
  completedAt?: Date;
}

export interface CashJournal {
  id: string;
  date: Date;
  description: string;
  type: 'sale' | 'cash_in' | 'cash_out' | 'transfer' | 'opening' | 'closing';
  amount: number;
  balance: number;
  register: string;
  user: string;
  reference?: string;
}

type CashStorageState = {
  cashRegisters: CashRegister[];
  cashTransfers: CashTransfer[];
  cashJournal: CashJournal[];
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

const createStorageKey = (scope: string) => `mirador.cash-module.${scope}`;

const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const buildReference = (prefix: string) => {
  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
  return `${prefix}-${stamp}`;
};

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

const deserializeRegister = (register: CashRegister) => ({
  ...register,
  openedAt: new Date(register.openedAt),
  closedAt: register.closedAt ? new Date(register.closedAt) : undefined
});

const deserializeTransfer = (transfer: CashTransfer) => ({
  ...transfer,
  transferDate: new Date(transfer.transferDate),
  completedAt: transfer.completedAt ? new Date(transfer.completedAt) : undefined
});

const deserializeJournalEntry = (entry: CashJournal) => ({
  ...entry,
  date: new Date(entry.date)
});

const loadState = (scope: string, fallback: CashStorageState): CashStorageState => {
  if (typeof window === 'undefined') {
    return fallback;
  }

  try {
    const rawState = localStorage.getItem(createStorageKey(scope));
    if (!rawState) {
      return fallback;
    }

    const parsedState = JSON.parse(rawState) as CashStorageState;
    return {
      cashRegisters: parsedState.cashRegisters.map(deserializeRegister),
      cashTransfers: parsedState.cashTransfers.map(deserializeTransfer),
      cashJournal: parsedState.cashJournal.map(deserializeJournalEntry)
    };
  } catch {
    return fallback;
  }
};

export const usePersistentCashModule = (
  scope: string,
  initialCashRegisters: CashRegister[],
  initialCashTransfers: CashTransfer[],
  initialCashJournal: CashJournal[]
) => {
  const initialState = useMemo<CashStorageState>(
    () => ({
      cashRegisters: initialCashRegisters,
      cashTransfers: initialCashTransfers,
      cashJournal: initialCashJournal
    }),
    [initialCashJournal, initialCashRegisters, initialCashTransfers]
  );

  const [cashState, setCashState] = useState<CashStorageState>(() => loadState(scope, initialState));
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

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(createStorageKey(scope), JSON.stringify(cashState));
  }, [cashState, scope]);

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

  const resetOpeningForm = () => {
    setOpeningForm({
      registerNumber: '',
      amount: '',
      responsible: readCurrentUserName(),
      notes: ''
    });
  };

  const resetClosingForm = () => {
    setClosingForm({
      registerNumber: '',
      amount: '',
      responsible: readCurrentUserName(),
      notes: ''
    });
  };

  const handleTransferSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = Number(transferForm.amount);
    const sourceRegister = cashRegisters.find((register) => register.registerNumber === transferForm.fromRegister);
    const destinationRegister = cashRegisters.find((register) => register.registerNumber === transferForm.toRegister);

    if (!sourceRegister || !destinationRegister) {
      setFeedback('Selectionnez une caisse source et une caisse destination valides.');
      return;
    }

    if (sourceRegister.registerNumber === destinationRegister.registerNumber) {
      setFeedback('La caisse source et la caisse destination doivent etre differentes.');
      return;
    }

    if (sourceRegister.status !== 'open' || destinationRegister.status !== 'open') {
      setFeedback('Les deux caisses doivent etre ouvertes pour initier un transfert.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFeedback('Le montant du transfert doit etre superieur a zero.');
      return;
    }

    if (amount > sourceRegister.currentBalance) {
      setFeedback('Le montant depasse le solde disponible de la caisse source.');
      return;
    }

    const currentUser = readCurrentUserName();
    const transferDate = new Date(`${transferForm.transferDate}T12:00:00`);

    const newTransfer: CashTransfer = {
      id: createId('transfer'),
      transferNumber: buildReference('TRF'),
      fromRegister: sourceRegister.registerNumber,
      toRegister: destinationRegister.registerNumber,
      amount,
      reason: transferForm.reason.trim(),
      status: 'pending',
      requestedBy: currentUser,
      transferDate
    };

    setCashState((previousState) => ({
      ...previousState,
      cashTransfers: [newTransfer, ...previousState.cashTransfers]
    }));

    resetTransferForm();
    setFeedback(`Transfert ${newTransfer.transferNumber} en attente d'approbation.`);
  };

  const approveTransfer = (transferId: string) => {
    const transfer = cashTransfers.find((item) => item.id === transferId);
    if (!transfer || transfer.status !== 'pending') {
      setFeedback('Ce transfert ne peut plus etre approuve.');
      return;
    }

    const sourceRegister = cashRegisters.find((register) => register.registerNumber === transfer.fromRegister);
    const destinationRegister = cashRegisters.find((register) => register.registerNumber === transfer.toRegister);

    if (!sourceRegister || !destinationRegister) {
      setFeedback('Impossible de retrouver les caisses liees a ce transfert.');
      return;
    }

    if (transfer.amount > sourceRegister.currentBalance) {
      setFeedback('Le solde source a change et ne permet plus ce transfert.');
      return;
    }

    const approvedBy = readCurrentUserName();
    const completedAt = new Date();
    const updatedSourceBalance = sourceRegister.currentBalance - transfer.amount;
    const updatedDestinationBalance = destinationRegister.currentBalance + transfer.amount;

    const sourceEntry: CashJournal = {
      id: createId('journal'),
      date: completedAt,
      description: `Transfert vers ${destinationRegister.registerNumber} - ${transfer.reason}`,
      type: 'transfer',
      amount: transfer.amount,
      balance: updatedSourceBalance,
      register: sourceRegister.registerNumber,
      user: approvedBy,
      reference: transfer.transferNumber
    };

    const destinationEntry: CashJournal = {
      id: createId('journal'),
      date: completedAt,
      description: `Transfert depuis ${sourceRegister.registerNumber} - ${transfer.reason}`,
      type: 'cash_in',
      amount: transfer.amount,
      balance: updatedDestinationBalance,
      register: destinationRegister.registerNumber,
      user: approvedBy,
      reference: transfer.transferNumber
    };

    setCashState((previousState) => ({
      cashRegisters: previousState.cashRegisters.map((register) => {
        if (register.id === sourceRegister.id) {
          return {
            ...register,
            currentBalance: updatedSourceBalance,
            cashOut: register.cashOut + transfer.amount
          };
        }

        if (register.id === destinationRegister.id) {
          return {
            ...register,
            currentBalance: updatedDestinationBalance,
            cashIn: register.cashIn + transfer.amount
          };
        }

        return register;
      }),
      cashTransfers: previousState.cashTransfers.map((item) =>
        item.id === transferId
          ? {
              ...item,
              status: 'completed',
              approvedBy,
              completedAt
            }
          : item
      ),
      cashJournal: [destinationEntry, sourceEntry, ...previousState.cashJournal]
    }));

    setFeedback(`Transfert ${transfer.transferNumber} approuve et journalise.`);
  };

  const handleOpeningSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const openingAmount = Number(openingForm.amount);
    const targetRegister = cashRegisters.find((register) => register.registerNumber === openingForm.registerNumber);

    if (!targetRegister) {
      setFeedback('Selectionnez une caisse a ouvrir.');
      return;
    }

    if (targetRegister.status !== 'closed') {
      setFeedback('Cette caisse est deja ouverte.');
      return;
    }

    if (!Number.isFinite(openingAmount) || openingAmount < 0) {
      setFeedback('Le solde d ouverture doit etre positif ou nul.');
      return;
    }

    const openedAt = new Date();
    const responsible = openingForm.responsible.trim() || readCurrentUserName();
    const reference = buildReference('OUV');
    const noteSuffix = openingForm.notes.trim() ? ` - ${openingForm.notes.trim()}` : '';

    const openingEntry: CashJournal = {
      id: createId('journal'),
      date: openedAt,
      description: `Ouverture de caisse${noteSuffix}`,
      type: 'opening',
      amount: openingAmount,
      balance: openingAmount,
      register: targetRegister.registerNumber,
      user: responsible,
      reference
    };

    setCashState((previousState) => ({
      cashRegisters: previousState.cashRegisters.map((register) =>
        register.id === targetRegister.id
          ? {
              ...register,
              openingBalance: openingAmount,
              currentBalance: openingAmount,
              cashIn: 0,
              cashOut: 0,
              totalSales: 0,
              status: 'open',
              openedBy: responsible,
              openedAt,
              closedBy: undefined,
              closedAt: undefined
            }
          : register
      ),
      cashTransfers: previousState.cashTransfers,
      cashJournal: [openingEntry, ...previousState.cashJournal]
    }));

    resetOpeningForm();
    setFeedback(`Caisse ${targetRegister.registerNumber} ouverte avec succes.`);
  };

  const handleClosingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const realBalance = Number(closingForm.amount);
    const targetRegister = cashRegisters.find((register) => register.registerNumber === closingForm.registerNumber);

    if (!targetRegister) {
      setFeedback('Selectionnez une caisse a fermer.');
      return;
    }

    if (targetRegister.status !== 'open') {
      setFeedback('Cette caisse doit etre ouverte avant fermeture.');
      return;
    }

    if (!Number.isFinite(realBalance) || realBalance < 0) {
      setFeedback('Le solde reel de fermeture doit etre positif ou nul.');
      return;
    }

    const closedAt = new Date();
    const responsible = closingForm.responsible.trim() || readCurrentUserName();
    const theoreticalBalance = targetRegister.currentBalance;
    const difference = realBalance - theoreticalBalance;
    const differenceLabel =
      difference === 0 ? 'aucun ecart' : `ecart ${difference.toLocaleString('fr-FR')} FCFA`;
    const noteSuffix = closingForm.notes.trim() ? ` - ${closingForm.notes.trim()}` : '';

    const closingEntry: CashJournal = {
      id: createId('journal'),
      date: closedAt,
      description: `Fermeture de caisse (${differenceLabel})${noteSuffix}`,
      type: 'closing',
      amount: realBalance,
      balance: realBalance,
      register: targetRegister.registerNumber,
      user: responsible,
      reference: buildReference('FER')
    };

    setCashState((previousState) => ({
      cashRegisters: previousState.cashRegisters.map((register) =>
        register.id === targetRegister.id
          ? {
              ...register,
              currentBalance: realBalance,
              status: 'closed',
              closedBy: responsible,
              closedAt
            }
          : register
      ),
      cashTransfers: previousState.cashTransfers,
      cashJournal: [closingEntry, ...previousState.cashJournal]
    }));

    resetClosingForm();
    setFeedback(`Caisse ${targetRegister.registerNumber} fermee avec succes.`);
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
    setFeedback,
    resetTransferForm,
    handleTransferSubmit,
    approveTransfer,
    handleOpeningSubmit,
    handleClosingSubmit
  };
};
