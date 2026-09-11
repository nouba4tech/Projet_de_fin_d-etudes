import React, { useState, useMemo, useEffect } from 'react';
import { FaFileInvoiceDollar, FaExchangeAlt, FaBoxOpen, FaBook, FaListAlt, FaClipboardCheck, FaCheck, FaPlus, FaTimes, FaSave, FaTrash, FaEye, FaEdit, FaMoneyCheckAlt, FaPrint, FaArrowsAltV } from 'react-icons/fa';
import api from '../services/api';
import { openInvoiceWindow } from '../utils/invoiceTemplate';

interface Supplier {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  paymentTerms: string;
  rating: number;
  isActive: boolean;
  totalOrders: number;
  lastOrderDate?: Date;
}

interface InvoiceItem {
  id?: number;
  itemCode: string;
  itemName: string;
  categoryName?: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  totalPrice: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: Date;
  dueDate: Date;
  amount: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'sent' | 'validated' | 'paid' | 'overdue';
  items: InvoiceItem[];
  paymentMethod?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

interface StockTransferItem {
  id?: number;
  stockItemId: number;
  itemCode: string;
  itemName: string;
  quantity: number;
}

interface StockTransfer {
  id: string;
  transferNumber: string;
  transferDate: Date;
  fromLocation: string;
  toLocation: string;
  status: 'draft' | 'pending' | 'completed' | 'cancelled';
  items: StockTransferItem[];
  requestedBy: string;
  approvedBy?: string;
  notes?: string;
  createdAt: Date;
}

interface StockCard {
  id: number;
  productCode: string;
  productName: string;
  category: string;
  currentStock: number;
  unit: string;
  unitCost: number;
  totalValue: number;
  minThreshold: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  supplier?: string;
  scope?: string;
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

const Economat: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('saisir_facture');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [selectedSupplierInvoice, setSelectedSupplierInvoice] = useState<Invoice | null>(null);

