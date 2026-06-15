"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;       // segundos
  y?: number;           // desplazamiento inicial en px
  className?: string;
};

export function Reveal({ children, delay = 0, y = 16, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.22, 0.8, 0.32, 1] as [number, number, number, number],
      }}
    >
      {children}
    </motion.div>
  );
}
