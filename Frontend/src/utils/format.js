export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function formatStatus(status) {
  if (!status) return '';
  return status.replace(/([A-Z])/g, ' $1').trim();
}
