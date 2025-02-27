import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Service {
  id: string;
  name: string;
  category: string;
}

interface Stylist {
  id: string;
  name: string;
}

interface Assignment {
  stylist_id: string;
  service_id: string;
}

export const StylistAssignments: React.FC = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load stylists
      const { data: stylistsData } = await supabase
        .from('stylists')
        .select('id, name')
        .order('name');
      
      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('id, name, category')
        .order('category, name');
      
      // Load current assignments
      const { data: assignmentsData } = await supabase
        .from('stylist_service_assignments')
        .select('stylist_id, service_id');
      
      if (stylistsData) setStylists(stylistsData);
      if (servicesData) setServices(servicesData);
      if (assignmentsData) setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssignment = async (stylistId: string, serviceId: string) => {
    const isAssigned = assignments.some(
      a => a.stylist_id === stylistId && a.service_id === serviceId
    );

    if (isAssigned) {
      const { error } = await supabase
        .from('stylist_service_assignments')
        .delete()
        .match({ stylist_id: stylistId, service_id: serviceId });

      if (!error) {
        setAssignments(prev => 
          prev.filter(a => !(a.stylist_id === stylistId && a.service_id === serviceId))
        );
      }
    } else {
      const { error } = await supabase
        .from('stylist_service_assignments')
        .insert({ stylist_id: stylistId, service_id: serviceId });

      if (!error) {
        setAssignments(prev => [...prev, { stylist_id: stylistId, service_id: serviceId }]);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  const servicesByCategory = services.reduce((acc, service) => {
    acc[service.category] = [...(acc[service.category] || []), service];
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">Przypisz usługi do stylistek</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usługa
              </th>
              {stylists.map(stylist => (
                <th key={stylist.id} className="px-6 py-3 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {stylist.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(servicesByCategory).map(([category, categoryServices]) => (
              <React.Fragment key={category}>
                <tr>
                  <td colSpan={stylists.length + 1} className="px-6 py-4 bg-gray-50">
                    <span className="font-medium text-gray-900">{category}</span>
                  </td>
                </tr>
                {categoryServices.map(service => (
                  <tr key={service.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.name}
                    </td>
                    {stylists.map(stylist => (
                      <td key={stylist.id} className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={assignments.some(
                            a => a.stylist_id === stylist.id && a.service_id === service.id
                          )}
                          onChange={() => toggleAssignment(stylist.id, service.id)}
                          className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};