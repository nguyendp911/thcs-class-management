import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { StatePanel } from '../components/ui/StatePanel';

export interface ModuleField {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'datetime-local' | 'textarea' | 'select';
  options?: string[];
  required?: boolean;
}

export interface ModuleConfig {
  moduleKey: string;
  title: string;
  description: string;
  itemLabel: string;
  icon: LucideIcon;
  tone?: 'lavender' | 'mint' | 'peach' | 'sky' | 'rose' | 'lemon';
  fields: ModuleField[];
  columns: Array<{ key: string; label: string }>;
}

type ModuleRecord = Record<string, unknown> & { id?: number; record_key?: string };

const valueLabels: Record<string, string> = {
  PENDING: 'Chờ duyệt', OPEN: 'Đang mở', IN_PROGRESS: 'Đang xử lý',
  COMPLETED: 'Đã hoàn thành', CLOSED: 'Đã đóng', RESOLVED: 'Đã xử lý',
  APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao',
};

const displayValue = (value: unknown) => valueLabels[String(value ?? '')] || String(value ?? '—');

export const ModulePage: React.FC<{ config: ModuleConfig }> = ({ config }) => {
  const { classId } = useParams();
  const { selectedClass } = useAuth();
  const activeClassId = classId || selectedClass?.id || '';
  const [records, setRecords] = useState<ModuleRecord[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadRecords = useCallback(async () => {
    if (!activeClassId) return;
    setIsLoading(true);
    setError('');
    try {
      const payload = await apiRequest<{ success: true; records: ModuleRecord[] }>(
        `/modules/${config.moduleKey}?class_id=${encodeURIComponent(activeClassId)}`,
      );
      setRecords(payload.records);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải dữ liệu từ MySQL.');
    } finally {
      setIsLoading(false);
    }
  }, [activeClassId, config.moduleKey]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const emptyForm = useMemo(
    () => Object.fromEntries(config.fields.map((field) => [field.key, ''])),
    [config.fields],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setNotice('');
    setIsOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeClassId) return;
    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = await apiRequest<{ success: true; committed: true; records: ModuleRecord[] }>(
        `/modules/${config.moduleKey}`,
        { method: 'POST', body: { class_id: activeClassId, record: form, mode: 'merge' }, expectCommit: true },
      );
      setRecords(payload.records);
      setIsOpen(false);
      setNotice(`Đã lưu ${config.itemLabel.toLowerCase()} sau khi MySQL commit.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể lưu dữ liệu.');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (record: ModuleRecord) => {
    if (!record.id || !activeClassId || !window.confirm(`Xóa ${config.itemLabel.toLowerCase()} này?`)) return;
    setError('');
    setNotice('');
    try {
      await apiRequest(`/modules/${config.moduleKey}?class_id=${encodeURIComponent(activeClassId)}&id=${record.id}`, {
        method: 'DELETE',
        expectCommit: true,
      });
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setNotice('Đã xóa sau khi MySQL commit.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xóa dữ liệu.');
    }
  };

  return (
    <div className="clay-page">
      <PageHeader
        title={config.title}
        description={`${config.description} · ${selectedClass?.name || 'Lớp đang chọn'}`}
        icon={config.icon}
        tone={config.tone}
        action={<Button onClick={openCreate} icon={<Plus size={18} />}>Thêm {config.itemLabel.toLowerCase()}</Button>}
      />

      {notice && <div className="clay-notice clay-notice--success">{notice}</div>}
      {error && <div className="clay-notice clay-notice--error">{error}</div>}

      {isLoading ? (
        <StatePanel variant="loading" title="Đang đọc MySQL" message="Dữ liệu được tải trực tiếp từ máy chủ." />
      ) : records.length === 0 ? (
        <StatePanel
          title={`Chưa có ${config.itemLabel.toLowerCase()}`}
          message="MySQL chưa có bản ghi cho lớp này. Hãy thêm bản ghi đầu tiên."
          action={<Button onClick={openCreate} icon={<Plus size={18} />}>Thêm mới</Button>}
        />
      ) : (
        <section className="clay-card clay-table-card">
          <div className="clay-card__heading">
            <div>
              <span className="clay-eyebrow">MySQL live</span>
              <h2>{config.title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={loadRecords} icon={<RefreshCw size={16} />}>Làm mới</Button>
          </div>
          <div className="clay-table-wrap">
            <table className="clay-table">
              <thead>
                <tr>
                  {config.columns.map((column) => <th key={column.key}>{column.label}</th>)}
                  <th aria-label="Thao tác" />
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={record.id || record.record_key || index}>
                    {config.columns.map((column) => (
                      <td key={column.key}>{displayValue(record[column.key])}</td>
                    ))}
                    <td className="clay-table__actions">
                      <button className="clay-icon-button" onClick={() => remove(record)} aria-label="Xóa">
                        <Trash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`Thêm ${config.itemLabel.toLowerCase()}`}
        footer={<><Button variant="ghost" onClick={() => setIsOpen(false)}>Hủy</Button><Button form="module-form" type="submit" isLoading={isSaving} icon={<Save size={18} />}>Lưu vào MySQL</Button></>}
      >
        <form id="module-form" className="clay-form-grid" onSubmit={submit}>
          {config.fields.map((field) => (
            <label className={field.type === 'textarea' ? 'clay-field clay-field--wide' : 'clay-field'} key={field.key}>
              <span>{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea required={field.required} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
              ) : field.type === 'select' ? (
                <select required={field.required} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}>
                  <option value="">Chọn…</option>
                  {field.options?.map((option) => <option key={option} value={option}>{valueLabels[option] || option}</option>)}
                </select>
              ) : (
                <input type={field.type || 'text'} required={field.required} value={form[field.key] || ''} onChange={(e) => setForm({ ...form, [field.key]: e.target.value })} />
              )}
            </label>
          ))}
        </form>
      </Modal>
    </div>
  );
};
