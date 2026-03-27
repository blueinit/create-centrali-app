"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const functions = [
  {
    name: "process-item",
    description: "Processes new items as they are created",
    trigger: "Event-driven",
    triggerColor: "bg-blue-100 text-blue-700",
    schedule: "On record.created",
  },
  {
    name: "generate-report",
    description: "Generates an hourly summary report",
    trigger: "Scheduled",
    triggerColor: "bg-purple-100 text-purple-700",
    schedule: "Every hour (0 * * * *)",
  },
  {
    name: "cleanup-old-logs",
    description: "Deletes log entries older than 7 days",
    trigger: "Scheduled",
    triggerColor: "bg-purple-100 text-purple-700",
    schedule: "Daily at 2 AM UTC (0 2 * * *)",
  },
];

function StatusBadge() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");

  useEffect(() => {
    fetch("/api/functions")
      .then((res) => setStatus(res.ok ? "connected" : "error"))
      .catch(() => setStatus("error"));
  }, []);

  if (status === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
        Checking...
      </span>
    );
  }

  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        Connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Not connected &mdash; check .env.local
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          {"{{projectName}}"}
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Background jobs, scheduled tasks, and monitoring &mdash; powered by Centrali.
        </p>
        <div className="mt-4">
          <StatusBadge />
        </div>
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white no-underline hover:bg-gray-800"
          >
            Open Dashboard &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-16 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Functions</h2>
        {functions.map((fn) => (
          <div
            key={fn.name}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-sm font-semibold text-gray-900">
                {fn.name}
              </h3>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${fn.triggerColor}`}
              >
                {fn.trigger}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">{fn.description}</p>
            <p className="mt-2 text-xs text-gray-400">{fn.schedule}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="text-sm font-semibold text-gray-900">How it works</h3>
        <ol className="mt-3 space-y-2 text-sm text-gray-600">
          <li>
            <span className="font-medium text-gray-900">1. Setup</span> &mdash;{" "}
            <code className="rounded bg-gray-200 px-1 text-xs">npm run setup</code>{" "}
            provisions functions, triggers, and seed data in your Centrali workspace.
          </li>
          <li>
            <span className="font-medium text-gray-900">2. Create items</span> &mdash;{" "}
            New records in the <code className="rounded bg-gray-200 px-1 text-xs">processed-items</code>{" "}
            collection trigger automatic processing.
          </li>
          <li>
            <span className="font-medium text-gray-900">3. Monitor</span> &mdash;{" "}
            The dashboard shows function status, run history, and lets you trigger jobs manually.
          </li>
        </ol>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        Built with{" "}
        <a href="https://docs.centrali.io" className="text-gray-700 underline hover:text-gray-900" target="_blank" rel="noopener noreferrer">
          Centrali
        </a>{" "}
        +{" "}
        <a href="https://nextjs.org" className="text-gray-700 underline hover:text-gray-900" target="_blank" rel="noopener noreferrer">
          Next.js
        </a>
      </div>
    </div>
  );
}
