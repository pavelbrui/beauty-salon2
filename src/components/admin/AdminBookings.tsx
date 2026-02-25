import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { syncBookingToBooksy } from '../../lib/booksySync';
import { Booking, Service, Stylist } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { useViewMode } from '../../hooks/useViewMode';
import { translations } from '../../i18n/translations';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  FunnelIcon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { StylistFilter } from '../StylistFilter';

interface AdminBooking extends Booking {
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
}

interface StylistAssignment {
  service_id: string;
  stylist_id: string;
}

type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

interface BookingFormData {
  serviceId: string;
  stylistId: string;
  status: BookingStatus;
  startAt: string;
  pricePln: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
}

const dateLocales = { pl, en: enUS, ru };
const emptyBookingForm: BookingFormData = {
  serviceId: '',
  stylistId: '',
  status: 'pending',
  startAt: '',
  pricePln: '',
  contactName: '',
  contactPhone: '',
  contactEmail: '',
  notes: ''
};

const toDateTimeLocalValue = (dateInput?: string) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const toIsoFromLocal = (localValue: string) => {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const formatPricePlnFromCents = (priceCents?: number | null) => {
  if (priceCents == null) return '';
  return (priceCents / 100).toFixed(0);
};

const parsePricePlnToCents = (pricePln: string) => {
  const normalized = pricePln.replace(',', '.').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
};

const getNextHourStart = () => {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return toDateTimeLocalValue(date.toISOString());
};

const getErrorMessage = (err: unknown, fallback: string) => {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err.trim()) return err;
  // PostgrestError / Supabase error object
  const obj = err as { message?: string; details?: string; hint?: string };
  if (obj?.message) return obj.message;
  if (obj?.details) return obj.details;
  if (obj?.hint) return obj.hint;
  return fallback;
};

