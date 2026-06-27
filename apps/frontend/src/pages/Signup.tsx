import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/axios';
import {
  Ship, Lock, Mail, User, Building2, AlertCircle, ArrowRight, Sun, Moon, ChevronLeft,
} from 'lucide-react';

const schema = z.object({
  name:        z.string().min(2, 'Full name must be at least 2 characters'),
  email:       z.email('Enter a valid email address'),
  password:    z.string().min(6, 'Password must be at least 6 characters'),
  confirm:     z.string(),
  companyName: z.string().min(2, 'Company name is required'),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
});

type FormData = z.infer<typeof schema>;

export default function Signup() {
  const { setAuth } = useAuthStore();
  const navigate    = useNavigate();
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.post('/auth/register', {
        name:        data.name,
        email:       data.email,
        password:    data.password,
        companyName: data.companyName,
      });
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError?: boolean) =>
    `w-full bg-slate-950/60 border rounded-xl pl-12 pr-4 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 transition-all duration-200 ${
      hasError
        ? 'border-red-500/50 focus:ring-red-500/20 focus:border-red-500/50'
        : 'border-slate-800 focus:ring-brand-500/30 focus:border-brand-500/50'
    }`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Decorative */}
      <div className="absolute w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -top-12 -left-12 pointer-events-none" />
      <div className="absolute w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -bottom-12 -right-12 pointer-events-none" />

      {/* Theme + back nav */}
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
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} /> Back to home
        </Link>
      </div>

      <div className="w-full max-w-md glass-panel rounded-3xl p-8 relative z-10 border border-slate-800/80">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-500/20 mb-4 animate-float">
            <Ship size={32} />
          </div>
          <h1 className="font-display font-bold text-3xl text-white tracking-tight leading-none mb-2">
            Create Account
          </h1>
          <p className="text-sm text-slate-400">
            Set up your FlightGo Express company account
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6 text-red-400 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input type="text" placeholder="Jane Doe" className={inputCls(!!errors.name)} {...register('name')} />
            </div>
            {errors.name && <span className="text-xs text-red-400 font-medium">{errors.name.message}</span>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input type="email" placeholder="jane@company.com" className={inputCls(!!errors.email)} {...register('email')} />
            </div>
            {errors.email && <span className="text-xs text-red-400 font-medium">{errors.email.message}</span>}
          </div>

          {/* Company Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Company Name</label>
            <div className="relative">
              <Building2 size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input type="text" placeholder="Acme Shipping Pvt Ltd" className={inputCls(!!errors.companyName)} {...register('companyName')} />
            </div>
            {errors.companyName && <span className="text-xs text-red-400 font-medium">{errors.companyName.message}</span>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input type="password" placeholder="Min. 6 characters" className={inputCls(!!errors.password)} {...register('password')} />
            </div>
            {errors.password && <span className="text-xs text-red-400 font-medium">{errors.password.message}</span>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-3.5 text-slate-500" />
              <input type="password" placeholder="Repeat password" className={inputCls(!!errors.confirm)} {...register('confirm')} />
            </div>
            {errors.confirm && <span className="text-xs text-red-400 font-medium">{errors.confirm.message}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button-primary mt-2 flex items-center justify-center"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight size={16} className="ml-2" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
            Sign in
          </Link>
        </p>

        {/* Info note */}
        <div className="mt-6 pt-6 border-t border-slate-850 text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            Registering creates a <span className="text-slate-500">Company Admin</span> account.<br />
            Add franchises, branches and staff from the Admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}
