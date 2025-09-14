import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  progress?: number
  trend?: "up" | "down" | "neutral"
  className?: string
  iconClassName?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  progress,
  trend,
  className,
  iconClassName,
}: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card className={cn("hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center", iconClassName)}>
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={cn("text-2xl font-bold", getTrendColor())}>{value}</div>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          {progress !== undefined && progress > 0 && <Progress value={progress} className="h-2 mt-3" />}
        </div>
      </CardContent>
    </Card>
  )
}
