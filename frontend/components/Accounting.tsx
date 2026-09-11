import React, { useEffect, useMemo, useState } from 'react';
import type { IconType } from 'react-icons';
import { FaBalanceScale, FaBook, FaBookOpen, FaCalendarAlt, FaCashRegister, FaExchangeAlt, FaPenFancy, FaPlus, FaDownload, FaUpload, FaCheck } from 'react-icons/fa';
import { apiRequest } from '../utils/api';
import { useAppSettings } from '../contexts/AppSettingsContext';

type AccountingSection = 'plan' | 'operations' | 'journals' | 'cash_book' | 'journal_book' | 'inter_cash_transfer' | 'balance';

type MenuItem = {
  id: AccountingSection;
  label: string;
  icon: IconType;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'plan', label: 'Plan comptable', icon: FaBookOpen },
  { id: 'operations', label: 'Saisir les opérations comptables', icon: FaPenFancy },
  { id: 'journals', label: 'Journées comptables', icon: FaCalendarAlt },
  { id: 'cash_book', label: 'Brouillard de caisse', icon: FaCashRegister },
  { id: 'journal_book', label: 'Brouillard des journeaux', icon: FaBook },
  { id: 'inter_cash_transfer', label: 'Transfert inter-caisse', icon: FaExchangeAlt },
  { id: 'balance', label: 'Balance générale', icon: FaBalanceScale }
];

// Données exemples pour chaque section
const ACCOUNT_PLAN = [
  { code: '101000', name: 'Capital Social', type: 'Passif', balance: 10000000 },
  { code: '101100', name: 'Prime d\'apport', type: 'Passif', balance: 500000 },
  { code: '106100', name: 'Réserve légale', type: 'Passif', balance: 1000000 },
  { code: '110000', name: 'Report à nouveau', type: 'Passif', balance: 250000 },
  { code: '120000', name: 'Résultat de l\'exercice', type: 'Passif', balance: 1500000 },
  { code: '131000', name: 'Subventions d\'investissement', type: 'Passif', balance: 2000000 },
  { code: '401000', name: 'Fournisseurs', type: 'Passif', balance: 1500000 },
  { code: '401100', name: 'Fournisseurs - Effets à payer', type: 'Passif', balance: 750000 },
  { code: '411000', name: 'Clients', type: 'Actif', balance: 2500000 },
  { code: '411100', name: 'Clients - Effets à recevoir', type: 'Actif', balance: 1250000 },
  { code: '421000', name: 'Personnel - Rémunérations dues', type: 'Passif', balance: 800000 },
  { code: '431000', name: 'Sécurité sociale', type: 'Passif', balance: 450000 },
  { code: '444000', name: 'Etat - Impôts sur les bénéfices', type: 'Passif', balance: 350000 },
  { code: '445500', name: 'Etat - TVA à décaisser', type: 'Passif', balance: 280000 },
  { code: '521000', name: 'Banque', type: 'Actif', balance: 3500000 },
  { code: '531000', name: 'Caisse', type: 'Actif', balance: 500000 },
  { code: '601000', name: 'Achats de matières premières', type: 'Charge', balance: 2000000 },
  { code: '606000', name: 'Achats non stockés', type: 'Charge', balance: 800000 },
  { code: '613000', name: 'Locations', type: 'Charge', balance: 600000 },
  { code: '616000', name: 'Primes d\'assurance', type: 'Charge', balance: 350000 },
  { code: '622000', name: 'Rémunérations du personnel', type: 'Charge', balance: 1800000 },
  { code: '624000', name: 'Transports de biens', type: 'Charge', balance: 450000 },
  { code: '626000', name: 'Frais postaux et télécommunications', type: 'Charge', balance: 120000 },
  { code: '627000', name: 'Services bancaires', type: 'Charge', balance: 85000 },
  { code: '641000', name: 'Impôts et taxes', type: 'Charge', balance: 320000 },
  { code: '661000', name: 'Charges d\'intérêts', type: 'Charge', balance: 180000 },
  { code: '681000', name: 'Dotations aux amortissements', type: 'Charge', balance: 750000 },
  { code: '701000', name: 'Ventes de produits finis', type: 'Produit', balance: 5000000 },
  { code: '706000', name: 'Prestations de services', type: 'Produit', balance: 2500000 },
  { code: '708000', name: 'Produits des activités annexes', type: 'Produit', balance: 850000 },
  { code: '762000', name: 'Produits des participations', type: 'Produit', balance: 150000 },
  { code: '770000', name: 'Charges exceptionnelles', type: 'Charge', balance: 120000 },
  { code: '780000', name: 'Produits exceptionnels', type: 'Produit', balance: 95000 }
];

const OPERATIONS = [
  { date: '10/04/2026', reference: 'EC001', account: '521000', accountName: 'Banque', description: 'Paiement client Hôtel Mirador', debit: 0, credit: 850000, journal: 'VT', balance: 4350000 },
  { date: '10/04/2026', reference: 'EC002', account: '401000', accountName: 'Fournisseurs', description: 'Achat fournitures de bureau', debit: 45000, credit: 0, journal: 'AC', balance: 1455000 },
  { date: '10/04/2026', reference: 'EC003', account: '531000', accountName: 'Caisse', description: 'Vente au comptant - Restaurant', debit: 0, credit: 125000, journal: 'VT', balance: 625000 },
  { date: '09/04/2026', reference: 'EC004', account: '411000', accountName: 'Clients', description: 'Facture client ABC Corp', debit: 1200000, credit: 0, journal: 'VT', balance: 3700000 },
  { date: '09/04/2026', reference: 'EC005', account: '601000', accountName: 'Achats de matières premières', description: 'Achat produits alimentaires', debit: 350000, credit: 0, journal: 'AC', balance: 2350000 },
  { date: '09/04/2026', reference: 'EC006', account: '622000', accountName: 'Rémunérations du personnel', description: 'Salaires mois d\'avril', debit: 1800000, credit: 0, journal: 'OD', balance: 0 },
  { date: '08/04/2026', reference: 'EC007', account: '701000', accountName: 'Ventes de produits finis', description: 'Ventes chambres semaine', debit: 0, credit: 2500000, journal: 'VT', balance: 7500000 },
  { date: '08/04/2026', reference: 'EC008', account: '613000', accountName: 'Locations', description: 'Loyer local commercial', debit: 200000, credit: 0, journal: 'AC', balance: 400000 }
];


const CASH_BOOK = [
  { date: '10/04/2026', time: '23:45', type: 'Entrée', description: 'Clôture caisse Restaurant', amount: 285000, balance: 785000 },
  { date: '10/04/2026', time: '22:30', type: 'Entrée', description: 'Vente Bar - Cocktails', amount: 45000, balance: 500000 },
  { date: '10/04/2026', time: '21:15', type: 'Entrée', description: 'Paiement chambre 301', amount: 125000, balance: 455000 },
  { date: '10/04/2026', time: '20:00', type: 'Entrée', description: 'Vente Restaurant - Dîner', amount: 180000, balance: 330000 },
  { date: '10/04/2026', time: '18:30', type: 'Sortie', description: 'Achat provisions Restaurant', amount: 35000, balance: 150000 },
  { date: '10/04/2026', time: '16:45', type: 'Entrée', description: 'Paiement client 102', amount: 85000, balance: 185000 },
  { date: '10/04/2026', time: '14:30', type: 'Sortie', description: 'Frais livraison', amount: 15000, balance: 100000 },
  { date: '10/04/2026', time: '12:15', type: 'Entrée', description: 'Vente Restaurant - Déjeuner', amount: 115000, balance: 115000 },
  { date: '10/04/2026', time: '10:00', type: 'Sortie', description: 'Achat fournitures bureau', amount: 25000, balance: 0 },
  { date: '09/04/2026', time: '23:30', type: 'Entrée', description: 'Clôture caisse Bar', amount: 165000, balance: 165000 },
  { date: '09/04/2026', time: '22:00', type: 'Entrée', description: 'Vente Bar - Soft drinks', amount: 28000, balance: 137000 },
  { date: '09/04/2026', time: '20:30', type: 'Entrée', description: 'Paiement chambre 205', amount: 95000, balance: 109000 },
  { date: '09/04/2026', time: '18:45', type: 'Sortie', description: 'Achat boissons Bar', amount: 8000, balance: 14000 },
  { date: '09/04/2026', time: '16:00', type: 'Entrée', description: 'Vente Restaurant - Goûter', amount: 65000, balance: 22000 },
  { date: '09/04/2026', time: '14:20', type: 'Sortie', description: 'Tip personnel', amount: 5000, balance: -43000 }
];


