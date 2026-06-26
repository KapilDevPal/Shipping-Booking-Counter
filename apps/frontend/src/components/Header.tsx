import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';
import { Wallet, Bell, MapPin, Sun, Moon } from 'lucide-react';

export default function Header() {
  const { user } = useAuthStore();
  const [isLight, setIsLight] = useState(() => localStorage.getItem('theme') === 'light');

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  // Fetch Wallet Balance dynamically
  const { data: wallet } = useQuery({
    queryKey: ['walletBalance'],
    queryFn: async () => {
      const res = await apiClient.get('/shipments/wallet');
      return res.data;
    },
    refetchInterval: 15000, // Auto refresh every 15s to capture bookings
    enabled: !!user,
  });

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 shrink-0 z-10">
      {/* Search / Location Status */}
      <div className="flex items-center space-x-2 text-slate-400">
        <MapPin size={16} className="text-brand-500" />
        <span className="text-xs font-medium">
          {user?.branchId ? 'Panaji Central Terminal' : 'Global Network HQ'}
        </span>
      </div>

      {/* Stats and Profile Action buttons */}
      <div className="flex items-center space-x-6">
        {/* Wallet Balance Display */}
        {wallet && (
          <div className="flex items-center space-x-2.5 bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-1.5 shadow-inner">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Wallet size={13} className="text-emerald-400" />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-none">
                Wallet Balance
              </p>
              <p className="text-sm font-bold text-emerald-400 leading-tight">
                ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setIsLight(!isLight)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer"
            aria-label="Toggle theme"
          >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all duration-200 cursor-pointer">
            <Bell size={18} />
          </button>
        </div>

        {/* Small info pill */}
        <div className="h-8 w-px bg-slate-800" />

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-white leading-none">{user?.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