export const AdminBookings: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const ab = (t as any).admin_bookings || {};
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [assignments, setAssignments] = useState<StylistAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStylist, setFilterStylist] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // View mode (persisted to localStorage + cookie)
  const [viewMode, setViewMode] = useViewMode();

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

  // Edit modal
  const [editingBooking, setEditingBooking] = useState<AdminBooking | null>(null);
  const [editForm, setEditForm] = useState<BookingFormData | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<BookingFormData>(emptyBookingForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, servicesRes, stylistsRes, assignmentsRes] = await Promise.all([
        supabase
          .from('bookings')
          .select(`
            *,
            services (name, name_en, name_ru, price, duration),
            time_slots (start_time, end_time),
            stylists (name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('services').select('*').order('name'),
        supabase.from('stylists').select('*').order('name'),
        supabase.from('stylist_service_assignments').select('service_id, stylist_id')
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (stylistsRes.error) throw stylistsRes.error;
      if (assignmentsRes.error) throw assignmentsRes.error;

      setBookings(bookingsRes.data || []);
      setServices(servicesRes.data || []);
      setStylists(stylistsRes.data || []);
      setAssignments(assignmentsRes.data || []);
    } catch (err) {
      console.error('Error loading admin bookings data:', err);
    } finally {
      setLoading(false);
    }
  };

  const serviceMap = useMemo(() => {
    return new Map(services.map(service => [service.id, service]));
  }, [services]);

  const stylistIdsByService = useMemo(() => {
    const map = new Map<string, Set<string>>();
    assignments.forEach(assignment => {
      const existing = map.get(assignment.service_id) || new Set<string>();
      existing.add(assignment.stylist_id);
      map.set(assignment.service_id, existing);
    });
    return map;
  }, [assignments]);

  const getStylistsForService = (serviceId: string) => {
    const stylistIds = stylistIdsByService.get(serviceId);
    if (!stylistIds || stylistIds.size === 0) return stylists;
    return stylists.filter(stylist => stylistIds.has(stylist.id));
  };

  const getBookingDisplayPrice = (booking: AdminBooking) => {
    if (booking.price_override != null) return booking.price_override;
    if (booking.services?.price != null) return booking.services.price;
    return null;
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (filterStylist !== 'all' && b.stylist_id !== filterStylist) return false;
      if (filterService !== 'all' && b.service_id !== filterService) return false;
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      return true;
    });
  }, [bookings, filterStylist, filterService, filterStatus]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarMonth]);

  const bookingsByDate = useMemo(() => {
    const map: Record<string, AdminBooking[]> = {};
    filteredBookings.forEach(b => {
      const startTime = b.time_slots?.start_time || b.start_time;
      if (!startTime) return;
      const dateKey = format(new Date(startTime), 'yyyy-MM-dd');
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(b);
    });
    // Sort bookings within each day by time
    Object.values(map).forEach(arr =>
      arr.sort((a, b) => {
        const ta = a.time_slots?.start_time || a.start_time || '';
        const tb = b.time_slots?.start_time || b.start_time || '';
        return ta.localeCompare(tb);
      })
    );
    return map;
  }, [filteredBookings]);

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return {
        date: format(date, 'd MMMM yyyy', { locale }),
        time: format(date, 'HH:mm'),
        dayOfWeek: format(date, 'EEEE', { locale }),
        short: format(date, 'dd.MM.yyyy HH:mm')
      };
    } catch {
      return null;
    }
  };

  const getServiceLabel = (booking: AdminBooking) => {
    if (booking.services?.name) return booking.services.name;
    const notes = booking.notes || '';
    if (notes.startsWith('[Booksy]')) {
      return notes.replace(/^\[Booksy\]\s*/, '').trim() || 'Booksy';
    }
    return '—';
  };

  const isBooksyMirror = (booking: AdminBooking) => (booking.notes || '').startsWith('[Booksy]');

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-100', text: 'text-green-700', label: ab.statusConfirmed || 'Potwierdzona' };
      case 'cancelled':
        return { bg: 'bg-red-100', text: 'text-red-700', label: ab.statusCancelled || 'Anulowana' };
      default:
        return { bg: 'bg-brand-100', text: 'text-brand-600', label: ab.statusPending || 'Oczekuje' };
    }
  };

  const getFormSchedule = (formData: BookingFormData | null) => {
    if (!formData || !formData.startAt || !formData.serviceId) return null;
    const service = serviceMap.get(formData.serviceId);
    if (!service) return null;

    const startIso = toIsoFromLocal(formData.startAt);
    if (!startIso) return null;

    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    return {
      startIso,
      endIso: endDate.toISOString(),
      duration: service.duration
    };
  };

  const buildFormFromBooking = (booking: AdminBooking): BookingFormData => {
    const serviceId = booking.service_id || booking.serviceId || services[0]?.id || '';
    const startAt = toDateTimeLocalValue(booking.start_time || booking.time_slots?.start_time);
    const displayPrice = getBookingDisplayPrice(booking);

    return {
      serviceId,
      stylistId: booking.stylist_id || '',
      status: booking.status,
      startAt,
      pricePln: formatPricePlnFromCents(displayPrice),
      contactName: booking.contact_name || '',
      contactPhone: booking.contact_phone || '',
      contactEmail: booking.contact_email || '',
      notes: booking.notes || ''
    };
  };

  const parseFormData = (formData: BookingFormData) => {
    if (!formData.serviceId) {
      throw new Error(ab.missingService || 'Wybierz zabieg.');
    }

    const service = serviceMap.get(formData.serviceId);
    if (!service) {
      throw new Error(ab.invalidService || 'Wybrany zabieg nie istnieje.');
    }

    if (!formData.startAt) {
      throw new Error(ab.missingDateTime || 'Wybierz termin.');
    }

    const startIso = toIsoFromLocal(formData.startAt);
    if (!startIso) {
      throw new Error(ab.invalidDateTime || 'Nieprawidłowa data lub godzina.');
    }

    const startDate = new Date(startIso);
    const endDate = new Date(startDate.getTime() + service.duration * 60000);
    const endIso = endDate.toISOString();

    const priceCents = parsePricePlnToCents(formData.pricePln);
    if (priceCents == null) {
      throw new Error(ab.invalidPrice || 'Podaj poprawną cenę.');
    }

    const contactName = formData.contactName.trim();
    const contactPhone = formData.contactPhone.trim();
    const contactEmail = formData.contactEmail.trim();
    if (!contactName && !contactPhone && !contactEmail) {
      throw new Error(ab.missingContact || 'Podaj przynajmniej jedno dane kontaktowe.');
    }

    return {
      service,
      startIso,
      endIso,
      contactName,
      contactPhone,
      contactEmail,
      notes: formData.notes.trim(),
      priceOverride: priceCents === service.price ? null : priceCents
    };
  };

  const hasTimeSlotConflict = async (
    stylistId: string,
    startIso: string,
    endIso: string,
    excludeSlotId?: string | null
  ) => {
    if (!stylistId) return false;

    let query = supabase
      .from('time_slots')
      .select('id')
      .eq('stylist_id', stylistId)
      .eq('is_available', false)
      .lt('start_time', endIso)
      .gt('end_time', startIso)
      .limit(1);

    if (excludeSlotId) {
      query = query.neq('id', excludeSlotId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).length > 0;
  };

  const openEdit = (booking: AdminBooking) => {
    setEditingBooking(booking);
    setEditForm(buildFormFromBooking(booking));
    setEditError(null);
  };

  const openCreate = () => {
    const firstService = services[0];
    if (!firstService) return;

    const availableStylists = getStylistsForService(firstService.id);

    setCreateForm({
      serviceId: firstService.id,
      stylistId: availableStylists[0]?.id || '',
      status: 'pending',
      startAt: getNextHourStart(),
      pricePln: formatPricePlnFromCents(firstService.price),
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: ''
    });
    setCreateError(null);
    setShowCreateModal(true);
  };

  const handleEditServiceChange = (serviceId: string) => {
    if (!editForm) return;
    const service = serviceMap.get(serviceId);
    const availableStylists = getStylistsForService(serviceId);
    const stylistStillAvailable = availableStylists.some(stylist => stylist.id === editForm.stylistId);

    setEditForm({
      ...editForm,
      serviceId,
      stylistId: stylistStillAvailable ? editForm.stylistId : '',
      pricePln: service ? formatPricePlnFromCents(service.price) : editForm.pricePln
    });
  };

  const handleCreateServiceChange = (serviceId: string) => {
    const service = serviceMap.get(serviceId);
    const availableStylists = getStylistsForService(serviceId);
    const stylistStillAvailable = availableStylists.some(stylist => stylist.id === createForm.stylistId);

    setCreateForm({
      ...createForm,
      serviceId,
      stylistId: stylistStillAvailable ? createForm.stylistId : '',
      pricePln: service ? formatPricePlnFromCents(service.price) : createForm.pricePln
    });
  };

  const saveEdit = async () => {
    if (!editingBooking || !editForm) return;
    setSaving(true);
    setEditError(null);
    let createdSlotId: string | null = null;

    try {
      const parsed = parseFormData(editForm);
      const currentSlotId = editingBooking.time_slot_id || editingBooking.timeSlotId || null;

      if (editForm.status !== 'cancelled' && editForm.stylistId) {
        const conflict = await hasTimeSlotConflict(editForm.stylistId, parsed.startIso, parsed.endIso, currentSlotId);
        if (conflict) {
          throw new Error(ab.slotConflict || 'Wybrana stylistka ma już rezerwację w tym czasie.');
        }
      }

      let slotId = currentSlotId;
      if (slotId) {
        const { error: updateSlotError } = await supabase
          .from('time_slots')
          .update({
            stylist_id: editForm.stylistId || null,
            start_time: parsed.startIso,
            end_time: parsed.endIso,
            is_available: editForm.status === 'cancelled'
          })
          .eq('id', slotId);

        if (updateSlotError) throw updateSlotError;
      } else {
        const { data: newSlot, error: createSlotError } = await supabase
          .from('time_slots')
          .insert({
            stylist_id: editForm.stylistId || null,
            start_time: parsed.startIso,
            end_time: parsed.endIso,
            is_available: editForm.status === 'cancelled'
          })
          .select('id')
          .single();

        if (createSlotError || !newSlot?.id) throw createSlotError || new Error('Failed to create time slot');
        slotId = newSlot.id;
        createdSlotId = newSlot.id;
      }

      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          service_id: parsed.service.id,
          stylist_id: editForm.stylistId || null,
          status: editForm.status,
          start_time: parsed.startIso,
          end_time: parsed.endIso,
          time_slot_id: slotId,
          price_override: parsed.priceOverride,
          contact_name: parsed.contactName,
          contact_phone: parsed.contactPhone,
          contact_email: parsed.contactEmail,
          notes: parsed.notes
        })
        .eq('id', editingBooking.id);

      if (bookingError) throw bookingError;

      if (slotId) {
        const { error: linkSlotError } = await supabase
          .from('time_slots')
          .update({ booking_id: editingBooking.id })
          .eq('id', slotId);

        if (linkSlotError) {
          console.error('Error linking time slot to booking:', linkSlotError);
        }
      }

      if (editForm.status !== editingBooking.status) {
        await supabase
          .from('booking_notifications')
          .insert({
            booking_id: editingBooking.id,
            type: 'status_update',
            status: 'pending'
          });
      }

      // Sync to Booksy: update or remove block depending on status change
      if (editForm.status === 'cancelled' && editingBooking.status !== 'cancelled') {
        syncBookingToBooksy({
          action: 'remove_block',
          bookingId: editingBooking.id,
          startTime: parsed.startIso,
          endTime: parsed.endIso,
          stylistId: editForm.stylistId,
        });
      } else if (editForm.status !== 'cancelled') {
        const oldStart = editingBooking.start_time || editingBooking.time_slots?.start_time;
        const oldEnd = editingBooking.end_time || editingBooking.time_slots?.end_time;
        syncBookingToBooksy({
          action: 'update_block',
          bookingId: editingBooking.id,
          startTime: parsed.startIso,
          endTime: parsed.endIso,
          stylistId: editForm.stylistId,
          oldStartTime: oldStart,
          oldEndTime: oldEnd,
        });
      }

      setEditingBooking(null);
      setEditForm(null);
      await loadData();
    } catch (err) {
      if (createdSlotId) {
        await supabase
          .from('time_slots')
          .delete()
          .eq('id', createdSlotId);
      }
      console.error('Error updating booking:', err);
      setEditError(getErrorMessage(err, ab.updateError || 'Nie udało się zapisać zmian.'));
    } finally {
      setSaving(false);
    }
  };

  const createBooking = async () => {
    setCreating(true);
    setCreateError(null);
    let createdSlotId: string | null = null;

    try {
      const parsed = parseFormData(createForm);

      if (createForm.status !== 'cancelled' && createForm.stylistId) {
        const conflict = await hasTimeSlotConflict(createForm.stylistId, parsed.startIso, parsed.endIso);
        if (conflict) {
          throw new Error(ab.slotConflict || 'Wybrana stylistka ma już rezerwację w tym czasie.');
        }
      }

      const { data: newSlot, error: createSlotError } = await supabase
        .from('time_slots')
        .insert({
          stylist_id: createForm.stylistId || null,
          start_time: parsed.startIso,
          end_time: parsed.endIso,
          is_available: createForm.status === 'cancelled'
        })
        .select('id')
        .single();

      if (createSlotError || !newSlot?.id) throw createSlotError || new Error('Failed to create time slot');
      createdSlotId = newSlot.id;

      const { data: newBooking, error: createBookingError } = await supabase
        .from('bookings')
        .insert({
          service_id: parsed.service.id,
          user_id: null,
          time_slot_id: newSlot.id,
          stylist_id: createForm.stylistId || null,
          status: createForm.status,
          contact_name: parsed.contactName,
          contact_phone: parsed.contactPhone,
          contact_email: parsed.contactEmail,
          notes: parsed.notes,
          start_time: parsed.startIso,
          end_time: parsed.endIso,
          price_override: parsed.priceOverride
        })
        .select('id')
        .single();

      if (createBookingError || !newBooking?.id) throw createBookingError || new Error('Failed to create booking');

      const { error: linkSlotError } = await supabase
        .from('time_slots')
        .update({ booking_id: newBooking.id })
        .eq('id', newSlot.id);

      if (linkSlotError) {
        console.error('Error linking created time slot to booking:', linkSlotError);
      }

      syncBookingToBooksy({
        action: 'create_block',
        bookingId: newBooking.id,
        startTime: parsed.startIso,
        endTime: parsed.endIso,
        stylistId: createForm.stylistId,
      });

      setShowCreateModal(false);
      setCreateForm(emptyBookingForm);
      await loadData();
    } catch (err) {
      if (createdSlotId) {
        await supabase
          .from('time_slots')
          .delete()
          .eq('id', createdSlotId);
      }
      console.error('Error creating booking:', err);
      setCreateError(getErrorMessage(err, ab.createError || 'Nie udało się utworzyć rezerwacji.'));
    } finally {
      setCreating(false);
    }
  };

  const hasActiveFilters = filterStylist !== 'all' || filterService !== 'all' || filterStatus !== 'all';

  const clearFilters = () => {
    setFilterStylist('all');
    setFilterService('all');
    setFilterStatus('all');
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return format(day, 'EEEEEE', { locale });
    });
  }, [locale]);

  const editAvailableStylists = editForm?.serviceId ? getStylistsForService(editForm.serviceId) : stylists;
  const createAvailableStylists = createForm.serviceId ? getStylistsForService(createForm.serviceId) : stylists;
  const editSchedule = getFormSchedule(editForm);
  const createSchedule = getFormSchedule(createForm);
  const editStartInfo = editSchedule ? formatDateTime(editSchedule.startIso) : null;
  const editEndInfo = editSchedule ? formatDateTime(editSchedule.endIso) : null;
  const createStartInfo = createSchedule ? formatDateTime(createSchedule.startIso) : null;
  const createEndInfo = createSchedule ? formatDateTime(createSchedule.endIso) : null;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: Filters + View Toggle */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* View toggle + count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {ab.title || 'Rezerwacje'}
            </h2>
            <span className="text-sm text-gray-500">
              ({filteredBookings.length}{bookings.length !== filteredBookings.length ? ` / ${bookings.length}` : ''})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={openCreate}
              disabled={services.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              {ab.newBooking || 'Nowa rezerwacja'}
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={ab.listView || 'Lista'}
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={ab.calendarView || 'Kalendarz'}
            >
              <CalendarDaysIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stylist filter with photos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FunnelIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm font-medium text-gray-600">{ab.stylist || 'Stylistka'}</span>
          </div>
          <StylistFilter
            stylists={stylists}
            selectedId={filterStylist === 'all' ? '' : filterStylist}
            onSelect={(id) => setFilterStylist(id || 'all')}
            allLabel={ab.allStylists || 'Wszystkie'}
          />
        </div>

        {/* Service + Status filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Service filter */}
          <select
            value={filterService}
            onChange={e => setFilterService(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="all">{ab.allServices || 'Wszystkie zabiegi'}</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="all">{ab.allStatuses || 'Wszystkie statusy'}</option>
            <option value="pending">{ab.statusPending || 'Oczekuje'}</option>
            <option value="confirmed">{ab.statusConfirmed || 'Potwierdzona'}</option>
            <option value="cancelled">{ab.statusCancelled || 'Anulowana'}</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-brand-600 hover:text-brand-600 flex items-center gap-1"
            >
              <XMarkIcon className="h-4 w-4" />
              {ab.clearFilters || 'Wyczyść filtry'}
            </button>
          )}
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <CalendarDaysIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">{ab.noBookings || 'Brak rezerwacji'}</p>
            </div>
          ) : (
            filteredBookings.map(booking => {
              const startTime = booking.time_slots?.start_time || booking.start_time;
              const endTime = booking.time_slots?.end_time || booking.end_time;
              const dateInfo = formatDateTime(startTime);
              const endInfo = formatDateTime(endTime);
              const statusConfig = getStatusConfig(booking.status);
              const price = getBookingDisplayPrice(booking);
              const hasCustomPrice = booking.price_override != null;
              const duration = booking.services?.duration;

              return (
                <div
                  key={booking.id}
                  className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                    booking.status === 'cancelled'
                      ? 'border-l-red-400 opacity-70'
                      : booking.status === 'confirmed'
                      ? 'border-l-green-400'
                      : 'border-l-brand-400'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      {/* Booking info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {getServiceLabel(booking)}
                          </h3>
                          {isBooksyMirror(booking) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                              Booksy
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            {statusConfig.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm text-gray-600">
                          {dateInfo && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDaysIcon className="h-4 w-4 text-brand flex-shrink-0" />
                              <span className="capitalize truncate">{dateInfo.dayOfWeek}, {dateInfo.date}</span>
                            </div>
                          )}

                          {dateInfo && (
                            <div className="flex items-center gap-1.5">
                              <ClockIcon className="h-4 w-4 text-brand flex-shrink-0" />
                              <span>
                                {dateInfo.time}
                                {endInfo ? ` – ${endInfo.time}` : ''}
                                {duration ? ` (${duration} min)` : ''}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5">
                            <UserIcon className="h-4 w-4 text-brand flex-shrink-0" />
                            <span className="truncate">
                              {booking.stylists?.name || (ab.noStylist || 'Brak stylistki')}
                            </span>
                          </div>

                          {price != null && (
                            <div className="flex items-center gap-1.5">
                              <CurrencyDollarIcon className="h-4 w-4 text-brand flex-shrink-0" />
                              <span className="font-medium">
                                {(price / 100).toFixed(0)} PLN
                                {hasCustomPrice ? ` (${ab.customPrice || 'indywidualna'})` : ''}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Client info */}
                        <div className="mt-2 text-xs text-gray-400">
                          {ab.client || 'Klient'}: {booking.contact_name || booking.contact_email || '—'}{booking.contact_phone ? ` | ${booking.contact_phone}` : ''}
                        </div>

                        {!dateInfo && (
                          <p className="text-sm text-gray-400 mt-1">
                            {ab.noDateInfo || 'Brak informacji o terminie'}
                          </p>
                        )}
                      </div>

                      {/* Edit button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => openEdit(booking)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors"
                        >
                          <PencilIcon className="h-4 w-4" />
                          {ab.edit || 'Edytuj'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-lg shadow">
          {/* Calendar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <button
              onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 capitalize">
              {format(calendarMonth, 'LLLL yyyy', { locale })}
            </h3>
            <button
              onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Week day headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {weekDays.map((day, i) => (
              <div key={i} className="py-2 text-center text-xs font-medium text-gray-500 uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayBookings = bookingsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, calendarMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r border-gray-100 p-1 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`text-xs font-medium mb-1 px-1 ${
                    isToday
                      ? 'bg-brand text-white rounded-full w-6 h-6 flex items-center justify-center'
                      : isCurrentMonth ? 'text-gray-700' : 'text-gray-300'
                  }`}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map(b => {
                      const sc = getStatusConfig(b.status);
                      const time = b.time_slots?.start_time || b.start_time;
                      const timeStr = time ? format(new Date(time), 'HH:mm') : '';

                      return (
                        <button
                          key={b.id}
                          onClick={() => openEdit(b)}
                          className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${sc.bg} ${sc.text} hover:opacity-80 transition-opacity`}
                          title={`${timeStr} ${b.services?.name || ''} - ${b.stylists?.name || ''}`}
                        >
                          <span className="font-medium">{timeStr}</span>{' '}
                          {getServiceLabel(b)}
                        </button>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <div className="text-[10px] text-gray-400 px-1">
                        +{dayBookings.length - 3} {ab.more || 'więcej'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingBooking && editForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {ab.editBooking || 'Edytuj rezerwację'}
                </h2>
                <button
                  onClick={() => {
                    setEditingBooking(null);
                    setEditForm(null);
                    setEditError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {isBooksyMirror(editingBooking) && (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
                  <span className="font-medium">Booksy:</span> {getServiceLabel(editingBooking)}
                </div>
              )}

              {editError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.service || 'Zabieg'}
                  </label>
                  <select
                    value={editForm.serviceId}
                    onChange={e => handleEditServiceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">{ab.chooseService || 'Wybierz zabieg'}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.stylist || 'Stylistka'}
                  </label>
                  <select
                    value={editForm.stylistId}
                    onChange={e => setEditForm({ ...editForm, stylistId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">{ab.noStylist || 'Brak stylistki'}</option>
                    {editAvailableStylists.map(stylist => (
                      <option key={stylist.id} value={stylist.id}>
                        {stylist.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.dateTime || 'Termin'}
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.startAt}
                    onChange={e => setEditForm({ ...editForm, startAt: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <div className="font-medium text-gray-900 mb-1">{ab.endTime || 'Koniec wizyty'}</div>
                  {editStartInfo && editEndInfo ? (
                    <div>
                      <div className="capitalize">
                        {editStartInfo.dayOfWeek}, {editStartInfo.date} {editStartInfo.time}
                      </div>
                      <div>
                        {editEndInfo.time}
                        {editSchedule ? ` (${editSchedule.duration} min)` : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">{ab.noDateInfo || 'Brak informacji o terminie'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.price || 'Cena'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.pricePln}
                    onChange={e => setEditForm({ ...editForm, pricePln: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">PLN</span>
                  <button
                    type="button"
                    onClick={() => {
                      const service = serviceMap.get(editForm.serviceId);
                      if (!service) return;
                      setEditForm({ ...editForm, pricePln: formatPricePlnFromCents(service.price) });
                    }}
                    className="text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md whitespace-nowrap"
                  >
                    {ab.useServicePrice || 'Cena z usługi'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.status || 'Status'}
                </label>
                <div className="flex gap-2">
                  {(['pending', 'confirmed', 'cancelled'] as BookingStatus[]).map(status => {
                    const sc = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => setEditForm({ ...editForm, status })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          editForm.status === status
                            ? `${sc.bg} ${sc.text} border-current`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactName || 'Imię i nazwisko'}
                  </label>
                  <input
                    type="text"
                    value={editForm.contactName}
                    onChange={e => setEditForm({ ...editForm, contactName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactPhone || 'Telefon'}
                  </label>
                  <input
                    type="text"
                    value={editForm.contactPhone}
                    onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactEmail || 'E-mail'}
                  </label>
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={e => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.notes || 'Notatki'}
                </label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingBooking(null);
                  setEditForm(null);
                  setEditError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {ab.cancelEdit || 'Anuluj'}
              </button>
              <button
                onClick={saveEdit}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {ab.save || 'Zapisz'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {ab.createBooking || 'Nowa rezerwacja'}
                </h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {createError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.service || 'Zabieg'}
                  </label>
                  <select
                    value={createForm.serviceId}
                    onChange={e => handleCreateServiceChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">{ab.chooseService || 'Wybierz zabieg'}</option>
                    {services.map(service => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.stylist || 'Stylistka'}
                  </label>
                  <select
                    value={createForm.stylistId}
                    onChange={e => setCreateForm({ ...createForm, stylistId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="">{ab.noStylist || 'Brak stylistki'}</option>
                    {createAvailableStylists.map(stylist => (
                      <option key={stylist.id} value={stylist.id}>
                        {stylist.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.dateTime || 'Termin'}
                  </label>
                  <input
                    type="datetime-local"
                    value={createForm.startAt}
                    onChange={e => setCreateForm({ ...createForm, startAt: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  <div className="font-medium text-gray-900 mb-1">{ab.endTime || 'Koniec wizyty'}</div>
                  {createStartInfo && createEndInfo ? (
                    <div>
                      <div className="capitalize">
                        {createStartInfo.dayOfWeek}, {createStartInfo.date} {createStartInfo.time}
                      </div>
                      <div>
                        {createEndInfo.time}
                        {createSchedule ? ` (${createSchedule.duration} min)` : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">{ab.noDateInfo || 'Brak informacji o terminie'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.price || 'Cena'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={createForm.pricePln}
                    onChange={e => setCreateForm({ ...createForm, pricePln: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                    placeholder="0"
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">PLN</span>
                  <button
                    type="button"
                    onClick={() => {
                      const service = serviceMap.get(createForm.serviceId);
                      if (!service) return;
                      setCreateForm({ ...createForm, pricePln: formatPricePlnFromCents(service.price) });
                    }}
                    className="text-xs text-brand-600 bg-brand-50 hover:bg-brand-100 px-2 py-1 rounded-md whitespace-nowrap"
                  >
                    {ab.useServicePrice || 'Cena z usługi'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.status || 'Status'}
                </label>
                <div className="flex gap-2">
                  {(['pending', 'confirmed', 'cancelled'] as BookingStatus[]).map(status => {
                    const sc = getStatusConfig(status);
                    return (
                      <button
                        key={status}
                        onClick={() => setCreateForm({ ...createForm, status })}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          createForm.status === status
                            ? `${sc.bg} ${sc.text} border-current`
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {sc.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactName || 'Imię i nazwisko'}
                  </label>
                  <input
                    type="text"
                    value={createForm.contactName}
                    onChange={e => setCreateForm({ ...createForm, contactName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactPhone || 'Telefon'}
                  </label>
                  <input
                    type="text"
                    value={createForm.contactPhone}
                    onChange={e => setCreateForm({ ...createForm, contactPhone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {ab.contactEmail || 'E-mail'}
                  </label>
                  <input
                    type="email"
                    value={createForm.contactEmail}
                    onChange={e => setCreateForm({ ...createForm, contactEmail: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {ab.notes || 'Notatki'}
                </label>
                <textarea
                  rows={3}
                  value={createForm.notes}
                  onChange={e => setCreateForm({ ...createForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {ab.cancelEdit || 'Anuluj'}
              </button>
              <button
                onClick={createBooking}
                disabled={creating}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <CheckIcon className="h-4 w-4" />
                )}
                {ab.create || 'Utwórz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
