'use client';

import { usePathname } from 'next/navigation';
import NavBar from '@/components/ui/navBar';

export default function ConditionalNavBar() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  if (isAdminRoute) {
    return null;
  }

  return <NavBar />;
}
