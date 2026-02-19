export interface Service {
  id: string;
  name: string;
  name_en?: string;
  name_ru?: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
  description_en?: string;
  description_ru?: string;
  imageUrl?: string;
}

export interface TimeSlot {
  id: string;
  serviceId?: string;
  stylistId?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  serviceId: string;
  userId: string;
  timeSlotId: string;
  stylist_id?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  services?: { name: string; name_en?: string; name_ru?: string; price: number; duration: number };
  time_slots?: { start_time: string; end_time: string };
  stylists?: { name: string };
  service_id?: string;
  time_slot_id?: string;
  start_time?: string;
  end_time?: string;
}

export interface Stylist {
  id: string;
  name: string;
  role?: string;
  role_en?: string;
  role_ru?: string;
  specialties?: string[];
  specialties_en?: string[];
  specialties_ru?: string[];
  image_url?: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'client';
}