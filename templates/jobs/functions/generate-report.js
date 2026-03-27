async function run() {
  api.log({ message: "Generating hourly report" });

  // Count processed items by status
  const completed = await api.queryRecords("processed-items", {
    filter: { "data.status": "completed" },
    pageSize: 1,
    includeTotal: true,
  });
  const failed = await api.queryRecords("processed-items", {
    filter: { "data.status": "failed" },
    pageSize: 1,
    includeTotal: true,
  });
  const pending = await api.queryRecords("processed-items", {
    filter: { "data.status": "pending" },
    pageSize: 1,
    includeTotal: true,
  });

  const completedCount = completed?.total ?? 0;
  const failedCount = failed?.total ?? 0;
  const pendingCount = pending?.total ?? 0;

  const report = {
    completed: completedCount,
    failed: failedCount,
    pending: pendingCount,
    generatedAt: new Date().toISOString(),
  };

  // Write report to job-logs
  await api.createRecord("job-logs", {
    functionName: "generate-report",
    level: "info",
    message: `Hourly report: ${completedCount} completed, ${failedCount} failed, ${pendingCount} pending`,
    metadata: JSON.stringify(report),
    createdAt: new Date().toISOString(),
  });

  api.log({ message: "Report generated", report });

  return { success: true, report };
}
