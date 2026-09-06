import { Room, RoomStatus, RoomType } from '../types';

export interface RoomResponseFromBackend {
  id: string;
  number: string;
  type: string;
  price: number;
  status: string;
  cleaningStatus?: string;
  description?: string;
  capacity?: number;
}

/**
 * Maps a backend room response to the frontend Room interface
 */
export const mapBackendRoomToFrontend = (backendRoom: RoomResponseFromBackend): Room => {
  // Map status from backend string to RoomStatus enum
  const statusMap: Record<string, RoomStatus> = {
    'Disponible': RoomStatus.AVAILABLE,
    'Occupée': RoomStatus.OCCUPIED,
    'Occupé': RoomStatus.OCCUPIED,
    'Nettoyage': RoomStatus.CLEANING,
    'Maintenance': RoomStatus.MAINTENANCE,
  };

  const status = statusMap[backendRoom.status] || RoomStatus.AVAILABLE;

  // Map type from backend string to RoomType enum
  const typeMap: Record<string, RoomType> = {
    'SINGLE': RoomType.SINGLE,
    'Single': RoomType.SINGLE,
    'DOUBLE': RoomType.DOUBLE,
    'Double': RoomType.DOUBLE,
    'SUITE': RoomType.SUITE,
    'Suite': RoomType.SUITE,
    'DELUXE': RoomType.DELUXE,
    'Deluxe': RoomType.DELUXE,
    'Chambre Éco': RoomType.SINGLE,
    'Chambre Standard': RoomType.DOUBLE,
    'Suite Junior': RoomType.SUITE,
    'Suite Premium': RoomType.DELUXE,
  };

  // Try to find matching type, fallback to SINGLE
  let type: RoomType = RoomType.SINGLE;
  for (const [key, value] of Object.entries(typeMap)) {
    if (backendRoom.type.toLowerCase().includes(key.toLowerCase())) {
      type = value;
      break;
    }
  }

  return {
    id: backendRoom.id,
    number: backendRoom.number,
    type,
    typeLabel: backendRoom.type,
    price: Number(backendRoom.price) || 0,
    status,
    cleaningStatus: backendRoom.cleaningStatus,
    description: backendRoom.description,
    capacity: backendRoom.capacity,
  };
};

/**
 * Maps an array of backend room responses to frontend Room array
 */
export const mapBackendRoomsToFrontend = (backendRooms: RoomResponseFromBackend[]): Room[] => {
  return backendRooms.map(mapBackendRoomToFrontend);
};
