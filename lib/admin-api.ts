const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/api';
export const API_BASE_URL = configuredBase.replace(/\/$/, '');

export class AdminApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'AdminApiError';
  }
}

type ProblemDetails = {
  message?: string;
  title?: string;
  errors?: Record<string, string[]>;
};

export async function adminApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      cache: 'no-store',
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers
      }
    });
  } catch {
    throw new AdminApiError(`Không kết nối được API tại ${API_BASE_URL}.`, 0);
  }

  if (!response.ok) {
    const details = (await response.json().catch(() => ({}))) as ProblemDetails;
    const validation = details.errors && Object.values(details.errors).flat()[0];
    const fallback = response.status === 401
      ? 'Phiên quản trị đã hết hạn. Hãy đăng nhập lại.'
      : `Yêu cầu thất bại (${response.status}).`;
    throw new AdminApiError(details.message ?? validation ?? details.title ?? fallback, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
