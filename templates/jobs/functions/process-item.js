async function run() {
  const event = executionParams;
  const itemId = event?.recordId;
  const itemData = event?.data;

  api.log({
    message: "Processing item",
    id: itemId,
    title: itemData?.title,
    type: itemData?.type,
    priority: itemData?.priority,
  });

  // Log the start of processing
  await api.createRecord("job-logs", {
    functionName: "process-item",
    level: "info",
    message: `Processing item: ${itemData?.title ?? "unknown"}`,
    metadata: JSON.stringify({ itemId, type: itemData?.type }),
    createdAt: new Date().toISOString(),
  });

  // Update the item status to "completed"
  if (itemId) {
    await api.updateRecord(itemId, {
      status: "completed",
      processedAt: new Date().toISOString(),
      resultSummary: `Processed ${itemData?.type ?? "item"} successfully`,
    });
  }

  // Log completion
  await api.createRecord("job-logs", {
    functionName: "process-item",
    level: "info",
    message: `Completed: ${itemData?.title ?? "unknown"}`,
    createdAt: new Date().toISOString(),
  });

  return { success: true, itemId, status: "completed" };
}
