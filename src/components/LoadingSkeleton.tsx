export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-slate-700 rounded mb-4 w-1/3"></div>
      <div className="space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        <div className="h-4 bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="mt-8 space-y-4">
        <div className="h-12 bg-slate-700 rounded"></div>
        <div className="h-12 bg-slate-700 rounded"></div>
        <div className="h-12 bg-slate-700 rounded"></div>
      </div>
    </div>
  )
}
