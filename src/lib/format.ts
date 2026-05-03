export function formatDate(value?: string | number | null, options?: Intl.DateTimeFormatOptions) {
  if (!value) {
    return '--';
  }

  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    ...options,
  }).format(date);
}

export function formatDateTime(value?: string | number | null) {
  return formatDate(value, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatBytes(bytes?: number | null) {
  if (!bytes || bytes <= 0) {
    return '--';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unit = 0;

  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }

  return `${size.toFixed(size >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function compactNumber(value: number) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function initialsFromName(name?: string | null) {
  if (!name) {
    return 'MA';
  }

  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || 'MA';
}

export function relativeStatusLabel(status: string) {
  const labels: Record<string, string> = {
    uploaded: 'Uploaded',
    queued: 'Queued',
    indexing: 'Indexing',
    parsing: 'Parsing',
    chunking: 'Chunking',
    embedding: 'Embedding',
    vector_upserting: 'Vectorizing',
    completed: 'Completed',
    indexed: 'Indexed',
    failed: 'Failed',
    canceled: 'Canceled',
  };

  return labels[status] ?? status;
}
