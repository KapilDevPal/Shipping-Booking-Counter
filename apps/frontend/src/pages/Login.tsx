import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';
import { Ship, Lock, Mail, AlertCircle, ArrowRight, Sun, Moon, ChevronLeft } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;
      
      setAuth(user, accessToken, refreshToken);
      
      // Role-based navigation redirect
      if (user.role === 'BRANCH_STAFF') {
        navigate('/bookings/new');
      } else {
        navigate('/dashboard');
      }
    } catch (e: any) {
      setErrorMsg(
        e.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 md:p-6 select-none relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -top-12 -left-12 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -bottom-12 -right-12 pointer-events-none" />

      {/* Top nav overlay */}
      <div className="fixed top-4 right-4 flex items-center gap-2 z-50">
        <button
          onClick={() => setIsLight(!isLight)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          aria-label="Toggle theme"
        >
          {isLight ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
      <div className="fixed top-4 left-4 z-50">
        <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={16} /> Back to home
        </Link>
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative z-10 border border-slate-800/80">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/20 mb-4 animate-float">
            <Ship size={32} />
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
            FlightGo Express
          </h1>
          <p className="text-sm text-slate-400">
            Logistics & Shipment Management System
          </p>
        </div>

        {/* Dynamic Credentials Alert banner */}
        {errorMsg && (
          <div className="flex items-center space-x-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-sm animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email input field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type="email"
                placeholder="email@flightgo.com"
                className={`w-full bg-slate-950/60 border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.email
                    ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50'
                    : 'border-slate-800 focus:ring-brand-500/30 focus:border-brand-500/50'
                }`}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="text-xs text-red-400 block font-medium">
                {errors.email.message}
              </span>
            )}
          </div>

          {/* Password input field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-3.5 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full bg-slate-950/60 border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  errors.password
                    ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50'
                    : 'border-slate-800 focus:ring-brand-500/30 focus:border-brand-500/50'
                }`}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="text-xs text-red-400 block font-medium">
                {errors.password.message}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full glass-button-primary mt-3 flex items-center justify-center"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight size={16} className="ml-2" />
              </>
            )}
          </button>
        </form>

        {/* Demo Credentials Helper Card */}
        <div className="mt-8 pt-6 border-t border-slate-850">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
            Demo Accounts for Testing
          </p>
          <div className="grid grid-cols-2 gap-2.5 text-[11px] text-slate-400">
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/60">
              <p className="font-semibold text-brand-400">Counter Staff</p>
              <p className="truncate">branchstaff@flightgo.com</p>
              <p className="font-mono text-slate-500">counter123</p>
            </div>
            <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-850/60">
              <p className="font-semibold text-violet-400">Super Admin</p>
              <p className="truncate">superadmin@flightgo.com</p>
              <p className="font-mono text-slate-500">admin123</p>
            </div>
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            New here?{' '}
            <Link to="/signup" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Create a company account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
