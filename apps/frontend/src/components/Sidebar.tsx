import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  LogOut, 
  Ship, 
  Users, 
  GitBranch,
  Settings
} from 'lucide-react';

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      console.warn('Logout request failed, cleaning local session:', e);
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'],
    },
    {
      to: '/bookings/new',
      label: 'New Booking',
      icon: PlusCircle,
      roles: ['BRANCH_STAFF', 'SUPER_ADMIN'],
    },
    {
      to: '/shipments',
      label: 'Shipments',
      icon: FileText,
      roles: ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FRANCHISE_ADMIN', 'BRANCH_STAFF'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Brand logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-3">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <Ship size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          FlightGo
        </span>
        <span className="text-[10px] bg-slate-800 text-brand-400 px-1.5 py-0.5 rounded font-mono font-medium">
          v1.0
        </span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`
            }
          >
            <item.icon className="mr-3 h-5 w-5 shrink-0 group-hover:scale-105 transition-transform" />
            {item.label}
          </NavLink>
        ))}

        {/* Admin section — visible to admins */}
        {(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN' || user?.role === 'FRANCHISE_ADMIN') && (
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1.5">
            <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Administration
            </p>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`
              }
            >
              <Users className="mr-3 h-5 w-5 shrink-0" />
              Users Directory
            </NavLink>
            <NavLink
              to="/admin/franchises"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`
              }
            >
              <GitBranch className="mr-3 h-5 w-5 shrink-0" />
              Franchise Network
            </NavLink>
            {(user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_ADMIN') && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`
              }
            >
              <Settings className="mr-3 h-5 w-5 shrink-0" />
              Global Settings
            </NavLink>
            )}
          </div>
        )}
      </nav>

      {/* User profile footer info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/20">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-brand-400 border border-slate-700">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2.5 rounded-xl border border-slate-850 hover:border-red-500/30 text-slate-400 hover:text-red-400 hover:bg-red-500/5 text-sm font-medium transition-all duration-200 cursor-pointer"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
