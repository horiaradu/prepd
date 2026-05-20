"use client";

import { useEffect, useRef, useState } from "react";

interface DropdownOption<T extends string> {
  value: T;
  label: string;
}

export function Dropdown<T extends string>({
  label,
  value,
  onChange,
  options,
  activeValue,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  // The value that means "not filtering / unset". Used to style the chip as
  // active when something other than this value is selected. Optional.
  activeValue?: T;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const isActive = activeValue !== undefined && value !== activeValue;

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-sm border rounded-lg px-2.5 py-1 transition-colors ${
          isActive
            ? "border-green-600 bg-green-50 text-green-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        <span className="text-xs text-gray-500">{label}</span>
        <span className="font-medium">{selected?.label ?? value}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M2 4l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Desktop: inline popover */}
      {open && (
        <div className="hidden sm:block absolute z-20 mt-1 min-w-full max-h-72 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {open && (
        <div className="sm:hidden">
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl pb-safe">
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="max-h-[60vh] overflow-auto py-2">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-5 py-3 text-sm transition-colors ${
                      isSelected
                        ? "bg-green-50 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
