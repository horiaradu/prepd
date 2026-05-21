export default function Loading() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto animate-pulse">
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-100 p-4 space-y-2"
          >
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-3 bg-gray-50 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
