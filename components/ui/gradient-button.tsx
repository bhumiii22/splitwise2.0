"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export function GradientButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || loading}
      className={cn(
        "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        size === "sm" && "text-xs px-3 py-1.5 gap-1.5",
        size === "md" && "text-sm px-4 py-2.5 gap-2",
        size === "lg" && "text-base px-6 py-3.5 gap-2.5",
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400",
        variant === "secondary" &&
          "bg-white/[0.06] border border-white/[0.1] text-white/80 hover:bg-white/[0.1] hover:text-white",
        variant === "ghost" &&
          "text-white/60 hover:text-white hover:bg-white/[0.06]",
        variant === "danger" &&
          "bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20",
        className
      )}
      {...(props as any)}
    >
      {loading ? "Adding..." : children}
    </motion.button>
  )
}
   