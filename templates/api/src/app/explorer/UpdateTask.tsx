"use client";

import { useState } from "react";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/tasks";
import { EndpointSection } from "./EndpointSection";
import { ResponsePanel } from "./ResponsePanel";

export function UpdateTask() {
  const [taskId, setTaskId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);

  async function loadCurrent() {
    if (!taskId.trim()) return;
    setLoadingCurrent(true);
    try {
      const res = await fetch(`/api/tasks/${taskId.trim()}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const d = json.data.data ?? json.data;
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setStatus(d.status ?? "");
        setPriority(d.priority ?? "");
        setAssignee(d.assignee ?? "");
        setDueDate(d.dueDate ? d.dueDate.split("T")[0] : "");
        setTags(d.tags ?? "");
      }
    } catch {
      // ignore
    } finally {
      setLoadingCurrent(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskId.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const body: Record<string, any> = {};
      if (title) body.title = title;
      if (description) body.description = description;
      if (status) body.status = status;
      if (priority) body.priority = priority;
      if (assignee) body.assignee = assignee;
      if (dueDate) body.dueDate = new Date(dueDate).toISOString();
      if (tags) body.tags = tags;

      const res = await fetch(`/api/tasks/${taskId.trim()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
  const labelClass = "block text-xs font-medium text-gray-500 mb-1";

  return (
    <EndpointSection method="PATCH" path="/api/tasks/:id" description="Update a task">
      <div className="flex items-end gap-2 mb-4">
        <div className="flex-1">
          <label className={labelClass}>Task ID</label>
          <input
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Paste a task ID"
            className={inputClass + " w-full"}
          />
        </div>
        <button
          onClick={loadCurrent}
          disabled={loadingCurrent || !taskId.trim()}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {loadingCurrent ? "Loading..." : "Load current"}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelClass}>Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Leave empty to skip" className={inputClass + " w-full"} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Leave empty to skip" rows={2} className={inputClass + " w-full"} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + " w-full"}>
              <option value="">Don&apos;t change</option>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass + " w-full"}>
              <option value="">Don&apos;t change</option>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Assignee</label>
            <input type="text" value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="Leave empty to skip" className={inputClass + " w-full"} />
          </div>
          <div>
            <label className={labelClass}>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputClass + " w-full"} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Tags</label>
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Leave empty to skip" className={inputClass + " w-full"} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading || !taskId.trim()}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update"}
          </button>
        </div>
      </form>
      <ResponsePanel loading={loading} data={data} error={error} status={resStatus} />
    </EndpointSection>
  );
}
