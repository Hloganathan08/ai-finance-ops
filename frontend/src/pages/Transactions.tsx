
type Transaction = { id: string; tenant_id: string; subscription_id: string | null; amount: string; currency: string; status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded"; type: "payment" | "refund" | "invoice"; failure_reason: string | null; stripe_payment_intent_id: string | null; created_at: string; };
import { useEffect, useState } from "react";
import { getTransactions, refundTransaction } from "../services/api";
import { Receipt, Search, RefreshCw, RotateCcw, Loader2, Filter } from "lucide-react";
import clsx from "clsx";

const statusBadge: Record<string, string> = {
  succeeded: "badge-success",
  failed: "badge-danger",
  pending: "badge-warning",
  refunded: "badge-info",
  partially_refunded: "badge-warning",
};

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [refunding, setRefunding] = useState<string | null>(null);

  const fetchTransactions = () => {
    setLoading(true);
    getTransactions()
      .then(r => setTransactions(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const handleRefund = async (tx: Transaction) => {
    if (!confirm(`Refund $${tx.amount} for transaction ${tx.id.slice(0, 8)}?`)) return;
    setRefunding(tx.id);
    try {
      await refundTransaction(tx.id, "Customer requested refund");
      fetchTransactions();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Refund failed");
    } finally {
      setRefunding(null);
    }
  };

  const filtered = transactions
    .filter(tx => filter === "all" || tx.status === filter)
    .filter(tx =>
      tx.id.includes(search) ||
      tx.status.includes(search) ||
      tx.type.includes(search)
    );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Transactions</h1>
          <p className="text-dark-300 mt-0.5">{transactions.length} total transactions</p>
        </div>
        <button onClick={fetchTransactions} className="btn-secondary">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-300" />
          <input
            className="input pl-10 py-2.5"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-dark-300" />
          {["all", "succeeded", "failed", "refunded", "pending"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filter === f
                  ? "bg-brand-600 text-white"
                  : "bg-dark-700 text-dark-300 hover:text-white hover:bg-dark-600"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">ID</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">Type</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-dark-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array(6).fill(0).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-dark-700 rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Receipt size={32} className="text-dark-500 mx-auto mb-3" />
                    <p className="text-dark-300">No transactions found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(tx => (
                  <tr key={tx.id} className="hover:bg-dark-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-dark-300 group-hover:text-white transition-colors">
                        {tx.id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-sm text-white font-medium">{tx.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-white">
                        ${parseFloat(tx.amount).toFixed(2)}
                        <span className="text-dark-300 font-normal ml-1 uppercase text-xs">{tx.currency}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={statusBadge[tx.status] || "badge-info"}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-dark-300">
                        {new Date(tx.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {tx.status === "succeeded" && tx.type === "payment" && (
                        <button
                          onClick={() => handleRefund(tx)}
                          disabled={refunding === tx.id}
                          className="flex items-center gap-1.5 text-xs text-dark-300 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          {refunding === tx.id
                            ? <Loader2 size={13} className="animate-spin" />
                            : <RotateCcw size={13} />
                          }
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
