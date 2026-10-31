'use client';

import { useEffect, useMemo, useState, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { Reorder } from 'framer-motion';
import { Check, ExternalLink, GripVertical, MapPin, Phone, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import type { ComboDate, Location } from '@/lib/types';
import { formatCost, safeWebUrl, tiktokPlayerUrl, youtubeEmbedUrl } from '@/lib/wizard-utils';

export type PlaceChoice = { kind: 'roadmap'; ids: string[] } | { kind: 'combo'; id: string } | null;

type Props = {
  locations: Location[];
  combos: ComboDate[];
  choice: PlaceChoice;
  onChoose: (choice: PlaceChoice) => void;
};

function RouteStops({ stops, editable = false, onReorder, onRemove }: {
  stops: Location[];
  editable?: boolean;
  onReorder?: (ids: string[]) => void;
  onRemove?: (id: string) => void;
}) {
  return <div className="relative pl-1">
    <div className="absolute bottom-6 left-[1.7rem] top-6 w-0.5 bg-gradient-to-b from-twinkle-pink via-twinkle-lavender to-twinkle-sky" aria-hidden="true" />
    <Reorder.Group axis="y" values={stops.map((stop) => stop.id)} onReorder={(ids) => onReorder?.(ids)} className="relative space-y-2">
      {stops.map((stop, index) => <Reorder.Item key={stop.id} value={stop.id} dragListener={editable} className="relative flex items-center gap-2 rounded-2xl border border-white bg-white p-2.5 shadow-sm">
        <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-twinkle-lavender text-xs font-extrabold">{index + 1}</span>
        <span className="h-10 w-11 shrink-0 overflow-hidden rounded-xl bg-twinkle-sky/60">{stop.images?.[0] ? <img src={stop.images[0]} alt="" className="h-full w-full object-cover" /> : <MapPin className="m-3 h-4 w-4" />}</span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-xs">{stop.name}</strong><small className="block truncate text-[11px] text-twinkle-muted">{stop.area || stop.category}</small></span>
        {editable && <><GripVertical className="h-4 w-4 shrink-0 cursor-grab text-[#aa8dbb]" aria-hidden="true" /><button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => onRemove?.(stop.id)} aria-label={`Bỏ ${stop.name} khỏi lộ trình`} className="rounded-full p-1.5 text-rose-400 hover:bg-rose-50"><Trash2 className="h-3.5 w-3.5" /></button></>}
      </Reorder.Item>)}
    </Reorder.Group>
  </div>;
}

function LocationDetail({ item, onClose }: { item: Location; onClose: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', closeOnEscape, true);
    return () => window.removeEventListener('keydown', closeOnEscape, true);
  }, [onClose]);
  const youtube = item.youtubeLink ? youtubeEmbedUrl(item.youtubeLink) : null;
  const tiktok = item.tiktokLink ? tiktokPlayerUrl(item.tiktokLink) : null;
  const [video, setVideo] = useState<'youtube' | 'tiktok'>(youtube ? 'youtube' : 'tiktok');
  const embed = video === 'youtube' ? youtube : tiktok;
  const maps = safeWebUrl(item.mapsLink);
  const youtubeLink = safeWebUrl(item.youtubeLink);
  const tiktokLink = safeWebUrl(item.tiktokLink);
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#302840]/60 p-3 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-label={`Chi tiết ${item.name}`} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-[#fffaf8] p-4 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-[#a17eb4]">{item.category} · {item.area}</p><h3 className="mt-1 text-xl font-extrabold">{item.name}</h3></div><button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-full bg-twinkle-pink/40 px-3 py-1.5 text-lg font-bold">×</button></div>
      {item.images?.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{item.images.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Ảnh ${index + 1} của ${item.name}`} className="h-36 w-48 shrink-0 rounded-2xl object-cover" />)}</div>}
      <p className="mt-4 text-sm text-twinkle-muted">{item.address}</p><p className="mt-2 text-sm text-twinkle-muted">{item.notes}</p>
      <div className="mt-4 flex flex-wrap gap-2">{maps && <a href={maps} target="_blank" rel="noopener noreferrer" className="rounded-full bg-twinkle-sky/60 px-3 py-2 text-xs font-bold">📍 Google Maps</a>}{item.phone && <a href={`tel:${item.phone.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-1 rounded-full bg-twinkle-yellow/60 px-3 py-2 text-xs font-bold"><Phone className="h-4 w-4" /> {item.phone}</a>}{youtubeLink && <a href={youtubeLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-twinkle-pink/55 px-3 py-2 text-xs font-bold">YouTube ↗</a>}{tiktokLink && <a href={tiktokLink} target="_blank" rel="noopener noreferrer" className="rounded-full bg-twinkle-lavender/50 px-3 py-2 text-xs font-bold">TikTok ↗</a>}</div>
      {(youtube || tiktok) && <div className="mt-5"><div className="mb-2 flex gap-2">{youtube && <button type="button" onClick={() => setVideo('youtube')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${video === 'youtube' ? 'bg-twinkle-ink text-white' : 'bg-white'}`}>YouTube</button>}{tiktok && <button type="button" onClick={() => setVideo('tiktok')} className={`rounded-full px-3 py-1.5 text-xs font-bold ${video === 'tiktok' ? 'bg-twinkle-ink text-white' : 'bg-white'}`}>TikTok</button>}</div>{embed && <iframe key={embed} src={embed} title={`Video review ${item.name}`} loading="lazy" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen className={`mx-auto w-full rounded-2xl border-0 bg-[#2e2942] ${video === 'tiktok' ? 'h-[420px] max-w-[300px]' : 'aspect-video'}`} />}</div>}
    </div>
  </div>;
}

export default function PlacePicker({ locations, combos, choice, onChoose }: Props) {
  const [tab, setTab] = useState<'roadmap' | 'combo'>(choice?.kind === 'combo' ? 'combo' : 'roadmap');
  const [routeIds, setRouteIds] = useState<string[]>(choice?.kind === 'roadmap' ? choice.ids : []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tất cả');
  const [area, setArea] = useState('Tất cả');
  const [detail, setDetail] = useState<Location | null>(null);
  const categories = useMemo(() => ['Tất cả', ...Array.from(new Set(locations.map((item) => item.category).filter(Boolean)))], [locations]);
  const areas = useMemo(() => ['Tất cả', ...Array.from(new Set(locations.map((item) => item.area).filter(Boolean)))], [locations]);
  const q = query.trim().toLocaleLowerCase('vi-VN');
  const filtered = locations.filter((item) => (category === 'Tất cả' || item.category === category) && (area === 'Tất cả' || item.area === area) && `${item.name} ${item.area} ${item.address} ${item.category} ${item.notes}`.toLocaleLowerCase('vi-VN').includes(q));
  const stops = routeIds.map((id) => locations.find((item) => item.id === id)).filter((item): item is Location => Boolean(item));
  const combo = choice?.kind === 'combo' ? combos.find((item) => item.id === choice.id) : null;
  const comboStops = combo?.locationIds.map((id) => locations.find((item) => item.id === id)).filter((item): item is Location => Boolean(item)) ?? [];
  const directionsUrl = stops.length > 1 && stops.every((stop) => stop.address) ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(stops[0].address)}&destination=${encodeURIComponent(stops[stops.length - 1].address)}${stops.length > 2 ? `&waypoints=${encodeURIComponent(stops.slice(1, -1).map((stop) => stop.address).join('|'))}` : ''}` : null;

  function setRoute(ids: string[]) { setRouteIds(ids); onChoose(ids.length ? { kind: 'roadmap', ids } : null); }
  function addStop(id: string) { if (!routeIds.includes(id) && routeIds.length < 10) setRoute([...routeIds, id]); }
  function dropStop(event: DragEvent<HTMLElement>) { event.preventDefault(); const id = event.dataTransfer.getData('application/x-twinkle-location'); if (locations.some((item) => item.id === id)) addStop(id); }
  function dragStart(event: DragEvent<HTMLElement>, id: string) { event.dataTransfer.setData('application/x-twinkle-location', id); event.dataTransfer.effectAllowed = 'copy'; }

  return <div className="space-y-4">
    <div><p className="text-xs font-bold uppercase tracking-[0.24em] text-[#aa85b4]">Bước 02 · Princess Roadmap</p><h2 className="mt-1 text-2xl font-bold">Mình sẽ đi những đâu?</h2><p className="mt-1 text-xs text-twinkle-muted">Kéo địa điểm vào lộ trình, rồi kéo các điểm dừng để đổi thứ tự. Trên điện thoại, chạm dấu + để thêm.</p></div>
    <div className="flex w-fit gap-1 rounded-full bg-white/80 p-1 shadow-sm" role="tablist" aria-label="Kiểu lộ trình"><button type="button" role="tab" aria-selected={tab === 'roadmap'} onClick={() => { setTab('roadmap'); onChoose(routeIds.length ? { kind: 'roadmap', ids: routeIds } : null); }} className={`rounded-full px-4 py-2 text-xs font-bold ${tab === 'roadmap' ? 'bg-twinkle-ink text-white' : 'text-twinkle-muted'}`}>Tự tạo roadmap</button><button type="button" role="tab" aria-selected={tab === 'combo'} onClick={() => { setTab('combo'); onChoose(combo ? { kind: 'combo', id: combo.id } : null); }} className={`rounded-full px-4 py-2 text-xs font-bold ${tab === 'combo' ? 'bg-twinkle-ink text-white' : 'text-twinkle-muted'}`}>Date Combos</button></div>
    {tab === 'roadmap' ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
      <div className="min-w-0"><div className="grid gap-2 sm:grid-cols-[1fr_150px_150px]"><label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-twinkle-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Tìm địa điểm hoặc địa chỉ" placeholder="Tìm tên, địa chỉ..." className="w-full rounded-xl border border-[#e8e3ee] bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-twinkle-lavender" /></label><select aria-label="Lọc theo khu vực" value={area} onChange={(event) => setArea(event.target.value)} className="rounded-xl border border-[#e8e3ee] bg-white px-2 py-2 text-xs font-bold"><option value="Tất cả">Mọi khu vực</option>{areas.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select aria-label="Lọc theo loại hình" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-[#e8e3ee] bg-white px-2 py-2 text-xs font-bold"><option value="Tất cả">Mọi loại hình</option>{categories.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="mt-3 grid max-h-[45vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">{filtered.map((item) => <article key={item.id} draggable onDragStart={(event) => dragStart(event, item.id)} className="group flex cursor-grab items-center gap-2 rounded-2xl border border-white bg-white/90 p-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-cloud"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-twinkle-sky/60">{item.images?.[0] ? <img src={item.images[0]} alt="" className="h-full w-full object-cover" /> : <MapPin className="m-5 h-6 w-6" />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold">{item.name}</p><p className="truncate text-[11px] text-twinkle-muted">{item.area || item.address || item.category}</p><p className="truncate text-[10px] text-[#a17eb4]">{item.category} · {formatCost(item.cost_estimate)}</p><button type="button" onClick={() => setDetail(item)} className="mt-1 text-[11px] font-bold text-[#8e6da5] underline">Xem ảnh & review</button></div><button type="button" disabled={routeIds.includes(item.id) || routeIds.length >= 10} onClick={() => addStop(item.id)} aria-label={`Thêm ${item.name} vào lộ trình`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-twinkle-lavender/55 disabled:opacity-50">{routeIds.includes(item.id) ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}</button></article>)}{filtered.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-twinkle-lavender p-8 text-center text-sm font-bold text-twinkle-muted">Không tìm thấy địa điểm phù hợp.</div>}</div>
      </div>
      <section onDragOver={(event) => event.preventDefault()} onDrop={dropStop} className="min-w-0 rounded-[1.5rem] border-2 border-dashed border-[#cdb4db] bg-gradient-to-b from-white/90 to-[#f2eafa] p-4"><div className="flex items-center justify-between gap-2"><div><p className="text-[11px] font-bold uppercase tracking-widest text-[#a17eb4]">Our roadmap</p><h3 className="text-lg font-extrabold">{stops.length} điểm dừng</h3></div><Sparkles className="h-6 w-6 text-[#c39bcf]" /></div>{stops.length ? <><div className="mt-3 max-h-[38vh] overflow-y-auto pr-1"><RouteStops stops={stops} editable onReorder={setRoute} onRemove={(id) => setRoute(routeIds.filter((value) => value !== id))} /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e5ddec] pt-3 text-xs font-bold"><span>Tổng: {formatCost(stops.reduce((total, stop) => total + stop.cost_estimate, 0))}</span>{directionsUrl && <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#8564a0]">Mở đường đi <ExternalLink className="h-3 w-3" /></a>}</div></> : <div className="mt-4 rounded-2xl bg-white/75 p-8 text-center text-xs font-semibold text-twinkle-muted"><MapPin className="mx-auto mb-2 h-6 w-6 text-[#b895c9]" />Thả địa điểm vào đây hoặc bấm dấu +</div>}</section>
    </div> : <div className="grid gap-4 lg:grid-cols-2"><div className="max-h-[48vh] space-y-2 overflow-y-auto pr-1">{combos.map((item) => <button key={item.id} type="button" onClick={() => onChoose({ kind: 'combo', id: item.id })} className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left ${choice?.kind === 'combo' && choice.id === item.id ? 'border-twinkle-lavender bg-white' : 'border-white bg-white/75'}`}><span className="text-2xl">{item.icon || '🌙'}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm">{item.title}</strong><small className="line-clamp-1 text-twinkle-muted">{item.description}</small></span>{choice?.kind === 'combo' && choice.id === item.id && <Check className="h-4 w-4" />}</button>)}{combos.length === 0 && <p className="rounded-2xl bg-white/70 p-6 text-sm text-twinkle-muted">Chưa có combo nào. Bạn có thể tự tạo roadmap.</p>}</div><div className="rounded-[1.5rem] bg-white/85 p-4"><h3 className="font-extrabold">{combo?.title || 'Chọn một Date Combo'}</h3><p className="mt-1 text-xs text-twinkle-muted">{combo?.description}</p>{comboStops.length > 0 && <div className="mt-4"><RouteStops stops={comboStops} /></div>}</div></div>}
    {detail && createPortal(<LocationDetail key={detail.id} item={detail} onClose={() => setDetail(null)} />, document.body)}
  </div>;
}
