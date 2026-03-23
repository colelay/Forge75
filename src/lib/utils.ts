import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizePhone(phone: string): string {
  // Strip all non-numeric characters except for leading '+'
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // If it's 10 digits and no '+', assume +1 (USA)
  if (cleaned.length === 10 && !cleaned.startsWith('+')) {
    return `+1${cleaned}`;
  }
  
  // If it's 11 digits starting with 1 and no '+', assume +1
  if (cleaned.length === 11 && cleaned.startsWith('1') && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  // If it doesn't start with '+', add it (assuming it's already a full international number)
  if (cleaned.length > 0 && !cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }
  
  return cleaned;
}
