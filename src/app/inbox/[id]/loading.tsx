export default function Loading() {
  return (
    <div className="p-6 sm:p-8 max-w-3xl w-full mx-auto animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-4 bg-gray-50 rounded w-1/3" />
        <div className="h-6 bg-gray-100 rounded w-2/3" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-50 rounded w-full" />
        ))}
      </div>
    </div>
  );
}
