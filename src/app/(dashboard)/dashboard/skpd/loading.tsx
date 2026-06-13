export default function SkpdLoading() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="h-12 bg-gray-100 animate-pulse" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-14 border-t bg-gray-50 animate-pulse" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    </div>
  );
}