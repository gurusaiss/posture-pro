import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * cn – (shadcn style) conditional class-name helper
 *
 * Usage:
 *   <div className={cn("p-4", isActive && "bg-primary")} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
