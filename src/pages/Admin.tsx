import React, { useState, useEffect } from 'react';
import { Service, Booking } from '../types';
import { supabase } from '../lib/supabase';
import { AdminServices } from '../components/admin/AdminServices';
import { AdminStylists } from '../components/admin/AdminStylists';
import { AdminTimeSlots } from '../components/admin/AdminTimeSlots';
import { AdminGallery } from '../components/admin/AdminGallery';
import { StylistAssignments } from '../components/admin/StylistAssignments';

export const Admin: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'stylists' | 'timeslots' | 'gallery' | 'assignments'>('services');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          services (name),
          time_slots (start_time, end_time)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        setBookings(data);
      }
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Panel Administracyjny</h1>
        
        <div className="mt-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'services' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Usługi
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'bookings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Rezerwacje
            </button>
            <button
              onClick={() => setActiveTab('stylists')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stylists' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Styliści
            </button>
            <button
              onClick={() => setActiveTab('timeslots')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'timeslots' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Terminy
            </button>
            <button
              onClick={() => setActiveTab('gallery')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'gallery' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Galeria
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignments' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Przypisania
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'services' && <AdminServices />}
      {activeTab === 'stylists' && <AdminStylists />}
      {activeTab === 'timeslots' && <AdminTimeSlots />}
      {activeTab === 'gallery' && <AdminGallery />}
      {activeTab === 'assignments' && <StylistAssignments />}

      {activeTab === 'bookings' && loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : activeTab === 'bookings' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <li key={booking.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {booking.services?.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(booking.time_slots?.start_time).toLocaleString()}
                    </p>
                  </div>
                  <div>
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
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};