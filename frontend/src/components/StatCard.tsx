import { ReactNode } from "react";
import clsx from "clsx";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; positive: boolean };
  gradient?: string;
}

export default function StatCard({ title, value, subtitle, icon, trend, gradient }: Props) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          gradient || "bg-brand-500/10 text-brand-400"
        )}>
          {icon}
        </div>
        {trend && (
          <span className={clsx(
            "text-xs font-medium px-2 py-0.5 rounded-full",
            trend.positive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          )}>
            {trend.positive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-dark-300 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-dark-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
