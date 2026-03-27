async function run() {
  api.log({ message: "Starting cleanup of old logs" });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find old log entries using dateWindow for the createdAt system field
  const oldLogs = await api.queryRecords("job-logs", {
    dateWindow: {
      field: "createdAt",
      to: sevenDaysAgo,
    },
    pageSize: 100,
  });

  const records = oldLogs?.items ?? [];
  let deletedCount = 0;

  for (const record of records) {
    try {
      await api.deleteRecord(record.id, true);
      deletedCount++;
    } catch (err) {
      api.log({ message: `Failed to delete ${record.id}`, error: err.message });
    }
  }

  // Log the cleanup result
  await api.createRecord("job-logs", {
    functionName: "cleanup-old-logs",
    level: "info",
    message: `Cleanup complete: deleted ${deletedCount} old log entries`,
    metadata: JSON.stringify({ deletedCount, cutoffDate: sevenDaysAgo }),
    createdAt: new Date().toISOString(),
  });

  api.log({ message: `Deleted ${deletedCount} records` });

  return { success: true, deletedCount };
}
