import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { apiRequest, setAuthToken } from '../lib/api.ts';
import { firebaseAuth, googleAuthProvider } from '../lib/firebase.ts';
import { type Locale, messages } from '../i18n/messages.ts';

export type Role = 'CONSUMER' | 'PRODUCER' | 'AMBASSADOR' | 'ADMIN';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  locale: string;
  wilaya: string;
  address?: string;
  producerProfile?: {
    id: number;
    farmName: string;
    farmNameFr: string;
    storyAr: string;
    storyFr: string;
    wilaya: string;
    address: string;
    practices: string[];
    photos: string[];
    verificationStatus: string;
  } | null;
  ambassadorApplication?: {
    id: number;
    status: string;
    wilaya: string;
  } | null;
}

export interface ProductItem {
  id: number;
  producerId: number;
  nameAr: string;
  nameFr: string;
  descriptionAr: string;
  descriptionFr: string;
  category: string;
  priceDzd: number;
  unit: string;
  stock: number;
  season: string;
  images: string[];
  organicClaim: boolean;
  waterSavedPerUnit: number;
  co2SavedPerUnit: number;
  localKm: number;
  packaging: string;
  sustainabilityScore: number;
  status: string;
  harvestDate: string;
  producerName: string;
  producerNameFr: string;
  producerWilaya: string;
  hasActiveSpgBadge: boolean;
  avgRating: number;
  reviewCount: number;
  orderCount: number;
  passportEventsCount: number;
  passportComplete: boolean;
  aiScore?: number;
  aiReasonAr?: string;
  aiReasonFr?: string;
}

export interface CartItem {
  product: ProductItem;
  quantity: number;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type AppRoute =
  | { name: 'home' }
  | { name: 'catalog' }
  | { name: 'product'; id: number }
  | { name: 'passport'; id: number }
  | { name: 'producer'; id: number }
  | { name: 'producers' }
  | { name: 'how-it-works' }
  | { name: 'community' }
  | { name: 'info'; page: 'about' | 'contact' | 'faq' | 'privacy' | 'terms' }
  | { name: 'auth'; mode: 'login' | 'register' | 'forgot' }
  | { name: 'checkout' }
  | { name: 'dashboard'; tab?: string };

interface AppContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof messages)[Locale];
  user: UserProfile | null;
  authLoading: boolean;
  refreshUser: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<UserProfile>;
  registerAccount: (payload: Record<string, unknown>) => Promise<UserProfile>;
  loginWithGoogle: () => Promise<UserProfile>;
  logout: () => Promise<void>;
  route: AppRoute;
  navigate: (next: AppRoute) => void;
  cart: CartItem[];
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  addToCart: (product: ProductItem, qty?: number) => void;
  updateCartQty: (productId: number, qty: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
  toasts: ToastItem[];
  pushToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function readInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('athar_locale');
    if (stored === 'fr' || stored === 'ar') return stored;
  } catch {
    // ignore
  }
  return 'ar';
}

function readInitialCart(): CartItem[] {
  try {
    const raw = localStorage.getItem('athar_cart');
    if (raw) return JSON.parse(raw) as CartItem[];
  } catch {
    // ignore
  }
  return [];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [route, setRoute] = useState<AppRoute>({ name: 'home' });
  const [cart, setCart] = useState<CartItem[]>(readInitialCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 4200);
    },
    []
  );

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem('athar_locale', next);
      document.cookie = `athar_locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  }, [locale]);

  useEffect(() => {
    try {
      localStorage.setItem('athar_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await apiRequest<UserProfile>('/users/me');
      setUser(profile);
    } catch {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const navigate = useCallback((next: AppRoute) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string) => {
      const data = await apiRequest<{ token: string; user: UserProfile }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      setAuthToken(data.token);
      const fullProfile = await apiRequest<UserProfile>('/users/me');
      setUser(fullProfile);
      return fullProfile;
    },
    []
  );

  const registerAccount = useCallback(async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ token: string; user: UserProfile }>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    setAuthToken(data.token);
    const fullProfile = await apiRequest<UserProfile>('/users/me');
    setUser(fullProfile);
    return fullProfile;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const cred = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const idToken = await cred.user.getIdToken();
    setAuthToken(idToken);
    const fullProfile = await apiRequest<UserProfile>('/users/me');
    setUser(fullProfile);
    return fullProfile;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
      await firebaseSignOut(firebaseAuth).catch(() => {});
    } finally {
      setAuthToken(null);
      setUser(null);
      setRoute({ name: 'home' });
      pushToast(
        locale === 'ar' ? 'تم تسجيل الخروج بنجاح' : 'Déconnexion réussie',
        'info'
      );
    }
  }, [locale, pushToast]);

  const addToCart = useCallback(
    (product: ProductItem, qty = 1) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
              : i
          );
        }
        return [...prev, { product, quantity: Math.min(product.stock, qty) }];
      });
      pushToast(
        locale === 'ar'
          ? `تمت إضافة «${product.nameAr}» إلى السلة`
          : `« ${product.nameFr} » ajouté au panier`
      );
    },
    [locale, pushToast]
  );

  const updateCartQty = useCallback((productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(i.product.stock, qty) }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  return (
    <AppContext.Provider
      value={{
        locale,
        setLocale,
        t: messages[locale],
        user,
        authLoading,
        refreshUser,
        loginWithCredentials,
        registerAccount,
        loginWithGoogle,
        logout,
        route,
        navigate,
        cart,
        cartOpen,
        setCartOpen,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toasts,
        pushToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
