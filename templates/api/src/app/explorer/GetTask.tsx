"use client";

import { useState } from "react";
import { EndpointSection } from "./EndpointSection";
import { ResponsePanel } from "./ResponsePanel";

export function GetTask() {
  const [taskId, setTaskId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);
  const [recentIds, setRecentIds] = useState<{ id: string; title: string }[]>([]);
  const [loadingIds, setLoadingIds] = useState(false);

  async function loadRecentIds() {
    setLoadingIds(true);
    try {
      const res = await fetch("/api/tasks?pageSize=10&sort=-createdAt");
      const json = await res.json();
      setRecentIds(
        (json.data ?? []).map((t: any) => ({ id: t.id, title: t.data?.title ?? t.id })),
      );
    } catch {
      // ignore
    } finally {
      setLoadingIds(false);
    }
  }

  async function handleFetch() {
    if (!taskId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId.trim()}`);
      setResStatus(res.status);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none";

  return (
    <EndpointSection method="GET" path="/api/tasks/:id" description="Get a single task">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Task ID</label>
          <input
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Paste a task ID"
            className={inputClass + " w-full"}
          />
        </div>
        <button
          onClick={loadRecentIds}
          disabled={loadingIds}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingIds ? "Loading..." : "Pick from list"}
        </button>
        <button
          onClick={handleFetch}
          disabled={loading || !taskId.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {recentIds.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {recentIds.map((t) => (
            <button
              key={t.id}
              onClick={() => setTaskId(t.id)}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
            >
              {t.title}
            </button>
          ))}
        </div>
      )}

      <ResponsePanel loading={loading} data={data} error={error} status={resStatus} />
    </EndpointSection>
  );
}
