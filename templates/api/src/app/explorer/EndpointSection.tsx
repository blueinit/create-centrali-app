"use client";

import { useState } from "react";

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

interface EndpointSectionProps {
  method: string;
  path: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function EndpointSection({
  method,
  path,
  description,
  defaultOpen = false,
  children,
}: EndpointSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-5 py-4 text-left"
      >
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${methodColors[method]}`}
        >
          {method}
        </span>
        <span className="font-mono text-sm text-gray-900">{path}</span>
        <span className="ml-auto text-sm text-gray-500">{description}</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="border-t border-gray-100 px-5 py-4">{children}</div>}
    </div>
  );
}
