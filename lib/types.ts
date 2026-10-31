export type DateEventStatus = 'Pending' | 'Accepted' | 'Reschedule' | 'Rejected' | 'Completed';

export interface CoupleProfile {
  id: string;
  avatar_user: string;
  avatar_partner: string;
  cover_photo: string;
  nickname_user: string;
  nickname_partner: string;
}

export interface Location {
  id: string;
  name: string;
  category: string;
  area: string;
  address: string;
  phone: string;
  mapsLink: string;
  images: string[];
  tiktokLink: string;
  youtubeLink: string;
  cost_estimate: number;
  notes: string;
}

export interface ComboDate {
  id: string;
  title: string;
  description: string;
  icon: string;
  locationIds: string[];
}

export interface Voucher {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface DateEditHistory {
  editedAt: string;
  reason: string;
  previousDate: string;
  previousTime: string;
  previousLocationId?: string;
  previousComboId?: string;
  previousRoadmapLocationIds?: string[];
}

export interface DateMemories {
  photos: string[];
  reviewText: string;
  emoji: string;
}

export interface DateEvent {
  id: string;
  inviterName: string;
  date: string;
  time: string;
  pickupLocation?: string;
  dresscode: string;
  message: string;
  locationId?: string;
  comboId?: string;
  roadmapLocationIds?: string[];
  appliedVouchers: string[];
  status: DateEventStatus;
  editHistory: DateEditHistory[];
  memories: DateMemories;
}
