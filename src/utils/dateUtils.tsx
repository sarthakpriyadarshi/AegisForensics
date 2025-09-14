/**
 * Date utility functions for AegisForensics
 * Provides consistent date formatting and manipulation across the application
 */

/**
 * Format a date to a readable string
 * @param date - Date object, string, or timestamp
 * @param format - Format type: 'short', 'long', 'time', 'datetime', 'relative'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: "short" | "long" | "time" | "datetime" | "relative" = "short",
): string {
  const dateObj = new Date(date)

  if (isNaN(dateObj.getTime())) {
    return "Invalid Date"
  }

  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })

    case "long":
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })

    case "time":
      return dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })

    case "datetime":
      return dateObj.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })

    case "relative":
      if (diffMs < 60000) {
        // Less than 1 minute
        return "Just now"
      } else if (diffMs < 3600000) {
        // Less than 1 hour
        const minutes = Math.floor(diffMs / 60000)
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
      } else if (diffMs < 86400000) {
        // Less than 1 day
        const hours = Math.floor(diffMs / 3600000)
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
      } else {
        return formatDate(dateObj, "short")
      }

    default:
      return formatDate(dateObj, "short")
  }
}

/**
 * Get the time elapsed since a given date
 * @param startDate - Start date
 * @param endDate - End date (defaults to now)
 * @returns Object with elapsed time breakdown
 */
export function getTimeElapsed(startDate: Date | string | number, endDate?: Date | string | number) {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()

  const diffMs = end.getTime() - start.getTime()

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  return {
    totalMs: diffMs,
    days,
    hours,
    minutes,
    seconds,
    formatted: `${days > 0 ? `${days}d ` : ""}${hours > 0 ? `${hours}h ` : ""}${minutes > 0 ? `${minutes}m ` : ""}${seconds}s`,
  }
}

/**
 * Format duration in milliseconds to human readable string
 * @param durationMs - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }

  const seconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`
  } else {
    return `${seconds}s`
  }
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const dateObj = new Date(date)
  const today = new Date()

  return dateObj.toDateString() === today.toDateString()
}

/**
 * Check if a date is within the last N days
 * @param date - Date to check
 * @param days - Number of days to check within
 * @returns True if date is within the specified days
 */
export function isWithinDays(date: Date | string | number, days: number): boolean {
  const dateObj = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays >= 0 && diffDays <= days
}

/**
 * Get the start and end of a day
 * @param date - Date to get day boundaries for
 * @returns Object with start and end of day
 */
export function getDayBoundaries(date: Date | string | number) {
  const dateObj = new Date(date)

  const startOfDay = new Date(dateObj)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(dateObj)
  endOfDay.setHours(23, 59, 59, 999)

  return {
    start: startOfDay,
    end: endOfDay,
  }
}

/**
 * Format file timestamp for forensic analysis
 * @param timestamp - File timestamp
 * @returns Formatted timestamp with timezone info
 */
export function formatForensicTimestamp(timestamp: Date | string | number): string {
  const date = new Date(timestamp)

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  })
}

/**
 * Parse various date formats commonly found in forensic data
 * @param dateString - Date string to parse
 * @returns Parsed Date object or null if invalid
 */
export function parseForensicDate(dateString: string): Date | null {
  // Common forensic date formats
  const formats = [
    // ISO format
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    // Unix timestamp (seconds)
    /^\d{10}$/,
    // Unix timestamp (milliseconds)
    /^\d{13}$/,
    // Windows FILETIME (100-nanosecond intervals since 1601-01-01)
    /^\d{18}$/,
  ]

  // Try direct parsing first
  const date = new Date(dateString)
  if (!isNaN(date.getTime())) {
    return date
  }

  // Try Unix timestamp (seconds)
  if (/^\d{10}$/.test(dateString)) {
    return new Date(Number.parseInt(dateString) * 1000)
  }

  // Try Unix timestamp (milliseconds)
  if (/^\d{13}$/.test(dateString)) {
    return new Date(Number.parseInt(dateString))
  }

  // Try Windows FILETIME
  if (/^\d{18}$/.test(dateString)) {
    const filetime = BigInt(dateString)
    const unixTime = Number((filetime - BigInt("116444736000000000")) / BigInt("10000"))
    return new Date(unixTime)
  }

  return null
}
