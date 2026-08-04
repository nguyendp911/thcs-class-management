// Centralized Direct MySQL Database Persistence Utility for THCS Web App (NO LOCALSTORAGE)

export const saveToDb = (key: string, data: any) => {
  window.dispatchEvent(new CustomEvent('thcs_db_updated', { detail: { key, data } }));

  // Direct MySQL storage on host server
  fetch('/thcs/api/system-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, value: data }),
  }).catch(() => {});
};

export const syncAllFromDb = async (): Promise<Record<string, any>> => {
  try {
    const res = await fetch('/thcs/api/system-data');
    if (!res.ok) return {};
    const json = await res.json();
    if (json && json.data && typeof json.data === 'object') {
      window.dispatchEvent(new Event('thcs_db_updated'));
      return json.data;
    }
  } catch (e) {}
  return {};
};
