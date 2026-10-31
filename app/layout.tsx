import type { Metadata } from 'next';
import MotionPreferences from '@/components/MotionPreferences';
import './globals.css';

export const metadata: Metadata = {
  title: 'Twinkle Twinkle · Lên lịch hẹn hò',
  description: 'Cute Dating Scheduler với Princess Mode'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body><MotionPreferences>{children}</MotionPreferences></body>
    </html>
  );
}
