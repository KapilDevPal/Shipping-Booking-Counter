import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import {
  GitBranch,
  Store,
  Plus,
  X,
  Building2,
  Users,
  Package,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Search,
} from 'lucide-react';

type Tab = 'franchises' | 'branches';

const inputCls =
  'w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30';
const labelCls = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

export default function FranchiseManagement() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab]                         = useState<Tab>('franchises');
  const [search, setSearch]                   = useState('');
  const [showFranchiseForm, setShowFranchise] = useState(false);
  const [showBranchForm, setShowBranch]       = useState(false);
  const [formError, setFormError]             = useState<string | null>(null);
  const [successMsg, setSuccessMsg]           = useState<string | null>(null);

  // Franchise form state
  const [fForm, setFForm] = useState({
    companyId: '', code: '', name: '', address: '', phone: '', email: '',
  });

  // Branch form state
  const [bForm, setBForm] = useState({
    franchiseId: '', code: '', name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '',
  });

  const canCreate = me?.role === 'SUPER_ADMIN' || me?.role === 'COMPANY_ADMIN' || me?.role === 'FRANCHISE_ADMIN';

  // Queries
  const { data: franchises = [], isLoading: loadingF } = useQuery<any[]>({
    queryKey: ['admin-franchises'],
    queryFn: async () => (await apiClient.get('/admin/franchises')).data,
  });

  const { data: branches = [], isLoading: loadingB } = useQuery<any[]>({
    queryKey: ['admin-branches'],
    queryFn: async () => (await apiClient.get('/admin/branches')).data,
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ['admin-companies'],
    queryFn: async () => (await apiClient.get('/admin/companies')).data,
    enabled: me?.role === 'SUPER_ADMIN',
  });

  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Create franchise mutation
  const createFranchise = useMutation({
    mutationFn: (data: typeof fForm) => apiClient.post('/admin/franchises', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-franchises'] });
      flash(`Franchise "${res.data.name}" created successfully`);
      setShowFranchise(false);
      setFForm({ companyId: '', code: '', name: '', address: '', phone: '', email: '' });
      setFormError(null);
    },
    onError: (e: any) => setFormError(e?.response?.data?.message || 'Failed to create franchise'),
  });

  // Create branch mutation
  const createBranch = useMutation({
    mutationFn: (data: typeof bForm) => apiClient.post('/admin/branches', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
      flash(`Branch "${res.data.name}" created successfully`);
      setShowBranch(false);
      setBForm({ franchiseId: '', code: '', name: '', address: '', city: '', state: '', pincode: '', phone: '', email: '' });
      setFormError(null);
    },
    onError: (e: any) => setFormError(e?.response?.data?.message || 'Failed to create branch'),
  });

  const filteredFranchises = franchises.filter(
    (f: any) =>
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const filteredBranches = branches.filter(
    (b: any) =>
      b.name?.toLowerCase().includes(search.toLowerCase()) ||
      b.code?.toLowerCase().includes(search.toLowerCase()) ||
      b.city?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
            Franchise Management
          </h1>
          <p className="text-slate-400 text-sm">
            Manage the franchise network and branch locations across the platform.
          </p>
        </div>

        {canCreate && (
          <div className="flex gap-3">
            {(me?.role === 'SUPER_ADMIN' || me?.role === 'COMPANY_ADMIN') && (
              <button
                onClick={() => { setShowFranchise(true); setFormError(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 transition-all cursor-pointer"
              >
                <Plus size={16} /> New Franchise
              </button>
            )}
            <button
              onClick={() => { setShowBranch(true); setFormError(null); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-bold transition-all cursor-pointer"
            >
              <Store size={16} /> New Branch
            </button>
          </div>
        )}
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl px-4 py-3 text-sm font-semibold animate-fade-in">
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <GitBranch size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{franchises.length}</p>
            <p className="text-xs text-slate-500">Total Franchises</p>
          </div>
        </div>
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Store size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{branches.length}</p>
            <p className="text-xs text-slate-500">Total Branches</p>
          </div>
        </div>
      </div>

      {/* Tab switcher + search */}
      <div className="flex items-center gap-4">
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['franchises', 'branches'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSearch(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                tab === t
                  ? 'bg-brand-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'franchises' ? (
                <span className="flex items-center gap-2"><GitBranch size={14} /> Franchises</span>
              ) : (
                <span className="flex items-center gap-2"><Store size={14} /> Branches</span>
              )}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </div>

      {/* ── FRANCHISES TAB ── */}
      {tab === 'franchises' && (
        <div className="space-y-4">
          {loadingF ? (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
              Loading franchises…
            </div>
          ) : filteredFranchises.length === 0 ? (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-slate-500">
              No franchises found. {canCreate && 'Create one using "New Franchise" above.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFranchises.map((f: any) => (
                <div
                  key={f.id}
                  className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4 hover:border-slate-700 transition-colors"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <GitBranch size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-white">{f.name}</p>
                        <p className="font-mono text-[10px] text-slate-500 mt-0.5">{f.code}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-lg font-mono">
                      {f.company?.code}
                    </span>
                  </div>

                  {/* Company */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 size={12} className="text-slate-600" />
                    {f.company?.name}
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {f.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone size={11} /> {f.phone}
                      </div>
                    )}
                    {f.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Mail size={11} /> {f.email}
                      </div>
                    )}
                    {f.address && (
                      <div className="col-span-2 flex items-start gap-1.5 text-slate-500">
                        <MapPin size={11} className="mt-0.5 flex-shrink-0" /> {f.address}
                      </div>
                    )}
                  </div>

                  {/* Counters */}
                  <div className="flex items-center gap-4 pt-1 border-t border-slate-850">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Store size={12} className="text-slate-600" />
                      <span>{f._count?.branches ?? 0} branches</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Users size={12} className="text-slate-600" />
                      <span>{f._count?.users ?? 0} staff</span>
                    </div>
                    <button
                      onClick={() => { setTab('branches'); setSearch(f.name); }}
                      className="ml-auto flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
                    >
                      View branches <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── BRANCHES TAB ── */}
      {tab === 'branches' && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">Branch</th>
                <th className="py-4 px-6">Franchise</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Staff</th>
                <th className="py-4 px-6">Shipments</th>
                <th className="py-4 px-6">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {loadingB ? (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500">Loading…</td></tr>
              ) : filteredBranches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No branches found. {canCreate && 'Create one using "New Branch" above.'}
                  </td>
                </tr>
              ) : (
                filteredBranches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                          <Store size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{b.name}</p>
                          <p className="font-mono text-[10px] text-slate-500">{b.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-slate-300 text-xs">{b.franchise?.name}</p>
                      <p className="text-slate-600 text-[10px]">{b.franchise?.company?.name}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-1.5 text-xs text-slate-400">
                        <MapPin size={12} className="mt-0.5 text-slate-600 flex-shrink-0" />
                        <div>
                          <p>{b.city}{b.state ? `, ${b.state}` : ''}</p>
                          {b.pincode && <p className="text-slate-600">{b.pincode}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <Users size={12} className="text-slate-600" />
                        {b._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-brand-400 font-semibold">
                        <Package size={12} className="text-slate-600" />
                        {b._count?.shipments ?? 0}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500 text-xs">
                      {b.phone && <div className="flex items-center gap-1"><Phone size={10} /> {b.phone}</div>}
                      {b.email && <div className="flex items-center gap-1 mt-0.5 truncate max-w-[160px]"><Mail size={10} /> {b.email}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CREATE FRANCHISE MODAL ── */}
      {showFranchiseForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowFranchise(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="font-display font-bold text-2xl text-white">Create Franchise</h2>
              <p className="text-slate-400 text-sm mt-1">Set up a new franchise under a company.</p>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              {/* Company selector (super admin only) */}
              {me?.role === 'SUPER_ADMIN' ? (
                <div>
                  <label className={labelCls}>Company *</label>
                  <select
                    value={fForm.companyId}
                    onChange={(e) => setFForm({ ...fForm, companyId: e.target.value })}
                    className={inputCls}
                  >
                    <option value="">— Select Company —</option>
                    {companies.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                // Company Admin — auto-use own company
                <input type="hidden" value={me?.companyId || ''} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Code *</label>
                  <input
                    type="text"
                    placeholder="FR2"
                    value={fForm.code}
                    onChange={(e) => setFForm({ ...fForm, code: e.target.value.toUpperCase() })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input
                    type="text"
                    placeholder="Mumbai North Franchise"
                    value={fForm.name}
                    onChange={(e) => setFForm({ ...fForm, name: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>Address</label>
                <input
                  type="text"
                  placeholder="Street address…"
                  value={fForm.address}
                  onChange={(e) => setFForm({ ...fForm, address: e.target.value })}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" placeholder="+91..." value={fForm.phone} onChange={(e) => setFForm({ ...fForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" placeholder="franchise@..." value={fForm.email} onChange={(e) => setFForm({ ...fForm, email: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const payload = me?.role === 'COMPANY_ADMIN'
                    ? { ...fForm, companyId: me.companyId || '' }
                    : fForm;
                  createFranchise.mutate(payload);
                }}
                disabled={createFranchise.isPending || !fForm.code || !fForm.name || (!fForm.companyId && me?.role === 'SUPER_ADMIN')}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                <Plus size={16} />
                {createFranchise.isPending ? 'Creating…' : 'Create Franchise'}
              </button>
              <button
                onClick={() => setShowFranchise(false)}
                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE BRANCH MODAL ── */}
      {showBranchForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 w-full max-w-lg space-y-6 shadow-2xl relative overflow-y-auto max-h-[95vh]">
            <button
              onClick={() => setShowBranch(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="font-display font-bold text-2xl text-white">Create Branch</h2>
              <p className="text-slate-400 text-sm mt-1">Add a new branch under a franchise.</p>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
                {formError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className={labelCls}>Franchise *</label>
                <select
                  value={bForm.franchiseId}
                  onChange={(e) => setBForm({ ...bForm, franchiseId: e.target.value })}
                  className={inputCls}
                >
                  <option value="">— Select Franchise —</option>
                  {franchises.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Code *</label>
                  <input type="text" placeholder="BR2" value={bForm.code} onChange={(e) => setBForm({ ...bForm, code: e.target.value.toUpperCase() })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Name *</label>
                  <input type="text" placeholder="Vashi Counter" value={bForm.name} onChange={(e) => setBForm({ ...bForm, name: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Address</label>
                <input type="text" placeholder="Street address…" value={bForm.address} onChange={(e) => setBForm({ ...bForm, address: e.target.value })} className={inputCls} />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" placeholder="Mumbai" value={bForm.city} onChange={(e) => setBForm({ ...bForm, city: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" placeholder="Maharashtra" value={bForm.state} onChange={(e) => setBForm({ ...bForm, state: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input type="text" placeholder="400703" value={bForm.pincode} onChange={(e) => setBForm({ ...bForm, pincode: e.target.value })} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="tel" placeholder="+91..." value={bForm.phone} onChange={(e) => setBForm({ ...bForm, phone: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" placeholder="branch@..." value={bForm.email} onChange={(e) => setBForm({ ...bForm, email: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => createBranch.mutate(bForm)}
                disabled={createBranch.isPending || !bForm.franchiseId || !bForm.code || !bForm.name}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-all disabled:opacity-40 cursor-pointer"
              >
                <Store size={16} />
                {createBranch.isPending ? 'Creating…' : 'Create Branch'}
              </button>
              <button
                onClick={() => setShowBranch(false)}
                className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
