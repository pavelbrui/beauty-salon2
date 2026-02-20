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

// Training content blocks
export interface HeadingBlock {
  id: string;
  type: 'heading';
  text: string;
  text_en?: string;
  text_ru?: string;
  level: 2 | 3;
}

export interface TextBlock {
  id: string;
  type: 'text';
  text: string;
  text_en?: string;
  text_ru?: string;
}

export interface ImageBlock {
  id: string;
  type: 'image';
  url: string;
  caption?: string;
  caption_en?: string;
  caption_ru?: string;
}

export interface ListBlock {
  id: string;
  type: 'list';
  items: string[];
  items_en?: string[];
  items_ru?: string[];
  style: 'bullet' | 'check';
}

export type ContentBlock = HeadingBlock | TextBlock | ImageBlock | ListBlock;

export interface Training {
  id: string;
  title: string;
  title_en?: string;
  title_ru?: string;
  slug: string;
  category: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
  cover_image_url?: string;
  price?: string;
  price_en?: string;
  price_ru?: string;
  duration?: string;
  duration_en?: string;
  duration_ru?: string;
  content_blocks: ContentBlock[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}