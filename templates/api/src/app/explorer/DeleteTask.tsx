"use client";

import { useState } from "react";
import { EndpointSection } from "./EndpointSection";
import { ResponsePanel } from "./ResponsePanel";

export function DeleteTask() {
  const [taskId, setTaskId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);

  async function handleDelete() {
    if (!taskId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId.trim()}`, {
        method: "DELETE",
      });
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
    <EndpointSection method="DELETE" path="/api/tasks/:id" description="Archive a task">
      <p className="mb-3 text-sm text-gray-500">
        This sets the task&apos;s status to <code className="rounded bg-gray-100 px-1">cancelled</code>. The record is not deleted.
      </p>
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
          onClick={handleDelete}
          disabled={loading || !taskId.trim()}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Archiving..." : "Archive"}
        </button>
      </div>
      <ResponsePanel loading={loading} data={data} error={error} status={resStatus} />
    </EndpointSection>
  );
}
