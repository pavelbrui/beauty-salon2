import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { SEO } from '../components/SEO';

export const ProfilePage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return;

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        services (name),
        time_slots (start_time, end_time)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      return;
    }

    setBookings(data);
  };

  const cancelBooking = async (bookingId: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      return;
    }

    loadBookings();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title="Moje Rezerwacje"
        description="Zarządzaj swoimi rezerwacjami w salonie Katarzyna Brui."
        canonical="/profile"
        noindex
      />
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Moje Rezerwacje</h1>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <ul className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <li key={booking.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {booking.services?.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {booking.time_slots?.start_time ? new Date(booking.time_slots!.start_time).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status}
                  </span>
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Anuluj
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};