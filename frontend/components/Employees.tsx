import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type EmployeeDto = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  position: string;
  department: string;
  hireDate: string;
  salary: number;
  status: string | null;
  userRole: string | null;
  userId: number | null;
};

type FlashState = {
  tone: 'success' | 'error' | 'info';
  text: string;
} | null;

type EmployeeFormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  hireDate: string;
  salary: string;
  status: string;
  userRole: string;
  userId: string;
};

const defaultEmployeeForm = (): EmployeeFormState => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: '',
  department: '',
  hireDate: new Date().toISOString().slice(0, 10),
  salary: '0',
  status: 'Actif',
  userRole: 'Service',
  userId: ''
});

const extractApiMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      response?: { data?: { message?: string; errors?: Record<string, string> } | string };
      message?: string;
    };
    const data = maybeError.response?.data;
    if (typeof data === 'string' && data.trim()) return data;
    if (typeof data === 'object' && data !== null) {
      const message = data.message;
      if (typeof message === 'string' && message.trim()) return message;
      if (data.errors) {
        const firstError = Object.values(data.errors)[0];
        if (firstError) return firstError;
      }
    }
    if (typeof maybeError.message === 'string' && maybeError.message.trim()) return maybeError.message;
  }
  return 'Impossible de charger les employes.';
};

const employeeStatusClassName = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes('actif')) return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20';
  if (normalized.includes('repos')) return 'bg-amber-500/15 text-amber-300 border border-amber-500/20';
  if (normalized.includes('cong')) return 'bg-sky-500/15 text-sky-300 border border-sky-500/20';
  if (normalized.includes('suspend')) return 'bg-rose-500/15 text-rose-300 border border-rose-500/20';
  return 'bg-slate-500/15 text-slate-300 border border-slate-500/20';
};

