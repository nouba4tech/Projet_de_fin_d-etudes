import React, { useEffect, useMemo, useState } from 'react';
import { FaSearch, FaArrowsAltV, FaExchangeAlt, FaListUl, FaClipboardList, FaChartBar, FaPlus, FaTimes, FaSave, FaTrash, FaEye, FaEdit, FaDownload, FaCheck, FaArrowRight, FaUndo, FaPlay } from 'react-icons/fa';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../services/api';

type StockTab = 'interroger' | 'mouvement' | 'transfert' | 'mouvements' | 'inventaire' | 'statistiques';

type FlashMessage = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

type StockItem = {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minThreshold: number;
  supplier?: string;
  location: string;
  lastUpdated?: string;
  status: 'DISPONIBLE' | 'RUPTURE' | 'ALERTE';
};

type StockMovement = {
  id: string;
  itemId: string;
  type: 'ENTRY' | 'EXIT';
  quantity: number;
  reason: string;
  reference?: string;
  date: string;
  location: string;
  item?: StockItem;
};

type StockTransfer = {
  id: string;
  itemId: string;
  quantity: number;
  from: string;
  to: string;
  reference: string;
  note: string;
  date: string;
  item?: StockItem;
};

type InventoryEntry = {
  itemId: string;
  physicalQuantity: string;
};

type ItemFormState = {
  code: string;
  name: string;
  category: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  minThreshold: string;
  supplier: string;
  location: string;
};

type MovementFormState = {
  itemId: string;
  type: 'ENTRY' | 'EXIT';
  quantity: string;
  reason: string;
  reference: string;
};

type TransferFormState = {
  itemId: string;
  quantity: string;
  from: string;
  to: string;
  reference: string;
  note: string;
};

const tabIcons: Record<StockTab, React.ReactNode> = {
  interroger: <FaSearch />,
  mouvement: <FaArrowsAltV />,
  transfert: <FaExchangeAlt />,
  mouvements: <FaListUl />,
  inventaire: <FaClipboardList />,
  statistiques: <FaChartBar />
};

const tabs: Array<{ key: StockTab; label: string; description: string }> = [
  { key: 'interroger', label: 'Interroger', description: 'Consultez rapidement les fiches articles, les niveaux de stock et les actions disponibles.' },
  { key: 'mouvement', label: 'Mouvement', description: 'Enregistrez les entrees, sorties et motifs d utilisation directement depuis le module.' },
  { key: 'transfert', label: 'Transfert', description: 'Suivez les transferts internes entre les differents points de stockage de l hotel.' },
  { key: 'mouvements', label: 'Liste des mouvements', description: 'Visualisez l historique complet des operations et exportez les journaux au besoin.' },
  { key: 'inventaire', label: 'Inventaire', description: 'Comparez le stock theorique et le stock physique, puis validez les ajustements.' },
  { key: 'statistiques', label: 'Statistiques', description: 'Surveillez les alertes, la valeur du stock et les categories les plus sensibles.' }
];

const categories = ['Tous', 'Textile', 'Produits hygiene', 'Boissons', 'Alimentaire', 'Entretien', 'Technique'];
const locations = ['STOCK_MODULE', 'RESTAURANT', 'BAR', 'RECEPTION', 'ECONOMAT'];

const defaultItemForm = (): ItemFormState => ({
  code: '',
  name: '',
  category: 'Textile',
  quantity: '0',
  unit: 'pieces',
  unitPrice: '0',
  minThreshold: '0',
  supplier: '',
  location: 'STOCK_MODULE'
});

const defaultMovementForm = (): MovementFormState => ({
  itemId: '',
  type: 'ENTRY',
  quantity: '',
  reason: '',
  reference: ''
});

const defaultTransferForm = (): TransferFormState => ({
  itemId: '',
  quantity: '',
  from: 'STOCK_MODULE',
  to: 'RESTAURANT',
  reference: '',
  note: ''
});

const computeStatus = (quantity: number, minThreshold: number): StockItem['status'] => {
  if (quantity <= 0) {
    return 'RUPTURE';
  }
  if (quantity <= minThreshold) {
    return 'ALERTE';
  }
  return 'DISPONIBLE';
};

