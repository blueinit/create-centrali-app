"use client";

import { useEffect, useState, useRef } from "react";
import { statusColor } from "@/lib/utils";

export default function TriggerPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [selectedTriggerId, setSelectedTriggerId] = useState("");
  const [payload, setPayload] = useState("{}");
  const [invoking, setInvoking] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/triggers")
      .then((r) => r.json())
      .then((json) => {
        const onDemand = (json.data ?? []).filter(
          (t: any) => t.executionType === "on-demand",
        );
        setTriggers(onDemand);
        if (onDemand.length > 0) setSelectedTriggerId(onDemand[0].id);
      });
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  function formatPayload() {
    try {
      setPayload(JSON.stringify(JSON.parse(payload), null, 2));
    } catch {
      // ignore invalid JSON
    }
  }

  async function handleInvoke() {
    if (!selectedTriggerId) return;

    setInvoking(true);
    setJobId(null);
    setJobStatus(null);
    setError(null);

    try {
      let parsedPayload = {};
      try { parsedPayload = JSON.parse(payload); } catch {}

      const res = await fetch(`/api/triggers/${selectedTriggerId}/invoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: parsedPayload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);

      const id = json.data?.jobId;
      setJobId(id);

      // Start polling
      if (id) {
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(`/api/jobs/${id}/status`);
            const statusJson = await statusRes.json();
            const status = statusJson.data;
            setJobStatus(status);

            if (status?.status === "completed" || status?.status === "failed") {
              if (pollingRef.current) clearInterval(pollingRef.current);
              pollingRef.current = null;
              setInvoking(false);
            }
          } catch {}
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message);
      setInvoking(false);
    }
  }

  async function handleQuickAction(action: "process" | "report" | "cleanup") {
    if (action === "process") {
      // Create a test item — the event-driven trigger will fire
      setError(null);
      setJobId(null);
      setJobStatus(null);
      setInvoking(true);

      try {
        const res = await fetch("/api/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Test item ${new Date().toLocaleTimeString()}`,
            type: "order",
            priority: "normal",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setJobStatus({ status: "completed", returnValue: { message: "Item created — event-driven trigger will process it", item: json.data } });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setInvoking(false);
      }
      return;
    }

    // Find the matching on-demand trigger
    const name = action === "report" ? "generate-report-manual" : "cleanup-old-logs-manual";
    const trigger = triggers.find((t) => t.name === name);
    if (trigger) {
      setSelectedTriggerId(trigger.id);
      setPayload("{}");
      // Small delay to let state update, then invoke
      setTimeout(() => {
        handleInvoke();
      }, 100);
    }
  }

  const selectedTrigger = triggers.find((t) => t.id === selectedTriggerId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Trigger</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invoke an on-demand trigger and watch it execute in real-time.
        </p>
      </div>

      {/* Quick actions */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleQuickAction("process")}
            disabled={invoking}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Process a test item
          </button>
          <button
            onClick={() => handleQuickAction("report")}
            disabled={invoking}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Generate report now
          </button>
          <button
            onClick={() => handleQuickAction("cleanup")}
            disabled={invoking}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Run cleanup now
          </button>
        </div>
      </div>

      {/* Trigger selector */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Trigger</label>
          <select
            value={selectedTriggerId}
            onChange={(e) => setSelectedTriggerId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          >
            {triggers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} — {t.description ?? ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-500">Payload (JSON)</label>
            <button onClick={formatPayload} className="text-xs text-blue-600 hover:underline">
              Format
            </button>
          </div>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        <button
          onClick={handleInvoke}
          disabled={invoking || !selectedTriggerId}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {invoking ? "Running..." : "Invoke"}
        </button>
      </div>

      {/* Execution monitor */}
      {(jobId || error) && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900">Execution</h2>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {jobId && (
            <p className="text-xs text-gray-500">
              Job ID: <span className="font-mono">{jobId}</span>
            </p>
          )}

          {jobStatus && (
            <>
              <div className="flex items-center gap-2">
                {(jobStatus.status === "queued" || jobStatus.status === "running") && (
                  <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(jobStatus.status === "failed" ? "failure" : jobStatus.status)}`}>
                  {jobStatus.status}
                </span>
              </div>

              {jobStatus.status === "completed" && jobStatus.returnValue != null && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Result:</p>
                  <pre className="max-h-64 overflow-auto rounded-lg border border-gray-200 bg-gray-900 p-3 text-sm text-green-400">
                    {JSON.stringify(jobStatus.returnValue, null, 2)}
                  </pre>
                </div>
              )}

              {jobStatus.status === "failed" && jobStatus.failedReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {jobStatus.failedReason}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
