import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { getTimezone } from "@/lib/dates"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function tzHeaders(): Record<string, string> {
  return { "x-timezone": getTimezone() }
}
