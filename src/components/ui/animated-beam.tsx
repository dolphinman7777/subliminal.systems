"use client";

import React, { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface AnimatedBeamProps {
  className?: string;
  containerRef: React.RefObject<HTMLDivElement>;
  fromRef: React.RefObject<HTMLDivElement>;
  toRef: React.RefObject<HTMLDivElement>;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({ className, containerRef, fromRef, toRef }) => {
  // Implementation of AnimatedBeam component
  // ...

  return (
    <motion.div
      className={cn("absolute inset-0", className)}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Beam implementation */}
    </motion.div>
  );
};

// ... rest of the file content ...

export { AnimatedBeamMultipleOutputDemo };