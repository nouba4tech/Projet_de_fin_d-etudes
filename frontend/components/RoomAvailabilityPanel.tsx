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
  return (
    <div>
      <h2 className="gv-h2">Chambres libres sur une période</h2>
      <form onSubmit={search} className="grid grid-cols-1 gap-6 md:grid-cols-4 md:items-end">
        <label className="block">
          <span className="gv-label">Arrivée</span>
          <input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} className="gv-input" />
        </label>
        <label className="block">
          <span className="gv-label">Départ</span>
          <input type="date" required min={from} value={to} onChange={(e) => setTo(e.target.value)} className="gv-input" />
        </label>
        <label className="block">
          <span className="gv-label">Personnes (optionnel)</span>
          <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="gv-input" />
        </label>
        <button type="submit" disabled={searching} className="gv-btn">
          {searching ? 'Recherche...' : 'Rechercher'}
        </button>
      </form>

      {error ? <div role="alert" className="gv-alert gv-alert--error mt-6">{error}</div> : null}

      {rooms ? (
        rooms.length === 0 ? (
          <div role="status" className="gv-alert gv-alert--info mt-6">Aucune chambre libre sur cette période.</div>
        ) : (
          <div className="mt-6">
            <p className="gv-mention mb-4">{rooms.length} chambre(s) libre(s) pour {nights} nuit(s)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => (
                <div key={room.id} className="gv-card flex flex-col">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="gv-h3">Chambre {room.number}</span>
                    {room.capacity ? <span className="gv-mention">{room.capacity} pers.</span> : null}
                  </div>
                  <p className="gv-mention">{room.type}</p>
                  <p className="gv-text mt-2">
                    {formatMoney(room.price)} / nuit{nights > 0 && room.price > 0 ? ` · ${formatMoney(room.price * nights)}` : ''}
                  </p>
                  <button type="button" onClick={() => onBook(room.id, from, to)} className="gv-btn gv-btn--secondary gv-btn--small mt-4 self-start">
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
