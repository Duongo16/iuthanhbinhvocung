import { API_BASE_URL } from './admin-api';
import { rememberDateEventId } from './date-event-ids';
import type { ComboDate, CoupleProfile, DateEvent, Location, Voucher } from './types';

export class WizardApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'WizardApiError';
  }
}

type ApiProblem = { message?: string; title?: string; errors?: Record<string, string[]> };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers }
    });
  } catch {
    throw new WizardApiError(`Không kết nối được API tại ${API_BASE_URL}.`, 0);
  }

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as ApiProblem;
    const fieldError = problem.errors && Object.values(problem.errors).flat()[0];
    const message = problem.message === 'Chọn đúng một địa điểm hoặc một combo.'
      ? 'API đang chạy phiên bản cũ, chưa hỗ trợ lộ trình nhiều điểm dừng. Hãy cập nhật và khởi động lại backend.'
      : problem.message ?? fieldError ?? problem.title ?? `Yêu cầu thất bại (${response.status}).`;
    throw new WizardApiError(
      message,
      response.status
    );
  }
  return response.json() as Promise<T>;
}

export type WizardCatalog = {
  locations: Location[];
  combos: ComboDate[];
  vouchers: Voucher[];
  profile: CoupleProfile | null;
};

export type DateInvitation = {
  inviterName: string;
  date: string;
  time: string;
  pickupLocation: string;
  dresscode: string;
  message: string;
  locationId: string | null;
  comboId: string | null;
  roadmapLocationIds: string[];
  appliedVouchers: string[];
};

export type InvitationResult = { dateEvent: DateEvent; emailSent: boolean };

export async function loadWizardCatalog(): Promise<WizardCatalog> {
  const [locations, combos, vouchers, profile] = await Promise.all([
    request<Location[]>('/locations'),
    request<ComboDate[]>('/combo-dates'),
    request<Voucher[]>('/vouchers'),
    request<CoupleProfile>('/couple-profile').catch((error: unknown) => {
      if (error instanceof WizardApiError && error.status === 404) return null;
      throw error;
    })
  ]);
  return { locations, combos, vouchers, profile };
}

export async function sendInvitation(payload: DateInvitation) {
  const result = await request<InvitationResult>('/date-events', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  rememberDateEventId(result.dateEvent.id);
  return result;
}

export function rejectInvitation(payload: DateInvitation) {
  return request<DateEvent>('/date-events/reject', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
