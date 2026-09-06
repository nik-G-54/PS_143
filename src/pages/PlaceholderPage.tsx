import React from 'react';
import { ComingSoonPage } from './ComingSoonPage';

interface PlaceholderPageProps {
  title?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return <ComingSoonPage title={title} />;
};

export default PlaceholderPage;
