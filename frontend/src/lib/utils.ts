import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Shadcn/UI-compatible cn utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}