  const loadSuppliers = async () => {
    setLoadingSuppliers(true);
    try {
      const response = await api.get('/fournisseurs');
      const data = response.data.map((f: any) => ({
        id: String(f.codeFournisseur),
        code: f.numero || '',
        name: f.nom || '',
        contactPerson: f.contact || '',
        email: '',
        phone: '',
        address: '',
        category: 'Général',
        paymentTerms: 'Comptant',
        rating: 5,
        isActive: true,
        totalOrders: 0,
        lastOrderDate: new Date()
      }));
      setSuppliers(data);
    } catch (error) {
      console.error("Erreur chargement fournisseurs", error);
    } finally {
      setLoadingSuppliers(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [loadingTransfers, setLoadingTransfers] = useState(false);
  const [stockCards, setStockCards] = useState<StockCard[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const showFlash = (tone: 'success' | 'error', text: string) => setFlashMessage({ tone, text });

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const extractApiMessage = (error: unknown): string => {
    if (typeof error === 'object' && error !== null) {
      const maybeError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = maybeError.response?.data?.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
    }
    return 'Une erreur est survenue.';
  };

  const mapInvoice = (dto: any): Invoice => ({
    id: String(dto.id),
    invoiceNumber: dto.invoiceNumber,
    supplierId: String(dto.supplierId),
    supplierName: dto.supplierName || 'Fournisseur',
    invoiceDate: new Date(dto.invoiceDate),
    dueDate: new Date(dto.dueDate),
    amount: Number(dto.subtotalAmount || 0),
    tax: Number(dto.taxAmount || 0),
    totalAmount: Number(dto.totalAmount || 0),
    status: dto.status,
    items: (dto.items || []).map((item: any) => ({
      id: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      categoryName: item.categoryName,
      quantity: Number(item.quantity || 0),
      unitName: item.unitName,
      unitPrice: Number(item.unitPrice || 0),
      totalPrice: Number(item.totalPrice || 0)
    })),
    notes: dto.notes,
    createdBy: dto.createdBy || 'Economat',
    createdAt: new Date(dto.createdAt)
  });

  const loadInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const { data } = await api.get('/stock/supplier-invoices');
      setInvoices(Array.isArray(data) ? data.map(mapInvoice) : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoadingInvoices(false);
    }
  };

  const mapTransfer = (dto: any): StockTransfer => ({
    id: String(dto.id),
    transferNumber: dto.transferNumber,
    transferDate: new Date(dto.transferDate),
    fromLocation: dto.fromLocation,
    toLocation: dto.toLocation,
    status: dto.status,
    items: (dto.items || []).map((item: any) => ({
      id: item.id,
      stockItemId: item.stockItemId,
      itemCode: item.itemCode,
      itemName: item.itemName,
      quantity: Number(item.quantity || 0)
    })),
    requestedBy: dto.requestedBy,
    approvedBy: dto.approvedBy,
    notes: dto.notes,
    createdAt: new Date(dto.createdAt)
  });

  const loadTransfers = async () => {
    setLoadingTransfers(true);
    try {
      const { data } = await api.get('/stock/transfers');
      setStockTransfers(Array.isArray(data) ? data.map(mapTransfer) : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoadingTransfers(false);
    }
  };

  const mapStockItem = (dto: any): StockCard => {
    const quantity = Number(dto.quantity || 0);
    const minThreshold = Number(dto.minThreshold || 0);
    return {
      id: dto.id,
      productCode: dto.code,
      productName: dto.name,
      category: dto.category,
      currentStock: quantity,
      unit: dto.unit,
      unitCost: Number(dto.unitPrice || 0),
      totalValue: quantity * Number(dto.unitPrice || 0),
      minThreshold,
      status: quantity <= 0 ? 'out_of_stock' : quantity <= minThreshold ? 'low_stock' : 'available',
      supplier: dto.supplier,
      scope: dto.scope
    };
  };

  const loadStockItems = async () => {
    setLoadingStock(true);
    try {
      const { data } = await api.get('/stock/items');
      setStockCards(Array.isArray(data) ? data.map(mapStockItem) : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoadingStock(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
    void loadTransfers();
    void loadStockItems();
  }, []);

  type DraftInvoiceLine = { itemCode: string; itemName: string; quantity: string; unitName: string; unitPrice: string };
  const emptyInvoiceLine = (): DraftInvoiceLine => ({ itemCode: '', itemName: '', quantity: '', unitName: '', unitPrice: '' });

  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: '',
    supplierId: '',
    invoiceDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date().toISOString().slice(0, 10),
    taxRate: '19.25',
    notes: ''
  });
  const [invoiceLines, setInvoiceLines] = useState<DraftInvoiceLine[]>([emptyInvoiceLine()]);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  const invoiceSubtotal = useMemo(
    () => invoiceLines.reduce((sum, line) => sum + (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0), 0),
    [invoiceLines]
  );
  const invoiceTaxAmount = useMemo(
    () => invoiceSubtotal * ((Number(invoiceForm.taxRate) || 0) / 100),
    [invoiceSubtotal, invoiceForm.taxRate]
  );

  const updateInvoiceLine = (index: number, patch: Partial<DraftInvoiceLine>) => {
    setInvoiceLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const removeInvoiceLine = (index: number) => {
    setInvoiceLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const resetInvoiceForm = () => {
    setInvoiceForm({
      invoiceNumber: '',
      supplierId: '',
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date().toISOString().slice(0, 10),
      taxRate: '19.25',
      notes: ''
    });
    setInvoiceLines([emptyInvoiceLine()]);
  };

  const submitInvoiceForm = async (status: 'draft' | 'sent') => {
    const validLines = invoiceLines.filter((line) => line.itemName.trim() && Number(line.quantity) > 0);
    if (!invoiceForm.invoiceNumber.trim() || !invoiceForm.supplierId || !validLines.length) {
      showFlash('error', 'Renseignez le numero de facture, le fournisseur et au moins un article.');
      return;
    }

    setSubmittingInvoice(true);
    try {
      await api.post('/stock/supplier-invoices', {
        invoiceNumber: invoiceForm.invoiceNumber.trim(),
        supplierId: Number(invoiceForm.supplierId),
        invoiceDate: new Date(invoiceForm.invoiceDate).toISOString(),
        dueDate: new Date(invoiceForm.dueDate).toISOString(),
        notes: invoiceForm.notes.trim() || null,
        status,
        items: validLines.map((line) => ({
          itemCode: line.itemCode.trim() || line.itemName.trim().toUpperCase().slice(0, 20),
          itemName: line.itemName.trim(),
          quantity: Number(line.quantity),
          unitName: line.unitName.trim() || 'unite',
          unitPrice: Number(line.unitPrice) || 0
        }))
      });
      showFlash('success', 'Facture fournisseur enregistree.');
      resetInvoiceForm();
      await loadInvoices();
      setActiveTab('liste_factures');
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmittingInvoice(false);
    }
  };

  type DraftTransferLine = { stockItemId: string; quantity: string };

  const [transferForm, setTransferForm] = useState({
    transferNumber: '',
    transferDate: new Date().toISOString().slice(0, 10),
    fromLocation: '',
    toLocation: '',
    requestedBy: '',
    approvedBy: '',
    notes: ''
  });
  const [transferLines, setTransferLines] = useState<DraftTransferLine[]>([{ stockItemId: '', quantity: '' }]);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const updateTransferLine = (index: number, patch: Partial<DraftTransferLine>) => {
    setTransferLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));
  };

  const removeTransferLine = (index: number) => {
    setTransferLines((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const resetTransferForm = () => {
    setTransferForm({
      transferNumber: '',
      transferDate: new Date().toISOString().slice(0, 10),
      fromLocation: '',
      toLocation: '',
      requestedBy: '',
      approvedBy: '',
      notes: ''
    });
    setTransferLines([{ stockItemId: '', quantity: '' }]);
  };

  const submitTransferForm = async () => {
    const validLines = transferLines.filter((line) => line.stockItemId && Number(line.quantity) > 0);
    if (!transferForm.transferNumber.trim() || !transferForm.fromLocation || !transferForm.toLocation || !validLines.length) {
      showFlash('error', 'Renseignez le numero de transfert, origine, destination et au moins un article.');
      return;
    }

    setSubmittingTransfer(true);
    try {
      await api.post('/stock/transfers', {
        transferNumber: transferForm.transferNumber.trim(),
        transferDate: new Date(transferForm.transferDate).toISOString(),
        fromLocation: transferForm.fromLocation,
        toLocation: transferForm.toLocation,
        requestedBy: transferForm.requestedBy.trim() || null,
        approvedBy: transferForm.approvedBy.trim() || null,
        notes: transferForm.notes.trim() || null,
        items: validLines.map((line) => ({
          stockItemId: Number(line.stockItemId),
          quantity: Number(line.quantity)
        }))
      });
      showFlash('success', 'Transfert de stock enregistre.');
      resetTransferForm();
      await loadTransfers();
      await loadStockItems();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmittingTransfer(false);
    }
  };

  const mainCouranteEntries: MainCourante[] = [
    {
      id: '1',
      entryDate: new Date('2024-04-10'),
      entryTime: '14:30',
      category: 'incident',
      priority: 'medium',
      title: 'Fuite au restaurant',
      description: 'Fuite d\'eau détectée près du lave-vaisselle du restaurant',
      location: 'Restaurant - Zone cuisine',
      reportedBy: 'Chef de cuisine',
      assignedTo: 'Service maintenance',
      status: 'in_progress'
    },
    {
      id: '2',
      entryDate: new Date('2024-04-10'),
      entryTime: '09:15',
      category: 'maintenance',
      priority: 'low',
      title: 'Changement ampoule chambre 201',
      description: 'Ampoule de la salle de bain clignote',
      location: 'Chambre 201',
      reportedBy: 'Maid service',
      assignedTo: 'Service technique',
      status: 'resolved',
      resolution: 'Ampoule remplacée',
      resolvedBy: 'Technicien',
      resolvedAt: new Date('2024-04-10')
    }
  ];

  const [inventoryPhysicalCounts, setInventoryPhysicalCounts] = useState<Record<number, string>>({});
  const [inventoryReasons, setInventoryReasons] = useState<Record<number, string>>({});
  const [submittingInventory, setSubmittingInventory] = useState(false);

  const inventoryEntries = useMemo(() => stockCards.map((card) => {
    const physicalRaw = inventoryPhysicalCounts[card.id];
    const physicalStock = physicalRaw !== undefined && physicalRaw !== '' ? Number(physicalRaw) : card.currentStock;
    const difference = physicalStock - card.currentStock;
    return {
      itemId: card.id,
      productName: card.productName,
      category: card.category,
      unit: card.unit,
      theoreticalStock: card.currentStock,
      physicalStock,
      difference,
      differenceValue: difference * card.unitCost,
      reason: inventoryReasons[card.id] || ''
    };
  }), [stockCards, inventoryPhysicalCounts, inventoryReasons]);

  const submitInventoryReconciliation = async () => {
    const itemsToReconcile = inventoryEntries.filter((entry) => entry.difference !== 0);
    if (!itemsToReconcile.length) {
      showFlash('error', 'Aucun ecart saisi. Modifiez le stock physique d\'au moins un article.');
      return;
    }

    setSubmittingInventory(true);
    try {
      await api.post('/stock/inventory/reconcile', {
        items: itemsToReconcile.map((entry) => ({
          itemId: entry.itemId,
          physicalQuantity: entry.physicalStock,
          reason: entry.reason || null
        })),
        reasonReference: `Inventaire du ${new Date().toLocaleDateString('fr-FR')}`
      });
      showFlash('success', `Inventaire applique: ${itemsToReconcile.length} article(s) ajuste(s).`);
      setInventoryPhysicalCounts({});
      setInventoryReasons({});
      await loadStockItems();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmittingInventory(false);
    }
  };

  const tabIcons: Record<string, React.ReactNode> = {
    saisir_facture: <FaFileInvoiceDollar />,
    transfert_stock: <FaExchangeAlt />,
    fiche_stock: <FaBoxOpen />,
    main_courante: <FaBook />,
    liste_factures: <FaListAlt />,
    saisie_inventaire: <FaClipboardCheck />
  };

  const tabs = [
    { key: 'saisir_facture', label: 'Saisir une facture', description: 'Enregistrez les factures fournisseurs et validez les paiements' },
    { key: 'transfert_stock', label: 'Transfert de Stock', description: 'Gérez les transferts de stock entre les différents services' },
    { key: 'fiche_stock', label: 'Fiche de stock', description: 'Consultez les fiches de stock détaillées et les mouvements' },
    { key: 'main_courante', label: 'Main courante', description: 'Suivez les incidents et événements quotidiens de l\'hôtel' },
    { key: 'liste_factures', label: 'Liste des factures fournisseurs', description: 'Consultez et gérez toutes les factures fournisseurs' },
    { key: 'saisie_inventaire', label: 'Saisie inventaire', description: 'Effectuez et validez les inventaires périodiques' }
  ];

  const categories = ['all', 'Alimentaire', 'Boissons', 'Entretien', 'Textile', 'Ménage'];
  const statuses = ['all', 'draft', 'validated', 'paid', 'overdue'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'validated': return 'bg-blue-500/20 text-blue-400';
      case 'paid': return 'bg-green-500/20 text-green-400';
      case 'overdue': return 'bg-red-500/20 text-red-400';
      case 'draft': return 'bg-white/50/20 text-gray-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const printSupplierInvoice = (invoice: Invoice) => {
    const formatAmount = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;
    const statusLabel = invoice.status === 'paid' ? 'Payée'
      : invoice.status === 'overdue' ? 'En retard'
      : invoice.status === 'validated' ? 'Validée' : 'Brouillon';

    openInvoiceWindow({
      documentTitle: `Facture fournisseur ${invoice.invoiceNumber}`,
      moduleLabel: 'Economat - Facture Fournisseur',
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate.toLocaleDateString('fr-FR'),
      statusLabel,
      infoBoxes: [
        {
          title: 'Fournisseur',
          lines: [
            { label: 'Nom', value: invoice.supplierName },
            { label: 'Echeance', value: invoice.dueDate.toLocaleDateString('fr-FR') }
          ]
        },
        {
          title: 'Paiement',
          lines: [
            { label: 'Mode', value: invoice.paymentMethod || 'Non renseigne' },
            { label: 'Enregistre par', value: invoice.createdBy }
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
        item.itemName,
        `${item.quantity} ${item.unitName}`,
        formatAmount(item.unitPrice),
        formatAmount(item.totalPrice)
      ]),
      totals: [
        { label: 'Montant HT', value: formatAmount(invoice.amount) },
        { label: 'TVA', value: formatAmount(invoice.tax) },
        { label: 'Montant TTC', value: formatAmount(invoice.totalAmount), emphasis: true }
      ],
      signatureLabels: ['Signature fournisseur', 'Economat Mirador Hotel']
    });
  };

  const markSupplierInvoicePaid = async (invoiceId: string) => {
    try {
      const { data } = await api.post(`/stock/supplier-invoices/${invoiceId}/pay`);
      const updated = mapInvoice(data);
      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updated : inv)));
      setSelectedSupplierInvoice(prev => (prev && prev.id === invoiceId ? updated : prev));
      showFlash('success', `Facture ${updated.invoiceNumber} marquee payee.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const validateSupplierInvoice = async (invoiceId: string) => {
    try {
      const { data } = await api.post(`/stock/supplier-invoices/${invoiceId}/validate`);
      const updated = mapInvoice(data);
      setInvoices(prev => prev.map(inv => (inv.id === invoiceId ? updated : inv)));
      setSelectedSupplierInvoice(prev => (prev && prev.id === invoiceId ? updated : prev));
      showFlash('success', `Facture ${updated.invoiceNumber} validee.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'incident': return 'bg-red-500/20 text-red-400';
      case 'maintenance': return 'bg-blue-500/20 text-blue-400';
      case 'security': return 'bg-purple-500/20 text-purple-400';
      case 'complaint': return 'bg-orange-500/20 text-orange-400';
      case 'other': return 'bg-white/50/20 text-gray-400';
      default: return 'bg-white/50/20 text-gray-400';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'saisir_facture':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Saisir une facture</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Enregistrez les factures fournisseurs et validez les paiements.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Numéro de facture</label>
                  <input type="text" value={invoiceForm.invoiceNumber} onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="FAC-2024-XXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Fournisseur</label>
                  <select value={invoiceForm.supplierId} onChange={(e) => setInvoiceForm(prev => ({ ...prev, supplierId: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Sélectionner un fournisseur</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Date de facture</label>
                  <input type="date" value={invoiceForm.invoiceDate} onChange={(e) => setInvoiceForm(prev => ({ ...prev, invoiceDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Date d'échéance</label>
                  <input type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Articles de la facture</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Article</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Unité</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Prix unitaire</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {invoiceLines.map((line, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">
                            <input type="text" value={line.itemName} onChange={(e) => updateInvoiceLine(index, { itemName: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm" placeholder="Nom de l'article" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="0" value={line.quantity} onChange={(e) => updateInvoiceLine(index, { quantity: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm" placeholder="0" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="text" value={line.unitName} onChange={(e) => updateInvoiceLine(index, { unitName: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm" placeholder="Unité" />
                          </td>
                          <td className="px-4 py-3">
                            <input type="number" min="0" value={line.unitPrice} onChange={(e) => updateInvoiceLine(index, { unitPrice: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm" placeholder="0" />
                          </td>
                          <td className="px-4 py-3 text-sm text-white">{((Number(line.quantity) || 0) * (Number(line.unitPrice) || 0)).toLocaleString('fr-FR')} FCFA</td>
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => removeInvoiceLine(index)} className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"><FaTrash /> <span className="hidden md:inline">Supprimer</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => setInvoiceLines(prev => [...prev, emptyInvoiceLine()])} className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium">
                  <FaPlus /> Ajouter un article
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Montant HT</label>
                  <input type="text" value={`${invoiceSubtotal.toLocaleString('fr-FR')} FCFA`} readOnly className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white bg-white/5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">TVA (%)</label>
                  <input type="number" value={invoiceForm.taxRate} onChange={(e) => setInvoiceForm(prev => ({ ...prev, taxRate: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="19.25" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Montant TTC</label>
                  <input type="text" value={`${(invoiceSubtotal + invoiceTaxAmount).toLocaleString('fr-FR')} FCFA`} readOnly className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm font-bold text-white bg-white/5" />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                <textarea rows={3} value={invoiceForm.notes} onChange={(e) => setInvoiceForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Notes supplémentaires..." />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetInvoiceForm} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium hover:bg-white/5">
                  <FaTimes /> Annuler
                </button>
                <button type="button" disabled={submittingInvoice} onClick={() => void submitInvoiceForm('draft')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
                  <FaSave /> Sauvegarder en brouillon
                </button>
                <button type="button" disabled={submittingInvoice} onClick={() => void submitInvoiceForm('sent')} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  <FaCheck /> {submittingInvoice ? 'Enregistrement...' : 'Enregistrer et envoyer'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'transfert_stock':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Transfert de Stock</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Gérez les transferts de stock entre les différents services.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Numéro de transfert</label>
                  <input type="text" value={transferForm.transferNumber} onChange={(e) => setTransferForm(prev => ({ ...prev, transferNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="TRANSF-2024-XXX" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Date de transfert</label>
                  <input type="date" value={transferForm.transferDate} onChange={(e) => setTransferForm(prev => ({ ...prev, transferDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Origine</label>
                  <select value={transferForm.fromLocation} onChange={(e) => setTransferForm(prev => ({ ...prev, fromLocation: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Sélectionner l'origine</option>
                    <option value="Magasin principal">Magasin principal</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Bar">Bar</option>
                    <option value="Housekeeping">Housekeeping</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Destination</label>
                  <select value={transferForm.toLocation} onChange={(e) => setTransferForm(prev => ({ ...prev, toLocation: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Sélectionner la destination</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Bar">Bar</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Magasin principal">Magasin principal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Demandé par</label>
                  <input type="text" value={transferForm.requestedBy} onChange={(e) => setTransferForm(prev => ({ ...prev, requestedBy: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nom du demandeur" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Approuvé par</label>
                  <input type="text" value={transferForm.approvedBy} onChange={(e) => setTransferForm(prev => ({ ...prev, approvedBy: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nom de l'approuvateur" />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-4">Articles à transférer</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5 border-b border-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Article</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock actuel</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Quantité</th>
                        <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Valeur</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {transferLines.map((line, index) => {
                        const selectedItem = stockCards.find(card => String(card.id) === line.stockItemId);
                        return (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <select value={line.stockItemId} onChange={(e) => updateTransferLine(index, { stockItemId: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm">
                                <option value="">Sélectionner un article</option>
                                {stockCards.map(card => (
                                  <option key={card.id} value={card.id}>{card.productName} ({card.productCode})</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3">
                              <input type="text" value={selectedItem ? `${selectedItem.currentStock} ${selectedItem.unit}` : ''} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm bg-white/5" readOnly />
                            </td>
                            <td className="px-4 py-3">
                              <input type="number" min="0" value={line.quantity} onChange={(e) => updateTransferLine(index, { quantity: e.target.value })} className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm" placeholder="0" />
                            </td>
                            <td className="hidden px-4 py-3 text-sm text-white md:table-cell">
                              {selectedItem ? ((Number(line.quantity) || 0) * selectedItem.unitCost).toLocaleString('fr-FR') : 0} FCFA
                            </td>
                            <td className="px-4 py-3">
                              <button type="button" onClick={() => removeTransferLine(index)} className="inline-flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"><FaTrash /> <span className="hidden md:inline">Supprimer</span></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={() => setTransferLines(prev => [...prev, { stockItemId: '', quantity: '' }])} className="mt-3 inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm font-medium">
                  <FaPlus /> Ajouter un article
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium text-gray-300 mb-1">Notes</label>
                <textarea rows={3} value={transferForm.notes} onChange={(e) => setTransferForm(prev => ({ ...prev, notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Notes sur le transfert..." />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={resetTransferForm} className="flex items-center gap-2 px-4 py-2 border border-gray-600/50 rounded-md text-sm font-medium hover:bg-white/5">
                  <FaTimes /> Annuler
                </button>
                <button type="button" disabled={submittingTransfer} onClick={() => void submitTransferForm()} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  <FaCheck /> {submittingTransfer ? 'Enregistrement...' : 'Enregistrer le transfert'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'fiche_stock':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Fiche de Stock</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Consultez les fiches de stock détaillées et les mouvements.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Rechercher un article..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {loadingStock ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">Chargement du stock...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {stockCards
                    .filter((card) => !searchTerm.trim() || `${card.productName} ${card.productCode}`.toLowerCase().includes(searchTerm.trim().toLowerCase()))
                    .map((card) => (
                    <div key={card.id} className="border border-gray-700/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{card.productName}</h3>
                          <p className="text-sm text-gray-400">{card.productCode}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(card.status)}`}>
                          {card.status === 'available' ? 'Disponible' : card.status === 'low_stock' ? 'Stock bas' : 'Epuise'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400">Stock actuel</p>
                          <p className="text-lg font-bold text-white">{card.currentStock} {card.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Valeur totale</p>
                          <p className="text-lg font-bold text-white">{card.totalValue.toLocaleString('fr-FR')} FCFA</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Seuil minimum</p>
                          <p className="text-sm text-white">{card.minThreshold} {card.unit}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Categorie</p>
                          <p className="text-sm text-white">{card.category}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Fournisseur</p>
                          <p className="text-sm text-white">{card.supplier || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Module</p>
                          <p className="text-sm text-white">{card.scope || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab('saisie_inventaire')}
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          <FaArrowsAltV /> Ajuster (inventaire)
                        </button>
                      </div>
                    </div>
                  ))}
                  {!stockCards.length ? (
                    <div className="md:col-span-2 px-4 py-10 text-center text-sm text-gray-400">Aucun article de stock enregistre.</div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        );

      case 'main_courante':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Main Courante</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Suivez les incidents et événements quotidiens de l'hôtel.
                  </p>
                </div>
                <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  <FaPlus /> Nouvelle entrée
                </button>
              </div>
              
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Date</label>
                    <input type="date" className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Catégorie</label>
                    <select className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Toutes</option>
                      <option value="incident">Incident</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="security">Sécurité</option>
                      <option value="complaint">Plainte</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Priorité</label>
                    <select className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Toutes</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">Élevée</option>
                      <option value="medium">Moyenne</option>
                      <option value="low">Faible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                    <select className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="">Tous</option>
                      <option value="open">Ouvert</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>
            </div>
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
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Assigné à</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {mainCouranteEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/5">
                    <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                      {entry.entryDate.toLocaleDateString('fr-FR')} {entry.entryTime}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                      {entry.title}
                      <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{entry.location}</span>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap md:table-cell">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(entry.category)}`}>
                        {entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.priority)}`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.location}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.reportedBy}</td>
                    <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.assignedTo || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <button className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2 text-sm"><FaEye /> <span className="hidden md:inline">Détails</span></button>
                      <button className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 text-sm"><FaEdit /> <span className="hidden md:inline">Modifier</span></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );

    case 'liste_factures':
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Liste des Factures Fournisseurs</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Consultez et gérez toutes les factures fournisseurs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Rechercher un numero de facture..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Fournisseur</label>
                <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">Tous</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Statut</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-600/50 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">Tous</option>
                  <option value="draft">Brouillon</option>
                  <option value="sent">Envoyée</option>
                  <option value="validated">Validée</option>
                  <option value="paid">Payée</option>
                  <option value="overdue">En retard</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">N° Facture</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Fournisseur</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date facture</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Date échéance</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Montant HT</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">TVA</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Montant TTC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {invoices
                    .filter((invoice) => filterSupplier === 'all' || invoice.supplierId === filterSupplier)
                    .filter((invoice) => filterStatus === 'all' || invoice.status === filterStatus)
                    .filter((invoice) => !searchTerm.trim() || invoice.invoiceNumber.toLowerCase().includes(searchTerm.trim().toLowerCase()))
                    .map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                        {invoice.invoiceNumber}
                        <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{invoice.supplierName}</span>
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{invoice.supplierName}</td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                        {invoice.invoiceDate.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                        {invoice.dueDate.toLocaleDateString('fr-FR')}
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                        {invoice.amount.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">
                        {invoice.tax.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                        {invoice.totalAmount.toLocaleString('fr-FR')} FCFA
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <button type="button" onClick={() => setSelectedSupplierInvoice(invoice)} className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2 text-sm"><FaEye /> <span className="hidden md:inline">Voir</span></button>
                        {invoice.status !== 'validated' && invoice.status !== 'paid' ? (
                          <button
                            type="button"
                            onClick={() => void validateSupplierInvoice(invoice.id)}
                            className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 mr-2 text-sm"
                          >
                            <FaCheck /> <span className="hidden md:inline">Valider</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => void markSupplierInvoicePaid(invoice.id)}
                          disabled={invoice.status === 'paid'}
                          className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 mr-2 text-sm disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-green-400"
                        >
                          <FaMoneyCheckAlt /> <span className="hidden md:inline">{invoice.status === 'paid' ? 'Payée' : 'Payer'}</span>
                        </button>
                        <button type="button" onClick={() => printSupplierInvoice(invoice)} className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-200 text-sm"><FaPrint /> <span className="hidden md:inline">Imprimer</span></button>
                      </td>
                    </tr>
                  ))}
                  {!loadingInvoices && !invoices.length ? (
                    <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-gray-400">Aucune facture fournisseur enregistree.</td></tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-400">
                Affichage de {invoices.length ? 1 : 0}-{invoices.length} sur {invoices.length} factures
              </div>
            </div>
          </div>
        </div>
      );

    case 'saisie_inventaire':
      return (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Saisie Inventaire</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Saisissez le stock physique constate: les ecarts sont calcules automatiquement et appliques au stock.
                </p>
              </div>
              <button
                type="button"
                disabled={submittingInventory}
                onClick={() => void submitInventoryReconciliation()}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60"
              >
                <FaCheck /> {submittingInventory ? 'Application...' : "Valider l'inventaire"}
              </button>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Articles à inventorier</h3>
              {loadingStock ? (
                <div className="px-4 py-10 text-center text-sm text-gray-400">Chargement du stock...</div>
              ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/5 border-b border-gray-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Article</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Catégorie</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Stock théorique</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Stock physique</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Différence</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Valeur différence</th>
                      <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider md:table-cell">Motif</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {inventoryEntries.map((entry) => (
                      <tr key={entry.itemId} className="hover:bg-white/5">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-white">{entry.productName}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.category}</td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm text-white md:table-cell">{entry.theoreticalStock} {entry.unit}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            value={inventoryPhysicalCounts[entry.itemId] ?? String(entry.theoreticalStock)}
                            onChange={(e) => setInventoryPhysicalCounts(prev => ({ ...prev, [entry.itemId]: e.target.value }))}
                            className="w-24 px-2 py-1 border border-gray-600/50 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            entry.difference < 0 ? 'text-red-400' :
                            entry.difference > 0 ? 'text-green-400' : 'text-white'
                          }`}>
                            {entry.difference > 0 ? '+' : ''}{entry.difference} {entry.unit}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 whitespace-nowrap text-sm font-medium text-white md:table-cell">
                          {entry.differenceValue.toLocaleString('fr-FR')} FCFA
                        </td>
                        <td className="hidden px-4 py-3 md:table-cell">
                          <input
                            type="text"
                            value={inventoryReasons[entry.itemId] ?? ''}
                            onChange={(e) => setInventoryReasons(prev => ({ ...prev, [entry.itemId]: e.target.value }))}
                            placeholder={entry.difference !== 0 ? 'Motif de l\'ecart' : ''}
                            className="w-full px-2 py-1 border border-gray-600/50 rounded text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                    {!inventoryEntries.length ? (
                      <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">Aucun article de stock a inventorier.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-400 font-medium">Total articles</p>
                    <p className="text-2xl font-bold text-blue-900">{inventoryEntries.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-400 font-medium">Écart total</p>
                    <p className="text-2xl font-bold text-red-900">
                      {inventoryEntries.reduce((sum, entry) => sum + entry.difference, 0)}
                    </p>
                  </div>
                  <div className="bg-red-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Valeur écart</p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {inventoryEntries.reduce((sum, entry) => sum + entry.differenceValue, 0).toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div className="bg-yellow-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
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
      {flashMessage ? (
        <div className="fixed right-6 top-6 z-[100] w-full max-w-sm">
          <div className={`rounded-2xl border px-5 py-4 text-sm shadow-2xl backdrop-blur-xl ${
            flashMessage.tone === 'success'
              ? 'border-green-500/30 bg-green-900/90 text-green-300'
              : 'border-red-500/30 bg-red-900/90 text-red-300'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <span>{flashMessage.text}</span>
              <button type="button" onClick={() => setFlashMessage(null)} className="text-xs uppercase tracking-wider text-white/70 hover:text-white">
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="max-w-full mx-auto px-6 lg:px-8 py-8">

        {/* Navigation Tabs épurée */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
            <div className="border-b border-gray-700/50">
              <nav className="flex space-x-6 px-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-400 bg-gradient-to-r from-blue-500/10 to-purple-500/10'
                        : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <span className="mr-2 inline-flex">{tabIcons[tab.key]}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
            
            {/* Description minimaliste */}
            <div className="px-6 py-3 bg-gradient-to-r from-gray-800/30 to-gray-900/30 border-b border-gray-700/50">
              <p className="text-sm text-gray-300">
                {tabs.find(tab => tab.key === activeTab)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {selectedSupplierInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-700/70 bg-gray-900 shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-700/70 bg-gray-800/80 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-orange-300">Facture fournisseur</p>
                <h3 className="mt-1 text-2xl font-semibold text-white">{selectedSupplierInvoice.invoiceNumber}</h3>
                <p className="mt-1 text-sm text-gray-400">{selectedSupplierInvoice.supplierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSupplierInvoice(null)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Fermer les details"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-xl border border-gray-700/60 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Facture</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between"><span>Date</span><span className="text-white">{selectedSupplierInvoice.invoiceDate.toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between"><span>Echeance</span><span className="text-white">{selectedSupplierInvoice.dueDate.toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between">
                    <span>Statut</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSupplierInvoice.status)}`}>{selectedSupplierInvoice.status}</span>
                  </div>
                  <div className="flex justify-between"><span>Enregistre par</span><span className="text-white">{selectedSupplierInvoice.createdBy}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-gray-700/60 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Montants</h4>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between"><span>Montant HT</span><span className="text-white">{selectedSupplierInvoice.amount.toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between"><span>TVA</span><span className="text-white">{selectedSupplierInvoice.tax.toLocaleString('fr-FR')} FCFA</span></div>
                  <div className="flex justify-between font-semibold"><span>Montant TTC</span><span className="text-white">{selectedSupplierInvoice.totalAmount.toLocaleString('fr-FR')} FCFA</span></div>
                  {selectedSupplierInvoice.paymentMethod && (
                    <div className="flex justify-between"><span>Mode de paiement</span><span className="text-white">{selectedSupplierInvoice.paymentMethod}</span></div>
                  )}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border border-gray-700/60 bg-white/5 p-4">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-blue-300">Articles</h4>
                <div className="space-y-2 text-sm">
                  {selectedSupplierInvoice.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-700/40 pb-2 last:border-0 last:pb-0">
                      <span className="text-gray-300">{item.itemName} <span className="text-gray-500">({item.quantity} {item.unitName})</span></span>
                      <span className="text-white font-medium">{item.totalPrice.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-700/70 px-6 py-4">
              <button
                type="button"
                onClick={() => printSupplierInvoice(selectedSupplierInvoice)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-600/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/5"
              >
                <FaPrint /> Imprimer
              </button>
              {selectedSupplierInvoice.status !== 'paid' && (
                <button
                  type="button"
                  onClick={() => void markSupplierInvoicePaid(selectedSupplierInvoice.id)}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-500"
                >
                  <FaMoneyCheckAlt /> Marquer payee
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Economat;
