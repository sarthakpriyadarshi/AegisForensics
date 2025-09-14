"use client"

import type React from "react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
  onClear?: () => void
  className?: string
  disabled?: boolean
}

export function SearchInput({
  placeholder = "Search...",
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  className,
  disabled = false,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState("")
  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
  }

  const handleSearch = () => {
    onSearch?.(value)
  }

  const handleClear = () => {
    const newValue = ""
    if (controlledValue === undefined) {
      setInternalValue(newValue)
    }
    onChange?.(newValue)
    onClear?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10"
          disabled={disabled}
        />
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
      {onSearch && (
        <Button onClick={handleSearch} className="ml-2" disabled={disabled || !value.trim()}>
          Search
        </Button>
      )}
    </div>
  )
}
