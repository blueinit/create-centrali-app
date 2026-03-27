module.exports = async (ctx) => {
  console.log("[generate-report] Generating hourly report...");

  // Count processed items by status
  const completed = await api.queryRecords("processed-items", {
    "data.status": "completed",
    pageSize: 1,
    includeTotal: true,
  });
  const failed = await api.queryRecords("processed-items", {
    "data.status": "failed",
    pageSize: 1,
    includeTotal: true,
  });
  const pending = await api.queryRecords("processed-items", {
    "data.status": "pending",
    pageSize: 1,
    includeTotal: true,
  });

  const completedCount = completed?.meta?.total ?? 0;
  const failedCount = failed?.meta?.total ?? 0;
  const pendingCount = pending?.meta?.total ?? 0;

  // Count recent logs (last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const recentLogs = await api.queryRecords("job-logs", {
    "createdAt[gte]": oneHourAgo,
    pageSize: 1,
    includeTotal: true,
  });
  const logsLastHour = recentLogs?.meta?.total ?? 0;

  const report = {
    completed: completedCount,
    failed: failedCount,
    pending: pendingCount,
    logsLastHour,
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

  console.log("[generate-report] Report:", report);

  return { success: true, report };
};
