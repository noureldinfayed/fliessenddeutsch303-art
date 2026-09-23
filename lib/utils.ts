import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function tempPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function toWhatsApp(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(value ?? 0);
}
