import React from 'react';
import { motion } from 'framer-motion';
import { Service } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { translations } from '../i18n/translations';

interface ServiceListProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  selectedService: Service | null;
}

export const ServiceList: React.FC<ServiceListProps> = ({ 
  services, 
  onServiceSelect,
  selectedService 
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    selectedService ? selectedService.category : null
  );

  const categories = Array.from(new Set(services.map(s => s.category)));
  const filteredServices = selectedCategory
    ? services.filter(s => s.category === selectedCategory)
    : services;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-full transition-colors ${
            !selectedCategory ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {t.all}
        </motion.button>
        {categories.map(category => (
          <motion.button
            key={category}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full transition-colors ${
              selectedCategory === category ? 'bg-amber-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category}
          </motion.button>
        ))}
      </div>

      <motion.div
        layout
        className="grid gap-4"
      >
        {filteredServices.map((service) => (
          <motion.div
            key={service.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onServiceSelect(service)}
            className={`bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow
              ${selectedService?.id === service.id ? 'ring-2 ring-amber-500' : ''}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{service.name}</h3>
                <p className="text-sm text-gray-500">{service.duration} min</p>
              </div>
              <span className="text-lg font-semibold text-amber-600">
                {(service.price / 100).toFixed(2)} zł
              </span>
            </div>
            {service.description && (
              <p className="mt-2 text-sm text-gray-600">{service.description}</p>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};