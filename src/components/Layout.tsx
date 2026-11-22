import React, { useState } from 'react';
import {
  Globe,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { formatDzd } from '../i18n/messages.ts';
import { Button, SafeImage } from './ui/Primitives.tsx';

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    locale,
    setLocale,
    t,
    user,
    route,
    navigate,
    cart,
    cartOpen,
    setCartOpen,
    updateCartQty,
    removeFromCart,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.priceDzd * item.quantity,
    0
  );

  const navItems: Array<{ label: string; target: Parameters<typeof navigate>[0]; active: boolean }> = [
    {
      label: t.nav.marketplace,
      target: { name: 'catalog' },
      active: route.name === 'catalog' || route.name === 'product',
    },
    {
      label: t.nav.howItWorks,
      target: { name: 'how-it-works' },
      active: route.name === 'how-it-works' || route.name === 'passport',
    },
    {
      label: t.nav.producers,
      target: { name: 'producers' },
      active: route.name === 'producers' || route.name === 'producer',
    },
    {
      label: t.nav.community,
      target: { name: 'community' },
      active: route.name === 'community',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#17211C]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 border-b border-[#E5E1D8] bg-[#FAF9F6]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8 h-16">
          {/* Zone 1: Single-element Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate({ name: 'home' })}
            className="font-editorial text-2xl font-bold tracking-tight text-[#1B4D3E] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.brand}
          </button>

          {/* Zone 2: 4 Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[#52615A]"
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.target)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  item.active
                    ? 'border-[#1B4D3E] text-[#17211C]'
                    : 'border-transparent hover:text-[#17211C] hover:border-[#D4CFC3]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Language Switch, Cart, and Primary Account Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLocale(locale === 'ar' ? 'fr' : 'ar')}
              aria-label="Switch language"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52615A] hover:text-[#17211C] px-2 py-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{locale === 'ar' ? 'FR' : 'عربي'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={t.nav.cart}
              className="relative inline-flex items-center gap-1.5 text-sm font-medium text-[#17211C] hover:text-[#1B4D3E] px-2.5 py-1.5 rounded-md hover:bg-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span className="tabular-nums text-xs font-semibold">{cartCount}</span>
            </button>

            {user ? (
              <Button
                size="sm"
                onClick={() => navigate({ name: 'dashboard' })}
                className="hidden sm:inline-flex"
              >
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{t.nav.dashboard}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate({ name: 'auth', mode: 'login' })}
                className="hidden sm:inline-flex"
              >
                {t.nav.login}
              </Button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden p-2 text-[#17211C] hover:bg-[#F2EFE9] rounded-md"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E1D8] bg-[#FAF9F6] px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigate(item.target);
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-start px-3 py-2.5 text-sm font-medium text-[#17211C] hover:bg-[#F2EFE9] rounded-md"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-2 border-t border-[#E5E1D8]">
              {user ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate({ name: 'dashboard' });
                    setMobileMenuOpen(false);
                  }}
                >
                  {t.nav.dashboard} ({user.name.split('·')[0].trim()})
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => {
                    navigate({ name: 'auth', mode: 'login' });
                    setMobileMenuOpen(false);
                  }}
                >
                  {t.nav.login}
                </Button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Quiet Editorial Footer */}
      <footer className="mt-20 border-t border-[#E5E1D8] bg-[#F2EFE9]/70">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <span className="font-editorial text-xl font-bold text-[#1B4D3E]">
                {t.brandFull}
              </span>
              <p className="mt-2 text-sm text-[#52615A] max-w-md">
                {t.footer.tagline}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#52615A]">
              <button
                type="button"
                onClick={() => navigate({ name: 'info', page: 'about' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.about}
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'how-it-works' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.howItWorks}
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'info', page: 'faq' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.faq}
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'info', page: 'contact' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.contact}
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'info', page: 'privacy' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.privacy}
              </button>
              <button
                type="button"
                onClick={() => navigate({ name: 'info', page: 'terms' })}
                className="hover:text-[#17211C] cursor-pointer"
              >
                {t.footer.links.terms}
              </button>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#E5E1D8] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#52615A]">
            <span>{t.footer.rights}</span>
            <span>Algérie · DZD · Digital SPG · SHA-256 Product Passport</span>
          </div>
        </div>
      </footer>

      {/* Cart Slide-Over Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.cart.title}
            className="w-full max-w-md bg-white h-full flex flex-col border-s border-[#E5E1D8] shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E1D8]">
              <h2 className="text-lg font-semibold text-[#17211C]">
                {t.cart.title} ({cartCount})
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Close cart"
                className="p-2 text-[#52615A] hover:text-[#17211C] rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="w-10 h-10 text-[#A0AAA4] mx-auto mb-3" />
                  <p className="text-sm text-[#52615A] mb-5">{t.cart.empty}</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCartOpen(false);
                      navigate({ name: 'catalog' });
                    }}
                  >
                    {t.cart.browse}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-[#E5E1D8]">
                  {cart.map(({ product, quantity }) => (
                    <li key={product.id} className="py-4 flex gap-4">
                      <SafeImage
                        src={product.images?.[0]}
                        alt={locale === 'ar' ? product.nameAr : product.nameFr}
                        className="w-20 h-16 rounded-md object-cover shrink-0 bg-[#F2EFE9]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#17211C] truncate">
                          {locale === 'ar' ? product.nameAr : product.nameFr}
                        </p>
                        <p className="text-xs text-[#52615A] mt-0.5 tabular-nums">
                          {formatDzd(product.priceDzd, locale)} · {product.unit}
                        </p>
                        <div className="mt-2.5 flex items-center justify-between">
                          <div className="inline-flex items-center border border-[#D4CFC3] rounded-md">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateCartQty(product.id, quantity - 1)}
                              className="p-1.5 text-[#52615A] hover:text-[#17211C]"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2.5 text-xs font-semibold tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateCartQty(product.id, quantity + 1)}
                              className="p-1.5 text-[#52615A] hover:text-[#17211C]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button
                            type="button"
                            aria-label="Remove item"
                            onClick={() => removeFromCart(product.id)}
                            className="p-1.5 text-[#52615A] hover:text-[#B91C1C]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t border-[#E5E1D8] px-6 py-5 bg-[#FAF9F6] space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#52615A]">{t.cart.subtotal}</span>
                  <span className="font-semibold text-[#17211C] tabular-nums">
                    {formatDzd(cartSubtotal, locale)}
                  </span>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    setCartOpen(false);
                    navigate({ name: 'checkout' });
                  }}
                >
                  {t.cart.checkout}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
