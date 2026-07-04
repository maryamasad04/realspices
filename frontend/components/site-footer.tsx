'use client';

import Link from 'next/link';
import { useTheme } from '@/hooks/use-theme';
import { SITE_SOCIAL } from '@/lib/siteConfig';
import { siteContainer, siteDivider, siteEyebrow } from '@/lib/siteStyles';

export default function SiteFooter() {
  const { dark: darkMode } = useTheme();

  const linkClass = darkMode
    ? 'text-gray-500 hover:text-white transition-colors text-sm'
    : 'text-gray-600 hover:text-rose-800 transition-colors text-sm';

  const socialClass = darkMode
    ? 'border-white/15 text-gray-400 hover:text-white hover:border-white/30'
    : 'border-gray-300/80 text-gray-600 hover:text-rose-800 hover:border-rose-300';

  return (
    <footer
      className={`border-t transition-colors duration-500 ${
        darkMode
          ? 'bg-gray-950 text-white border-white/10'
          : 'bg-stone-200 text-gray-900 border-rose-200/50'
      }`}
    >
      <div className={`${siteContainer()} pt-12 md:pt-14 pb-6 md:pb-8`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-8">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-5 group">
              <div
                className={`w-9 h-9 rounded-full overflow-hidden ring-1 transition-all ${
                  darkMode
                    ? 'ring-white/15 group-hover:ring-amber-500/40'
                    : 'ring-rose-200 group-hover:ring-rose-400/50'
                }`}
              >
                <img src="/real spices.jpeg" alt="Real Spices" className="w-full h-full object-contain p-0.5 bg-white" />
              </div>
              <div className="leading-none">
                <span
                  className={`text-[11px] font-medium tracking-[0.28em] uppercase block ${
                    darkMode ? 'text-amber-200/90' : 'text-rose-800'
                  }`}
                >
                  Real Spices
                </span>
                <span
                  className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 block ${
                    darkMode ? 'text-white/35' : 'text-gray-500'
                  }`}
                >
                  Kashmiri Saffron
                </span>
              </div>
            </Link>
            <p className={`text-sm font-light leading-relaxed max-w-xs ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Premium Kashmiri saffron delivered to your doorstep. Authentic taste of tradition.
            </p>
          </div>

          <div>
            <h3 className={`${siteEyebrow(darkMode)} !mb-5 ${darkMode ? '!text-white/40' : '!text-gray-500'}`}>
              Explore
            </h3>
            <ul className="space-y-3">
              <li><Link href="/products" className={linkClass}>Products</Link></li>
              <li><Link href="/about" className={linkClass}>About Us</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={`${siteEyebrow(darkMode)} !mb-5 ${darkMode ? '!text-white/40' : '!text-gray-500'}`}>
              Support
            </h3>
            <ul className="space-y-3">
              <li><Link href="/contact" className={linkClass}>Contact</Link></li>
              <li><Link href="/shipping" className={linkClass}>Shipping</Link></li>
            </ul>
          </div>

          <div>
            <h3 className={`${siteEyebrow(darkMode)} !mb-5 ${darkMode ? '!text-white/40' : '!text-gray-500'}`}>
              Connect
            </h3>
            <p className={`text-sm font-light mb-5 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
              Follow us for updates and offers.
            </p>
            <div className="flex gap-3">
              <a
                href={SITE_SOCIAL.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-[0.1em] uppercase border transition-colors ${socialClass}`}
              >
                Facebook
              </a>
              <a
                href={SITE_SOCIAL.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`px-4 py-2 rounded-full text-xs font-medium tracking-[0.1em] uppercase border transition-colors ${socialClass}`}
              >
                Instagram
              </a>
            </div>
          </div>
        </div>

        <div className={`${siteDivider(darkMode)} mt-10 pt-6 pb-0 text-center space-y-1`}>
          <p className={`text-xs tracking-wide ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            © 2026 Real Spices. All rights reserved.
          </p>
          <p className={`text-xs tracking-wide ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
            Made for saffron lovers
          </p>
        </div>
      </div>
    </footer>
  );
}
