import React, { useState } from 'react';
import api from '../services/api';
import { apiErrorMessage, formatMoney } from './ui';

type AvailableRoom = {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
  capacity: number | null;
};

const isoDay = (offset: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

/** Searches the rooms that are free over a period (chambres-service) and lets the user book one directly. */
const RoomAvailabilityPanel: React.FC<{ onBook: (roomId: string, checkIn: string, checkOut: string) => void }> = ({ onBook }) => {
  const [from, setFrom] = useState(isoDay(0));
  const [to, setTo] = useState(isoDay(1));
  const [capacity, setCapacity] = useState('');
  const [rooms, setRooms] = useState<AvailableRoom[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearching(true);
    setError(null);
    try {
      const params: Record<string, string> = { from, to };
      if (capacity) params.capacite = capacity;
      const response = await api.get<AvailableRoom[]>('/chambres/disponibles', { params });
      setRooms(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setRooms(null);
      setError(apiErrorMessage(err, 'Recherche impossible.'));
    } finally {
      setSearching(false);
    }
  };

  const nights = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  const input = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      <h3 className="mb-4 text-lg font-bold text-white">Chambres libres sur une période</h3>
      <form onSubmit={search} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-400">Arrivée</span>
          <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-400">Départ</span>
          <input type="date" required min={from} value={to} onChange={(e) => setTo(e.target.value)} className={input} />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-400">Personnes (optionnel)</span>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className={input} />
        </label>
        <button type="submit" disabled={searching} className="rounded-xl bg-blue-600 px-6 py-2.5 font-bold text-white transition-all hover:bg-blue-700 disabled:opacity-50">
          {searching ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {rooms ? (
        rooms.length === 0 ? (
          <p className="mt-4 text-sm text-amber-300">Aucune chambre libre sur cette période.</p>
        ) : (
          <div className="mt-5">
            <p className="mb-3 text-sm text-gray-400">{rooms.length} chambre(s) libre(s) pour {nights} nuit(s) :</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {rooms.map((room) => (
                <div key={room.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">Chambre {room.number}</span>
                    {room.capacity ? <span className="text-xs text-gray-400">{room.capacity} pers.</span> : null}
                  </div>
                  <p className="text-sm text-gray-400">{room.type}</p>
                  <p className="mt-1 text-sm text-green-400">
                    {formatMoney(room.price)} / nuit{nights > 0 && room.price > 0 ? ` · ${formatMoney(room.price * nights)}` : ''}
                  </p>
                  <button
                    type="button"
                    onClick={() => onBook(room.id, from, to)}
                    className="mt-3 w-full rounded-lg border border-blue-500/40 px-3 py-1.5 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/10"
                  >
                    Réserver
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
};

export default RoomAvailabilityPanel;
