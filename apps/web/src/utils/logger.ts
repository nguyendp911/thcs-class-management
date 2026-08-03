export interface SystemLogEntry {
  id: number | string;
  user_id?: string;
  user_name: string;
  user_role: string;
  action_type: 'ĐĂNG NHẬP' | 'TÀI KHOẢN' | 'ĐIỂM DANH' | 'THI ĐUA' | 'ĐIỂM SỐ' | 'CẤU HÌNH' | 'HỌC SINH' | 'BẢNG TIN' | 'ĐƠN XIN NGHĨ' | 'HỆ THỐNG';
  description: string;
  class_id?: string;
  ip_address?: string;
  created_at: string;
}

export const logActivity = async (
  user_name: string,
  user_role: string,
  action_type: SystemLogEntry['action_type'],
  description: string,
  class_id?: string,
  user_id?: string
) => {
  const newLog: SystemLogEntry = {
    id: Date.now(),
    user_id: user_id || '',
    user_name: user_name || 'Hệ thống',
    user_role: user_role || 'system',
    action_type,
    description,
    class_id: class_id || '',
    created_at: new Date().toLocaleString('vi-VN'),
  };

  // 1. Save to LocalStorage
  try {
    const existing = localStorage.getItem('thcs_activity_logs');
    const logs: SystemLogEntry[] = existing ? JSON.parse(existing) : [];
    const updated = [newLog, ...logs].slice(0, 1000); // Keep latest 1000 logs
    localStorage.setItem('thcs_activity_logs', JSON.stringify(updated));
  } catch (e) {}

  // 2. Post to MySQL API
  try {
    fetch('/thcs/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id,
        user_name,
        user_role,
        action_type,
        description,
        class_id,
      }),
    }).catch(() => {});
  } catch (e) {}
};

export const fetchSystemLogs = async (): Promise<SystemLogEntry[]> => {
  try {
    const res = await fetch('/thcs/api/logs');
    const data = await res.json();
    if (data.success && Array.isArray(data.logs) && data.logs.length > 0) {
      return data.logs;
    }
  } catch (e) {}

  // Fallback to LocalStorage
  try {
    const existing = localStorage.getItem('thcs_activity_logs');
    if (existing) return JSON.parse(existing);
  } catch (e) {}

  return [];
};

export const clearSystemLogs = async (): Promise<boolean> => {
  try {
    localStorage.removeItem('thcs_activity_logs');
    await fetch('/thcs/api/logs', { method: 'DELETE' });
    return true;
  } catch (e) {
    return false;
  }
};
