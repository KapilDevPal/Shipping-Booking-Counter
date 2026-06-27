import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Ship,
  Globe,
  Package,
  Zap,
  ShieldCheck,
  BarChart3,
  ArrowRight,
  Sun,
  Moon,
  Truck,
  Star,
} from 'lucide-react';

export default function LandingPage() {
  const [isLight, setIsLight] = useState(
    () => localStorage.getItem('theme') === 'light',
  );

  useEffect(() => {
    if (isLight) {
      document.body.classList.add('light');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light');
      localStorage.setItem('theme', 'dark');
    }
  }, [isLight]);

  const features = [
    {
      icon: Globe,
      title: 'Global Carrier Network',
      desc: 'Access live rates from FlightGo Express, DHL, FedEx, Aramex and more — all in one place.',
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
    },
    {
      icon: Zap,
      title: 'Instant Rate Comparison',
      desc: 'Real-time freight quotes with transit days, surcharges, and best-price highlights.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Booking & AWB',
      desc: 'One-click shipment booking with auto-generated Air Waybill PDF labels.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: BarChart3,
      title: 'Hierarchy Management',
      desc: 'Multi-level organisation: Companies → Franchises → Branches → Staff, all role-scoped.',
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      icon: Package,
      title: 'Shipment Tracking',
      desc: 'Live status updates across your network with detailed transit timeline views.',
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      icon: Truck,
      title: 'Wallet & Credit System',
      desc: 'Prepaid wallet system with instant deduction on booking and recharge by Super Admin.',
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  const stats = [
    { value: '50+', label: 'Global Destinations' },
    { value: '4', label: 'Carrier Partners' },
    { value: '99.8%', label: 'Uptime SLA' },
    { value: '< 2s', label: 'Rate Response Time' },
  ];

  const roles = [
    { role: 'Branch Staff', icon: '🏪', desc: 'Book shipments, compare rates, download AWB labels.' },
    { role: 'Franchise Admin', icon: '🏢', desc: 'Manage branches and staff within your franchise network.' },
    { role: 'Company Admin', icon: '🏛️', desc: 'Oversee all franchises, wallet, and company operations.' },
    { role: 'Super Admin', icon: '⚡', desc: 'Full platform control — all companies, wallets, and users.' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* ── Navbar ────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Ship size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-xl text-white tracking-tight">
            FlightGo<span className="text-brand-400"> Express</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => setIsLight(!isLight)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle theme"
          >
            {isLight ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Link
            to="/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl transition-all"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 rounded-xl shadow-lg shadow-brand-500/20 transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-16 overflow-hidden">
        {/* Decorative gradients */}
        <div className="absolute w-[600px] h-[600px] bg-brand-500/8 rounded-full blur-3xl -top-32 left-1/2 -translate-x-1/2 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-indigo-500/8 rounded-full blur-3xl bottom-0 -left-32 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-violet-500/8 rounded-full blur-3xl -bottom-16 -right-16 pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-8 animate-fade-in">
          <Star size={12} className="fill-brand-400" />
          Multi-Carrier Freight Management Platform
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-5xl md:text-7xl text-white tracking-tight leading-none mb-6 max-w-4xl">
          Ship Anywhere.{' '}
          <span className="bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            Manage Everything.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
          FlightGo Express is a complete logistics management platform for freight companies —
          compare live carrier rates, book shipments instantly, manage your franchise network,
          and track every parcel in real-time.
        </p>

        {/* CTA row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            to="/signup"
            className="flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base rounded-2xl shadow-2xl shadow-brand-500/25 transition-all hover:scale-105 active:scale-95"
          >
            Start Shipping Today <ArrowRight size={18} />
          </Link>
          <Link
            to="/login"
            className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-base rounded-2xl transition-all"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Floating stat pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl px-4 py-5 text-center"
            >
              <p className="font-display font-extrabold text-3xl text-white">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ─────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand-400 text-xs font-bold uppercase tracking-widest mb-3">
              Built for Freight Teams
            </p>
            <h2 className="font-display font-extrabold text-4xl md:text-5xl text-white tracking-tight mb-4">
              Everything you need to ship smarter
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              One platform for your entire logistics operation — from a single branch to a national franchise network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-4 ${f.bg}`}>
                  <f.icon size={22} className={f.color} />
                </div>
                <h3 className="font-display font-bold text-white text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────── */}
      <section className="py-24 px-6 md:px-12 bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-4xl text-white tracking-tight mb-4">
              From booking to delivery in minutes
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: Package, title: 'Enter Shipment Details', desc: 'Add package weight, dimensions, destination, and select parcel or document type.' },
              { step: '02', icon: Zap,     title: 'Compare Live Rates',     desc: 'Instantly compare rates from multiple carriers — sorted by price or speed.' },
              { step: '03', icon: ShieldCheck, title: 'Book & Download AWB', desc: 'Confirm booking, wallet deducted automatically. Download your AWB PDF label instantly.' },
            ].map((step) => (
              <div key={step.step} className="relative text-center">
                <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon size={28} className="text-brand-400" />
                </div>
                <span className="font-mono text-xs font-bold text-brand-500/60 tracking-widest">{step.step}</span>
                <h3 className="font-display font-bold text-white text-lg mt-1 mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles section ─────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display font-extrabold text-4xl text-white tracking-tight mb-4">
              Built for every level of your organisation
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Role-based access ensures everyone sees only what they need.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {roles.map((r) => (
              <div
                key={r.role}
                className="flex items-start gap-4 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all"
              >
                <span className="text-3xl">{r.icon}</span>
                <div>
                  <p className="font-display font-bold text-white text-base">{r.role}</p>
                  <p className="text-slate-400 text-sm mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────── */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-brand-600/20 to-indigo-600/20 border border-brand-500/20 rounded-3xl p-12">
          <Ship size={48} className="text-brand-400 mx-auto mb-6" />
          <h2 className="font-display font-extrabold text-4xl text-white tracking-tight mb-4">
            Ready to streamline your logistics?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Join FlightGo Express and start managing your freight network today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="flex items-center gap-2 px-8 py-4 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-2xl shadow-xl shadow-brand-500/25 transition-all hover:scale-105"
            >
              Create Account <ArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold rounded-2xl transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-slate-800 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Ship size={18} className="text-brand-400" />
          <span className="font-display font-bold text-white">FlightGo Express</span>
        </div>
        <p className="text-xs text-slate-600">
          © 2025 FlightGo Express Shipping Pvt Ltd. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
