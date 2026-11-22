import React, { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Bell,
  CheckCircle2,
  Droplets,
  Leaf,
  Package,
  ShoppingBasket,
  Trash2,
  TreePine,
  Truck,
} from 'lucide-react';
import { type ProductItem, useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { ALGERIA_WILAYAS, DELIVERY_SLOTS } from '../../lib/algeria.ts';
import {
  formatDateLocalized,
  formatDateTimeLocalized,
  formatDzd,
} from '../../i18n/messages.ts';
import {
  Button,
  Input,
  Select,
  Textarea,
} from '../../components/ui/Primitives.tsx';

interface OrderRecord {
  id: number;
  status: string;
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  deliveryType: string;
  wilaya: string;
  address: string;
  deliverySlot: string;
  trackingNumber: string;
  logisticsPartner: string;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    productNameAr: string;
    productNameFr: string;
  }>;
  tracking: {
    partner: string;
    steps: Array<{
      code: string;
      labelAr: string;
      labelFr: string;
      location: string;
      timestamp: string;
      completed: boolean;
    }>;
  };
}

interface BasketRecord {
  id: number;
  name: string;
  recurrence: string;
  deliverySlot: string;
  deliveryType: string;
  items: Array<{ productId: number; quantity: number }>;
  createdAt: string;
}

