
import React, { useState } from 'react';
import { Room, RoomStatus } from '../types';

interface RoomsProps {
  rooms: Room[];
  onUpdateStatus: (roomId: string, status: RoomStatus) => void;
  onCreateRoom: (room: NewRoomForm) => Promise<void>;
  onUpdateRoom?: (roomId: string, room: NewRoomForm) => Promise<void>;
}

interface NewRoomForm {
  code: string;
  typeLabel: string;
  nightlyRate: number;
  status: RoomStatus;
  cleaningStatus: string;
  capacity: number;
  description: string;
}

const RoomCard: React.FC<{
  room: Room;
  onUpdate: (s: RoomStatus) => void;
  onShowDetails: () => void;
  onEdit: () => void;
}> = ({ room, onUpdate, onShowDetails, onEdit }) => {
  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case RoomStatus.OCCUPIED: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case RoomStatus.CLEANING: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case RoomStatus.MAINTENANCE: return 'bg-white/50/10 text-gray-400 border-gray-500/20';
      default: return 'bg-white/5';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SINGLE': return 'bg-blue-500/10 text-blue-400';
      case 'DOUBLE': return 'bg-purple-500/10 text-purple-400';
      case 'SUITE': return 'bg-amber-500/10 text-amber-400';
      case 'DELUXE': return 'bg-pink-500/10 text-pink-400';
      default: return 'bg-white/50/10 text-gray-400';
    }
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 transition-all hover:bg-gray-800/50/[0.07] hover:shadow-lg hover:shadow-blue-500/10 group">
      {/* En-tête avec type et statut */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className={`inline-flex px-2 py-1 rounded-lg text-[10px] font-bold mb-2 ${getTypeColor(room.type)}`}>
            {room.type}
          </div>
          <h4 className="text-2xl font-black text-white leading-none">Chambre {room.number}</h4>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${getStatusColor(room.status)}`}>
          {room.status}
        </div>
      </div>
      
      {/* Prix mis en avant */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 mb-6">
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-black text-blue-400">{room.price.toLocaleString('fr-FR')}</span>
          <span className="text-sm text-gray-400 font-medium ml-2">FCFA</span>
        </div>
        <p className="text-xs text-gray-400 text-center mt-1">par nuit</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Statut :</span>
          <select 
            className="flex-1 bg-gray-800/50/10 border border-white/10 rounded-lg px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer"
            value={room.status}
            onChange={(e) => onUpdate(e.target.value as RoomStatus)}
          >
            {Object.values(RoomStatus).map(s => (
              <option key={s} value={s} className="bg-[#050714]">{s}</option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onShowDetails}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            Détails
          </button>
          <button
            type="button"
            onClick={onEdit}
            title="Modifier"
            className="p-2 bg-gray-800/50/10 hover:bg-gray-800/50/20 rounded-lg transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.829-2.828z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

const Rooms: React.FC<RoomsProps> = ({ rooms, onUpdateStatus, onCreateRoom, onUpdateRoom }) => {
  const [filter, setFilter] = useState<RoomStatus | 'All'>('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [detailsRoom, setDetailsRoom] = useState<Room | null>(null);
  const [draftRoom, setDraftRoom] = useState<NewRoomForm>({
    code: '',
    typeLabel: 'Standard',
    nightlyRate: 25000,
    status: RoomStatus.AVAILABLE,
    cleaningStatus: 'Pret',
    capacity: 2,
    description: ''
  });

  const filteredRooms = rooms.filter(r => filter === 'All' || r.status === filter);
  const occupancyRate = rooms.length === 0 ? 0 : Math.round((rooms.filter(r => r.status === RoomStatus.OCCUPIED).length / rooms.length) * 100);

  // Calcul des statistiques
  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === RoomStatus.AVAILABLE).length,
    occupied: rooms.filter(r => r.status === RoomStatus.OCCUPIED).length,
    cleaning: rooms.filter(r => r.status === RoomStatus.CLEANING).length,
    maintenance: rooms.filter(r => r.status === RoomStatus.MAINTENANCE).length,
    occupancyRate
  };

  const resetDraftRoom = () => {
    setDraftRoom({
      code: '',
      typeLabel: 'Standard',
      nightlyRate: 25000,
      status: RoomStatus.AVAILABLE,
      cleaningStatus: 'Pret',
      capacity: 2,
      description: ''
    });
  };

  const openEditForm = (room: Room) => {
    setEditingRoomId(room.id);
    setDraftRoom({
      code: room.number,
      typeLabel: room.typeLabel || room.type,
      nightlyRate: room.price,
      status: room.status,
      cleaningStatus: room.cleaningStatus || 'Pret',
      capacity: room.capacity ?? 2,
      description: room.description || ''
    });
    setFeedback('');
    setShowCreateForm(true);
  };

  const closeForm = () => {
    setShowCreateForm(false);
    setEditingRoomId(null);
    resetDraftRoom();
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();
    setFeedback('');

    if (!draftRoom.code.trim()) {
      setFeedback('Le numero/code de chambre est obligatoire.');
      return;
    }

    const payload = {
      ...draftRoom,
      code: draftRoom.code.trim(),
      typeLabel: draftRoom.typeLabel.trim() || 'Standard',
      nightlyRate: Number(draftRoom.nightlyRate),
      capacity: Number(draftRoom.capacity)
    };

    try {
      setIsSaving(true);
      if (editingRoomId && onUpdateRoom) {
        await onUpdateRoom(editingRoomId, payload);
        setFeedback('Chambre modifiee avec succes.');
      } else {
        await onCreateRoom(payload);
        setFeedback('Chambre enregistree avec succes.');
      }
      closeForm();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la chambre', error);
      setFeedback("Impossible d'enregistrer la chambre. Verifiez le code et les champs saisis.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête amélioré */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Gestion des Chambres</h2>
          <p className="text-gray-400 font-medium">Suivi en temps réel de l'état de vos chambres</p>
        </div>
        
        {/* Filtres améliorés */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => setShowCreateForm((visible) => !visible)}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700"
          >
            + Nouvelle chambre
          </button>

          <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {['All', ...Object.values(RoomStatus)].map(s => (
            <button 
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                filter === s 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'All' ? 'Toutes' : s}
            </button>
          ))}
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-200">
          {feedback}
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={handleCreateRoom} className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">{editingRoomId ? 'Modifier la chambre' : 'Nouvelle chambre'}</h3>
              <p className="text-sm text-gray-400">
                {editingRoomId ? 'Mettez a jour les informations de cette chambre.' : 'Ajoutez une chambre disponible dans le planning.'}
              </p>
            </div>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
            >
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Numero / Code</label>
              <input
                value={draftRoom.code}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, code: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Ex: 306"
                disabled={!!editingRoomId}
                required
              />
              {editingRoomId && (
                <p className="mt-1 text-[11px] text-gray-500">Le code ne peut pas etre modifie apres creation.</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Type</label>
              <input
                value={draftRoom.typeLabel}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, typeLabel: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Standard, Suite, VIP..."
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Prix nuit</label>
              <input
                type="number"
                min="0"
                value={draftRoom.nightlyRate}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, nightlyRate: Number(event.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Statut</label>
              <select
                value={draftRoom.status}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, status: event.target.value as RoomStatus }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(RoomStatus).map(status => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Menage</label>
              <select
                value={draftRoom.cleaningStatus}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, cleaningStatus: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pret">Pret</option>
                <option value="A nettoyer">A nettoyer</option>
                <option value="En nettoyage">En nettoyage</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Capacite</label>
              <input
                type="number"
                min="1"
                value={draftRoom.capacity}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, capacity: Number(event.target.value) }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="md:col-span-3">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-400">Description</label>
              <textarea
                rows={2}
                value={draftRoom.description}
                onChange={(event) => setDraftRoom((previous) => ({ ...previous, description: event.target.value }))}
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Notes internes, equipements, etage..."
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetDraftRoom}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-gray-300 hover:bg-white/5"
            >
              Reinitialiser
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-white/50/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Disponibles</p>
              <p className="text-2xl font-bold text-green-400">{stats.available}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Occupées</p>
              <p className="text-2xl font-bold text-rose-400">{stats.occupied}</p>
            </div>
            <div className="w-10 h-10 bg-rose-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Nettoyage</p>
              <p className="text-2xl font-bold text-blue-400">{stats.cleaning}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Maintenance</p>
              <p className="text-2xl font-bold text-gray-400">{stats.maintenance}</p>
            </div>
            <div className="w-10 h-10 bg-white/50/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c-.94 1.543.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c.94-1.543-.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs font-medium">Taux occupation</p>
              <p className="text-2xl font-bold text-purple-400">{stats.occupancyRate}%</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des chambres améliorée */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRooms.map(room => (
          <RoomCard
            key={room.id}
            room={room}
            onUpdate={(s) => onUpdateStatus(room.id, s)}
            onShowDetails={() => setDetailsRoom(room)}
            onEdit={() => openEditForm(room)}
          />
        ))}
      </div>

      {/* Message si aucune chambre */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-white/50/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-medium">Aucune chambre trouvée</p>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier les filtres pour voir plus de résultats</p>
        </div>
      )}

      {detailsRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#050714] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Chambre {detailsRoom.number}</h3>
              <button
                type="button"
                onClick={() => setDetailsRoom(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-gray-300 hover:bg-white/5"
              >
                Fermer
              </button>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-gray-400">Type</dt>
                <dd className="text-white font-medium">{detailsRoom.typeLabel || detailsRoom.type}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-gray-400">Statut</dt>
                <dd className="text-white font-medium">{detailsRoom.status}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-gray-400">Prix / nuit</dt>
                <dd className="text-white font-medium">{detailsRoom.price.toLocaleString('fr-FR')} FCFA</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-gray-400">Menage</dt>
                <dd className="text-white font-medium">{detailsRoom.cleaningStatus || 'N/A'}</dd>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-2">
                <dt className="text-gray-400">Capacite</dt>
                <dd className="text-white font-medium">{detailsRoom.capacity ?? 'N/A'}</dd>
              </div>
              {detailsRoom.description && (
                <div>
                  <dt className="text-gray-400 mb-1">Description</dt>
                  <dd className="text-white">{detailsRoom.description}</dd>
                </div>
              )}
            </dl>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  const room = detailsRoom;
                  setDetailsRoom(null);
                  openEditForm(room);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold transition-all"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Rooms;
