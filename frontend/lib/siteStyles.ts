import { cn } from '@/lib/utils';

export function sitePage(dark: boolean) {
  return cn(
    'min-h-screen transition-colors duration-500',
    dark ? 'bg-gray-950 text-white' : 'bg-stone-50 text-gray-900'
  );
}

export function siteContainer() {
  return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
}

export function siteSection(dark: boolean, variant: 'default' | 'alt' | 'muted' = 'default') {
  return cn(
    'py-20 md:py-24 transition-colors duration-500',
    variant === 'alt' && (dark ? 'bg-white/[0.02]' : 'bg-white'),
    variant === 'muted' && (dark ? 'bg-black/30' : 'bg-stone-100/80')
  );
}

export function siteEyebrow(dark: boolean) {
  return cn(
    'text-[11px] font-medium tracking-[0.28em] uppercase mb-4 block',
    dark ? 'text-amber-300/80' : 'text-rose-700'
  );
}

export function siteHeading(dark: boolean, size: 'xl' | 'lg' | 'md' | 'sm' = 'lg') {
  const sizes = {
    xl: 'text-4xl md:text-5xl lg:text-6xl',
    lg: 'text-3xl md:text-4xl lg:text-5xl',
    md: 'text-2xl md:text-3xl',
    sm: 'text-xl md:text-2xl',
  };
  return cn('font-light tracking-tight leading-[1.1]', sizes[size], dark ? 'text-white' : 'text-gray-900');
}

export function siteSubtext(dark: boolean) {
  return cn('text-base md:text-lg font-light leading-relaxed', dark ? 'text-gray-400' : 'text-gray-600');
}

export function siteCard(dark: boolean, hover = false) {
  return cn(
    'rounded-2xl border transition-all duration-300',
    dark ? 'bg-white/[0.03] border-white/10 backdrop-blur-sm' : 'bg-white border-gray-200/80 shadow-sm',
    hover && 'hover:border-rose-300/30 hover:shadow-md'
  );
}

export function siteBtnPrimary(extra?: string) {
  return cn(
    'h-11 px-6 rounded-full text-xs font-medium tracking-[0.12em] uppercase bg-rose-800 text-white hover:bg-rose-900 border-0 transition-colors',
    extra
  );
}

export function siteBtnSecondary(dark: boolean, extra?: string) {
  return cn(
    'h-11 px-6 rounded-full text-xs font-medium tracking-[0.12em] uppercase transition-colors',
    dark
      ? 'border border-white/20 text-white hover:bg-white/10 bg-transparent'
      : 'border border-gray-300/80 text-gray-800 hover:bg-white bg-white/80',
    extra
  );
}

export function siteInput(dark: boolean, extra?: string) {
  return cn(
    'rounded-xl border transition-colors',
    dark
      ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-amber-500/30'
      : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-rose-200',
    extra
  );
}

export function siteBackLink(dark: boolean) {
  return cn(
    'inline-flex items-center gap-2 text-xs font-medium tracking-[0.1em] uppercase transition-colors',
    dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-rose-800'
  );
}

export function siteBadge(dark: boolean) {
  return cn(
    'text-[10px] font-medium tracking-[0.15em] uppercase px-2.5 py-1 rounded-full',
    dark ? 'bg-rose-900/40 text-rose-200 border border-rose-800/50' : 'bg-rose-50 text-rose-800 border border-rose-100'
  );
}

export function siteDivider(dark: boolean) {
  return cn('border-t', dark ? 'border-white/10' : 'border-gray-200/80');
}
