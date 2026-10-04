import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** How long toasts with a "Desfazer" button stay up — long enough to read and react. */
export const UNDO_TOAST_DURATION = 8000;