interface LoyaltyData {
  balance: number;
  totalEarned: number;
  impactSummary: { waterSavedLiters: number; co2SavedKg: number };
  transactions: Array<{
    id: number;
    amount: number;
    type: 'EARN' | 'REDEEM';
    reason: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
  leaderboard: Array<{
    userId: number;
    name: string;
    wilaya: string;
    points: number;
  }>;
}

interface DisputeRecord {
  id: number;
  orderId: number;
  reason: string;
  status: string;
  resolution?: string;
  createdAt: string;
}

interface NotificationRecord {
  id: number;
  titleAr: string;
  titleFr: string;
  bodyAr: string;
  bodyFr: string;
  read: boolean;
  createdAt: string;
}

export function ConsumerDashboard({ activeTab }: { activeTab: string }) {
  const {
    locale,
    setLocale,
    t,
    user,
    refreshUser,
    navigate,
    addToCart,
    pushToast,
  } = useApp();

  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [baskets, setBaskets] = useState<BasketRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<ProductItem[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyData | null>(null);
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Basket builder state
  const [basketName, setBasketName] = useState('');
  const [basketRecurrence, setBasketRecurrence] = useState<'WEEKLY' | 'BIWEEKLY'>('WEEKLY');
  const [basketSlot, setBasketSlot] = useState<string>(DELIVERY_SLOTS[0]);
  const [basketSelection, setBasketSelection] = useState<Record<number, number>>({});

  // Dispute form state
  const [disputeOrderId, setDisputeOrderId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // Ambassador app state
  const [ambWilaya, setAmbWilaya] = useState(user?.wilaya || '16 - Alger');
  const [ambMotivation, setAmbMotivation] = useState('');
  const [ambExp, setAmbExp] = useState('');

  // Profile state
  const [profName, setProfName] = useState(user?.name || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profWilaya, setProfWilaya] = useState(user?.wilaya || '16 - Alger');
  const [profAddress, setProfAddress] = useState(user?.address || '');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordRes, bskRes, prodRes, loyRes, dispRes, notifRes] =
        await Promise.all([
          apiRequest<{ orders: OrderRecord[] }>('/orders'),
          apiRequest<{ baskets: BasketRecord[] }>('/baskets'),
          apiRequest<{ products: ProductItem[] }>('/products?pageSize=20'),
          apiRequest<LoyaltyData>('/loyalty/me'),
          apiRequest<{ disputes: DisputeRecord[] }>('/disputes'),
          apiRequest<{ notifications: NotificationRecord[] }>('/notifications'),
        ]);
      setOrders(ordRes.orders || []);
      setBaskets(bskRes.baskets || []);
      setCatalogProducts(prodRes.products || []);
      setLoyalty(loyRes);
      setDisputes(dispRes.disputes || []);
      setNotifications(notifRes.notifications || []);
      if (ordRes.orders?.length && !disputeOrderId) {
        setDisputeOrderId(String(ordRes.orders[0].id));
      }
    } catch {
      // handled per section
    } finally {
      setLoading(false);
    }
  }, [disputeOrderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateBasket = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.entries(basketSelection)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ productId: Number(id), quantity: qty }));
    if (items.length === 0) {
      pushToast(
        locale === 'ar'
          ? 'اختر منتجاً واحداً على الأقل للسلة المرنة'
          : 'Sélectionnez au moins un produit pour votre panier',
        'error'
      );
      return;
    }
    try {
      await apiRequest('/baskets', {
        method: 'POST',
        body: JSON.stringify({
          name:
            basketName.trim() ||
            (locale === 'ar' ? 'سلتي الأسبوعية' : 'Mon panier hebdomadaire'),
          recurrence: basketRecurrence,
          deliverySlot: basketSlot,
          deliveryType: 'HOME_DELIVERY',
          items,
        }),
      });
      setBasketName('');
      setBasketSelection({});
      pushToast(
        locale === 'ar' ? 'تم حفظ السلة المرنة بنجاح' : 'Panier flexible enregistré'
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleRedeem = async (rewardType: 'DISCOUNT_500' | 'PLANT_TREE') => {
    try {
      const res = await apiRequest<{ code: string }>('/loyalty/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardType }),
      });
      pushToast(
        locale === 'ar'
          ? `تم الاستبدال بنجاح! الرمز: ${res.code}`
          : `Échange validé ! Code : ${res.code}`
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Redemption failed', 'error');
    }
  };

  const handleOpenDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrderId) return;
    try {
      await apiRequest('/disputes', {
        method: 'POST',
        body: JSON.stringify({
          orderId: Number(disputeOrderId),
          reason: disputeReason,
        }),
      });
      setDisputeReason('');
      pushToast(
        locale === 'ar'
          ? 'تم فتح النزاع وإحالته للمراجعة'
          : 'Litige ouvert et transmis à l’équipe Athar'
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleApplyAmbassador = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/ambassadors/apply', {
        method: 'POST',
        body: JSON.stringify({
          wilaya: ambWilaya,
          motivation: ambMotivation,
          experience: ambExp,
        }),
      });
      setAmbMotivation('');
      setAmbExp('');
      await refreshUser();
      pushToast(
        locale === 'ar'
          ? 'تم إرسال طلبك لتصبح سفيراً للضمان التشاركي SPG'
          : 'Votre candidature Ambassadeur SPG a été envoyée'
      );
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profName,
          phone: profPhone,
          wilaya: profWilaya,
          address: profAddress,
          locale,
        }),
      });
      await refreshUser();
      pushToast(locale === 'ar' ? 'تم تحديث ملفك الشخصي' : 'Profil mis à jour');
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  if (loading) {
    return <div className="h-64 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />;
  }

  // TAB: ORDERS & LIVE TRACKING
  if (activeTab === 'orders') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.orders}
          </h2>
          <Button size="sm" onClick={() => navigate({ name: 'catalog' })}>
            {t.cart.browse}
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-[#E5E1D8] rounded-lg p-10 text-center text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'لم تقم بأي طلب بعد. تصفح السوق الموثّق لبدء أول طلب أخضر.'
              : 'Aucune commande pour le moment. Explorez le marché vérifié.'}
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-[#E5E1D8] rounded-lg p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F2EFE9]">
                  <div className="text-sm">
                    <span className="font-mono font-semibold text-[#17211C]">
                      #{order.id}
                    </span>
                    <span className="mx-2 text-[#D4CFC3]">·</span>
                    <span className="font-semibold text-[#1B4D3E]">
                      {t.statuses[order.status as keyof typeof t.statuses] ||
                        order.status}
                    </span>
                    <span className="mx-2 text-[#D4CFC3]">·</span>
                    <span className="text-xs text-[#52615A]">
                      {formatDateLocalized(order.createdAt, locale)}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-semibold tabular-nums">
                    {formatDzd(order.total, locale)} ({order.paymentMethod})
                  </div>
                </div>

                {/* Items */}
                <ul className="py-3 divide-y divide-[#F2EFE9] text-sm">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="py-2 flex items-center justify-between gap-2"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          navigate({ name: 'product', id: item.productId })
                        }
                        className="text-start hover:text-[#1B4D3E] hover:underline cursor-pointer"
                      >
                        {item.quantity} ×{' '}
                        {locale === 'ar' ? item.productNameAr : item.productNameFr}
                      </button>
                      <span className="font-mono text-xs text-[#52615A] tabular-nums">
                        {formatDzd(item.unitPrice * item.quantity, locale)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Live Logistics Tracking Timeline */}
                <div className="mt-3 pt-4 border-t border-[#E5E1D8]">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52615A] mb-3">
                    <span className="inline-flex items-center gap-1.5 font-medium text-[#17211C]">
                      <Truck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                      {order.logisticsPartner} · {order.trackingNumber}
                    </span>
                    <span>
                      {order.wilaya} · {order.deliverySlot}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                    {order.tracking?.steps.map((step) => (
                      <div
                        key={step.code}
                        className={`p-2.5 rounded border text-xs ${
                          step.completed
                            ? 'border-[#1B4D3E]/30 bg-[#1B4D3E]/5 text-[#17211C]'
                            : 'border-[#E5E1D8] bg-[#FAF9F6] text-[#7A8780]'
                        }`}
                      >
                        <p className="font-medium leading-snug">
                          {locale === 'ar' ? step.labelAr : step.labelFr}
                        </p>
                        <p className="mt-1 text-[11px] opacity-80">{step.location}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TAB: FLEXIBLE WEEKLY BASKET
  if (activeTab === 'basket') {
    const prodMap = new Map(catalogProducts.map((p) => [p.id, p]));
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.basket}
          </h2>
          <p className="mt-1 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'خصص سلتك الأسبوعية من المنتجات الموسمية واختر فترة التوصيل المتكررة.'
              : 'Composez votre panier hebdomadaire sur mesure avec créneau de livraison récurrent.'}
          </p>
        </div>

        {baskets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {baskets.map((b) => (
              <div
                key={b.id}
                className="bg-white border border-[#E5E1D8] rounded-lg p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-[#17211C]">{b.name}</h3>
                    <p className="text-xs text-[#52615A] mt-0.5">
                      {b.recurrence} · {b.deliverySlot}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete basket"
                    onClick={async () => {
                      await apiRequest(`/baskets/${b.id}`, { method: 'DELETE' });
                      loadData();
                    }}
                    className="p-1.5 text-[#52615A] hover:text-[#B91C1C]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-[#52615A]">
                  {b.items.map((it) => {
                    const p = prodMap.get(it.productId);
                    return (
                      <li key={it.productId}>
                        · {it.quantity} ×{' '}
                        {p ? (locale === 'ar' ? p.nameAr : p.nameFr) : `#${it.productId}`}
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto pt-4">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      b.items.forEach((it) => {
                        const p = prodMap.get(it.productId);
                        if (p) addToCart(p, it.quantity);
                      });
                      navigate({ name: 'checkout' });
                    }}
                  >
                    <ShoppingBasket className="w-3.5 h-3.5" />
                    <span>
                      {locale === 'ar'
                        ? 'طلب هذه السلة الآن'
                        : 'Commander ce panier'}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleCreateBasket}
          className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-[#17211C]">
            {locale === 'ar'
              ? 'إنشاء سلة أسبوعية جديدة'
              : 'Créer un nouveau panier flexible'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder={
                locale === 'ar' ? 'اسم السلة (مثلاً سلة العائلة)' : 'Nom du panier'
              }
              value={basketName}
              onChange={(e) => setBasketName(e.target.value)}
            />
            <Select
              value={basketRecurrence}
              onChange={(e) =>
                setBasketRecurrence(e.target.value as 'WEEKLY' | 'BIWEEKLY')
              }
            >
              <option value="WEEKLY">
                {locale === 'ar' ? 'أسبوعي' : 'Hebdomadaire'}
              </option>
              <option value="BIWEEKLY">
                {locale === 'ar' ? 'كل أسبوعين' : 'Bimensuel'}
              </option>
            </Select>
            <Select
              value={basketSlot}
              onChange={(e) => setBasketSlot(e.target.value)}
            >
              {DELIVERY_SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pt-2">
            {catalogProducts.slice(0, 8).map((p) => {
              const current = basketSelection[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 border border-[#E5E1D8] rounded-md px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[#17211C] truncate">
                      {locale === 'ar' ? p.nameAr : p.nameFr}
                    </p>
                    <p className="text-[#52615A] font-mono tabular-nums">
                      {formatDzd(p.priceDzd, locale)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setBasketSelection((prev) => ({
                          ...prev,
                          [p.id]: Math.max(0, (prev[p.id] || 0) - 1),
                        }))
                      }
                      className="w-7 h-7 rounded border border-[#D4CFC3] text-[#17211C]"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono tabular-nums">
                      {current}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setBasketSelection((prev) => ({
                          ...prev,
                          [p.id]: (prev[p.id] || 0) + 1,
                        }))
                      }
                      className="w-7 h-7 rounded border border-[#D4CFC3] text-[#17211C]"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <Button type="submit">
            {locale === 'ar' ? 'حفظ السلة الأسبوعية' : 'Enregistrer mon panier'}
          </Button>
        </form>
      </div>
    );
  }

  // TAB: ATHAROUK LOYALTY WALLET
  if (activeTab === 'loyalty' && loyalty) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.loyalty}
          </h2>
          <p className="mt-1 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'حول أثرك البيئي المقاس إلى خصومات أو أشجار مغروسة في الجزائر.'
              : 'Transformez votre impact écologique mesuré en remises ou en arbres plantés.'}
          </p>
        </div>

        {/* Summary Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-[#E5E1D8] rounded-lg divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-[#E5E1D8]">
          <div className="p-5">
            <p className="text-xs text-[#52615A] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#1B4D3E]" />
              {locale === 'ar' ? 'رصيد نقاط أثرك المتاح' : 'Solde Athar disponible'}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-[#1B4D3E] tabular-nums">
              {loyalty.balance}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#52615A] flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-[#1B4D3E]" />
              {locale === 'ar' ? 'المياه التي وفّرتها' : 'Eau économisée'}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-[#17211C] tabular-nums">
              {loyalty.impactSummary.waterSavedLiters} L
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#52615A] flex items-center gap-1.5">
              <Leaf className="w-4 h-4 text-[#1B4D3E]" />
              {locale === 'ar' ? 'انبعاثات CO2 المتفاداة' : 'CO2 évité'}
            </p>
            <p className="mt-1 font-mono text-3xl font-bold text-[#17211C] tabular-nums">
              {loyalty.impactSummary.co2SavedKg} kg
            </p>
          </div>
        </div>

        {/* Redeem Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E5E1D8] rounded-lg p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17211C]">
                {locale === 'ar'
                  ? 'غرس شجرة زيتون في الجزائر (شهادة رقمية)'
                  : 'Planter un olivier en Algérie (Certificat)'}
              </h3>
              <p className="text-xs text-[#52615A] mt-1 font-mono">50 Athar</p>
            </div>
            <Button
              size="sm"
              disabled={loyalty.balance < 50}
              onClick={() => handleRedeem('PLANT_TREE')}
            >
              <TreePine className="w-4 h-4" />
              <span>{locale === 'ar' ? 'استبدال' : 'Échanger'}</span>
            </Button>
          </div>

          <div className="bg-white border border-[#E5E1D8] rounded-lg p-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17211C]">
                {locale === 'ar'
                  ? 'قسيمة خصم 500 دج على طلبك القادم'
                  : 'Code promo de 500 DZD'}
              </h3>
              <p className="text-xs text-[#52615A] mt-1 font-mono">100 Athar</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              disabled={loyalty.balance < 100}
              onClick={() => handleRedeem('DISCOUNT_500')}
            >
              {locale === 'ar' ? 'استبدال' : 'Échanger'}
            </Button>
          </div>
        </div>

        {/* History + Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-[#E5E1D8] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#17211C] mb-4">
              {locale === 'ar' ? 'سجل معاملات أثرك' : 'Historique des transactions'}
            </h3>
            <div className="divide-y divide-[#F2EFE9] text-sm">
              {loyalty.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[#17211C]">{tx.reason}</p>
                    <p className="text-xs text-[#7A8780]">
                      {formatDateTimeLocalized(tx.createdAt, locale)}
                    </p>
                  </div>
                  <span
                    className={`font-mono font-semibold tabular-nums shrink-0 ${
                      tx.type === 'EARN' ? 'text-[#1B4D3E]' : 'text-[#B45309]'
                    }`}
                  >
                    {tx.type === 'EARN' ? '+' : '-'}
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-[#E5E1D8] rounded-lg p-5">
            <h3 className="text-sm font-semibold text-[#17211C] mb-4">
              {locale === 'ar' ? 'لوحة رواد الأثر الأخضر' : 'Classement Impact Atharouk'}
            </h3>
            <ol className="divide-y divide-[#F2EFE9] text-sm">
              {loyalty.leaderboard.map((row, idx) => (
                <li
                  key={row.userId}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-xs text-[#52615A] me-2">
                      #{idx + 1}
                    </span>
                    <span className="font-medium text-[#17211C] truncate">
                      {row.name}
                    </span>
                    <p className="text-xs text-[#7A8780]">{row.wilaya}</p>
                  </div>
                  <span className="font-mono font-semibold text-[#1B4D3E] tabular-nums">
                    {row.points}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // TAB: DISPUTES
  if (activeTab === 'disputes') {
    return (
      <div className="space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.disputes}
        </h2>

        <form
          onSubmit={handleOpenDispute}
          className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-[#17211C]">
            {locale === 'ar' ? 'فتح نزاع جديد على طلب' : 'Ouvrir un litige sur une commande'}
          </h3>
          {orders.length === 0 ? (
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'لا توجد طلبات متاحة.' : 'Aucune commande disponible.'}
            </p>
          ) : (
            <>
              <div>
                <label className="block text-xs text-[#52615A] mb-1">
                  {locale === 'ar' ? 'اختر الطلب' : 'Commande concernée'}
                </label>
                <Select
                  value={disputeOrderId}
                  onChange={(e) => setDisputeOrderId(e.target.value)}
                >
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} — {formatDzd(o.total, locale)} ({o.status})
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-xs text-[#52615A] mb-1">
                  {locale === 'ar' ? 'سبب النزاع وتفاصيله' : 'Motif et détails'}
                </label>
                <Textarea
                  rows={3}
                  required
                  minLength={8}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
              </div>
              <Button type="submit">
                {locale === 'ar' ? 'إرسال النزاع مع دليل مصوّر' : 'Soumettre le litige'}
              </Button>
            </>
          )}
        </form>

        <div className="space-y-3">
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-[#E5E1D8] rounded-lg p-5"
            >
              <div className="flex justify-between text-xs text-[#52615A]">
                <span className="font-mono font-semibold text-[#17211C]">
                  #{d.id} · Order #{d.orderId}
                </span>
                <span className="font-semibold text-[#1B4D3E]">
                  {t.statuses[d.status as keyof typeof t.statuses] || d.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[#17211C]">{d.reason}</p>
              {d.resolution && (
                <p className="mt-2 text-xs text-[#1B4D3E]">
                  {locale === 'ar' ? 'القرار:' : 'Résolution :'} {d.resolution}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB: NOTIFICATIONS
  if (activeTab === 'notifications') {
    return (
      <div className="space-y-4">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.notifications}
        </h2>
        {notifications.length === 0 ? (
          <p className="text-sm text-[#52615A]">
            {locale === 'ar' ? 'لا توجد إشعارات.' : 'Aucune notification.'}
          </p>
        ) : (
          <div className="divide-y divide-[#E5E1D8] bg-white border border-[#E5E1D8] rounded-lg">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-5 flex items-start justify-between gap-4 ${
                  n.read ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#17211C] flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#1B4D3E]" />
                    <span>{locale === 'ar' ? n.titleAr : n.titleFr}</span>
                  </p>
                  <p className="mt-1 text-sm text-[#52615A]">
                    {locale === 'ar' ? n.bodyAr : n.bodyFr}
                  </p>
                  <p className="mt-1 text-xs text-[#7A8780]">
                    {formatDateTimeLocalized(n.createdAt, locale)}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await apiRequest(`/notifications/${n.id}/read`, {
                        method: 'PATCH',
                      });
                      loadData();
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'تمت القراءة' : 'Lu'}</span>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TAB: BECOME SPG AMBASSADOR
  if (activeTab === 'becomeAmbassador') {
    return (
      <div className="max-w-2xl space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.becomeAmbassador}
        </h2>
        {user?.ambassadorApplication ? (
          <div className="bg-white border border-[#E5E1D8] rounded-lg p-6 text-sm">
            <p className="font-semibold text-[#17211C]">
              {locale === 'ar' ? 'حالة طلبك الحالي:' : 'Statut de votre candidature :'}{' '}
              <span className="text-[#1B4D3E]">
                {t.statuses[
                  user.ambassadorApplication.status as keyof typeof t.statuses
                ] || user.ambassadorApplication.status}
              </span>
            </p>
            <p className="mt-2 text-[#52615A]">
              {locale === 'ar' ? 'الولاية:' : 'Wilaya :'}{' '}
              {user.ambassadorApplication.wilaya}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleApplyAmbassador}
            className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {locale === 'ar' ? 'الولاية التي ستغطيها' : 'Wilaya couverte'}
              </label>
              <Select
                value={ambWilaya}
                onChange={(e) => setAmbWilaya(e.target.value)}
              >
                {ALGERIA_WILAYAS.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {locale === 'ar'
                  ? 'لماذا ترغب في أن تصبح سفيراً للضمان التشاركي SPG؟'
                  : 'Motivation pour devenir Ambassadeur SPG'}
              </label>
              <Textarea
                rows={4}
                required
                minLength={10}
                value={ambMotivation}
                onChange={(e) => setAmbMotivation(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#52615A] mb-1">
                {locale === 'ar'
                  ? 'خبرتك في الزراعة أو الاستهلاك المستدام'
                  : 'Expérience agricole ou associative'}
              </label>
              <Input
                value={ambExp}
                onChange={(e) => setAmbExp(e.target.value)}
              />
            </div>
            <Button type="submit">
              {locale === 'ar' ? 'إرسال طلب الترشح' : 'Envoyer ma candidature'}
            </Button>
          </form>
        )}
      </div>
    );
  }

  // DEFAULT TAB: PROFILE
  return (
    <form
      onSubmit={handleSaveProfile}
      className="max-w-xl bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
    >
      <h2 className="font-editorial text-2xl text-[#17211C]">
        {t.dashboard.tabs.profile}
      </h2>
      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {t.auth.name}
        </label>
        <Input value={profName} onChange={(e) => setProfName(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {t.auth.phone}
        </label>
        <Input value={profPhone} onChange={(e) => setProfPhone(e.target.value)} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {t.auth.wilaya}
        </label>
        <Select
          value={profWilaya}
          onChange={(e) => setProfWilaya(e.target.value)}
        >
          {ALGERIA_WILAYAS.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {t.cart.address}
        </label>
        <Input
          value={profAddress}
          onChange={(e) => setProfAddress(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {locale === 'ar' ? 'اللغة المفضلة' : 'Langue préférée'}
        </label>
        <Select
          value={locale}
          onChange={(e) => setLocale(e.target.value as 'ar' | 'fr')}
        >
          <option value="ar">العربية (RTL)</option>
          <option value="fr">Français (LTR)</option>
        </Select>
      </div>
      <Button type="submit">
        <Package className="w-4 h-4" />
        <span>{locale === 'ar' ? 'حفظ التغييرات' : 'Enregistrer'}</span>
      </Button>
    </form>
  );
}
