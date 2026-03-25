"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CreateCollectionForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), recordSlug: slug }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create collection");
      }
      setName("");
      setOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        + New collection
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Collection name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Products, Tasks, Contacts"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            autoFocus
          />
          {slug && (
            <p className="mt-1 text-xs text-gray-400">
              Slug: <span className="font-mono">{slug}</span>
            </p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Starts with two fields: <span className="font-mono">name</span> and{" "}
          <span className="font-mono">description</span>. Add more in the console.
        </p>
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
