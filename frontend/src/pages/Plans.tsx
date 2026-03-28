
type Plan = { id: string; name: string; description: string | null; price: string; currency: string; interval: "monthly" | "yearly"; max_users: number; is_active: boolean; created_at: string; };
import { useEffect, useState } from "react";
import { getPlans, createSubscription } from "../services/api";
import { Zap, Check, Loader2, Plus, Users, ArrowRight } from "lucide-react";
import clsx from "clsx";

const planColors = [
  { border: "border-dark-500", badge: "bg-dark-700 text-dark-300", glow: "" },
  { border: "border-brand-600/50", badge: "bg-brand-500/10 text-brand-400", glow: "shadow-lg shadow-brand-500/10" },
  { border: "border-purple-600/50", badge: "bg-purple-500/10 text-purple-400", glow: "shadow-lg shadow-purple-500/10" },
];

const planFeatures: Record<string, string[]> = {
  Starter: ["Up to 5 users", "Basic analytics", "Email support", "API access", "Monthly billing"],
  Pro: ["Up to 20 users", "Advanced analytics", "Priority support", "API access", "Custom integrations"],
  Enterprise: ["Unlimited users", "Full analytics suite", "24/7 support", "Custom API limits", "SLA guarantee"],
};

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then(r => setPlans(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (planId: string, planName: string) => {
    setSubscribing(planId);
    try {
      await createSubscription(planId);
      setSuccess(planName);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      alert(e.response?.data?.detail || "Subscription failed");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-medium mb-4">
          <Zap size={12} />
          Simple, transparent pricing
        </div>
        <h1 className="text-3xl font-bold text-white">Choose your plan</h1>
        <p className="text-dark-300 mt-2">Scale as you grow. Upgrade or downgrade at any time.</p>
      </div>

      {success && (
        <div className="max-w-md mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm text-center">
          ✓ Successfully subscribed to {success} plan
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse space-y-4">
              <div className="h-6 w-24 bg-dark-700 rounded" />
              <div className="h-10 w-32 bg-dark-700 rounded" />
              <div className="space-y-2">
                {Array(4).fill(0).map((_, j) => (
                  <div key={j} className="h-4 bg-dark-700 rounded w-full" />
                ))}
              </div>
              <div className="h-11 bg-dark-700 rounded-xl" />
            </div>
          ))
        ) : (
          plans.map((plan, i) => {
            const colors = planColors[i % planColors.length];
            const features = planFeatures[plan.name] || planFeatures.Starter;
            const isPopular = i === 1;

            return (
              <div
                key={plan.id}
                className={clsx(
                  "card p-6 flex flex-col gap-6 border-2 transition-all duration-300 hover:-translate-y-1",
                  colors.border,
                  colors.glow,
                  isPopular && "relative"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", colors.badge)}>
                      {plan.name}
                    </span>
                    <div className="flex items-center gap-1 text-dark-300 text-xs">
                      <Users size={12} />
                      {plan.max_users} users
                    </div>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold text-white">${parseFloat(plan.price).toFixed(0)}</span>
                    <span className="text-dark-300 mb-1.5">/{plan.interval === "monthly" ? "mo" : "yr"}</span>
                  </div>
                  {plan.description && (
                    <p className="text-dark-300 text-sm mt-2">{plan.description}</p>
                  )}
                </div>

                <ul className="space-y-3 flex-1">
                  {features.map((feat, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-dark-300">
                      <div className="w-4 h-4 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <Check size={10} className="text-emerald-400" />
                      </div>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id, plan.name)}
                  disabled={subscribing === plan.id}
                  className={clsx(
                    "w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200",
                    isPopular
                      ? "bg-brand-600 hover:bg-brand-500 text-white"
                      : "bg-dark-700 hover:bg-dark-600 text-white border border-dark-500"
                  )}
                >
                  {subscribing === plan.id
                    ? <><Loader2 size={15} className="animate-spin" />Processing...</>
                    : <><ArrowRight size={15} />Get started</>
                  }
                </button>
              </div>
            );
          })
        )}

        {/* Enterprise card */}
        {!loading && (
          <div className={clsx("card p-6 flex flex-col gap-6 border-2", planColors[2].border, planColors[2].glow)}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={clsx("text-xs font-medium px-2.5 py-1 rounded-full", planColors[2].badge)}>
                  Enterprise
                </span>
                <div className="flex items-center gap-1 text-dark-300 text-xs">
                  <Users size={12} />
                  Unlimited
                </div>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold text-white">Custom</span>
              </div>
              <p className="text-dark-300 text-sm mt-2">For large teams with custom needs</p>
            </div>
            <ul className="space-y-3 flex-1">
              {(planFeatures.Enterprise || []).map((feat, j) => (
                <li key={j} className="flex items-center gap-2.5 text-sm text-dark-300">
                  <div className="w-4 h-4 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <Check size={10} className="text-purple-400" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>
            <button className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-dark-700 hover:bg-dark-600 text-white border border-purple-600/30 transition-all">
              <Plus size={15} />Contact sales
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
