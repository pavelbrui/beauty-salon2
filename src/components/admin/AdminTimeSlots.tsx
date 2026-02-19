import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { StylistCalendar } from './StylistCalendar';
import { Stylist } from '../../types';
import { StylistFilter } from '../StylistFilter';

const AdminTimeSlots: React.FC = () => {
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [stylists, setStylists] = useState<Stylist[]>([]);

  useEffect(() => {
    loadStylists();
  }, []);

  const loadStylists = async () => {
    const { data } = await supabase
      .from('stylists')
      .select('*')
      .order('name');

    if (data) {
      setStylists(data);
    }
  };

  const handleStylistSelect = (id: string) => {
    if (!id) {
      setSelectedStylist(null);
    } else {
      const stylist = stylists.find(s => s.id === id);
      setSelectedStylist(stylist || null);
    }
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Zarządzanie godzinami pracy
      </h3>

      <div className="mb-6">
        <span className="text-sm font-medium text-gray-600 mb-2 block">
          Wybierz stylistkę
        </span>
        <StylistFilter
          stylists={stylists}
          selectedId={selectedStylist?.id || ''}
          onSelect={handleStylistSelect}
          allLabel="Wszystkie stylistki"
        />
      </div>

      {selectedStylist && (
        <StylistCalendar
          stylistId={selectedStylist.id}
          onSave={() => loadStylists()}
        />
      )}
    </div>
  );
};

export { AdminTimeSlots };
