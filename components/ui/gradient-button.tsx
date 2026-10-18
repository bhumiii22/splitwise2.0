
"use client"

import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"

interface GradientButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref" | "children"> {
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  loading?: boolean
  children?: React.ReactNode
}

export function GradientButton({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  type = "button",
  ...props
}: GradientButtonProps) {
  const isDisabled = Boolean(disabled || loading)

  return (
    <motion.button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      whileHover={isDisabled ? undefined : { scale: 1.01 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl font-medium",
        "transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
        "focus-visible:ring-offset-black",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "gap-1.5 px-3 py-1.5 text-xs",
        size === "md" && "gap-2 px-4 py-2.5 text-sm",
        size === "lg" && "gap-2.5 px-6 py-3.5 text-base",
        variant === "primary" &&
          "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:from-indigo-400 hover:to-violet-400 hover:shadow-indigo-500/30",
        variant === "secondary" &&
          "border border-white/10 bg-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white",
        variant === "ghost" &&
          "text-white/60 hover:bg-white/[0.06] hover:text-white",
        variant === "danger" &&
          "border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20",
        className
      )}
    >
      {loading ? (
        <>
          <span
            role="status"
            aria-label="Loading"
            className="h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current"
          />
          <span className="sr-only">Loading</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  )
}
