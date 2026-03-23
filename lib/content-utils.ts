import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function wordCount(text: string) {
  return text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

export function readTime(text: string) {
  const words = wordCount(text);
  return Math.max(1, Math.ceil(words / 250));
}
