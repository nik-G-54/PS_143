import React from 'react';
import { motion } from 'framer-motion';

interface LoaderOneProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoaderOne: React.FC<LoaderOneProps> = ({ className = '', size = 'md' }) => {
  const dotSize = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-4 w-4' : 'h-3 w-3';

  return (
    <div className={`flex items-center justify-center gap-1.5 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className={`${dotSize} rounded-full bg-primary shadow-xs`}
          initial={{ x: 0 }}
          animate={{
            x: [0, 8, 0],
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.25, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
};

export default LoaderOne;
