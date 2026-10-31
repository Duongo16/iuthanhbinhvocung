'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Heart, Image as ImageIcon, Sparkles } from 'lucide-react';
import type { CoupleProfile } from '@/lib/types';

type Props = {
  profile: CoupleProfile | null;
  onSave: (payload: Record<string, unknown>) => Promise<void>;
};

const inputClass = 'mt-2 w-full rounded-2xl border border-[#e4dff0] bg-white/85 px-4 py-3 text-sm font-semibold outline-none focus:border-twinkle-lavender focus:ring-4 focus:ring-twinkle-lavender/20';

export default function ProfilePanel({ profile, onSave }: Props) {
  const [userName, setUserName] = useState(profile?.nickname_user ?? '');
  const [partnerName, setPartnerName] = useState(profile?.nickname_partner ?? '');
  const [userAvatar, setUserAvatar] = useState(profile?.avatar_user ?? '');
  const [partnerAvatar, setPartnerAvatar] = useState(profile?.avatar_partner ?? '');
  const [cover, setCover] = useState(profile?.cover_photo ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setUserName(profile?.nickname_user ?? '');
    setPartnerName(profile?.nickname_partner ?? '');
    setUserAvatar(profile?.avatar_user ?? '');
    setPartnerAvatar(profile?.avatar_partner ?? '');
    setCover(profile?.cover_photo ?? '');
  }, [profile]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        nickname_user: userName.trim(),
        nickname_partner: partnerName.trim(),
        avatar_user: userAvatar.trim() || null,
        avatar_partner: partnerAvatar.trim() || null,
        cover_photo: cover.trim() || null
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể lưu hồ sơ.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/75 shadow-cloud">
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-twinkle-sky via-twinkle-lavender to-twinkle-pink">
          {cover ? <img src={cover} alt="Ảnh bìa của cặp đôi" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Sparkles className="h-16 w-16 animate-twinkle text-white" /></div>}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#3f3a5a]/20 to-transparent" />
        </div>
        <div className="-mt-11 flex justify-center gap-4">
          {[{ src: userAvatar, label: userName || 'Bạn' }, { src: partnerAvatar, label: partnerName || 'Người ấy' }].map((avatar, index) => (
            <div key={index} className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-twinkle-pink text-2xl shadow-sm">
              {avatar.src ? <img src={avatar.src} alt={`Avatar ${avatar.label}`} className="h-full w-full object-cover" /> : index === 0 ? '👩' : '🧑'}
            </div>
          ))}
        </div>
        <div className="px-6 pb-8 pt-5 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a48ab5]">Our little universe</p><h2 className="mt-2 flex items-center justify-center gap-2 text-xl font-bold">{userName || 'Bạn'} <Heart className="h-4 w-4 fill-[#f7a3c4] text-[#f7a3c4]" /> {partnerName || 'Người ấy'}</h2><p className="mt-3 text-sm text-twinkle-muted">Ảnh và tên này sẽ xuất hiện ở trang kỷ niệm.</p></div>
      </div>
      <form onSubmit={submit} className="space-y-5 rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-cloud sm:p-8">
        <div><span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-twinkle-pink"><ImageIcon className="h-5 w-5" /></span><h2 className="mt-4 text-xl font-bold">Hồ sơ của hai người</h2><p className="mt-1 text-sm text-twinkle-muted">Mọi thay đổi sẽ được xem trước ngay bên cạnh.</p></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-bold">Tên của bạn *<input required maxLength={80} className={inputClass} value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="Công chúa" /></label>
          <label className="text-sm font-bold">Tên người ấy *<input required maxLength={80} className={inputClass} value={partnerName} onChange={(event) => setPartnerName(event.target.value)} placeholder="Hoàng tử" /></label>
        </div>
        <label className="block text-sm font-bold">Avatar của bạn<input type="url" className={inputClass} value={userAvatar} onChange={(event) => setUserAvatar(event.target.value)} placeholder="https://example.com/avatar-1.jpg" /></label>
        <label className="block text-sm font-bold">Avatar người ấy<input type="url" className={inputClass} value={partnerAvatar} onChange={(event) => setPartnerAvatar(event.target.value)} placeholder="https://example.com/avatar-2.jpg" /></label>
        <label className="block text-sm font-bold">Ảnh bìa<input type="url" className={inputClass} value={cover} onChange={(event) => setCover(event.target.value)} placeholder="https://example.com/cover.jpg" /></label>
        {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-twinkle-ink px-5 py-3.5 text-sm font-bold text-white shadow-cloud hover:-translate-y-0.5 disabled:opacity-60"><Check className="h-4 w-4" /> {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
      </form>
    </div>
  );
}
