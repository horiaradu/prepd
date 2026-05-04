export default function Loading() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 overflow-hidden"
          >
            <div className="h-32 bg-gray-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
