import './globals.css';
import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import ConditionalNavBar from '@/components/ui/conditional-nav-bar';
import { UserProvider } from '../context/UserContext';
import { CartProvider } from '../context/CartContext';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const metadata: Metadata = {
  title: 'Real Spices - Premium Kashmiri Saffron | Authentic & Pure',
  description: 'Experience the finest Kashmiri saffron with Real Spices. Premium quality, lab-tested, and directly sourced from Kashmir valley. Free shipping on orders above ₹500.',
  keywords: 'saffron, kashmiri saffron, premium saffron, authentic saffron, real spices, spices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            try {
              var saved = localStorage.getItem('theme');
              var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (saved === 'dark' || (!saved && sysDark)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch (e) {}
          `}
        </Script>
        <UserProvider>
          <CartProvider>
            <ConditionalNavBar />
            <Toaster />
            {children}
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}
