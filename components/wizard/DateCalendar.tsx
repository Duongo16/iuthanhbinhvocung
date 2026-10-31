'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { formatDateVietnam } from '@/lib/wizard-utils';

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function moveMonth(month: string, offset: number) {
  const [year, number] = month.split('-').map(Number);
  const next = new Date(Date.UTC(year, number - 1 + offset, 1));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default function DateCalendar({ selectedDate, today, onSelect }: {
  selectedDate: string;
  today: string;
  onSelect: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => (selectedDate >= today ? selectedDate : today).slice(0, 7));
  const [direction, setDirection] = useState(1);
  const [year, monthNumber] = month.split('-').map(Number);
  const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1));
  const offset = (firstDay.getUTCDay() + 6) % 7;
  const numberOfDays = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const days = Array.from({ length: offset + numberOfDays }, (_, index) => index - offset + 1);
  const monthLabel = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(firstDay);
  const changeMonth = (offset: number) => { setDirection(offset); setMonth(moveMonth(month, offset)); };

  return <div className="min-w-0 space-y-3">
    <div><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#aa85b4]">Bước 01 · Chọn ngày</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">Mình hẹn nhau ngày nào?</h2></div>
    <div className="rounded-[1.5rem] border border-white bg-white/85 p-3 shadow-cloud sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-3"><button type="button" onClick={() => changeMonth(-1)} disabled={month <= today.slice(0, 7)} aria-label="Tháng trước" className="rounded-full bg-twinkle-sky/45 p-2 text-[#675778] hover:bg-twinkle-sky disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft className="h-4 w-4" /></button><div className="flex items-center gap-2 text-center text-sm font-bold capitalize sm:text-base"><CalendarDays className="h-4 w-4 text-[#ae85be]" />{monthLabel}</div><button type="button" onClick={() => changeMonth(1)} aria-label="Tháng sau" className="rounded-full bg-twinkle-sky/45 p-2 text-[#675778] hover:bg-twinkle-sky"><ChevronRight className="h-4 w-4" /></button></div>
      <div className="grid grid-cols-7 gap-1 text-center">{weekdays.map((day) => <span key={day} className="py-1 text-[11px] font-bold text-twinkle-muted">{day}</span>)}</div>
      <AnimatePresence mode="wait" custom={direction}><motion.div key={month} custom={direction} initial={{ opacity: 0, x: direction * 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: direction * -16 }} transition={{ duration: 0.2 }} className="grid grid-cols-7 gap-1 text-center">{days.map((day, index) => {
        if (day < 1) return <span key={`empty-${index}`} aria-hidden="true" />;
        const date = `${month}-${String(day).padStart(2, '0')}`;
        const selected = date === selectedDate;
        const isToday = date === today;
        return <motion.button key={date} type="button" whileTap={{ scale: 0.9 }} disabled={date < today} onClick={() => onSelect(date)} aria-label={formatDateVietnam(date)} aria-pressed={selected} className={`wizard-calendar-day relative flex h-9 items-center justify-center rounded-xl text-sm font-bold transition sm:h-10 lg:h-11 ${selected ? 'bg-[#a77fb8] text-white shadow-glow' : date < today ? 'cursor-not-allowed text-[#c9c2ce]' : 'bg-[#f5f0fa] text-twinkle-ink hover:-translate-y-0.5 hover:bg-twinkle-pink/60'} ${isToday && !selected ? 'ring-2 ring-[#b992c6]' : ''}`}>{day}{selected && <Check className="absolute right-1 top-1 h-3 w-3" />}{isToday && !selected && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-[#a77fb8]" />}</motion.button>;
      })}</motion.div></AnimatePresence>
    </div>
    <div className="flex items-center justify-center gap-2 rounded-full bg-twinkle-yellow/40 px-3 py-2 text-center text-xs font-semibold text-[#806f83]"><Sparkles className="h-3.5 w-3.5 shrink-0" />{selectedDate ? `Đã chọn: ${formatDateVietnam(selectedDate)}` : 'Chạm vào một ngày trên lịch để chọn'}</div>
  </div>;
}
