"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
}

interface UploadedFile {
  file: File
  status: "uploading" | "success" | "error"
  progress: number
  error?: string
}

export function FileUpload({
  onFileSelect,
  accept,
  multiple = false,
  maxSize = 10,
  className,
  disabled = false,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const droppedFiles = Array.from(e.dataTransfer.files)
      handleFiles(droppedFiles)
    },
    [disabled],
  )

  const handleFiles = (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter((file) => {
      if (maxSize && file.size > maxSize * 1024 * 1024) {
        return false
      }
      return true
    })

    const newFiles: UploadedFile[] = validFiles.map((file) => ({
      file,
      status: "success",
      progress: 100,
    }))

    setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles))
    onFileSelect(validFiles)
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        className={cn(
          "border-2 border-dashed transition-colors",
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
            <div>
              <p className="text-lg font-medium">
                Drop files here or{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-primary"
                  onClick={() => {
                    if (disabled) return
                    const input = document.createElement("input")
                    input.type = "file"
                    input.accept = accept || ""
                    input.multiple = multiple
                    input.onchange = (e) => {
                      const files = Array.from((e.target as HTMLInputElement).files || [])
                      handleFiles(files)
                    }
                    input.click()
                  }}
                  disabled={disabled}
                >
                  browse
                </Button>
              </p>
              <p className="text-sm text-muted-foreground">
                {accept && `Accepted formats: ${accept}`}
                {maxSize && ` • Max size: ${maxSize}MB`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{uploadedFile.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.file.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {uploadedFile.status === "success" && (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                    {uploadedFile.status === "error" && (
                      <Badge variant="destructive">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Error
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {uploadedFile.status === "uploading" && <Progress value={uploadedFile.progress} className="mt-2" />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
