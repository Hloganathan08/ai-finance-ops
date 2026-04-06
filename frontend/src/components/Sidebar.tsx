import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, CreditCard, Receipt, Sparkles,
  LogOut, Zap, ChevronRight, User, AlertTriangle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import clsx from "clsx";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/plans", icon: Zap, label: "Plans" },
  { to: "/subscriptions", icon: CreditCard, label: "Subscriptions" },
  { to: "/transactions", icon: Receipt, label: "Transactions" },
  { to: "/anomalies", icon: AlertTriangle, label: "Anomalies" },
  { to: "/ai", icon: Sparkles, label: "AI Insights" },
];

export default function Sidebar() {
  const { user, tenant, logout } = useAuth();

  return (
    <aside className="w-64 h-screen bg-dark-800 border-r border-dark-600 flex flex-col fixed left-0 top-0 z-50">
      {/* Logo */}
      <div className="p-6 border-b border-dark-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">FinanceOps</p>
            <p className="text-xs text-dark-300">AI Billing Platform</p>
          </div>
        </div>
      </div>

      {/* Tenant badge */}
      <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-dark-700 border border-dark-500">
        <p className="text-xs text-dark-300 mb-0.5">Organization</p>
        <p className="text-sm font-medium text-white truncate">{tenant?.name}</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx("nav-item group", isActive && "active")
            }
          >
            <Icon size={18} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-dark-600">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-dark-700 transition-all group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <User size={14} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name || user?.email}</p>
            <p className="text-xs text-dark-300 capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-dark-300"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
