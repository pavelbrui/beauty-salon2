import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BooksyBooking, BooksyStylistMapping, Stylist } from '../../types';
import { useLanguage } from '../../hooks/useLanguage';
import { translations } from '../../i18n/translations';
import { format } from 'date-fns';
import { pl, enUS, ru } from 'date-fns/locale';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const dateLocales = { pl, en: enUS, ru };

export const AdminBooksy: React.FC = () => {
  const { language } = useLanguage();
  const t = translations[language];
  const ab = (t as any).admin_booksy || {};
  const locale = dateLocales[language as keyof typeof dateLocales] || pl;

  const [mappings, setMappings] = useState<BooksyStylistMapping[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [bookings, setBookings] = useState<BooksyBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSync, setFilterSync] = useState<string>('all');

  // Mapping edit state
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editingStylistId, setEditingStylistId] = useState<string>('');
  const [savingMapping, setSavingMapping] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsRes, stylistsRes, bookingsRes] = await Promise.all([
        supabase
          .from('booksy_stylist_mapping')
          .select('*, stylists(name, image_url)')
          .order('booksy_name'),
        supabase.from('stylists').select('*').order('name'),
        supabase
          .from('booksy_bookings')
          .select('*, stylists(name)')
          .order('start_time', { ascending: false })
          .limit(200),
      ]);

      if (mappingsRes.error) console.error('Error loading mappings:', mappingsRes.error);
      if (stylistsRes.error) console.error('Error loading stylists:', stylistsRes.error);
      if (bookingsRes.error) console.error('Error loading booksy bookings:', bookingsRes.error);

      if (mappingsRes.data) setMappings(mappingsRes.data);
      if (stylistsRes.data) setStylists(stylistsRes.data);
      if (bookingsRes.data) setBookings(bookingsRes.data);
    } finally {
      setLoading(false);
    }
  };

  const startEditMapping = (mapping: BooksyStylistMapping) => {
    setEditingMappingId(mapping.id);
    setEditingStylistId(mapping.stylist_id || '');
  };

  const cancelEditMapping = () => {
    setEditingMappingId(null);
    setEditingStylistId('');
  };

  const saveMapping = async (mapping: BooksyStylistMapping) => {
    setSavingMapping(true);
    try {
      const newStylistId = editingStylistId || null;

      const { error } = await supabase
        .from('booksy_stylist_mapping')
        .update({ stylist_id: newStylistId })
        .eq('id', mapping.id);

      if (error) {
        console.error('Error saving mapping:', error);
        return;
      }

      // Cascade: update all booksy_bookings with this worker name
      await supabase
        .from('booksy_bookings')
        .update({
          stylist_id: newStylistId,
          sync_status: newStylistId ? 'mapped' : 'unmapped',
        })
        .eq('booksy_worker_name', mapping.booksy_name);

      // Cascade: update linked time_slots stylist_id
      if (newStylistId) {
        const { data: relatedBookings } = await supabase
          .from('booksy_bookings')
          .select('time_slot_id')
          .eq('booksy_worker_name', mapping.booksy_name)
          .not('time_slot_id', 'is', null);

        if (relatedBookings) {
          const slotIds = relatedBookings
            .map((b) => b.time_slot_id)
            .filter(Boolean) as string[];
          if (slotIds.length > 0) {
            await supabase
              .from('time_slots')
              .update({ stylist_id: newStylistId })
              .in('id', slotIds);
          }
        }
      }

      setEditingMappingId(null);
      setEditingStylistId('');
      loadData();
    } finally {
      setSavingMapping(false);
    }
  };

  // Filtered bookings
  const filteredBookings = bookings.filter((b) => {
    if (filterStatus !== 'all' && b.status !== filterStatus) return false;
    if (filterSync !== 'all' && b.sync_status !== filterSync) return false;
    return true;
  });

  const unmappedCount = mappings.filter((m) => !m.stylist_id).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3" />
            {ab.statusActive || 'Active'}
          </span>
        );
      case 'changed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <ArrowPathIcon className="h-3 w-3" />
            {ab.statusChanged || 'Changed'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            {ab.statusCancelled || 'Cancelled'}
          </span>
        );
      default:
        return null;
    }
  };

  const getSyncBadge = (sync: string) => {
    switch (sync) {
      case 'mapped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <LinkIcon className="h-3 w-3" />
            {ab.syncMapped || 'Synced'}
          </span>
        );
      case 'unmapped':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ExclamationTriangleIcon className="h-3 w-3" />
            {ab.syncUnmapped || 'Unmapped'}
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3" />
            {ab.syncError || 'Error'}
          </span>
        );
      default:
        return null;
    }
  };

  const getEmailTypeBadge = (emailType: string) => {
    switch (emailType) {
      case 'new':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
            {ab.emailNew || 'New'}
          </span>
        );
      case 'changed':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
            {ab.emailChanged || 'Change'}
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
            {ab.emailCancelled || 'Cancel'}
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <ArrowPathIcon className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{ab.title || 'Booksy'}</h2>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4" />
          {ab.refreshData || 'Refresh'}
        </button>
      </div>

      {/* Stylist Mapping Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-amber-500" />
            {ab.mappingsTitle || 'Stylist Mapping'}
            {unmappedCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                <ExclamationTriangleIcon className="h-3 w-3" />
                {unmappedCount} {ab.unmappedWarning || 'unmapped'}
              </span>
            )}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {ab.mappingsDesc || 'Link Booksy worker names to your stylists'}
          </p>
        </div>

        {mappings.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            {language === 'pl'
              ? 'Brak mapowań — pojawią się automatycznie po pierwszym emailu z Booksy'
              : language === 'ru'
                ? 'Нет сопоставлений — появятся автоматически после первого письма из Booksy'
                : 'No mappings yet — they will appear automatically after the first Booksy email'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.booksyName || 'Booksy Name'}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.linkedStylist || 'Linked Stylist'}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {/* Actions */}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {mappings.map((mapping) => (
                  <tr key={mapping.id} className={!mapping.stylist_id ? 'bg-yellow-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-medium text-gray-900">{mapping.booksy_name}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {editingMappingId === mapping.id ? (
                        <select
                          value={editingStylistId}
                          onChange={(e) => setEditingStylistId(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
                        >
                          <option value="">{ab.selectStylist || 'Select stylist'}</option>
                          {stylists.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : mapping.stylists ? (
                        <span className="text-gray-700">{mapping.stylists.name}</span>
                      ) : (
                        <span className="text-yellow-600 italic">
                          {ab.notMapped || 'Not mapped'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      {editingMappingId === mapping.id ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => saveMapping(mapping)}
                            disabled={savingMapping}
                            className="px-3 py-1 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600 disabled:opacity-50"
                          >
                            {ab.save || 'Save'}
                          </button>
                          <button
                            onClick={cancelEditMapping}
                            className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEditMapping(mapping)}
                          className="px-3 py-1 text-sm font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-md"
                        >
                          {mapping.stylist_id
                            ? (language === 'pl' ? 'Zmień' : language === 'ru' ? 'Изменить' : 'Change')
                            : (language === 'pl' ? 'Przypisz' : language === 'ru' ? 'Привязать' : 'Link')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booksy Bookings Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {ab.bookingsTitle || 'Booksy Bookings'}
          </h3>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
            >
              <option value="all">{ab.allStatuses || 'All statuses'}</option>
              <option value="active">{ab.statusActive || 'Active'}</option>
              <option value="changed">{ab.statusChanged || 'Changed'}</option>
              <option value="cancelled">{ab.statusCancelled || 'Cancelled'}</option>
            </select>

            <select
              value={filterSync}
              onChange={(e) => setFilterSync(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 text-sm"
            >
              <option value="all">{ab.allSync || 'All'}</option>
              <option value="mapped">{ab.syncMapped || 'Synced'}</option>
              <option value="unmapped">{ab.syncUnmapped || 'Unmapped'}</option>
              <option value="error">{ab.syncError || 'Error'}</option>
            </select>
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <p className="text-center text-gray-400 py-8">
            {ab.noBookings || 'No Booksy bookings'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.emailType || 'Type'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.client || 'Client'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.service || 'Service'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.dateTime || 'Date & Time'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.stylist || 'Stylist'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.status || 'Status'}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {ab.syncStatus || 'Sync'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className={
                      booking.sync_status === 'error'
                        ? 'bg-red-50'
                        : booking.status === 'cancelled'
                          ? 'bg-gray-50'
                          : booking.sync_status === 'unmapped'
                            ? 'bg-yellow-50'
                            : ''
                    }
                  >
                    <td className="px-3 py-3 whitespace-nowrap">
                      {getEmailTypeBadge(booking.email_type)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {booking.booksy_client_name}
                      </div>
                      <div className="flex gap-3 mt-0.5">
                        {booking.booksy_client_phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <PhoneIcon className="h-3 w-3" />
                            {booking.booksy_client_phone}
                          </span>
                        )}
                        {booking.booksy_client_email && (
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                            <EnvelopeIcon className="h-3 w-3" />
                            {booking.booksy_client_email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900">{booking.booksy_service_name}</div>
                      {booking.booksy_price_text && (
                        <div className="text-xs text-gray-500">{booking.booksy_price_text}</div>
                      )}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(booking.start_time), 'dd MMM yyyy', { locale })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(booking.start_time), 'HH:mm')} –{' '}
                        {format(new Date(booking.end_time), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm">
                      {booking.stylists?.name || booking.booksy_worker_name || '—'}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">{getStatusBadge(booking.status)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{getSyncBadge(booking.sync_status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