const ModalShell: React.FC<{
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-3xl border border-gray-700/60 bg-[#0d1327] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="rounded-full border border-gray-600/60 px-3 py-1 text-sm text-gray-300 transition-colors hover:border-gray-500 hover:text-white">
          Fermer
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Employees: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<FlashState>(null);
  const [employees, setEmployees] = useState<EmployeeDto[]>([]);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(null);
  const [employeeForm, setEmployeeForm] = useState<EmployeeFormState>(defaultEmployeeForm);

  const showFlash = (tone: NonNullable<FlashState>['tone'], text: string) => setFlash({ tone, text });

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const response = await api.get<EmployeeDto[]>('/employees');
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEmployees();
  }, []);

  const openCreateModal = () => {
    setEditingEmployeeId(null);
    setEmployeeForm(defaultEmployeeForm());
    setModalMode('create');
  };

  const openEditModal = (employee: EmployeeDto) => {
    setEditingEmployeeId(employee.id);
    setEmployeeForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      position: employee.position || '',
      department: employee.department || '',
      hireDate: employee.hireDate || new Date().toISOString().slice(0, 10),
      salary: String(Number(employee.salary || 0)),
      status: employee.status || 'Actif',
      userRole: employee.userRole || 'Service',
      userId: employee.userId ? String(employee.userId) : ''
    });
    setModalMode('edit');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalMode(null);
    setEditingEmployeeId(null);
    setEmployeeForm(defaultEmployeeForm());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!employeeForm.firstName.trim() || !employeeForm.lastName.trim() || !employeeForm.position.trim() || !employeeForm.department.trim()) {
      showFlash('error', 'Veuillez renseigner les informations obligatoires de l employe.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: employeeForm.firstName.trim(),
        lastName: employeeForm.lastName.trim(),
        email: employeeForm.email.trim() || null,
        phone: employeeForm.phone.trim() || null,
        position: employeeForm.position.trim(),
        department: employeeForm.department.trim(),
        hireDate: employeeForm.hireDate,
        salary: Number(employeeForm.salary || 0),
        status: employeeForm.status,
        userRole: employeeForm.userRole,
        userId: employeeForm.userId.trim() ? Number(employeeForm.userId) : null
      };

      if (modalMode === 'edit' && editingEmployeeId !== null) {
        await api.put(`/employees/${editingEmployeeId}`, payload);
        showFlash('success', 'Employe modifie avec succes.');
      } else {
        await api.post('/employees', payload);
        showFlash('success', 'Employe cree avec succes.');
      }

      closeModal();
      await loadEmployees();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employee: EmployeeDto) => {
    const confirmed = window.confirm(`Supprimer l employe ${employee.firstName} ${employee.lastName} ?`);
    if (!confirmed) return;
    try {
      await api.delete(`/employees/${employee.id}`);
      showFlash('success', 'Employe supprime avec succes.');
      await loadEmployees();
    } catch (error) {
      showFlash('error', extractApiMessage(error));
    }
  };

  const departments = useMemo(() => ['all', ...new Set(employees.map((member) => member.department).filter(Boolean))], [employees]);

  const filteredTeam = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((member) => {
      const matchesDepartment = departmentFilter === 'all' || member.department === departmentFilter;
      const fullName = `${member.firstName} ${member.lastName}`.trim().toLowerCase();
      const matchesSearch = !query || fullName.includes(query) || member.position.toLowerCase().includes(query) || member.department.toLowerCase().includes(query);
      return matchesDepartment && matchesSearch;
    });
  }, [departmentFilter, employees, search]);

  const payroll = useMemo(() => employees.reduce((sum, member) => sum + Number(member.salary || 0), 0), [employees]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-4">
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Effectif</p>
          <p className="mt-3 text-3xl font-semibold text-white">{employees.length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Actifs</p>
          <p className="mt-3 text-3xl font-semibold text-white">{employees.filter((member) => (member.status || '').toLowerCase().includes('actif')).length}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Departements</p>
          <p className="mt-3 text-3xl font-semibold text-white">{departments.length - 1}</p>
        </div>
        <div className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
          <p className="text-xs uppercase tracking-[0.28em] text-white/50">Masse salariale</p>
          <p className="mt-3 text-3xl font-semibold text-white">{payroll.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-gradient-to-br from-[#07111f] via-[#0a1220] to-[#111a2e] p-8 shadow-[0_30px_80px_rgba(2,6,23,0.5)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/65">Personnel</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/95">Gestion du personnel</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Donnees employees chargees depuis Spring Boot avec postes, departements, roles et salaires.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => void loadEmployees()} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5">
              Rafraichir
            </button>
            <button onClick={openCreateModal} className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
              Ajouter un employe
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-700/60 bg-[#0b1020] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.28)]">
        <div className="flex flex-col gap-4 lg:flex-row">
          <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un nom, un poste ou un departement" className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
          <select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)} className="rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
            {departments.map((department) => (
              <option key={department} value={department}>{department === 'all' ? 'Tous les departements' : department}</option>
            ))}
          </select>
        </div>

        {flash ? (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${flash.tone === 'success' ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : flash.tone === 'info' ? 'border border-sky-500/25 bg-sky-500/10 text-sky-200' : 'border border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
            {flash.text}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/65">Chargement des employes...</div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredTeam.map((member) => (
              <article key={member.id} className="rounded-3xl border border-slate-700/60 bg-[#10182b] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white/95">{`${member.firstName} ${member.lastName}`.trim()}</p>
                    <p className="mt-1 text-sm text-white/55">{member.position} · {member.department}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${employeeStatusClassName(member.status || 'Inconnu')}`}>
                    {member.status || 'Inconnu'}
                  </span>
                </div>
                <div className="mt-5 grid gap-3 text-sm text-white/75 sm:grid-cols-2">
                  <p>Role: {member.userRole || 'Service'}</p>
                  <p>Telephone: {member.phone || '-'}</p>
                  <p>Embauche: {member.hireDate || '-'}</p>
                  <p>Salaire: {Number(member.salary || 0).toLocaleString('fr-FR')} FCFA</p>
                </div>
                <div className="mt-3 text-xs text-white/45">{member.email || 'Aucun email renseigne'}</div>
                <div className="mt-5 flex gap-2">
                  <button type="button" onClick={() => openEditModal(member)} className="rounded-xl border border-slate-700/60 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5">
                    Modifier
                  </button>
                  <button type="button" onClick={() => void handleDelete(member)} className="rounded-xl border border-rose-500/25 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/10">
                    Supprimer
                  </button>
                </div>
              </article>
            ))}
            {!filteredTeam.length ? (
              <div className="rounded-3xl border border-slate-700/60 bg-[#10182b] px-4 py-10 text-center text-sm text-white/45 xl:col-span-2">Aucun employe ne correspond aux filtres.</div>
            ) : null}
          </div>
        )}
      </section>

      {modalMode ? (
        <ModalShell title={modalMode === 'create' ? 'Nouvel employe' : 'Modifier l employe'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Prenom</span>
                <input type="text" value={employeeForm.firstName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, firstName: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Nom</span>
                <input type="text" value={employeeForm.lastName} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, lastName: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Email</span>
                <input type="email" value={employeeForm.email} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Telephone</span>
                <input type="text" value={employeeForm.phone} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, phone: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Poste</span>
                <input type="text" value={employeeForm.position} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, position: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Departement</span>
                <input type="text" value={employeeForm.department} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, department: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm text-white/80">
                <span>Date embauche</span>
                <input type="date" value={employeeForm.hireDate} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, hireDate: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Salaire</span>
                <input type="number" min="0" value={employeeForm.salary} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, salary: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-white/80">
                <span>Statut</span>
                <select value={employeeForm.status} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, status: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  <option value="Actif">Actif</option>
                  <option value="En repos">En repos</option>
                  <option value="Conge">Conge</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>Role</span>
                <select value={employeeForm.userRole} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, userRole: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40">
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Receptionniste">Receptionniste</option>
                  <option value="Service">Service</option>
                </select>
              </label>
              <label className="space-y-2 text-sm text-white/80">
                <span>ID utilisateur</span>
                <input type="number" min="0" value={employeeForm.userId} onChange={(event) => setEmployeeForm((prev) => ({ ...prev, userId: event.target.value }))} className="w-full rounded-2xl border border-slate-700/60 bg-[#10182b] px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40" />
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={closeModal} className="rounded-2xl border border-slate-700/60 px-5 py-3 text-sm font-medium text-white/80 transition hover:bg-white/5">
                Annuler
              </button>
              <button type="submit" disabled={submitting} className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60">
                {submitting ? 'Enregistrement...' : modalMode === 'create' ? 'Creer l employe' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </div>
  );
};

export default Employees;
