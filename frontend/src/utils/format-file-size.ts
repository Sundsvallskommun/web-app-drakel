/** Formats a byte count as a human-readable size ("820 B", "12 kB", "1.4 MB"). */
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} kB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
