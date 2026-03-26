"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const endpoints = [
  { method: "GET", path: "/api/tasks", description: "List tasks with filtering, pagination, and sorting" },
  { method: "POST", path: "/api/tasks", description: "Create a new task" },
  { method: "GET", path: "/api/tasks/:id", description: "Get a single task by ID" },
  { method: "PATCH", path: "/api/tasks/:id", description: "Update a task (partial)" },
  { method: "DELETE", path: "/api/tasks/:id", description: "Archive a task (soft delete)" },
];

const methodColors: Record<string, string> = {
  GET: "bg-green-100 text-green-700",
  POST: "bg-blue-100 text-blue-700",
  PATCH: "bg-yellow-100 text-yellow-700",
  DELETE: "bg-red-100 text-red-700",
};

function StatusBadge() {
  const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");

  useEffect(() => {
    fetch("/api/tasks?pageSize=1")
      .then((res) => {
        setStatus(res.ok ? "connected" : "error");
      })
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
        API connected
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
      <span className="h-2 w-2 rounded-full bg-red-500" />
      Not connected — check .env.local
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
          A REST API for task management, powered by Centrali.
        </p>
        <div className="mt-4">
          <StatusBadge />
        </div>
        <div className="mt-8">
          <Link
            href="/explorer"
            className="rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white no-underline hover:bg-gray-800"
          >
            Try it &rarr;
          </Link>
        </div>
      </div>

      <div className="mt-16">
        <h2 className="text-lg font-semibold text-gray-900">Endpoints</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Method</th>
                <th className="px-4 py-3 font-medium text-gray-500">Path</th>
                <th className="px-4 py-3 font-medium text-gray-500">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {endpoints.map((ep) => (
                <tr key={`${ep.method}-${ep.path}`}>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${methodColors[ep.method]}`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-900">
                    {ep.path}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ep.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h3 className="text-sm font-semibold text-gray-900">Query features</h3>
        <ul className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <li>Filter by status, priority, assignee</li>
          <li>Date range filtering (dueBefore, dueAfter)</li>
          <li>Full-text search across fields</li>
          <li>Pagination (page, pageSize)</li>
          <li>Sorting (asc/desc on any field)</li>
          <li>Total count with includeTotal=true</li>
        </ul>
      </div>

      <div className="mt-12 text-center text-sm text-gray-500">
        Built with{" "}
        <a
          href="https://docs.centrali.io"
          className="text-gray-700 underline hover:text-gray-900"
          target="_blank"
          rel="noopener noreferrer"
        >
          Centrali
        </a>{" "}
        +{" "}
        <a
          href="https://nextjs.org"
          className="text-gray-700 underline hover:text-gray-900"
          target="_blank"
          rel="noopener noreferrer"
        >
          Next.js
        </a>
      </div>
    </div>
  );
}
