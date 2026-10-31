'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, Clock3, Cloud,
  DoorOpen, Gift, Heart, Mail, MapPin, RotateCcw, Send, ShieldCheck,
  Shirt, Sparkles, Star, Ticket, WandSparkles, X, type LucideIcon
} from 'lucide-react';
import PlacePicker, { type PlaceChoice } from './PlacePicker';
import DateCalendar from './DateCalendar';
import type { CoupleProfile, Voucher } from '@/lib/types';
import {
  loadWizardCatalog, rejectInvitation, sendInvitation, type DateInvitation,
  type WizardCatalog
} from '@/lib/wizard-api';
import { formatCost, formatDateVietnam, todayInVietnam, vietnamTimeNow } from '@/lib/wizard-utils';

type Step = 0 | 1 | 2 | 3;
type Draft = {
  date: string;
  time: string;
  pickupLocation: string;
  dresscodeColor: string;
  dresscodeStyle: string;
  choice: PlaceChoice;
  voucherIds: string[];
  message: string;
};
type Outcome = { kind: 'sent' | 'rejected'; emailSent?: boolean; eventId: string };

const emptyCatalog: WizardCatalog = { locations: [], combos: [], vouchers: [], profile: null };
const emptyDraft = (): Draft => ({ date: '', time: '', pickupLocation: '', dresscodeColor: '', dresscodeStyle: '', choice: null, voucherIds: [], message: '' });
const steps: { name: string; icon: LucideIcon }[] = [
  { name: 'Lịch & đồ', icon: CalendarDays },
  { name: 'Điểm hẹn', icon: MapPin },
  { name: 'Đặc quyền', icon: Ticket },
  { name: 'Gửi thư', icon: Mail }
];
const dresscodeColors = [
  { label: 'Hồng phấn', hex: '#FFC8DD' },
  { label: 'Xanh baby', hex: '#BDE0FE' },
  { label: 'Tím lavender', hex: '#CDB4DB' },
  { label: 'Vàng kem', hex: '#FFF1A8' },
  { label: 'Trắng', hex: '#FFFFFF' },
  { label: 'Đen', hex: '#3F3A5A' }
];
const dresscodeStyles = [
  { label: 'Lịch sự', icon: '👔' },
  { label: 'Sporty', icon: '👟' },
  { label: 'Nhẹ nhàng', icon: '☁️' }
];

function dresscodeLabel(draft: Draft) {
  return [draft.dresscodeColor.trim(), draft.dresscodeStyle].filter(Boolean).join(' · ');
}

function getSelectedPlace(draft: Draft, catalog: WizardCatalog): { name: string; cost: number; icon: string; description: string } | null {
  if (draft.choice?.kind === 'roadmap') {
    const stops = draft.choice.ids.map((id) => catalog.locations.find((location) => location.id === id));
    if (!stops.length || stops.some((item) => !item)) return null;
    return {
      name: stops.map((item) => item?.name).join(' → '),
      cost: stops.reduce((total, item) => total + (item?.cost_estimate ?? 0), 0),
      icon: '🗺️',
      description: `${stops.length} điểm dừng`
    };
  }
  if (draft.choice?.kind === 'combo') {
    const comboId = draft.choice.id;
    const item = catalog.combos.find((combo) => combo.id === comboId);
    if (!item) return null;
    const cost = item.locationIds.reduce((total, id) =>
      total + (catalog.locations.find((location) => location.id === id)?.cost_estimate ?? 0), 0);
    return { name: item.title, cost, icon: item.icon || '🌙', description: `${item.locationIds.length} điểm dừng` };
  }
  return null;
}

