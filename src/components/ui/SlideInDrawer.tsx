import React from 'react';
import { X } from 'lucide-react';

interface SlideInDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlideInDrawer: React.FC<SlideInDrawerProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <div
      className={`fixed top-16 right-0 bottom-0 w-80 z-50 bg-card border-l border-border shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 border-b border-border flex items-center justify-between shrink-0 bg-muted/30">
        <h3 className="font-sans font-bold text-sm tracking-wider text-foreground">{title}</h3>
        <button 
          onClick={onClose} 
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors"
          title="Close panel"
        >
          <X size={16} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {children}
      </div>
    </div>
  );
};
