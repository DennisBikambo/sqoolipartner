'use client';

import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "framer-motion";

interface LoadingProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({
  message = "Loading...",
  className = "",
  size = "md",
}: LoadingProps) {
  const sizeClasses = {
    sm: "min-h-[200px]",
    md: "min-h-[400px]",
    lg: "min-h-[600px]",
  };

  const iconSizes = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center space-y-4",
        sizeClasses[size],
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Loader2
          className={cn(
            "animate-spin text-primary",
            iconSizes[size]
          )}
        />
      </motion.div>

      <motion.p
        className="text-sm text-muted-foreground tracking-wide"
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
      >
        {message}
      </motion.p>

      <motion.div
        className="flex gap-1 mt-1"
        initial="hidden"
        animate="visible"
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.15,
              repeat: Infinity,
              repeatType: "reverse",
            },
          },
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/70"
            variants={{
              hidden: { opacity: 0.2, y: 0 },
              visible: { opacity: 1, y: -3 },
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
