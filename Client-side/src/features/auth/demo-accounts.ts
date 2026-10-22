import { GraduationCap, ShieldCheck, Users, type LucideIcon } from 'lucide-react';

/**
 * Demo accounts offered as one-click sign-ins on the login page.
 *
 * These are intentionally public, throwaway credentials so a reviewer can
 * explore every persona without creating accounts. They mirror the server's
 * seed accounts (`ADMIN_*` / `MENTOR_*` env) — if the server-side seed
 * changes, update them here in the same change. Do not put real secrets in
 * this file. Only imported from client components (the icon components
 * cannot cross the server → client boundary).
 */
export interface DemoAccount {
  label: string;
  email: string;
  password: string;
  icon: LucideIcon;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'Student demo',
    email: 'shawonahmed0294@gmail.com',
    password: 'Password@#12',
    icon: GraduationCap,
  },
  {
    label: 'Mentor demo',
    email: 'mentor@submittly.dev',
    password: 'ChangeMe#2026',
    icon: Users,
  },
  {
    label: 'Admin demo',
    email: 'admin@submittly.dev',
    password: 'ChangeMe#2026',
    icon: ShieldCheck,
  },
];
