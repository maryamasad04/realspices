'use client';

import { siteContainer, siteEyebrow, siteHeading, siteSubtext } from '@/lib/siteStyles';
import { useTheme } from '@/hooks/use-theme';

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  align?: 'left' | 'center';
}

export default function PageHero({
  eyebrow,
  title,
  description,
  children,
  align = 'center',
}: PageHeroProps) {
  const { dark: darkMode } = useTheme();
  const isCenter = align === 'center';

  return (
    <section
      className={`relative overflow-hidden border-b transition-colors duration-500 ${
        darkMode
          ? 'border-white/10 bg-gray-950'
          : 'border-rose-200/60 bg-linear-to-br from-rose-100 via-stone-200 to-amber-100'
      }`}
    >
      {darkMode ? (
        <>
          <div className="absolute inset-0 bg-linear-to-br from-rose-950/40 via-gray-950 to-amber-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,191,36,0.08),transparent_50%)]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(190,18,60,0.06),transparent_55%)]" />
      )}

      <div className={`${siteContainer()} relative z-10 pt-10 pb-14 md:pt-12 md:pb-16 ${isCenter ? 'text-center' : ''}`}>
        {eyebrow && <span className={siteEyebrow(darkMode)}>{eyebrow}</span>}
        <h1 className={`${siteHeading(darkMode, 'lg')} ${isCenter ? 'mx-auto' : ''} max-w-3xl`}>{title}</h1>
        {description && (
          <p className={`${siteSubtext(darkMode)} mt-6 ${isCenter ? 'mx-auto' : ''} max-w-2xl`}>{description}</p>
        )}
        {children && <div className={`mt-8 ${isCenter ? 'flex justify-center' : ''}`}>{children}</div>}
      </div>
    </section>
  );
}
