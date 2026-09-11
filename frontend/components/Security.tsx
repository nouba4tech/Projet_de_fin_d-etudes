import React, { useEffect, useMemo, useState } from 'react';
import { FaDownload, FaRecycle } from 'react-icons/fa';
import api from '../services/api';
import { userApi, groupApi, privilegeApi, backupApi } from '../services/securityService';

type SecuritySection = 'users' | 'groups' | 'privileges' | 'password' | 'backup';

type MenuItem = {
  id: SecuritySection;
  label: string;
};

type FlashMessage = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

type UserRecord = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  groupCode?: number;
  groupName?: string;
  status: 'Actif' | 'Suspendu';
};

type GroupRecord = {
  id: string;
  name: string;
  members: number;
  rights: string;
};

type PrivilegeRecord = {
  id: string;
  module: string;
  code: string;
  level: string;
  visible: boolean;
};

type BackupRecord = {
  id: string;
  label: string;
  createdAt: string;
  status: 'Disponible' | 'Restauree';
};

type UserFormState = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  status: 'Actif' | 'Suspendu';
};

type GroupFormState = {
  name: string;
  members: string;
  rights: string;
};

type PrivilegeFormState = {
  module: string;
  code: string;
  level: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const MENU_ITEMS: MenuItem[] = [
  { id: 'users', label: 'Utilisateur' },
  { id: 'groups', label: 'Groupe' },
  { id: 'privileges', label: 'Privilege' },
  { id: 'password', label: 'Changer le mot de passe' },
  { id: 'backup', label: 'Sauvegarde de la base de donnees' }
];


const defaultUserForm = (): UserFormState => ({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'Service',
  status: 'Actif'
});

const defaultGroupForm = (): GroupFormState => ({
  name: '',
  members: '1',
  rights: 'Non defini'
});

const defaultPrivilegeForm = (): PrivilegeFormState => ({
  module: '',
  code: '',
  level: 'Lecture'
});

const defaultPasswordForm = (): PasswordFormState => ({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const PASSWORD_MIN_LENGTH = 8;

const getTimestampLabel = (): string =>
  new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(new Date());

const readCurrentUserId = (): number | null => {
  try {
    const raw = sessionStorage.getItem('currentUser');
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { id?: number | string };
    const userId = Number(parsed.id);
    return Number.isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
};

const mapApiUser = (user: {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  groupCode?: number;
  groupName?: string;
  active: boolean;
}): UserRecord => ({
  id: String(user.id),
  username: user.username,
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  email: user.email ?? '',
  role: user.role ?? 'Service',
  groupCode: user.groupCode,
  groupName: user.groupName,
  status: user.active ? 'Actif' : 'Suspendu'
});

const extractApiMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as {
      response?: {
        data?: {
          message?: string;
          errors?: Record<string, string>;
        };
      };
      message?: string;
    };
    const fieldErrors = maybeResponse.response?.data?.errors;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      return Object.values(fieldErrors).join(' ');
    }
    return maybeResponse.response?.data?.message ?? maybeResponse.message ?? 'Une erreur est survenue.';
  }
  return 'Une erreur est survenue.';
};

const ModalShell: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
        >
          Fermer
        </button>
      </div>
      {children}
    </div>
  </div>
);

const SectionIcon: React.FC<{ section: SecuritySection; className?: string }> = ({ section, className = 'h-5 w-5' }) => {
  const commonProps = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    'aria-hidden': true
  };

  if (section === 'users') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M15.75 7.5a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4.5 20.25a7.5 7.5 0 0 1 15 0" />
      </svg>
    );
  }

  if (section === 'groups') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M10 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M2.5 20a6.5 6.5 0 0 1 11 0M10.5 20a6.5 6.5 0 0 1 11 0" />
      </svg>
    );
  }

  if (section === 'privileges') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M12 3.5 5.5 6v5.25c0 4.1 2.75 7.85 6.5 9.25 3.75-1.4 6.5-5.15 6.5-9.25V6L12 3.5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M9.5 12.5 11 14l3.5-4" />
      </svg>
    );
  }

  if (section === 'password') {
    return (
      <svg {...commonProps}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M7 10V8a5 5 0 0 1 10 0v2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M5.5 10h13v10h-13z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M12 14v2.5" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4.5 6.5c0-1.65 3.36-3 7.5-3s7.5 1.35 7.5 3-3.36 3-7.5 3-7.5-1.35-7.5-3Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4.5 6.5v5c0 1.65 3.36 3 7.5 3s7.5-1.35 7.5-3v-5" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M4.5 11.5v5c0 1.65 3.36 3 7.5 3s7.5-1.35 7.5-3v-5" />
    </svg>
  );
};

const PasswordVisibilityToggle: React.FC<{ visible: boolean; onToggle: () => void; label: string }> = ({ visible, onToggle, label }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={visible ? `Masquer ${label}` : `Afficher ${label}`}
    aria-pressed={visible}
    tabIndex={-1}
    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 transition-colors hover:text-white"
  >
    {visible ? (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 5.09A9.77 9.77 0 0 1 12 5c5 0 9 4.5 9 7-.44.99-1.14 2.11-2.09 3.13M6.1 6.1C4.14 7.42 2.7 9.28 2.99 12c0 0 .5.99 1.44 2.13" />
      </svg>
    ) : (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </svg>
    )}
  </button>
);

