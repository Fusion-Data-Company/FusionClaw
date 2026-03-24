export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-2" />
          <div className="space-y-2">
            <div className="h-5 w-32 rounded bg-surface-2" />
            <div className="h-3 w-24 rounded bg-surface-2" />
          </div>
        </div>
        <div className="h-9 w-28 rounded-lg bg-surface-2" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-20 rounded bg-surface-2" />
              <div className="w-4 h-4 rounded bg-surface-2" />
            </div>
            <div className="h-7 w-24 rounded bg-surface-2" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="border-b border-border px-4 py-3 flex gap-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3 w-16 rounded bg-surface-2" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 px-4 py-3 flex gap-8">
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="h-3 rounded bg-surface-2" style={{ width: `${60 + Math.random() * 40}px` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
