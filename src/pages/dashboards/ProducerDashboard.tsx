import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Printer,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { type ProductItem, useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import {
  ALGERIA_WILAYAS,
  PACKAGING_OPTIONS,
  PRODUCT_CATEGORIES,
  SEASONS,
} from '../../lib/algeria.ts';
import { formatDateLocalized, formatDzd } from '../../i18n/messages.ts';
import {
  Button,
  ConfirmDialog,
  Input,
  Select,
  Textarea,
} from '../../components/ui/Primitives.tsx';

interface ProducerAnalytics {
  salesDzd: number;
  ordersCount: number;
  waterSavedLiters: number;
  co2SavedKg: number;
  lowStockProducts: Array<{ id: number; nameAr: string; nameFr: string; stock: number }>;
  badges: Array<{ id: number; status: string; validUntil: string }>;
}

interface ProducerOrder {
  id: number;
  status: string;
  total: number;
  wilaya: string;
  address: string;
  consumerName: string;
  consumerPhone: string;
  trackingNumber: string;
  deliverySlot: string;
  createdAt: string;
  items: Array<{
    id: number;
    quantity: number;
    unitPrice: number;
    productNameAr: string;
    productNameFr: string;
  }>;
}

interface SpgReportItem {
  id: number;
  score: number;
  recommendation: string;
  notes: string;
  status: string;
  ambassadorName: string;
  adminComment?: string;
  producerResponse?: string;
  createdAt: string;
}

export function ProducerDashboard({ activeTab }: { activeTab: string }) {
  const { locale, t, user, refreshUser, navigate, pushToast } = useApp();

  const [myProducts, setMyProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<ProducerOrder[]>([]);
  const [reports, setReports] = useState<SpgReportItem[]>([]);
  const [analytics, setAnalytics] = useState<ProducerAnalytics | null>(null);
  const [packingOrder, setPackingOrder] = useState<ProducerOrder | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Farm profile form
  const [farmName, setFarmName] = useState(user?.producerProfile?.farmName || '');
  const [farmNameFr, setFarmNameFr] = useState(user?.producerProfile?.farmNameFr || '');
  const [storyAr, setStoryAr] = useState(user?.producerProfile?.storyAr || '');
  const [storyFr, setStoryFr] = useState(user?.producerProfile?.storyFr || '');
  const [farmWilaya, setFarmWilaya] = useState(
    user?.producerProfile?.wilaya || user?.wilaya || '09 - Blida'
  );
  const [farmAddress, setFarmAddress] = useState(user?.producerProfile?.address || '');
  const [practicesText, setPracticesText] = useState(
    (user?.producerProfile?.practices || []).join('\n')
  );

  // New Product form
  const [nameAr, setNameAr] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [descFr, setDescFr] = useState('');
  const [category, setCategory] = useState('vegetables');
  const [priceDzd, setPriceDzd] = useState('850');
  const [unit, setUnit] = useState('1 kg');
  const [stock, setStock] = useState('30');
  const [season, setSeason] = useState('AUTUMN');
  const [waterSaved, setWaterSaved] = useState('35');
  const [co2Saved, setCo2Saved] = useState('1.8');
  const [localKm, setLocalKm] = useState('30');
  const [packaging, setPackaging] = useState('recyclable_glass');

  // Producer response to SPG report
  const [responses, setResponses] = useState<Record<number, string>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const producerId = user?.producerProfile?.id;
      const [prodRes, ordRes, repRes, anaRes] = await Promise.all([
        producerId
          ? apiRequest<{ products: ProductItem[] }>(
              `/products?producerId=${producerId}&pageSize=50`
            )
          : Promise.resolve({ products: [] }),
        apiRequest<{ orders: ProducerOrder[] }>('/orders'),
        apiRequest<{ reports: SpgReportItem[] }>('/spg/reports'),
        apiRequest<ProducerAnalytics>('/producer/analytics'),
      ]);
      setMyProducts(prodRes.products || []);
      setOrders(ordRes.orders || []);
      setReports(repRes.reports || []);
      setAnalytics(anaRes);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user?.producerProfile?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/producers/me', {
        method: 'PUT',
        body: JSON.stringify({
          farmName,
          farmNameFr,
          storyAr,
          storyFr,
          wilaya: farmWilaya,
          address: farmAddress,
          practices: practicesText
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      await refreshUser();
      pushToast(
        locale === 'ar' ? 'تم حفظ ملف المزرعة بنجاح' : 'Profil de la ferme enregistré'
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          nameAr,
          nameFr,
          descriptionAr: descAr,
          descriptionFr: descFr,
          category,
          priceDzd: Number(priceDzd),
          unit,
          stock: Number(stock),
          season,
          organicClaim: true,
          waterSavedPerUnit: Number(waterSaved),
          co2SavedPerUnit: Number(co2Saved),
          localKm: Number(localKm),
          packaging,
        }),
      });
      setNameAr('');
      setNameFr('');
      setDescAr('');
      setDescFr('');
      pushToast(
        locale === 'ar'
          ? 'تم نشر المنتج وإنشاء جوازه الرقمي SHA-256'
          : 'Produit publié avec Passeport Numérique SHA-256'
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Failed to create product', 'error');
    }
  };

  const handleOrderStatus = async (orderId: number, status: string) => {
    try {
      await apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      pushToast(
        locale === 'ar'
          ? `تم تحديث حالة الطلب #${orderId} إلى ${status}`
          : `Commande #${orderId} passée à ${status}`
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Error', 'error');
    }
  };

  if (loading) {
    return <div className="h-64 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />;
  }

  // TAB: MY PRODUCTS & INVENTORY
  if (activeTab === 'myProducts') {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.myProducts} ({myProducts.length})
          </h2>
          {analytics && analytics.lowStockProducts.length > 0 && (
            <div className="inline-flex items-center gap-2 text-xs font-medium text-[#B45309]">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {locale === 'ar'
                  ? `${analytics.lowStockProducts.length} منتجات بمخزون منخفض`
                  : `${analytics.lowStockProducts.length} produit(s) en stock faible`}
              </span>
            </div>
          )}
        </div>

        {/* Add Product Form */}
        <form
          onSubmit={handleCreateProduct}
          className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
        >
          <h3 className="text-base font-semibold text-[#17211C] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#1B4D3E]" />
            <span>
              {locale === 'ar'
                ? 'إضافة منتج أخضر جديد (ثنائي اللغة)'
                : 'Ajouter un nouveau produit vert (bilingue)'}
            </span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              required
              placeholder={locale === 'ar' ? 'اسم المنتج بالعربية' : 'Nom en arabe'}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
            />
            <Input
              required
              placeholder={locale === 'ar' ? 'اسم المنتج بالفرنسية' : 'Nom en français'}
              value={nameFr}
              onChange={(e) => setNameFr(e.target.value)}
            />
            <Textarea
              rows={2}
              required
              placeholder={locale === 'ar' ? 'الوصف بالعربية' : 'Description en arabe'}
              value={descAr}
              onChange={(e) => setDescAr(e.target.value)}
            />
            <Textarea
              rows={2}
              required
              placeholder={locale === 'ar' ? 'الوصف بالفرنسية' : 'Description en français'}
              value={descFr}
              onChange={(e) => setDescFr(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {locale === 'ar' ? c.ar : c.fr}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              required
              min={50}
              placeholder="Prix DZD"
              value={priceDzd}
              onChange={(e) => setPriceDzd(e.target.value)}
            />
            <Input
              required
              placeholder="Unité (1 kg, 500 ml)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <Input
              type="number"
              required
              min={0}
              placeholder="Stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Select value={season} onChange={(e) => setSeason(e.target.value)}>
              {SEASONS.map((s) => (
                <option key={s.key} value={s.key}>
                  {locale === 'ar' ? s.ar : s.fr}
                </option>
              ))}
            </Select>
            <Select value={packaging} onChange={(e) => setPackaging(e.target.value)}>
              {PACKAGING_OPTIONS.map((p) => (
                <option key={p.key} value={p.key}>
                  {locale === 'ar' ? p.ar : p.fr}
                </option>
              ))}
            </Select>
            <Input
              type="number"
              step="0.5"
              value={waterSaved}
              onChange={(e) => setWaterSaved(e.target.value)}
              title="Water saved (L)"
              placeholder="Eau (L)"
            />
            <Input
              type="number"
              step="0.1"
              value={co2Saved}
              onChange={(e) => setCo2Saved(e.target.value)}
              title="CO2 saved (kg)"
              placeholder="CO2 (kg)"
            />
            <Input
              type="number"
              value={localKm}
              onChange={(e) => setLocalKm(e.target.value)}
              title="Local distance (km)"
              placeholder="Local km"
            />
          </div>

          <Button type="submit">
            {locale === 'ar'
              ? 'نشر المنتج وإنشاء جوازه الرقمي'
              : 'Publier le produit & créer le passeport'}
          </Button>
        </form>

        {/* Product Table */}
        <div className="bg-white border border-[#E5E1D8] rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="border-b border-[#E5E1D8] bg-[#FAF9F6] text-xs text-[#52615A]">
              <tr>
                <th className="py-3 px-4 text-start font-medium">
                  {locale === 'ar' ? 'المنتج' : 'Produit'}
                </th>
                <th className="py-3 px-4 text-end font-medium">
                  {locale === 'ar' ? 'السعر' : 'Prix'}
                </th>
                <th className="py-3 px-4 text-end font-medium">
                  {locale === 'ar' ? 'المخزون' : 'Stock'}
                </th>
                <th className="py-3 px-4 text-end font-medium">
                  {locale === 'ar' ? 'الاستدامة' : 'Score'}
                </th>
                <th className="py-3 px-4 text-end font-medium">
                  {locale === 'ar' ? 'إجراءات' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {myProducts.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAF9F6]/70">
                  <td className="py-3 px-4">
                    <button
                      type="button"
                      onClick={() => navigate({ name: 'product', id: p.id })}
                      className="font-medium text-[#17211C] hover:text-[#1B4D3E] text-start cursor-pointer"
                    >
                      {locale === 'ar' ? p.nameAr : p.nameFr}
                    </button>
                    <p className="text-xs text-[#52615A]">
                      {p.unit} · {p.status}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-end font-mono tabular-nums">
                    {formatDzd(p.priceDzd, locale)}
                  </td>
                  <td className="py-3 px-4 text-end font-mono tabular-nums">
                    <span
                      className={
                        p.stock <= 15 ? 'text-[#B45309] font-semibold' : ''
                      }
                    >
                      {p.stock}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiRequest(`/products/${p.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ stock: p.stock + 10 }),
                        });
                        loadData();
                      }}
                      className="ms-2 text-xs text-[#1B4D3E] hover:underline cursor-pointer"
                    >
                      +10
                    </button>
                  </td>
                  <td className="py-3 px-4 text-end font-mono tabular-nums">
                    {p.sustainabilityScore}/100
                  </td>
                  <td className="py-3 px-4 text-end">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate({ name: 'passport', id: p.id })}
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1B4D3E]" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTargetId(p.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#B91C1C]" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          open={deleteTargetId !== null}
          title={locale === 'ar' ? 'حذف المنتج؟' : 'Supprimer le produit ?'}
          description={
            locale === 'ar'
              ? 'سيتم حذف المنتج وجوازه المرتبط من السوق بشكل نهائي.'
              : 'Ce produit sera définitivement retiré du catalogue.'
          }
          confirmLabel={locale === 'ar' ? 'حذف نهائي' : 'Supprimer'}
          cancelLabel={locale === 'ar' ? 'إلغاء' : 'Annuler'}
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={async () => {
            if (!deleteTargetId) return;
            await apiRequest(`/products/${deleteTargetId}`, { method: 'DELETE' });
            setDeleteTargetId(null);
            pushToast(locale === 'ar' ? 'تم حذف المنتج' : 'Produit supprimé');
            loadData();
          }}
        />
      </div>
    );
  }

  // TAB: PRODUCER ORDERS
  if (activeTab === 'producerOrders') {
    return (
      <div className="space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.producerOrders} ({orders.length})
        </h2>

        {packingOrder && (
          <div className="bg-white border-2 border-[#1B4D3E] rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#17211C]">
                {locale === 'ar'
                  ? `وصل التغليف والشحن — طلب #${packingOrder.id}`
                  : `Bon de livraison — Commande #${packingOrder.id}`}
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPackingOrder(null)}
              >
                {locale === 'ar' ? 'إغلاق' : 'Fermer'}
              </Button>
            </div>
            <p className="text-xs font-mono text-[#52615A]">
              Tracking: {packingOrder.trackingNumber} · {packingOrder.consumerName} (
              {packingOrder.consumerPhone}) · {packingOrder.wilaya} —{' '}
              {packingOrder.address}
            </p>
            <ul className="text-sm divide-y divide-[#F2EFE9]">
              {packingOrder.items.map((it) => (
                <li key={it.id} className="py-1.5 flex justify-between">
                  <span>
                    {it.quantity} ×{' '}
                    {locale === 'ar' ? it.productNameAr : it.productNameFr}
                  </span>
                  <span className="font-mono tabular-nums">
                    {formatDzd(it.unitPrice * it.quantity, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-mono font-semibold">#{ord.id}</span>
                  <span className="mx-2 text-[#D4CFC3]">·</span>
                  <span className="font-medium text-[#17211C]">
                    {ord.consumerName}
                  </span>
                  <span className="mx-2 text-[#D4CFC3]">·</span>
                  <span className="text-xs text-[#52615A]">{ord.wilaya}</span>
                </div>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {formatDzd(ord.total, locale)}
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F2EFE9]">
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    aria-label="Order status"
                    value={ord.status}
                    onChange={(e) => handleOrderStatus(ord.id, e.target.value)}
                    className="w-44 min-h-[36px] text-xs"
                  >
                    {[
                      'PENDING',
                      'CONFIRMED',
                      'PREPARING',
                      'SHIPPED',
                      'DELIVERED',
                      'CANCELLED',
                    ].map((st) => (
                      <option key={st} value={st}>
                        {t.statuses[st as keyof typeof t.statuses] || st}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPackingOrder(ord)}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>
                    {locale === 'ar' ? 'وصل التغليف' : 'Bon de préparation'}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB: SPG REPORTS & BADGES
  if (activeTab === 'spgReports') {
    return (
      <div className="space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.spgReports}
        </h2>

        <div className="bg-white border border-[#E5E1D8] rounded-lg p-5">
          <h3 className="text-sm font-semibold text-[#17211C] mb-2">
            {locale === 'ar' ? 'شارات الضمان التشاركي النشطة' : 'Badges SPG actifs'}
          </h3>
          {analytics?.badges?.length ? (
            <div className="divide-y divide-[#F2EFE9] text-sm">
              {analytics.badges.map((b) => (
                <div key={b.id} className="py-2 flex justify-between">
                  <span className="font-semibold text-[#1B4D3E]">
                    SPG #{b.id} · {t.statuses[b.status as keyof typeof t.statuses] || b.status}
                  </span>
                  <span className="font-mono text-xs text-[#52615A]">
                    → {formatDateLocalized(b.validUntil, locale)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'لا توجد شارة نشطة حالياً.' : 'Aucun badge actif.'}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-3"
            >
              <div className="flex flex-wrap justify-between text-xs text-[#52615A]">
                <span className="font-semibold text-[#17211C]">
                  {rep.ambassadorName} · {rep.score}/100 · {rep.recommendation}
                </span>
                <span className="font-semibold text-[#1B4D3E]">
                  {t.statuses[rep.status as keyof typeof t.statuses] || rep.status}
                </span>
              </div>
              <p className="text-sm text-[#52615A]">{rep.notes}</p>
              {rep.adminComment && (
                <p className="text-xs text-[#1B4D3E]">
                  Admin: {rep.adminComment}
                </p>
              )}
              {rep.producerResponse ? (
                <p className="text-xs text-[#17211C] bg-[#FAF9F6] p-3 rounded">
                  {locale === 'ar' ? 'ردك المسجل:' : 'Votre réponse :'}{' '}
                  {rep.producerResponse}
                </p>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder={
                      locale === 'ar'
                        ? 'أضف ردك على تقرير السفير...'
                        : 'Répondre au rapport SPG...'
                    }
                    value={responses[rep.id] || ''}
                    onChange={(e) =>
                      setResponses((prev) => ({ ...prev, [rep.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      const txt = responses[rep.id];
                      if (!txt || txt.trim().length < 3) return;
                      await apiRequest(`/spg/reports/${rep.id}/respond`, {
                        method: 'PATCH',
                        body: JSON.stringify({ response: txt }),
                      });
                      pushToast(locale === 'ar' ? 'تم حفظ الرد' : 'Réponse enregistrée');
                      loadData();
                    }}
                  >
                    {locale === 'ar' ? 'إرسال' : 'Envoyer'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB: SALES & IMPACT ANALYTICS
  if (activeTab === 'analytics' && analytics) {
    return (
      <div className="space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.analytics}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 bg-white border border-[#E5E1D8] rounded-lg divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-[#E5E1D8]">
          <div className="p-5">
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'إجمالي المبيعات' : 'Ventes totales'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#1B4D3E] tabular-nums">
              {formatDzd(analytics.salesDzd, locale)}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'عدد الطلبات' : 'Commandes'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#17211C] tabular-nums">
              {analytics.ordersCount}
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'المياه الموفّرة' : 'Eau économisée'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#17211C] tabular-nums">
              {analytics.waterSavedLiters} L
            </p>
          </div>
          <div className="p-5">
            <p className="text-xs text-[#52615A]">
              {locale === 'ar' ? 'CO2 المتفادى' : 'CO2 évité'}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-[#17211C] tabular-nums">
              {analytics.co2SavedKg} kg
            </p>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT TAB: FARM PROFILE CRUD
  return (
    <form
      onSubmit={handleSaveFarm}
      className="max-w-2xl bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.farm}
        </h2>
        <span className="text-xs font-semibold text-[#1B4D3E]">
          {user?.producerProfile?.verificationStatus || 'PENDING'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#52615A] mb-1">
            {t.auth.farmName}
          </label>
          <Input
            required
            value={farmName}
            onChange={(e) => setFarmName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-[#52615A] mb-1">
            {t.auth.farmNameFr}
          </label>
          <Input
            value={farmNameFr}
            onChange={(e) => setFarmNameFr(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#52615A] mb-1">
            {t.auth.wilaya}
          </label>
          <Select
            value={farmWilaya}
            onChange={(e) => setFarmWilaya(e.target.value)}
          >
            {ALGERIA_WILAYAS.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs text-[#52615A] mb-1">
            {t.cart.address}
          </label>
          <Input
            value={farmAddress}
            onChange={(e) => setFarmAddress(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#52615A] mb-1">
          {locale === 'ar' ? 'قصة المزرعة (عربي)' : 'Histoire de la ferme (AR)'}
        </label>
        <Textarea
          rows={3}
          value={storyAr}
          onChange={(e) => setStoryAr(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs text-[#52615A] mb-1">
          {locale === 'ar' ? 'قصة المزرعة (فرنسي)' : 'Histoire de la ferme (FR)'}
        </label>
        <Textarea
          rows={3}
          value={storyFr}
          onChange={(e) => setStoryFr(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-xs text-[#52615A] mb-1">
          {locale === 'ar'
            ? 'الممارسات الزراعية (سطر لكل ممارسة)'
            : 'Pratiques écologiques (une par ligne)'}
        </label>
        <Textarea
          rows={4}
          value={practicesText}
          onChange={(e) => setPracticesText(e.target.value)}
        />
      </div>

      <Button type="submit">
        {locale === 'ar' ? 'حفظ ملف المزرعة' : 'Enregistrer le profil ferme'}
      </Button>
    </form>
  );
}
