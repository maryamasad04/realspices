'use client';

import { siteEyebrow, siteHeading, siteSubtext } from '@/lib/siteStyles';
import { useTheme } from '@/hooks/use-theme';

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  className?: string;
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const { dark: darkMode } = useTheme();
  const isCenter = align === 'center';

  return (
    <div className={`mb-14 md:mb-16 ${isCenter ? 'text-center' : ''} ${className}`}>
      {eyebrow && <span className={siteEyebrow(darkMode)}>{eyebrow}</span>}
      <h2 className={`${siteHeading(darkMode, 'md')} ${isCenter ? 'mx-auto' : ''} max-w-3xl`}>{title}</h2>
      {description && (
        <p className={`${siteSubtext(darkMode)} mt-4 ${isCenter ? 'mx-auto' : ''} max-w-2xl`}>{description}</p>
      )}
    </div>
  );
}
