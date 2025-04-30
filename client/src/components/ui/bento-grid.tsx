import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

export const BentoGrid = ({ className, children }: BentoGridProps) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {children}
    </div>
  );
};

interface BentoGridItemProps {
  className?: string;
  title: string;
  description: string;
  header?: ReactNode;
  icon?: ReactNode;
  delay?: number;
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  delay = 0,
}: BentoGridItemProps) => {
  return (
    <motion.div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition-all duration-200 glass-card border border-white/10",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        delay: delay,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      viewport={{ once: true }}
      whileHover={{ 
        y: -5, 
        x: 0,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="backdrop-blur-sm h-full w-full p-6 rounded-xl overflow-hidden">
        {header}
        <div className="flex items-center gap-3 mt-4">
          {icon && (
            <motion.div 
              className="rounded-full bg-[#FFBF0D]/20 p-3 text-[#FFBF0D]"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              {icon}
            </motion.div>
          )}
          <h3 className="text-xl font-semibold glow-text font-heading">{title}</h3>
        </div>
        <div className="mt-2 text-white text-sm">{description}</div>
      </div>
    </motion.div>
  );
};