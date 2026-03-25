"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Field {
  name: string;
  type: string;
}

export function CreateRecordForm({
  collectionSlug,
  fields,
}: {
  collectionSlug: string;
  fields: Field[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, ""])),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (!raw && raw !== "0") continue;
        if (field.type === "number") data[field.name] = Number(raw);
        else if (field.type === "boolean") data[field.name] = raw === "true";
        else data[field.name] = raw;
      }

      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionSlug, data }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to create record");
      }
      setValues(Object.fromEntries(fields.map((f) => [f.name, ""])));
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
        + Add record
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.name}{" "}
              <span className="font-normal text-gray-400">({field.type})</span>
            </label>
            <input
              type={field.type === "number" ? "number" : "text"}
              value={values[field.name]}
              onChange={(e) => setValues((prev) => ({ ...prev, [field.name]: e.target.value }))}
              placeholder={field.type === "boolean" ? "true / false" : ""}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-sm text-gray-500">
            This collection has no fields yet. Add properties in the Centrali console.
          </p>
        )}
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || fields.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create record"}
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
