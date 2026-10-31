'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, Image as ImageIcon, MapPin, Sparkles, Ticket, X } from 'lucide-react';
import type { ComboDate, Location, Voucher } from '@/lib/types';
import { uploadMemoryImage as uploadLocationImage } from '@/lib/memories-api';

export type EditorState =
  | { kind: 'locations'; item?: Location }
  | { kind: 'combos'; item?: ComboDate }
  | { kind: 'vouchers'; item?: Voucher };

type EditorProps = {
  editor: EditorState;
  locations: Location[];
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
};

const inputClass =
  'mt-2 w-full rounded-2xl border border-[#e4dff0] bg-white/85 px-4 py-3 text-sm font-semibold text-twinkle-ink outline-none transition focus:border-twinkle-lavender focus:ring-4 focus:ring-twinkle-lavender/20';

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-bold text-twinkle-ink">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-medium text-twinkle-muted">{hint}</span>}
    </label>
  );
}

function SaveButton({ saving, disabled = false }: { saving: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-twinkle-ink px-6 py-3.5 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Check className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
    </button>
  );
}

function LocationForm({ initial, onSave }: { initial?: Location; onSave: EditorProps['onSave'] }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [area, setArea] = useState(initial?.area ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [mapsLink, setMapsLink] = useState(initial?.mapsLink ?? '');
  const [images, setImages] = useState(initial?.images.join('\n') ?? '');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [tiktokLink, setTiktokLink] = useState(initial?.tiktokLink ?? '');
  const [youtubeLink, setYoutubeLink] = useState(initial?.youtubeLink ?? '');
  const [cost, setCost] = useState(String(initial?.cost_estimate ?? ''));
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const imageUrls = images.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    if (imageUrls.length + imageFiles.length < 1 || imageUrls.length + imageFiles.length > 12)
      return setError('Cần từ 1 đến 12 ảnh địa điểm.');
    if (!tiktokLink.trim() && !youtubeLink.trim())
      return setError('Hãy thêm ít nhất một link TikTok hoặc YouTube review.');
    setSaving(true);
    try {
      const uploaded = await Promise.all(imageFiles.map((file) => uploadLocationImage(file)));
      await onSave({
        name: name.trim(),
        category: category.trim(),
        area: area.trim(),
        address: address.trim(),
        phone: phone.trim(),
        mapsLink: mapsLink.trim(),
        images: [...imageUrls, ...uploaded.map((item) => item.url)],
        tiktokLink: tiktokLink.trim() || null,
        youtubeLink: youtubeLink.trim() || null,
        cost_estimate: cost === '' ? 0 : Number(cost),
        notes: notes.trim()
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu địa điểm.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên địa điểm *">
          <input autoFocus required maxLength={120} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Tiệm Mây Hồng" />
        </Field>
        <Field label="Danh mục *">
          <input required maxLength={80} list="place-categories" className={inputClass} value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Quán cà phê" />
          <datalist id="place-categories">
            <option value="Chill chill" /><option value="Vận động" /><option value="Ăn uống" /><option value="Nghỉ ngơi" /><option value="Xem phim" /><option value="Dạo chơi" />
          </datalist>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Khu vực *"><input required maxLength={100} className={inputClass} value={area} onChange={(event) => setArea(event.target.value)} placeholder="Quận 1, TP.HCM" /></Field><Field label="Số điện thoại *"><input required type="tel" maxLength={30} className={inputClass} value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="090 123 4567" /></Field></div>
      <Field label="Địa chỉ *"><input required maxLength={300} className={inputClass} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Số nhà, đường, phường, quận..." /></Field>
      <Field label="Google Maps *">
        <input required type="url" className={inputClass} value={mapsLink} onChange={(event) => setMapsLink(event.target.value)} placeholder="https://maps.google.com/..." />
      </Field>
      <Field label="Ảnh địa điểm *" hint="Dán URL ảnh hoặc tải ảnh lên; tổng cộng 1–12 ảnh.">
        <textarea rows={3} className={inputClass} value={images} onChange={(event) => setImages(event.target.value)} placeholder="https://example.com/photo-1.jpg" />
      </Field>
      <label className="block rounded-2xl border border-dashed border-twinkle-lavender bg-twinkle-lavender/10 p-4 text-sm font-bold">Tải ảnh từ máy<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))} className="mt-2 block w-full text-xs" />{imageFiles.length > 0 && <span className="mt-2 block text-xs text-twinkle-muted">Đã chọn {imageFiles.length} ảnh</span>}</label>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="TikTok review"><input type="url" className={inputClass} value={tiktokLink} onChange={(event) => setTiktokLink(event.target.value)} placeholder="https://www.tiktok.com/@.../video/..." /></Field><Field label="YouTube review"><input type="url" className={inputClass} value={youtubeLink} onChange={(event) => setYoutubeLink(event.target.value)} placeholder="https://youtu.be/..." /></Field></div>
      <p className="-mt-3 text-xs font-semibold text-twinkle-muted">Cần ít nhất một link video review.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Chi phí ước tính (₫)">
          <input type="number" min="0" max="1000000000" step="1000" className={inputClass} value={cost} onChange={(event) => setCost(event.target.value)} placeholder="250000" />
        </Field>
        <Field label="Ghi chú">
          <input maxLength={2000} className={inputClass} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Bàn gần cửa sổ rất xinh" />
        </Field>
      </div>
      {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      <SaveButton saving={saving} />
    </form>
  );
}

function ComboForm({ initial, locations, onSave }: { initial?: ComboDate; locations: Location[]; onSave: EditorProps['onSave'] }) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🌙');
  const [selected, setSelected] = useState<string[]>(initial?.locationIds ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) return setError('Chọn ít nhất một địa điểm cho combo.');
    setError('');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), icon: icon.trim(), locationIds: selected });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu combo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-[88px_1fr] gap-4">
        <Field label="Biểu tượng">
          <input maxLength={50} className={`${inputClass} text-center text-2xl`} value={icon} onChange={(event) => setIcon(event.target.value)} aria-label="Biểu tượng combo" />
        </Field>
        <Field label="Tên combo *">
          <input autoFocus required maxLength={120} className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Một ngày dưới trời sao" />
        </Field>
      </div>
      <Field label="Mô tả">
        <textarea rows={3} maxLength={2000} className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Cà phê, dạo phố và một buổi tối thật dịu dàng..." />
      </Field>
      <div>
        <p className="text-sm font-bold">Địa điểm trong combo *</p>
        <p className="mt-1 text-xs font-medium text-twinkle-muted">Chọn theo thứ tự bạn muốn đi.</p>
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
          {locations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-twinkle-lavender p-5 text-sm text-twinkle-muted">Hãy tạo một địa điểm trước khi thêm combo.</div>
          ) : locations.map((location) => (
            <label key={location.id} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition ${selected.includes(location.id) ? 'border-twinkle-lavender bg-twinkle-lavender/20' : 'border-[#e9e5f0] bg-white/70 hover:border-twinkle-lavender'}`}>
              <input type="checkbox" checked={selected.includes(location.id)} onChange={() => toggle(location.id)} className="h-4 w-4 accent-[#a77cc1]" />
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-twinkle-sky/60">
                {location.images[0] ? <img src={location.images[0]} alt="" className="h-full w-full object-cover" /> : <MapPin className="h-4 w-4" />}
              </span>
              <span className="min-w-0"><strong className="block truncate text-sm">{location.name}</strong><small className="text-twinkle-muted">{location.category}</small></span>
              {selected.includes(location.id) && <span className="ml-auto rounded-full bg-twinkle-lavender px-2 py-1 text-xs font-bold">{selected.indexOf(location.id) + 1}</span>}
            </label>
          ))}
        </div>
      </div>
      {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      <SaveButton saving={saving} disabled={locations.length === 0} />
    </form>
  );
}

function VoucherForm({ initial, onSave }: { initial?: Voucher; onSave: EditorProps['onSave'] }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🎟️');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim(), icon: icon.trim() });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu voucher.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Tên voucher *">
        <input autoFocus required maxLength={120} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} placeholder="Vé đi trễ 15 phút" />
      </Field>
      <Field label="Mô tả">
        <textarea rows={4} maxLength={1000} className={inputClass} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Một chiếc đặc quyền bé xíu cho buổi hẹn của hai người..." />
      </Field>
      <Field label="Biểu tượng">
        <input maxLength={50} className={inputClass} value={icon} onChange={(event) => setIcon(event.target.value)} placeholder="🎟️" />
      </Field>
      <div className="flex flex-wrap gap-2" aria-label="Chọn nhanh biểu tượng">
        {['🎟️', '🧋', '⏰', '🍿', '🌸', '💌'].map((emoji) => (
          <button key={emoji} type="button" onClick={() => setIcon(emoji)} aria-label={`Chọn ${emoji}`} aria-pressed={icon === emoji} className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${icon === emoji ? 'bg-twinkle-lavender shadow-cloud' : 'bg-white/70 hover:bg-twinkle-pink/50'}`}>{emoji}</button>
        ))}
      </div>
      {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
      <SaveButton saving={saving} />
    </form>
  );
}

