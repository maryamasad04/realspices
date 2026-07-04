'use client';

import { sitePage } from '@/lib/siteStyles';
import { useTheme } from '@/hooks/use-theme';

export default function PageShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { dark: darkMode } = useTheme();
  return <div className={`${sitePage(darkMode)} ${className}`}>{children}</div>;
}