const Security: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SecuritySection>('users');
  const [flashMessage, setFlashMessage] = useState<FlashMessage | null>(null);

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [groups, setGroups] = useState<GroupRecord[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [privileges, setPrivileges] = useState<PrivilegeRecord[]>([]);
  const [privilegesLoading, setPrivilegesLoading] = useState(true);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(true);

  const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isUserFormVisible, setIsUserFormVisible] = useState(false);
  const [userForm, setUserForm] = useState<UserFormState>(defaultUserForm);
  const [userSubmitting, setUserSubmitting] = useState(false);

  const [groupModalMode, setGroupModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(defaultGroupForm);
  const [isGroupFormVisible, setIsGroupFormVisible] = useState(false);
  const [groupFormMode, setGroupFormMode] = useState<'create' | 'edit'>('create');
  const [groupSubmitting, setGroupSubmitting] = useState(false);

  const [privilegeModalMode, setPrivilegeModalMode] = useState<'edit' | 'create' | null>(null);
  const [editingPrivilegeId, setEditingPrivilegeId] = useState<string | null>(null);
  const [privilegeForm, setPrivilegeForm] = useState<PrivilegeFormState>(defaultPrivilegeForm);
  const [selectedPrivilegeGroupId, setSelectedPrivilegeGroupId] = useState('');

  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(defaultPasswordForm);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const togglePasswordVisibility = (field: keyof typeof passwordVisibility) => {
    setPasswordVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const selectedGroup = useMemo(
    () => groups.find(group => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  const selectedPrivilege = useMemo(
    () => privileges.find(privilege => privilege.id === editingPrivilegeId) ?? null,
    [privileges, editingPrivilegeId]
  );

  const selectedPrivilegeGroup = useMemo(
    () => groups.find(group => group.id === selectedPrivilegeGroupId) ?? groups[0] ?? null,
    [groups, selectedPrivilegeGroupId]
  );

  const showFlash = (tone: FlashMessage['tone'], text: string) => {
    setFlashMessage({ tone, text });
  };

  useEffect(() => {
    if (!flashMessage) {
      return;
    }
    const timer = window.setTimeout(() => setFlashMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await api.get('/security/users');
      const nextUsers = Array.isArray(response.data) ? response.data.map(mapApiUser) : [];
      setUsers(nextUsers);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setUsersLoading(false);
    }
  };

  const mapApiGroup = (g: any): GroupRecord => ({
    id: String(g.id),
    name: g.name ?? '',
    members: g.memberCount ?? 0,
    rights: Array.isArray(g.rights) ? g.rights.join(', ') : (g.description ?? 'Non defini')
  });

  const loadGroups = async () => {
    setGroupsLoading(true);
    try {
      const data = await groupApi.list();
      setGroups(data.map(mapApiGroup));
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setGroupsLoading(false);
    }
  };

  const mapApiPrivilege = (p: any): PrivilegeRecord => ({
    id: String(p.id),
    module: p.module ?? '',
    code: p.code ?? '',
    level: p.level ?? 'Lecture',
    visible: p.visible ?? true
  });

  const loadPrivileges = async () => {
    setPrivilegesLoading(true);
    try {
      const data = await privilegeApi.list();
      setPrivileges(data.map(mapApiPrivilege));
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setPrivilegesLoading(false);
    }
  };

  const mapApiBackup = (b: any): BackupRecord => ({
    id: String(b.id),
    label: b.label ?? '',
    createdAt: b.createdAt ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(b.createdAt)) : '',
    status: b.status ?? 'Disponible'
  });

  const loadBackups = async () => {
    setBackupsLoading(true);
    try {
      const data = await backupApi.list();
      setBackups(data.map(mapApiBackup));
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setBackupsLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
    void loadGroups();
    void loadPrivileges();
    void loadBackups();
  }, []);

  const resetUserForm = () => {
    setSelectedUserId(null);
    setUserForm(defaultUserForm());
    setUserFormMode('create');
    setUserSubmitting(false);
  };

  const closeUserForm = () => {
    resetUserForm();
    setIsUserFormVisible(false);
  };

  const closeGroupModal = () => {
    setGroupModalMode(null);
    setSelectedGroupId(null);
    setGroupForm(defaultGroupForm());
  };

  const closePrivilegeModal = () => {
    setPrivilegeModalMode(null);
    setEditingPrivilegeId(null);
    setPrivilegeForm(defaultPrivilegeForm());
  };

  const prepareCreateUser = () => {
    resetUserForm();
    setUserFormMode('create');
    setIsUserFormVisible(true);
  };

  const prepareEditUser = (user: UserRecord) => {
    setSelectedUserId(user.id);
    setUserForm({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    });
    setUserFormMode('edit');
    setIsUserFormVisible(true);
  };

  const submitUserForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const username = userForm.username.trim();
    const firstName = userForm.firstName.trim();
    const lastName = userForm.lastName.trim();
    const email = userForm.email.trim();
    const role = userForm.role.trim();

    if (!username || !firstName || !lastName || !role) {
      showFlash('error', 'Veuillez remplir les informations utilisateur obligatoires.');
      return;
    }

    if (userFormMode === 'create' && userForm.password.trim().length < 6) {
      showFlash('error', 'Le mot de passe initial doit contenir au moins 6 caracteres.');
      return;
    }

    setUserSubmitting(true);
    try {
      if (userFormMode === 'create') {
        const response = await api.post('/security/users', {
          username,
          password: userForm.password.trim(),
          firstName,
          lastName,
          email: email || null,
          role,
          status: userForm.status
        });
        setUsers(prev => [mapApiUser(response.data), ...prev]);
        showFlash('success', `Utilisateur ${username} ajoute avec succes.`);
      }

      if (userFormMode === 'edit' && selectedUserId) {
        const response = await api.put(`/security/users/${selectedUserId}`, {
          username,
          firstName,
          lastName,
          email: email || null,
          role,
          status: userForm.status
        });
        const updated = mapApiUser(response.data);
        setUsers(prev => prev.map(user => (user.id === selectedUserId ? updated : user)));
        showFlash('success', `Utilisateur ${username} modifie avec succes.`);
      }

      closeUserForm();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
      setUserSubmitting(false);
    }
  };

  const deleteUser = async (userId: string) => {
    const user = users.find(item => item.id === userId);
    if (!user) {
      return;
    }

    const confirmed = window.confirm(`Supprimer l'utilisateur ${user.username} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/security/users/${userId}`);
      setUsers(prev => prev.filter(item => item.id !== userId));
      showFlash('success', `Utilisateur ${user.username} supprime.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const resetGroupForm = () => {
    setSelectedGroupId(null);
    setGroupForm(defaultGroupForm());
    setGroupFormMode('create');
    setGroupSubmitting(false);
  };

  const closeGroupForm = () => {
    resetGroupForm();
    setIsGroupFormVisible(false);
  };

  const prepareCreateGroup = () => {
    resetGroupForm();
    setGroupFormMode('create');
    setIsGroupFormVisible(true);
  };

  const prepareEditGroup = (group: GroupRecord) => {
    setSelectedGroupId(group.id);
    setGroupForm({
      name: group.name,
      members: String(group.members),
      rights: group.rights
    });
    setGroupFormMode('edit');
    setIsGroupFormVisible(true);
  };

  const submitDynamicGroupForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = groupForm.name.trim();
    const rights = groupForm.rights.trim() || 'Non defini';
    const members = Number(groupForm.members);

    if (!name || Number.isNaN(members) || members < 1) {
      showFlash('error', 'Veuillez renseigner un groupe valide.');
      return;
    }

    setGroupSubmitting(true);
    try {
      if (groupFormMode === 'create') {
        await groupApi.create({ name, description: rights, rights: rights.split(',').map(r => r.trim()) });
        await loadGroups();
        showFlash('success', `Groupe ${name} ajoute avec succes.`);
      }

      if (groupFormMode === 'edit' && selectedGroupId) {
        await groupApi.update(Number(selectedGroupId), { name, description: rights, rights: rights.split(',').map(r => r.trim()) });
        await loadGroups();
        showFlash('success', `Groupe ${name} modifie avec succes.`);
      }

      closeGroupForm();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
      setGroupSubmitting(false);
    }
  };

  const deleteGroup = async (groupId: string) => {
    const group = groups.find(item => item.id === groupId);
    if (!group) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le groupe ${group.name} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await groupApi.delete(Number(groupId));
      await loadGroups();
      showFlash('success', `Groupe ${group.name} supprime.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const submitGroupForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = groupForm.name.trim();
    const rights = groupForm.rights.trim() || 'Non defini';
    const members = Number(groupForm.members);

    if (!name || Number.isNaN(members) || members < 1) {
      showFlash('error', 'Veuillez renseigner un groupe valide.');
      return;
    }

    try {
      if (groupModalMode === 'create') {
        await groupApi.create({ name, description: rights, rights: rights.split(',').map(r => r.trim()) });
        await loadGroups();
        showFlash('success', `Groupe ${name} ajoute avec succes.`);
      }

      if (groupModalMode === 'edit' && selectedGroupId) {
        await groupApi.update(Number(selectedGroupId), { name, description: rights, rights: rights.split(',').map(r => r.trim()) });
        await loadGroups();
        showFlash('success', `Groupe ${name} modifie avec succes.`);
      }
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }

    closeGroupModal();
  };

  const openCreateGroupModal = () => {
    setGroupForm(defaultGroupForm());
    setSelectedGroupId(null);
    setGroupModalMode('create');
  };

  const openEditGroupModal = (group: GroupRecord) => {
    setSelectedGroupId(group.id);
    setGroupForm({
      name: group.name,
      members: String(group.members),
      rights: group.rights
    });
    setGroupModalMode('edit');
  };

  const openViewGroupModal = (group: GroupRecord) => {
    setSelectedGroupId(group.id);
    setGroupModalMode('view');
  };

  const openEditPrivilegeModal = (privilege: PrivilegeRecord) => {
    setEditingPrivilegeId(privilege.id);
    setPrivilegeForm({
      module: privilege.module,
      code: privilege.code,
      level: privilege.level
    });
    setPrivilegeModalMode('edit');
  };

  const openCreatePrivilegeModal = () => {
    setEditingPrivilegeId(null);
    setPrivilegeForm(defaultPrivilegeForm());
    setPrivilegeModalMode('create');
  };

  const submitPrivilegeForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const module = privilegeForm.module.trim();
    const code = privilegeForm.code.trim().toUpperCase();
    const level = privilegeForm.level.trim();

    if (!module || !code || !level) {
      showFlash('error', 'Veuillez completer les informations du privilege.');
      return;
    }

    try {
      if (privilegeModalMode === 'create') {
        await privilegeApi.create({ module, code, level, visible: true });
        showFlash('success', `Privilege ${code} cree.`);
      } else if (editingPrivilegeId) {
        await privilegeApi.update(editingPrivilegeId, { module, code, level });
        showFlash('success', `Privilege ${code} mis a jour.`);
      }
      await loadPrivileges();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
    closePrivilegeModal();
  };

  const deletePrivilege = async (privilegeId: string) => {
    const privilege = privileges.find(item => item.id === privilegeId);
    if (!privilege) {
      return;
    }

    const confirmed = window.confirm(`Supprimer le privilege ${privilege.code} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await privilegeApi.delete(privilegeId);
      await loadPrivileges();
      showFlash('success', `Privilege ${privilege.code} supprime.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const togglePrivilegeVisibility = async (privilegeId: string) => {
    const privilege = privileges.find(item => item.id === privilegeId);
    if (!privilege) return;

    try {
      await api.patch(`/security/privileges/${privilegeId}/visibility`, { visible: !privilege.visible });
      await loadPrivileges();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const validatePrivilegeMatrix = () => {
    const groupName = selectedPrivilegeGroup?.name ?? 'le groupe';
    showFlash('success', `Privileges du groupe ${groupName} valides.`);
  };

  const passwordFormIsValid = useMemo(() => {
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    return (
      currentPassword.length > 0 &&
      newPassword.length >= PASSWORD_MIN_LENGTH &&
      confirmPassword.length > 0 &&
      confirmPassword === newPassword &&
      currentPassword !== newPassword
    );
  }, [passwordForm]);

  const passwordFieldErrors = useMemo(() => {
    const currentPassword = passwordForm.currentPassword.trim();
    const newPassword = passwordForm.newPassword.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    const errors: { newPassword?: string; confirmPassword?: string } = {};

    if (newPassword.length > 0 && newPassword.length < PASSWORD_MIN_LENGTH) {
      errors.newPassword = `Le nouveau mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères (${newPassword.length}/${PASSWORD_MIN_LENGTH}).`;
    } else if (newPassword.length > 0 && currentPassword.length > 0 && newPassword === currentPassword) {
      errors.newPassword = 'Le nouveau mot de passe doit être différent du mot de passe actuel.';
    }

    if (confirmPassword.length > 0 && confirmPassword !== newPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas.';
    }

    return errors;
  }, [passwordForm]);

  const submitPasswordForm = async (event: React.FormEvent) => {
    event.preventDefault();

    const userId = readCurrentUserId();
    if (!userId) {
      showFlash('error', 'Utilisateur courant introuvable.');
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      showFlash('error', 'Veuillez remplir tous les champs du mot de passe.');
      return;
    }

    setPasswordSubmitting(true);
    try {
      await api.post('/security/change-password', {
        userId,
        currentPassword,
        newPassword,
        confirmPassword
      });
      setPasswordForm(defaultPasswordForm());
      showFlash('success', 'Mot de passe mis a jour avec succes.');
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const createBackup = async () => {
    try {
      await backupApi.create(`Sauvegarde manuelle`);
      await loadBackups();
      showFlash('success', 'Sauvegarde generee avec succes.');
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const restoreBackup = async () => {
    if (!backups.length) {
      showFlash('error', 'Aucune sauvegarde disponible a restaurer.');
      return;
    }

    const latestBackup = backups[0];
    const confirmed = window.confirm(`Restaurer ${latestBackup.label} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await backupApi.restore(latestBackup.id);
      await loadBackups();
      showFlash('info', `${latestBackup.label} a ete restauree.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const clearBackupHistory = async () => {
    if (!backups.length) {
      showFlash('info', 'Aucun historique de sauvegarde a supprimer.');
      return;
    }

    const confirmed = window.confirm(`Supprimer definitivement l'historique des ${backups.length} sauvegarde${backups.length > 1 ? 's' : ''} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await backupApi.clearAll();
      await loadBackups();
      showFlash('success', "Historique des sauvegardes supprime.");
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const restoreBackupById = async (backup: BackupRecord) => {
    const confirmed = window.confirm(`Restaurer ${backup.label} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await backupApi.restore(backup.id);
      await loadBackups();
      showFlash('info', `${backup.label} a ete restauree.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const deleteBackupById = async (backup: BackupRecord) => {
    const confirmed = window.confirm(`Supprimer definitivement ${backup.label} ?`);
    if (!confirmed) {
      return;
    }

    try {
      await backupApi.delete(backup.id);
      await loadBackups();
      showFlash('success', `${backup.label} supprimee.`);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const downloadBackupById = async (backup: BackupRecord) => {
    try {
      const blob = await backupApi.download(backup.id);
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backup.label.replace(/\s+/g, '_')}.sql`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const renderContent = () => {
    if (activeSection === 'users') {
      return (
        <div>
          <div className="relative mb-8">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
            <div className="relative flex flex-col gap-6 rounded-3xl border border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-8 backdrop-blur-xl md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-3xl font-black text-transparent">
                  Gestion des utilisateurs
                </h2>
                <p className="mt-3 text-sm text-gray-400">
                  {users.length} utilisateur{users.length > 1 ? 's' : ''} en base de donnees.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={prepareCreateUser}
                  className="relative group overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  <span className="relative">Nouveau utilisateur</span>
                </button>
                {selectedUserId ? (
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="rounded-2xl border border-gray-600/50 bg-gray-900/80 px-5 py-3 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white"
                  >
                    Fermer la fiche
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isUserFormVisible ? (
              <div className="relative overflow-hidden rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl backdrop-blur-xl">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-2xl"></div>
                <div className="relative p-6">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                    <div className="rounded-3xl border border-gray-700/50 bg-gray-950/80 p-4">
                      <div className="text-xs uppercase tracking-[0.25em] text-gray-400">Nombre</div>
                      <div className="mt-3 flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-lg font-semibold text-white shadow-lg shadow-blue-500/20">
                        {users.length}
                      </div>
                    </div>
                    <div className="rounded-3xl border border-gray-700/50 bg-gray-950/80 p-4">
                      <div className="text-xs uppercase tracking-[0.35em] text-emerald-300">Enregistrement</div>
                      <div className="mt-2 text-sm text-gray-300">
                        {userFormMode === 'create'
                          ? 'Remplissez le formulaire ci-dessous pour ajouter un nouvel utilisateur.'
                          : 'Modifiez les informations puis cliquez sur Modifier pour mettre à jour.'}
                      </div>
                    </div>
                  </div>

                  <form className="mt-6 space-y-4" onSubmit={(event) => void submitUserForm(event)}>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Nom</label>
                        <input
                          type="text"
                          value={userForm.lastName}
                          onChange={(event) => setUserForm(prev => ({ ...prev, lastName: event.target.value }))}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Prénom</label>
                        <input
                          type="text"
                          value={userForm.firstName}
                          onChange={(event) => setUserForm(prev => ({ ...prev, firstName: event.target.value }))}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Login</label>
                        <input
                          type="text"
                          value={userForm.username}
                          onChange={(event) => setUserForm(prev => ({ ...prev, username: event.target.value }))}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Password</label>
                        <input
                          type="password"
                          value={userForm.password}
                          onChange={(event) => setUserForm(prev => ({ ...prev, password: event.target.value }))}
                          placeholder={userFormMode === 'edit' ? 'Laisser vide pour conserver' : 'Mot de passe'}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Groupe</label>
                        <select
                          value={userForm.role}
                          onChange={(event) => setUserForm(prev => ({ ...prev, role: event.target.value }))}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="Admin">Admin</option>
                          <option value="Comptable">Comptable</option>
                          <option value="Reception">Reception</option>
                          <option value="Service">Service</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-gray-300">Statut</label>
                        <select
                          value={userForm.status}
                          onChange={(event) => setUserForm(prev => ({ ...prev, status: event.target.value as UserRecord['status'] }))}
                          className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="Actif">Actif</option>
                          <option value="Suspendu">Suspendu</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={userSubmitting}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {userFormMode === 'create'
                          ? (userSubmitting ? 'Enregistrement...' : 'Enregistrer')
                          : (userSubmitting ? 'Mise à jour...' : 'Modifier')}
                      </button>
                      {userFormMode === 'edit' && selectedUserId ? (
                        <button
                          type="button"
                          onClick={() => void deleteUser(selectedUserId)}
                          className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/20"
                        >
                          Supprimer
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={closeUserForm}
                        className="rounded-xl border border-gray-600/50 bg-gray-900/80 px-5 py-3 text-sm font-semibold text-gray-200 transition-colors hover:border-gray-500 hover:text-white"
                      >
                        Fermer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : null}

            <div className="relative overflow-hidden rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl backdrop-blur-xl">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-2xl"></div>
              <div className="relative p-6">
                {usersLoading ? (
                  <div className="px-6 py-10 text-center text-sm text-gray-300">Chargement des utilisateurs...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700/50">
                      <thead className="bg-gray-900/80 text-left text-xs uppercase tracking-wider text-gray-400">
                        <tr>
                          <th className="px-4 py-3">Nom</th>
                          <th className="hidden px-4 py-3 md:table-cell">Prénom</th>
                          <th className="hidden px-4 py-3 md:table-cell">Login</th>
                          <th className="hidden px-4 py-3 md:table-cell">Groupe</th>
                          <th className="px-4 py-3">Statut</th>
                          <th className="px-4 py-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700/50">
                        {users.map((user) => (
                          <tr key={user.id} className="transition-colors hover:bg-gray-800/50">
                            <td className="px-4 py-4 text-sm font-medium text-white">
                              {user.lastName}
                              <span className="mt-0.5 block text-xs font-normal text-gray-400 md:hidden">{user.firstName} · {user.username}</span>
                            </td>
                            <td className="hidden px-4 py-4 text-sm text-gray-300 md:table-cell">{user.firstName}</td>
                            <td className="hidden px-4 py-4 text-sm text-gray-300 md:table-cell">{user.username}</td>
                            <td className="hidden px-4 py-4 text-sm text-gray-300 md:table-cell">{user.groupName || user.role}</td>
                            <td className="px-4 py-4 text-sm">
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold leading-5 ${
                                user.status === 'Actif'
                                  ? 'border border-green-500/30 bg-green-500/20 text-green-300'
                                  : 'border border-yellow-500/30 bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm font-medium text-white">
                              <button
                                type="button"
                                onClick={() => prepareEditUser(user)}
                                className="mr-2 text-blue-300 transition-colors hover:text-blue-100"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => void deleteUser(user.id)}
                                className="text-red-400 transition-colors hover:text-red-300"
                              >
                                Supprimer
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'groups') {
      return (
        <div>
          <div className="mb-8 rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Gestion des groupes</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {groups.length} groupe{groups.length > 1 ? 's' : ''} en base de donnees.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={prepareCreateGroup}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                >
                  Nouveau groupe
                </button>
                {selectedGroupId ? (
                  <button
                    type="button"
                    onClick={resetGroupForm}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm text-slate-300 hover:text-white transition-colors"
                  >
                    Fermer la fiche
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {isGroupFormVisible ? (
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
                <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Nombre</div>
                    <div className="mt-3 flex h-12 items-center justify-center rounded-lg bg-blue-600 text-lg font-semibold text-white">
                      {groups.length}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">Enregistrement</div>
                    <div className="mt-2 text-sm text-slate-300">
                      {groupFormMode === 'create'
                        ? 'Remplissez le formulaire ci-dessous pour ajouter un nouveau groupe.'
                        : 'Modifiez les informations puis cliquez sur Modifier pour mettre à jour.'}
                    </div>
                  </div>
                </div>

                <form className="mt-6 space-y-4" onSubmit={(event) => void submitDynamicGroupForm(event)}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Libellé</label>
                      <input
                        type="text"
                        value={groupForm.name}
                        onChange={(event) => setGroupForm(prev => ({ ...prev, name: event.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-300">Nombre de membres</label>
                      <input
                        type="number"
                        value={groupForm.members}
                        onChange={(event) => setGroupForm(prev => ({ ...prev, members: event.target.value }))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      disabled={groupSubmitting}
                      className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition-colors"
                    >
                      {groupFormMode === 'create'
                        ? (groupSubmitting ? 'Enregistrement...' : 'Enregistrer')
                        : (groupSubmitting ? 'Mise à jour...' : 'Modifier')}
                    </button>
                    {groupFormMode === 'edit' && selectedGroupId ? (
                      <button
                        type="button"
                        onClick={() => deleteGroup(selectedGroupId)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 hover:bg-red-500/20 transition-colors"
                      >
                        Supprimer
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={closeGroupForm}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white transition-colors"
                    >
                      Fermer
                    </button>
                  </div>
                </form>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-xl border border-slate-700/60 bg-slate-950/60 p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold text-white">{group.name}</h3>
                      <span className="inline-flex items-center rounded-full border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
                        {group.members} membres
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-slate-300">{group.rights}</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => openViewGroupModal(group)}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
                        </svg>
                        Voir
                      </button>
                      <button
                        type="button"
                        onClick={() => prepareEditGroup(group)}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m16.8 4.6 2.6 2.6" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Z" />
                        </svg>
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteGroup(group.id)}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7 18.1 19.2A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.8L5 7" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 11v6M14 11v6M4 7h16M9 7V4h6v3" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSection === 'privileges') {
      return (
        <div>
          <div className="relative mb-6 overflow-hidden rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/75 to-gray-900/75 p-5 shadow-xl backdrop-blur-xl">
            <div className="absolute -right-16 -top-24 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl"></div>
            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">
                  <SectionIcon section="privileges" className="h-4 w-4" />
                  Controle des acces
                </div>
                <h2 className="text-2xl font-black text-white">Privileges par groupe</h2>
                <p className="mt-2 text-sm text-gray-400">
                  Modules visibles et actions autorisees par groupe.
                </p>
              </div>

              <div className="grid w-full gap-3 md:grid-cols-3 xl:w-[620px]">
                <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-950/55 px-4 py-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                    <SectionIcon section="groups" className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Groupe</div>
                    <div className="mt-1 truncate text-sm font-bold text-white" title={selectedPrivilegeGroup?.name ?? '-'}>
                      {selectedPrivilegeGroup?.name ?? '-'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-950/55 px-4 py-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Actifs</div>
                    <div className="mt-1 text-xl font-black leading-none text-emerald-300">
                      {privileges.filter(privilege => privilege.visible).length}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-950/55 px-4 py-3">
                  <div className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 text-sky-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">Total</div>
                    <div className="mt-1 text-xl font-black leading-none text-sky-300">{privileges.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-gray-700/50 bg-gray-950/50 p-5 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full md:max-w-md">
                <label className="mb-2 block text-sm font-semibold text-gray-300">Groupe utilisateur</label>
                <select
                  value={selectedPrivilegeGroupId}
                  onChange={(event) => setSelectedPrivilegeGroupId(event.target.value)}
                  className="w-full rounded-2xl border border-gray-700/50 bg-gray-900/80 px-4 py-3 text-white outline-none transition-all focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/30"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openCreatePrivilegeModal}
                  className="no-auto-icon inline-flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30"
                >
                  <svg className="h-5 w-5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Nouveau privilege
                </button>
                <button
                  type="button"
                  onClick={validatePrivilegeMatrix}
                  className="no-auto-icon inline-flex min-h-11 items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30"
                >
                  <svg className="h-5 w-5 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Valider
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('groups')}
                  className="no-auto-icon inline-flex min-h-11 items-center justify-center gap-2.5 rounded-2xl border border-gray-700/60 bg-gray-900/80 px-5 py-3 text-sm font-semibold text-gray-200 transition-all hover:border-gray-500 hover:text-white"
                >
                  <svg className="h-5 w-5 flex-none text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                  Fermer
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b border-gray-700/50 bg-gray-950/70 text-xs uppercase tracking-[0.18em] text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Groupe</th>
                    <th className="px-6 py-4 font-semibold">Objet</th>
                    <th className="px-6 py-4 font-semibold">Code</th>
                    <th className="px-6 py-4 text-center font-semibold">Visible</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {privileges.map((privilege) => (
                    <tr key={privilege.id} className="transition-colors hover:bg-gray-800/60">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-300">
                            <SectionIcon section="groups" className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-white">{selectedPrivilegeGroup?.name ?? '-'}</div>
                            <div className="text-xs text-gray-500">Groupe selectionne</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-white">{privilege.module}</div>
                        <div className="mt-1 text-xs text-gray-400">{privilege.level}</div>
                      </td>
                      <td className="px-6 py-5">
                        <code className="rounded-xl border border-gray-700/60 bg-gray-950/60 px-3 py-1.5 text-xs font-semibold text-blue-200">
                          {privilege.code}
                        </code>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => togglePrivilegeVisibility(privilege.id)}
                            aria-pressed={privilege.visible}
                            className={`no-auto-icon relative inline-flex h-8 w-14 flex-none items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 ${
                              privilege.visible
                                ? 'justify-end bg-blue-600 focus-visible:ring-blue-400'
                                : 'justify-start bg-gray-600 focus-visible:ring-gray-400'
                            }`}
                            aria-label={`${privilege.visible ? 'Masquer' : 'Afficher'} ${privilege.module}`}
                          >
                            <span
                              className={`flex h-6 w-9 items-center rounded-full bg-white shadow-md transition-all duration-200 ${
                                privilege.visible ? 'justify-start' : 'justify-end'
                              }`}
                            >
                              <span
                                className={`m-1 h-4 w-4 rounded-full transition-colors duration-200 ${
                                  privilege.visible ? 'bg-blue-600' : 'bg-gray-600'
                                }`}
                              />
                            </span>
                          </button>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${privilege.visible ? 'text-blue-400' : 'text-gray-400'}`}>
                            {privilege.visible ? 'Visible' : 'Masque'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditPrivilegeModal(privilege)}
                            className="no-auto-icon inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 transition-colors hover:bg-blue-500/20"
                          >
                            <svg className="h-4 w-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m16.8 4.6 2.6 2.6" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M4 20h4.2L19 9.2 14.8 5 4 15.8V20Z" />
                            </svg>
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => deletePrivilege(privilege.id)}
                            className="no-auto-icon inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                          >
                            <svg className="h-4 w-4 flex-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M19 7 18.1 19.2A2 2 0 0 1 16.1 21H7.9a2 2 0 0 1-2-1.8L5 7" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M10 11v6M14 11v6M4 7h16M9 7V4h6v3" />
                            </svg>
                            Supprimer
                          </button>
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
    }

    if (activeSection === 'password') {
      return (
        <div>
          <div className="mb-8 rounded-2xl border border-gray-700/50 bg-[#0d1327] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
            <h2 className="text-3xl font-black text-white">Changer le mot de passe</h2>
          </div>

          <div className="max-w-2xl">
            <div className="rounded-2xl border border-gray-700/50 bg-[#0d1327] p-8 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <form className="space-y-6" onSubmit={(event) => void submitPasswordForm(event)}>
                <div>
                  <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-gray-300">
                    Mot de passe actuel
                  </label>
                  <div className="relative">
                    <input
                      id="current-password"
                      type={passwordVisibility.currentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(event) => setPasswordForm(prev => ({ ...prev, currentPassword: event.target.value }))}
                      className="w-full rounded-xl border border-gray-600/50 bg-[#1a2233] px-4 py-3 pr-12 text-white placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.currentPassword}
                      onToggle={() => togglePasswordVisibility('currentPassword')}
                      label="le mot de passe actuel"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-300">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      type={passwordVisibility.newPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(event) => setPasswordForm(prev => ({ ...prev, newPassword: event.target.value }))}
                      className={`w-full rounded-xl border bg-[#1a2233] px-4 py-3 pr-12 text-white placeholder-gray-400 transition-colors focus:outline-none ${
                        passwordFieldErrors.newPassword ? 'border-red-500/60 focus:border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                      }`}
                      placeholder="Entrez votre nouveau mot de passe"
                    />
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.newPassword}
                      onToggle={() => togglePasswordVisibility('newPassword')}
                      label="le nouveau mot de passe"
                    />
                  </div>
                  {passwordFieldErrors.newPassword ? (
                    <p className="mt-2 text-sm text-red-400">{passwordFieldErrors.newPassword}</p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">Minimum {PASSWORD_MIN_LENGTH} caractères.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-300">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      type={passwordVisibility.confirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(event) => setPasswordForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                      className={`w-full rounded-xl border bg-[#1a2233] px-4 py-3 pr-12 text-white placeholder-gray-400 transition-colors focus:outline-none ${
                        passwordFieldErrors.confirmPassword ? 'border-red-500/60 focus:border-red-500' : 'border-gray-600/50 focus:border-blue-500'
                      }`}
                      placeholder="Confirmez votre nouveau mot de passe"
                    />
                    <PasswordVisibilityToggle
                      visible={passwordVisibility.confirmPassword}
                      onToggle={() => togglePasswordVisibility('confirmPassword')}
                      label="la confirmation du mot de passe"
                    />
                  </div>
                  {passwordFieldErrors.confirmPassword ? (
                    <p className="mt-2 text-sm text-red-400">{passwordFieldErrors.confirmPassword}</p>
                  ) : null}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={passwordSubmitting || !passwordFormIsValid}
                    className={`inline-flex items-center justify-center gap-3 rounded-xl px-8 py-3 text-sm font-semibold text-white transition-colors ${
                      passwordSubmitting || !passwordFormIsValid
                        ? 'cursor-not-allowed bg-gray-600 opacity-60'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                    </svg>
                    {passwordSubmitting
                      ? 'Mise à jour...'
                      : passwordFormIsValid
                        ? 'Mettre à jour'
                        : 'Compléter le formulaire'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
          <div className="relative rounded-3xl border border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 p-8 backdrop-blur-xl">
            <h2 className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-3xl font-black text-transparent">
              Sauvegarde
            </h2>
          </div>
        </div>

        <div className="max-w-4xl">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-2xl"></div>
            <div className="relative rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-8 shadow-2xl backdrop-blur-xl">
              <h3 className="mb-4 text-xl font-bold text-white">Historique des sauvegardes</h3>
              <p className="mb-6 text-sm text-gray-300">
                Derniere sauvegarde automatique: {backups[0]?.createdAt ?? 'Aucune'}
              </p>

              <div className="mb-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={createBackup}
                  className="relative group rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                >
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 blur-lg transition-all duration-300 group-hover:blur-xl"></div>
                  <span className="relative flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Lancer une sauvegarde
                  </span>
                </button>
                <button
                  type="button"
                  onClick={restoreBackup}
                  className="relative group rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg flex items-center gap-2"
                >
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 blur-lg transition-all duration-300 group-hover:blur-lg"></div>
                  <span className="relative flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h4l3 8 4-16 3 8h4" />
                    </svg>
                    Restaurer une sauvegarde
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => void clearBackupHistory()}
                  disabled={!backups.length}
                  className="relative group rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-6 py-3 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:shadow-red-500/30 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
                >
                  <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 blur-lg transition-all duration-300 group-hover:blur-xl"></div>
                  <span className="relative flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9.5 7V4a1 1 0 011-1h3a1 1 0 011 1v3M4 7h16" />
                    </svg>
                    Supprimer l'historique
                  </span>
                </button>
              </div>

              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-700/50 bg-black/20 px-5 py-4">
                    <div>
                      <p className="font-semibold text-white">{backup.label}</p>
                      <p className="text-sm text-gray-400">{backup.createdAt}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        backup.status === 'Disponible'
                          ? 'border border-green-500/30 bg-green-500/20 text-green-400'
                          : 'border border-blue-500/30 bg-blue-500/20 text-blue-400'
                      }`}>
                        {backup.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => void downloadBackupById(backup)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-600/50 bg-gray-900/60 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-blue-500/50 hover:text-blue-300"
                      >
                        <FaDownload className="h-3.5 w-3.5 text-blue-400" aria-hidden="true" />
                        Telecharger
                      </button>
                      <button
                        type="button"
                        onClick={() => void restoreBackupById(backup)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-600/50 bg-gray-900/60 px-3 py-2 text-xs font-semibold text-gray-200 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                      >
                        <FaRecycle className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                        Restaurer
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteBackupById(backup)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {flashMessage ? (
        <div className="fixed right-6 top-6 z-[100] w-full max-w-sm animate-in fade-in slide-in-from-top-2">
          <div className={`rounded-2xl border px-5 py-4 text-sm shadow-2xl backdrop-blur-xl ${
            flashMessage.tone === 'success'
              ? 'border-green-500/30 bg-green-900/90 text-green-300'
              : flashMessage.tone === 'error'
                ? 'border-red-500/30 bg-red-900/90 text-red-300'
                : 'border-blue-500/30 bg-blue-900/90 text-blue-300'
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

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="mx-auto max-w-full px-6 py-8 lg:px-8">
          <div className="relative mb-10">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-2xl"></div>
            <div className="relative rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/80 to-gray-900/80 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-gray-700/50">
                <nav className="flex space-x-8 overflow-x-auto px-8" aria-label="Tabs">
                  {MENU_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.id)}
                      className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition-all duration-200 ${
                        activeSection === item.id
                          ? 'border-blue-500 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-400'
                          : 'border-transparent text-gray-400 hover:border-gray-600 hover:bg-gray-800/50 hover:text-gray-200'
                      }`}
                    >
                      <span className="inline-flex items-center gap-3">
                        <SectionIcon section={item.id} className="h-5 w-5" />
                        <span>{item.label}</span>
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600/5 to-purple-600/5 blur-xl"></div>
            <div className="relative rounded-2xl border border-gray-700/50 bg-gradient-to-br from-gray-800/30 to-gray-900/30 p-8 backdrop-blur-xl">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>


      {groupModalMode ? (
        <ModalShell
          title={
            groupModalMode === 'create'
              ? 'Ajouter un groupe'
              : groupModalMode === 'edit'
                ? 'Modifier un groupe'
                : 'Details du groupe'
          }
          onClose={closeGroupModal}
        >
          {groupModalMode === 'view' && selectedGroup ? (
            <div className="space-y-4 text-sm text-gray-300">
              <div className="rounded-2xl border border-gray-700/50 bg-black/20 p-5">
                <p className="mb-2 text-white"><span className="font-semibold">Nom:</span> {selectedGroup.name}</p>
                <p className="mb-2 text-white"><span className="font-semibold">Membres:</span> {selectedGroup.members}</p>
                <p className="text-white"><span className="font-semibold">Droits:</span> {selectedGroup.rights}</p>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => openEditGroupModal(selectedGroup)}
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white"
                >
                  Modifier ce groupe
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitGroupForm} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Nom du groupe</label>
                <input
                  type="text"
                  value={groupForm.name}
                  onChange={(event) => setGroupForm(prev => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">Nombre de membres</label>
                  <input
                    type="number"
                    min="1"
                    value={groupForm.members}
                    onChange={(event) => setGroupForm(prev => ({ ...prev, members: event.target.value }))}
                    className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeGroupModal} className="rounded-xl border border-gray-600/50 px-5 py-3 text-sm text-gray-300 hover:border-gray-500 hover:text-white">
                  Annuler
                </button>
                <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white">
                  Enregistrer
                </button>
              </div>
            </form>
          )}
        </ModalShell>
      ) : null}

      {(privilegeModalMode === 'edit' && selectedPrivilege) || privilegeModalMode === 'create' ? (
        <ModalShell
          title={privilegeModalMode === 'create' ? 'Nouveau privilege' : `Modifier ${selectedPrivilege?.code}`}
          onClose={closePrivilegeModal}
        >
          <form onSubmit={submitPrivilegeForm} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Module</label>
                <input
                  type="text"
                  value={privilegeForm.module}
                  onChange={(event) => setPrivilegeForm(prev => ({ ...prev, module: event.target.value }))}
                  className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Niveau</label>
                <select
                  value={privilegeForm.level}
                  onChange={(event) => setPrivilegeForm(prev => ({ ...prev, level: event.target.value }))}
                  className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option>Lecture</option>
                  <option>Ecriture</option>
                  <option>Administration</option>
                  <option>Execution</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">Code privilege</label>
              <input
                type="text"
                value={privilegeForm.code}
                onChange={(event) => setPrivilegeForm(prev => ({ ...prev, code: event.target.value }))}
                className="w-full rounded-xl border border-gray-600/50 bg-gray-900/50 px-4 py-3 font-mono text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closePrivilegeModal} className="rounded-xl border border-gray-600/50 px-5 py-3 text-sm text-gray-300 hover:border-gray-500 hover:text-white">
                Annuler
              </button>
              <button type="submit" className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white">
                Enregistrer
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
};

export default Security;