export default function AdminEditor({ editor, locations, onClose, onSave }: EditorProps) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const labels = {
    locations: { title: 'địa điểm', icon: MapPin, color: 'bg-twinkle-sky' },
    combos: { title: 'combo hẹn hò', icon: Sparkles, color: 'bg-twinkle-lavender' },
    vouchers: { title: 'voucher', icon: Ticket, color: 'bg-twinkle-pink' }
  };
  const meta = labels[editor.kind];
  const Icon = meta.icon;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <motion.button type="button" aria-label="Đóng biểu mẫu" onClick={onClose} className="absolute inset-0 bg-[#24213d]/45 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${editor.item ? 'Sửa' : 'Thêm'} ${meta.title}`}
        initial={{ x: '100%', opacity: 0.8 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0.8 }}
        transition={{ type: 'spring', damping: 30, stiffness: 280 }}
        className="relative z-10 flex h-full w-full max-w-xl flex-col overflow-y-auto rounded-l-[2rem] bg-[#fffaf7] px-6 py-7 shadow-2xl sm:px-9"
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${meta.color}`}><Icon className="h-6 w-6" /></div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-twinkle-muted">Princess Studio</p>
            <h2 className="mt-1 text-2xl font-bold">{editor.item ? 'Chỉnh sửa' : 'Thêm'} {meta.title}</h2>
            <p className="mt-2 text-sm text-twinkle-muted">Lưu lại một chút phép màu cho buổi hẹn tiếp theo.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-full bg-white p-2.5 shadow-sm hover:bg-twinkle-pink/40"><X className="h-5 w-5" /></button>
        </div>
        <div className="mb-7 flex items-center gap-2 rounded-2xl bg-twinkle-sky/30 px-4 py-3 text-xs font-semibold text-twinkle-muted">
          <ImageIcon className="h-4 w-4 shrink-0" /> Nội dung sẽ xuất hiện trong Princess Mode sau khi lưu.
        </div>
        {editor.kind === 'locations' && <LocationForm initial={editor.item} onSave={onSave} />}
        {editor.kind === 'combos' && <ComboForm initial={editor.item} locations={locations} onSave={onSave} />}
        {editor.kind === 'vouchers' && <VoucherForm initial={editor.item} onSave={onSave} />}
      </motion.aside>
    </div>
  );
}
