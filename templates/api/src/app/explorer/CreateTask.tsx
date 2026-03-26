"use client";

import { useState } from "react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";
import { EndpointSection } from "./EndpointSection";
import { ResponsePanel } from "./ResponsePanel";

export function CreateTask() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const body: Record<string, any> = { title: title.trim(), status, priority };
      if (description) body.description = description;
      if (assignee) body.assignee = assignee;
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      if (tags) body.tags = tags;

      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setResStatus(res.status);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
      setTitle("");
      setDescription("");
      setAssignee("");
      setDueDate("");
      setTags("");
    } catch (err: any) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-gray-500 focus:outline-none";
  const labelClass = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <EndpointSection method="POST" path="/api/tasks" description="Create a task">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
              className={inputClass + " w-full"}
            />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className={inputClass + " w-full"}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + " w-full"}>
              {TASK_STATUSES.filter((s) => s !== "cancelled").map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass + " w-full"}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assignee</label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="e.g. Alice"
              className={inputClass + " w-full"}
            />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass + " w-full"} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. backend,api"
              className={inputClass + " w-full"}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
      <ResponsePanel loading={loading} data={data} error={error} status={resStatus} />
    </EndpointSection>
  );
}
