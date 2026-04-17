import * as React from "react"

const badgeVariants = {
  high: "bg-red-100 text-red-800 border border-red-200",
  medium: "bg-orange-100 text-[#FC6D26] border border-orange-300",
  low: "bg-green-100 text-green-800 border border-green-200",
  default: "bg-gray-100 text-gray-800 border border-gray-200"
}

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants
  children: React.ReactNode
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", children, ...props }, ref) => (
    <div
      ref={ref}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-default ${badgeVariants[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </div>
  )
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
