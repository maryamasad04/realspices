"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sun,
  Moon,
  ShoppingCart,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useUser } from "@/context/UserContext";

const navItems = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
  { name: "Products", path: "/products" },
  { name: "Contact", path: "/contact" },
];

export default function NavBar() {
  const pathname = usePathname();
  const { dark: darkMode, toggle } = useTheme();
  const { user, logout } = useUser();
  const [cartCount, setCartCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = pathname === "/";
  const isOverlay = isHome && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setShowDropdown(false);
  }, [pathname]);

  useEffect(() => {
    const compute = () => {
      try {
        const raw = localStorage.getItem("tadbir_cart") || "[]";
        const parsed = JSON.parse(raw) as Array<{ qty?: number; quantity?: number }>;
        const count = parsed.reduce((s, it) => s + (it.qty ?? it.quantity ?? 0), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    compute();

    const onStorage = (ev: StorageEvent) => {
      if (ev.key === "tadbir_cart") compute();
    };

    const onCustom = (ev: Event) => {
      try {
        const ce = ev as CustomEvent;
        if (ce?.detail) {
          const parsed = ce.detail as Array<{ qty?: number; quantity?: number }>;
          const count = parsed.reduce((s, it) => s + (it.qty ?? it.quantity ?? 0), 0);
          setCartCount(count);
          return;
        }
      } catch {
        /* ignore */
      }
      compute();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("tadbir_cart_updated", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("tadbir_cart_updated", onCustom as EventListener);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDropdown && !target.closest("[data-user-menu]")) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDropdown]);

  const linkBase = isOverlay
    ? "text-white/70 hover:text-white"
    : darkMode
      ? "text-gray-400 hover:text-white"
      : "text-gray-600 hover:text-rose-800";

  const linkActive = isOverlay
    ? "text-white"
    : darkMode
      ? "text-white"
      : "text-rose-800";

  const iconBtnClass = isOverlay
    ? "text-white/80 hover:text-white hover:bg-white/10 border-transparent"
    : darkMode
      ? "text-gray-400 hover:text-white hover:bg-white/5 border-white/10"
      : "text-gray-600 hover:text-rose-800 hover:bg-rose-50 border-gray-200/80";

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        isOverlay
          ? "bg-transparent border-b border-white/10"
          : darkMode
            ? "bg-gray-950/80 border-b border-white/10 backdrop-blur-xl"
            : "bg-white/80 border-b border-gray-200/80 backdrop-blur-xl"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 md:h-16">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group shrink-0"
          >
            <div
              className={`w-9 h-9 rounded-full overflow-hidden shrink-0 transition-all duration-300 ${
                isOverlay
                  ? "ring-1 ring-white/20 group-hover:ring-white/40"
                  : "ring-1 ring-amber-500/20 group-hover:ring-amber-500/40"
              }`}
            >
              <img
                src="/real spices.jpeg"
                alt="Real Spices"
                className="w-full h-full object-contain p-0.5 bg-white/90"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className={`text-[11px] font-medium tracking-[0.28em] uppercase transition-colors ${
                  isOverlay ? "text-amber-200/90" : "text-amber-700"
                }`}
              >
                Real Spices
              </span>
              <span
                className={`text-[9px] tracking-[0.18em] uppercase mt-0.5 transition-colors ${
                  isOverlay ? "text-white/40" : darkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                Kashmiri Saffron
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`relative px-4 py-2 text-xs font-medium tracking-[0.12em] uppercase transition-colors duration-300 ${active ? linkActive : linkBase}`}
                >
                  {item.name}
                  <span
                    className={`absolute bottom-1 left-4 right-4 h-px transition-all duration-300 ${
                      active
                        ? isOverlay
                          ? "bg-amber-300/80"
                          : "bg-rose-600"
                        : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggle()}
              className={`h-9 w-9 rounded-full border transition-all duration-300 ${iconBtnClass}`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className={`relative h-9 w-9 rounded-full border transition-all duration-300 ${iconBtnClass}`}
                aria-label="Shopping cart"
              >
                <ShoppingCart className="w-4 h-4" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full text-[10px] font-semibold text-white bg-rose-600 ring-2 ring-black/20">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Button>
            </Link>

            {user ? (
              <div className="relative hidden sm:block" data-user-menu>
                <button
                  type="button"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full border text-sm transition-all duration-300 ${
                    isOverlay
                      ? "border-white/15 text-white hover:bg-white/10"
                      : darkMode
                        ? "border-white/10 text-white hover:bg-white/5"
                        : "border-gray-200 text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                      isOverlay || darkMode
                        ? "bg-rose-700 text-white"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline text-xs font-medium max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                </button>

                {showDropdown && (
                  <div
                    className={`absolute right-0 mt-2 w-52 rounded-xl shadow-xl border overflow-hidden z-50 ${
                      darkMode
                        ? "bg-gray-900/95 border-white/10 backdrop-blur-xl"
                        : "bg-white/95 border-gray-200/80 backdrop-blur-xl"
                    }`}
                  >
                    <div
                      className={`px-4 py-3 border-b ${
                        darkMode ? "border-white/10" : "border-gray-100"
                      }`}
                    >
                      <p className={`text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-900"}`}>
                        {user.name}
                      </p>
                      <p className={`text-xs truncate mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {user.email}
                      </p>
                    </div>
                    <Link href="/orders?open=1">
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                          darkMode
                            ? "text-gray-300 hover:bg-white/5 hover:text-white"
                            : "text-gray-600 hover:bg-gray-50 hover:text-rose-800"
                        }`}
                      >
                        <Package className="w-4 h-4 opacity-60" />
                        My Orders
                      </button>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                        darkMode
                          ? "text-gray-300 hover:bg-white/5 hover:text-white"
                          : "text-gray-600 hover:bg-gray-50 hover:text-rose-800"
                      }`}
                    >
                      <LogOut className="w-4 h-4 opacity-60" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block">
                <Button
                  size="sm"
                  className={`h-9 px-5 text-xs font-medium tracking-[0.1em] uppercase rounded-full transition-all duration-300 ${
                    isOverlay
                      ? "bg-white/95 text-rose-900 hover:bg-white border-0"
                      : darkMode
                        ? "bg-white text-gray-900 hover:bg-white/90 border-0"
                        : "bg-rose-800 text-white hover:bg-rose-900 border-0"
                  }`}
                >
                  Sign In
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden h-9 w-9 rounded-full border transition-all duration-300 ${iconBtnClass}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-96 opacity-100 pb-4" : "max-h-0 opacity-0"
          }`}
        >
          <div
            className={`pt-2 pb-1 border-t ${
              isOverlay ? "border-white/10" : darkMode ? "border-white/10" : "border-gray-200/80"
            }`}
          >
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`block px-2 py-3 text-xs font-medium tracking-[0.14em] uppercase transition-colors ${
                    active ? linkActive : linkBase
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}

            {user ? (
              <div className={`mt-2 pt-2 border-t space-y-1 ${isOverlay ? "border-white/10" : darkMode ? "border-white/10" : "border-gray-200/80"}`}>
                <p className={`px-2 py-1 text-xs ${isOverlay ? "text-white/50" : darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {user.email}
                </p>
                <Link href="/orders?open=1" className={`block px-2 py-2.5 text-xs tracking-wide uppercase ${linkBase}`}>
                  My Orders
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className={`block w-full text-left px-2 py-2.5 text-xs tracking-wide uppercase ${linkBase}`}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/login" className="block mt-3 px-2">
                <Button
                  size="sm"
                  className={`w-full h-10 text-xs tracking-[0.1em] uppercase rounded-full ${
                    isOverlay
                      ? "bg-white text-rose-900 hover:bg-white/90"
                      : "bg-rose-800 text-white hover:bg-rose-900"
                  }`}
                >
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
