import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdvancedBookingCalendar } from '../components/Calendar/AdvancedBookingCalendar';
import { ServiceCard } from '../components/ServiceCard';
import { AuthModal } from '../components/AuthModal';
import { BookingForm } from '../components/BookingForm';
import { SuccessPopup } from '../components/SuccessPopup';
import { supabase } from '../lib/supabase';
import { Service, TimeSlot } from '../types';
import { SEO } from '../components/SEO';
import { saveUserData } from '../utils/cookies';

export const BookingPage: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<Service | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  const loadService = async () => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Service not found');

      setService(data);
    } catch (error) {
      console.error('Error loading service:', error);
      setError('Could not load service details. Please try again.');
    }
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setError(null);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSelectedSlot(slot);
      if (!session) {
        setShowAuthModal(true);
      } else {
        setShowBookingForm(true);
      }
    });
  };

  const createTimeSlotRecord = async (slot: TimeSlot, serviceId: string): Promise<string | null> => {
    // Try with new schema first (post-migration 0014: has stylist_id)
    const { data, error } = await supabase
      .from('time_slots')
      .insert({
        stylist_id: slot.stylistId,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: false
      })
      .select('id')
      .single();

    if (!error && data) return data.id;

    // Fallback: old schema (service_id instead of stylist_id)
    const { data: data2, error: error2 } = await supabase
      .from('time_slots')
      .insert({
        service_id: serviceId,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: false
      })
      .select('id')
      .single();

    if (!error2 && data2) return data2.id;

    // RLS or schema prevents insert — booking will work without time_slot
    console.warn('Could not create time_slot record (apply migration 0014):', error2?.message);
    return null;
  };

  const handleBookingSubmit = async (contactData: {
    name: string;
    phone: string;
    email: string;
    notes?: string;
  }) => {
    setError(null);
    try {
      if (!selectedSlot || !service) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Session expired. Please login again.');
        setShowAuthModal(true);
        return;
      }

      // 1. Try to create time_slot record (may fail if migration 0014 not applied)
      const timeSlotId = await createTimeSlotRecord(selectedSlot, service.id);

      // 2. Create booking (core fields that exist in all schema versions)
      const bookingData: Record<string, unknown> = {
        service_id: service.id,
        user_id: session.user.id,
        stylist_id: selectedSlot.stylistId,
        status: 'pending',
        contact_name: contactData.name,
        contact_phone: contactData.phone,
        contact_email: contactData.email,
        notes: contactData.notes || ''
      };

      if (timeSlotId) {
        bookingData.time_slot_id = timeSlotId;
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select();

      if (error) throw error;
      if (!data) throw new Error('Failed to create booking');

      // 3. Link time_slot back to booking (best-effort, for profile/admin display)
      if (timeSlotId && data[0]?.id) {
        await supabase
          .from('time_slots')
          .update({ booking_id: data[0].id })
          .eq('id', timeSlotId);
      }

      // Save contact data to cookies for future use
      saveUserData({
        name: contactData.name,
        phone: contactData.phone,
        email: contactData.email
      });

      setShowBookingForm(false);
      setShowSuccessPopup(true);
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Could not complete booking. Please try again.');
      setShowBookingForm(false);
    }
  };

  if (!service && !error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm font-medium text-red-600 hover:text-red-500"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <SEO
        title={service ? `Rezerwacja - ${service.name}` : 'Rezerwacja'}
        description={service ? `Zarezerwuj wizytę: ${service.name} w salonie Katarzyna Brui, Białystok. Szybka rezerwacja online!` : 'Zarezerwuj wizytę w salonie kosmetycznym Katarzyna Brui w Białymstoku.'}
        canonical={`/booking/${serviceId}`}
        noindex
      />
      {service && <div className="mb-8">
        <ServiceCard service={service} />
      </div>}

      {service && (
        <AdvancedBookingCalendar
          service={service}
          onSlotSelect={handleSlotSelect}
          stylistId={null}
        />
      )}

      {showBookingForm && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <BookingForm
            onSubmit={handleBookingSubmit}
            onCancel={() => setShowBookingForm(false)}
          />
        </div>
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode="signin"
        onSuccess={() => {
          setShowBookingForm(true);
        }}
      />

      {showSuccessPopup && service && selectedSlot && (
        <SuccessPopup
          service={service}
          timeSlot={selectedSlot}
          onClose={() => {
            setShowSuccessPopup(false);
            navigate('/profile');
          }}
        />
      )}
    </div>
  );
};