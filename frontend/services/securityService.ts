import api from './api';

export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  groupCode: number;
  groupName: string;
  active: boolean;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  rights: string[];
  memberCount: number;
}

export interface Privilege {
  id: string;
  module: string;
  code: string;
  level: string;
  visible: boolean;
}

export interface Backup {
  id: string;
  label: string;
  createdAt: string;
  status: 'Disponible' | 'Restauree';
  sizeInBytes: number;
  fileName: string;
}

// Users API
export const userApi = {
  list: async () => {
    const { data } = await api.get<User[]>('/security/users');
    return data;
  },
  create: async (user: Partial<User> & { password: string; status: string }) => {
    const { data } = await api.post<User>('/security/users', user);
    return data;
  },
  update: async (userId: number, user: Partial<User>) => {
    const { data } = await api.put<User>(`/security/users/${userId}`, user);
    return data;
  },
  delete: async (userId: number) => {
    await api.delete(`/security/users/${userId}`);
  },
  changePassword: async (userId: number, currentPassword: string, newPassword: string) => {
    await api.post('/security/change-password', {
      userId,
      currentPassword,
      newPassword,
      confirmPassword: newPassword,
    });
  },
};

// Groups API
export const groupApi = {
  list: async () => {
    const { data } = await api.get<Group[]>('/security/groups');
    return data;
  },
  get: async (groupId: number) => {
    const { data } = await api.get<Group>(`/security/groups/${groupId}`);
    return data;
  },
  create: async (group: Partial<Group>) => {
    const { data } = await api.post<Group>('/security/groups', group);
    return data;
  },
  update: async (groupId: number, group: Partial<Group>) => {
    const { data } = await api.put<Group>(`/security/groups/${groupId}`, group);
    return data;
  },
  delete: async (groupId: number) => {
    await api.delete(`/security/groups/${groupId}`);
  },
};

// Privileges API
export const privilegeApi = {
  list: async () => {
    const { data } = await api.get<Privilege[]>('/security/privileges');
    return data;
  },
  get: async (privilegeId: string) => {
    const { data } = await api.get<Privilege>(`/security/privileges/${privilegeId}`);
    return data;
  },
  create: async (privilege: Partial<Privilege>) => {
    const { data } = await api.post<Privilege>('/security/privileges', privilege);
    return data;
  },
  update: async (privilegeId: string, privilege: Partial<Privilege>) => {
    const { data } = await api.put<Privilege>(`/security/privileges/${privilegeId}`, privilege);
    return data;
  },
  delete: async (privilegeId: string) => {
    await api.delete(`/security/privileges/${privilegeId}`);
  },
};

// Backups API
export const backupApi = {
  list: async () => {
    const { data } = await api.get<Backup[]>('/security/backups');
    return data;
  },
  create: async (label: string) => {
    const { data } = await api.post<Backup>('/security/backups', { label });
    return data;
  },
  restore: async (backupId: string) => {
    await api.post(`/security/backups/${backupId}/restore`);
  },
  delete: async (backupId: string) => {
    await api.delete(`/security/backups/${backupId}`);
  },
  clearAll: async () => {
    await api.delete('/security/backups');
  },
  download: async (backupId: string) => {
    const response = await api.get(`/security/backups/${backupId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
