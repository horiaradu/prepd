interface ProgressBarProps {
  step: string;
  progress: number;
}

export default function ProgressBar({ step, progress }: ProgressBarProps) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-sm text-gray-600 mb-2">{step}</p>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
