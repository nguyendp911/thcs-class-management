// Centralized Direct MySQL & LocalStorage Database Persistence Utility for THCS Web App

export const saveToDb = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('thcs_db_updated', { detail: { key, data } }));
  } catch (e) {}

  // Direct MySQL storage on server
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
      Object.keys(json.data).forEach(key => {
        try {
          localStorage.setItem(key, JSON.stringify(json.data[key]));
        } catch (e) {}
      });
      window.dispatchEvent(new Event('thcs_db_updated'));
      return json.data;
    }
  } catch (e) {}
  return {};
};
