import { API_BASE_URL } from './admin-api';
import { knownDateEventIds, rememberDateEventId } from './date-event-ids';
import type { ComboDate, CoupleProfile, DateEvent, Location } from './types';

export class MemoriesApiError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
    this.name = 'MemoriesApiError';
  }
}

type ProblemDetails = { message?: string; title?: string; errors?: Record<string, string[]> };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: 'no-store',
      headers: {
        ...(init.body instanceof FormData ? {} : init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new MemoriesApiError(`Không kết nối được API tại ${API_BASE_URL}.`);
  }

  if (!response.ok) {
    const details = (await response.json().catch(() => ({}))) as ProblemDetails;
    const validation = details.errors && Object.values(details.errors).flat()[0];
    const message = details.message === 'Chọn đúng một địa điểm hoặc một combo.'
      ? 'API đang chạy phiên bản cũ, chưa hỗ trợ lộ trình nhiều điểm dừng. Hãy cập nhật và khởi động lại backend.'
      : details.message ?? validation ?? details.title ?? `Yêu cầu thất bại (${response.status}).`;
    throw new MemoriesApiError(message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export type MemoriesCatalog = {
  completed: DateEvent[];
  upcoming: DateEvent[];
  planned: DateEvent[];
  profile: CoupleProfile | null;
  locations: Location[];
  combos: ComboDate[];
};

export function getDateEvent(id: string): Promise<DateEvent> {
  return request<DateEvent>(`/date-events/${id}`);
}

async function loadPlannedEvents(): Promise<DateEvent[]> {
  try {
    return await request<DateEvent[]>('/date-events/planned');
  } catch (error) {
    const oldApi = error instanceof MemoriesApiError &&
      (error.status === 404 || (error.status === 400 && error.message === 'ID không hợp lệ.'));
    if (!oldApi) throw error;
    try {
      return await request<DateEvent[]>('/date-events?status=Pending,Accepted,Reschedule', { credentials: 'include' });
    } catch (adminError) {
      if (!(adminError instanceof MemoriesApiError) || adminError.status !== 401) throw adminError;
    }
    const events = await Promise.all(knownDateEventIds().map((id) => getDateEvent(id).catch((cause: unknown) => {
      if (cause instanceof MemoriesApiError && cause.status === 404) return null;
      throw cause;
    })));
    return events.filter((event): event is DateEvent => event !== null);
  }
}

export async function loadMemoriesCatalog(): Promise<MemoriesCatalog> {
  if (typeof window !== 'undefined') {
    const eventId = new URLSearchParams(window.location.search).get('eventId');
    if (eventId) rememberDateEventId(eventId);
  }
  const profilePromise = request<CoupleProfile>('/couple-profile').catch((error: unknown) => {
    if (error instanceof MemoriesApiError && error.status === 404) return null;
    throw error;
  });
  const [completed, upcoming, planned, profile, locations, combos] = await Promise.all([
    request<DateEvent[]>('/date-events/completed'),
    request<DateEvent[]>('/date-events/upcoming'),
    loadPlannedEvents(),
    profilePromise,
    request<Location[]>('/locations'),
    request<ComboDate[]>('/combo-dates'),
  ]);
  const visiblePlans = Array.from(new Map([...upcoming, ...planned].map((event): [string, DateEvent] => [event.id, event])).values())
    .filter((event) => ['Pending', 'Accepted', 'Reschedule'].includes(event.status))
    .sort((a, b) => a.date.localeCompare(b.date));
  return { completed, upcoming, planned: visiblePlans, profile, locations, combos };
}

export async function uploadMemoryImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append('file', file);
  return request<{ url: string }>('/uploads/image', { method: 'POST', body });
}

export async function updateMemories(
  eventId: string,
  payload: { photos: string[]; reviewText: string; emoji: string },
): Promise<DateEvent> {
  return request<DateEvent>(`/date-events/${eventId}/memories`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export type ReschedulePayload = {
  date: string;
  time: string;
  locationId?: string;
  comboId?: string;
  roadmapLocationIds?: string[];
  reason: string;
};

export async function rescheduleEvent(eventId: string, payload: ReschedulePayload): Promise<DateEvent> {
  return request<{ dateEvent: DateEvent }>(`/date-events/${eventId}/reschedule`, {
    method: 'PUT',
    body: JSON.stringify({ ...payload, date: `${payload.date}T00:00:00.000Z` }),
  }).then((result) => result.dateEvent);
}
