export function SkeletonCard() {
  return (
    <div className="stat-card animate-pulse">
      <div className="w-10 h-10 rounded-xl bg-dark-600" />
      <div className="space-y-2">
        <div className="h-7 w-24 bg-dark-600 rounded-lg" />
        <div className="h-4 w-32 bg-dark-700 rounded" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 animate-pulse">
      <div className="h-4 w-32 bg-dark-600 rounded" />
      <div className="h-4 w-20 bg-dark-600 rounded" />
      <div className="h-4 w-16 bg-dark-700 rounded" />
      <div className="h-4 w-24 bg-dark-700 rounded" />
    </div>
  );
}
