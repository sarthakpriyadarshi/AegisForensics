import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Clock, AlertTriangle, Zap, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export type StatusType =
  | "online"
  | "offline"
  | "pending"
  | "warning"
  | "success"
  | "error"
  | "active"
  | "inactive"
  | "high"
  | "medium"
  | "low"
  | "critical"
  | "running"
  | "stopped"

interface StatusBadgeProps {
  status: StatusType
  text?: string
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  online: {
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-600 hover:bg-green-700 text-white",
    text: "Online",
  },
  offline: {
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-600 hover:bg-red-700 text-white",
    text: "Offline",
  },
  pending: {
    variant: "secondary" as const,
    icon: Clock,
    className: "bg-yellow-600 hover:bg-yellow-700 text-white",
    text: "Pending",
  },
  warning: {
    variant: "secondary" as const,
    icon: AlertTriangle,
    className: "bg-orange-600 hover:bg-orange-700 text-white",
    text: "Warning",
  },
  success: {
    variant: "default" as const,
    icon: CheckCircle,
    className: "bg-green-600 hover:bg-green-700 text-white",
    text: "Success",
  },
  error: {
    variant: "destructive" as const,
    icon: XCircle,
    className: "bg-red-600 hover:bg-red-700 text-white",
    text: "Error",
  },
  active: {
    variant: "default" as const,
    icon: Zap,
    className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    text: "Active",
  },
  inactive: {
    variant: "secondary" as const,
    icon: XCircle,
    className: "bg-muted hover:bg-muted/80 text-muted-foreground",
    text: "Inactive",
  },
  high: {
    variant: "destructive" as const,
    icon: AlertTriangle,
    className: "bg-red-600 hover:bg-red-700 text-white",
    text: "High",
  },
  medium: {
    variant: "secondary" as const,
    icon: AlertTriangle,
    className: "bg-orange-600 hover:bg-orange-700 text-white",
    text: "Medium",
  },
  low: {
    variant: "outline" as const,
    icon: CheckCircle,
    className: "border-green-500/50 text-green-600 hover:bg-green-50",
    text: "Low",
  },
  critical: {
    variant: "destructive" as const,
    icon: Shield,
    className: "bg-red-700 hover:bg-red-800 text-white animate-pulse",
    text: "Critical",
  },
  running: {
    variant: "default" as const,
    icon: Zap,
    className: "bg-primary hover:bg-primary/90 text-primary-foreground",
    text: "Running",
  },
  stopped: {
    variant: "secondary" as const,
    icon: XCircle,
    className: "bg-muted hover:bg-muted/80 text-muted-foreground",
    text: "Stopped",
  },
}

export function StatusBadge({ status, text, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayText = text || config.text

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {displayText}
    </Badge>
  )
}