const INTER_CASH_TRANSFERS = [
  { date: '10/04/2026', time: '23:50', from: 'Caisse Restaurant', to: 'Caisse Principale', amount: 285000, reason: 'Clôture journée Restaurant', status: 'Effectué', authorizedBy: 'JM Dupont' },
  { date: '10/04/2026', time: '22:45', from: 'Caisse Bar', to: 'Caisse Principale', amount: 165000, reason: 'Clôture journée Bar', status: 'Effectué', authorizedBy: 'JM Dupont' },
  { date: '10/04/2026', time: '14:30', from: 'Caisse Principale', to: 'Caisse Restaurant', amount: 75000, reason: 'Approvisionnement Restaurant', status: 'Effectué', authorizedBy: 'M Martin' },
  { date: '10/04/2026', time: '11:15', from: 'Caisse Principale', to: 'Caisse Bar', amount: 50000, reason: 'Approvisionnement Bar', status: 'Effectué', authorizedBy: 'M Martin' },
  { date: '10/04/2026', time: '09:00', from: 'Banque', to: 'Caisse Principale', amount: 300000, reason: 'Retrait liquide semaine', status: 'Effectué', authorizedBy: 'JM Dupont' },
  { date: '09/04/2026', time: '23:40', from: 'Caisse Restaurant', to: 'Caisse Principale', amount: 220000, reason: 'Clôture journée Restaurant', status: 'Effectué', authorizedBy: 'JM Dupont' },
  { date: '09/04/2026', time: '22:30', from: 'Caisse Bar', to: 'Caisse Principale', amount: 143000, reason: 'Clôture journée Bar', status: 'Effectué', authorizedBy: 'JM Dupont' },
  { date: '09/04/2026', time: '16:20', from: 'Caisse Principale', to: 'Caisse Réception', amount: 25000, reason: 'Monnaie réception', status: 'Effectué', authorizedBy: 'S Bernard' }
];

type ApiPlanComptable = {
  id: number;
  code: string;
  name: string;
  type: string;
  className: string;
  balance: number;
  status: string;
};

type ApiOperationComptable = {
  id: number;
  reference: string;
  date: string;
  accountCode: string;
  label: string;
  debitAmount: number;
  creditAmount: number;
  journalCode: string;
  status: string;
  createdBy: string;
};

type ApiBrouillardCaisse = {
  id: number;
  date: string;
  time: string;
  type: string;
  description: string;
  amount: number;
  balance: number;
  createdBy: string;
};

type ApiCashState = {
  cashRegisters: Array<{ id: number; registerNumber: string; status: string }>;
  cashTransfers: Array<{
    id: number;
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

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);
const toTimeInputValue = (date: Date) => date.toTimeString().slice(0, 5);
const toInputDate = (value: string) => (value.includes('T') ? value.slice(0, 10) : value.split('/').reverse().join('-'));

const exportCsv = (filename: string, rows: Record<string, string | number | undefined>[]) => {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(';')
    )
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const importCsv = (file: File, onRow: (row: Record<string, string>) => void) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.replace(/"/g, '').trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => row[h] = values[idx] || '');
      onRow(row);
    }
  };
  reader.readAsText(file);
};

