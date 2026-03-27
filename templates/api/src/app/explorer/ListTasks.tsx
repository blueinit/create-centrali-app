"use client";

import { useState } from "react";
import { TASK_STATUSES, TASK_PRIORITIES, SORTABLE_FIELDS, SEARCHABLE_FIELDS } from "@/lib/tasks";
import { EndpointSection } from "./EndpointSection";
import { ResponsePanel } from "./ResponsePanel";

export function ListTasks() {
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueBefore, setDueBefore] = useState("");
  const [dueAfter, setDueAfter] = useState("");
  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("title");
  const [page, setPage] = useState("1");
  const [pageSize, setPageSize] = useState("20");
  const [sort, setSort] = useState("-createdAt");
  const [includeTotal, setIncludeTotal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resStatus, setResStatus] = useState<number | null>(null);

  function buildUrl() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (assignee) params.set("assignee", assignee);
    if (dueBefore) params.set("dueBefore", new Date(dueBefore).toISOString());
    if (dueAfter) params.set("dueAfter", new Date(dueAfter).toISOString());
    if (search) {
      params.set("search", search);
      params.set("searchField", searchField);
    }
    params.set("page", page);
    params.set("pageSize", pageSize);
    params.set("sort", sort);
    if (includeTotal) params.set("includeTotal", "true");
    return `/api/tasks?${params.toString()}`;
  }

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildUrl());
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
    <EndpointSection method="GET" path="/api/tasks" description="List with filters" defaultOpen>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass + " w-full"}>
            <option value="">All (except cancelled)</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass + " w-full"}>
            <option value="">Any</option>
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
          <label className={labelClass}>Due after</label>
          <input type="date" value={dueAfter} onChange={(e) => setDueAfter(e.target.value)} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className={labelClass}>Due before</label>
          <input type="date" value={dueBefore} onChange={(e) => setDueBefore(e.target.value)} className={inputClass + " w-full"} />
        </div>
        <div>
          <label className={labelClass}>Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass + " w-full"}>
            {SORTABLE_FIELDS.flatMap((f) => [
              <option key={`${f}-desc`} value={`-${f}`}>{f} (newest first)</option>,
              <option key={`${f}-asc`} value={f}>{f} (oldest first)</option>,
            ])}
          </select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text..."
              className={inputClass + " flex-1"}
            />
            <select value={searchField} onChange={(e) => setSearchField(e.target.value)} className={inputClass}>
              {SEARCHABLE_FIELDS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelClass}>Page</label>
            <input type="number" value={page} onChange={(e) => setPage(e.target.value)} min="1" className={inputClass + " w-full"} />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Page size</label>
            <input type="number" value={pageSize} onChange={(e) => setPageSize(e.target.value)} min="1" max="100" className={inputClass + " w-full"} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={includeTotal} onChange={(e) => setIncludeTotal(e.target.checked)} />
          Include total count
        </label>
        <div className="flex items-center gap-3">
          <code className="max-w-md truncate rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
            {buildUrl()}
          </code>
          <button
            onClick={handleSend}
            disabled={loading}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send"}
          </button>
        </div>
      </div>

      <ResponsePanel loading={loading} data={data} error={error} status={resStatus} />
    </EndpointSection>
  );
}
