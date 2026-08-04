let csrfToken = '';

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

export const setCsrfToken = (token?: string | null) => {
  csrfToken = token || '';
};

type ApiOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  expectCommit?: boolean;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(options.body);
  }
  if (method !== 'GET' && method !== 'HEAD' && csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  const response = await fetch('/thcs/api' + path, {
    ...options,
    method,
    headers,
    body,
    credentials: 'include',
    cache: 'no-store',
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();
  if (!isJson) {
    throw new ApiError('Máy chủ trả về dữ liệu không đúng định dạng JSON', response.status, payload);
  }
  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload && 'error' in payload
        ? String((payload as { error: unknown }).error)
        : 'API ' + response.status;
    throw new ApiError(message, response.status, payload);
  }

  const requiresCommit = options.expectCommit ?? !['GET', 'HEAD'].includes(method);
  if (
    requiresCommit &&
    typeof payload === 'object' &&
    payload &&
    'success' in payload &&
    (payload as { success: boolean }).success &&
    (payload as { committed?: boolean }).committed !== true
  ) {
    throw new ApiError('Máy chủ chưa xác nhận transaction MySQL đã commit', 500, payload);
  }
  return payload as T;
}

export async function uploadBlob(
  file: Blob,
  filename: string,
  entityType: string,
  entityId: string,
): Promise<{ success: true; committed: true; asset_id: string; url: string }> {
  const form = new FormData();
  form.append('file', file, filename);
  form.append('entity_type', entityType);
  form.append('entity_id', entityId);
  return apiRequest('/binary', { method: 'POST', body: form, expectCommit: true });
}
