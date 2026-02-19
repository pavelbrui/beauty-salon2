export type Language = 'pl' | 'en' | 'ru';

// --- Service translations ---

interface TranslatableService {
  name: string;
  name_en?: string;
  name_ru?: string;
  description?: string;
  description_en?: string;
  description_ru?: string;
}

export function getServiceName(
  service: TranslatableService,
  language: Language
): string {
  if (language === 'en' && service.name_en) return service.name_en;
  if (language === 'ru' && service.name_ru) return service.name_ru;
  return service.name;
}

export function getServiceDescription(
  service: TranslatableService,
  language: Language
): string | undefined {
  if (language === 'en' && service.description_en) return service.description_en;
  if (language === 'ru' && service.description_ru) return service.description_ru;
  return service.description;
}

// --- Stylist translations ---

interface TranslatableStylist {
  role?: string;
  role_en?: string;
  role_ru?: string;
  specialties?: string[];
  specialties_en?: string[];
  specialties_ru?: string[];
  description?: string;
  description_en?: string;
  description_ru?: string;
}

export function getStylistRole(
  stylist: TranslatableStylist,
  language: Language
): string | undefined {
  if (language === 'en' && stylist.role_en) return stylist.role_en;
  if (language === 'ru' && stylist.role_ru) return stylist.role_ru;
  return stylist.role;
}

export function getStylistSpecialties(
  stylist: TranslatableStylist,
  language: Language
): string[] {
  if (language === 'en' && stylist.specialties_en?.length) return stylist.specialties_en;
  if (language === 'ru' && stylist.specialties_ru?.length) return stylist.specialties_ru;
  return stylist.specialties || [];
}

export function getStylistDescription(
  stylist: TranslatableStylist,
  language: Language
): string | undefined {
  if (language === 'en' && stylist.description_en) return stylist.description_en;
  if (language === 'ru' && stylist.description_ru) return stylist.description_ru;
  return stylist.description;
}

// --- Category translations ---

export function getCategoryName(
  category: string,
  language: Language,
  categoriesMap?: Record<string, string>
): string {
  if (language === 'pl' || !categoriesMap) return category;
  return categoriesMap[category] || category;
}
