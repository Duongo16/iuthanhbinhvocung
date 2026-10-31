export function todayInVietnam(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function vietnamTimeNow(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.hour}:${value.minute}`;
}

export function formatDateVietnam(date: string): string {
  const datePart = date.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return date;
  const [year, month, day] = datePart.split('-').map(Number);
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatCost(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(value);
}

export function tiktokPlayerUrl(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:' || !['www.tiktok.com', 'tiktok.com', 'm.tiktok.com'].includes(url.hostname)) return null;
    const match = url.pathname.match(/\/(?:video|player\/v1)\/(\d{10,25})(?:\/|$)/);
    return match ? `https://www.tiktok.com/player/v1/${match[1]}?description=1&music_info=1` : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(link: string): string | null {
  try {
    const url = new URL(link);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    const id = host === 'youtu.be' ? url.pathname.slice(1) :
      ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host) ?
        (url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1]) : null;
    return id && /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  } catch {
    return null;
  }
}

export function safeWebUrl(link: string): string | null {
  try {
    const url = new URL(link);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
