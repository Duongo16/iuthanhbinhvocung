'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, Camera, Check, ChevronLeft, Clock3, Cloud, Edit3, History, ImagePlus, Loader2, MapPin, MessageCircleHeart, PenLine, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { getDateEvent, loadMemoriesCatalog, MemoriesApiError, rescheduleEvent, updateMemories, uploadMemoryImage } from '@/lib/memories-api';
import { rememberDateEventId } from '@/lib/date-event-ids';
import type { ComboDate, CoupleProfile, DateEvent, DateEventStatus, Location } from '@/lib/types';
import { formatDateVietnam, safeWebUrl, todayInVietnam } from '@/lib/wizard-utils';
import PlacePicker, { type PlaceChoice } from '@/components/wizard/PlacePicker';

type ModalName = 'detail' | 'memory' | 'reschedule' | null;
const fallbackPhoto = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=900&q=85';

function dateKey(value: string) { return value.slice(0, 10); }
function daysUntil(value: string) {
  const [year, month, day] = dateKey(value).split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayInVietnam().split('-').map(Number);
  return Math.max(0, Math.round((Date.UTC(year, month - 1, day) - Date.UTC(todayYear, todayMonth - 1, todayDay)) / 86_400_000));
}
function placeName(event: DateEvent, locations: Location[], combos: ComboDate[]) {
  if (event.comboId) return combos.find((item) => item.id === event.comboId)?.title ?? 'Date combo';
  if (event.roadmapLocationIds?.length) return event.roadmapLocationIds.map((id) => locations.find((item) => item.id === id)?.name ?? 'Điểm dừng đã xóa').join(' → ');
  if (event.locationId) return locations.find((item) => item.id === event.locationId)?.name ?? 'Địa điểm riêng tư';
  return 'Chưa chọn địa điểm';
}
function Avatar({ src, label }: { src?: string; label: string }) {
  return src ? <img src={safeWebUrl(src) ?? src} alt={label} className="h-14 w-14 rounded-full border-4 border-white object-cover shadow-lg" /> : <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-twinkle-pink to-twinkle-lavender text-2xl shadow-lg" aria-label={label}>{label.slice(0, 1).toUpperCase()}</div>;
}
function Modal({ title, children, onClose, wide = false }: { title: string; children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', closeOnEscape);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = previous; };
  }, [onClose]);
  return createPortal(<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-[#29244a]/45 p-3 backdrop-blur-sm sm:items-center sm:p-6" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><motion.div initial={{ y: 32, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.98 }} className={`max-h-[92vh] w-full overflow-y-auto rounded-[2rem] border border-white/80 bg-[#fffaff]/95 p-5 shadow-2xl sm:p-7 ${wide ? 'max-w-3xl' : 'max-w-xl'}`} role="dialog" aria-modal="true" aria-label={title}><div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.24em] text-twinkle-muted">Twinkle Twinkle</p><h2 className="text-2xl font-extrabold text-twinkle-ink">{title}</h2></div><button onClick={onClose} className="rounded-full bg-white p-2 text-twinkle-muted shadow-sm hover:rotate-90" aria-label="Đóng"><X size={20} /></button></div>{children}</motion.div></motion.div>, document.body);
}
function EventMeta({ event, locations, combos }: { event: DateEvent; locations: Location[]; combos: ComboDate[] }) {
  return <div className="flex flex-wrap gap-2 text-xs font-bold text-twinkle-muted"><span className="rounded-full bg-twinkle-blue/70 px-3 py-1.5"><CalendarClock size={13} className="mr-1 inline" />{formatDateVietnam(event.date)}</span><span className="rounded-full bg-twinkle-yellow/70 px-3 py-1.5"><Clock3 size={13} className="mr-1 inline" />{event.time}</span>{event.pickupLocation && <span className="rounded-full bg-twinkle-lavender/45 px-3 py-1.5">🚗 Đón tại {event.pickupLocation}</span>}<span className="rounded-full bg-twinkle-pink/60 px-3 py-1.5"><MapPin size={13} className="mr-1 inline" />{placeName(event, locations, combos)}</span></div>;
}
function CountdownHeader({ profile, upcoming, pendingCount }: { profile: CoupleProfile | null; upcoming: DateEvent[]; pendingCount: number }) {
  const nextEvent = upcoming[0]; const days = nextEvent ? daysUntil(nextEvent.date) : null; const userName = profile?.nickname_user || 'Công chúa'; const partnerName = profile?.nickname_partner || 'Hoàng tử';
  return <header className="soft-reveal relative overflow-hidden rounded-[2.25rem] border border-white/75 bg-white/60 p-5 shadow-xl shadow-twinkle-lavender/20 backdrop-blur md:p-7"><Cloud className="absolute -right-4 -top-7 h-28 w-28 text-white/75" fill="currentColor" /><Sparkles className="absolute right-24 top-7 text-twinkle-yellow" size={22} /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3 sm:gap-4"><Avatar src={profile?.avatar_user} label={userName} /><span className="animate-twinkle text-2xl text-twinkle-pink" aria-hidden="true">♥</span><Avatar src={profile?.avatar_partner} label={partnerName} /><div className="ml-1"><p className="text-xs font-bold uppercase tracking-[0.2em] text-twinkle-muted">Our little universe</p><h1 className="text-xl font-extrabold text-twinkle-ink sm:text-2xl">{userName} &amp; {partnerName}</h1></div></div><div className="rounded-3xl bg-gradient-to-r from-twinkle-lavender/80 to-twinkle-blue/80 px-5 py-3 text-center shadow-inner"><p className="text-xs font-bold uppercase tracking-[0.2em] text-twinkle-muted">Buổi hẹn kế tiếp</p><p className="mt-1 text-2xl font-extrabold text-twinkle-ink">{days === null ? (pendingCount ? 'Đang chờ duyệt 💌' : 'Chưa đặt lịch') : days === 0 ? 'Hôm nay ✨' : `${days} ngày nữa`}</p>{nextEvent && <p className="mt-1 text-xs font-semibold text-twinkle-muted">{formatDateVietnam(nextEvent.date)} · {nextEvent.time}</p>}</div></div></header>;
}
function PolaroidCard({ event, index, locations, combos, onOpen }: { event: DateEvent; index: number; locations: Location[]; combos: ComboDate[]; onOpen: () => void }) {
  const photos = event.memories?.photos?.length ? event.memories.photos : [fallbackPhoto];
  return <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} whileHover={{ y: -6, rotate: 0 }} style={{ rotate: index % 2 === 0 ? '-1.5deg' : '1.7deg' }} className="group relative rounded-[1.6rem] border-[10px] border-white bg-white p-2 pb-5 shadow-2xl shadow-indigo-900/15"><span className="absolute -top-5 left-1/2 z-10 h-10 w-16 -translate-x-1/2 rotate-[-4deg] bg-twinkle-yellow/75 shadow-sm" aria-hidden="true" /><button onClick={onOpen} className="block w-full text-left" aria-label={`Mở kỷ niệm ${formatDateVietnam(event.date)}`}><div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-twinkle-blue/50"><img src={safeWebUrl(photos[0]) ?? photos[0]} alt={event.memories?.reviewText || 'Ảnh kỷ niệm'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{photos.length > 1 && <span className="absolute bottom-2 right-2 rounded-full bg-[#29244a]/70 px-2 py-1 text-xs font-bold text-white">+{photos.length - 1} ảnh</span>}</div><div className="px-2 pt-4"><div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-extrabold uppercase tracking-[0.16em] text-twinkle-muted">{formatDateVietnam(event.date)}</span><span className="text-xl" aria-label={event.memories?.emoji || 'sparkle'}>{event.memories?.emoji || '✨'}</span></div><h3 className="line-clamp-1 text-lg font-extrabold text-twinkle-ink">{placeName(event, locations, combos)}</h3><p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-5 text-twinkle-muted">{event.memories?.reviewText || 'Một ngày dịu dàng đang chờ mình viết tiếp...'}</p>{event.editHistory?.length > 0 && <p className="mt-3 text-xs font-bold text-twinkle-lavender"><History size={14} className="mr-1 inline" />{event.editHistory.length} lần đổi lịch</p>}</div></button></motion.article>;
}
function MemoryEditor({ event, onClose, onSaved }: { event: DateEvent; onClose: () => void; onSaved: (event: DateEvent) => void }) {
  const [photos, setPhotos] = useState<string[]>(event.memories?.photos ?? []); const [files, setFiles] = useState<File[]>([]); const [reviewText, setReviewText] = useState(event.memories?.reviewText ?? ''); const [emoji, setEmoji] = useState(event.memories?.emoji ?? '✨'); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((preview) => URL.revokeObjectURL(preview.url)), [previews]);
  const onFileChange = (change: ChangeEvent<HTMLInputElement>) => { const picked = Array.from(change.target.files ?? []); setFiles((current) => [...current, ...picked].slice(0, Math.max(0, 30 - photos.length))); change.target.value = ''; };
  const save = async (submitEvent: FormEvent) => { submitEvent.preventDefault(); setSaving(true); setError(''); try { const uploaded = await Promise.all(files.map((file) => uploadMemoryImage(file))); const updated = await updateMemories(event.id, { photos: [...photos, ...uploaded.map((item) => item.url)], reviewText, emoji }); onSaved(updated); } catch (caught) { setError(caught instanceof MemoriesApiError ? caught.message : 'Không thể lưu kỷ niệm lúc này.'); } finally { setSaving(false); } };
  return <Modal title="Viết tiếp kỷ niệm" onClose={onClose} wide><form onSubmit={save} className="space-y-5"><div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{photos.map((photo, index) => <div key={`${photo}-${index}`} className="group relative aspect-square overflow-hidden rounded-2xl bg-twinkle-blue/50"><img src={safeWebUrl(photo) ?? photo} alt="Ảnh đã lưu" className="h-full w-full object-cover" /><button type="button" onClick={() => setPhotos((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-full bg-[#29244a]/70 p-1 text-white opacity-0 transition group-hover:opacity-100" aria-label="Xóa ảnh"><Trash2 size={14} /></button></div>)}{previews.map(({ file, url }) => <div key={`${file.name}-${file.lastModified}`} className="relative aspect-square overflow-hidden rounded-2xl bg-twinkle-pink/40"><img src={url} alt={file.name} className="h-full w-full object-cover" /></div>)}{photos.length + files.length < 30 && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-twinkle-lavender bg-twinkle-lavender/20 text-twinkle-muted hover:bg-twinkle-lavender/40"><ImagePlus size={22} /><span className="mt-1 text-xs font-bold">Thêm ảnh</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={onFileChange} /></label>}</div><div><label className="mb-2 block text-sm font-extrabold text-twinkle-ink" htmlFor="memory-review">Review buổi hẹn</label><textarea id="memory-review" maxLength={3000} rows={4} value={reviewText} onChange={(change) => setReviewText(change.target.value)} placeholder="Hôm nay mình đã..." className="w-full rounded-2xl border border-twinkle-blue bg-white/80 px-4 py-3 text-sm outline-none ring-twinkle-lavender focus:ring-2" /></div><div><label className="mb-2 block text-sm font-extrabold text-twinkle-ink" htmlFor="memory-emoji">Emoji của ngày hôm đó</label><input id="memory-emoji" value={emoji} maxLength={20} onChange={(change) => setEmoji(change.target.value)} className="w-24 rounded-2xl border border-twinkle-blue bg-white/80 px-4 py-3 text-center text-xl outline-none ring-twinkle-lavender focus:ring-2" /></div>{error && <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}<div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full px-5 py-3 text-sm font-extrabold text-twinkle-muted">Để sau</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-6 py-3 text-sm font-extrabold text-white disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Check size={17} />}Lưu kỷ niệm</button></div></form></Modal>;
}
function RescheduleEditor({ event, locations, combos, onClose, onSaved }: { event: DateEvent; locations: Location[]; combos: ComboDate[]; onClose: () => void; onSaved: (event: DateEvent) => void }) {
  const [date, setDate] = useState(dateKey(event.date));
  const [time, setTime] = useState(event.time);
  const [choice, setChoice] = useState<PlaceChoice>(() => event.roadmapLocationIds?.length ? { kind: 'roadmap', ids: event.roadmapLocationIds } : event.comboId ? { kind: 'combo', id: event.comboId } : event.locationId ? { kind: 'roadmap', ids: [event.locationId] } : null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (reason.trim().length < 3) return setError('Hãy nhập lý do đổi lịch (ít nhất 3 ký tự).');
    if (!choice) return setError('Hãy chọn combo hoặc thêm ít nhất một điểm dừng.');
    setSaving(true);
    setError('');
    try {
      const updated = await rescheduleEvent(event.id, {
        date, time, reason: reason.trim(),
        ...(choice.kind === 'combo' ? { comboId: choice.id } : choice.ids.length === 1 ? { locationId: choice.ids[0] } : { roadmapLocationIds: choice.ids })
      });
      onSaved(updated);
    } catch (caught) {
      setError(caught instanceof MemoriesApiError ? caught.message : 'Không thể gửi yêu cầu đổi lịch.');
    } finally { setSaving(false); }
  };
  return <Modal title="Mình đổi lịch một chút nhé?" onClose={onClose} wide><form onSubmit={save} className="space-y-4">
    <p className="rounded-2xl bg-twinkle-yellow/45 px-4 py-3 text-sm font-semibold">Lý do sẽ được lưu vào lịch sử và gửi kèm email để cả hai cùng biết.</p>
    <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-extrabold">Ngày mới<input required type="date" min={todayInVietnam()} value={date} onChange={(change) => setDate(change.target.value)} className="mt-2 w-full rounded-2xl border border-twinkle-blue bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-twinkle-lavender" /></label><label className="text-sm font-extrabold">Giờ mới<input required type="time" value={time} onChange={(change) => setTime(change.target.value)} className="mt-2 w-full rounded-2xl border border-twinkle-blue bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-twinkle-lavender" /></label></div>
    <PlacePicker locations={locations} combos={combos} choice={choice} onChoose={setChoice} />
    <label className="block text-sm font-extrabold">Lý do đổi lịch<textarea required minLength={3} maxLength={500} rows={3} value={reason} onChange={(change) => setReason(change.target.value)} placeholder="Ví dụ: Mình muốn đổi sang ngày có thể ngắm hoàng hôn..." className="mt-2 w-full rounded-2xl border border-twinkle-blue bg-white px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-twinkle-lavender" /></label>
    {error && <p role="alert" className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-bold text-rose-700">{error}</p>}
    <div className="flex justify-end gap-3"><button type="button" onClick={onClose} className="rounded-full px-5 py-3 text-sm font-extrabold text-twinkle-muted">Huỷ</button><button disabled={saving} className="inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-6 py-3 text-sm font-extrabold text-white disabled:opacity-60">{saving ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}Gửi yêu cầu</button></div>
  </form></Modal>;
}function EventDetail({ event, locations, combos, onClose, onWrite, onReschedule }: { event: DateEvent; locations: Location[]; combos: ComboDate[]; onClose: () => void; onWrite: () => void; onReschedule: () => void }) {
  const photos = event.memories?.photos ?? [];
  return <Modal title="Chi tiết buổi hẹn" onClose={onClose} wide><div className="space-y-5"><EventMeta event={event} locations={locations} combos={combos} /><div className="rounded-3xl bg-twinkle-blue/30 p-4"><p className="text-sm font-semibold leading-6 text-twinkle-ink">{event.message || 'Một lời mời thật dịu dàng dành cho chúng mình.'}</p>{event.dresscode && <p className="mt-2 text-xs font-bold text-twinkle-muted">Dresscode: {event.dresscode}</p>}</div>{photos.length > 0 && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{photos.map((photo, index) => <img key={`${photo}-${index}`} src={safeWebUrl(photo) ?? photo} alt={`Kỷ niệm ${index + 1}`} className="aspect-square w-full rounded-2xl object-cover shadow" />)}</div>}<div className="rounded-3xl bg-white/80 p-4 shadow-inner"><div className="flex items-center gap-2"><MessageCircleHeart size={18} className="text-twinkle-pink" /><h3 className="font-extrabold text-twinkle-ink">Review {event.memories?.emoji || '✨'}</h3></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-twinkle-muted">{event.memories?.reviewText || 'Chưa có review. Mình viết vài dòng cho ngày này nhé?'}</p></div><div className="rounded-3xl border border-twinkle-lavender/50 bg-twinkle-lavender/15 p-4"><div className="flex items-center gap-2"><History size={18} className="text-twinkle-lavender" /><h3 className="font-extrabold text-twinkle-ink">Lịch sử đổi lịch</h3></div>{event.editHistory?.length ? <div className="mt-3 space-y-3">{[...event.editHistory].reverse().map((history, index) => <div key={`${history.editedAt}-${index}`} className="rounded-2xl bg-white/75 p-3 text-sm"><p className="font-bold text-twinkle-ink">{formatDateVietnam(history.previousDate)} · {history.previousTime}</p><p className="mt-1 text-twinkle-muted">{history.reason}</p><p className="mt-1 text-xs font-semibold text-twinkle-muted">Đã chỉnh lúc {new Date(history.editedAt).toLocaleString('vi-VN')}</p></div>)}</div> : <p className="mt-2 text-sm text-twinkle-muted">Buổi hẹn này chưa có lần đổi lịch nào.</p>}</div><div className="flex flex-wrap justify-end gap-3">{event.status === 'Completed' && <button onClick={onWrite} className="inline-flex items-center gap-2 rounded-full bg-twinkle-pink/70 px-5 py-3 text-sm font-extrabold text-twinkle-ink"><PenLine size={17} />Viết kỷ niệm</button>}{['Pending', 'Accepted', 'Reschedule'].includes(event.status) && <button onClick={onReschedule} className="inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-3 text-sm font-extrabold text-white"><Edit3 size={17} />Đổi lịch</button>}</div></div></Modal>;
}
const planStatus: Record<DateEventStatus, { label: string; tone: string }> = {
  Pending: { label: 'Chờ người ấy duyệt', tone: 'bg-twinkle-yellow/70' },
  Accepted: { label: 'Đã duyệt', tone: 'bg-emerald-100' },
  Reschedule: { label: 'Đang chờ đổi lịch', tone: 'bg-twinkle-lavender/60' },
  Rejected: { label: 'Đã từ chối', tone: 'bg-rose-100' },
  Completed: { label: 'Đã hoàn thành', tone: 'bg-twinkle-sky/70' }
};

function PlannedSection({ events, locations, combos, onOpen, onReschedule, onFound }: {
  events: DateEvent[];
  locations: Location[];
  combos: ComboDate[];
  onOpen: (event: DateEvent) => void;
  onReschedule: (event: DateEvent) => void;
  onFound: (event: DateEvent) => void;
}) {
  const [code, setCode] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);

  async function lookup(submitEvent: FormEvent) {
    submitEvent.preventDefault();
    const id = code.trim();
    if (!/^[a-f\d]{24}$/i.test(id)) return setLookupError('Mã lịch hẹn cần có 24 ký tự.');
    setLookingUp(true);
    setLookupError('');
    try {
      const event = await getDateEvent(id);
      rememberDateEventId(id);
      setCode('');
      onFound(event);
    } catch (caught) {
      setLookupError(caught instanceof MemoriesApiError && caught.status === 404 ? 'Không tìm thấy buổi hẹn này.' : caught instanceof Error ? caught.message : 'Không thể mở buổi hẹn.');
    } finally {
      setLookingUp(false);
    }
  }

  return <section className="soft-reveal mt-10">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-twinkle-muted">Upcoming sparkle</p><h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Kế hoạch của chúng mình</h2><p className="mt-1 text-xs font-medium text-twinkle-muted">Lời mời vừa gửi sẽ hiện ở đây, kể cả khi còn chờ duyệt.</p></div><CalendarClock className="text-twinkle-pink" size={30} /></div>
    {events.length ? <div className="grid gap-4 md:grid-cols-2">{events.map((event) => <article key={event.id} className="magic-card rounded-[1.7rem] border border-white/70 bg-white/65 p-5 shadow-lg backdrop-blur"><div className="flex flex-wrap items-start justify-between gap-2"><div><span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${planStatus[event.status].tone}`}>{planStatus[event.status].label}</span><h3 className="mt-2 text-xl font-extrabold">{placeName(event, locations, combos)}</h3></div>{event.status === 'Accepted' && <span className="rounded-full bg-twinkle-yellow/70 px-3 py-1 text-xs font-extrabold">{daysUntil(event.date) === 0 ? 'Hôm nay' : `Còn ${daysUntil(event.date)} ngày`}</span>}</div><div className="mt-4"><EventMeta event={event} locations={locations} combos={combos} /></div><p className="mt-3 line-clamp-2 text-sm font-medium text-twinkle-muted">{event.message || 'Một cuộc hẹn nhỏ đang đợi chúng mình.'}</p><div className="mt-4 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => onOpen(event)} className="rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-twinkle-ink shadow-sm hover:bg-twinkle-pink/40">Xem chi tiết</button><button type="button" onClick={() => onReschedule(event)} className="magic-button inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-4 py-2.5 text-sm font-extrabold text-white"><Edit3 size={16} />Chỉnh sửa</button></div></article>)}</div> : <div className="rounded-[1.7rem] border border-dashed border-white/80 bg-white/40 p-8 text-center text-sm font-semibold text-twinkle-muted">Chưa thấy kế hoạch nào. Nếu vừa gửi thư, bạn có thể mở lại bằng mã lịch hẹn ở dưới ✨</div>}
    <form onSubmit={lookup} className="mt-5 flex flex-wrap items-center gap-2 text-sm"><label htmlFor="event-code" className="font-bold text-twinkle-muted">Mở bằng mã lịch hẹn</label><input id="event-code" value={code} onChange={(change) => setCode(change.target.value)} placeholder="Dán mã từ thư vừa gửi" maxLength={24} className="min-w-56 flex-1 rounded-full border border-white bg-white/80 px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-twinkle-lavender sm:flex-none" /><button disabled={lookingUp} className="rounded-full bg-twinkle-lavender/70 px-4 py-2.5 text-xs font-extrabold disabled:opacity-50">{lookingUp ? 'Đang mở...' : 'Mở lịch'}</button>{lookupError && <span role="alert" className="w-full text-xs font-bold text-rose-700">{lookupError}</span>}</form>
  </section>;
}

export default function MemoriesPage() {
  const [profile, setProfile] = useState<CoupleProfile | null>(null); const [completed, setCompleted] = useState<DateEvent[]>([]); const [upcoming, setUpcoming] = useState<DateEvent[]>([]); const [planned, setPlanned] = useState<DateEvent[]>([]); const [locations, setLocations] = useState<Location[]>([]); const [combos, setCombos] = useState<ComboDate[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [notice, setNotice] = useState(''); const [modal, setModal] = useState<ModalName>(null); const [target, setTarget] = useState<DateEvent | null>(null);
  const load = async (showSpinner = false) => { if (showSpinner) setLoading(true); setError(''); try { const catalog = await loadMemoriesCatalog(); setProfile(catalog.profile); setCompleted(catalog.completed); setUpcoming(catalog.upcoming); setPlanned(catalog.planned); setLocations(catalog.locations); setCombos(catalog.combos); } catch (caught) { setError(caught instanceof MemoriesApiError ? caught.message : 'Không thể tải bầu trời kỷ niệm.'); } finally { setLoading(false); } };
  useEffect(() => { void load(true); }, []);
  const openModal = (name: ModalName, event: DateEvent) => { setTarget(event); setModal(name); }; const closeModal = () => { setModal(null); setTarget(null); };
  const saveEvent = async (event: DateEvent, message: string) => { closeModal(); setNotice(message); await load(); window.setTimeout(() => setNotice(''), 4500); if (event.status === 'Completed') setCompleted((current) => current.map((item) => item.id === event.id ? event : item)); };
  return <main className="memories-sky min-h-screen overflow-hidden px-4 py-6 text-twinkle-ink sm:px-6 lg:px-10"><div className="memories-content mx-auto max-w-6xl"><nav className="mb-5 flex items-center justify-between"><Link href="/" className="inline-flex items-center gap-2 rounded-full bg-white/60 px-4 py-2 text-sm font-extrabold text-twinkle-muted shadow-sm"><ChevronLeft size={17} />Lên lịch hẹn</Link><div className="flex items-center gap-2"><Link href="/admin" className="rounded-full bg-white/60 px-4 py-2 text-xs font-extrabold text-twinkle-muted shadow-sm">Admin</Link><Sparkles className="text-twinkle-yellow" size={22} /></div></nav><CountdownHeader profile={profile} upcoming={upcoming} pendingCount={planned.filter((event) => event.status === 'Pending' || event.status === 'Reschedule').length} />{notice && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-4 max-w-xl rounded-full bg-emerald-100 px-5 py-3 text-center text-sm font-bold text-emerald-700 shadow-sm">{notice}</motion.p>}{loading ? <div className="flex min-h-[45vh] items-center justify-center"><Loader2 className="animate-spin text-twinkle-lavender" size={38} /></div> : error ? <div className="mx-auto mt-10 max-w-xl rounded-3xl bg-white/75 p-8 text-center shadow-xl"><Cloud className="mx-auto text-twinkle-lavender" size={42} /><h2 className="mt-3 text-xl font-extrabold">Mây đang che mất dữ liệu</h2><p className="mt-2 text-sm text-twinkle-muted">{error}</p><button onClick={() => void load(true)} className="mt-5 rounded-full bg-twinkle-ink px-6 py-3 text-sm font-extrabold text-white">Thử lại</button></div> : <><PlannedSection events={planned} locations={locations} combos={combos} onOpen={(event) => openModal('detail', event)} onReschedule={(event) => openModal('reschedule', event)} onFound={(event) => { if (event.status === 'Completed') setCompleted((current) => [event, ...current.filter((item) => item.id !== event.id)]); else if (event.status !== 'Rejected') setPlanned((current) => [event, ...current.filter((item) => item.id !== event.id)]); openModal('detail', event); }} /><section className="soft-reveal mt-14 pb-12"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.25em] text-twinkle-muted">Starry memories</p><h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Nhật ký những ngày thương</h2></div><Camera className="text-twinkle-lavender" size={30} /></div>{completed.length ? <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{completed.map((event, index) => <PolaroidCard key={event.id} event={event} index={index} locations={locations} combos={combos} onOpen={() => openModal('detail', event)} />)}</div> : <div className="rounded-[1.7rem] border border-dashed border-white/80 bg-white/40 p-12 text-center"><ImagePlus className="mx-auto text-twinkle-lavender" size={40} /><h3 className="mt-3 text-xl font-extrabold">Chưa có trang nào trong album</h3><p className="mt-2 text-sm font-medium text-twinkle-muted">Hoàn thành một buổi hẹn rồi quay lại dán ảnh lên bầu trời nhé.</p><Link href="/" className="mt-5 inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-3 text-sm font-extrabold text-white"><Plus size={17} />Tạo lịch hẹn</Link></div>}</section></>}</div><AnimatePresence>{modal === 'detail' && target && <EventDetail event={target} locations={locations} combos={combos} onClose={closeModal} onWrite={() => setModal('memory')} onReschedule={() => setModal('reschedule')} />}{modal === 'memory' && target && <MemoryEditor event={target} onClose={closeModal} onSaved={(event) => void saveEvent(event, 'Đã lưu kỷ niệm vào album ✨')} />}{modal === 'reschedule' && target && <RescheduleEditor event={target} locations={locations} combos={combos} onClose={closeModal} onSaved={(event) => void saveEvent(event, 'Đã gửi yêu cầu đổi lịch. Email đã được chuẩn bị cho hai bạn 💌')} />}</AnimatePresence></main>;
}
