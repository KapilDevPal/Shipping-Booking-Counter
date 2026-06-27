import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Package, 
  TrendingUp, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  IndianRupee
} from 'lucide-react';

const COLORS = ['#0b86fc', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function Dashboard() {
  const { user } = useAuthStore();

  // Fetch all shipments to compute stats dynamically
  const { data: shipments = [], isLoading: isShipmentsLoading } = useQuery<any[]>({
    queryKey: ['shipments'],
    queryFn: async () => {
      const res = await apiClient.get('/shipments');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Fetch real analytics from backend
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery<any>({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/analytics');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const isLoading = isShipmentsLoading || isAnalyticsLoading;

  // Calculate statistics
  const totalBooked = shipments.length;
  const activeCount = shipments.filter(s => ['BOOKED', 'LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY'].includes(s.status)).length;
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;

  const totalRevenue = analytics?.summary?.totalRevenue || 0;
  const chartData = analytics?.chartData || [];
  const carrierBreakdown = analytics?.carrierBreakdown || [];

  const scopeLabels: Record<string, string> = {
    SUPER_ADMIN:     'Viewing global logistics network analytics.',
    COMPANY_ADMIN:   'Viewing analytics and revenue for your company.',
    FRANCHISE_ADMIN: 'Viewing bookings and stats for your franchise.',
    BRANCH_STAFF:    'Viewing bookings and stats for your branch.',
  };
  const scopeLabel = scopeLabels[user?.role ?? ''] ?? 'Viewing your activity.';

  return (
    <div className="space-y-8 animate-fade-in select-none">
      {/* Top Banner Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
            Welcome back, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-slate-400 text-sm">
            {scopeLabel}
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Booked */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Booked</p>
            <h2 className="text-2xl font-extrabold text-white mt-1 leading-none">
              {isLoading ? '...' : totalBooked}
            </h2>
          </div>
        </div>

        {/* KPI 2: Total Revenue */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
            <IndianRupee size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <h2 className="text-2xl font-extrabold text-white mt-1 leading-none">
              ₹{isLoading ? '...' : totalRevenue.toLocaleString('en-IN')}
            </h2>
          </div>
        </div>

        {/* KPI 3: In Transit */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
            <Truck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">In Transit</p>
            <h2 className="text-2xl font-extrabold text-white mt-1 leading-none">
              {isLoading ? '...' : activeCount}
            </h2>
          </div>
        </div>

        {/* KPI 4: Delivered */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Delivered</p>
            <h2 className="text-2xl font-extrabold text-white mt-1 leading-none">
              {isLoading ? '...' : deliveredCount}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Volume Trend Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-white">Booking Volume Trends</h3>
              <p className="text-xs text-slate-500">Daily package metrics aggregated dynamically (last 30 days)</p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-brand-400 font-semibold bg-brand-500/10 px-2 py-1 rounded-lg border border-brand-500/10">
              <TrendingUp size={14} />
              <span>Real-time</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0b86fc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0b86fc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="bookings" stroke="#0b86fc" strokeWidth={2} fillOpacity={1} fill="url(#colorBookings)" name="Bookings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg text-white">Revenue Trends</h3>
              <p className="text-xs text-slate-500">Daily revenue collections (last 30 days)</p>
            </div>
            <div className="flex items-center space-x-1 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10">
              <IndianRupee size={14} />
              <span>INR</span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Middle row: Carrier Breakdown + Terminal Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carrier Breakdown Chart */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="font-display font-semibold text-lg text-white">Carrier Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Market share between FlightGo and MyDHL Express</p>
          </div>
          <div className="h-48 w-full flex items-center justify-center relative">
            {carrierBreakdown.length === 0 ? (
              <p className="text-slate-500 text-sm">No carrier data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={carrierBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {carrierBreakdown.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs mt-2">
            {carrierBreakdown.map((entry: any, index: number) => (
              <div key={entry.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                <span className="text-slate-300">{entry.name} ({entry.count})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box Column */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 flex flex-col lg:col-span-2">
          <h3 className="font-display font-semibold text-lg text-white mb-4">Terminal Operations Status</h3>
          <div className="space-y-4 flex-1">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-start space-x-3">
              <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Database Core Sync</p>
                <p className="text-[10px] text-slate-400 mt-1">Prisma postgres v3 linked with local engine online.</p>
              </div>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-start space-x-3">
              <CheckCircle size={18} className="text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">FlightGo & DHL API Endpoints</p>
                <p className="text-[10px] text-slate-400 mt-1">Secured handshake successfully established with both logistics partners.</p>
              </div>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 flex items-start space-x-3">
              <AlertCircle size={18} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-white">Dispatch Queue</p>
                <p className="text-[10px] text-slate-400 mt-1">All cargo pending dispatch will clear at 18:00 IST.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Shipments Table Summary */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-800">
          <h3 className="font-display font-semibold text-lg text-white">Recent Cargo Shipments</h3>
          <p className="text-xs text-slate-500">Live feed of Booked & In-transit airwaybills</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 px-6">AWB Number</th>
                <th className="py-4 px-6">Destination</th>
                <th className="py-4 px-6">Carrier</th>
                <th className="py-4 px-6">Weight</th>
                <th className="py-4 px-6">Total Amount</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Date Booked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Loading shipments data...
                  </td>
                </tr>
              ) : shipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No shipments booked yet. Use "New Booking" to get started.
                  </td>
                </tr>
              ) : (
                shipments.slice(0, 5).map((s: any) => {
                  const selectedRate = s.rates?.find((r: any) => r.isSelected);
                  const carrierName = selectedRate?.partner?.name || 'N/A';
                  const amount = selectedRate?.totalAmount || 0;
                  return (
                    <tr key={s.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs font-semibold text-white">{s.awbNo || 'DRAFT'}</td>
                      <td className="py-4 px-6 text-slate-300">{s.toCountry} ({s.toCity || s.toZipcodeId || 'N/A'})</td>
                      <td className="py-4 px-6 text-slate-300">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          carrierName.toLowerCase().includes('dhl') 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : 'bg-blue-500/10 text-brand-400 border border-brand-500/20'
                        }`}>
                          {carrierName}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-300">{s.weight} kg</td>
                      <td className="py-4 px-6 text-white font-semibold">₹{amount.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          s.status === 'DELIVERED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : s.status === 'BOOKED'
                            ? 'bg-blue-500/10 text-brand-400 border border-brand-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs">
                        {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