const mapApiItem = (item: {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  minThreshold: number;
  supplier?: string;
  scope?: string;
  scopeReference?: string;
  lastUpdated?: string;
}): StockItem => {
  const quantity = Number(item.quantity ?? 0);
  const minThreshold = Number(item.minThreshold ?? 0);
  return {
    id: String(item.id),
    code: item.code,
    name: item.name,
    category: item.category,
    quantity,
    unit: item.unit,
    unitPrice: Number(item.unitPrice ?? 0),
    minThreshold,
    supplier: item.supplier ?? '',
    location: item.scopeReference || item.scope || 'STOCK_MODULE',
    lastUpdated: item.lastUpdated,
    status: computeStatus(quantity, minThreshold)
  };
};

const extractApiMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };
    return maybeResponse.response?.data?.message ?? maybeResponse.message ?? 'Une erreur est survenue.';
  }
  return 'Une erreur est survenue.';
};

const Stock: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StockTab>('interroger');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('Tous');
  const [filterStatus, setFilterStatus] = useState('Tous');
  const [flashMessage, setFlashMessage] = useState<FlashMessage | null>(null);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<Record<string, InventoryEntry>>({});
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const [itemsLoading, setItemsLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [itemSubmitting, setItemSubmitting] = useState(false);
  const [movementSubmitting, setMovementSubmitting] = useState(false);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const [itemForm, setItemForm] = useState<ItemFormState>(defaultItemForm);
  const [movementForm, setMovementForm] = useState<MovementFormState>(defaultMovementForm);
  const [transferForm, setTransferForm] = useState<TransferFormState>(defaultTransferForm);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);

  const showFlash = (tone: FlashMessage['tone'], text: string) => {
    setFlashMessage({ tone, text });
  };

  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const response = await api.get('/stock/items');
      const items = Array.isArray(response.data) ? response.data.map(mapApiItem) : [];
      setStockItems(items);
      if (!movementForm.itemId && items[0]) {
        setMovementForm(prev => ({ ...prev, itemId: items[0].id }));
      }
      if (!transferForm.itemId && items[0]) {
        setTransferForm(prev => ({ ...prev, itemId: items[0].id }));
      }
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setItemsLoading(false);
    }
  };

  const loadMovements = async () => {
    setMovementsLoading(true);
    try {
      const response = await api.get('/stock/movements');
      const nextMovements: StockMovement[] = Array.isArray(response.data)
        ? response.data.map((movement: any) => ({
            id: String(movement.id),
            itemId: String(movement.itemId),
            type: movement.movementType === 'EXIT' ? 'EXIT' : 'ENTRY',
            quantity: Number(movement.quantity ?? 0),
            reason: movement.reason,
            reference: movement.reference ?? '',
            date: movement.createdAt ?? new Date().toISOString(),
            location: movement.itemScopeReference || movement.itemScope || 'STOCK_MODULE'
          }))
        : [];
      setMovements(nextMovements);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setMovementsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await api.get('/fournisseurs');
      setSuppliers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Erreur chargement fournisseurs", error);
    }
  };

  const loadTransfers = async () => {
    try {
      const response = await api.get('/stock/transfers');
      const nextTransfers: StockTransfer[] = Array.isArray(response.data)
        ? response.data.map((transfer: any) => ({
            id: String(transfer.id),
            date: transfer.transferDate,
            itemId: String(transfer.items?.[0]?.stockItemId || transfer.itemId || ''),
            quantity: Number(transfer.items?.[0]?.quantity || transfer.quantity || 0),
            from: transfer.fromLocation,
            to: transfer.toLocation,
            reference: transfer.transferNumber,
            note: transfer.notes
          }))
        : [];
      setTransfers(nextTransfers);
    } catch (error) {
      console.error("Erreur chargement transferts", error);
    }
  };

  useEffect(() => {
    void Promise.all([loadItems(), loadMovements(), loadSuppliers(), loadTransfers()]);
  }, []);

  const itemsById = useMemo(
    () => Object.fromEntries(stockItems.map(item => [item.id, item])),
    [stockItems]
  );

  const enrichedMovements = useMemo(
    () => movements.map(movement => ({
      ...movement,
      item: itemsById[movement.itemId]
    })),
    [movements, itemsById]
  );

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => {
      const search = searchTerm.trim().toLowerCase();
      const matchesSearch = !search ||
        item.code.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.category.toLowerCase().includes(search);
      const matchesCategory = filterCategory === 'Tous' || item.category === filterCategory;
      const matchesStatus = filterStatus === 'Tous' || item.status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [stockItems, searchTerm, filterCategory, filterStatus]);

  const selectedItem = selectedItemId ? itemsById[selectedItemId] : null;

  const totalStockValue = useMemo(
    () => stockItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [stockItems]
  );

  const alertItems = stockItems.filter(item => item.status === 'ALERTE').length;
  const ruptureItems = stockItems.filter(item => item.status === 'RUPTURE').length;
  const stockValueChartData = useMemo(
    () => stockItems
      .slice()
      .sort((a, b) => (b.quantity * b.unitPrice) - (a.quantity * a.unitPrice))
      .slice(0, 5)
      .map(item => ({
        name: item.name.length > 16 ? `${item.name.slice(0, 16)}...` : item.name,
        value: item.quantity * item.unitPrice
      })),
    [stockItems]
  );

  const resetItemForm = () => {
    setItemForm(defaultItemForm());
    setEditingItemId(null);
    setShowItemForm(false);
  };

  const openCreateItemForm = () => {
    setEditingItemId(null);
    setItemForm(defaultItemForm());
    setShowItemForm(true);
    setActiveTab('interroger');
  };

  const openEditItemForm = (item: StockItem) => {
    setEditingItemId(item.id);
    setItemForm({
      code: item.code,
      name: item.name,
      category: item.category,
      quantity: String(item.quantity),
      unit: item.unit,
      unitPrice: String(item.unitPrice),
      minThreshold: String(item.minThreshold),
      supplier: item.supplier ?? '',
      location: item.location
    });
    setShowItemForm(true);
    setActiveTab('interroger');
  };

  const handleItemSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!itemForm.code.trim() || !itemForm.name.trim()) {
      showFlash('error', 'Veuillez renseigner le code et le nom de l article.');
      return;
    }

    setItemSubmitting(true);
    try {
      const payload = {
        code: itemForm.code.trim(),
        name: itemForm.name.trim(),
        category: itemForm.category.trim(),
        quantity: Number(itemForm.quantity || 0),
        unit: itemForm.unit.trim(),
        unitPrice: Number(itemForm.unitPrice || 0),
        minThreshold: Number(itemForm.minThreshold || 0),
        supplier: itemForm.supplier.trim() || null,
        scope: itemForm.location.trim() || 'STOCK_MODULE',
        scopeReference: itemForm.location.trim() || 'STOCK_MODULE'
      };

      if (editingItemId) {
        const response = await api.put(`/stock/items/${editingItemId}`, payload);
        const updated = mapApiItem(response.data);
        setStockItems(prev => prev.map(item => (item.id === editingItemId ? updated : item)));
        showFlash('success', `Article ${updated.name} modifie avec succes.`);
      } else {
        const response = await api.post('/stock/items', payload);
        const created = mapApiItem(response.data);
        setStockItems(prev => [created, ...prev]);
        if (!movementForm.itemId) {
          setMovementForm(prev => ({ ...prev, itemId: created.id }));
        }
        if (!transferForm.itemId) {
          setTransferForm(prev => ({ ...prev, itemId: created.id }));
        }
        showFlash('success', `Article ${created.name} ajoute avec succes.`);
      }

      resetItemForm();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setItemSubmitting(false);
    }
  };

  const deleteItem = async (item: StockItem) => {
    const confirmed = window.confirm(`Supprimer l article ${item.name} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/stock/items/${item.id}`);
      setStockItems(prev => prev.filter(entry => entry.id !== item.id));
      setMovements(prev => prev.filter(entry => entry.itemId !== item.id));
      showFlash('success', `Article ${item.name} supprime.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const handleMovementSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!movementForm.itemId || !movementForm.quantity || !movementForm.reason.trim()) {
      showFlash('error', 'Veuillez completer les informations du mouvement.');
      return;
    }

    setMovementSubmitting(true);
    try {
      const response = await api.post('/stock/movements', {
        itemId: Number(movementForm.itemId),
        movementType: movementForm.type,
        quantity: Number(movementForm.quantity),
        reason: movementForm.reason.trim(),
        reference: movementForm.reference.trim() || null
      });

      const createdMovement: StockMovement = {
        id: String(response.data.id),
        itemId: String(response.data.itemId),
        type: response.data.movementType === 'EXIT' ? 'EXIT' : 'ENTRY',
        quantity: Number(response.data.quantity ?? 0),
        reason: response.data.reason,
        reference: response.data.reference ?? '',
        date: response.data.createdAt ?? new Date().toISOString(),
        location: response.data.itemScopeReference || response.data.itemScope || 'STOCK_MODULE'
      };

      setMovements(prev => [createdMovement, ...prev]);
      await loadItems();
      setMovementForm(prev => ({ ...defaultMovementForm(), itemId: prev.itemId }));
      showFlash('success', 'Mouvement de stock enregistre.');
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setMovementSubmitting(false);
    }
  };

  const handleTransferSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const item = itemsById[transferForm.itemId];
    const quantity = Number(transferForm.quantity);

    if (!item || !quantity || !transferForm.reference.trim()) {
      showFlash('error', 'Veuillez completer le transfert.');
      return;
    }
    if (transferForm.from === transferForm.to) {
      showFlash('error', 'L origine et la destination doivent etre differentes.');
      return;
    }

    setTransferSubmitting(true);
    try {
      await api.post('/stock/transfers', {
        transferNumber: transferForm.reference.trim(),
        transferDate: new Date().toISOString(),
        fromLocation: transferForm.from,
        toLocation: transferForm.to,
        notes: transferForm.note.trim() || null,
        requestedBy: 'Service Demandeur',
        approvedBy: 'Responsable Stock',
        items: [{
          stockItemId: Number(item.id),
          quantity: quantity
        }]
      });

      setTransferForm(prev => ({ ...defaultTransferForm(), itemId: prev.itemId }));
      showFlash('success', `Transfert ${transferForm.reference} enregistré avec succès.`);
      await loadItems();
      await loadMovements();
      await loadTransfers();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setTransferSubmitting(false);
    }
  };

  const launchInventory = () => {
    const initialEntries = Object.fromEntries(
      stockItems.map(item => [item.id, { itemId: item.id, physicalQuantity: String(item.quantity) }])
    ) as Record<string, InventoryEntry>;
    setInventoryEntries(initialEntries);
    showFlash('info', 'Inventaire initialise a partir du stock theorique.');
  };

  const validateInventory = async () => {
    const itemsToReconcile = stockItems
      .map(item => {
        const physical = inventoryEntries[item.id]?.physicalQuantity !== undefined
          ? Number(inventoryEntries[item.id].physicalQuantity)
          : item.quantity;
        return { itemId: Number(item.id), physicalQuantity: physical, reason: 'Ajustement inventaire physique' };
      })
      .filter(entry => {
        const item = itemsById[String(entry.itemId)];
        return item && entry.physicalQuantity !== item.quantity;
      });

    if (!itemsToReconcile.length) {
      showFlash('success', 'Inventaire validé: aucune différence détectée.');
      setInventoryEntries({});
      return;
    }

    try {
      await api.post('/stock/inventory/reconcile', {
        items: itemsToReconcile,
        reasonReference: `INV-${new Date().toISOString().slice(0, 10)}`
      });
      showFlash('success', `Inventaire validé : ${itemsToReconcile.length} écart(s) ajusté(s).`);
      setInventoryEntries({});
      await loadItems();
      await loadMovements();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const exportMovements = () => {
    showFlash('info', `Export pret: ${enrichedMovements.length} mouvements prepares.`);
  };

  const exportInventory = () => {
    showFlash('info', `Export inventaire pret: ${stockItems.length} articles inclus.`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPONIBLE':
        return 'bg-green-500/20 text-green-400';
      case 'RUPTURE':
        return 'bg-red-500/20 text-red-400';
      case 'ALERTE':
        return 'bg-yellow-500/20 text-yellow-400';
      default:
        return 'bg-white/10 text-gray-300';
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'interroger':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Interroger un article</h2>
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-medium text-blue-400">
                    {filteredItems.length} articles
                  </div>
                  <button type="button" onClick={openCreateItemForm} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                    <FaPlus /> Nouvel article
                  </button>
                </div>
              </div>
              <p className="mb-6 text-gray-400">
                Consultez rapidement les fiches articles, les niveaux de stock et les actions disponibles.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Recherche</label>
                  <input
                    type="text"
                    placeholder="Code, nom, categorie..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Categorie</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-300">Statut</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {['Tous', 'DISPONIBLE', 'RUPTURE', 'ALERTE'].map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" onClick={() => showFlash('info', `${filteredItems.length} article(s) trouves.`)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700">
                    <FaSearch /> Rechercher
                  </button>
                </div>
              </div>
            </div>

            {showItemForm ? (
              <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {editingItemId ? 'Modifier un article' : 'Ajouter un article'}
                  </h3>
                  <button type="button" onClick={resetItemForm} className="flex items-center gap-2 rounded-lg border border-gray-700/50 px-4 py-2 text-sm text-gray-300 hover:bg-white/5">
                    <FaTimes /> Fermer
                  </button>
                </div>
                <form onSubmit={handleItemSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <input value={itemForm.code} onChange={(e) => setItemForm(prev => ({ ...prev, code: e.target.value }))} placeholder="Code article" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <input value={itemForm.name} onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Nom article" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <select 
                      value={itemForm.supplier} 
                      onChange={(e) => setItemForm(prev => ({ ...prev, supplier: e.target.value }))} 
                      className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white"
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map(s => (
                        <option key={s.codeFournisseur} value={s.nom}>{s.nom}</option>
                      ))}
                    </select>
                    <select value={itemForm.category} onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))} className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white">
                      {categories.filter(category => category !== 'Tous').map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <input value={itemForm.quantity} onChange={(e) => setItemForm(prev => ({ ...prev, quantity: e.target.value }))} type="number" min="0" placeholder="Quantite" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <input value={itemForm.unit} onChange={(e) => setItemForm(prev => ({ ...prev, unit: e.target.value }))} placeholder="Unite" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <input value={itemForm.unitPrice} onChange={(e) => setItemForm(prev => ({ ...prev, unitPrice: e.target.value }))} type="number" min="0" placeholder="Prix unitaire" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <input value={itemForm.minThreshold} onChange={(e) => setItemForm(prev => ({ ...prev, minThreshold: e.target.value }))} type="number" min="0" placeholder="Seuil minimum" className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white" />
                    <select value={itemForm.location} onChange={(e) => setItemForm(prev => ({ ...prev, location: e.target.value }))} className="rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white">
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={resetItemForm} className="flex items-center gap-2 rounded-2xl border border-gray-700/50 px-4 py-2 hover:bg-white/5"><FaUndo /> Annuler</button>
                    <button type="submit" disabled={itemSubmitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60">
                      <FaSave /> {itemSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="overflow-hidden rounded-xl bg-gray-800/50 shadow-sm">
              {itemsLoading ? (
                <div className="px-6 py-10 text-center text-sm text-gray-300">Chargement des articles...</div>
              ) : (
                <table className="w-full">
                  <thead className="border-b border-gray-700/50 bg-white/5">
                    <tr>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Article</th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Categorie</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Stock</th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Seuil</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5">
                        <td className="hidden whitespace-nowrap px-6 py-4 text-sm font-medium text-white md:table-cell">{item.code}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-white">
                          {item.name}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{item.code}</span>
                        </td>
                        <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-400 md:table-cell">{item.category}</td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-white">{item.quantity} {item.unit}</td>
                        <td className="hidden whitespace-nowrap px-6 py-4 text-sm text-gray-400 md:table-cell">{item.minThreshold} {item.unit}</td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => setSelectedItemId(item.id)} title="Voir détails" className="inline-flex items-center px-2 py-1 text-blue-400 hover:text-blue-300" style={{fontSize: '12px'}}><FaEye /></button>
                            <button type="button" onClick={() => {
                              setMovementForm(prev => ({ ...prev, itemId: item.id }));
                              setActiveTab('mouvement');
                            }} title="Mouvement" className="inline-flex items-center px-2 py-1 text-green-400 hover:text-green-300" style={{fontSize: '12px'}}><FaArrowsAltV /></button>
                            <button type="button" onClick={() => openEditItemForm(item)} title="Modifier" className="inline-flex items-center px-2 py-1 text-yellow-300 hover:text-yellow-200" style={{fontSize: '12px'}}><FaEdit /></button>
                            <button type="button" onClick={() => void deleteItem(item)} title="Supprimer" className="inline-flex items-center px-2 py-1 text-red-400 hover:text-red-300" style={{fontSize: '12px'}}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {selectedItem ? (
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Fiche article</h3>
                  <button type="button" onClick={() => setSelectedItemId(null)} className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"><FaTimes /> Fermer</button>
                </div>
                <div className="grid grid-cols-1 gap-4 text-sm text-gray-300 md:grid-cols-2">
                  <p><span className="font-semibold text-white">Code:</span> {selectedItem.code}</p>
                  <p><span className="font-semibold text-white">Nom:</span> {selectedItem.name}</p>
                  <p><span className="font-semibold text-white">Categorie:</span> {selectedItem.category}</p>
                  <p><span className="font-semibold text-white">Stock:</span> {selectedItem.quantity} {selectedItem.unit}</p>
                  <p><span className="font-semibold text-white">Prix unitaire:</span> {selectedItem.unitPrice.toLocaleString('fr-FR')} FCFA</p>
                  <p><span className="font-semibold text-white">Emplacement:</span> {selectedItem.location}</p>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'mouvement':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-white">Mouvement de stock</h2>
              <p className="mb-6 text-gray-400">
                Enregistrez les entrees, sorties et motifs d utilisation directement depuis le module.
              </p>

              <form onSubmit={handleMovementSubmit}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Article</label>
                    <select value={movementForm.itemId} onChange={(e) => setMovementForm(prev => ({ ...prev, itemId: e.target.value }))} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selectionner</option>
                      {stockItems.map(item => (
                        <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Type de mouvement</label>
                    <select value={movementForm.type} onChange={(e) => setMovementForm(prev => ({ ...prev, type: e.target.value as MovementFormState['type'] }))} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="ENTRY">Entree</option>
                      <option value="EXIT">Sortie</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Quantite</label>
                    <input value={movementForm.quantity} onChange={(e) => setMovementForm(prev => ({ ...prev, quantity: e.target.value }))} type="number" min="1" className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Reference</label>
                    <input value={movementForm.reference} onChange={(e) => setMovementForm(prev => ({ ...prev, reference: e.target.value }))} type="text" className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-300">Motif</label>
                    <textarea value={movementForm.reason} onChange={(e) => setMovementForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setMovementForm(defaultMovementForm())} className="flex items-center gap-2 rounded-2xl border border-gray-700/50 px-4 py-2 hover:bg-white/5"><FaUndo /> Annuler</button>
                  <button type="submit" disabled={movementSubmitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"><FaSave /> Enregistrer</button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'transfert':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-white">Transfert de stock</h2>
              <p className="mb-6 text-gray-400">
                Suivez les transferts internes entre les differents points de stockage de l hotel.
              </p>

              <form onSubmit={handleTransferSubmit}>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Article</label>
                    <select value={transferForm.itemId} onChange={(e) => setTransferForm(prev => ({ ...prev, itemId: e.target.value }))} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Selectionner</option>
                      {stockItems.map(item => (
                        <option key={item.id} value={item.id}>{item.code} - {item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Quantite</label>
                    <input value={transferForm.quantity} onChange={(e) => setTransferForm(prev => ({ ...prev, quantity: e.target.value }))} type="number" min="1" className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Origine</label>
                    <select value={transferForm.from} onChange={(e) => setTransferForm(prev => ({ ...prev, from: e.target.value }))} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Destination</label>
                    <select value={transferForm.to} onChange={(e) => setTransferForm(prev => ({ ...prev, to: e.target.value }))} className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {locations.map(location => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Reference</label>
                    <input value={transferForm.reference} onChange={(e) => setTransferForm(prev => ({ ...prev, reference: e.target.value }))} type="text" className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-300">Note</label>
                    <input value={transferForm.note} onChange={(e) => setTransferForm(prev => ({ ...prev, note: e.target.value }))} type="text" className="w-full rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 px-3 py-2 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setTransferForm(defaultTransferForm())} className="flex items-center gap-2 rounded-2xl border border-gray-700/50 px-4 py-2 hover:bg-white/5"><FaUndo /> Annuler</button>
                  <button type="submit" disabled={transferSubmitting} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"><FaArrowRight /> Transferer</button>
                </div>
              </form>
            </div>

            {transfers.length ? (
              <div className="overflow-hidden rounded-xl bg-gray-800/50 shadow-sm">
                <table className="w-full">
                  <thead className="border-b border-gray-700/50 bg-white/5">
                    <tr>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Article</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Quantite</th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">De</th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Vers</th>
                      <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {transfers.map(transfer => (
                      <tr key={transfer.id} className="hover:bg-white/5">
                        <td className="hidden px-6 py-4 text-sm text-white md:table-cell">{new Date(transfer.date).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 text-sm text-white">
                          {transfer.item?.name}
                          <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{transfer.from} → {transfer.to}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-white">{transfer.quantity}</td>
                        <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{transfer.from}</td>
                        <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{transfer.to}</td>
                        <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{transfer.reference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        );

      case 'mouvements':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Liste des mouvements</h2>
                  <p className="mt-1 text-gray-400">Visualisez l historique complet des operations et exportez les journaux au besoin.</p>
                </div>
                <button type="button" onClick={exportMovements} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                  <FaDownload /> Exporter
                </button>
              </div>

              {movementsLoading ? (
                <div className="py-10 text-center text-sm text-gray-300">Chargement des mouvements...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-700/50 bg-white/5">
                      <tr>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Article</th>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Quantite</th>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Motif</th>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Reference</th>
                        <th className="hidden px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400 md:table-cell">Portee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/50">
                      {enrichedMovements.map(movement => (
                        <tr key={movement.id} className="hover:bg-white/5">
                          <td className="hidden px-6 py-4 text-sm text-white md:table-cell">{new Date(movement.date).toLocaleDateString('fr-FR')}</td>
                          <td className="px-6 py-4 text-sm text-white">
                            {movement.item ? `${movement.item.code} - ${movement.item.name}` : movement.itemId}
                            <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{movement.type === 'ENTRY' ? 'Entree' : 'Sortie'}</span>
                          </td>
                          <td className="hidden px-6 py-4 md:table-cell">
                            <span className={`rounded-full px-2 py-1 text-xs font-medium ${movement.type === 'ENTRY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {movement.type === 'ENTRY' ? 'Entree' : 'Sortie'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-white">{movement.quantity}</td>
                          <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{movement.reason}</td>
                          <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{movement.reference || '-'}</td>
                          <td className="hidden px-6 py-4 text-sm text-gray-300 md:table-cell">{movement.location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'inventaire':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Inventaire</h2>
                  <p className="mt-1 text-gray-400">Comparez le stock theorique et le stock physique, puis validez les ajustements.</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={launchInventory} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                    <FaPlay /> Nouvel inventaire
                  </button>
                  <button type="button" onClick={exportInventory} className="flex items-center gap-2 rounded-lg border border-gray-700/50 px-4 py-2 text-gray-200 hover:bg-white/5">
                    <FaDownload /> Exporter
                  </button>
                </div>
              </div>

              {!Object.keys(inventoryEntries).length ? (
                <div className="py-12 text-center">
                  <div className="mb-4 text-gray-400">
                    <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    </svg>
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-white">Aucun inventaire en cours</h3>
                  <p className="mb-4 text-gray-400">Commencez un nouvel inventaire pour comparer les stocks.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stockItems.map(item => {
                    const physical = inventoryEntries[item.id]?.physicalQuantity ?? String(item.quantity);
                    const delta = Number(physical) - item.quantity;
                    return (
                      <div key={item.id} className="grid grid-cols-1 gap-4 rounded-2xl border border-gray-700/50 bg-black/10 p-4 md:grid-cols-4">
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-sm text-gray-400">{item.code}</p>
                        </div>
                        <div className="text-sm text-gray-300">
                          <span className="font-semibold text-white">Theorique:</span> {item.quantity} {item.unit}
                        </div>
                        <div>
                          <input
                            value={physical}
                            onChange={(e) => setInventoryEntries(prev => ({
                              ...prev,
                              [item.id]: { itemId: item.id, physicalQuantity: e.target.value }
                            }))}
                            type="number"
                            min="0"
                            className="w-full rounded-xl border border-gray-700/50 bg-[#0f1328] px-4 py-3 text-white"
                          />
                        </div>
                        <div className={`text-sm font-semibold ${delta === 0 ? 'text-green-300' : delta > 0 ? 'text-blue-300' : 'text-yellow-300'}`}>
                          Ecart: {delta > 0 ? '+' : ''}{delta}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-end">
                    <button type="button" onClick={validateInventory} className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
                      <FaCheck /> Valider l inventaire
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'statistiques':
        return (
          <div className="space-y-6">
            <div className="rounded-xl bg-gray-800/50 p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-white">Statistiques</h2>
              <p className="mb-6 text-gray-400">Surveillez les alertes, la valeur du stock et les categories les plus sensibles.</p>

              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
                <div className="rounded-lg border border-blue-300/20 bg-blue-500/10 p-4">
                  <p className="text-sm font-medium text-blue-300">Valeur totale du stock</p>
                  <p className="text-2xl font-bold text-white">{totalStockValue.toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="rounded-lg border border-yellow-300/20 bg-yellow-500/10 p-4">
                  <p className="text-sm font-medium text-yellow-300">Articles en alerte</p>
                  <p className="text-2xl font-bold text-white">{alertItems}</p>
                </div>
                <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-4">
                  <p className="text-sm font-medium text-red-300">Articles en rupture</p>
                  <p className="text-2xl font-bold text-white">{ruptureItems}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-700/50 bg-black/10 p-4 md:p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">Valeur par article</h3>
                    <p className="mt-1 text-xs text-gray-400">Les cinq articles qui representent la plus grande valeur du stock.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-300" aria-label="Legende du graphique">
                    <span className="h-2.5 w-2.5 rounded-sm bg-blue-400" aria-hidden="true" />
                    Valeur du stock (FCFA)
                  </div>
                </div>

                <div className="h-72 w-full">
                  {stockValueChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stockValueChartData} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 12 }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                          tickFormatter={(value: number) => `${Math.round(value / 1000000)}M`}
                          width={42}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                          formatter={(value: number) => [`${value.toLocaleString('fr-FR')} FCFA`, 'Valeur']}
                          contentStyle={{ backgroundColor: '#10182b', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: '8px', color: '#fff' }}
                          labelStyle={{ color: '#cbd5e1' }}
                        />
                        <Bar dataKey="value" name="Valeur du stock" fill="#60a5fa" radius={[5, 5, 0, 0]} maxBarSize={54} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Aucune donnee de stock disponible.</div>
                  )}
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
      <div className="mx-auto max-w-full px-6 py-8 lg:px-8">
        {flashMessage ? (
          <div className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
            flashMessage.tone === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : flashMessage.tone === 'error'
                ? 'border-red-500/30 bg-red-500/10 text-red-300'
                : 'border-blue-500/30 bg-blue-500/10 text-blue-300'
          }`}>
            <div className="flex items-center justify-between gap-4">
              <span>{flashMessage.text}</span>
              <button type="button" onClick={() => setFlashMessage(null)} className="text-xs uppercase tracking-wider text-white/70 hover:text-white">
                Fermer
              </button>
            </div>
          </div>
        ) : null}

        <div className="mb-10 rounded-xl border border-gray-700 bg-gray-800 shadow-sm">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-8" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  <span className="mr-2 inline-flex">{tabIcons[tab.key]}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="border-b border-gray-700/50 bg-white/5 px-8 py-3">
            <p className="text-sm text-gray-400">{tabs.find(tab => tab.key === activeTab)?.description}</p>
          </div>
        </div>

        {renderTabContent()}
      </div>
    </div>
  );
};

export default Stock;
