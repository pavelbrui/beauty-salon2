import React from 'react';
import { motion } from 'framer-motion';
import { Service } from '../types';
import { ServiceCard } from './ServiceCard';

interface ServiceSectionProps {
  category: string;
  services: Service[];
  onBookService?: (service: Service) => void;
}

export const ServiceSection: React.FC<ServiceSectionProps> = ({
  category,
  services,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">{category}</h2>
      
      <div className="relative">
        <div className="flex overflow-x-auto gap-6 pb-6 snap-x snap-mandatory">
          {services.map((service) => (
            <motion.div
              key={service.id}
              className="flex-none w-[300px] sm:w-[350px] snap-center"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <ServiceCard
                service={service}
              />
            </motion.div>
          ))}
        </div>
        
        <div className="absolute left-0 top-0 bottom-6 w-8 bg-gradient-to-r from-neutral-50 to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-6 w-8 bg-gradient-to-l from-neutral-50 to-transparent pointer-events-none" />
      </div>
    </motion.section>
  );
};