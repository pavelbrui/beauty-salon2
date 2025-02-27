import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { StylistCalendar } from './StylistCalendar';
import { Stylist } from '../../types';

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

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Zarządzanie godzinami pracy
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Wybierz stylistkę
        </label>
        <select
          value={selectedStylist?.id || ''}
          onChange={(e) => {
            const stylist = stylists.find(s => s.id === e.target.value);
            setSelectedStylist(stylist || null);
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
        >
          <option value="">Wybierz stylistkę...</option>
          {stylists.map((stylist) => (
            <option key={stylist.id} value={stylist.id}>
              {stylist.name}
            </option>
          ))}
        </select>
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