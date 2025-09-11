import React from "react";

const sizeMap = {
  xs: "h-4 w-4",
  sm: "h-5 w-5",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
};

export default function Loader({
  label = "Chargement…",
  size = "md",
  className = "",
  showLabel = true,
}) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        className={`animate-spin text-sky-600 ${sizeMap[size] || sizeMap.md}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        {/* track */}
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        {/* arc */}
        <path
          className="opacity-90"
          d="M22 12a10 10 0 0 1-10 10"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
      {showLabel && <span className="text-sm text-slate-600">{label}</span>}
    </div>
  );
}
