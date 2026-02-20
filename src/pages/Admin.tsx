import React, { useState } from 'react';
import { AdminServices } from '../components/admin/AdminServices';
import { AdminStylists } from '../components/admin/AdminStylists';
import { AdminTimeSlots } from '../components/admin/AdminTimeSlots';
import { AdminGallery } from '../components/admin/AdminGallery';
import { StylistAssignments } from '../components/admin/StylistAssignments';
import { AdminBookings } from '../components/admin/AdminBookings';
import { AdminTrainings } from '../components/admin/AdminTrainings';

export const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'services' | 'bookings' | 'stylists' | 'timeslots' | 'gallery' | 'assignments' | 'trainings'>('services');

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
            <button
              onClick={() => setActiveTab('trainings')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'trainings' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Szkolenia
            </button>
          </nav>
        </div>
      </div>

      {activeTab === 'services' && <AdminServices />}
      {activeTab === 'stylists' && <AdminStylists />}
      {activeTab === 'timeslots' && <AdminTimeSlots />}
      {activeTab === 'gallery' && <AdminGallery />}
      {activeTab === 'assignments' && <StylistAssignments />}

      {activeTab === 'bookings' && <AdminBookings />}
      {activeTab === 'trainings' && <AdminTrainings />}
    </div>
  );
};