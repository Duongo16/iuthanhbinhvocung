'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, Cloud,
  Heart, LayoutDashboard, LockKeyhole, LogOut, MapPin, Menu, Pencil,
  Plus, RotateCcw, Search, ShieldCheck, Sparkles, Star, Ticket,
  Trash2, X, type LucideIcon
} from 'lucide-react';
import AdminEditor, { type EditorState } from './AdminEditor';
import ProfilePanel from './ProfilePanel';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import type { ComboDate, CoupleProfile, DateEvent, DateEventStatus, Location, Voucher } from '@/lib/types';

type Section = 'overview' | 'locations' | 'combos' | 'vouchers' | 'events' | 'profile';
type CatalogKind = 'locations' | 'combos' | 'vouchers';
type DashboardData = { locations: Location[]; combos: ComboDate[]; vouchers: Voucher[]; events: DateEvent[]; profile: CoupleProfile | null };
type DeleteTarget = { kind: CatalogKind; id: string; name: string };

const emptyData: DashboardData = { locations: [], combos: [], vouchers: [], events: [], profile: null };
const sidebarItems: { key: Section; label: string; icon: LucideIcon }[] = [
  { key: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
  { key: 'locations', label: 'Địa điểm', icon: MapPin },
  { key: 'combos', label: 'Date Combos', icon: Sparkles },
  { key: 'vouchers', label: 'Vouchers', icon: Ticket },
  { key: 'events', label: 'Lịch hẹn', icon: CalendarDays },
  { key: 'profile', label: 'Hồ sơ cặp đôi', icon: Heart }
];
const sectionTitles: Record<Section, { title: string; subtitle: string }> = {
  overview: { title: 'Góc nhỏ của nàng ✨', subtitle: 'Một nơi để chăm chút từng buổi hẹn thật xinh.' },
  locations: { title: 'Địa điểm trong mơ', subtitle: 'Những nơi đáng yêu đang chờ được khám phá.' },
  combos: { title: 'Date Combos', subtitle: 'Ghép những điểm dừng thành một hành trình trọn vẹn.' },
  vouchers: { title: 'Kho đặc quyền', subtitle: 'Một chút chiều chuộng cho Princess Mode.' },
  events: { title: 'Những lá thư hẹn', subtitle: 'Theo dõi lời mời, phản hồi và buổi hẹn sắp tới.' },
  profile: { title: 'Vũ trụ của hai người', subtitle: 'Tên gọi và những bức ảnh sẽ xuất hiện trong nhật ký kỷ niệm.' }
};
const statusNames: Record<DateEventStatus, string> = {
  Pending: 'Chờ duyệt', Accepted: 'Đã duyệt', Reschedule: 'Muốn đổi lịch',
  Rejected: 'Từ chối', Completed: 'Đã hoàn thành'
};
const statusStyles: Record<DateEventStatus, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  Accepted: 'bg-emerald-100 text-emerald-800',
  Reschedule: 'bg-sky-100 text-sky-800',
  Rejected: 'bg-rose-100 text-rose-800',
  Completed: 'bg-violet-100 text-violet-800'
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(new Date(value));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

function LoginScreen({ onLogin }: { onLogin: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onLogin(password);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-8">
      <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} className="grid w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/75 bg-white/70 shadow-[0_25px_70px_rgba(78,67,130,0.18)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#9d91cb] via-[#cbb5dd] to-[#f4cade] p-8 text-white sm:p-12 lg:min-h-[620px]">
          <div className="absolute -right-20 top-20 h-80 w-80 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-[#fff0b0]/30 blur-xl" />
          <div className="relative z-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/40 bg-white/15 px-4 py-2 text-sm font-bold backdrop-blur-sm"><Star className="h-4 w-4 fill-current" /> TWINKLE TWINKLE</div>
          <div className="relative z-10 mx-auto flex h-44 w-44 items-center justify-center sm:h-56 sm:w-56">
            <div className="absolute h-40 w-40 animate-float rounded-full bg-[#fff1b1] shadow-[0_0_55px_rgba(255,245,191,0.85)] sm:h-48 sm:w-48" />
            <Cloud className="absolute -bottom-3 -left-12 h-24 w-24 fill-white/95 text-white/95 sm:h-32 sm:w-32" />
            <Cloud className="absolute -bottom-6 right-[-3rem] h-28 w-28 fill-white/90 text-white/90 sm:h-36 sm:w-36" />
            <Heart className="relative z-10 h-16 w-16 animate-twinkle fill-[#f497bd] text-[#f497bd]" />
            <Sparkles className="absolute -right-12 top-4 h-10 w-10 animate-twinkle text-[#fff9cf]" />
            <Star className="absolute -left-10 top-10 h-6 w-6 animate-twinkle fill-white" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/80">Princess Studio</p>
            <h1 className="mt-3 max-w-sm text-3xl font-bold leading-tight sm:text-4xl">Mỗi cuộc hẹn đều bắt đầu bằng một chút phép màu.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/85">Lưu lại địa điểm, những combo đáng yêu và các đặc quyền chỉ dành cho hai người.</p>
          </div>
        </div>
        <div className="flex flex-col justify-center px-8 py-12 sm:px-14">
          <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-twinkle-pink text-twinkle-ink shadow-cloud"><LockKeyhole className="h-6 w-6" /></div>
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-twinkle-muted">Chỉ dành cho người đặc biệt</p>
          <h2 className="mt-3 text-3xl font-bold">Xin chào, công chúa! 👑</h2>
          <p className="mt-3 text-sm leading-6 text-twinkle-muted">Nhập mật khẩu để mở khu vườn quản lý lịch hẹn.</p>
          <form onSubmit={submit} className="mt-9 space-y-5">
            <label className="block text-sm font-bold">Mật khẩu quản trị
              <span className="relative mt-2 block">
                <input autoFocus required type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-2xl border border-[#e4dff0] bg-white px-5 py-4 pr-20 font-semibold outline-none focus:border-twinkle-lavender focus:ring-4 focus:ring-twinkle-lavender/20" placeholder="••••••••••••" />
                <button type="button" onClick={() => setVisible(!visible)} className="absolute inset-y-1 right-2 rounded-xl px-3 text-xs font-bold text-twinkle-muted hover:bg-twinkle-sky/40">{visible ? 'Ẩn' : 'Hiện'}</button>
              </span>
            </label>
            {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
            <button disabled={busy} className="magic-button flex w-full items-center justify-center gap-2 rounded-full bg-twinkle-ink px-6 py-4 font-bold text-white shadow-cloud hover:-translate-y-1 hover:shadow-glow disabled:opacity-60">{busy ? 'Đang mở cửa...' : 'Vào Princess Studio'} <ArrowRight className="h-5 w-5" /></button>
          </form>
          <Link href="/" className="mt-8 text-center text-sm font-bold text-twinkle-muted hover:text-twinkle-ink">← Quay về trang chủ</Link>
          <p className="mt-10 flex items-center justify-center gap-2 text-xs font-semibold text-twinkle-muted"><ShieldCheck className="h-4 w-4" /> Khu vực quản trị riêng tư</p>
        </div>
      </motion.div>
    </main>
  );
}

function EmptyState({ icon: Icon, title, description, action, onAction }: { icon: LucideIcon; title: string; description: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[2rem] border border-dashed border-[#d9d1e8] bg-white/55 px-6 py-10 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-twinkle-sky/60"><Icon className="h-7 w-7 text-[#7770aa]" /></div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-twinkle-muted">{description}</p>
      {action && onAction && <button onClick={onAction} className="mt-5 inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-2.5 text-sm font-bold text-white hover:shadow-glow"><Plus className="h-4 w-4" />{action}</button>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, right }: { eyebrow: string; title: string; right?: ReactNode }) {
  return <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#9b83b5]">{eyebrow}</p><h2 className="mt-2 text-xl font-bold sm:text-2xl">{title}</h2></div>{right}</div>;
}

function ActionIcon({ label, icon: Icon, onClick, danger = false, disabled = false }: { label: string; icon: LucideIcon; onClick: () => void; danger?: boolean; disabled?: boolean }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-white/85 shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-twinkle-ink hover:bg-twinkle-sky/40'}`}><Icon className="h-4 w-4" /></button>;
}

export default function AdminDashboard() {
  const [auth, setAuth] = useState<'checking' | 'locked' | 'ready'>('checking');
  const [section, setSection] = useState<Section>('overview');
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState('');
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<DateEventStatus | 'All'>('All');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [detailEvent, setDetailEvent] = useState<DateEvent | null>(null);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoadingData(true);
    try {
      const [locations, combos, vouchers, events, profile] = await Promise.all([
        adminApi<Location[]>('/locations'),
        adminApi<ComboDate[]>('/combo-dates'),
        adminApi<Voucher[]>('/vouchers'),
        adminApi<DateEvent[]>('/date-events'),
        adminApi<CoupleProfile>('/couple-profile').catch((cause) => {
          if (cause instanceof AdminApiError && cause.status === 404) return null;
          throw cause;
        })
      ]);
      setData({ locations, combos, vouchers, events, profile });
      setDataError('');
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) setAuth('locked');
      else setDataError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    adminApi('/admin/auth/me')
      .then(() => { if (active) { setAuth('ready'); void refresh(); } })
      .catch(() => { if (active) setAuth('locked'); });
    return () => { active = false; };
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!deleteTarget && !detailEvent) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDeleteTarget(null);
        setDetailEvent(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [deleteTarget, detailEvent]);

  async function login(password: string) {
    await adminApi('/admin/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
    setAuth('ready');
    void refresh();
  }

  async function logout() {
    try {
      await adminApi('/admin/auth/logout', { method: 'POST' });
      setAuth('locked');
      setData(emptyData);
      setEditor(null);
    } catch (cause) { notifyError(cause); }
  }

  function notifyError(cause: unknown) {
    if (cause instanceof AdminApiError && cause.status === 401) setAuth('locked');
    setToast(cause instanceof Error ? cause.message : 'Có lỗi xảy ra.');
  }

  async function saveEditor(payload: Record<string, unknown>) {
    if (!editor) return;
    const endpoint = editor.kind === 'combos' ? '/combo-dates' : `/${editor.kind}`;
    const itemId = editor.item?.id;
    try {
      await adminApi(`${endpoint}${itemId ? `/${itemId}` : ''}`, {
        method: itemId ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      setEditor(null);
      setToast(itemId ? 'Đã cập nhật thành công ✨' : 'Đã thêm vào khu vườn hẹn hò ✨');
      void refresh();
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) setAuth('locked');
      throw cause;
    }
  }

  async function saveProfile(payload: Record<string, unknown>) {
    try {
      await adminApi('/couple-profile', { method: 'PUT', body: JSON.stringify(payload) });
      setToast('Đã lưu hồ sơ của hai người 💖');
      void refresh();
    } catch (cause) {
      if (cause instanceof AdminApiError && cause.status === 401) setAuth('locked');
      throw cause;
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setActionBusy(true);
    try {
      const endpoint = deleteTarget.kind === 'combos' ? '/combo-dates' : `/${deleteTarget.kind}`;
      await adminApi(`${endpoint}/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      setToast('Đã xóa mục này khỏi danh sách.');
      void refresh();
    } catch (cause) { notifyError(cause); }
    finally { setActionBusy(false); }
  }

  async function eventAction(event: DateEvent, action: 'resend' | 'complete') {
    setActionBusy(true);
    try {
      await adminApi(`/date-events/${event.id}/${action}`, { method: 'POST' });
      setToast(action === 'resend' ? 'Đã gửi lại thư mời 💌' : 'Buổi hẹn đã vào nhật ký kỷ niệm 💫');
      setDetailEvent(null);
      void refresh();
    } catch (cause) { notifyError(cause); }
    finally { setActionBusy(false); }
  }

  const pendingCount = data.events.filter((item) => item.status === 'Pending').length;
  const needsAttention = data.events.filter((item) => item.status === 'Pending' || item.status === 'Rejected' || item.status === 'Reschedule');
  const title = sectionTitles[section];
  const query = search.trim().toLocaleLowerCase('vi-VN');
  const visibleLocations = useMemo(() => data.locations.filter((item) => `${item.name} ${item.category} ${item.area} ${item.address} ${item.notes}`.toLocaleLowerCase('vi-VN').includes(query)), [data.locations, query]);
  const visibleCombos = useMemo(() => data.combos.filter((item) => `${item.title} ${item.description}`.toLocaleLowerCase('vi-VN').includes(query)), [data.combos, query]);
  const visibleVouchers = useMemo(() => data.vouchers.filter((item) => `${item.name} ${item.description}`.toLocaleLowerCase('vi-VN').includes(query)), [data.vouchers, query]);
  const visibleEvents = useMemo(() => data.events.filter((item) =>
    (eventFilter === 'All' || item.status === eventFilter) &&
    `${item.inviterName} ${item.dresscode} ${item.message}`.toLocaleLowerCase('vi-VN').includes(query)
  ), [data.events, eventFilter, query]);

  function openSection(next: Section) {
    setSection(next);
    setSearch('');
    setSidebarOpen(false);
  }

  function destination(event: DateEvent) {
    if (event.roadmapLocationIds?.length) return event.roadmapLocationIds.map((id) => data.locations.find((item) => item.id === id)?.name ?? 'Điểm dừng đã xóa').join(' → ');
    if (event.locationId) return data.locations.find((item) => item.id === event.locationId)?.name ?? 'Địa điểm đã xóa';
    return data.combos.find((item) => item.id === event.comboId)?.title ?? 'Combo đã xóa';
  }

  function eventRows(events: DateEvent[], compact = false) {
    if (events.length === 0) return <EmptyState icon={CalendarDays} title="Chưa có lá thư nào" description="Khi có buổi hẹn mới, bạn sẽ thấy thông tin ở đây." />;
    return <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-cloud backdrop-blur-md">
      {events.map((event, index) => (
        <div key={event.id} className={`flex flex-wrap items-center gap-4 px-5 py-4 sm:px-6 ${index > 0 ? 'border-t border-[#ede9f2]' : ''}`}>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-twinkle-pink/70 text-lg">💌</div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm sm:text-base">{event.inviterName}</strong><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusStyles[event.status]}`}>{statusNames[event.status]}</span></div>
            <p className="mt-1 truncate text-xs font-semibold text-twinkle-muted">{destination(event)} · {formatDate(event.date)} lúc {event.time}</p>
          </div>
          {!compact && <span className="hidden max-w-28 truncate rounded-full bg-twinkle-sky/35 px-3 py-1.5 text-xs font-bold text-twinkle-muted lg:block">{event.dresscode}</span>}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {event.status === 'Pending' && <ActionIcon label="Gửi lại thư" icon={RotateCcw} disabled={actionBusy} onClick={() => void eventAction(event, 'resend')} />}
            {event.status === 'Accepted' && <ActionIcon label="Đánh dấu hoàn thành" icon={Check} disabled={actionBusy} onClick={() => void eventAction(event, 'complete')} />}
            <button onClick={() => setDetailEvent(event)} className="inline-flex h-9 items-center gap-1 rounded-full bg-twinkle-lavender/35 px-3 text-xs font-bold hover:bg-twinkle-lavender/65">Chi tiết <ChevronRight className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ))}
    </div>;
  }

  if (auth === 'checking') return <div className="relative z-10 flex min-h-screen items-center justify-center"><div className="rounded-[2rem] bg-white/80 px-10 py-8 text-center shadow-cloud"><Sparkles className="mx-auto h-8 w-8 animate-twinkle text-[#9b83b5]" /><p className="mt-3 font-bold">Đang mở Princess Studio...</p></div></div>;
  if (auth === 'locked') return <LoginScreen onLogin={login} />;

  return (
    <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] gap-0 p-3 sm:p-5 lg:gap-5 lg:p-6">
      {sidebarOpen && <button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-[#26213e]/45 lg:hidden" />}
      <aside className={`fixed bottom-3 left-3 top-3 z-40 flex w-64 flex-col rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-cloud backdrop-blur-xl transition-transform lg:sticky lg:top-6 lg:z-auto lg:h-[calc(100vh-3rem)] lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-twinkle-pink to-twinkle-lavender text-twinkle-ink shadow-sm"><Sparkles className="h-6 w-6" /></div>
          <div><strong className="block text-base leading-5">twinkle<span className="text-[#b17fac]">.</span></strong><span className="text-[11px] font-bold uppercase tracking-widest text-twinkle-muted">Princess Studio</span></div>
        </div>
        <div className="my-6 h-px bg-[#e8e3ed]" />
        <p className="px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-twinkle-muted">Menu chính</p>
        <nav className="mt-3 space-y-1" aria-label="Quản trị">
          {sidebarItems.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => openSection(key)} aria-current={section === key ? 'page' : undefined} className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${section === key ? 'bg-gradient-to-r from-twinkle-lavender/65 to-twinkle-pink/40 text-twinkle-ink shadow-sm' : 'text-twinkle-muted hover:bg-twinkle-sky/30 hover:text-twinkle-ink'}`}>
              <Icon className="h-[18px] w-[18px]" /> {label}
              {key === 'events' && needsAttention.length > 0 && <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-twinkle-pink px-1.5 text-xs text-twinkle-ink">{needsAttention.length}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-[1.5rem] bg-gradient-to-br from-[#d9d0ec] to-[#ffdce9] p-4">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white/60"><Star className="h-5 w-5 fill-twinkle-yellow text-twinkle-ink" /></div>
          <p className="text-sm font-bold">Một chút phép màu</p>
          <p className="mt-1 text-xs leading-5 text-twinkle-muted">Mọi ý tưởng hẹn hò xinh xắn đều bắt đầu từ đây.</p>
          <Link href="/" className="mt-3 inline-flex items-center gap-1 text-xs font-bold">Xem trang chủ <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <button onClick={() => void logout()} className="mt-4 flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-bold text-twinkle-muted hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" /> Đăng xuất</button>
      </aside>

      <main className="min-w-0 flex-1 px-1 pb-10 sm:px-2 lg:px-4">
        <header className="soft-reveal flex flex-wrap items-center gap-3 py-3 sm:py-4">
          <button onClick={() => setSidebarOpen(true)} aria-label="Mở menu" className="rounded-2xl bg-white/80 p-3 shadow-sm lg:hidden"><Menu className="h-5 w-5" /></button>
          <div className="relative min-w-[180px] flex-1 sm:max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-twinkle-muted" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} disabled={section === 'overview' || section === 'profile'} placeholder={section === 'overview' || section === 'profile' ? 'Chọn một mục để tìm kiếm' : 'Tìm trong mục đang xem...'} aria-label="Tìm kiếm" className="w-full rounded-full border border-white/70 bg-white/75 py-3 pl-11 pr-4 text-sm font-semibold outline-none backdrop-blur-sm focus:ring-4 focus:ring-twinkle-lavender/25 disabled:cursor-not-allowed disabled:opacity-60" />
          </div>
          <button onClick={() => openSection('events')} aria-label={`${needsAttention.length} lịch hẹn cần chú ý`} className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 shadow-sm hover:-translate-y-0.5"><Bell className="h-5 w-5" />{needsAttention.length > 0 && <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-[#ff9ebc] ring-2 ring-white" />}</button>
          <div className="flex h-11 items-center gap-2 rounded-full border border-white/70 bg-white/75 pl-2 pr-4 shadow-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-twinkle-pink text-sm">👑</span><span className="hidden text-xs font-bold sm:block">Princess Admin</span></div>
        </header>

        <div className="mb-6 mt-5 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.23em] text-[#9b83b5]">TWINKLE CONTROL ROOM</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title.title}</h1><p className="mt-2 text-sm text-twinkle-muted">{title.subtitle}</p></div>
          {(section === 'locations' || section === 'combos' || section === 'vouchers') && <button onClick={() => setEditor({ kind: section })} className="inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-3 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 hover:shadow-glow"><Plus className="h-4 w-4" /> Thêm mới</button>}
        </div>

        {dataError && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 px-5 py-4 text-sm font-semibold text-rose-700"><span>{dataError}</span><button onClick={() => void refresh()} className="rounded-full bg-white px-4 py-2 text-xs font-bold">Thử lại</button></div>}
        {loadingData && <div className="mb-5 flex items-center gap-2 text-xs font-bold text-twinkle-muted"><Sparkles className="h-4 w-4 animate-twinkle" /> Đang làm mới dữ liệu...</div>}

        <motion.div key={section} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        {section === 'overview' && <div className="space-y-8">
          <div className="soft-reveal relative overflow-hidden rounded-[2.2rem] bg-gradient-to-r from-[#c8c4eb] via-[#e4d3ed] to-[#ffe0e5] px-7 py-8 shadow-cloud sm:px-10 sm:py-10">
            <Cloud className="absolute -bottom-12 right-2 h-52 w-52 fill-white/25 text-white/25 sm:right-14" />
            <Sparkles className="absolute right-10 top-8 h-9 w-9 animate-twinkle text-[#fff4b8]" />
            <div className="relative z-10 max-w-lg"><span className="inline-flex items-center gap-2 rounded-full bg-white/45 px-4 py-1.5 text-xs font-bold"><Star className="h-3.5 w-3.5 fill-current" /> Princess Mode</span><h2 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl">Biến một buổi hẹn bình thường thành điều đáng nhớ.</h2><p className="mt-3 text-sm leading-6 text-[#615b7b]">Sắp xếp địa điểm, chuẩn bị combo và gửi những đặc quyền bé xinh cho người thương.</p><button onClick={() => openSection('locations')} className="mt-6 inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5">Bắt đầu chuẩn bị <ArrowRight className="h-4 w-4" /></button></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Địa điểm', count: data.locations.length, icon: MapPin, color: 'bg-[#d9edff]', key: 'locations' as Section },
              { label: 'Date Combos', count: data.combos.length, icon: Sparkles, color: 'bg-[#e9ddf2]', key: 'combos' as Section },
              { label: 'Vouchers', count: data.vouchers.length, icon: Ticket, color: 'bg-[#ffe2eb]', key: 'vouchers' as Section },
              { label: 'Chờ duyệt', count: pendingCount, icon: CalendarDays, color: 'bg-[#fff2bd]', key: 'events' as Section }
            ].map(({ label, count, icon: Icon, color, key }) => <button key={label} onClick={() => openSection(key)} className="magic-card rounded-[1.6rem] border border-white/80 bg-white/75 p-5 text-left shadow-cloud backdrop-blur-md hover:-translate-y-1"><div className="flex items-start justify-between"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color}`}><Icon className="h-5 w-5" /></span><ArrowUpRight className="h-4 w-4 text-twinkle-muted" /></div><strong className="mt-6 block text-3xl">{count.toString().padStart(2, '0')}</strong><span className="mt-1 block text-sm font-semibold text-twinkle-muted">{label}</span></button>)}
          </div>
          <div><SectionHeading eyebrow="Hộp thư của nàng" title="Cần nàng xem qua" right={<button onClick={() => openSection('events')} className="inline-flex items-center gap-1 text-sm font-bold text-[#9275ae]">Xem tất cả <ArrowRight className="h-4 w-4" /></button>} />{eventRows(needsAttention.slice(0, 4), true)}</div>
          <div><SectionHeading eyebrow="Bộ sưu tập" title="Địa điểm mới thêm" right={<button onClick={() => openSection('locations')} className="inline-flex items-center gap-1 text-sm font-bold text-[#9275ae]">Khám phá <ArrowRight className="h-4 w-4" /></button>} />
            {data.locations.length === 0 ? <EmptyState icon={MapPin} title="Chưa có địa điểm nào" description="Thêm điểm hẹn đầu tiên để Princess Mode bắt đầu gợi ý." action="Thêm địa điểm" onAction={() => setEditor({ kind: 'locations' })} /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.locations.slice(0, 3).map((item) => locationCard(item))}</div>}
          </div>
        </div>}

        {section === 'locations' && <div>{visibleLocations.length === 0 ? <EmptyState icon={MapPin} title={query ? 'Không tìm thấy địa điểm' : 'Khu vườn còn trống'} description={query ? 'Thử một từ khóa khác nhé.' : 'Thêm địa điểm đầu tiên để bắt đầu hành trình hẹn hò.'} action={query ? undefined : 'Thêm địa điểm'} onAction={() => setEditor({ kind: 'locations' })} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleLocations.map((item) => locationCard(item))}</div>}</div>}

        {section === 'combos' && <div>{visibleCombos.length === 0 ? <EmptyState icon={Sparkles} title={query ? 'Không tìm thấy combo' : 'Chưa có hành trình nào'} description={query ? 'Thử tìm theo tên hoặc mô tả khác.' : 'Ghép vài địa điểm yêu thích thành một buổi hẹn trọn vẹn.'} action={query ? undefined : 'Tạo combo'} onAction={() => setEditor({ kind: 'combos' })} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleCombos.map((item) => comboCard(item))}</div>}</div>}

        {section === 'vouchers' && <div>{visibleVouchers.length === 0 ? <EmptyState icon={Ticket} title={query ? 'Không tìm thấy voucher' : 'Chưa có đặc quyền nào'} description={query ? 'Thử tìm một tên khác.' : 'Một ly trà sữa hay 15 phút đi trễ sẽ làm buổi hẹn thêm vui.'} action={query ? undefined : 'Tạo voucher'} onAction={() => setEditor({ kind: 'vouchers' })} /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{visibleVouchers.map((item) => voucherCard(item))}</div>}</div>}

        {section === 'events' && <div>
          <div className="mb-5 flex flex-wrap gap-2">{(['All', 'Pending', 'Rejected', 'Reschedule', 'Accepted', 'Completed'] as const).map((status) => <button key={status} onClick={() => setEventFilter(status)} aria-pressed={eventFilter === status} className={`rounded-full px-4 py-2 text-xs font-bold ${eventFilter === status ? 'bg-twinkle-ink text-white shadow-sm' : 'bg-white/75 text-twinkle-muted hover:bg-twinkle-lavender/30'}`}>{status === 'All' ? 'Tất cả' : statusNames[status]} <span className="ml-1 opacity-65">{status === 'All' ? data.events.length : data.events.filter((item) => item.status === status).length}</span></button>)}</div>
          {eventRows(visibleEvents)}
        </div>}

        {section === 'profile' && <ProfilePanel profile={data.profile} onSave={saveProfile} />}
        </motion.div>
      </main>

      <AnimatePresence>{editor && <AdminEditor key={`${editor.kind}-${editor.item?.id ?? 'new'}`} editor={editor} locations={data.locations} onClose={() => setEditor(null)} onSave={saveEditor} />}</AnimatePresence>
      <AnimatePresence>{deleteTarget && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#24213d]/45 p-4 backdrop-blur-sm"><div role="alertdialog" aria-modal="true" aria-label="Xác nhận xóa" className="w-full max-w-sm rounded-[2rem] bg-[#fffaf7] p-7 text-center shadow-2xl"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600"><Trash2 className="h-6 w-6" /></div><h2 className="text-xl font-bold">Xóa mục này nhé?</h2><p className="mt-2 text-sm leading-6 text-twinkle-muted"><strong>{deleteTarget.name}</strong> sẽ bị xóa khỏi danh sách. Mục đang được dùng trong lịch hẹn sẽ được API giữ lại.</p><div className="mt-6 flex gap-3"><button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-full bg-white px-4 py-3 text-sm font-bold">Giữ lại</button><button disabled={actionBusy} onClick={() => void confirmDelete()} className="flex-1 rounded-full bg-rose-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{actionBusy ? 'Đang xóa...' : 'Xóa'}</button></div></div></motion.div>}</AnimatePresence>
      <AnimatePresence>{detailEvent && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#24213d]/45 p-4 backdrop-blur-sm" onClick={() => setDetailEvent(null)}><div role="dialog" aria-modal="true" aria-label="Chi tiết lịch hẹn" onClick={(event) => event.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-[#fffaf7] p-7 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-[#9b83b5]">Lá thư hẹn hò</p><h2 className="mt-2 text-2xl font-bold">{detailEvent.inviterName} gửi lời hẹn 💌</h2></div><button onClick={() => setDetailEvent(null)} aria-label="Đóng" className="rounded-full bg-white p-2"><X className="h-5 w-5" /></button></div><div className="mt-6 space-y-3 rounded-2xl bg-twinkle-sky/35 p-5 text-sm"><p><strong>Ngày giờ:</strong> {formatDate(detailEvent.date)} · {detailEvent.time}</p><p><strong>Điểm đón:</strong> {detailEvent.pickupLocation || 'Chưa cập nhật'}</p><p><strong>Điểm hẹn:</strong> {destination(detailEvent)}</p><p><strong>Dresscode:</strong> {detailEvent.dresscode}</p><p><strong>Trạng thái:</strong> {statusNames[detailEvent.status]}</p><p><strong>Voucher:</strong> {detailEvent.appliedVouchers.map((id) => data.vouchers.find((voucher) => voucher.id === id)?.name ?? 'Voucher đã xóa').join(', ') || 'Chưa áp dụng'}</p></div><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-twinkle-muted">{detailEvent.message || 'Không có lời nhắn thêm.'}</p>{detailEvent.editHistory.length > 0 && <div className="mt-6"><h3 className="text-sm font-bold">Lịch sử đổi lịch</h3><div className="mt-3 space-y-2">{detailEvent.editHistory.map((edit, index) => <div key={`${edit.editedAt}-${index}`} className="rounded-2xl bg-twinkle-pink/30 p-4 text-xs leading-6"><strong>{formatDate(edit.editedAt)}:</strong> {edit.reason}<br />Trước đó: {formatDate(edit.previousDate)} · {edit.previousTime}</div>)}</div></div>}{detailEvent.status === 'Accepted' && <button disabled={actionBusy} onClick={() => void eventAction(detailEvent, 'complete')} className="mt-6 w-full rounded-full bg-twinkle-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50">Đánh dấu hoàn thành</button>}</div></motion.div>}</AnimatePresence>
      <AnimatePresence>{toast && <motion.div role="status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-2xl bg-twinkle-ink px-5 py-4 text-sm font-bold text-white shadow-2xl"><Sparkles className="h-4 w-4 shrink-0 text-twinkle-yellow" />{toast}<button onClick={() => setToast('')} aria-label="Đóng thông báo"><X className="h-4 w-4" /></button></motion.div>}</AnimatePresence>
    </div>
  );

  function locationCard(item: Location) {
    return <article key={item.id} className="magic-card group overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/80 shadow-cloud backdrop-blur-sm transition hover:-translate-y-1">
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-twinkle-sky via-twinkle-lavender/50 to-twinkle-pink/70">
        {item.images[0] ? <img src={item.images[0]} alt={`Không gian ${item.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><Cloud className="h-20 w-20 fill-white/45 text-white/70" /><Star className="absolute right-1/3 top-8 h-6 w-6 animate-twinkle fill-twinkle-yellow text-twinkle-yellow" /></div>}
        <span className="absolute bottom-3 left-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold shadow-sm">{item.category}</span>
        <div className="absolute right-3 top-3 flex gap-2"><ActionIcon label={`Sửa ${item.name}`} icon={Pencil} onClick={() => setEditor({ kind: 'locations', item })} /><ActionIcon label={`Xóa ${item.name}`} icon={Trash2} danger onClick={() => setDeleteTarget({ kind: 'locations', id: item.id, name: item.name })} /></div>
      </div>
      <div className="p-5"><h3 className="truncate text-lg font-bold">{item.name}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-twinkle-muted">{item.notes || 'Một điểm hẹn đang chờ hai bạn khám phá.'}</p><div className="mt-5 flex items-center justify-between border-t border-[#ece8f2] pt-4"><span className="text-sm font-bold text-[#8b70a8]">{formatMoney(item.cost_estimate)}</span>{item.mapsLink ? <a href={item.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-twinkle-muted hover:text-twinkle-ink">Bản đồ <ArrowUpRight className="h-3.5 w-3.5" /></a> : <span className="text-xs text-twinkle-muted">Chưa có bản đồ</span>}</div></div>
    </article>;
  }

  function comboCard(item: ComboDate) {
    const names = item.locationIds.map((id) => data.locations.find((location) => location.id === id)?.name ?? 'Địa điểm đã xóa');
    return <article key={item.id} className="magic-card relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-gradient-to-br from-white/90 via-[#f4eefa]/90 to-[#ffe8ee]/90 p-6 shadow-cloud transition hover:-translate-y-1"><Sparkles className="absolute -right-4 -top-4 h-32 w-32 text-twinkle-lavender/25" /><div className="relative"><div className="flex items-start justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/80 text-3xl shadow-sm">{item.icon}</span><div className="flex gap-2"><ActionIcon label={`Sửa ${item.title}`} icon={Pencil} onClick={() => setEditor({ kind: 'combos', item })} /><ActionIcon label={`Xóa ${item.title}`} icon={Trash2} danger onClick={() => setDeleteTarget({ kind: 'combos', id: item.id, name: item.title })} /></div></div><h3 className="mt-5 text-lg font-bold">{item.title}</h3><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-twinkle-muted">{item.description || 'Một hành trình nhỏ cho hai người.'}</p><div className="mt-5 space-y-2 border-t border-[#e5ddec] pt-4">{names.slice(0, 3).map((name, index) => <p key={`${name}-${index}`} className="flex items-center gap-2 text-xs font-semibold"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-twinkle-lavender/60 text-[10px]">{index + 1}</span><span className="truncate">{name}</span></p>)}{names.length > 3 && <p className="pl-7 text-xs text-twinkle-muted">+{names.length - 3} điểm dừng nữa</p>}</div></div></article>;
  }

  function voucherCard(item: Voucher) {
    return <article key={item.id} className="magic-card relative overflow-hidden rounded-[1.8rem] border border-dashed border-[#dbbbd0] bg-gradient-to-br from-[#fff5f8] to-[#f7eafa] p-6 shadow-cloud transition hover:-translate-y-1"><div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#e5edff]" /><div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-[#e5edff]" /><div className="flex items-start justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/85 text-3xl shadow-sm">{item.icon}</span><div className="flex gap-2"><ActionIcon label={`Sửa ${item.name}`} icon={Pencil} onClick={() => setEditor({ kind: 'vouchers', item })} /><ActionIcon label={`Xóa ${item.name}`} icon={Trash2} danger onClick={() => setDeleteTarget({ kind: 'vouchers', id: item.id, name: item.name })} /></div></div><p className="mt-6 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ad83a7]">Princess privilege</p><h3 className="mt-2 text-lg font-bold">{item.name}</h3><p className="mt-2 line-clamp-3 min-h-14 text-sm leading-5 text-twinkle-muted">{item.description || 'Một chiếc đặc quyền dễ thương cho buổi hẹn.'}</p><div className="mt-5 border-t border-dashed border-[#d9bfd6] pt-4 text-xs font-bold tracking-[0.22em] text-[#b992b4]">TWINKLE ★ TWINKLE</div></article>;
  }
}
