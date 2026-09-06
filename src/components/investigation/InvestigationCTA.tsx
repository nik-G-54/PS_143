// src/components/investigation/InvestigationCTA.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface InvestigationCTAProps {
  spillId: string;
  onNavigate?: () => void;
}

export const InvestigationCTA: React.FC<InvestigationCTAProps> = ({ spillId, onNavigate }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onNavigate) onNavigate();
    navigate('/incident-reconstruction');
  };

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow hover:bg-primary/90 active:scale-[0.99] transition-all duration-150 font-sans tracking-wider uppercase"
    >
      <span>Open Full Investigation</span>
      <ArrowRight size={16} />
    </button>
  );
};
