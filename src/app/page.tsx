import { redirect } from 'next/navigation';

// Root redirects are handled by proxy.ts
// This page exists as a fallback
export default function RootPage() {
  redirect('/inicio');
}