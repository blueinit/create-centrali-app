module.exports = async (ctx) => {
  console.log("[cleanup-old-logs] Starting cleanup...");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Find old log entries
  const oldLogs = await api.queryRecords("job-logs", {
    "createdAt[lte]": sevenDaysAgo,
    pageSize: 100,
  });

  const records = oldLogs?.data ?? [];
  let deletedCount = 0;

  for (const record of records) {
    try {
      await api.deleteRecord(record.id, true);
      deletedCount++;
    } catch (err) {
      console.warn(`[cleanup-old-logs] Failed to delete ${record.id}:`, err.message);
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

  console.log(`[cleanup-old-logs] Deleted ${deletedCount} records`);

  return { success: true, deletedCount };
};
