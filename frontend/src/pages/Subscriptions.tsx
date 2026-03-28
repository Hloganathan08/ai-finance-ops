
type Plan = { id: string; name: string; description: string | null; price: string; currency: string; interval: "monthly" | "yearly"; max_users: number; is_active: boolean; created_at: string; };
type Subscription = { id: string; tenant_id: string; plan_id: string; status: "active" | "past_due" | "canceled" | "trialing" | "incomplete"; stripe_subscription_id: string | null; current_period_start: string | null; current_period_end: string | null; cancel_at_period_end: boolean; created_at: string; };
import { useEffect, useState } from "react";
import { getSubscriptions, cancelSubscription, getPlans } from "../services/api";
import { CreditCard, XCircle, Loader2, RefreshCw, Calendar, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const statusBadge: Record<string, string> = {
  active: "badge-success",
  past_due: "badge-danger",
  canceled: "badge-danger",
  trialing: "badge-info",
  incomplete: "badge-warning",
};

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchData = () => {
    setLoading(true);
    Promise.all([getSubscriptions(), getPlans()])
      .then(([subRes, planRes]) => {
        setSubscriptions(subRes.data);
        setPlans(planRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const getPlan = (planId: string) => plans.find(p => p.id === planId);

  const handleCancel = async (sub: Subscription) => {
    if (!confirm("Cancel this subscription?")) return;
    setCanceling(sub.id);
    try {
      await cancelSubscription(sub.id);
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.detail || "Cancellation failed");
    } finally {
      setCanceling(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscriptions</h1>
          <p className="text-dark-300 mt-0.5">{subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary">
            <RefreshCw size={15} />Refresh
          </button>
          <button onClick={() => navigate("/plans")} className="btn-primary">
            <ArrowRight size={15} />New subscription
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <div className="h-5 w-24 bg-dark-700 rounded" />
                  <div className="h-4 w-40 bg-dark-700 rounded" />
                </div>
                <div className="h-8 w-20 bg-dark-700 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="card p-16 text-center">
          <CreditCard size={40} className="text-dark-500 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">No subscriptions yet</h3>
          <p className="text-dark-300 text-sm mb-6">Subscribe to a plan to get started</p>
          <button onClick={() => navigate("/plans")} className="btn-primary mx-auto">
            <ArrowRight size={15} />Browse plans
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {subscriptions.map(sub => {
            const plan = getPlan(sub.plan_id);
            const isActive = sub.status === "active";
            return (
              <div key={sub.id} className={clsx(
                "card p-6 border-2 transition-all duration-200",
                isActive ? "border-emerald-500/20" : "border-dark-600"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                      isActive ? "bg-emerald-500/10" : "bg-dark-700"
                    )}>
                      <CreditCard size={22} className={isActive ? "text-emerald-400" : "text-dark-300"} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white text-lg">{plan?.name || "Unknown Plan"}</h3>
                        <span className={statusBadge[sub.status] || "badge-info"}>{sub.status}</span>
                      </div>
                      <p className="text-dark-300 text-sm">
                        ${plan ? parseFloat(plan.price).toFixed(2) : "—"}/month · up to {plan?.max_users} users
                      </p>
                      {sub.current_period_end && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-dark-400">
                          <Calendar size={12} />
                          {sub.cancel_at_period_end
                            ? `Cancels on ${new Date(sub.current_period_end).toLocaleDateString()}`
                            : `Renews ${new Date(sub.current_period_end).toLocaleDateString()}`
                          }
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-2xl font-bold text-white">${plan ? parseFloat(plan.price).toFixed(0) : "—"}</p>
                      <p className="text-xs text-dark-300">per month</p>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => handleCancel(sub)}
                        disabled={canceling === sub.id}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all disabled:opacity-50"
                      >
                        {canceling === sub.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <XCircle size={13} />
                        }
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-600 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-dark-400 mb-0.5">Subscription ID</p>
                    <p className="text-xs font-mono text-dark-300">{sub.id.slice(0, 16)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-0.5">Started</p>
                    <p className="text-xs text-dark-300">
                      {sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-dark-400 mb-0.5">Auto-renew</p>
                    <p className="text-xs text-dark-300">{sub.cancel_at_period_end ? "Off" : "On"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
