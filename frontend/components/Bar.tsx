import { FaPlus, FaSave, FaTimes, FaTrash, FaEye, FaMoneyBillWave, FaInfoCircle, FaExchangeAlt, FaSearch, FaPrint, FaEnvelope, FaEdit, FaDownload, FaCheck } from 'react-icons/fa';

import { CashJournal, CashRegister, CashTransfer, useBackendCashModule } from '../utils/cashModuleBackend';
import api from '../services/api';
import { useEffect, useMemo, useState } from 'react';
import { openInvoiceWindow } from '../utils/invoiceTemplate';


interface Invoice {
  id: string;
  invoiceNumber: string;
  tableNumber: string;
  customerName?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  discount: number;
  paymentMethod: 'cash' | 'card' | 'mobile' | 'room_charge';
  status: 'draft' | 'validated' | 'paid' | 'cancelled';
  server: string;
  createdAt: Date;
  paidAt?: Date;
}

interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface BarStock {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  sellingPrice: number;
  totalValue: number;
  minThreshold: number;
  maxThreshold: number;
  status: 'available' | 'low_stock' | 'overstock' | 'out_of_stock';
  lastMovementDate?: Date;
  lastMovementType?: 'entry' | 'exit';
  supplier?: string;
}

interface MainCourante {
  id: string;
  entryDate: Date;
  entryTime: string;
  category: 'incident' | 'maintenance' | 'security' | 'complaint' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  assignedTo?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
}

const BarTabIcon: React.FC<{ tabKey: string; className?: string }> = ({ tabKey, className = 'h-5 w-5' }) => {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true
  };

  if (tabKey === 'facturation') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 3h10v18l-2-1-2 1-2-1-2 1-2-1V3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M9.5 8h5M9.5 12h5M9.5 16h3" />
      </svg>
    );
  }

  if (tabKey === 'caisse' || tabKey === 'ouverture_fermeture') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 9h14v10H5zM8 9V5h8v4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M8 13h.01M12 13h.01M16 13h.01M8 16h8" />
      </svg>
    );
  }

  if (tabKey === 'impression_facture') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M7 14h10v7H7z" />
      </svg>
    );
  }

  if (tabKey === 'main_courante') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 4h10v16H7z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M9.5 8h5M9.5 12h5M9.5 16h3" />
      </svg>
    );
  }

  if (tabKey === 'fiche_stock') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 7.5 12 3l8 4.5-8 4.5-8-4.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4 7.5v9L12 21l8-4.5v-9M12 12v9" />
      </svg>
    );
  }

  if (tabKey === 'transfert_intercaisse') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 7h11l-3-3M17 17H6l3 3" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5 11h14v2H5z" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h3" />
    </svg>
  );
};

