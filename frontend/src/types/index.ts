export type Tenant = {
  id: string;
  name: string;
  slug: string;
  email: string;
  is_active: boolean;
  created_at: string;
};
export type User = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  created_at: string;
};
export type Plan = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  interval: "monthly" | "yearly";
  max_users: number;
  is_active: boolean;
  created_at: string;
};
export type Subscription = {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};
export type Transaction = {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  amount: string;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "refunded" | "partially_refunded";
  type: "payment" | "refund" | "invoice";
  failure_reason: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
};
export type DashboardOverview = {
  revenue: {
    total_revenue: number;
    total_refunds: number;
    net_revenue: number;
    failed_payments: number;
    total_payments: number;
    success_rate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    canceled: number;
  };
  recent_transactions: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    type: string;
    created_at: string;
  }[];
  tenant: {
    id: string;
    user: string;
  };
};
export type AIInsight = {
  question: string;
  answer: string;
  data_points: { label: string; value: string }[] | null;
  anomalies: string[] | null;
};
