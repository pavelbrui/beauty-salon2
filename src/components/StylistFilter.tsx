import React from 'react';
import { Stylist } from '../types';
import { useLanguage } from '../hooks/useLanguage';
import { getStylistRole } from '../utils/serviceTranslation';

interface StylistFilterProps {
  stylists: Stylist[];
  selectedId: string;
  onSelect: (id: string) => void;
  allLabel?: string;
  /** 'horizontal' = inline chips (admin), 'vertical' = stacked list (sidebar) */
  layout?: 'horizontal' | 'vertical';
  /** Show role under name (only in vertical layout) */
  showRole?: boolean;
}

const GroupIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PersonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const StylistAvatar: React.FC<{
  imageUrl?: string;
  name: string;
  avatarSize: string;
  iconSize: string;
  iconOffset: string;
}> = ({ imageUrl, name, avatarSize, iconSize, iconOffset }) => {
  const [imgError, setImgError] = React.useState(false);

  return (
    <div className={`${avatarSize} rounded-full overflow-hidden flex-shrink-0 bg-gray-200`}>
      {imageUrl && !imgError ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <PersonIcon className={`${iconSize} text-gray-400 m-auto ${iconOffset}`} />
      )}
    </div>
  );
};

export const StylistFilter: React.FC<StylistFilterProps> = ({
  stylists,
  selectedId,
  onSelect,
  allLabel = 'Wszystkie',
  layout = 'horizontal',
  showRole = false,
}) => {
  const { language } = useLanguage();
  const isVertical = layout === 'vertical';
  const avatarSize = isVertical ? 'w-10 h-10' : 'w-8 h-8';
  const iconSize = isVertical ? 'w-5 h-5' : 'w-4 h-4';
  const iconOffset = isVertical ? 'mt-2.5' : 'mt-2';

  const isAllSelected = !selectedId;

  return (
    <div className={isVertical ? 'space-y-2' : 'flex flex-wrap gap-2'}>
      {/* "All" option */}
      <button
        onClick={() => onSelect('')}
        className={`${isVertical ? 'w-full' : ''} flex items-center gap-${isVertical ? '3' : '2'} px-3 py-${isVertical ? '2.5' : '2'} rounded-lg transition-all text-${isVertical ? 'left' : 'sm'} ${
          isAllSelected
            ? 'bg-amber-50 ring-2 ring-amber-500 text-amber-700 font-medium'
            : isVertical ? 'hover:bg-gray-50 text-gray-700' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
        }`}
      >
        <div className={`${avatarSize} rounded-full flex items-center justify-center flex-shrink-0 ${
          isAllSelected ? 'bg-amber-500' : 'bg-gray-200'
        }`}>
          <GroupIcon className={`${iconSize} ${isAllSelected ? 'text-white' : 'text-gray-500'}`} />
        </div>
        <span className={`${isVertical ? 'text-sm font-medium' : ''}`}>{allLabel}</span>
      </button>

      {/* Individual stylists */}
      {stylists.map((stylist) => {
        const isSelected = selectedId === stylist.id;
        return (
          <button
            key={stylist.id}
            onClick={() => onSelect(stylist.id)}
            className={`${isVertical ? 'w-full' : ''} flex items-center gap-${isVertical ? '3' : '2'} px-3 py-${isVertical ? '2.5' : '2'} rounded-lg transition-all text-${isVertical ? 'left' : 'sm'} ${
              isSelected
                ? 'bg-amber-50 ring-2 ring-amber-500 text-amber-700 font-medium'
                : isVertical ? 'hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
            }`}
          >
            <StylistAvatar
              imageUrl={stylist.image_url}
              name={stylist.name}
              avatarSize={avatarSize}
              iconSize={iconSize}
              iconOffset={iconOffset}
            />
            {isVertical && showRole ? (
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-amber-700' : 'text-gray-900'}`}>
                  {stylist.name}
                </p>
                {stylist.role && (
                  <p className="text-xs text-gray-500 truncate">{getStylistRole(stylist, language)}</p>
                )}
              </div>
            ) : (
              <span className={isSelected ? '' : isVertical ? 'text-sm font-medium text-gray-900' : ''}>
                {stylist.name}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