const Bar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('facturation');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterRegister, setFilterRegister] = useState('all');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [barStock, setBarStock] = useState<BarStock[]>([]);
  const [mainCourante, setMainCourante] = useState<MainCourante[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);

  const [uiFeedback, setUiFeedback] = useState('');

  const [draftOrder, setDraftOrder] = useState({
    tableNumber: '',
    customerName: '',
    items: [] as { menuItemId: string; quantity: number; unitPrice: number; productName?: string }[],
    status: 'validated'
  });

  const [draftStock, setDraftStock] = useState({
    itemId: '',
    movementType: 'entry',
    quantity: 1,
    reason: '',
    reference: ''
  });

  const [showCashRegisterDetails, setShowCashRegisterDetails] = useState(false);
  const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
  const [showStockDetails, setShowStockDetails] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<BarStock | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MainCourante | null>(null);
  const [showMainEntryForm, setShowMainEntryForm] = useState(false);
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MainCourante | null>(null);
  const [showEntryDetailModal, setShowEntryDetailModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInvoice, setEmailInvoice] = useState<Invoice | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [cashMovementRegister, setCashMovementRegister] = useState<CashRegister | null>(null);
  const [cashMovementDraft, setCashMovementDraft] = useState({ type: 'cash_in', amount: '', description: '' });
  const [showTransferFormInline, setShowTransferFormInline] = useState(false);
  const [newEntryDraft, setNewEntryDraft] = useState({
    dateOperation: new Date().toISOString().slice(0, 10),
    heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    numcompte: '512',
    credit: '0',
    debit: '0',
    libelle: '',
    codeJournal: 'BQ',
    codeDepot: '3'
  });
  const [editEntryDraft, setEditEntryDraft] = useState({
    dateOperation: '',
    heureOperation: '',
    numcompte: '512',
    credit: '0',
    debit: '0',
    libelle: '',
    codeJournal: 'BQ',
    codeDepot: '3'
  });

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) return invoices;
    return invoices.filter((invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(normalizedTerm) ||
      invoice.tableNumber.toLowerCase().includes(normalizedTerm) ||
      invoice.customerName?.toLowerCase().includes(normalizedTerm) ||
      invoice.items.some((item) => item.productName.toLowerCase().includes(normalizedTerm))
    );
  }, [searchTerm, invoices]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Bar Products (Stock)
      const productsResponse = await api.get('/bar/products');
      const productsData = productsResponse.data;
      const mappedStock: BarStock[] = productsData.map((p: any) => ({
        id: String(p.id),
        productCode: `BOISS-${p.id.toString().padStart(3, '0')}`,
        productName: p.name,
        category: p.category,
        currentStock: p.stock,
        unit: 'bouteilles',
        unitCost: p.price * 0.7, // Simulated cost
        sellingPrice: p.price,
        totalValue: p.stock * p.price,
        minThreshold: p.minThreshold,
        maxThreshold: p.minThreshold * 5,
        status: p.available ? 'available' : 'out_of_stock',
        supplier: 'SABC / Brasseries'
      }));
      setBarStock(mappedStock);

      // Fetch Orders (Invoices)
      const ordersResponse = await api.get('/restaurant/orders');
      const ordersData = ordersResponse.data;
      const mappedInvoices: Invoice[] = ordersData.map((o: any) => ({
        id: String(o.id),
        invoiceNumber: `BAR-2024-${o.id.toString().padStart(3, '0')}`,
        tableNumber: `T-${o.tableNumber}`,
        customerName: 'Client Comptant',
        items: o.items.map((item: any) => ({
          id: String(item.id),
          productId: String(item.menuItemId),
          productName: item.menuItemName,
          category: 'Boissons',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        })),
        subtotal: o.totalAmount,
        tax: o.totalAmount * 0.1925,
        totalAmount: o.totalAmount * 1.1925,
        discount: 0,
        paymentMethod: 'cash',
        status: o.status === 'Payé' ? 'paid' : o.status === 'Annulée' ? 'cancelled' : 'validated',
        server: 'Personnel Bar',
        createdAt: new Date(o.createdAt),
        paidAt: o.servedAt ? new Date(o.servedAt) : undefined
      }));
      setInvoices(mappedInvoices);

      // Fetch Main Courante (Accounting Operations for Bar - codeDepot 3)
      const opsResponse = await api.get('/accounting/sqlite/operations', { params: { codeDepot: 3 } });
      const opsData = opsResponse.data;
      const mappedOps: MainCourante[] = opsData.map((op: any) => ({
        id: String(op.codeOperation),
        entryDate: new Date(op.dateOperation),
        entryTime: op.heureOperation,
        category: op.typeOperation.toLowerCase().includes('credit') ? 'security' : 'incident',
        priority: 'medium',
        title: op.libelle,
        description: `Transaction sur compte ${op.numcompte}`,
        location: op.libelleDepot || 'Bar',
        reportedBy: 'Système Comptable',
        status: 'resolved'
      }));
      setMainCourante(mappedOps);
      
    } catch (error) {
      console.error('Error fetching bar data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftOrder.items.length === 0) {
      setUiFeedback('Veuillez ajouter au moins un article.');
      return;
    }
    try {
      await api.post('/restaurant/orders', {
        tableNumber: Number(draftOrder.tableNumber.replace(/\D/g, '')) || 1,
        items: draftOrder.items.map(item => ({
          menuItemId: Number(item.menuItemId),
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        status: draftOrder.status
      });
      setShowInvoiceForm(false);
      setDraftOrder({ tableNumber: '', customerName: '', items: [], status: 'validated' });
      fetchData();
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      try {
        await api.put(`/restaurant/orders/${orderId}/status`, null, {
          params: { status: 'Annulée' }
        });
        fetchData();
      } catch (error) {
        console.error("Error cancelling order", error);
      }
    }
  };

  const handlePayOrder = async (orderId: string) => {
    if (window.confirm("Confirmer le paiement de cette facture ?")) {
      try {
        await api.put(`/restaurant/orders/${orderId}/status`, null, {
          params: { status: 'Payée' }
        });
        fetchData();
      } catch (error) {
        console.error("Error paying order", error);
      }
    }
  };

  const saveStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/bar/products/${draftStock.itemId}/movements`, {
        movementType: draftStock.movementType,
        quantity: Number(draftStock.quantity),
        reason: draftStock.reason,
        reference: draftStock.reference
      });
      setShowStockForm(false);
      setDraftStock({ itemId: '', movementType: 'entry', quantity: 1, reason: '', reference: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving stock movement:', error);
    }
  };

  const handleActivateRegister = () => {
    setActiveTab('ouverture_fermeture');
    setUiFeedback('Utilisez le formulaire d\'ouverture de caisse pour créer une nouvelle caisse.');
  };

  const handleRegisterDetails = (register: CashRegister) => {
    setSelectedRegister(register);
    setShowCashRegisterDetails(true);
  };

  const handleRegisterMovement = (register: CashRegister) => {
    setCashMovementRegister(register);
    setCashMovementDraft({ type: 'cash_in', amount: '', description: '' });
    setShowCashMovementModal(true);
  };

  const handleSaveCashMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(cashMovementDraft.amount);
    if (!amount || amount <= 0) { setUiFeedback('Montant invalide.'); return; }
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      const currentUser = storedUser ? JSON.parse(storedUser) as { firstName?: string; lastName?: string; role?: string } : {};
      const responsible = [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ').trim() || currentUser.role || 'Equipe Bar';
      await api.post('/cash/bar/registers/movement', {
        registerNumber: cashMovementRegister?.registerNumber,
        type: cashMovementDraft.type,
        amount,
        responsible,
        description: cashMovementDraft.description || null
      });
      setShowCashMovementModal(false);
      setCashMovementRegister(null);
      setUiFeedback(`Mouvement de caisse enregistré avec succès.`);
      fetchData();
    } catch (err) {
      console.error('Error saving cash movement:', err);
      setUiFeedback('Erreur lors de l\'enregistrement du mouvement.');
    }
  };

  const handleRegisterClose = (register: CashRegister) => {
    setActiveTab('ouverture_fermeture');
    setClosingForm((prev) => ({ ...prev, registerNumber: register.registerNumber }));
    setUiFeedback('Complétez la fermeture de caisse dans le formulaire.');
  };

  const handleSearchInvoices = () => {
    setUiFeedback(`Résultats filtrés pour : ${searchTerm}`);
  };

  const handleOpenStockDetails = (item: BarStock) => {
    setSelectedStockItem(item);
    setShowStockDetails(true);
  };

  const handleOpenStockMovement = (item: BarStock) => {
    setActiveTab('fiche_stock');
    setShowStockForm(true);
    setDraftStock((prev) => ({ ...prev, itemId: item.id }));
    setUiFeedback('Enregistrez un mouvement de stock pour ce produit.');
  };

  const handleOpenMainEntryForm = () => {
    setSelectedEntry(null);
    setShowMainEntryForm(true);
  };

  const handleMainEntryDetails = (entry: MainCourante) => {
    setSelectedEntry(entry);
    setShowEntryDetailModal(true);
  };

  const handleEditMainEntry = (entry: MainCourante) => {
    setEditingEntry(entry);
    setEditEntryDraft({
      dateOperation: entry.entryDate.toISOString().slice(0, 10),
      heureOperation: entry.entryTime,
      numcompte: '512',
      credit: '0',
      debit: '0',
      libelle: entry.title,
      codeJournal: 'BQ',
      codeDepot: '3'
    });
    setShowEditEntryModal(true);
  };

  const handleSaveEditEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    const credit = Number(editEntryDraft.credit || 0);
    const debit = Number(editEntryDraft.debit || 0);
    if (!editEntryDraft.libelle.trim() || (!credit && !debit)) {
      setUiFeedback('Veuillez renseigner un libellé et un montant.');
      return;
    }
    try {
      // Tenter la mise à jour via l'API accounting/operations (JPA)
      await api.put(`/accounting/operations/${editingEntry.id}`, {
        label: editEntryDraft.libelle,
        debitAmount: debit,
        creditAmount: credit,
        accountCode: editEntryDraft.numcompte,
        journalCode: editEntryDraft.codeJournal,
        reference: `MC-${editingEntry.id}`
      }).catch(async () => {
        // Fallback: utilise l'API SQLite
        await api.post('/accounting/sqlite/operations', {
          ...editEntryDraft,
          credit,
          debit,
          codeDepot: Number(editEntryDraft.codeDepot)
        });
      });
      setShowEditEntryModal(false);
      setEditingEntry(null);
      fetchData();
      setUiFeedback('Entrée modifiée avec succès.');
    } catch (err) {
      console.error('Error editing entry:', err);
      setUiFeedback('Erreur lors de la modification.');
    }
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInvoice || !emailAddress.trim()) return;
    setEmailSending(true);
    // Simulation d'envoi d'email (délai réseau réaliste)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setEmailSending(false);
    setEmailSent(true);
    setTimeout(() => {
      setShowEmailModal(false);
      setEmailSent(false);
      setEmailAddress('');
      setEmailInvoice(null);
      setUiFeedback(`Email envoyé à ${emailAddress} pour la facture ${emailInvoice.invoiceNumber}.`);
    }, 1200);
  };

  const handleOpenEmailModal = (invoice: Invoice) => {
    setEmailInvoice(invoice);
    setEmailAddress('');
    setEmailSent(false);
    setShowEmailModal(true);
  };

  const handleAddMainEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const credit = Number(newEntryDraft.credit || 0);
    const debit = Number(newEntryDraft.debit || 0);

    if (!newEntryDraft.libelle.trim() || (!credit && !debit)) {
      setUiFeedback('Veuillez renseigner un libellé et un montant de débit ou crédit.');
      return;
    }

    try {
      await api.post('/accounting/sqlite/operations', {
        ...newEntryDraft,
        credit,
        debit,
        dateOperation: newEntryDraft.dateOperation,
        heureOperation: newEntryDraft.heureOperation,
        codeDepot: Number(newEntryDraft.codeDepot)
      });
      setShowMainEntryForm(false);
      setNewEntryDraft({
        dateOperation: new Date().toISOString().slice(0, 10),
        heureOperation: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        numcompte: '512',
        credit: '0',
        debit: '0',
        libelle: '',
        codeJournal: 'BQ',
        codeDepot: '3'
      });
      fetchData();
      setUiFeedback('Nouvelle entrée ajoutée à la main courante.');
    } catch (error) {
      console.error('Error saving main entry:', error);
      setUiFeedback('Erreur lors de l\'enregistrement de la main courante.');
    }
  };

  const handleExportCashJournal = () => {
    const rows = filteredCashJournal.map((entry) => ({
      Date: entry.date.toLocaleDateString('fr-FR'),
      Description: entry.description,
      Type: entry.type,
      Montant: entry.amount.toFixed(2),
      Solde: entry.balance.toFixed(2),
      Caisse: entry.register,
      Utilisateur: entry.user,
      Référence: entry.reference
    }));
    const csvContent = [
      Object.keys(rows[0] || {}).join(','),
      ...rows.map((row) => Object.values(row).map((value) => String(value).replace(/"/g, '""')).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `brouillard_caisse_${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const initialCashRegisters: CashRegister[] = [
    {
      id: '1',
      registerNumber: 'Caisse-01',
      openingBalance: 50000,
      currentBalance: 125000,
      cashIn: 150000,
      cashOut: 75000,
      totalSales: 100000,
      status: 'open',
      openedBy: 'Alice Martin',
      openedAt: new Date('2024-04-10T08:00:00')
    },
    {
      id: '2',
      registerNumber: 'Caisse-02',
      openingBalance: 30000,
      currentBalance: 80000,
      cashIn: 100000,
      cashOut: 50000,
      totalSales: 70000,
      status: 'open',
      openedBy: 'Bob Wilson',
      openedAt: new Date('2024-04-10T08:00:00')
    }
  ];

  const initialCashTransfers: CashTransfer[] = [
    {
      id: '1',
      transferNumber: 'TRANSF-2024-001',
      fromRegister: 'Caisse-01',
      toRegister: 'Caisse-02',
      amount: 20000,
      reason: 'Approvisionnement caisse secondaire',
      status: 'completed',
      requestedBy: 'Alice Martin',
      approvedBy: 'Responsable bar',
      transferDate: new Date('2024-04-10T10:30:00'),
      completedAt: new Date('2024-04-10T10:45:00')
    }
  ];

  const initialCashJournal: CashJournal[] = [
    {
      id: '1',
      date: new Date('2024-04-10T08:00:00'),
      description: 'Ouverture caisse bar principal',
      type: 'opening',
      amount: 50000,
      balance: 50000,
      register: 'Caisse-01',
      user: 'Alice Martin',
      reference: 'OUV-BAR-2024-001'
    }
  ];

  const tabs = [
    { key: 'facturation', label: 'Facturation', description: 'Gérez les factures et les commandes clients' },
    { key: 'caisse', label: 'Caisse', description: 'Suivez l\'état des caisses et les transactions' },
    { key: 'impression_facture', label: 'Impression Facture', description: 'Imprimez et gérez les factures clients' },
    { key: 'main_courante', label: 'Main Courante', description: 'Suivez les incidents et événements du bar' },
    { key: 'fiche_stock', label: 'Fiche de stock', description: 'Consultez les stocks de boissons et produits' },
    { key: 'transfert_intercaisse', label: 'Transfert inter-caisse', description: 'Gérez les transferts entre caisses' },
    { key: 'brouillard_caisse', label: 'Brouillard de caisse', description: 'Consultez le journal détaillé des opérations' },
    { key: 'ouverture_fermeture', label: 'Ouverture/Fermeture Caisse', description: 'Gérez l\'ouverture et la fermeture des caisses' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'validated': return 'bg-blue-500/20 text-blue-400';
      case 'draft': return 'bg-white/50/20 text-gray-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      case 'open': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-white/50/20 text-gray-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'Espèces';
      case 'card': return 'Carte bancaire';
      case 'mobile': return 'Mobile money';
      case 'room_charge': return 'Débit chambre';
      default: return method;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sale': return 'bg-green-500/20 text-green-400';
      case 'cash_in': return 'bg-blue-500/20 text-blue-400';
      case 'cash_out': return 'bg-red-500/20 text-red-400';
      case 'transfer': return 'bg-purple-500/20 text-purple-400';
      case 'opening': return 'bg-yellow-500/20 text-yellow-400';
      case 'closing': return 'bg-white/50/20 text-gray-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const {
    cashRegisters,
    cashTransfers,
    cashJournal,
    transferForm,
    setTransferForm,
    openingForm,
    setOpeningForm,
    closingForm,
    setClosingForm,
    closingRegister,
    closingDifference,
    feedback,
    handleTransferSubmit,
    approveTransfer,
    cancelTransfer,
    deleteTransfer,
    handleOpeningSubmit,
    handleClosingSubmit,
    cancelClosure,
    deleteClosure,
    resetTransferForm
  } = useBackendCashModule('bar', initialCashRegisters, initialCashTransfers, initialCashJournal);

  const filteredCashJournal = useMemo(() => {
    return cashJournal.filter((entry) => {
      const matchesDate = !filterDate || entry.date.toISOString().slice(0, 10) === filterDate;
      const matchesRegister = filterRegister === 'all' || entry.register === filterRegister;
      return matchesDate && matchesRegister;
    });
  }, [cashJournal, filterDate, filterRegister]);

  const renderInvoiceForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Nouvelle Facture Bar
          </h3>
          <p className="text-gray-400 text-sm mt-1">Saisie d'une commande ou facture</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={insertSampleInvoices} className="bg-emerald-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 transition-colors">Insérer données test</button>
          <button 
            onClick={() => setShowInvoiceForm(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={saveOrder} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Numéro de table</label>
            <input 
              type="text" 
              value={draftOrder.tableNumber}
              onChange={(e) => setDraftOrder({...draftOrder, tableNumber: e.target.value})}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
              placeholder="Ex: 5" 
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Nom du client</label>
            <input 
              type="text" 
              value={draftOrder.customerName}
              onChange={(e) => setDraftOrder({...draftOrder, customerName: e.target.value})}
              className="w-full px-4 py-3 bg-gradient-to-r from-gray-700/50 to-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all" 
              placeholder="Nom du client (optionnel)" 
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-white">Articles</h3>
            <button 
              type="button"
              onClick={() => setDraftOrder({...draftOrder, items: [...draftOrder.items, { menuItemId: '', quantity: 1, unitPrice: 0 }]})}
              className="text-blue-400 hover:text-blue-300 font-medium text-sm flex items-center gap-1"
            >
              + Ajouter un article
            </button>
          </div>
          
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            {draftOrder.items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Article</label>
                  <select 
                    value={item.menuItemId}
                    onChange={(e) => {
                      const product = barStock.find(p => p.id === e.target.value);
                      const newItems = [...draftOrder.items];
                      newItems[index] = { ...item, menuItemId: e.target.value, unitPrice: product?.sellingPrice || 0, productName: product?.productName };
                      setDraftOrder({...draftOrder, items: newItems});
                    }}
                    className="w-full px-3 py-2 border border-gray-700/50 rounded-lg text-sm bg-gray-800/50 text-white"
                    required
                  >
                    <option value="">Sélectionner un produit</option>
                    {barStock.map(p => (
                      <option key={p.id} value={p.id}>{p.productName} ({p.sellingPrice} FCFA)</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Quantité</label>
                  <input 
                    type="number" 
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...draftOrder.items];
                      newItems[index].quantity = Number(e.target.value);
                      setDraftOrder({...draftOrder, items: newItems});
                    }}
                    className="w-full px-3 py-2 border border-gray-700/50 rounded-lg text-sm bg-gray-800/50 text-white" 
                    required
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
                  <div className="px-3 py-2 text-sm text-white font-medium bg-gray-800/50 rounded-lg border border-transparent">
                    {(item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newItems = draftOrder.items.filter((_, i) => i !== index);
                    setDraftOrder({...draftOrder, items: newItems});
                  }}
                  className="px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <FaTrash className="w-5 h-5" />
                </button>
              </div>
            ))}
            {draftOrder.items.length === 0 && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Aucun article ajouté. Cliquez sur "+ Ajouter un article".
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <div>
             <span className="text-gray-400 block mb-1">Total à payer</span>
             <span className="text-3xl font-bold text-white">
               {draftOrder.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toLocaleString('fr-FR')} FCFA
             </span>
          </div>
          <div className="flex justify-end items-end gap-4">
            <button 
              type="button"
              onClick={() => setShowInvoiceForm(false)}
              className="px-6 py-3 border border-gray-700/50 rounded-lg text-sm font-medium hover:bg-white/5 transition-all duration-200 text-white"
            >
              <FaTimes className="inline-block mr-2"/>Annuler
            </button>
            <button 
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-500/30"
            >
              <FaSave className="inline-block mr-2"/>Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  const insertSampleInvoices = () => {
    const sample: Invoice[] = [
      {
        id: '1001',
        invoiceNumber: 'BAR-2024-1001',
        tableNumber: 'T-12',
        customerName: 'Jean Dupont',
        items: [
          { id: 'i1', productId: 'p1', productName: 'Coca-Cola 33cl', category: 'Boissons', quantity: 2, unitPrice: 300, totalPrice: 600 },
          { id: 'i2', productId: 'p2', productName: 'Bière locale 50cl', category: 'Boissons', quantity: 1, unitPrice: 1200, totalPrice: 1200 }
        ],
        subtotal: 1800,
        tax: 1800 * 0.1925,
        totalAmount: 1800 * 1.1925,
        discount: 0,
        paymentMethod: 'cash',
        status: 'validated',
        server: 'Pierre',
        createdAt: new Date(),
        paidAt: undefined
      },
      {
        id: '1002',
        invoiceNumber: 'BAR-2024-1002',
        tableNumber: 'T-5',
        customerName: 'Marie Claire',
        items: [
          { id: 'i3', productId: 'p3', productName: 'Jus d\'orange', category: 'Boissons', quantity: 3, unitPrice: 400, totalPrice: 1200 }
        ],
        subtotal: 1200,
        tax: 1200 * 0.1925,
        totalAmount: 1200 * 1.1925,
        discount: 0,
        paymentMethod: 'card',
        status: 'paid',
        server: 'Sophie',
        createdAt: new Date(),
        paidAt: new Date()
      }
    ];

    setInvoices((prev) => {
      const merged = [...sample, ...prev];
      return merged;
    });
    setUiFeedback('Données de facturation ajoutées (test).');
  };

  const printInvoiceAsPdf = (invoice: Invoice) => {
    const formatAmount = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;
    const statusLabel = invoice.status === 'paid' ? 'Payée'
      : invoice.status === 'cancelled' ? 'Annulée'
      : invoice.status === 'validated' ? 'Validée' : 'Brouillon';

    openInvoiceWindow({
      documentTitle: `Facture ${invoice.invoiceNumber}`,
      moduleLabel: 'Bar',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt.toLocaleString('fr-FR'),
      statusLabel,
      infoBoxes: [
        {
          title: 'Client',
          lines: [
            { label: 'Nom', value: invoice.customerName || 'Client comptant' },
            { label: 'Paiement', value: getPaymentMethodLabel(invoice.paymentMethod) }
          ]
        },
        {
          title: 'Service',
          lines: [
            { label: 'Table', value: invoice.tableNumber },
            { label: 'Serveur', value: invoice.server }
          ]
        }
      ],
      columns: [
        { label: 'Produit' },
        { label: 'Qte', align: 'right' },
        { label: 'PU', align: 'right' },
        { label: 'Total', align: 'right' }
      ],
      rows: invoice.items.map(item => [
        item.productName,
        item.quantity,
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice)
      ]),
      totals: [
        { label: 'Sous-total', value: formatAmount(invoice.subtotal) },
        { label: 'Taxe', value: formatAmount(invoice.tax) },
        { label: 'Total', value: formatAmount(invoice.totalAmount), emphasis: true }
      ],
      signatureLabels: ['Signature client', 'Bar Mirador Hotel']
    });
  };


  const renderStockForm = () => (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-2xl border border-gray-700/50 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            Nouveau Mouvement de Stock (Bar)
          </h3>
          <p className="text-gray-400 text-sm mt-1">Enregistrez une entrée ou sortie de boisson</p>
        </div>
        <button 
          onClick={() => setShowStockForm(false)}
          className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
        >
          <FaTimes className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={saveStockMovement} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Article</label>
          <select
            value={draftStock.itemId}
            onChange={(e) => setDraftStock({ ...draftStock, itemId: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="">Sélectionner un article</option>
            {barStock.map(item => <option key={item.id} value={item.id}>{item.productName} ({item.productCode})</option>)}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Type de Mouvement</label>
          <select
            value={draftStock.movementType}
            onChange={(e) => setDraftStock({ ...draftStock, movementType: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            required
          >
            <option value="entry">Entrée (Stock +)</option>
            <option value="exit">Sortie (Stock -)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Quantité</label>
          <input
            type="number"
            min="1"
            value={draftStock.quantity}
            onChange={(e) => setDraftStock({ ...draftStock, quantity: Number(e.target.value) })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            placeholder="0"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">Raison / Motif</label>
          <input
            type="text"
            value={draftStock.reason}
            onChange={(e) => setDraftStock({ ...draftStock, reason: e.target.value })}
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none transition-all"
            placeholder="Ex: Réapprovisionnement, etc."
            required
          />
        </div>

        <div className="lg:col-span-3 flex justify-end gap-4 mt-4">
          <button
            type="button"
            onClick={() => setShowStockForm(false)}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:bg-white/5 border border-gray-700 transition-all"
          >
            <FaTimes className="inline-block mr-2"/>Annuler
          </button>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-yellow-600 to-orange-600 hover:shadow-lg hover:shadow-yellow-500/25 transition-all transform hover:-translate-y-0.5"
          >
            <FaSave className="inline-block mr-2"/>Valider le Mouvement
          </button>
        </div>
      </form>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'facturation':
        return (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Facturation Bar</h2>
                  <p className="text-sm text-gray-400 mt-1">Gérez les commandes actives du bar.</p>
                </div>
                {!showInvoiceForm && (
                  <button 
                    onClick={() => setShowInvoiceForm(true)}
                    className="relative group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 -z-10"></div>
                    <span className="relative"><FaPlus className="inline-block mr-2"/>Nouvelle facture</span>
                  </button>
                )}
              </div>

              {showInvoiceForm && renderInvoiceForm()}

              <div className="overflow-x-auto mt-6">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Facture</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Table</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Client</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {invoice.invoiceNumber}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{invoice.customerName || 'N/A'}</span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{invoice.tableNumber}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{invoice.customerName || 'N/A'}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {invoice.createdAt.toLocaleDateString('fr-FR')} {invoice.createdAt.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {getPaymentMethodLabel(invoice.paymentMethod)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'paid' ? 'Payée' : invoice.status === 'cancelled' ? 'Annulée' : invoice.status === 'validated' ? 'Validée' : invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-3">
                            {invoice.status !== 'cancelled' && (
                              <button
                                onClick={() => deleteOrder(invoice.id)}
                                className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                              >
                                <FaTrash className="inline-block mr-1"/><span className="hidden md:inline">Annuler</span>
                              </button>
                            )}
                            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors" onClick={() => setSelectedInvoice(invoice)}>
                              <FaEye className="inline-block mr-1"/><span className="hidden md:inline">Voir</span>
                            </button>
                            {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                              <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors" onClick={() => handlePayOrder(invoice.id)}>
                                <FaMoneyBillWave className="inline-block mr-1"/><span className="hidden md:inline">Payer</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'caisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Gestion des Caisses</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez l'état des caisses et les transactions.
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={handleActivateRegister}><FaPlus className="inline-block mr-1"/> Nouvelle caisse</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cashRegisters.map((register) => (
                  <div key={register.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{register.registerNumber}</h3>
                        <p className="text-sm text-gray-400">Ouverte par: {register.openedBy}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(register.status)}`}>
                        {register.status === 'open' ? 'Ouverte' : 'Fermée'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Solde d'ouverture</p>
                        <p className="text-lg font-bold text-white">{register.openingBalance.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Solde actuel</p>
                        <p className="text-lg font-bold text-white">{register.currentBalance.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Entrées</p>
                        <p className="text-sm text-green-400 font-medium">+{register.cashIn.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Sorties</p>
                        <p className="text-sm text-red-400 font-medium">-{register.cashOut.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ventes totales</p>
                        <p className="text-lg font-bold text-blue-400">{register.totalSales.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Ouverture</p>
                        <p className="text-sm text-white">{register.openedAt.toLocaleTimeString('fr-FR')}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => handleRegisterDetails(register)}>
                        <FaInfoCircle className="inline-block mr-1"/> Détails
                      </button>
                      <button className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors" onClick={() => handleRegisterMovement(register)}>
                        <FaExchangeAlt className="inline-block mr-1"/> Mouvement
                      </button>
                      {register.status === 'open' && (
                        <button className="flex-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors" onClick={() => handleRegisterClose(register)}>
                          <FaTimes className="inline-block mr-1"/> Fermer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'impression_facture':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Impression de Factures</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Imprimez et gérez les factures clients.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher une facture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={handleSearchInvoices}><FaSearch className="inline-block mr-1"/> Rechercher</button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Facture</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Table</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Client</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Paiement</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {invoice.invoiceNumber}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{invoice.customerName || 'N/A'}</span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{invoice.tableNumber}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{invoice.customerName || 'N/A'}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {invoice.createdAt.toLocaleDateString('fr-FR')} {invoice.createdAt.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {getPaymentMethodLabel(invoice.paymentMethod)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                            {invoice.status === 'paid' ? 'Payée' : invoice.status === 'validated' ? 'Validée' : invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-3">
                            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors" onClick={() => setSelectedInvoice(invoice)}>Voir</button>
                            <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors" onClick={() => printInvoiceAsPdf(invoice)}><FaPrint className="inline-block mr-1"/> <span className="hidden md:inline">Imprimer</span></button>
                            <button className="text-gray-400 hover:text-gray-200 text-sm font-medium transition-colors" onClick={() => handleOpenEmailModal(invoice)}><FaEnvelope className="inline-block mr-1"/> <span className="hidden md:inline">Email</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'main_courante':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Main Courante Bar</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez les incidents et événements du bar.
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={handleOpenMainEntryForm}><FaPlus className="inline-block mr-1"/> Nouvelle entrée</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Titre</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Catégorie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Priorité</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Localisation</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Rapporté par</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {mainCourante.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {entry.entryDate.toLocaleDateString('fr-FR')} {entry.entryTime}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {entry.title}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{entry.location}</span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap md:table-cell">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400`}>
                            {entry.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400`}>
                            {entry.priority}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.location}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.reportedBy}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                            {entry.status === 'in_progress' ? 'En cours' : entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-3">
                            <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors" onClick={() => handleMainEntryDetails(entry)}><FaInfoCircle className="inline-block mr-1"/> <span className="hidden md:inline">Détails</span></button>
                            <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors" onClick={() => handleEditMainEntry(entry)}><FaEdit className="inline-block mr-1"/> <span className="hidden md:inline">Modifier</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'fiche_stock':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Fiche de Stock Bar</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Consultez les stocks de boissons et produits.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Rechercher un produit..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {!showStockForm && (
                    <button 
                      onClick={() => setShowStockForm(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Mouvement
                    </button>
                  )}
                </div>
              </div>

              {showStockForm && renderStockForm()}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {barStock.map((stock) => (
                  <div key={stock.id} className="border border-gray-700/50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{stock.productName}</h3>
                        <p className="text-sm text-gray-400">{stock.productCode}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stock.status)}`}>
                        {stock.status === 'available' ? 'Disponible' : stock.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Stock actuel</p>
                        <p className="text-lg font-bold text-white">{stock.currentStock} {stock.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Valeur totale</p>
                        <p className="text-lg font-bold text-white">{stock.totalValue.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Prix de vente</p>
                        <p className="text-sm text-white">{stock.sellingPrice.toLocaleString('fr-FR')} FCFA</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Fournisseur</p>
                        <p className="text-sm text-white">{stock.supplier || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Seuil minimum</p>
                        <p className="text-sm text-white">{stock.minThreshold} {stock.unit}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Seuil maximum</p>
                        <p className="text-sm text-white">{stock.maxThreshold} {stock.unit}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenStockDetails(stock)} className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                        <FaInfoCircle className="inline-block mr-1"/> Détails
                      </button>
                      <button className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors" onClick={() => handleOpenStockMovement(stock)}><FaExchangeAlt className="inline-block mr-1"/> Mouvement</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'transfert_intercaisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Transfert Inter-Caisse</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les transferts entre caisses.
                  </p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors" onClick={() => { setActiveTab('transfert_intercaisse'); setUiFeedback('Utilisez le formulaire pour créer un transfert inter-caisse.'); }}><FaPlus className="inline-block mr-1"/> Nouveau transfert</button>
              </div>
              {feedback && (
                <div className="mb-4 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  {feedback}
                </div>
              )}
              <form onSubmit={handleTransferSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Caisse source</label>
                    <select
                      value={transferForm.fromRegister}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, fromRegister: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner la caisse source</option>
                      {cashRegisters.map((register) => (
                        <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Caisse destination</label>
                    <select
                      value={transferForm.toRegister}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, toRegister: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sélectionner la caisse destination</option>
                      {cashRegisters.map((register) => (
                        <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Montant</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={transferForm.amount}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                    <input
                      type="date"
                      value={transferForm.transferDate}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, transferDate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-400 mb-1">Motif</label>
                    <input
                      type="text"
                      value={transferForm.reason}
                      onChange={(e) => setTransferForm((previous) => ({ ...previous, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Motif du transfert..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetTransferForm}
                    className="px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium hover:bg-white/5"
                  >
                    Annuler
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                    Soumettre pour approbation
                  </button>
                </div>
              </form>
            </div>
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <h3 className="text-lg font-medium text-white mb-4">Historique des transferts</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Transfert</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">De</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Vers</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Motif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {cashTransfers.map((transfer) => (
                      <tr key={transfer.id} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {transfer.transferNumber}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{transfer.fromRegister} → {transfer.toRegister}</span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{transfer.fromRegister}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{transfer.toRegister}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {transfer.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{transfer.reason}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={'px-2 py-1 text-xs font-medium rounded-full ' + getStatusColor(transfer.status)}>
                            {transfer.status === 'completed' ? 'Complété' : transfer.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-3">
                            {transfer.status === 'pending' && (
                              <>
                                <button className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors" onClick={() => approveTransfer(transfer.id)}><FaCheck className="inline-block mr-1"/> <span className="hidden md:inline">Approuver</span></button>
                                <button className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors" onClick={() => cancelTransfer(transfer.id)}><FaTimes className="inline-block mr-1"/> <span className="hidden md:inline">Annuler</span></button>
                              </>
                            )}
                            <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors" onClick={() => deleteTransfer(transfer.id)}><FaTrash className="inline-block mr-1"/> <span className="hidden md:inline">Supprimer</span></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'brouillard_caisse':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Brouillard de Caisse</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Consultez le journal détaillé des opérations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <select
                    value={filterRegister}
                    onChange={(e) => setFilterRegister(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Toutes les caisses</option>
                    {cashRegisters.map(register => (
                      <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                    ))}
                  </select>
                  <button onClick={handleExportCashJournal} className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                    <FaDownload className="inline-block mr-1"/> Exporter
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Solde</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Caisse</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Utilisateur</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Référence</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredCashJournal.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/5">
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                          {entry.date.toLocaleDateString('fr-FR')} {entry.date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">
                          {entry.description}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">
                            {entry.type === 'opening' ? 'Ouverture' :
                             entry.type === 'sale' ? 'Vente' :
                             entry.type === 'cash_in' ? 'Entrée' :
                             entry.type === 'cash_out' ? 'Sortie' :
                             entry.type === 'transfer' ? 'Transfert' : entry.type}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap md:table-cell">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(entry.type)}`}>
                            {entry.type === 'opening' ? 'Ouverture' :
                             entry.type === 'sale' ? 'Vente' :
                             entry.type === 'cash_in' ? 'Entrée' :
                             entry.type === 'cash_out' ? 'Sortie' :
                             entry.type === 'transfer' ? 'Transfert' : entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                          {entry.amount.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm font-medium text-white md:table-cell">
                          {entry.balance.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.register}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.user}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.reference || 'N/A'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          {entry.type === 'closing' && entry.sourceType === 'register-closing' && entry.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => cancelClosure(entry.id)}
                              className="text-yellow-300 hover:text-yellow-200 text-sm"
                            >
                              <FaTimes className="inline-block mr-1"/> <span className="hidden md:inline">Annuler</span>
                            </button>
                          )}
                          {entry.type === 'closing' && entry.sourceType === 'register-closing' && entry.status === 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => deleteClosure(entry.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              <FaTrash className="inline-block mr-1"/> <span className="hidden md:inline">Supprimer</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'ouverture_fermeture':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Ouverture/Fermeture Caisse</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez l'ouverture et la fermeture des caisses.
                  </p>
                </div>
              </div>
              {feedback && (
                <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
                  {feedback}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Ouverture de Caisse</h3>
                  <form onSubmit={handleOpeningSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Caisse</label>
                      <select
                        value={openingForm.registerNumber}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, registerNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner une caisse</option>
                        {cashRegisters.filter(r => r.status === 'closed').map(register => (
                          <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Solde d'ouverture</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={openingForm.amount}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Responsable</label>
                      <input
                        type="text"
                        value={openingForm.responsible}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, responsible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nom du responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={openingForm.notes}
                        onChange={(e) => setOpeningForm((previous) => ({ ...previous, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notes d'ouverture..."
                      />
                    </div>
                    <button type="submit" className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                      Ouvrir la caisse
                    </button>
                  </form>
                </div>
                <div className="border border-gray-700/50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-4">Fermeture de Caisse</h3>
                  <form onSubmit={handleClosingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Caisse</label>
                      <select
                        value={closingForm.registerNumber}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, registerNumber: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Sélectionner une caisse</option>
                        {cashRegisters.filter(r => r.status === 'open').map(register => (
                          <option key={register.id} value={register.registerNumber}>{register.registerNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Solde théorique</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm bg-white/5"
                        value={closingRegister?.currentBalance ?? 0}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Solde réel</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={closingForm.amount}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, amount: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Écart</label>
                      <input
                        type="text"
                        value={closingDifference.toLocaleString('fr-FR') + ' FCFA'}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm font-medium bg-white/5"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Responsable</label>
                      <input
                        type="text"
                        value={closingForm.responsible}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, responsible: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nom du responsable"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={closingForm.notes}
                        onChange={(e) => setClosingForm((previous) => ({ ...previous, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Notes de fermeture..."
                      />
                    </div>
                    <button type="submit" className="w-full bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors">
                      Fermer la caisse
                    </button>
                  </form>
                </div>
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
        {/* Navigation Tabs épurée */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-8 px-8 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`no-auto-icon inline-flex items-center gap-3 py-4 px-3 border-b-2 font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <BarTabIcon tabKey={tab.key} className="h-[18px] w-[18px] flex-none" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <span className="ml-4 text-gray-400">Chargement des données...</span>
              </div>
            ) : renderTabContent()}
          </div>
        </div>
      </div>

      {/* Modal Facture */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Détails de la Facture</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Numéro</span>
                <span className="text-white font-medium">{selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Date</span>
                <span className="text-white font-medium">{selectedInvoice.createdAt.toLocaleDateString('fr-FR')} {selectedInvoice.createdAt.toLocaleTimeString('fr-FR')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Table / Client</span>
                <span className="text-white font-medium">{selectedInvoice.tableNumber} {selectedInvoice.customerName ? `(${selectedInvoice.customerName})` : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Statut</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedInvoice.status)}`}>
                  {selectedInvoice.status === 'paid' ? 'Payée' : selectedInvoice.status === 'cancelled' ? 'Annulée' : 'Validée'}
                </span>
              </div>
              
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Articles commandés</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {selectedInvoice.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">{item.quantity}x {item.productName}</span>
                      <span className="text-white">{(item.quantity * item.unitPrice).toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                  {selectedInvoice.items.length === 0 && (
                    <span className="text-gray-500 text-sm italic">Aucun article enregistré.</span>
                  )}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                <span className="text-white font-bold">Total</span>
                <span className="text-2xl font-bold text-blue-400">{selectedInvoice.totalAmount.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-800/30 flex gap-3">
              <button onClick={() => selectedInvoice && printInvoiceAsPdf(selectedInvoice)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                Imprimer
              </button>
              {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                <button onClick={() => { handlePayOrder(selectedInvoice.id); setSelectedInvoice(null); }} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                  Payer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Details Caisse */}
      {showCashRegisterDetails && selectedRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Détails de la Caisse</h3>
              <button onClick={() => { setShowCashRegisterDetails(false); setSelectedRegister(null); }} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Numéro</span>
                <span className="text-white font-medium">{selectedRegister.registerNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Statut</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedRegister.status)}`}>
                  {selectedRegister.status === 'open' ? 'Ouverte' : 'Fermée'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Ouverte par</span>
                <span className="text-white font-medium">{selectedRegister.openedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Ouverture</span>
                <span className="text-white font-medium">{selectedRegister.openedAt.toLocaleString('fr-FR')}</span>
              </div>
              <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Solde d'ouverture</p>
                  <p className="text-lg font-bold text-white">{selectedRegister.openingBalance.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Solde actuel</p>
                  <p className="text-lg font-bold text-white">{selectedRegister.currentBalance.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Entrées</p>
                  <p className="text-sm text-green-400 font-medium">+{selectedRegister.cashIn.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Sorties</p>
                  <p className="text-sm text-red-400 font-medium">-{selectedRegister.cashOut.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Ventes totales</p>
                  <p className="text-lg font-bold text-blue-400">{selectedRegister.totalSales.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-800/30">
              <button onClick={() => { setShowCashRegisterDetails(false); handleRegisterMovement(selectedRegister); }} className="w-full bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                <FaExchangeAlt className="inline-block mr-1" /> Nouveau mouvement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mouvement de Caisse */}
      {showCashMovementModal && cashMovementRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Mouvement de Caisse - {cashMovementRegister.registerNumber}</h3>
              <button onClick={() => { setShowCashMovementModal(false); setCashMovementRegister(null); }} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCashMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                <select value={cashMovementDraft.type} onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, type: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="cash_in">Entrée de caisse</option>
                  <option value="cash_out">Sortie de caisse</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Montant (FCFA)</label>
                <input type="number" min="1" value={cashMovementDraft.amount} onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, amount: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
                <input type="text" value={cashMovementDraft.description} onChange={(e) => setCashMovementDraft({ ...cashMovementDraft, description: e.target.value })} placeholder="Motif du mouvement" className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowCashMovementModal(false); setCashMovementRegister(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 border border-gray-700 transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 transition-colors"><FaSave className="inline-block mr-1"/> Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Details Produit Stock */}
      {showStockDetails && selectedStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Détails du Produit</h3>
              <button onClick={() => { setShowStockDetails(false); setSelectedStockItem(null); }} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Produit</span>
                <span className="text-white font-medium">{selectedStockItem.productName} ({selectedStockItem.productCode})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Catégorie</span>
                <span className="text-white font-medium">{selectedStockItem.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Statut</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedStockItem.status)}`}>
                  {selectedStockItem.status === 'available' ? 'Disponible' : selectedStockItem.status}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400">Stock actuel</p>
                  <p className="text-lg font-bold text-white">{selectedStockItem.currentStock} {selectedStockItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Valeur totale</p>
                  <p className="text-lg font-bold text-white">{selectedStockItem.totalValue.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Coût unitaire</p>
                  <p className="text-sm text-white">{selectedStockItem.unitCost.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Prix de vente</p>
                  <p className="text-sm text-white">{selectedStockItem.sellingPrice.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Seuil minimum</p>
                  <p className="text-sm text-white">{selectedStockItem.minThreshold} {selectedStockItem.unit}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Seuil maximum</p>
                  <p className="text-sm text-white">{selectedStockItem.maxThreshold} {selectedStockItem.unit}</p>
                </div>
              </div>
              {selectedStockItem.lastMovementDate && (
                <div className="pt-4 border-t border-gray-800 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Dernier mouvement</span>
                  <span className="text-white font-medium">
                    {selectedStockItem.lastMovementType === 'entry' ? 'Entrée' : 'Sortie'} le {selectedStockItem.lastMovementDate.toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Entree Main Courante */}
      {showMainEntryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Nouvelle Entrée - Main Courante</h3>
              <button onClick={() => setShowMainEntryForm(false)} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddMainEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                  <input type="date" value={newEntryDraft.dateOperation} onChange={(e) => setNewEntryDraft({ ...newEntryDraft, dateOperation: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Heure</label>
                  <input type="time" value={newEntryDraft.heureOperation} onChange={(e) => setNewEntryDraft({ ...newEntryDraft, heureOperation: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Libellé</label>
                <input type="text" value={newEntryDraft.libelle} onChange={(e) => setNewEntryDraft({ ...newEntryDraft, libelle: e.target.value })} placeholder="Description de l'événement" className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Crédit</label>
                  <input type="number" min="0" value={newEntryDraft.credit} onChange={(e) => setNewEntryDraft({ ...newEntryDraft, credit: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Débit</label>
                  <input type="number" min="0" value={newEntryDraft.debit} onChange={(e) => setNewEntryDraft({ ...newEntryDraft, debit: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowMainEntryForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 border border-gray-700 transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"><FaSave className="inline-block mr-1"/> Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Modifier Entree Main Courante */}
      {showEditEntryModal && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Modifier l'Entrée - {editingEntry.title}</h3>
              <button onClick={() => { setShowEditEntryModal(false); setEditingEntry(null); }} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEditEntry} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                  <input type="date" value={editEntryDraft.dateOperation} onChange={(e) => setEditEntryDraft({ ...editEntryDraft, dateOperation: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Heure</label>
                  <input type="time" value={editEntryDraft.heureOperation} onChange={(e) => setEditEntryDraft({ ...editEntryDraft, heureOperation: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Libellé</label>
                <input type="text" value={editEntryDraft.libelle} onChange={(e) => setEditEntryDraft({ ...editEntryDraft, libelle: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Crédit</label>
                  <input type="number" min="0" value={editEntryDraft.credit} onChange={(e) => setEditEntryDraft({ ...editEntryDraft, credit: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Débit</label>
                  <input type="number" min="0" value={editEntryDraft.debit} onChange={(e) => setEditEntryDraft({ ...editEntryDraft, debit: e.target.value })} className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowEditEntryModal(false); setEditingEntry(null); }} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 border border-gray-700 transition-colors">Annuler</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"><FaSave className="inline-block mr-1"/> Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Details Entree Main Courante */}
      {showEntryDetailModal && selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Détails de l'Entrée</h3>
              <button onClick={() => { setShowEntryDetailModal(false); setSelectedEntry(null); }} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Titre</span>
                <span className="text-white font-medium">{selectedEntry.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Date/Heure</span>
                <span className="text-white font-medium">{selectedEntry.entryDate.toLocaleDateString('fr-FR')} {selectedEntry.entryTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Catégorie</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">{selectedEntry.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Priorité</span>
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-400">{selectedEntry.priority}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Localisation</span>
                <span className="text-white font-medium">{selectedEntry.location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Rapporté par</span>
                <span className="text-white font-medium">{selectedEntry.reportedBy}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Statut</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedEntry.status)}`}>
                  {selectedEntry.status === 'in_progress' ? 'En cours' : selectedEntry.status}
                </span>
              </div>
              <div className="pt-4 border-t border-gray-800">
                <p className="text-gray-400 text-sm mb-1">Description</p>
                <p className="text-white text-sm">{selectedEntry.description || 'Aucune description.'}</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-800 bg-gray-800/30">
              <button onClick={() => { setShowEntryDetailModal(false); handleEditMainEntry(selectedEntry); }} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                <FaEdit className="inline-block mr-1" /> Modifier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Envoi Email Facture */}
      {showEmailModal && emailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-800/50">
              <h3 className="text-lg font-bold text-white">Envoyer la Facture par Email</h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            {emailSent ? (
              <div className="p-8 text-center space-y-3">
                <FaCheck className="mx-auto text-green-400 w-10 h-10" />
                <p className="text-white font-medium">Email envoyé avec succès !</p>
              </div>
            ) : (
              <form onSubmit={handleSendEmail} className="p-6 space-y-4">
                <p className="text-sm text-gray-400">Facture <span className="text-white font-medium">{emailInvoice.invoiceNumber}</span></p>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Adresse email</label>
                  <input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} placeholder="client@example.com" className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none" required />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowEmailModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/5 border border-gray-700 transition-colors">Annuler</button>
                  <button type="submit" disabled={emailSending} className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors">
                    {emailSending ? 'Envoi...' : <><FaEnvelope className="inline-block mr-1"/> Envoyer</>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bar;
