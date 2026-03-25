import { useEffect, useState, useCallback } from "react";
import { createCentraliClient } from "./centrali";

// ── Types ────────────────────────────────────────────────────

interface Collection {
  id: string;
  name: string;
  recordSlug: string;
  properties: { name: string; type: string }[];
}

interface DataRecord {
  id: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ── Views ────────────────────────────────────────────────────

type View = "setup" | "collections" | "records";

export default function App() {
  const isConfigured =
    import.meta.env.VITE_CENTRALI_WORKSPACE &&
    import.meta.env.VITE_CENTRALI_CLIENT_ID;

  const [view, setView] = useState<View>(isConfigured ? "collections" : "setup");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch collections ──

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const centrali = createCentraliClient();
      const res = await centrali.collections.list();
      setCollections(res.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch collections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isConfigured) fetchCollections();
  }, [isConfigured, fetchCollections]);

  // ── Fetch records for a collection ──

  const openCollection = useCallback(async (col: Collection) => {
    setSelectedCollection(col);
    setView("records");
    setLoading(true);
    setError(null);
    try {
      const centrali = createCentraliClient();
      const res = await centrali.queryRecords(col.recordSlug);
      setRecords(res.data?.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch records");
    } finally {
      setLoading(false);
    }
  }, []);

  const goBack = useCallback(() => {
    setView("collections");
    setSelectedCollection(null);
    setRecords([]);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{"{{projectName}}"}</h1>
            <p className="mt-1 text-sm text-gray-500">
              Powered by{" "}
              <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
                Centrali
              </a>
            </p>
          </div>
          {view === "records" && (
            <button onClick={goBack} className="text-sm text-blue-600 hover:underline">
              &larr; All collections
            </button>
          )}
        </div>

        <div className="mt-8">
          {view === "setup" && <SetupView />}
          {view === "collections" && (
            <CollectionsView
              collections={collections}
              loading={loading}
              error={error}
              onSelect={openCollection}
              onCreated={fetchCollections}
            />
          )}
          {view === "records" && selectedCollection && (
            <RecordsView
              collection={selectedCollection}
              records={records}
              loading={loading}
              error={error}
              onRecordCreated={() => openCollection(selectedCollection)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Setup View ───────────────────────────────────────────────

function SetupView() {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-gray-900">Get started</h2>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-gray-600">
        <li>
          Copy <Code>.env.example</Code> to <Code>.env</Code>
        </li>
        <li>Add your workspace slug, client ID, and client secret</li>
        <li>Restart the dev server</li>
      </ol>
      <p className="mt-4 text-sm text-gray-500">
        Create a service account in the{" "}
        <a href="https://centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
          Centrali console
        </a>
        {" "}&rarr; Settings &rarr; Service Accounts, then add it to the{" "}
        <strong>workspace_administrators</strong> or <strong>workspace_developers</strong> group.
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Once your app is built, you can switch to your own auth provider and pass user tokens instead.
        See the{" "}
        <a href="https://docs.centrali.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener">
          auth provider docs
        </a>
        {" "}for details.
      </p>
    </Card>
  );
}

// ── Collections View ─────────────────────────────────────────

function CollectionsView({
  collections,
  loading,
  error,
  onSelect,
  onCreated,
}: {
  collections: Collection[];
  loading: boolean;
  error: string | null;
  onSelect: (col: Collection) => void;
  onCreated: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  if (loading) return <Card><p className="text-gray-500">Loading collections...</p></Card>;
  if (error) return <ErrorBox message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + New collection
        </button>
      </div>

      {showCreate && (
        <CreateCollectionForm
          onCreated={() => {
            setShowCreate(false);
            onCreated();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {collections.length === 0 && !showCreate ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No collections yet.</p>
            <p className="mt-1 text-sm text-gray-400">
              Create your first collection to start building.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first collection
            </button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3">
          {collections.map((col) => (
            <button
              key={col.id}
              onClick={() => onSelect(col)}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-900">{col.name}</p>
                <p className="text-sm text-gray-500">{col.recordSlug}</p>
              </div>
              <div className="text-sm text-gray-400">
                {col.properties?.length ?? 0} fields &rarr;
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Collection Form ───────────────────────────────────

function CreateCollectionForm({
  onCreated,
  onCancel,
}: {
  onCreated: () => void;
  onCancel: () => void;
}) {
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
      const centrali = createCentraliClient();
      await centrali.collections.create({
        name: name.trim(),
        recordSlug: slug,
        properties: [
          { name: "name", type: "string" },
          { name: "description", type: "string" },
        ],
      } as any);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed to create collection");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
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
          <span className="font-mono">description</span>. You can add more in the console.
        </p>
        {error && <ErrorBox message={error} />}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

// ── Records View ─────────────────────────────────────────────

function RecordsView({
  collection,
  records,
  loading,
  error,
  onRecordCreated,
}: {
  collection: Collection;
  records: DataRecord[];
  loading: boolean;
  error: string | null;
  onRecordCreated: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{collection.name}</h2>
          <p className="text-sm text-gray-500">{records.length} records</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add record
        </button>
      </div>

      {showCreate && (
        <CreateRecordForm
          collection={collection}
          onCreated={() => {
            setShowCreate(false);
            onRecordCreated();
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <Card><p className="text-gray-500">Loading records...</p></Card>
      ) : error ? (
        <ErrorBox message={error} />
      ) : records.length === 0 && !showCreate ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No records yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add your first record
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <Card key={record.id}>
              <div className="flex items-start justify-between">
                <pre className="flex-1 text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(record.data, null, 2)}
                </pre>
                <span className="ml-4 shrink-0 text-xs text-gray-400">
                  {new Date(record.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Create Record Form ───────────────────────────────────────

function CreateRecordForm({
  collection,
  onCreated,
  onCancel,
}: {
  collection: Collection;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const fields = (collection.properties ?? []).filter(
    (p) => !["id", "createdAt", "updatedAt", "createdBy"].includes(p.name),
  );

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
      const centrali = createCentraliClient();
      await centrali.createRecord(collection.recordSlug, data);
      onCreated();
    } catch (err: any) {
      setError(err.message ?? "Failed to create record");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
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
        {error && <ErrorBox message={error} />}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting || fields.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create record"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

// ── Shared Components ────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      {children}
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm">{children}</code>;
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</div>
  );
}
