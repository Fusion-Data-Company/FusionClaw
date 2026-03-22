"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxProps {
    images: { url: string; filename?: string; size?: number; uploadedAt?: string }[];
    initialIndex?: number;
    open: boolean;
    onClose: () => void;
}

export function Lightbox({ images, initialIndex = 0, open, onClose }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        setCurrentIndex(initialIndex);
    }, [initialIndex]);

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open) return;
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, onClose, goNext, goPrev]);

    if (!open || images.length === 0) return null;

    const current = images[currentIndex];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            >
                <div className="relative max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="absolute -top-10 right-0 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <motion.img
                        key={currentIndex}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        src={current.url}
                        alt={current.filename || "Image"}
                        className="max-h-[80vh] w-auto rounded-xl border border-white/[0.08] shadow-2xl"
                    />

                    {images.length > 1 && (
                        <>
                            <button
                                onClick={goPrev}
                                aria-label="Previous image"
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <button
                                onClick={goNext}
                                aria-label="Next image"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/60 hover:text-white transition-colors"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </>
                    )}

                    <div className="mt-3 text-center">
                        {current.filename && (
                            <p className="text-sm text-white/60">{current.filename}</p>
                        )}
                        <p className="text-xs text-white/40">
                            {currentIndex + 1} / {images.length}
                        </p>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
