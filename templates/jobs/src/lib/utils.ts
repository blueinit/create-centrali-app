export function formatDuration(startedAt: string, endedAt?: string | null): string {
  if (!endedAt) return "running...";
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function statusColor(status: string): string {
  switch (status) {
    case "completed": return "bg-green-100 text-green-700";
    case "failure": return "bg-red-100 text-red-700";
    case "running": return "bg-blue-100 text-blue-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "timeout": return "bg-orange-100 text-orange-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export function executionSourceLabel(source: string): string {
  switch (source) {
    case "trigger": return "Event";
    case "scheduled": return "Scheduled";
    case "manual": return "Manual";
    case "rerun": return "Rerun";
    default: return source;
  }
}
