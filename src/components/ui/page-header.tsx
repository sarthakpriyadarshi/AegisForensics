import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description?: string
  badge?: {
    text: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, badge, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          {badge && (
            <Badge variant={badge.variant || "outline"} className="border-primary/20 text-primary">
              {badge.text}
            </Badge>
          )}
          <h1 className="text-3xl font-bold text-foreground text-balance">{title}</h1>
          {description && <p className="text-lg text-muted-foreground text-pretty">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}
