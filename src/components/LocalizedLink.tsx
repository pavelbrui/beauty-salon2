import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { localizedPath } from '../hooks/useLocalizedPath';

interface LocalizedLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
}

export const LocalizedLink: React.FC<LocalizedLinkProps> = ({ to, ...props }) => {
  const { language } = useLanguage();
  return <Link to={localizedPath(to, language)} {...props} />;
};
