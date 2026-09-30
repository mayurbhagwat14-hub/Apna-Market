import React from 'react';
import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';

export const MagicCard = ({
  children,
  className = '',
  gradientColor = 'rgba(99, 102, 241, 0.12)', // Indigo subtle glow
  gradientSize = 250,
  ...props
}) => {
  const mouseX = useMotionValue(-gradientSize);
  const mouseY = useMotionValue(-gradientSize);

  const handleMouseMove = (e) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const handleMouseLeave = () => {
    mouseX.set(-gradientSize);
    mouseY.set(-gradientSize);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex h-full w-full overflow-hidden rounded-2xl bg-white border border-neutral-100 hover:border-indigo-100 transition-colors shadow-sm hover:shadow-md ${className}`}
      {...props}
    >
      <div className="relative z-10 w-full h-full bg-white/50">{children}</div>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(${gradientSize}px circle at ${mouseX}px ${mouseY}px, ${gradientColor}, transparent 100%)
          `,
        }}
      />
    </div>
  );
};