const readCsvRows = (file: File) =>
  new Promise<Record<string, string>[]>((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier CSV.'));
    reader.onload = (event) => {
      try {
        const text = String(event.target?.result || '');
        const lines = text.split(/\r?\n/).filter((line) => line.trim());
        if (lines.length < 2) {
          resolve([]);
          return;
        }

        const headers = lines[0].split(';').map((header) => header.replace(/"/g, '').trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(';').map((value) => value.replace(/"/g, '').trim());
          const row: Record<string, string> = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          rows.push(row);
        }
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsText(file);
  });

type AccountFormState = {
  code: string;
  name: string;
  type: string;
  className: string;
  balance: string;
};

type OperationFormState = {
  date: string;
  journalCode: string;
  accountCode: string;
  label: string;
  debitAmount: string;
  creditAmount: string;
  reference: string;
};

type CashEntryFormState = {
  date: string;
  time: string;
  type: string;
  description: string;
  amount: string;
};

const JOURNAL_LABELS: Record<string, string> = {
  VT: 'Ventes',
  AC: 'Achats',
  OD: 'Operations Diverses',
  BQ: 'Banque',
  CA: 'Caisse'
};

type TransferFormState = {
  date: string;
  fromRegister: string;
  toRegister: string;
  amount: string;
  reason: string;
  requestedBy: string;
};

const Accounting: React.FC = () => {
  const { currencySymbol, formatAmount } = useAppSettings();
  const [activeSection, setActiveSection] = useState<AccountingSection>('plan');
  const [apiError, setApiError] = useState<string>('');
  const currentUserName = useMemo(() => readCurrentUserName(), []);
  const todayInput = useMemo(() => toDateInputValue(new Date()), []);
  const nowTimeInput = useMemo(() => toTimeInputValue(new Date()), []);

  const fallbackAccounts = useMemo<ApiPlanComptable[]>(
    () =>
      ACCOUNT_PLAN.map((account, index) => ({
        id: index + 1,
        code: account.code,
        name: account.name,
        type: account.type,
        className: account.code.substring(0, 3),
        balance: account.balance,
        status: 'Actif'
      })),
    []
  );

  const fallbackOperations = useMemo<ApiOperationComptable[]>(
    () =>
      OPERATIONS.map((operation, index) => ({
        id: index + 1,
        reference: operation.reference,
        date: operation.date,
        accountCode: operation.account,
        label: operation.description,
        debitAmount: operation.debit,
        creditAmount: operation.credit,
        journalCode: operation.journal,
        status: 'Valide',
        createdBy: readCurrentUserName()
      })),
    []
  );

  const fallbackCashBook = useMemo<ApiBrouillardCaisse[]>(
    () =>
      CASH_BOOK.map((entry, index) => ({
        id: index + 1,
        date: entry.date,
        time: entry.time,
        type: entry.type,
        description: entry.description,
        amount: entry.amount,
        balance: entry.balance,
        createdBy: readCurrentUserName()
      })),
    []
  );

  const fallbackTransfers = useMemo(
    () =>
      INTER_CASH_TRANSFERS.map((transfer, index) => ({
        id: index + 1,
        transferNumber: `TRF-MOCK-${String(index + 1).padStart(3, '0')}`,
        fromRegister: transfer.from,
        toRegister: transfer.to,
        amount: transfer.amount,
        reason: transfer.reason,
        status: 'completed',
        requestedBy: transfer.authorizedBy,
        approvedBy: transfer.authorizedBy,
        transferDate: `${transfer.date.split('/').reverse().join('-')}T${transfer.time}:00`
      })),
    []
  );

  const [accounts, setAccounts] = useState<ApiPlanComptable[]>(fallbackAccounts);
  const [operations, setOperations] = useState<ApiOperationComptable[]>(fallbackOperations);
  const [cashBookEntries, setCashBookEntries] = useState<ApiBrouillardCaisse[]>(fallbackCashBook);
  const [cashState, setCashState] = useState<ApiCashState>({ cashRegisters: [], cashTransfers: fallbackTransfers });
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editingOperationId, setEditingOperationId] = useState<number | null>(null);
  const [editingCashEntryId, setEditingCashEntryId] = useState<number | null>(null);
  const [accountForm, setAccountForm] = useState<AccountFormState>({
    code: '',
    name: '',
    type: 'Actif',
    className: '',
    balance: '0'
  });
  const [operationForm, setOperationForm] = useState<OperationFormState>({
    date: todayInput,
    journalCode: 'VT',
    accountCode: '',
    label: '',
    debitAmount: '0',
    creditAmount: '0',
    reference: ''
  });
  const [cashEntryForm, setCashEntryForm] = useState<CashEntryFormState>({
    date: todayInput,
    time: nowTimeInput,
    type: 'Entree',
    description: '',
    amount: ''
  });
  const [transferForm, setTransferForm] = useState<TransferFormState>({
    date: todayInput,
    fromRegister: '',
    toRegister: '',
    amount: '',
    reason: '',
    requestedBy: currentUserName
  });
  const [operationFilterDate, setOperationFilterDate] = useState('');
  const [operationFilterJournal, setOperationFilterJournal] = useState('');
  const [journalBookFilterDate, setJournalBookFilterDate] = useState('');
  const [journalBookFilterCode, setJournalBookFilterCode] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<ApiPlanComptable[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);

  const cashRegisterOptions = useMemo(() => {
    const registerNames = (cashState.cashRegisters || []).map((register) => register.registerNumber).filter(Boolean);
    const fallbackNames = ['Banque', 'Caisse Principale', 'Caisse Restaurant', 'Caisse Bar', 'Caisse Reception'];
    return Array.from(new Set([...registerNames, ...fallbackNames]));
  }, [cashState.cashRegisters]);

  const JOURNAL_DAYS = useMemo(() => {
    const groups = new Map<string, { totalDebit: number; totalCredit: number; operations: number; journals: Set<string>; hasDraft: boolean }>();
    operations.forEach((op) => {
      const dateKey = toInputDate(op.date);
      const group = groups.get(dateKey) || { totalDebit: 0, totalCredit: 0, operations: 0, journals: new Set<string>(), hasDraft: false };
      group.totalDebit += op.debitAmount || 0;
      group.totalCredit += op.creditAmount || 0;
      group.operations += 1;
      if (op.journalCode) group.journals.add(op.journalCode);
      if ((op.status || '').toLowerCase().includes('brouillon') || (op.status || '').toLowerCase().includes('attente')) group.hasDraft = true;
      groups.set(dateKey, group);
    });

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, group]) => ({
        date: new Date(dateKey).toLocaleDateString('fr-FR'),
        totalDebit: group.totalDebit,
        totalCredit: group.totalCredit,
        operations: group.operations,
        status: group.hasDraft ? 'En cours' : 'Validé',
        journals: Array.from(group.journals)
      }));
  }, [operations]);

  const filteredOperations = useMemo(() => {
    return operations.filter((operation) => {
      const matchesDate = !operationFilterDate || toInputDate(operation.date) === operationFilterDate;
      const matchesJournal = !operationFilterJournal || operation.journalCode === operationFilterJournal;
      return matchesDate && matchesJournal;
    });
  }, [operations, operationFilterDate, operationFilterJournal]);

  const JOURNAL_BOOK = useMemo(() => {
    const groups = new Map<string, { date: string; code: string; totalDebit: number; totalCredit: number; operations: number; hasDraft: boolean }>();
    operations.forEach((op) => {
      const dateKey = toInputDate(op.date);
      const code = op.journalCode || 'N/A';
      const key = `${dateKey}|${code}`;
      const group = groups.get(key) || { date: dateKey, code, totalDebit: 0, totalCredit: 0, operations: 0, hasDraft: false };
      group.totalDebit += op.debitAmount || 0;
      group.totalCredit += op.creditAmount || 0;
      group.operations += 1;
      if ((op.status || '').toLowerCase().includes('brouillon') || (op.status || '').toLowerCase().includes('attente')) group.hasDraft = true;
      groups.set(key, group);
    });

    const journalNames: Record<string, string> = {
      VT: 'Journal des Ventes',
      AC: 'Journal des Achats',
      OD: 'Journal des Opérations Diverses',
      BQ: 'Journal de Banque',
      CA: 'Journal de Caisse'
    };

    return Array.from(groups.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((group) => ({
        date: new Date(group.date).toLocaleDateString('fr-FR'),
        code: group.code,
        name: journalNames[group.code] || `Journal ${group.code}`,
        operations: group.operations,
        totalDebit: group.totalDebit,
        totalCredit: group.totalCredit,
        status: group.hasDraft ? 'En cours' : 'Validé'
      }));
  }, [operations]);

  const filteredJournalBook = useMemo(() => {
    return JOURNAL_BOOK.filter((journal) => {
      const matchesDate = !journalBookFilterDate || journal.date === new Date(journalBookFilterDate).toLocaleDateString('fr-FR');
      const matchesCode = !journalBookFilterCode || journal.code === journalBookFilterCode;
      return matchesDate && matchesCode;
    });
  }, [JOURNAL_BOOK, journalBookFilterDate, journalBookFilterCode]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setApiError('');
      try {
        const [accountsResponse, operationsResponse, cashBookResponse, cashStateResponse] = await Promise.all([
          apiRequest<ApiPlanComptable[]>('GET', '/api/accounting/accounts'),
          apiRequest<ApiOperationComptable[]>('GET', '/api/accounting/operations'),
          apiRequest<ApiBrouillardCaisse[]>('GET', '/api/accounting/cash-book'),
          apiRequest<ApiCashState>('GET', '/api/cash/accounting')
        ]);

        if (cancelled) return;
        if (Array.isArray(accountsResponse)) setAccounts(accountsResponse.length > 0 ? accountsResponse : fallbackAccounts);
        if (Array.isArray(operationsResponse)) setOperations(operationsResponse.length > 0 ? operationsResponse : fallbackOperations);
        if (Array.isArray(cashBookResponse)) setCashBookEntries(cashBookResponse.length > 0 ? cashBookResponse : fallbackCashBook);
        if (cashStateResponse?.cashTransfers) setCashState(cashStateResponse);
      } catch (error: any) {
        if (cancelled) return;
        setApiError(error?.message || 'Impossible de charger les donnees Accounting depuis le backend.');
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [fallbackAccounts, fallbackCashBook, fallbackOperations, fallbackTransfers]);

  const handleAccountSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');

    const payload = {
      code: accountForm.code.trim(),
      name: accountForm.name.trim(),
      type: accountForm.type,
      className: accountForm.className.trim() || accountForm.code.trim().substring(0, 3),
      balance: Number(accountForm.balance) || 0,
      status: 'Actif'
    };

    if (!payload.code || !payload.name) {
      setApiError('Renseignez le code et le nom du compte.');
      return;
    }

    try {
      const saved = editingAccountId
        ? await apiRequest<ApiPlanComptable>('PUT', `/api/accounting/accounts/${editingAccountId}`, payload)
        : await apiRequest<ApiPlanComptable>('POST', '/api/accounting/accounts', payload);
      setAccounts((previous) => [saved, ...previous.filter((account) => account.id !== saved.id && account.code !== saved.code)]);
      setAccountForm({ code: '', name: '', type: 'Actif', className: '', balance: '0' });
      setEditingAccountId(null);
    } catch (error: any) {
      setApiError(error?.message || "Impossible d'enregistrer le compte.");
    }
  };

  const handleOperationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');

    const debitAmount = Number(operationForm.debitAmount) || 0;
    const creditAmount = Number(operationForm.creditAmount) || 0;
    const payload = {
      reference: operationForm.reference.trim() || `EC-${Date.now()}`,
      date: `${operationForm.date || todayInput}T00:00:00`,
      accountCode: operationForm.accountCode.trim(),
      label: operationForm.label.trim(),
      debitAmount,
      creditAmount,
      journalCode: operationForm.journalCode,
      status: 'Brouillon',
      createdBy: currentUserName
    };

    if (!payload.accountCode || !payload.label || (debitAmount <= 0 && creditAmount <= 0)) {
      setApiError('Renseignez le compte, le libelle et au moins un montant.');
      return;
    }

    try {
      const saved = editingOperationId
        ? await apiRequest<ApiOperationComptable>('PUT', `/api/accounting/operations/${editingOperationId}`, payload)
        : await apiRequest<ApiOperationComptable>('POST', '/api/accounting/operations', payload);
      setOperations((previous) => [saved, ...previous.filter((operation) => operation.id !== saved.id)]);
      setOperationForm({
        date: todayInput,
        journalCode: operationForm.journalCode,
        accountCode: '',
        label: '',
        debitAmount: '0',
        creditAmount: '0',
        reference: ''
      });
      setEditingOperationId(null);
    } catch (error: any) {
      setApiError(error?.message || "Impossible d'enregistrer l'operation.");
    }
  };

  const handleCashEntrySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');

    const amount = Number(cashEntryForm.amount) || 0;
    const lastBalance = cashBookEntries[cashBookEntries.length - 1]?.balance || 0;
    const signedAmount = cashEntryForm.type === 'Sortie' ? -amount : amount;
    const payload = {
      date: cashEntryForm.date || todayInput,
      time: `${cashEntryForm.time || nowTimeInput}:00`,
      type: cashEntryForm.type,
      description: cashEntryForm.description.trim(),
      amount,
      balance: lastBalance + signedAmount,
      createdBy: currentUserName
    };

    if (!payload.description || amount <= 0) {
      setApiError('Renseignez la description et un montant positif.');
      return;
    }

    try {
      const saved = editingCashEntryId
        ? await apiRequest<ApiBrouillardCaisse>('PUT', `/api/accounting/cash-book/${editingCashEntryId}`, payload)
        : await apiRequest<ApiBrouillardCaisse>('POST', '/api/accounting/cash-book', payload);
      setCashBookEntries((previous) => [...previous.filter((entry) => entry.id !== saved.id), saved]);
      setCashEntryForm({ date: todayInput, time: nowTimeInput, type: 'Entree', description: '', amount: '' });
      setEditingCashEntryId(null);
    } catch (error: any) {
      setApiError(error?.message || "Impossible d'enregistrer le mouvement de caisse.");
    }
  };

  const handleTransferSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setApiError('');

    const amount = Number(transferForm.amount) || 0;
    const payload = {
      fromRegister: transferForm.fromRegister,
      toRegister: transferForm.toRegister,
      amount,
      reason: transferForm.reason.trim(),
      requestedBy: transferForm.requestedBy.trim() || currentUserName,
      transferDate: `${transferForm.date || todayInput}T00:00:00`
    };

    if (!payload.fromRegister || !payload.toRegister || !payload.reason || amount <= 0) {
      setApiError('Renseignez les caisses, le motif et un montant positif.');
      return;
    }

    try {
      await apiRequest('POST', '/api/cash/accounting/transfers', payload);
      const refreshed = await apiRequest<ApiCashState>('GET', '/api/cash/accounting');
      setCashState(refreshed);
      setTransferForm({ date: todayInput, fromRegister: '', toRegister: '', amount: '', reason: '', requestedBy: currentUserName });
    } catch (error: any) {
      setApiError(error?.message || "Impossible d'enregistrer le transfert.");
    }
  };

  const deleteAccount = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/accounting/accounts/${id}`);
      setAccounts((previous) => previous.filter((account) => account.id !== id));
    } catch (error: any) {
      setApiError(error?.message || "Impossible de supprimer le compte.");
    }
  };

  const deleteOperation = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/accounting/operations/${id}`);
      setOperations((previous) => previous.filter((operation) => operation.id !== id));
    } catch (error: any) {
      setApiError(error?.message || "Impossible de supprimer l'opération.");
    }
  };

  const deleteCashEntry = async (id: number) => {
    try {
      await apiRequest('DELETE', `/api/accounting/cash-book/${id}`);
      setCashBookEntries((previous) => previous.filter((entry) => entry.id !== id));
    } catch (error: any) {
      setApiError(error?.message || "Impossible de supprimer l'entrée de caisse.");
    }
  };

  const cancelTransfer = async (transferId: number) => {
    try {
      await apiRequest('PUT', `/api/cash/accounting/transfers/${transferId}/cancel`);
      const refreshed = await apiRequest<ApiCashState>('GET', '/api/cash/accounting');
      setCashState(refreshed);
    } catch (error: any) {
      setApiError(error?.message || 'Impossible d’annuler le transfert.');
    }
  };

  const deleteTransfer = async (transferId: number) => {
    try {
      await apiRequest('DELETE', `/api/cash/accounting/transfers/${transferId}`);
      const refreshed = await apiRequest<ApiCashState>('GET', '/api/cash/accounting');
      setCashState(refreshed);
    } catch (error: any) {
      setApiError(error?.message || 'Impossible de supprimer le transfert.');
    }
  };

  const startAccountEdit = (account: ApiPlanComptable) => {
    setEditingAccountId(account.id);
    setAccountForm({
      code: account.code,
      name: account.name,
      type: account.type,
      className: account.className || account.code.substring(0, 3),
      balance: String(account.balance ?? 0)
    });
    setApiError(`Modification du compte ${account.code}.`);
  };

  const startOperationEdit = (operation: ApiOperationComptable) => {
    setEditingOperationId(operation.id);
    setOperationForm({
      date: toInputDate(operation.date),
      journalCode: operation.journalCode,
      accountCode: operation.accountCode,
      label: operation.label,
      debitAmount: String(operation.debitAmount ?? 0),
      creditAmount: String(operation.creditAmount ?? 0),
      reference: operation.reference
    });
    setApiError(`Modification de l'operation ${operation.reference}.`);
  };

  const startCashEntryEdit = (entry: ApiBrouillardCaisse) => {
    setEditingCashEntryId(entry.id);
    setCashEntryForm({
      date: toInputDate(entry.date),
      time: entry.time?.slice(0, 5) || nowTimeInput,
      type: entry.type,
      description: entry.description,
      amount: String(entry.amount ?? 0)
    });
    setApiError(`Modification du mouvement de caisse #${entry.id}.`);
  };

  const showDetails = (message: string) => setApiError(message);

  const startOperationEntry = (journalCode = operationForm.journalCode || 'VT') => {
    setEditingOperationId(null);
    setOperationForm({
      date: todayInput,
      journalCode,
      accountCode: '',
      label: '',
      debitAmount: '0',
      creditAmount: '0',
      reference: ''
    });
    setActiveSection('operations');
    setApiError(`Saisie ouverte pour le journal ${journalCode} - ${JOURNAL_LABELS[journalCode] || 'Journal comptable'}.`);
  };

  const handleImportOperations = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        setApiError('');
        const rows = await readCsvRows(file);
        if (!rows.length) {
          setApiError('Fichier CSV vide ou invalide.');
          return;
        }

        const importedOperations: ApiOperationComptable[] = [];
        for (const [index, row] of rows.entries()) {
          const accountCode = row.Compte || row.compte || row.accountCode || row.AccountCode || row.Numcompte || row.numcompte || '';
          const label = row.Libelle || row['Libellé'] || row.libelle || row.label || row.Description || row.description || '';
          const debitAmount = Number(row.Debit || row['Débit'] || row.debit || row.debitAmount || 0) || 0;
          const creditAmount = Number(row.Credit || row['Crédit'] || row.credit || row.creditAmount || 0) || 0;
          const journalCode = (row.Journal || row.journal || row.journalCode || operationForm.journalCode || 'VT').trim().toUpperCase();
          const rawDate = row.Date || row.date || todayInput;
          const date = rawDate.includes('/') ? toInputDate(rawDate) : rawDate.slice(0, 10);

          if (!accountCode || !label || (debitAmount <= 0 && creditAmount <= 0)) {
            continue;
          }

          const payload = {
            reference: (row.Reference || row.reference || `IMP-${Date.now()}-${index + 1}`).trim(),
            date: `${date || todayInput}T00:00:00`,
            accountCode: accountCode.trim(),
            label: label.trim(),
            debitAmount,
            creditAmount,
            journalCode,
            status: 'Brouillon',
            createdBy: currentUserName
          };

          const saved = await apiRequest<ApiOperationComptable>('POST', '/api/accounting/operations', payload);
          importedOperations.push(saved);
        }

        if (!importedOperations.length) {
          setApiError('Aucune ligne exploitable trouvee dans le fichier.');
          return;
        }

        setOperations((previous) => [
          ...importedOperations.reverse(),
          ...previous.filter((operation) => !importedOperations.some((imported) => imported.id === operation.id))
        ]);
        setApiError(`${importedOperations.length} operation(s) importee(s) via /api/accounting/operations.`);
      } catch (error: any) {
        setApiError(error?.message || "Impossible d'importer les operations.");
      }
    };
    input.click();
  };

  const handleImportAccounts = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length < 2) {
            setApiError('Fichier CSV vide ou invalide.');
            return;
          }
          const headers = lines[0].split(';').map(h => h.replace(/"/g, '').trim());
          const previewData: ApiPlanComptable[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(';').map(v => v.replace(/"/g, '').trim());
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => row[h] = values[idx] || '');
            const newAccount: ApiPlanComptable = {
              id: Date.now() + Math.random(),
              code: row.Code || row.code || '',
              name: row.Nom || row.name || '',
              type: row.Type || row.type || 'Actif',
              className: row.Classe || row.className || '',
              balance: Number(row.Solde || row.balance || 0),
              status: row.Statut || row.status || 'Actif'
            };
            if (newAccount.code && newAccount.name) {
              previewData.push(newAccount);
            }
          }
          setImportPreview(previewData);
          setShowImportModal(true);
          setApiError(`${previewData.length} comptes prets a l'import. Verifiez et confirmez.`);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const confirmImport = async () => {
    if (!importPreview.length) return;
    setApiError('');

    const importedAccounts: ApiPlanComptable[] = [];
    const failures: string[] = [];

    for (const account of importPreview) {
      const payload = {
        code: account.code.trim(),
        name: account.name.trim(),
        type: account.type,
        className: account.className || account.code.trim().substring(0, 3),
        balance: Number(account.balance) || 0,
        status: account.status || 'Actif'
      };

      try {
        const saved = await apiRequest<ApiPlanComptable>('POST', '/api/accounting/accounts', payload);
        importedAccounts.push(saved);
      } catch (error: any) {
        failures.push(`${account.code || '(sans code)'}: ${error?.message || 'erreur inconnue'}`);
      }
    }

    if (importedAccounts.length) {
      setAccounts((previous) => [
        ...importedAccounts,
        ...previous.filter((acc) => !importedAccounts.some((imported) => imported.id === acc.id || imported.code === acc.code))
      ]);
    }

    setImportPreview([]);
    setShowImportModal(false);

    if (failures.length) {
      setApiError(`${importedAccounts.length} compte(s) importe(s) via /api/accounting/accounts. ${failures.length} echec(s): ${failures.join('; ')}`);
    } else {
      setApiError(`${importedAccounts.length} compte(s) importe(s) avec succes via /api/accounting/accounts.`);
    }
  };

  const cancelImport = () => {
    setImportPreview([]);
    setShowImportModal(false);
    setApiError('Import annule.');
  };

  const updatePreviewAccount = (index: number, field: keyof ApiPlanComptable, value: string | number) => {
    setImportPreview(prev => prev.map((acc, i) => i === index ? { ...acc, [field]: value } : acc));
  };

  const exportAccounts = () => exportCsv('plan_comptable.csv', accounts.map((account) => ({
    Code: account.code,
    Nom: account.name,
    Type: account.type,
    Classe: account.className || account.code.substring(0, 3),
    Solde: account.balance,
    Statut: account.status
  })));

  const exportOperations = () => exportCsv('operations_comptables.csv', filteredOperations.map((operation) => ({
    Date: operation.date.includes('T') ? new Date(operation.date).toLocaleDateString('fr-FR') : operation.date,
    Reference: operation.reference,
    Compte: operation.accountCode,
    Libelle: operation.label,
    Debit: operation.debitAmount,
    Credit: operation.creditAmount,
    Journal: operation.journalCode,
    Statut: operation.status
  })));

  const exportCashBook = () => exportCsv('brouillard_caisse.csv', cashBookEntries.map((entry) => ({
    Date: entry.date.includes('-') ? new Date(entry.date).toLocaleDateString('fr-FR') : entry.date,
    Heure: entry.time?.slice(0, 5),
    Type: entry.type,
    Description: entry.description,
    Montant: entry.amount,
    Solde: entry.balance,
    CreePar: entry.createdBy
  })));

  const exportJournalDays = () => exportCsv('journees_comptables.csv', JOURNAL_DAYS.map((day) => ({
    Date: day.date,
    TotalDebit: day.totalDebit,
    TotalCredit: day.totalCredit,
    Operations: day.operations,
    Journaux: day.journals.join(' / '),
    Statut: day.status
  })));

  const exportJournalBook = () => exportCsv('brouillard_journaux.csv', JOURNAL_BOOK.map((journal) => ({
    Date: journal.date,
    Code: journal.code,
    Journal: journal.name,
    Operations: journal.operations,
    TotalDebit: journal.totalDebit,
    TotalCredit: journal.totalCredit,
    Statut: journal.status
  })));

  const exportTransfers = () => exportCsv('transferts_inter_caisse.csv', interCashTransfers.map((transfer) => ({
    Date: transfer.date,
    Heure: transfer.time,
    De: transfer.from,
    Vers: transfer.to,
    Montant: transfer.amount,
    Motif: transfer.reason,
    AutorisePar: transfer.authorizedBy,
    Statut: transfer.status
  })));

  const exportBalance = () => exportCsv('balance_generale.csv', accounts.map((account) => ({
    Compte: account.code,
    Libelle: account.name,
    SoldeDebiteur: account.type === 'Actif' || account.type === 'Charge' ? account.balance : '',
    SoldeCrediteur: account.type === 'Passif' || account.type === 'Produit' ? account.balance : '',
    Type: account.type
  })));

  const interCashTransfers = useMemo(() => {
    return (cashState.cashTransfers || []).map((transfer) => {
      const dt = transfer.transferDate ? new Date(transfer.transferDate) : null;
      return {
        id: transfer.id,
        date: dt ? dt.toLocaleDateString('fr-FR') : '-',
        time: dt ? dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-',
        from: transfer.fromRegister,
        to: transfer.toRegister,
        amount: transfer.amount,
        reason: transfer.reason,
        authorizedBy: transfer.approvedBy || transfer.requestedBy,
        status: transfer.status
      };
    });
  }, [cashState.cashTransfers]);

  const renderContent = () => {
    switch (activeSection) {
      case 'plan':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => { setEditingAccountId(null); setAccountForm({ code: '', name: '', type: 'Actif', className: '', balance: '0' }); setApiError('Formulaire nouveau compte pret.'); }} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Ajouter un compte
                </button>
                <button type="button" onClick={handleImportAccounts} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaUpload /></span> Importer
                </button>
                <button type="button" onClick={exportAccounts} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaDownload /></span> Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Rechercher un compte..."
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les types</option>
                  <option value="actif">Actif</option>
                  <option value="passif">Passif</option>
                  <option value="charge">Charge</option>
                  <option value="produit">Produit</option>
                </select>
              </div>
            </div>
            
            <form onSubmit={handleAccountSubmit} className="bg-white/5 border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Ajouter un compte</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
                  <input
                    type="text"
                    value={accountForm.code}
                    onChange={(event) => setAccountForm((previous) => ({ ...previous, code: event.target.value, className: event.target.value.substring(0, 3) }))}
                    placeholder="401000"
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Nom du compte</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(event) => setAccountForm((previous) => ({ ...previous, name: event.target.value }))}
                    placeholder="Libelle du compte"
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(event) => setAccountForm((previous) => ({ ...previous, type: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Actif">Actif</option>
                    <option value="Passif">Passif</option>
                    <option value="Charge">Charge</option>
                    <option value="Produit">Produit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Solde</label>
                  <input
                    type="number"
                    min="0"
                    value={accountForm.balance}
                    onChange={(event) => setAccountForm((previous) => ({ ...previous, balance: event.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Classe</label>
                  <input
                    type="text"
                    value={accountForm.className}
                    onChange={(event) => setAccountForm((previous) => ({ ...previous, className: event.target.value }))}
                    placeholder="401"
                    className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-4 flex items-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Enregistrer le compte
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Nom du compte</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Classe</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {account.code}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{account.name}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{account.name}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.type === 'Actif' ? 'bg-blue-500/20 text-blue-400' :
                          account.type === 'Passif' ? 'bg-green-500/20 text-green-400' :
                          account.type === 'Charge' ? 'bg-red-500/20 text-red-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {account.type}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">{account.className || account.code.substring(0, 3)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {account.balance.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.status === 'Inactif' ? 'bg-gray-500/20 text-gray-300' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {account.status || 'Actif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => startAccountEdit(account)} className="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                        <button type="button" onClick={() => deleteAccount(account.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Affichage de 1 à {accounts.length} sur {accounts.length} comptes
              </div>
            </div>
          </div>
        );

      // Import preview modal
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700/50 rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import ({importPreview.length} comptes)</h3>
              <button onClick={cancelImport} className="text-gray-400 hover:text-white">
                <span className="w-6 h-6 flex items-center justify-center">×</span>
              </button>
            </div>
            <div className="flex-1 overflow-auto mb-4">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Code</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Nom</th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-gray-400 md:table-cell">Type</th>
                    <th className="hidden px-3 py-2 text-left text-xs font-medium text-gray-400 md:table-cell">Classe</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Solde</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Statut</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {importPreview.map((account, index) => (
                    <tr key={index} className="hover:bg-white/5">
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={account.code}
                          onChange={(e) => updatePreviewAccount(index, 'code', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={account.name}
                          onChange={(e) => updatePreviewAccount(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        />
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <select
                          value={account.type}
                          onChange={(e) => updatePreviewAccount(index, 'type', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        >
                          <option value="Actif">Actif</option>
                          <option value="Passif">Passif</option>
                          <option value="Charge">Charge</option>
                          <option value="Produit">Produit</option>
                        </select>
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
                        <input
                          type="text"
                          value={account.className}
                          onChange={(e) => updatePreviewAccount(index, 'className', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={account.balance}
                          onChange={(e) => updatePreviewAccount(index, 'balance', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={account.status}
                          onChange={(e) => updatePreviewAccount(index, 'status', e.target.value)}
                          className="w-full px-2 py-1 bg-gray-800 border border-gray-600/50 rounded text-sm text-white"
                        >
                          <option value="Actif">Actif</option>
                          <option value="Inactif">Inactif</option>
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setImportPreview(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={cancelImport} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5">
                Annuler
              </button>
              <button onClick={confirmImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                Confirmer l'import ({importPreview.length} comptes)
              </button>
            </div>
          </div>
        </div>
      )}

      case 'operations':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => startOperationEntry('VT')} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Nouvelle opération
                </button>
                <button type="button" onClick={handleImportOperations} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaUpload /></span> Importer
                </button>
                <button type="button" onClick={exportOperations} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaDownload /></span> Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={operationFilterDate}
                  onChange={(e) => setOperationFilterDate(e.target.value)}
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={operationFilterJournal}
                  onChange={(e) => setOperationFilterJournal(e.target.value)}
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tous les journaux</option>
                  <option value="VT">VT - Ventes</option>
                  <option value="AC">AC - Achats</option>
                  <option value="OD">OD - Opérations Diverses</option>
                  <option value="BQ">BQ - Banque</option>
                  <option value="CA">CA - Caisse</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleOperationSubmit} className="bg-white/5 border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Saisie rapide d'operation</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" value={operationForm.date} onChange={(event) => setOperationForm((previous) => ({ ...previous, date: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Journal</label>
                  <select value={operationForm.journalCode} onChange={(event) => setOperationForm((previous) => ({ ...previous, journalCode: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="VT">VT - Ventes</option>
                    <option value="AC">AC - Achats</option>
                    <option value="OD">OD - Operations Diverses</option>
                    <option value="BQ">BQ - Banque</option>
                    <option value="CA">CA - Caisse</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Compte</label>
                  <input type="text" value={operationForm.accountCode} onChange={(event) => setOperationForm((previous) => ({ ...previous, accountCode: event.target.value }))} placeholder="Code compte" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Libelle</label>
                  <input type="text" value={operationForm.label} onChange={(event) => setOperationForm((previous) => ({ ...previous, label: event.target.value }))} placeholder="Description" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Debit</label>
                  <input type="number" min="0" value={operationForm.debitAmount} onChange={(event) => setOperationForm((previous) => ({ ...previous, debitAmount: event.target.value }))} placeholder="0" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Credit</label>
                  <input type="number" min="0" value={operationForm.creditAmount} onChange={(event) => setOperationForm((previous) => ({ ...previous, creditAmount: event.target.value }))} placeholder="0" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Reference</label>
                  <input type="text" value={operationForm.reference} onChange={(event) => setOperationForm((previous) => ({ ...previous, reference: event.target.value }))} placeholder="Ref" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Enregistrer
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Référence</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Compte</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Libellé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Débit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Crédit</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Journal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredOperations.map((operation) => (
                    <tr key={operation.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {operation.date.includes('T') ? new Date(operation.date).toLocaleDateString('fr-FR') : operation.date}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{operation.accountCode}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-medium text-white md:table-cell">{operation.reference}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{operation.accountCode}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">{operation.label}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {operation.debitAmount > 0 ? `${operation.debitAmount.toLocaleString('fr-FR')} ${currencySymbol}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {operation.creditAmount > 0 ? `${operation.creditAmount.toLocaleString('fr-FR')} ${currencySymbol}` : '-'}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-500/20 text-blue-400">
                          {operation.journalCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => startOperationEdit(operation)} className="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                        <button type="button" onClick={() => deleteOperation(operation.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Total: {operations.length} opérations
              </div>
            </div>
          </div>
        );

      case 'journals':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => startOperationEntry('VT')} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Nouvelle journée
                </button>
                <button type="button" onClick={() => setApiError("Aucun endpoint de cloture comptable n'est disponible: la journee reste une synthese des operations saisies/exportables.")} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaCheck /></span> Clôturer journée
                </button>
                <button type="button" onClick={exportJournalDays} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaDownload /></span> Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les statuts</option>
                  <option value="validé">Validé</option>
                  <option value="en cours">En cours</option>
                  <option value="brouillon">Brouillon</option>
                </select>
              </div>
            </div>
            
            {/* Résumé des journées */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total journées</div>
                <div className="text-2xl font-bold text-white">{JOURNAL_DAYS.length}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Validées</div>
                <div className="text-2xl font-bold text-green-400">
                  {JOURNAL_DAYS.filter(d => d.status === 'Validé').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">En cours</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {JOURNAL_DAYS.filter(d => d.status === 'En cours').length}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total opérations</div>
                <div className="text-2xl font-bold text-blue-400">
                  {JOURNAL_DAYS.reduce((sum, d) => sum + d.operations, 0)}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Total Débit</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Total Crédit</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Opérations</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Journaux</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {JOURNAL_DAYS.map((day) => (
                    <tr key={day.date} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {day.date}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{day.totalDebit.toLocaleString('fr-FR')} {currencySymbol}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                        {day.totalDebit.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                        {day.totalCredit.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{day.operations}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                        {day.journals.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          day.status === 'Validé' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {day.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => showDetails(`Journee ${day.date}: debit ${day.totalDebit.toLocaleString('fr-FR')} ${currencySymbol}, credit ${day.totalCredit.toLocaleString('fr-FR')} ${currencySymbol}.`)} className="text-indigo-600 hover:text-indigo-900 mr-3">Voir</button>
                        <button type="button" onClick={() => window.print()} className="text-gray-400 hover:text-white mr-3">Imprimer</button>
                        <button type="button" onClick={() => showDetails(`La journee ${day.date} est une synthese calculee et ne peut pas etre supprimee directement.`)} className="text-red-400 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Affichage de {JOURNAL_DAYS.length} journées
              </div>
            </div>
          </div>
        );

      case 'cash_book':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => { setEditingCashEntryId(null); setCashEntryForm({ date: todayInput, time: nowTimeInput, type: 'Entree', description: '', amount: '' }); setApiError('Saisie d entree de caisse prete.'); }} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Entrée
                </button>
                <button type="button" onClick={() => { setEditingCashEntryId(null); setCashEntryForm({ date: todayInput, time: nowTimeInput, type: 'Sortie', description: '', amount: '' }); setApiError('Saisie de sortie de caisse prete.'); }} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Sortie
                </button>
                <button type="button" onClick={() => setApiError(`Cloture: solde actuel ${cashBookEntries[cashBookEntries.length - 1]?.balance?.toLocaleString('fr-FR') || '0'} ${currencySymbol}.`)} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaCheck /></span> Clôturer
                </button>
                <button type="button" onClick={exportCashBook} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaDownload /></span> Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les types</option>
                  <option value="entrée">Entrée</option>
                  <option value="sortie">Sortie</option>
                </select>
              </div>
            </div>
            
            {/* Solde actuel */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Solde initial</div>
                <div className="text-2xl font-bold text-white">0 {currencySymbol}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Solde actuel</div>
                <div className="text-2xl font-bold text-blue-400">
                  {cashBookEntries[cashBookEntries.length - 1]?.balance?.toLocaleString('fr-FR') || '0'} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total mouvements</div>
                <div className="text-2xl font-bold text-green-400">
                  {cashBookEntries.length} opérations
                </div>
              </div>
            </div>
            
            <form onSubmit={handleCashEntrySubmit} className="bg-white/5 border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Nouveau mouvement de caisse</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" value={cashEntryForm.date} onChange={(event) => setCashEntryForm((previous) => ({ ...previous, date: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Heure</label>
                  <input type="time" value={cashEntryForm.time} onChange={(event) => setCashEntryForm((previous) => ({ ...previous, time: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select value={cashEntryForm.type} onChange={(event) => setCashEntryForm((previous) => ({ ...previous, type: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="Entree">Entree</option>
                    <option value="Sortie">Sortie</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <input type="text" value={cashEntryForm.description} onChange={(event) => setCashEntryForm((previous) => ({ ...previous, description: event.target.value }))} placeholder="Description" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Montant</label>
                  <input type="number" min="0" value={cashEntryForm.amount} onChange={(event) => setCashEntryForm((previous) => ({ ...previous, amount: event.target.value }))} placeholder="0" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-6 flex justify-end">
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Enregistrer le mouvement
                  </button>
                </div>
              </div>
            </form>

            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Heure</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Solde</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {cashBookEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {entry.date.includes('-') ? new Date(entry.date).toLocaleDateString('fr-FR') : entry.date}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{entry.description}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{entry.time?.slice(0, 5) || '-'}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          entry.type === 'Entrée' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">{entry.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {entry.amount.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm font-medium text-white md:table-cell">
                        {entry.balance.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => startCashEntryEdit(entry)} className="text-indigo-600 hover:text-indigo-900 mr-3">Modifier</button>
                        <button type="button" onClick={() => deleteCashEntry(entry.id)} className="text-red-400 hover:text-red-300">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Affichage de {cashBookEntries.length} mouvements
              </div>
            </div>
          </div>
        );

      case 'journal_book':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => startOperationEntry('OD')} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaPlus /></span> Nouveau journal
                </button>
                <button type="button" onClick={() => showDetails("Aucun endpoint de validation globale des journaux n'est disponible: les journaux affiches restent des syntheses des operations.")} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaCheck /></span> Valider tous
                </button>
                <button type="button" onClick={exportJournalBook} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  <span className="w-4 h-4"><FaDownload /></span> Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Tous les journaux</option>
                  <option value="VT">VT - Ventes</option>
                  <option value="AC">AC - Achats</option>
                  <option value="OD">OD - Opérations Diverses</option>
                  <option value="BQ">BQ - Banque</option>
                  <option value="CA">CA - Caisse</option>
                </select>
              </div>
            </div>
            
            {/* Résumé des journaux */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total journaux</div>
                <div className="text-2xl font-bold text-white">{JOURNAL_BOOK.length}</div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total débit</div>
                <div className="text-2xl font-bold text-red-400">
                  {JOURNAL_BOOK.reduce((sum, j) => sum + j.totalDebit, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total crédit</div>
                <div className="text-2xl font-bold text-green-400">
                  {JOURNAL_BOOK.reduce((sum, j) => sum + j.totalCredit, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total opérations</div>
                <div className="text-2xl font-bold text-blue-400">
                  {JOURNAL_BOOK.reduce((sum, j) => sum + j.operations, 0)}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Journal</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Opérations</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Total Débit</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Total Crédit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {JOURNAL_BOOK.map((journal) => (
                    <tr key={journal.date + journal.code} className="hover:bg-white/5">
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{journal.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {journal.code}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{journal.date}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{journal.name}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{journal.operations}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                        {journal.totalDebit.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">
                        {journal.totalCredit.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400">
                          {journal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => showDetails(`${journal.code} - ${journal.name}: ${journal.operations} operations.`)} className="text-indigo-600 hover:text-indigo-900 mr-3">Voir</button>
                        <button type="button" onClick={() => window.print()} className="text-gray-400 hover:text-white mr-3">Imprimer</button>
                        <button type="button" onClick={() => showDetails(`Le journal ${journal.code} est une synthese calculee et ne peut pas etre supprime directement.`)} className="text-red-400 hover:text-red-900">Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Affichage de {JOURNAL_BOOK.length} journaux
              </div>
            </div>
          </div>
        );

      case 'inter_cash_transfer':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => { setTransferForm({ date: todayInput, fromRegister: '', toRegister: '', amount: '', reason: '', requestedBy: currentUserName }); setApiError('Formulaire nouveau transfert pret.'); }} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  + Nouveau transfert
                </button>
                <button type="button" onClick={exportTransfers} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  + Exporter
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Toutes les caisses</option>
                  <option value="principale">Caisse Principale</option>
                  <option value="restaurant">Caisse Restaurant</option>
                  <option value="bar">Caisse Bar</option>
                  <option value="reception">Caisse Réception</option>
                </select>
              </div>
            </div>
            
            <form onSubmit={handleTransferSubmit} className="bg-white/5 border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Nouveau transfert</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" value={transferForm.date} onChange={(event) => setTransferForm((previous) => ({ ...previous, date: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">De</label>
                  <select value={transferForm.fromRegister} onChange={(event) => setTransferForm((previous) => ({ ...previous, fromRegister: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selectionner</option>
                    {cashRegisterOptions.map((register) => (
                      <option key={register} value={register}>{register}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vers</label>
                  <select value={transferForm.toRegister} onChange={(event) => setTransferForm((previous) => ({ ...previous, toRegister: event.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Selectionner</option>
                    {cashRegisterOptions.map((register) => (
                      <option key={register} value={register}>{register}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Montant</label>
                  <input type="number" min="0" value={transferForm.amount} onChange={(event) => setTransferForm((previous) => ({ ...previous, amount: event.target.value }))} placeholder="0" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Motif</label>
                  <input type="text" value={transferForm.reason} onChange={(event) => setTransferForm((previous) => ({ ...previous, reason: event.target.value }))} placeholder="Description" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Autorise par</label>
                  <input type="text" value={transferForm.requestedBy} onChange={(event) => setTransferForm((previous) => ({ ...previous, requestedBy: event.target.value }))} placeholder="Nom" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Effectuer transfert
                  </button>
                </div>
              </div>
            </form>

            {/* Formulaire de transfert rapide */}
            <div className="hidden bg-white/5 border border-gray-700/50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Nouveau transfert</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Date</label>
                  <input type="date" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">De</label>
                  <select className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionner</option>
                    <option value="banque">Banque</option>
                    <option value="principale">Caisse Principale</option>
                    <option value="restaurant">Caisse Restaurant</option>
                    <option value="bar">Caisse Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Vers</label>
                  <select className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionner</option>
                    <option value="principale">Caisse Principale</option>
                    <option value="restaurant">Caisse Restaurant</option>
                    <option value="bar">Caisse Bar</option>
                    <option value="reception">Caisse Réception</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Montant</label>
                  <input type="number" placeholder="0" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Motif</label>
                  <input type="text" placeholder="Description" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Autorisé par</label>
                  <input type="text" placeholder="Nom" className="w-full px-3 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-end">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Effectuer transfert
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Heure</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">De</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Vers</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Motif</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Autorisé par</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {interCashTransfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-white/5">
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{transfer.date}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{transfer.time}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {transfer.from}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">→ {transfer.to}</span>
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{transfer.to}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {transfer.amount.toLocaleString('fr-FR')} {currencySymbol}
                      </td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-gray-400 md:table-cell">{transfer.reason}</td>
                      <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{transfer.authorizedBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-500/20 text-green-400">
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button type="button" onClick={() => showDetails(`Transfert ${transfer.from} vers ${transfer.to}: ${transfer.amount.toLocaleString('fr-FR')} ${currencySymbol}.`)} className="text-indigo-600 hover:text-indigo-900 mr-3">Détails</button>
                        <button type="button" onClick={() => window.print()} className="text-gray-400 hover:text-white mr-3">Imprimer</button>
                        {transfer.status === 'pending' && (
                          <button type="button" onClick={() => cancelTransfer(transfer.id)} className="text-yellow-300 hover:text-yellow-200 mr-3">
                            Annuler
                          </button>
                        )}
                        {transfer.status !== 'completed' && (
                          <button type="button" onClick={() => deleteTransfer(transfer.id)} className="text-red-400 hover:text-red-300">
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Total: {interCashTransfers.length} transferts
              </div>
            </div>
          </div>
        );

      case 'balance':
        return (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button type="button" onClick={() => showDetails(`Balance generee avec ${accounts.length} comptes actifs dans la vue courante.`)} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  + Générer balance
                </button>
                <button type="button" onClick={exportBalance} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  + Exporter CSV
                </button>
                <button type="button" onClick={() => window.print()} className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 transition-colors">
                  + Imprimer
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border border-gray-600/50 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Toutes les classes</option>
                  <option value="1">Classe 1 - Capitaux</option>
                  <option value="2">Classe 2 - Immobilisations</option>
                  <option value="3">Classe 3 - Stocks</option>
                  <option value="4">Classe 4 - Tiers</option>
                  <option value="5">Classe 5 - Financier</option>
                  <option value="6">Classe 6 - Charges</option>
                  <option value="7">Classe 7 - Produits</option>
                </select>
              </div>
            </div>
            
            {/* Résumé de la balance */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total Actif</div>
                <div className="text-2xl font-bold text-blue-400">
                  {accounts.filter(a => a.type === 'Actif').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total Passif</div>
                <div className="text-2xl font-bold text-green-400">
                  {accounts.filter(a => a.type === 'Passif').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total Charges</div>
                <div className="text-2xl font-bold text-red-400">
                  {accounts.filter(a => a.type === 'Charge').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                <div className="text-sm text-gray-400">Total Produits</div>
                <div className="text-2xl font-bold text-purple-600">
                  {accounts.filter(a => a.type === 'Produit').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Compte</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Libellé</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solde Débiteur</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Solde Créditeur</th>
                    <th className="hidden px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {accounts.map((account) => {
                    const isDebit = account.type === 'Actif' || account.type === 'Charge';
                    return (
                      <tr key={account.id} className="hover:bg-white/5">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {account.code}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{account.name}</span>
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap text-sm text-white md:table-cell">{account.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {isDebit ? `${account.balance.toLocaleString('fr-FR')} ${currencySymbol}` : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                          {!isDebit ? `${account.balance.toLocaleString('fr-FR')} ${currencySymbol}` : '-'}
                        </td>
                        <td className="hidden px-6 py-4 whitespace-nowrap md:table-cell">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            account.type === 'Actif' ? 'bg-blue-500/20 text-blue-400' :
                            account.type === 'Passif' ? 'bg-green-500/20 text-green-400' :
                            account.type === 'Charge' ? 'bg-red-500/20 text-red-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {account.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button type="button" onClick={() => showDetails(`${account.code} - ${account.name}: solde ${account.balance.toLocaleString('fr-FR')} ${currencySymbol}.`)} className="text-indigo-600 hover:text-indigo-900 mr-3">Détails</button>
                          <button type="button" onClick={() => window.print()} className="text-gray-400 hover:text-white">Imprimer</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-white/5 border-t border-gray-700/50">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white" colSpan="2">Totaux</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {accounts.filter(a => a.type === 'Actif' || a.type === 'Charge').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white">
                      {accounts.filter(a => a.type === 'Passif' || a.type === 'Produit').reduce((sum, a) => sum + a.balance, 0).toLocaleString('fr-FR')} {currencySymbol}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-400" colSpan="2">
                      {accounts.filter(a => a.type === 'Actif' || a.type === 'Charge').reduce((sum, a) => sum + a.balance, 0) === 
                       accounts.filter(a => a.type === 'Passif' || a.type === 'Produit').reduce((sum, a) => sum + a.balance, 0) ? 
                       'Balance équilibrée ✓' : 'Balance déséquilibrée ✗'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Balance générée le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-full mx-auto px-6 lg:px-8 py-8">

        {/* Navigation Tabs */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-8 px-8 overflow-x-auto" aria-label="Tabs">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`inline-flex items-center gap-3 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                        activeSection === item.id
                          ? 'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                          : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
            {apiError && (
              <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                {apiError}
              </div>
            )}
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
