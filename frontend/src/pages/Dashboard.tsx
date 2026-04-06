import React, { useEffect, useState, useCallback } from "react";

type DashboardOverview = {
  revenue: {
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
    failed_payments: number;
    total_payments: number;
    success_rate: number;
  };
  subscriptions: { total: number; active: number; canceled: number; };
  recent_transactions: {
    id: string; amount: number; currency: string;
    status: string; type: string; created_at: string;
  }[];
  tenant: { id: string; user: string; };
};
import { getDashboardOverview } from "../services/api";
import { useWebSocket, type WebSocketMessage } from "../hooks/useWebSocket";

import StatCard from "../components/StatCard";
import { SkeletonCard, SkeletonRow } from "../components/LoadingSkeleton";
import {
  DollarSign, TrendingUp, CreditCard, AlertCircle,
  CheckCircle, XCircle, Clock, ArrowUpRight, Wifi, WifiOff
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { useAuth } from "../context/AuthContext";

const statusIcon: Record<string, React.ReactElement> = {
  succeeded: <CheckCircle size={14} className="text-emerald-400" />,
  failed: <XCircle size={14} className="text-red-400" />,
  pending: <Clock size={14} className="text-amber-400" />,
  refunded: <ArrowUpRight size={14} className="text-blue-400" />,
};

const statusBadge: Record<string, string> = {
  succeeded: "badge-success",
  failed: "badge-danger",
  pending: "badge-warning",
  refunded: "badge-info",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);
  const { user, tenant } = useAuth();

  useEffect(() => {
    getDashboardOverview()
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  // Handle real-time WebSocket messages
  const handleMessage = useCallback((msg: WebSocketMessage) => {
    if (msg.type === "new_transaction") {
      setLiveTransactions(prev => [msg.data, ...prev].slice(0, 5));
      // Also update the main data if needed
      setData(prevData => {
        if (!prevData) return prevData;
        return {
          ...prevData,
          recent_transactions: [msg.data, ...prevData.recent_transactions].slice(0, 10),
        };
      });
    }
    if (msg.type === "stats_update") {
      setData(prevData => {
        if (!prevData) return prevData;
        return { ...prevData, revenue: { ...prevData.revenue, ...msg.data } };
      });
    }
  }, []);

  const { connected } = useWebSocket({ onMessage: handleMessage });

  // Build chart data from transactions
  const chartData = data?.recent_transactions
    .slice()
    .reverse()
    .map((tx, i) => ({
      name: `#${i + 1}`,
      amount: tx.amount,
      date: new Date(tx.created_at).toLocaleDateString(),
    })) || [];

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-300 mt-0.5">
            Welcome back, <span className="text-white">{user?.full_name || user?.email}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Live indicator */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${connected ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="text-xs font-medium">{connected ? "Live" : "Offline"}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-700 border border-dark-500">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-dark-300">{tenant?.name}</span>
          </div>
        </div>
      </div>

      {/* Live transactions banner (if any) */}
      {liveTransactions.length > 0 && (
        <div className="p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-sm font-medium text-brand-400">Live Activity</span>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {liveTransactions.map((tx, i) => (
              <div key={i} className="flex-shrink-0 px-3 py-2 rounded-lg bg-dark-800 border border-dark-600">
                <span className="text-white font-medium">${tx.amount}</span>
                <span className={`ml-2 text-xs ${tx.status === "succeeded" ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`$${data?.revenue.total_revenue.toFixed(2)}`}
              icon={<DollarSign size={20} />}
              gradient="bg-emerald-500/10 text-emerald-400"
              trend={{ value: 12, positive: true }}
            />
            <StatCard
              title="Net Revenue"
              value={`$${data?.revenue.net_revenue.toFixed(2)}`}
              icon={<TrendingUp size={20} />}
              gradient="bg-brand-500/10 text-brand-400"
              trend={{ value: 8, positive: true }}
            />
            <StatCard
              title="Active Subscriptions"
              value={data?.subscriptions.active || 0}
              subtitle={`${data?.subscriptions.total || 0} total`}
              icon={<CreditCard size={20} />}
              gradient="bg-purple-500/10 text-purple-400"
            />
            <StatCard
              title="Payment Success Rate"
              value={`${data?.revenue.success_rate}%`}
              subtitle={`${data?.revenue.failed_payments} failed`}
              icon={<AlertCircle size={20} />}
              gradient="bg-amber-500/10 text-amber-400"
            />
          </>
        )}
      </div>

      {/* Chart + recent transactions */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Chart */}
        <div className="card p-6 xl:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-white">Revenue Overview</h2>
              <p className="text-sm text-dark-300 mt-0.5">Recent transaction amounts</p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-dark-700 rounded-xl animate-pulse" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#22222f" />
                <XAxis dataKey="name" stroke="#6b6b8a" tick={{ fontSize: 12 }} />
                <YAxis stroke="#6b6b8a" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#111118", border: "1px solid #22222f", borderRadius: "12px" }}
                  labelStyle={{ color: "#fff" }}
                  itemStyle={{ color: "#38bdf8" }}
                  formatter={(v: any) => [`$${v}`, "Amount"]}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  fill="url(#colorAmt)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-dark-300">
              No transaction data yet
            </div>
          )}
        </div>

        {/* Recent transactions */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="font-semibold text-white mb-4">Recent Transactions</h2>
          {loading ? (
            <div className="space-y-3">{Array(4).fill(0).map((_, i) => <SkeletonRow key={i} />)}</div>
          ) : data?.recent_transactions.length === 0 ? (
            <div className="text-dark-300 text-sm text-center py-8">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {data?.recent_transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-700 hover:bg-dark-600 transition-colors">
                  <div className="flex items-center gap-2.5">
                    {statusIcon[tx.status] || <Clock size={14} className="text-dark-300" />}
                    <div>
                      <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                      <p className="text-xs text-dark-300">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">${tx.amount.toFixed(2)}</p>
                    <span className={statusBadge[tx.status] || "badge-info"}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
