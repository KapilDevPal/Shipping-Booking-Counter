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

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (userId: string) =>
      apiClient.patch(`/admin/users/${userId}/toggle-status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
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

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Page header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
          Users Directory
        </h1>
        <p className="text-slate-400 text-sm">
          Manage platform users, view roles, and control account access.
        </p>
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
        <div className="flex items-center space-x-2">
          {['ALL', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
    </div>
  );
}
