export interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
  duration: number;
  description?: string;
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
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  services?: { name: string };
  time_slots?: { start_time: string; end_time: string };
}

export interface Stylist {
  id: string;
  name: string;
  role?: string;
  specialties?: string[];
  image_url?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'client';
}