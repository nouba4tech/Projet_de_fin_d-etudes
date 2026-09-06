import api from './api';

export interface DashboardStats {
  occupancyRate: number;
  revenueToday: number;
  pendingCheckins: number;
  roomsCleaning: number;
  totalRooms: number;
  occupiedRooms: number;
  activeClients: number;
  activeReservations: number;
}

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard');
    return response.data;
  }
};
