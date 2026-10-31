import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Princess Studio · Twinkle Twinkle',
  description: 'Quản lý những buổi hẹn xinh xắn'
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="admin-sky star-field relative min-h-screen overflow-hidden">{children}</div>;
}
