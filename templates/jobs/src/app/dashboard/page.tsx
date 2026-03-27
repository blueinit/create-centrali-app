"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDuration, formatRelativeTime, statusColor } from "@/lib/utils";

export default function DashboardPage() {
  const [functions, setFunctions] = useState<any[]>([]);
  const [triggers, setTriggers] = useState<any[]>([]);
  const [runsByFunction, setRunsByFunction] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [fnsRes, triggersRes] = await Promise.all([
        fetch("/api/functions").then((r) => r.json()),
        fetch("/api/triggers").then((r) => r.json()),
      ]);

      const fns = fnsRes.data ?? [];
      setFunctions(fns);
      setTriggers(triggersRes.data ?? []);

      const runsMap: Record<string, any[]> = {};
      await Promise.all(
        fns.map(async (fn: any) => {
          try {
            const res = await fetch(`/api/functions/${fn.id}/runs?limit=5`);
            const json = await res.json();
            runsMap[fn.id] = json.data ?? [];
          } catch {
            runsMap[fn.id] = [];
          }
        }),
      );
      setRunsByFunction(runsMap);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const activeTriggers = triggers.filter((t: any) => t.enabled !== false);
  const allRuns = Object.values(runsByFunction).flat();
  const recentRuns = allRuns
    .sort((a: any, b: any) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    .slice(0, 10);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs Dashboard</h1>
        <button
          onClick={loadData}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{functions.length}</p>
          <p className="text-xs text-gray-500">Functions</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{activeTriggers.length}</p>
          <p className="text-xs text-gray-500">Active Triggers</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{allRuns.length}</p>
          <p className="text-xs text-gray-500">Recent Runs</p>
        </div>
      </div>

      {/* Function cards */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Functions</h2>
        {functions.map((fn: any) => {
          const runs = runsByFunction[fn.id] ?? [];
          const lastRun = runs[0];
          const fnTriggers = triggers.filter((t: any) => t.functionId === fn.id);
          const completedRuns = runs.filter((r: any) => r.status === "completed").length;
          const successRate = runs.length > 0 ? Math.round((completedRuns / runs.length) * 100) : null;

          return (
            <div key={fn.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-gray-900">{fn.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{fn.description}</p>
                </div>
                <div className="flex gap-1.5">
                  {fnTriggers.map((t: any) => {
                    const color =
                      t.executionType === "event-driven" ? "bg-blue-100 text-blue-700" :
                      t.executionType === "scheduled" ? "bg-purple-100 text-purple-700" :
                      "bg-gray-100 text-gray-700";
                    return (
                      <span key={t.id} className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
                        {t.executionType}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-6 text-sm">
                {lastRun ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(lastRun.status)}`}>
                        {lastRun.status}
                      </span>
                      <span className="text-gray-400">{formatRelativeTime(lastRun.startedAt)}</span>
                    </span>
                    <span className="text-gray-400">
                      {formatDuration(lastRun.startedAt, lastRun.endedAt)}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-400">No runs yet</span>
                )}
                {successRate !== null && (
                  <span className="text-gray-400">{successRate}% success</span>
                )}
              </div>

              <div className="mt-3 flex gap-3">
                <Link
                  href={`/dashboard/functions/${fn.id}`}
                  className="text-sm text-blue-600 no-underline hover:underline"
                >
                  View details &rarr;
                </Link>
                <Link
                  href="/dashboard/trigger"
                  className="text-sm text-gray-500 no-underline hover:underline"
                >
                  Run now
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      {recentRuns.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Function</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Started</th>
                  <th className="px-4 py-2 font-medium text-gray-500">Duration</th>
                  <th className="px-4 py-2 font-medium text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentRuns.map((run: any) => {
                  const fn = functions.find((f: any) => f.id === run.functionId);
                  return (
                    <tr key={run.id}>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(run.status)}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 font-mono text-gray-900">{fn?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-gray-500">{formatRelativeTime(run.startedAt)}</td>
                      <td className="px-4 py-2 text-gray-500">{formatDuration(run.startedAt, run.endedAt)}</td>
                      <td className="px-4 py-2">
                        <Link href={`/dashboard/runs/${run.id}`} className="text-blue-600 no-underline hover:underline text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
