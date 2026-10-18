"use client"

import type { ReactNode } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface GradientButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  children?: ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  loadingText?: string
}

export function GradientButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText = "Loading...",
  disabled = false,
  type = "button",
  "aria-label": ariaLabel,
  ...props
}: GradientButtonProps) {
  const isDisabled = disabled || loading

  return (
    <motion.button
      {...props}
      type={type}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl font-medium",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-slate-950",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "motion-reduce:transform-none motion-reduce:transition-none",
        size === "sm" && "gap-1.5 px-3 py-1.5 text-xs",
        size === "md" && "gap-2 px-4 py-2.5 text-sm",
        size === "lg" && "gap-2.5 px-6 py-3.5 text-base",
        variant === "primary" &&
          !isDisabled &&
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/30",
        variant === "primary" &&
          isDisabled &&
          "bg-gradient-to-r from-indigo-500/60 to-violet-500/60 text-white",
        variant === "secondary" &&
          "border border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white",
        variant === "ghost" &&
          "text-white/60 hover:bg-white/[0.06] hover:text-white",
        variant === "danger" &&
          "border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
        className
      )}
    >
      {loading && (
        <svg
          className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="9"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            d="M21 12a9 9 0 0 0-9-9"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      )}

      <span>{loading ? loadingText : children}</span>
    </motion.button>
  )
}