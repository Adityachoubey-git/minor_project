"use client"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import Image from "next/image"
import { Button } from "./button"

interface PhotoUploadProps {
  onChange: (file: File) => void
  url?: string
}

export function PhotoUpload({ onChange,url }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChange(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300">
        {preview || url ? (
          <Image src={preview || url || "/placeholder.svg"} alt="Profile preview" fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Upload className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      <input type="file" ref={fileInputRef} onChange={handleFileChange}  accept=".jpeg,.jpg,.png" className="hidden" />
      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
        Upload Profile Photo
      </Button>
    </div>
  )
}

