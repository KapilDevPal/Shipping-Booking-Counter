import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import {
  Users,
  Search,
  ShieldCheck,
  ShieldX,
  Building2,
  GitBranch,
  Store,
  UserCog,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  X
} from 'lucide-react';

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN:    { label: 'Super Admin',     color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  COMPANY_ADMIN:  { label: 'Company Admin',   color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  FRANCHISE_ADMIN:{ label: 'Franchise Admin', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  BRANCH_STAFF:   { label: 'Branch Staff',    color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
};

const ROLE_ICONS: Record<string, React.ElementType> = {
  SUPER_ADMIN:     ShieldCheck,
  COMPANY_ADMIN:   Building2,
  FRANCHISE_ADMIN: GitBranch,
  BRANCH_STAFF:    Store,
};

export default function UsersDirectory() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    email: '',
    name: '',
    password: '',
    role: 'BRANCH_STAFF',
    companyId: '',
    franchiseId: '',
    branchId: '',
  });

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
  });

  // Queries for organisation options (only fetch if modal is open)
  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['admin-companies'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/companies');
      return res.data;
    },
    enabled: isModalOpen && me?.role === 'SUPER_ADMIN',
  });

  const { data: franchises = [] } = useQuery<any[]>({
    queryKey: ['admin-franchises'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/franchises');
      return res.data;
    },
    enabled: isModalOpen && (me?.role === 'SUPER_ADMIN' || me?.role === 'COMPANY_ADMIN'),
  });

  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['admin-branches'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/branches');
      return res.data;
    },
    enabled: isModalOpen,
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(`/admin/users/${userId}/toggle-status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createUserMutation = useMutation({
    mutationFn: (dto: any) => apiClient.post('/admin/users', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsModalOpen(false);
      setErrorMsg('');
      setForm({
        email: '',
        name: '',
        password: '',
        role: 'BRANCH_STAFF',
        companyId: '',
        franchiseId: '',
        branchId: '',
      });
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to create user. Please try again.');
    }
  });

  const filtered = users.filter((u: any) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u: any) => u.isActive).length,
    inactive: users.filter((u: any) => !u.isActive).length,
    admins: users.filter((u: any) => u.role.includes('ADMIN')).length,
  };

  const allowedRoles = {
    SUPER_ADMIN: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'],
    COMPANY_ADMIN: ['COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'],
    FRANCHISE_ADMIN: ['BRANCH_STAFF'],
    BRANCH_STAFF: [],
  }[me?.role ?? 'BRANCH_STAFF'] || [];

  const handleRoleChange = (role: string) => {
    setForm(prev => ({
      ...prev,
      role,
      companyId: '',
      franchiseId: '',
      branchId: '',
    }));
  };

  const handleBranchChange = (branchId: string) => {
    const selectedBranch = branches.find(b => b.id === branchId);
    if (selectedBranch) {
      setForm(prev => ({
        ...prev,
        branchId,
        franchiseId: selectedBranch.franchiseId,
        companyId: selectedBranch.franchise?.companyId || prev.companyId,
      }));
    } else {
      setForm(prev => ({ ...prev, branchId: '' }));
    }
  };

  const handleFranchiseChange = (franchiseId: string) => {
    const selectedFranchise = franchises.find(f => f.id === franchiseId);
    if (selectedFranchise) {
      setForm(prev => ({
        ...prev,
        franchiseId,
        companyId: selectedFranchise.companyId || prev.companyId,
      }));
    } else {
      setForm(prev => ({ ...prev, franchiseId: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const payload: any = {
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
    };

    if (form.role === 'COMPANY_ADMIN') {
      payload.companyId = form.companyId || me?.companyId;
    } else if (form.role === 'FRANCHISE_ADMIN') {
      payload.companyId = form.companyId || me?.companyId;
      payload.franchiseId = form.franchiseId;
    } else if (form.role === 'BRANCH_STAFF') {
      payload.companyId = form.companyId || me?.companyId;
      payload.franchiseId = form.franchiseId;
      payload.branchId = form.branchId;
    }

    createUserMutation.mutate(payload);
  };

  return (
    <div className="space-y-8 animate-fade-in select-none relative">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
            Users Directory
          </h1>
          <p className="text-slate-400 text-sm">
            Manage platform users, view roles, and control account access.
          </p>
        </div>
        {allowedRoles.length > 0 && (
          <div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all cursor-pointer shadow-lg shadow-brand-500/20"
            >
              <Plus size={16} />
              Add User
            </button>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats.total, icon: Users, color: 'text-brand-400' },
          { label: 'Active',      value: stats.active,   icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Inactive',    value: stats.inactive, icon: XCircle,      color: 'text-rose-400' },
          { label: 'Admins',      value: stats.admins,   icon: UserCog,      color: 'text-violet-400' },
        ].map((s) => (
          <div
            key={s.label}
            className="glass-panel rounded-2xl border border-slate-800 p-5 flex items-center space-x-4"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
              <s.icon size={20} className={s.color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-4 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-850 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          {['ALL', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                roleFilter === r
                  ? 'bg-brand-500 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r === 'ALL' ? 'All' : r.replace('_', ' ').replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Users table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">User</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Organisation</th>
                <th className="py-4 px-6">Joined</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u: any) => {
                  const RoleIcon = ROLE_ICONS[u.role] || Users;
                  const roleStyle = ROLE_LABELS[u.role] || { label: u.role, color: '' };
                  const isSelf = u.id === me?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      {/* User cell */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-brand-400 flex-shrink-0 text-sm">
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">
                              {u.name}
                              {isSelf && (
                                <span className="ml-2 text-[9px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.5 rounded font-mono">
                                  you
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role cell */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${roleStyle.color}`}>
                          <RoleIcon size={10} />
                          {roleStyle.label}
                        </span>
                      </td>

                      {/* Org cell */}
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          {u.company && (
                            <p className="text-xs text-slate-300 font-medium">{u.company.name}</p>
                          )}
                          {u.franchise && (
                            <p className="text-[10px] text-slate-500">{u.franchise.name}</p>
                          )}
                          {u.branch && (
                            <p className="text-[10px] text-slate-600">{u.branch.name}</p>
                          )}
                          {!u.company && !u.franchise && !u.branch && (
                            <span className="text-[10px] text-slate-600 italic">Global</span>
                          )}
                        </div>
                      </td>

                      {/* Joined cell */}
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>

                      {/* Status cell */}
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          u.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {u.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Actions cell */}
                      <td className="py-4 px-6 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => toggleMutation.mutate(u.id)}
                            disabled={toggleMutation.isPending}
                            title={u.isActive ? 'Deactivate user' : 'Activate user'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 ${
                              u.isActive
                                ? 'bg-red-500/5 border-red-500/20 text-red-400 hover:bg-red-500/10'
                                : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.isActive
                              ? <><ShieldX size={12} /> Deactivate</>
                              : <><ShieldCheck size={12} /> Activate</>}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over or Popup Modal for adding user */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl overflow-hidden animate-scale-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="font-display font-semibold text-lg text-white">Create New User</h3>
              <button
                onClick={() => { setIsModalOpen(false); setErrorMsg(''); }}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs font-semibold text-rose-400 flex items-center gap-2">
                  <XCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    placeholder="Enter full name"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    placeholder="name@example.com"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    User Role <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                  >
                    {allowedRoles.map((r: string) => (
                      <option key={r} value={r} className="bg-slate-950 text-slate-100">
                        {ROLE_LABELS[r]?.label || r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional Organisation selectors based on role */}
                {form.role === 'COMPANY_ADMIN' && me?.role === 'SUPER_ADMIN' && (
                  <div className="col-span-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Assign Company <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.companyId}
                      onChange={(e) => setForm(prev => ({ ...prev, companyId: e.target.value }))}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                    >
                      <option value="">Select a company</option>
                      {companies.map((c: any) => (
                        <option key={c.id} value={c.id} className="bg-slate-950 text-slate-100">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.role === 'FRANCHISE_ADMIN' && (
                  <div className="col-span-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Assign Franchise <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.franchiseId}
                      onChange={(e) => handleFranchiseChange(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                    >
                      <option value="">Select a franchise</option>
                      {franchises.map((f: any) => (
                        <option key={f.id} value={f.id} className="bg-slate-950 text-slate-100">
                          {f.name} {f.company ? `(${f.company.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {form.role === 'BRANCH_STAFF' && (
                  <div className="col-span-2 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Assign Branch <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.branchId}
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-850 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer"
                    >
                      <option value="">Select a branch</option>
                      {branches.map((b: any) => (
                        <option key={b.id} value={b.id} className="bg-slate-950 text-slate-100">
                          {b.name} {b.franchise ? `(${b.franchise.name})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setErrorMsg(''); }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
