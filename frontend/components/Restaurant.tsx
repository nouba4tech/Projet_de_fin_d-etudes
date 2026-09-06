import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { restaurantAPI } from '../services/moduleAPIs';

type RestaurantTab = 'orders' | 'menu';
type FeedbackTone = 'success' | 'error' | 'info';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  depotId?: number | null;
  stockQuantity: number;
}

interface OrderItem {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
}

interface RestaurantOrder {
  id: number;
  tableNumber: number;
  items: OrderItem[];
  status: string;
  totalAmount: number;
  createdAt: string;
  servedAt?: string | null;
}

interface MenuFormState {
  name: string;
  description: string;
  price: string;
  category: string;
  available: boolean;
  depotId: string;
}

interface OrderDraftItem {
  menuItemId: number;
  quantity: number;
}

const EMPTY_MENU_FORM: MenuFormState = {
  name: '',
  description: '',
  price: '',
  category: 'Plat',
  available: true,
  depotId: ''
};

const STATUS_OPTIONS = ['En attente', 'En préparation', 'Prête', 'Servi', 'Payé', 'Annulée'];

const badgeClass = (tone: FeedbackTone): string => {
  if (tone === 'success') {
    return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200';
  }

  if (tone === 'error') {
    return 'border-rose-500/25 bg-rose-500/10 text-rose-200';
  }

  return 'border-sky-500/25 bg-sky-500/10 text-sky-200';
};

const statusClass = (status: string): string => {
  const normalized = status.toLowerCase();

  if (normalized.includes('servi') || normalized.includes('pay')) {
    return 'bg-emerald-500/15 text-emerald-300';
  }

  if (normalized.includes('annul')) {
    return 'bg-rose-500/15 text-rose-300';
  }

  if (normalized.includes('prêt')) {
    return 'bg-violet-500/15 text-violet-300';
  }

  if (normalized.includes('préparation')) {
    return 'bg-amber-500/15 text-amber-300';
  }

  return 'bg-sky-500/15 text-sky-300';
};

