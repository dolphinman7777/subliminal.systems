import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedBeamProps {
  className?: string;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({ className }) => {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full h-full bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 opacity-75 blur-3xl" />
    </motion.div>
  );
};