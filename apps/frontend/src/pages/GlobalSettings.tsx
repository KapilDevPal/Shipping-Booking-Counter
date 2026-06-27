import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import { useAuthStore } from '../store/authStore';
import {
  Settings,
  Wallet,
  Building2,
  GitBranch,
  Store,
  Users,
  Package,
  TrendingUp,
  Plus,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';

export default function GlobalSettings() {
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNote, setRechargeNote]   = useState('');
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [rechargeSuccess, setRechargeSuccess] = useState<string | null>(null);

  // Fetch global stats
  const { data: stats } = useQuery<any>({
    queryKey: ['admin-stats'],
    queryFn: async () => (await apiClient.get('/admin/stats')).data,
  });

  // Fetch companies
  const { data: companies = [], isLoading: loadingCompanies } = useQuery<any[]>({
    queryKey: ['admin-companies'],
    queryFn: async () => (await apiClient.get('/admin/companies')).data,
  });

  // Fetch franchises
  const { data: franchises = [] } = useQuery<any[]>({
    queryKey: ['admin-franchises'],
    queryFn: async () => (await apiClient.get('/admin/franchises')).data,
  });

  // Fetch branches
  const { data: branches = [] } = useQuery<any[]>({
    queryKey: ['admin-branches'],
    queryFn: async () => (await apiClient.get('/admin/branches')).data,
  });

  // Wallet recharge mutation
  const rechargeMutation = useMutation({
    mutationFn: (payload: { companyId: string; amount: number; note?: string }) =>
      apiClient.post('/admin/wallet/recharge', payload),
    onSuccess: (res) => {
      const data = res.data;
      setRechargeSuccess(
        `✓ Recharged ₹${data.recharged?.toLocaleString('en-IN')} — New balance: ₹${data.newBalance?.toLocaleString('en-IN')}`
      );
      setRechargeAmount('');
      setRechargeNote('');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setTimeout(() => setRechargeSuccess(null), 4000);
    },
  });

  const handleRecharge = () => {
    if (!selectedCompany || !rechargeAmount || isNaN(Number(rechargeAmount))) return;
    rechargeMutation.mutate({
      companyId: selectedCompany.id,
      amount: parseFloat(rechargeAmount),
      note: rechargeNote || undefined,
    });
  };

  const statItems = [
    { label: 'Total Users',        value: stats?.users ?? '—',                    icon: Users,        color: 'text-sky-400' },
    { label: 'Companies',          value: stats?.companies ?? '—',                icon: Building2,    color: 'text-violet-400' },
    { label: 'Franchises',         value: stats?.franchises ?? '—',               icon: GitBranch,    color: 'text-amber-400' },
    { label: 'Branches',           value: stats?.branches ?? '—',                 icon: Store,        color: 'text-emerald-400' },
    { label: 'Total Shipments',    value: stats?.shipments ?? '—',                icon: Package,      color: 'text-brand-400' },
    { label: 'Total Wallet (INR)', value: stats?.totalWalletBalance != null
        ? `₹${Number(stats.totalWalletBalance).toLocaleString('en-IN')}` : '—',  icon: TrendingUp,   color: 'text-emerald-300' },
  ];

  return (
    <div className="space-y-10 animate-fade-in select-none">
      {/* Page header */}
      <div>
        <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
          Global Settings
        </h1>
        <p className="text-slate-400 text-sm">
          Platform overview, wallet management, and operational hierarchy.
        </p>
      </div>

      {/* Platform Stats */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Settings size={14} /> Platform Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statItems.map((s) => (
            <div
              key={s.label}
              className="glass-panel rounded-2xl border border-slate-800 p-5 flex items-center space-x-4"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center flex-shrink-0">
                <s.icon size={20} className={s.color} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{s.value}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Wallet Recharge Panel */}
      {(me?.role === 'SUPER_ADMIN' || me?.role === 'COMPANY_ADMIN') && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Wallet size={14} /> Wallet Recharge
          </h2>
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-5">
            <p className="text-slate-400 text-sm">
              Select a company and enter the amount to top-up their operational wallet balance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Company selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Company
                </label>
                <select
                  value={selectedCompany?.id || ''}
                  onChange={(e) =>
                    setSelectedCompany(companies.find((c) => c.id === e.target.value) || null)
                  }
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                >
                  <option value="">— Choose company —</option>
                  {companies.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · ₹{(c.wallets?.[0]?.balance ?? 0).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Amount (INR)
                </label>
                <div className="relative">
                  <IndianRupee size={14} className="absolute left-4 top-3 text-slate-500" />
                  <input
                    type="number"
                    min={1}
                    placeholder="0.00"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Note (optional)
                </label>
                <input
                  type="text"
                  placeholder="Recharge reference..."
                  value={rechargeNote}
                  onChange={(e) => setRechargeNote(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>
            </div>

            {/* Quick-amount chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-600 mr-1">Quick add:</span>
              {[5000, 10000, 25000, 50000, 100000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setRechargeAmount(String(amt))}
                  className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-brand-400 hover:border-brand-500/30 transition-all cursor-pointer"
                >
                  ₹{amt.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Submit */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRecharge}
                disabled={!selectedCompany || !rechargeAmount || rechargeMutation.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Plus size={16} />
                {rechargeMutation.isPending ? 'Processing…' : 'Recharge Wallet'}
              </button>

              {rechargeSuccess && (
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold animate-fade-in">
                  <CheckCircle2 size={16} />
                  {rechargeSuccess}
                </div>
              )}

              {rechargeMutation.isError && (
                <p className="text-red-400 text-sm">
                  {(rechargeMutation.error as any)?.response?.data?.message || 'Recharge failed.'}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Companies Table */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Building2 size={14} /> Companies & Wallets
        </h2>
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">Company</th>
                <th className="py-4 px-6">Code</th>
                <th className="py-4 px-6">Franchises</th>
                <th className="py-4 px-6">Wallet Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {loadingCompanies ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">Loading…</td></tr>
              ) : companies.length === 0 ? (
                <tr><td colSpan={4} className="py-10 text-center text-slate-500">No companies.</td></tr>
              ) : (
                companies.map((c: any) => (
                  <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{c.email}</p>
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">{c.code}</td>
                    <td className="py-4 px-6 text-slate-300">{c._count?.franchises ?? 0}</td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                        <IndianRupee size={13} />
                        {(c.wallets?.[0]?.balance ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Franchises Table */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <GitBranch size={14} /> Franchise Network
        </h2>
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">Franchise</th>
                <th className="py-4 px-6">Company</th>
                <th className="py-4 px-6">Branches</th>
                <th className="py-4 px-6">Staff</th>
                <th className="py-4 px-6">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {franchises.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No franchises.</td></tr>
              ) : (
                franchises.map((f: any) => (
                  <tr key={f.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{f.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">{f.code}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300 text-xs">{f.company?.name}</td>
                    <td className="py-4 px-6 text-slate-300">{f._count?.branches ?? 0}</td>
                    <td className="py-4 px-6 text-slate-300">{f._count?.users ?? 0}</td>
                    <td className="py-4 px-6 text-slate-500 text-xs">{f.phone}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Branches Table */}
      <section>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Store size={14} /> Branch Locations
        </h2>
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">Branch</th>
                <th className="py-4 px-6">Franchise</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Staff</th>
                <th className="py-4 px-6">Shipments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {branches.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-slate-500">No branches.</td></tr>
              ) : (
                branches.map((b: any) => (
                  <tr key={b.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="font-mono text-[10px] text-slate-500">{b.code}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300 text-xs">{b.franchise?.name}</td>
                    <td className="py-4 px-6 text-xs">
                      <p className="text-slate-300">{b.city}, {b.state}</p>
                      <p className="text-slate-600">{b.pincode}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-300">{b._count?.users ?? 0}</td>
                    <td className="py-4 px-6">
                      <span className="text-brand-400 font-semibold">{b._count?.shipments ?? 0}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