function Tag({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${className}`}>{children}</span>;
}

function Header({ profile, onStart }: { profile: CoupleProfile | null; onStart: () => void }) {
  return <>
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-5 sm:px-6 lg:px-8">
      <button type="button" onClick={onStart} className="flex items-center gap-3 rounded-full text-left" aria-label="Twinkle Twinkle, đến trình lên lịch"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/85 text-[#8a6aa4] shadow-sm"><Star className="h-6 w-6 fill-twinkle-yellow" /></span><span className="text-lg font-bold tracking-tight sm:text-xl">twinkle<span className="text-[#c98fac]">.</span><span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-[#968da7]">date planner</span></span></button>
      <nav className="flex items-center gap-2 sm:gap-3" aria-label="Điều hướng"><Tag className="hidden bg-white/75 text-[#8b719d] shadow-sm sm:inline-flex"><Heart className="h-3.5 w-3.5 fill-[#ef9cbd] text-[#ef9cbd]" /> {profile?.nickname_user || 'Bạn'} & {profile?.nickname_partner || 'Người ấy'}</Tag><Link href="/memories" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/80 px-4 py-2.5 text-xs font-bold shadow-sm backdrop-blur-md hover:-translate-y-0.5 hover:shadow-glow sm:text-sm"><DoorOpen className="h-4 w-4 text-[#a279b2]" /> Cánh cửa kỷ niệm</Link></nav>
    </header>
  </>;
}

function Progress({ step, onBackTo }: { step: Step; onBackTo: (step: Step) => void }) {
  return <nav className="grid shrink-0 grid-cols-4 gap-1 border-b border-[#eee7ed] bg-white/70 px-2 py-2 sm:gap-3 sm:px-6" aria-label="Tiến trình lên lịch">
    {steps.map(({ name, icon: Icon }, index) => {
      const active = index === step;
      const done = index < step;
      return <button key={name} type="button" disabled={index >= step} onClick={() => onBackTo(index as Step)} aria-current={active ? 'step' : undefined} aria-label={`Bước ${index + 1}: ${name}${done ? ', quay lại sửa' : ''}`} className={`flex min-w-0 items-center justify-center gap-1 rounded-full px-1 py-2 text-[10px] font-bold sm:gap-2 sm:px-3 sm:text-xs ${active ? 'bg-twinkle-lavender/65 text-[#684a82] shadow-sm' : done ? 'bg-twinkle-sky/45 text-[#67779c] hover:bg-twinkle-sky/75' : 'text-[#a4a0b2]'} disabled:cursor-default`}><span className="relative flex h-6 w-6 shrink-0 items-center justify-center"><Cloud className={`absolute h-6 w-6 ${active ? 'fill-twinkle-lavender text-twinkle-lavender' : done ? 'fill-twinkle-sky text-twinkle-sky' : 'fill-[#eee9f4] text-[#eee9f4]'}`} />{done ? <Check className="relative h-3.5 w-3.5" /> : <Icon className="relative h-3.5 w-3.5" />}</span><span className="truncate">{name}</span></button>;
    })}
  </nav>;
}

function StyleStep({ draft, update }: { draft: Draft; update: (partial: Partial<Draft>) => void }) {
  const customColor = dresscodeColors.some((color) => color.label === draft.dresscodeColor) ? '' : draft.dresscodeColor;
  const inputClass = 'mt-1.5 w-full rounded-xl border border-[#e4ddea] bg-white px-3 py-2 text-sm font-semibold text-twinkle-ink outline-none focus:border-[#b69bc8] focus:ring-2 focus:ring-twinkle-lavender/25';
  return <div className="min-w-0 space-y-3 rounded-[1.5rem] bg-[#f9f4fb]/80 p-4 lg:h-full">
    <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa85b4]">Vài điều nhỏ xinh</p><h2 className="mt-1 text-lg font-bold">Giờ, điểm đón & trang phục</h2></div>
    <label className="block text-xs font-bold"><Clock3 className="mr-1.5 inline h-3.5 w-3.5 text-[#9c7bb1]" />Giờ gặp nhau *<input type="time" value={draft.time} onChange={(event) => update({ time: event.target.value })} className={inputClass} /></label>
    <label className="block text-xs font-bold"><MapPin className="mr-1.5 inline h-3.5 w-3.5 text-[#d58bad]" />Đón nhau ở đâu? *<input type="text" maxLength={200} value={draft.pickupLocation} onChange={(event) => update({ pickupLocation: event.target.value })} placeholder="Ví dụ: cổng nhà em" className={inputClass} /></label>
    <fieldset className="space-y-2"><legend className="text-xs font-bold"><Shirt className="mr-1.5 inline h-3.5 w-3.5 text-[#d58bad]" />Màu trang phục *</legend>
      <div className="flex flex-wrap gap-2">{dresscodeColors.map((color) => {
        const selected = draft.dresscodeColor === color.label;
        return <button key={color.label} type="button" title={color.label} aria-label={`Chọn màu ${color.label}`} aria-pressed={selected} onClick={() => update({ dresscodeColor: color.label })} className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 transition hover:-translate-y-0.5 ${selected ? 'border-[#7e5e9b] shadow-glow' : 'border-white shadow-sm'}`} style={{ backgroundColor: color.hex }}>{selected && <Check className={`h-4 w-4 ${color.label === 'Đen' ? 'text-white' : 'text-[#5d4770]'}`} />}</button>;
      })}</div>
      <input aria-label="Nhập màu trang phục khác" type="text" maxLength={40} value={customColor} onChange={(event) => update({ dresscodeColor: event.target.value })} placeholder="Màu khác? Nhập tên màu..." className={inputClass} />
      {draft.dresscodeColor && <p className="text-[11px] font-semibold text-[#8b719d]">Màu đã chọn: {draft.dresscodeColor}</p>}
    </fieldset>
    <fieldset><legend className="mb-1.5 text-xs font-bold">Phong cách *</legend><div className="flex flex-wrap gap-1.5">{dresscodeStyles.map((style) => {
      const selected = draft.dresscodeStyle === style.label;
      return <button key={style.label} type="button" aria-pressed={selected} onClick={() => update({ dresscodeStyle: style.label })} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5 ${selected ? 'border-[#aa83bd] bg-white text-[#684a82] shadow-sm' : 'border-white bg-white/75 text-twinkle-ink hover:border-twinkle-lavender'}`}><span aria-hidden="true">{style.icon}</span>{style.label}</button>;
    })}</div></fieldset>
  </div>;
}

function VoucherStep({ vouchers, selectedIds, onToggle }: { vouchers: Voucher[]; selectedIds: string[]; onToggle: (id: string) => void }) {
  return <div className="space-y-7"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#aa85b4]">Bước 03 / Little privileges</p><h2 className="mt-2 text-2xl font-bold sm:text-3xl">Thêm một chút đặc quyền</h2><p className="mt-2 text-sm leading-6 text-twinkle-muted">Chọn nhiều voucher cho buổi hẹn, hoặc để trống nếu mọi thứ đã hoàn hảo rồi.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#fff3cd] px-5 py-4"><span className="flex items-center gap-2 text-sm font-bold"><Gift className="h-5 w-5 text-[#a6819e]" /> Princess Mode unlocked</span><span className="text-xs font-bold text-[#94767d]">Đã chọn {selectedIds.length}/10</span></div>
    {vouchers.length === 0 ? <div className="rounded-[1.8rem] border border-dashed border-[#d9c6df] bg-white/60 p-10 text-center"><Ticket className="mx-auto h-9 w-9 text-[#b692bd]" /><h3 className="mt-4 font-bold">Chưa có voucher nào</h3><p className="mt-2 text-sm text-twinkle-muted">Bạn vẫn có thể tiếp tục mà không cần voucher.</p></div> : <div className="grid gap-4 sm:grid-cols-2">{vouchers.map((item) => {
      const selected = selectedIds.includes(item.id);
      return <button key={item.id} type="button" onClick={() => onToggle(item.id)} aria-pressed={selected} className={`relative overflow-hidden rounded-[1.5rem] border-2 p-5 text-left transition hover:-translate-y-1 hover:shadow-cloud ${selected ? 'border-[#b78ec5] bg-[#fff1f8] ring-4 ring-twinkle-pink/25' : 'border-white bg-white/80'}`}><span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#e8efff]" /><span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-[#e8efff]" /><span className="flex items-start justify-between"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">{item.icon || '🎟️'}</span><span className={`flex h-8 w-8 items-center justify-center rounded-full ${selected ? 'bg-[#a77fb8] text-white' : 'bg-[#f0e8f2] text-[#aa8cb8]'}`}>{selected ? <Check className="h-4 w-4" /> : <PlusSign />}</span></span><strong className="mt-5 block text-base">{item.name}</strong><span className="mt-2 block min-h-10 text-xs leading-5 text-twinkle-muted">{item.description || 'Một đặc quyền nhỏ dành riêng cho hai người.'}</span><span className="mt-4 block border-t border-dashed border-[#dfcbdc] pt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#bd96b5]">Twinkle privilege</span></button>;
    })}</div>}
  </div>;
}

function PlusSign() { return <span className="text-lg leading-none">+</span>; }

function TimelineMoment({ index, icon, title, children }: { index: number; icon: string; title: string; children: ReactNode }) {
  const colors = ['from-twinkle-pink to-twinkle-lavender', 'from-twinkle-sky to-white', 'from-twinkle-yellow to-twinkle-pink'];
  return <motion.li initial={{ opacity: 0, y: 18, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: Math.min(index * 0.09, 0.7), duration: 0.35 }} className="group relative pb-6 pl-10 last:pb-0 sm:pb-7">
    <motion.span whileHover={{ rotate: 12, scale: 1.12 }} className={`absolute -left-[1.15rem] top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br ${colors[index % colors.length]} text-lg shadow-cloud`}>{icon}</motion.span>
    <span className="absolute -left-[1.85rem] top-10 text-[11px] text-[#c5a2ce]" aria-hidden="true">✦</span>
    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa85b4]">Chặng {String(index + 1).padStart(2, '0')}</p>
    <h4 className="mt-1 text-sm font-extrabold text-twinkle-ink">{title}</h4>
    <div className="mt-1 text-sm font-semibold leading-6 text-[#6f6488]">{children}</div>
  </motion.li>;
}

function ReviewStep({ draft, catalog, onMessage }: { draft: Draft; catalog: WizardCatalog; onMessage: (message: string) => void }) {
  const place = getSelectedPlace(draft, catalog);
  const chosenVouchers = catalog.vouchers.filter((voucher) => draft.voucherIds.includes(voucher.id));
  const comboId = draft.choice?.kind === 'combo' ? draft.choice.id : null;
  const combo = comboId ? catalog.combos.find((item) => item.id === comboId) : null;
  const stopIds = draft.choice?.kind === 'roadmap' ? draft.choice.ids : combo?.locationIds ?? [];
  const stops = stopIds.map((id) => catalog.locations.find((location) => location.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item));
  const routeMomentCount = Math.max(stops.length, 1);
  return <div className="mx-auto max-w-3xl space-y-5">
    <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#aa85b4]">Bước 04 · Our little journey</p><h2 className="mt-1 text-2xl font-bold sm:text-3xl">Hành trình sắp bắt đầu ✨</h2><p className="mt-1 text-sm text-twinkle-muted">Cùng ngắm lại từng chặng trước khi gửi thư nhé.</p></div>
    <div className="relative overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-br from-[#fffaf5] via-[#fff7fb] to-[#eee9fb] px-5 py-6 shadow-cloud sm:px-9 sm:py-8">
      <Star className="absolute right-7 top-6 h-7 w-7 animate-twinkle fill-twinkle-yellow text-[#e5bf7c]" />
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#a588b3]">Twinkle Twinkle · Date plan</p>
      <h3 className="mt-2 pr-10 text-xl font-extrabold">Một ngày chỉ dành cho chúng mình</h3>
      <p className="mt-2 text-xs font-semibold text-[#9a7dab]">Từng chặng nhỏ, một hành trình thật đáng nhớ ☁️</p>
      <ol className="relative ml-4 mt-7 border-l-2 border-dashed border-[#d8b9df]">
        <TimelineMoment index={0} icon="📅" title="Ngày & giờ hẹn"><span className="text-base text-twinkle-ink">{draft.date ? formatDateVietnam(draft.date) : 'Chưa chọn'}</span><span className="ml-2 rounded-full bg-twinkle-yellow/55 px-2.5 py-1 text-xs">{draft.time || '--:--'}</span></TimelineMoment>
        <TimelineMoment index={1} icon="🚗" title="Đón nhau ở đâu?">{draft.pickupLocation.trim() || 'Chưa chọn điểm đón'}</TimelineMoment>
        {stops.length > 0 ? stops.map((stop, index) => <TimelineMoment key={stop.id} index={index + 2} icon={index === stops.length - 1 ? '🌟' : '📍'} title={`Điểm dừng ${index + 1}: ${stop.name}`}><span>{[stop.category, stop.area || stop.address].filter(Boolean).join(' · ')}</span>{stop.cost_estimate > 0 && <span className="ml-2 text-xs text-[#a17eb4]">~ {formatCost(stop.cost_estimate)}</span>}</TimelineMoment>) : <TimelineMoment index={2} icon="🗺️" title={combo?.title || 'Địa điểm của chúng mình'}>{place?.name || 'Chưa chọn địa điểm'}</TimelineMoment>}
        <TimelineMoment index={routeMomentCount + 2} icon="👗" title="Dresscode">{dresscodeLabel(draft) || 'Chưa chọn'}</TimelineMoment>
        {chosenVouchers.length > 0 && <TimelineMoment index={routeMomentCount + 3} icon="🎟️" title="Đặc quyền của nàng"><div className="flex flex-wrap gap-2">{chosenVouchers.map((item) => <Tag key={item.id} className="bg-white/85 text-twinkle-ink shadow-sm">{item.icon} {item.name}</Tag>)}</div></TimelineMoment>}
        <TimelineMoment index={routeMomentCount + (chosenVouchers.length > 0 ? 4 : 3)} icon="💌" title="Lời nhắn riêng"><textarea value={draft.message} onChange={(event) => onMessage(event.target.value)} rows={2} maxLength={2000} placeholder="Em chỉ cần đến thôi, mọi thứ còn lại để anh lo 💖" className="mt-1 w-full resize-y border-b-2 border-dashed border-[#d8b9df] bg-transparent px-1 py-2 text-sm font-medium outline-none focus:border-[#a77fb8]" aria-label="Lời nhắn riêng cho người ấy" /><span className="block text-right text-[11px] text-twinkle-muted">{draft.message.length}/2000</span></TimelineMoment>
      </ol>
      {place && <p className="mt-6 border-t border-dashed border-[#dac7df] pt-4 text-right text-xs font-bold text-[#987da6]">✨ Dự kiến cho hành trình: {formatCost(place.cost)}</p>}
    </div>
    <p className="flex items-start gap-2 text-xs leading-5 text-twinkle-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Người ấy có thể duyệt hoặc xin đổi lịch trực tiếp từ email. Nếu email chưa gửi được, kế hoạch vẫn được lưu.</p>
  </div>;
}
function ResultView({ outcome, onRestart }: { outcome: Outcome; onRestart: () => void }) {
  const sent = outcome.kind === 'sent';
  return <motion.section initial={{ opacity: 0, y: 25, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mx-auto max-w-2xl rounded-[2.5rem] border border-white/90 bg-white/80 px-7 py-12 text-center shadow-[0_25px_70px_rgba(78,67,130,0.15)] backdrop-blur-xl sm:px-12"><div className={`mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] text-5xl shadow-cloud ${sent ? 'bg-twinkle-pink' : 'bg-twinkle-sky'}`}>{sent ? '💌' : '☁️'}</div><Tag className="mt-7 bg-twinkle-yellow/55 text-[#8a7194]">✦ {sent ? 'Lá thư đã được niêm phong' : 'Kế hoạch đã cất đi'}</Tag><h2 className="mt-4 text-3xl font-bold sm:text-4xl">{sent ? 'Lời hẹn đã bay đi rồi!' : 'Mình nghĩ kế hoạch khác nhé'}</h2><p className="mx-auto mt-4 max-w-md text-sm leading-7 text-twinkle-muted">{sent ? outcome.emailSent ? 'Buổi hẹn đang chờ người ấy duyệt trong email. Giữ lại chút hồi hộp ngọt ngào nhé!' : 'Kế hoạch đã được lưu nhưng email chưa gửi thành công. Quản trị viên có thể gửi lại thư từ trang quản trị.' : 'Kế hoạch này đã được lưu với trạng thái Từ chối. Các lựa chọn trong trình lên lịch đã được xóa để mình bắt đầu lại.'}</p><p className="mt-5 text-xs font-semibold text-[#a497b1]">Mã lịch hẹn: {outcome.eventId}</p><div className="mt-8 flex flex-wrap justify-center gap-3"><button type="button" onClick={onRestart} className="inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-3 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 hover:shadow-glow"><RotateCcw className="h-4 w-4" /> Lên lịch mới</button><Link href={sent ? `/memories?eventId=${outcome.eventId}` : '/memories'} className="inline-flex items-center gap-2 rounded-full bg-twinkle-lavender/50 px-5 py-3 text-sm font-bold hover:bg-twinkle-lavender"><DoorOpen className="h-4 w-4" /> Ghé trang kỷ niệm</Link></div></motion.section>;
}

export default function DateWizard() {
  const [catalog, setCatalog] = useState<WizardCatalog>(emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [step, setStep] = useState<Step>(0);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmVeto, setConfirmVeto] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError('');
    try {
      const loaded = await loadWizardCatalog();
      setCatalog(loaded);
    } catch (cause) {
      setCatalogError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu buổi hẹn.');
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => { void loadCatalog(); }, [loadCatalog]);

  useEffect(() => {
    if (!wizardOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || busy) return;
      if (confirmVeto) setConfirmVeto(false);
      else setWizardOpen(false);
    };
    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onEscape);
    };
  }, [wizardOpen, confirmVeto, busy]);

  const selectedPlace = useMemo(() => getSelectedPlace(draft, catalog), [draft, catalog]);
  const today = todayInVietnam();

  function update(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setError('');
  }

  function moveTo(next: Step) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError('');
    wizardRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function validateStep(index: Step): string | null {
    if (index === 0) {
      if (!draft.date || draft.date < today) return 'Hãy chọn một ngày từ hôm nay trở đi.';
      if (!/^\d{2}:\d{2}$/.test(draft.time)) return 'Hãy chọn giờ gặp nhau.';
      if (draft.date === today && draft.time <= vietnamTimeNow()) return 'Giờ hẹn hôm nay cần muộn hơn hiện tại.';
      if (!draft.pickupLocation.trim()) return 'Hãy nhập địa điểm đón.';
      if (!draft.dresscodeColor.trim()) return 'Hãy chọn hoặc nhập màu trang phục.';
      if (!draft.dresscodeStyle) return 'Hãy chọn phong cách trang phục.';
    }
    if (index === 1) {
      if (catalogError) return 'Hãy tải lại danh sách địa điểm trước khi tiếp tục.';
      if (catalogLoading) return 'Danh sách địa điểm đang được tải.';
      if (!draft.choice || !selectedPlace) return 'Hãy thêm điểm dừng vào roadmap hoặc chọn Date Combo.';
    }
    return null;
  }

  function next() {
    const problem = validateStep(step);
    if (problem) return setError(problem);
    if (step < 3) moveTo((step + 1) as Step);
  }

  function toggleVoucher(id: string) {
    if (!draft.voucherIds.includes(id) && draft.voucherIds.length >= 10) {
      setError('Bạn có thể chọn tối đa 10 voucher.');
      return;
    }
    setDraft((current) => ({
      ...current,
      voucherIds: current.voucherIds.includes(id)
        ? current.voucherIds.filter((value) => value !== id)
        : [...current.voucherIds, id]
    }));
    setError('');
  }

  function payload(): DateInvitation {
    const roadmapIds = draft.choice?.kind === 'roadmap' ? draft.choice.ids : [];
    return {
      inviterName: catalog.profile?.nickname_user?.trim() || 'Người thương',
      date: `${draft.date}T00:00:00.000Z`,
      time: draft.time,
      pickupLocation: draft.pickupLocation.trim(),
      dresscode: dresscodeLabel(draft),
      message: draft.message.trim(),
      locationId: roadmapIds.length === 1 ? roadmapIds[0] : null,
      comboId: draft.choice?.kind === 'combo' ? draft.choice.id : null,
      roadmapLocationIds: roadmapIds.length > 1 ? roadmapIds : [],
      appliedVouchers: draft.voucherIds
    };
  }

  function validateComplete(): string | null {
    return validateStep(0) || validateStep(1) || (draft.message.length > 2000 ? 'Lời nhắn quá dài.' : null);
  }

  async function submit() {
    const problem = validateComplete();
    if (problem) return setError(problem);
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await sendInvitation(payload());
      setOutcome({ kind: 'sent', eventId: result.dateEvent.id, emailSent: result.emailSent });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không gửi được lời hẹn.'); }
    finally { setBusy(false); }
  }

  async function veto() {
    const problem = validateComplete();
    if (problem) { setConfirmVeto(false); return setError(problem); }
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await rejectInvitation(payload());
      setDraft(emptyDraft());
      setStep(0);
      setOutcome({ kind: 'rejected', eventId: result.id });
      setConfirmVeto(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể hủy kế hoạch.'); setConfirmVeto(false); }
    finally { setBusy(false); }
  }

  function restart() {
    setDraft(emptyDraft());
    setStep(0);
    setOutcome(null);
    setError('');
    wizardRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <main className="wizard-sky star-field relative min-h-screen overflow-hidden pb-20">
    <span className="wizard-star left-[8%] top-44 text-4xl" aria-hidden="true">✦</span><span className="wizard-star right-[12%] top-72 text-2xl" style={{ animationDelay: '2s' }} aria-hidden="true">✧</span><span className="wizard-star left-[64%] top-[620px] text-3xl" style={{ animationDelay: '4s' }} aria-hidden="true">✦</span>
    <Header profile={catalog.profile} onStart={() => setWizardOpen(true)} />
    <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <section className="soft-reveal grid items-center gap-8 py-10 lg:grid-cols-[1.05fr_0.95fr] lg:py-16"><div><Tag className="border border-white/85 bg-white/75 text-[#9a76aa] shadow-sm"><Sparkles className="h-3.5 w-3.5" /> A little magic for two</Tag><h1 className="mt-6 max-w-2xl text-4xl font-bold leading-[1.13] tracking-tight sm:text-5xl lg:text-[3.8rem]">Một buổi hẹn <span className="text-[#b47da8]">lung linh</span> bắt đầu từ đây.</h1><p className="mt-5 max-w-xl text-base leading-8 text-[#77718f]">Chọn ngày đẹp trời, nơi muốn đến và vài đặc quyền nhỏ. Princess Mode sẽ giúp biến kế hoạch thành một lá thư ngọt ngào.</p><div className="mt-7 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setWizardOpen(true)} className="magic-button inline-flex items-center gap-2 rounded-full bg-[#58466f] px-6 py-3.5 text-sm font-bold text-white shadow-cloud hover:-translate-y-1 hover:shadow-glow"><WandSparkles className="h-5 w-5" /> Bắt đầu lên lịch</button><Tag className="bg-white/60 text-[#826e91]"><Heart className="h-4 w-4 fill-[#e6a5c2] text-[#e6a5c2]" /> Made for us</Tag></div></div><div className="relative mx-auto flex h-72 w-full max-w-md items-center justify-center sm:h-80"><div className="absolute h-60 w-60 animate-float rounded-full bg-[#fff1b6] shadow-[0_0_90px_rgba(255,242,178,0.9)] sm:h-72 sm:w-72" /><Cloud className="absolute -bottom-5 left-0 h-36 w-36 fill-white/85 text-white/85 drop-shadow-md sm:h-44 sm:w-44" /><Cloud className="absolute -bottom-8 right-0 h-40 w-40 fill-white/85 text-white/85 drop-shadow-md sm:h-48 sm:w-48" /><div className="relative z-10 flex h-40 w-40 rotate-[-7deg] flex-col items-center justify-center rounded-3xl border-4 border-white bg-gradient-to-br from-[#ffdfe9] to-[#ebddf7] shadow-[0_18px_40px_rgba(123,89,150,0.24)] sm:h-48 sm:w-48"><span className="text-5xl">💌</span><span className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-[#9675a1]">To my favorite</span></div><Star className="absolute left-10 top-8 h-7 w-7 animate-twinkle fill-twinkle-yellow text-twinkle-yellow" /><Sparkles className="absolute right-6 top-12 h-8 w-8 animate-twinkle text-[#c28db8]" style={{ animationDelay: '1s' }} /></div></section>

      <Link href="/memories" className="magic-card group relative mb-5 flex max-w-xl items-center gap-5 overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-r from-[#fbd7e8] via-[#eee2f5] to-[#d9ebff] p-5 shadow-cloud hover:-translate-y-1 hover:shadow-glow"><span className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-t-[2.5rem] rounded-b-lg border-4 border-white/85 bg-gradient-to-b from-[#a7a1d3] to-[#6d628f] shadow-[inset_0_8px_18px_rgba(255,255,255,0.25)]"><DoorOpen className="h-9 w-9 animate-twinkle text-[#fff3c7]" /></span><span><span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-[#a079a8]">Magical door</span><strong className="mt-1 block text-base leading-5">Bước vào vũ trụ kỷ niệm</strong><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#8a6f9e]">Mở nhật ký của chúng mình <ChevronRight className="h-4 w-4" /></span></span></Link>

      <AnimatePresence>{wizardOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-[#302840]/55 p-2 backdrop-blur-md sm:p-3"><motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.98 }} transition={{ duration: 0.22 }} role="dialog" aria-modal="true" aria-labelledby="wizard-title" className="flex max-h-[calc(100dvh-1rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-white/90 bg-[#f8f1fa] shadow-[0_30px_90px_rgba(35,24,61,0.3)] sm:max-h-[calc(100dvh-1.5rem)]"><div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/80 bg-white/65 px-5 py-3 sm:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#9c82b0]">Princess Mode · Bước {step + 1}/4</p><h2 id="wizard-title" className="text-lg font-bold sm:text-xl">{outcome ? 'Lời hẹn của chúng mình' : 'Lên lịch hẹn hò'}</h2></div><button type="button" onClick={() => !busy && setWizardOpen(false)} disabled={busy} aria-label="Đóng trình lên lịch" className="rounded-full bg-white p-2.5 text-[#78648d] shadow-sm hover:bg-twinkle-pink/50 disabled:opacity-50"><X className="h-5 w-5" /></button></div>{!outcome && <Progress step={step} onBackTo={moveTo} />}<div ref={wizardRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4"><section id="wizard">
        {outcome ? <ResultView outcome={outcome} onRestart={restart} /> : <div className={`mx-auto min-w-0 rounded-[2rem] border border-white/90 bg-[#fffaf8]/85 p-4 shadow-[0_18px_55px_rgba(100,86,139,0.12)] backdrop-blur-xl sm:p-5 ${step === 0 ? 'max-w-6xl' : 'max-w-4xl'}`}>
          <AnimatePresence mode="wait" custom={direction}><motion.div key={step} custom={direction} initial={{ opacity: 0, x: direction * 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -24 }} transition={{ duration: 0.24, ease: 'easeOut' }}>
            {step === 0 && <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch"><DateCalendar selectedDate={draft.date} today={today} onSelect={(date) => update({ date })} /><StyleStep draft={draft} update={update} /></div>}
            {step === 1 && (catalogLoading ? <div className="flex min-h-64 flex-col items-center justify-center rounded-[1.5rem] bg-white/60 text-center"><Sparkles className="h-8 w-8 animate-twinkle text-[#b397c5]" /><p className="mt-3 text-sm font-bold">Đang mở kho điểm hẹn...</p></div> : catalogError ? <div role="alert" className="rounded-[1.5rem] bg-rose-50 p-7 text-center"><p className="font-bold text-rose-700">{catalogError}</p><button type="button" onClick={() => void loadCatalog()} className="mt-5 rounded-full bg-twinkle-ink px-5 py-2.5 text-sm font-bold text-white">Tải lại địa điểm</button></div> : <PlacePicker locations={catalog.locations} combos={catalog.combos} choice={draft.choice} onChoose={(choice) => update({ choice })} />)}
            {step === 2 && <VoucherStep vouchers={catalog.vouchers} selectedIds={draft.voucherIds} onToggle={toggleVoucher} />}
            {step === 3 && <ReviewStep draft={draft} catalog={catalog} onMessage={(message) => update({ message })} />}
          </motion.div></AnimatePresence>
          {error && <div role="alert" className="mt-7 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"><X className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eee7ed] pt-3"><div>{step > 0 && <button type="button" onClick={() => moveTo((step - 1) as Step)} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#78648d] shadow-sm hover:bg-twinkle-sky/40"><ArrowLeft className="h-4 w-4" /> Quay lại</button>}</div>{step < 3 ? <button type="button" onClick={next} className="magic-button inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-6 py-2.5 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 hover:shadow-glow">Tiếp tục <ArrowRight className="h-4 w-4" /></button> : <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => setConfirmVeto(true)} className="rounded-full border border-[#e8c3d3] bg-[#fff0f5] px-4 py-2.5 text-xs font-bold text-[#a56b85] hover:bg-[#ffdfeb] disabled:opacity-50 sm:text-sm">Nghĩ kế hoạch khác đi</button><button type="button" disabled={busy} onClick={() => void submit()} className="magic-button inline-flex items-center gap-2 rounded-full bg-twinkle-ink px-5 py-2.5 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 hover:shadow-glow disabled:opacity-50"><Send className="h-4 w-4" /> {busy ? 'Đang gửi...' : 'Gửi thư'}</button></div>}</div>
        </div>}
      </section></div></motion.div></motion.div>}</AnimatePresence>
      <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-white/75 pt-6 text-xs font-semibold text-[#918ca5]"><span>✦ Twinkle Twinkle · một buổi hẹn chỉ của hai người</span><Link href="/admin" className="hover:text-[#6b5b82]">Princess Studio <ArrowRight className="ml-1 inline h-3 w-3" /></Link></footer>
    </div>

    <AnimatePresence>{confirmVeto && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#302840]/50 p-4 backdrop-blur-sm"><div role="alertdialog" aria-modal="true" aria-labelledby="veto-title" className="w-full max-w-md rounded-[2rem] bg-[#fffaf8] p-7 text-center shadow-2xl"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-twinkle-sky text-3xl">☁️</div><h2 id="veto-title" className="mt-5 text-xl font-bold">Đổi ý về kế hoạch này?</h2><p className="mt-3 text-sm leading-6 text-twinkle-muted">Kế hoạch hiện tại sẽ được lưu là <strong>Từ chối</strong>, không gửi email, và các lựa chọn trong trình lên lịch sẽ được xóa.</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setConfirmVeto(false)} className="flex-1 rounded-full bg-twinkle-lavender/45 px-4 py-3 text-sm font-bold">Giữ kế hoạch</button><button type="button" disabled={busy} onClick={() => void veto()} className="flex-1 rounded-full bg-twinkle-ink px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Đổi kế hoạch'}</button></div></div></motion.div>}</AnimatePresence>
  </main>;
}
