// Centralized Direct MySQL Database Persistence Utility for THCS Web App

export const saveToDb = (key: string, data: any) => {
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
    if (json && json.data) {
      return json.data;
    }
  } catch (e) {}
  return {};
};
