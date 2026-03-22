"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UploadZoneProps {
    onUpload: (file: File) => Promise<void>;
    preview?: string | null;
    onRemove?: () => void;
    className?: string;
    disabled?: boolean;
}

// Synced with /api/upload allowed types
const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "application/pdf",
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function UploadZone({
    onUpload,
    preview,
    onRemove,
    className,
    disabled = false,
}: UploadZoneProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateFile = (file: File): boolean => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Invalid file type. Accepted: PNG, JPEG, WebP, GIF, HEIC, and PDF.");
            return false;
        }
        if (file.size > MAX_SIZE) {
            toast.error("File too large. Maximum size is 10MB.");
            return false;
        }
        return true;
    };

    const handleFile = useCallback(
        async (file: File) => {
            if (!validateFile(file)) return;

            setUploading(true);
            setProgress(0);

            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((p) => Math.min(p + 15, 90));
            }, 150);

            try {
                await onUpload(file);
                setProgress(100);
                toast.success("File uploaded successfully");
            } catch {
                toast.error("Upload failed. Please try again.");
            } finally {
                clearInterval(progressInterval);
                setTimeout(() => {
                    setUploading(false);
                    setProgress(0);
                }, 500);
            }
        },
        [onUpload]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            if (disabled) return;

            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
        },
        [handleFile, disabled]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleClick = () => {
        if (!disabled && !uploading) {
            fileInputRef.current?.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    if (preview) {
        return (
            <div className={cn("relative group", className)}>
                <img
                    src={preview}
                    alt="Upload preview"
                    className="h-12 w-12 rounded-lg object-cover border border-white/[0.08] transition-transform duration-200 group-hover:scale-105 cursor-pointer"
                />
                {onRemove && !disabled && (
                    <button
                        onClick={onRemove}
                        aria-label="Remove upload"
                        className="absolute -top-1.5 -right-1.5 rounded-full bg-red-500 p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleClick}
            className={cn(
                "relative flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer",
                isDragOver
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.02]",
                disabled && "opacity-50 cursor-not-allowed",
                uploading && "pointer-events-none",
                className
            )}
            style={{ minHeight: "48px", minWidth: "48px" }}
        >
            <input
                ref={fileInputRef}
                id="upload-file"
                name="file"
                type="file"
                accept={ALLOWED_TYPES.join(",")}
                onChange={handleFileChange}
                aria-label="Upload file"
                className="hidden"
            />

            {uploading ? (
                <div className="w-full px-3">
                    <div className="h-1.5 w-full rounded-full bg-white/[0.05] overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Upload</span>
                </div>
            )}
        </div>
    );
}