const Restaurant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<RestaurantTab>('orders');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; message: string } | null>(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [editingMenuItemId, setEditingMenuItemId] = useState<number | null>(null);
  const [menuForm, setMenuForm] = useState<MenuFormState>(EMPTY_MENU_FORM);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [orderTableNumber, setOrderTableNumber] = useState('');
  const [orderStatus, setOrderStatus] = useState('En attente');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [draftItems, setDraftItems] = useState<OrderDraftItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuResponse, ordersResponse] = await Promise.all([
        api.get<MenuItem[]>('/restaurant/menu'),
        api.get<RestaurantOrder[]>('/restaurant/orders')
      ]);

      setMenuItems(menuResponse.data);
      setOrders(ordersResponse.data);
      setFeedback(null);
    } catch (error) {
      console.error('Erreur lors du chargement du module restaurant', error);
      setFeedback({ tone: 'error', message: "Impossible de charger les données du restaurant." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const filteredMenuItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return menuItems;
    }

    return menuItems.filter(item => (
      item.name.toLowerCase().includes(term) ||
      item.category.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term)
    ));
  }, [menuItems, searchTerm]);

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return orders;
    }

    return orders.filter(order => (
      order.status.toLowerCase().includes(term) ||
      String(order.tableNumber).includes(term) ||
      order.items.some(item => item.menuItemName.toLowerCase().includes(term))
    ));
  }, [orders, searchTerm]);

  const totals = useMemo(() => {
    const pending = orders.filter(order => !order.status.toLowerCase().includes('servi') && !order.status.toLowerCase().includes('pay')).length;
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const availableMenuItems = menuItems.filter(item => item.available).length;

    return {
      pending,
      revenue,
      availableMenuItems,
      totalOrders: orders.length
    };
  }, [menuItems, orders]);

  const resetMenuForm = () => {
    setEditingMenuItemId(null);
    setMenuForm(EMPTY_MENU_FORM);
    setShowMenuForm(false);
  };

  const resetOrderForm = () => {
    setOrderTableNumber('');
    setOrderStatus('En attente');
    setSelectedMenuItemId('');
    setSelectedQuantity('1');
    setDraftItems([]);
    setShowOrderForm(false);
  };

  const handleMenuFormChange = <K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) => {
    setMenuForm(prev => ({ ...prev, [key]: value }));
  };

  const openEditMenuItem = (item: MenuItem) => {
    setEditingMenuItemId(item.id);
    setMenuForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      available: item.available,
      depotId: item.depotId ? String(item.depotId) : ''
    });
    setShowMenuForm(true);
  };

  const saveMenuItem = async () => {
    if (!menuForm.name.trim() || !menuForm.description.trim() || !menuForm.price.trim()) {
      setFeedback({ tone: 'error', message: 'Le nom, la description et le prix sont obligatoires.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: menuForm.name.trim(),
        description: menuForm.description.trim(),
        price: Number(menuForm.price),
        category: menuForm.category.trim() || 'Plat',
        available: menuForm.available,
        depotId: menuForm.depotId.trim() ? Number(menuForm.depotId) : null
      };

      if (editingMenuItemId) {
        await api.put(`/restaurant/menu/${editingMenuItemId}`, payload);
        setFeedback({ tone: 'success', message: 'Article du menu mis à jour.' });
      } else {
        await api.post('/restaurant/menu', payload);
        setFeedback({ tone: 'success', message: 'Nouvel article ajouté au menu.' });
      }

      resetMenuForm();
      await loadData();
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du menu", error);
      setFeedback({ tone: 'error', message: "Impossible d'enregistrer cet article du menu." });
    } finally {
      setSaving(false);
    }
  };

  const addDraftItem = () => {
    const menuItemId = Number(selectedMenuItemId);
    const quantity = Number(selectedQuantity);

    if (!menuItemId || quantity <= 0) {
      setFeedback({ tone: 'error', message: 'Sélectionnez un plat valide et une quantité positive.' });
      return;
    }

    setDraftItems(prev => {
      const existing = prev.find(item => item.menuItemId === menuItemId);
      if (existing) {
        return prev.map(item => (
          item.menuItemId === menuItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        ));
      }

      return [...prev, { menuItemId, quantity }];
    });

    setSelectedMenuItemId('');
    setSelectedQuantity('1');
    setFeedback({ tone: 'info', message: 'Article ajouté à la commande en préparation.' });
  };

  const removeDraftItem = (menuItemId: number) => {
    setDraftItems(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const createOrder = async () => {
    if (!orderTableNumber.trim()) {
      setFeedback({ tone: 'error', message: 'Le numéro de table est obligatoire.' });
      return;
    }

    if (draftItems.length === 0) {
      setFeedback({ tone: 'error', message: 'Ajoutez au moins un article à la commande.' });
      return;
    }

    setSaving(true);
    try {
      const items = draftItems.map(item => {
        const menuItem = menuItems.find(candidate => candidate.id === item.menuItemId);
        return {
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          unitPrice: menuItem?.price ?? 0
        };
      });

      await api.post('/restaurant/orders', {
        tableNumber: Number(orderTableNumber),
        status: orderStatus,
        items
      });

      setFeedback({ tone: 'success', message: 'Commande restaurant créée avec succès.' });
      resetOrderForm();
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la création de commande', error);
      setFeedback({ tone: 'error', message: 'Impossible de créer cette commande.' });
    } finally {
      setSaving(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await api.put(`/restaurant/orders/${orderId}/status`, null, { params: { status } });
      setOrders(prev => prev.map(order => (
        order.id === orderId ? { ...order, status } : order
      )));
      setFeedback({ tone: 'success', message: `Statut de la commande ${orderId} mis à jour.` });
      await loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut', error);
      setFeedback({ tone: 'error', message: 'Impossible de mettre à jour ce statut.' });
    }
  };

  const deleteOrder = async (orderId: number) => {
    try {
      await api.delete(`/restaurant/orders/${orderId}`);
      setOrders(prev => prev.filter(order => order.id !== orderId));
      setFeedback({ tone: 'success', message: `Commande ${orderId} supprimée.` });
    } catch (error) {
      console.error('Erreur lors de la suppression de commande', error);
      setFeedback({ tone: 'error', message: 'Impossible de supprimer cette commande.' });
    }
  };

  const draftSummary = useMemo(() => {
    return draftItems.map(item => {
      const menuItem = menuItems.find(candidate => candidate.id === item.menuItemId);
      const unitPrice = menuItem?.price ?? 0;
      return {
        ...item,
        name: menuItem?.name ?? 'Article',
        total: unitPrice * item.quantity
      };
    });
  }, [draftItems, menuItems]);

  const draftTotal = draftSummary.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="min-h-screen bg-[#050714] p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#091223] via-[#0d1526] to-[#121b31] p-6 shadow-[0_24px_60px_rgba(2,6,23,0.45)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/60">Restaurant</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">Pilotage des commandes et du menu</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">
                Les actions principales sont maintenant branchées: menu, création de commande, changement de statut et suppression.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-700/60 bg-[#0f172a] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">Commandes</p>
                <p className="mt-2 text-2xl font-semibold">{totals.totalOrders}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#0f172a] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">En cours</p>
                <p className="mt-2 text-2xl font-semibold">{totals.pending}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#0f172a] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">Menu actif</p>
                <p className="mt-2 text-2xl font-semibold">{totals.availableMenuItems}</p>
              </div>
              <div className="rounded-2xl border border-slate-700/60 bg-[#0f172a] px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-white/55">Montant cumulé</p>
                <p className="mt-2 text-2xl font-semibold">{totals.revenue.toLocaleString('fr-FR')} FCFA</p>
              </div>
            </div>
          </div>
        </section>

        {feedback ? (
          <div className={`rounded-2xl border px-4 py-3 text-sm ${badgeClass(feedback.tone)}`}>
            {feedback.message}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-5 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                Commandes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'menu' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
              >
                Menu
              </button>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={activeTab === 'orders' ? 'Rechercher une commande...' : 'Rechercher un plat...'}
                className="rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-blue-500 focus:outline-none"
              />
              {activeTab === 'orders' ? (
                <button
                  type="button"
                  onClick={() => setShowOrderForm(prev => !prev)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {showOrderForm ? 'Fermer le formulaire' : 'Nouvelle commande'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setEditingMenuItemId(null);
                    setMenuForm(EMPTY_MENU_FORM);
                    setShowMenuForm(prev => !prev);
                  }}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  {showMenuForm ? 'Fermer le formulaire' : 'Ajouter un plat'}
                </button>
              )}
            </div>
          </div>
        </section>

        {activeTab === 'orders' && showOrderForm ? (
          <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6">
            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-white/75">Numéro de table</label>
                  <input
                    type="number"
                    min="1"
                    value={orderTableNumber}
                    onChange={(event) => setOrderTableNumber(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/75">Statut initial</label>
                  <select
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/75">Ajouter un article</label>
                  <select
                    value={selectedMenuItemId}
                    onChange={(event) => setSelectedMenuItemId(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Choisir un plat</option>
                    {menuItems.filter(item => item.available).map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} - {item.price.toLocaleString('fr-FR')} FCFA
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm text-white/75">Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={selectedQuantity}
                    onChange={(event) => setSelectedQuantity(event.target.value)}
                    className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={addDraftItem}
                  className="w-full rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2.5 text-sm font-semibold text-sky-200"
                >
                  Ajouter à la commande
                </button>
              </div>

              <div className="rounded-2xl border border-slate-700/60 bg-[#10182b] p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Commande en préparation</h2>
                  <span className="text-sm text-white/60">{draftItems.length} article(s)</span>
                </div>
                <div className="mt-4 space-y-3">
                  {draftSummary.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-700/60 px-4 py-8 text-center text-sm text-white/45">
                      Aucun article ajouté pour le moment.
                    </div>
                  ) : (
                    draftSummary.map(item => (
                      <div key={item.menuItemId} className="flex items-center justify-between rounded-2xl border border-slate-700/60 px-4 py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-white/60">Quantité: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold">{item.total.toLocaleString('fr-FR')} FCFA</span>
                          <button
                            type="button"
                            onClick={() => removeDraftItem(item.menuItemId)}
                            className="text-sm text-rose-300"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-5 flex flex-col gap-3 border-t border-slate-700/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-base font-semibold">Total: {draftTotal.toLocaleString('fr-FR')} FCFA</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={resetOrderForm}
                      className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
                    >
                      Réinitialiser
                    </button>
                    <button
                      type="button"
                      onClick={() => void createOrder()}
                      disabled={saving}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Enregistrer la commande
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {activeTab === 'menu' && showMenuForm ? (
          <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/75">Nom du plat</label>
                <input
                  type="text"
                  value={menuForm.name}
                  onChange={(event) => handleMenuFormChange('name', event.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/75">Catégorie</label>
                <input
                  type="text"
                  value={menuForm.category}
                  onChange={(event) => handleMenuFormChange('category', event.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/75">Prix</label>
                <input
                  type="number"
                  min="0"
                  value={menuForm.price}
                  onChange={(event) => handleMenuFormChange('price', event.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/75">Dépôt</label>
                <input
                  type="number"
                  min="0"
                  value={menuForm.depotId}
                  onChange={(event) => handleMenuFormChange('depotId', event.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-white/75">Description</label>
                <textarea
                  value={menuForm.description}
                  onChange={(event) => handleMenuFormChange('description', event.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  checked={menuForm.available}
                  onChange={(event) => handleMenuFormChange('available', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-[#10182b]"
                />
                Disponible à la vente
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void saveMenuItem()}
                disabled={saving}
                className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {editingMenuItemId ? 'Mettre à jour le plat' : 'Créer le plat'}
              </button>
              <button
                type="button"
                onClick={resetMenuForm}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70"
              >
                Annuler
              </button>
            </div>
          </section>
        ) : null}

        {loading ? (
          <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] px-6 py-10 text-center text-white/60">
            Chargement du module restaurant...
          </section>
        ) : activeTab === 'orders' ? (
          <section className="grid gap-4">
            {filteredOrders.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] px-6 py-10 text-center text-white/55">
                Aucune commande trouvée.
              </div>
            ) : (
              filteredOrders.map(order => (
                <article key={order.id} className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-5 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold">Commande #{order.id}</h2>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-white/65">
                        Table {order.tableNumber} • Créée le {new Date(order.createdAt).toLocaleString('fr-FR')}
                      </p>
                      <div className="mt-4 space-y-2">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm">
                            <span>{item.menuItemName} x {item.quantity}</span>
                            <span>{(item.unitPrice * item.quantity).toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-[250px] space-y-3">
                      <p className="text-right text-xl font-semibold">{order.totalAmount.toLocaleString('fr-FR')} FCFA</p>
                      <select
                        value={order.status}
                        onChange={(event) => void updateOrderStatus(order.id, event.target.value)}
                        className="w-full rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                      >
                        {STATUS_OPTIONS.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void deleteOrder(order.id)}
                        className="w-full rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-200"
                      >
                        Supprimer la commande
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMenuItems.length === 0 ? (
              <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] px-6 py-10 text-center text-white/55 md:col-span-2 xl:col-span-3">
                Aucun article de menu trouvé.
              </div>
            ) : (
              filteredMenuItems.map(item => (
                <article key={item.id} className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-5 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.28em] text-white/50">{item.category}</p>
                      <h2 className="mt-2 text-xl font-semibold">{item.name}</h2>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.available ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                      {item.available ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/65">{item.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
                      <p className="text-white/50">Prix</p>
                      <p className="mt-1 font-semibold">{item.price.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-[#10182b] px-4 py-3">
                      <p className="text-white/50">Stock</p>
                      <p className="mt-1 font-semibold">{item.stockQuantity.toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => openEditMenuItem(item)}
                      className="flex-1 rounded-xl border border-sky-500/25 bg-sky-500/10 px-4 py-2.5 text-sm font-medium text-sky-200"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        openEditMenuItem(item);
                        setMenuForm(prev => ({ ...prev, available: !item.available }));
                      }}
                      className="flex-1 rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-2.5 text-sm font-medium text-violet-200"
                    >
                      Basculer l'état
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Restaurant;
