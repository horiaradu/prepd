import type { IconProps } from "./types";

export function ChevronDownIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
