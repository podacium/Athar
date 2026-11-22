import React, { useCallback, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Check, Plus, Search, Trash2, X } from 'lucide-react';
import { type ProductItem, useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { formatDateTimeLocalized, formatDzd } from '../../i18n/messages.ts';
import {
  Button,
  ConfirmDialog,
  Input,
  Select,
  Textarea,
} from '../../components/ui/Primitives.tsx';

interface KpiResponse {
  kpis: {
    conversionRate: number;
    retention30d: number;
    spgBadgesGranted: number;
    completePassportsPct: number;
    producerSatisfactionPct: number;
    onTimeDeliveryRate: number;
    totalGmvDzd: number;
    totalUsers: number;
    totalProducers: number;
    totalProducts: number;
    totalOrders: number;
    openDisputes: number;
    pendingSpgReports: number;
  };
  charts: {
    byCategory: Array<{ category: string; products: number; avgScore: number }>;
    byOrderStatus: Array<{ status: string; count: number; revenue: number }>;
    bySpgStatus: Array<{ status: string; count: number }>;
  };
  auditLogs: Array<{
    id: number;
    action: string;
    entity: string;
    entityId: string;
    actorName: string;
    createdAt: string;
  }>;
}

const PIE_COLORS = ['#1B4D3E', '#4A7C59', '#B45309', '#94A3B8', '#B91C1C'];

export function AdminDashboard({ activeTab }: { activeTab: string }) {
  const { locale, t, pushToast } = useApp();

  const [kpiData, setKpiData] = useState<KpiResponse | null>(null);
  const [usersList, setUsersList] = useState<
    Array<{
      id: number;
      name: string;
      email: string;
      role: string;
      wilaya: string;
      active: boolean;
    }>
  >([]);
  const [userSearch, setUserSearch] = useState('');
  const [producersList, setProducersList] = useState<
    Array<{
      id: number;
      farmName: string;
      farmNameFr: string;
      wilaya: string;
      verificationStatus: string;
      productCount: number;
    }>
  >([]);
  const [allProducts, setAllProducts] = useState<ProductItem[]>([]);
  const [spgReports, setSpgReports] = useState<
    Array<{
      id: number;
      farmName: string;
      farmNameFr: string;
      ambassadorName: string;
      score: number;
      recommendation: string;
      notes: string;
      status: string;
      adminComment?: string;
    }>
  >([]);
  const [ambApps, setAmbApps] = useState<
    Array<{
      id: number;
      userName: string;
      userEmail: string;
      wilaya: string;
      motivation: string;
      status: string;
    }>
  >([]);
  const [allOrders, setAllOrders] = useState<
    Array<{
      id: number;
      consumerName: string;
      total: number;
      status: string;
      paymentMethod: string;
      wilaya: string;
    }>
  >([]);
  const [disputes, setDisputes] = useState<
    Array<{
      id: number;
      orderId: number;
      userName: string;
      reason: string;
      status: string;
      resolution?: string;
    }>
  >([]);
  const [blogPosts, setBlogPosts] = useState<
    Array<{ id: number; titleAr: string; titleFr: string; category: string; published: boolean }>
  >([]);

  const [reviewComments, setReviewComments] = useState<Record<number, string>>({});
  const [disputeResolutions, setDisputeResolutions] = useState<Record<number, string>>({});

  // CMS new article state
  const [blogTitleAr, setBlogTitleAr] = useState('');
  const [blogTitleFr, setBlogTitleFr] = useState('');
  const [blogBodyAr, setBlogBodyAr] = useState('');
  const [blogBodyFr, setBlogBodyFr] = useState('');
  const [blogCat, setBlogCat] = useState('sustainability');

  const [confirmDeactivate, setConfirmDeactivate] = useState<{
    id: number;
    active: boolean;
    name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [kpis, usrs, prods, prodItems, reps, apps, ords, disps, blogs] =
        await Promise.all([
          apiRequest<KpiResponse>('/admin/kpis'),
          apiRequest<{ users: typeof usersList }>('/users'),
          apiRequest<{ producers: typeof producersList }>('/producers'),
          apiRequest<{ products: ProductItem[] }>('/products?includeAll=true&pageSize=50'),
          apiRequest<{ reports: typeof spgReports }>('/spg/reports'),
          apiRequest<{ applications: typeof ambApps }>('/ambassadors/applications'),
          apiRequest<{ orders: typeof allOrders }>('/orders'),
          apiRequest<{ disputes: typeof disputes }>('/disputes'),
          apiRequest<{ posts: typeof blogPosts }>('/blog'),
        ]);
      setKpiData(kpis);
      setUsersList(usrs.users || []);
      setProducersList(prods.producers || []);
      setAllProducts(prodItems.products || []);
      setSpgReports(reps.reports || []);
      setAmbApps(apps.applications || []);
      setAllOrders(ords.orders || []);
      setDisputes(disps.disputes || []);
      setBlogPosts(blogs.posts || []);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading || !kpiData) {
    return <div className="h-72 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />;
  }

  // TAB: KPI ANALYTICS DASHBOARD (Recharts)
  if (activeTab === 'kpis') {
    const { kpis, charts } = kpiData;
    const metricCards = [
      {
        label: locale === 'ar' ? 'معدل التحويل' : 'Taux de conversion',
        value: `${kpis.conversionRate}%`,
      },
      {
        label: locale === 'ar' ? 'الاحتفاظ خلال 30 يوماً' : 'Rétention 30 jours',
        value: `${kpis.retention30d}%`,
      },
      {
        label: locale === 'ar' ? 'شارات SPG الممنوحة' : 'Badges SPG actifs',
        value: String(kpis.spgBadgesGranted),
      },
      {
        label: locale === 'ar' ? 'جوازات منتجات مكتملة' : 'Passeports complets',
        value: `${kpis.completePassportsPct}%`,
      },
      {
        label: locale === 'ar' ? 'رضا عن المنتجين' : 'Satisfaction producteurs',
        value: `${kpis.producerSatisfactionPct}%`,
      },
      {
        label: locale === 'ar' ? 'التسليم في الوقت المحدد' : 'Livraison à temps',
        value: `${kpis.onTimeDeliveryRate}%`,
      },
      {
        label: locale === 'ar' ? 'إجمالي حجم المبيعات (GMV)' : 'Volume total (GMV)',
        value: formatDzd(kpis.totalGmvDzd, locale),
      },
      {
        label: locale === 'ar' ? 'تقارير SPG قيد المراجعة' : 'Rapports SPG en attente',
        value: String(kpis.pendingSpgReports),
      },
    ];

    return (
      <div className="space-y-8">
        <div>
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.kpis}
          </h2>
          <p className="mt-1 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'بيانات حية من قاعدة بيانات PostgreSQL لمراقبة الثقة والاستدامة والنمو.'
              : 'Données temps réel issues de PostgreSQL sur la confiance, la durabilité et les ventes.'}
          </p>
        </div>

        {/* Clean Hairline KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-[#E5E1D8] rounded-lg divide-y lg:divide-y-0 divide-[#E5E1D8]">
          {metricCards.map((m) => (
            <div
              key={m.label}
              className="p-5 border-e border-b border-[#E5E1D8]/70 last:border-e-0"
            >
              <p className="text-xs text-[#52615A]">{m.label}</p>
              <p className="mt-1.5 font-mono text-2xl font-bold text-[#1B4D3E] tabular-nums">
                {m.value}
              </p>
            </div>
          ))}
        </div>

        {/* Recharts Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-[#E5E1D8] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#17211C] mb-4">
              {locale === 'ar'
                ? 'متوسط درجة الاستدامة والمنتجات حسب الفئة'
                : 'Produits & score durabilité moyen par catégorie'}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E1D8" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar
                    dataKey="avgScore"
                    name={locale === 'ar' ? 'درجة الاستدامة' : 'Score moyen'}
                    fill="#1B4D3E"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-[#E5E1D8] rounded-lg p-6">
            <h3 className="text-sm font-semibold text-[#17211C] mb-4">
              {locale === 'ar' ? 'توزيع حالات الطلبات' : 'Répartition des commandes'}
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.byOrderStatus.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    label
                  >
                    {charts.byOrderStatus
                      .filter((s) => s.count > 0)
                      .map((entry, idx) => (
                        <Cell
                          key={entry.status}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // TAB: USER MANAGEMENT
  if (activeTab === 'users') {
    const filtered = usersList.filter(
      (u) =>
        !userSearch.trim() ||
        u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearch.toLowerCase())
    );
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.users} ({filtered.length})
          </h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 text-[#7A8780] absolute top-1/2 -translate-y-1/2 start-3" />
            <Input
              className="ps-9 min-h-[38px]"
              placeholder={locale === 'ar' ? 'بحث...' : 'Rechercher...'}
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white border border-[#E5E1D8] rounded-lg overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-[#FAF9F6] border-b border-[#E5E1D8] text-xs text-[#52615A]">
              <tr>
                <th className="py-3 px-4 text-start">
                  {locale === 'ar' ? 'المستخدم' : 'Utilisateur'}
                </th>
                <th className="py-3 px-4 text-start">
                  {locale === 'ar' ? 'الولاية' : 'Wilaya'}
                </th>
                <th className="py-3 px-4 text-start">
                  {locale === 'ar' ? 'الدور' : 'Rôle'}
                </th>
                <th className="py-3 px-4 text-end">
                  {locale === 'ar' ? 'الحالة' : 'Statut'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2EFE9]">
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#17211C]">{u.name}</p>
                    <p className="text-xs font-mono text-[#52615A]">{u.email}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-[#52615A]">{u.wilaya}</td>
                  <td className="py-3 px-4">
                    <Select
                      aria-label={`Role for ${u.email}`}
                      value={u.role}
                      onChange={async (e) => {
                        await apiRequest(`/users/${u.id}/role`, {
                          method: 'PATCH',
                          body: JSON.stringify({ role: e.target.value }),
                        });
                        pushToast(locale === 'ar' ? 'تم تغيير الدور' : 'Rôle mis à jour');
                        loadAll();
                      }}
                      className="w-36 min-h-[34px] text-xs"
                    >
                      <option value="CONSUMER">CONSUMER</option>
                      <option value="PRODUCER">PRODUCER</option>
                      <option value="AMBASSADOR">AMBASSADOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </Select>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <Button
                      size="sm"
                      variant={u.active ? 'outline' : 'secondary'}
                      onClick={() =>
                        setConfirmDeactivate({
                          id: u.id,
                          active: !u.active,
                          name: u.name,
                        })
                      }
                    >
                      {u.active
                        ? locale === 'ar'
                          ? 'تعطيل'
                          : 'Désactiver'
                        : locale === 'ar'
                          ? 'تفعيل'
                          : 'Activer'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ConfirmDialog
          open={confirmDeactivate !== null}
          title={
            locale === 'ar' ? 'تأكيد تعديل حالة الحساب' : 'Confirmer le statut du compte'
          }
          description={`${confirmDeactivate?.name || ''}`}
          confirmLabel={locale === 'ar' ? 'تأكيد' : 'Confirmer'}
          cancelLabel={locale === 'ar' ? 'إلغاء' : 'Annuler'}
          danger={!confirmDeactivate?.active}
          onCancel={() => setConfirmDeactivate(null)}
          onConfirm={async () => {
            if (!confirmDeactivate) return;
            await apiRequest(`/users/${confirmDeactivate.id}/role`, {
              method: 'PATCH',
              body: JSON.stringify({ active: confirmDeactivate.active }),
            });
            setConfirmDeactivate(null);
            loadAll();
          }}
        />
      </div>
    );
  }

  // TAB: PRODUCERS & PRODUCT MODERATION
  if (activeTab === 'producers') {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {locale === 'ar' ? 'اعتماد المزارع والمنتجين' : 'Validation des producteurs'}
          </h2>
          <div className="bg-white border border-[#E5E1D8] rounded-lg divide-y divide-[#F2EFE9]">
            {producersList.map((farm) => (
              <div
                key={farm.id}
                className="p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <p className="font-semibold text-[#17211C]">
                    {locale === 'ar' ? farm.farmName : farm.farmNameFr || farm.farmName}
                  </p>
                  <p className="text-xs text-[#52615A]">
                    {farm.wilaya} · {farm.productCount}{' '}
                    {locale === 'ar' ? 'منتجات' : 'produits'} · {farm.verificationStatus}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      await apiRequest(`/producers/${farm.id}/approve`, {
                        method: 'POST',
                        body: JSON.stringify({ status: 'APPROVED' }),
                      });
                      pushToast(locale === 'ar' ? 'تم اعتماد المزرعة' : 'Ferme approuvée');
                      loadAll();
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'اعتماد' : 'Approuver'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      await apiRequest(`/producers/${farm.id}/approve`, {
                        method: 'POST',
                        body: JSON.stringify({ status: 'REJECTED' }),
                      });
                      loadAll();
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'رفض' : 'Rejeter'}</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-editorial text-xl text-[#17211C]">
            {locale === 'ar' ? 'إشراف ومراقبة المنتجات' : 'Modération des produits'}
          </h3>
          <div className="bg-white border border-[#E5E1D8] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E1D8] text-xs text-[#52615A]">
                <tr>
                  <th className="py-3 px-4 text-start">Produit</th>
                  <th className="py-3 px-4 text-end">DZD</th>
                  <th className="py-3 px-4 text-end">Score</th>
                  <th className="py-3 px-4 text-end">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {allProducts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 px-4">
                      {locale === 'ar' ? p.nameAr : p.nameFr}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums">
                      {formatDzd(p.priceDzd, locale)}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums">
                      {p.sustainabilityScore}/100
                    </td>
                    <td className="py-2.5 px-4 text-end">
                      <Select
                        value={p.status}
                        onChange={async (e) => {
                          await apiRequest(`/products/${p.id}`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: e.target.value }),
                          });
                          loadAll();
                        }}
                        className="w-36 min-h-[32px] text-xs inline-block"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MODERATED">MODERATED</option>
                        <option value="DRAFT">DRAFT</option>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // TAB: SPG REPORT REVIEW WORKFLOW
  if (activeTab === 'spgReview') {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {t.dashboard.tabs.spgReview} ({spgReports.length})
          </h2>
          <p className="mt-1 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'الموافقة على التقرير تحدث شارة SPG فوراً وتضيف كتلة SHA-256 جديدة إلى جوازات منتجات المزرعة.'
              : 'L’approbation met à jour le badge SPG et inscrit automatiquement un bloc SHA-256 dans les passeports produits.'}
          </p>
        </div>

        <div className="space-y-4">
          {spgReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-3"
            >
              <div className="flex flex-wrap justify-between gap-2 text-xs text-[#52615A]">
                <span className="font-semibold text-[#17211C]">
                  #{rep.id} ·{' '}
                  {locale === 'ar' ? rep.farmName : rep.farmNameFr || rep.farmName} ·{' '}
                  {rep.ambassadorName}
                </span>
                <span className="font-mono font-semibold text-[#1B4D3E]">
                  {rep.score}/100 · {rep.recommendation} · {rep.status}
                </span>
              </div>
              <p className="text-sm text-[#52615A] leading-relaxed">{rep.notes}</p>

              {rep.status === 'SUBMITTED' ? (
                <div className="pt-3 border-t border-[#F2EFE9] flex flex-wrap items-center gap-2">
                  <Input
                    className="flex-1 min-w-[200px]"
                    placeholder={
                      locale === 'ar' ? 'تعليق المراجعة الإدارية...' : 'Commentaire de décision...'
                    }
                    value={reviewComments[rep.id] || ''}
                    onChange={(e) =>
                      setReviewComments((prev) => ({
                        ...prev,
                        [rep.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await apiRequest(`/spg/reports/${rep.id}/review`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          decision: 'APPROVED',
                          adminComment:
                            reviewComments[rep.id] || 'Approved via Admin SPG Review',
                        }),
                      });
                      pushToast(
                        locale === 'ar'
                          ? 'تمت المصادقة وتحديث الشارات وجوازات المنتجات المشفرة'
                          : 'Rapport approuvé — Badge SPG & Passeports SHA-256 mis à jour'
                      );
                      loadAll();
                    }}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'مصادقة وتحديث الجواز' : 'Approuver'}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      await apiRequest(`/spg/reports/${rep.id}/review`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          decision: 'REJECTED',
                          adminComment: reviewComments[rep.id] || 'Rejected',
                        }),
                      });
                      loadAll();
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{locale === 'ar' ? 'رفض' : 'Rejeter'}</span>
                  </Button>
                </div>
              ) : (
                rep.adminComment && (
                  <p className="text-xs text-[#1B4D3E]">Admin: {rep.adminComment}</p>
                )
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB: AMBASSADOR APPLICATIONS
  if (activeTab === 'ambApps') {
    return (
      <div className="space-y-4">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.ambApps} ({ambApps.length})
        </h2>
        {ambApps.map((app) => (
          <div
            key={app.id}
            className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-2"
          >
            <div className="flex justify-between text-xs text-[#52615A]">
              <span className="font-semibold text-[#17211C]">
                {app.userName} ({app.userEmail}) · {app.wilaya}
              </span>
              <span className="font-semibold text-[#1B4D3E]">{app.status}</span>
            </div>
            <p className="text-sm text-[#52615A]">{app.motivation}</p>
            {app.status === 'PENDING' && (
              <div className="pt-2 flex gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    await apiRequest(`/ambassadors/applications/${app.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'APPROVED' }),
                    });
                    pushToast(
                      locale === 'ar'
                        ? 'تمت ترقية المستخدم إلى سفير SPG'
                        : 'Utilisateur promu Ambassadeur SPG'
                    );
                    loadAll();
                  }}
                >
                  {locale === 'ar' ? 'قبول وترقية' : 'Approuver'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    await apiRequest(`/ambassadors/applications/${app.id}`, {
                      method: 'PATCH',
                      body: JSON.stringify({ status: 'REJECTED' }),
                    });
                    loadAll();
                  }}
                >
                  {locale === 'ar' ? 'رفض' : 'Rejeter'}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  // TAB: ORDERS & DISPUTES RESOLUTION
  if (activeTab === 'adminDisputes') {
    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="font-editorial text-2xl text-[#17211C]">
            {locale === 'ar' ? 'إدارة النزاعات' : 'Résolution des litiges'} (
            {disputes.length})
          </h2>
          {disputes.map((d) => (
            <div
              key={d.id}
              className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-3"
            >
              <div className="flex justify-between text-xs text-[#52615A]">
                <span className="font-semibold text-[#17211C]">
                  Dispute #{d.id} · Order #{d.orderId} · {d.userName}
                </span>
                <span className="font-semibold text-[#B45309]">{d.status}</span>
              </div>
              <p className="text-sm text-[#52615A]">{d.reason}</p>
              {d.status === 'OPEN' ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Input
                    className="flex-1 min-w-[200px]"
                    placeholder={
                      locale === 'ar' ? 'تفاصيل قرار التسوية...' : 'Note de résolution...'
                    }
                    value={disputeResolutions[d.id] || ''}
                    onChange={(e) =>
                      setDisputeResolutions((prev) => ({
                        ...prev,
                        [d.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      await apiRequest(`/disputes/${d.id}/resolve`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          status: 'RESOLVED_REFUND',
                          resolution:
                            disputeResolutions[d.id] ||
                            'Remboursement intégral approuvé',
                        }),
                      });
                      pushToast(locale === 'ar' ? 'تم حل النزاع بالاسترجاع' : 'Litige résolu');
                      loadAll();
                    }}
                  >
                    {locale === 'ar' ? 'استرجاع' : 'Rembourser'}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={async () => {
                      await apiRequest(`/disputes/${d.id}/resolve`, {
                        method: 'PATCH',
                        body: JSON.stringify({
                          status: 'RESOLVED_REPLACEMENT',
                          resolution:
                            disputeResolutions[d.id] || 'Remplacement gratuit expédié',
                        }),
                      });
                      loadAll();
                    }}
                  >
                    {locale === 'ar' ? 'استبدال' : 'Remplacer'}
                  </Button>
                </div>
              ) : (
                d.resolution && (
                  <p className="text-xs text-[#1B4D3E]">{d.resolution}</p>
                )
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="font-editorial text-xl text-[#17211C]">
            {locale === 'ar' ? 'كل الطلبات' : 'Toutes les commandes'} ({allOrders.length})
          </h3>
          <div className="bg-white border border-[#E5E1D8] rounded-lg overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E1D8] text-xs text-[#52615A]">
                <tr>
                  <th className="py-3 px-4 text-start">#</th>
                  <th className="py-3 px-4 text-start">Client</th>
                  <th className="py-3 px-4 text-end">Total</th>
                  <th className="py-3 px-4 text-end">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE9]">
                {allOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="py-2.5 px-4 font-mono">#{o.id}</td>
                    <td className="py-2.5 px-4">
                      {o.consumerName} · {o.wilaya}
                    </td>
                    <td className="py-2.5 px-4 text-end font-mono tabular-nums">
                      {formatDzd(o.total, locale)}
                    </td>
                    <td className="py-2.5 px-4 text-end">
                      <Select
                        value={o.status}
                        onChange={async (e) => {
                          await apiRequest(`/orders/${o.id}/status`, {
                            method: 'PATCH',
                            body: JSON.stringify({ status: e.target.value }),
                          });
                          loadAll();
                        }}
                        className="w-36 min-h-[32px] text-xs inline-block"
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
                            {st}
                          </option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // TAB: CONTENT CMS
  if (activeTab === 'cms') {
    return (
      <div className="space-y-6">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.cms}
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await apiRequest('/blog', {
              method: 'POST',
              body: JSON.stringify({
                titleAr: blogTitleAr,
                titleFr: blogTitleFr,
                excerptAr: blogBodyAr.slice(0, 140),
                excerptFr: blogBodyFr.slice(0, 140),
                bodyAr: blogBodyAr,
                bodyFr: blogBodyFr,
                category: blogCat,
                published: true,
              }),
            });
            setBlogTitleAr('');
            setBlogTitleFr('');
            setBlogBodyAr('');
            setBlogBodyFr('');
            pushToast(locale === 'ar' ? 'تم نشر المقال' : 'Article publié');
            loadAll();
          }}
          className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-3"
        >
          <h3 className="text-sm font-semibold text-[#17211C] flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#1B4D3E]" />
            <span>{locale === 'ar' ? 'مقال أو وصفة جديدة' : 'Nouvel article'}</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              required
              placeholder="العنوان بالعربية"
              value={blogTitleAr}
              onChange={(e) => setBlogTitleAr(e.target.value)}
            />
            <Input
              required
              placeholder="Titre en français"
              value={blogTitleFr}
              onChange={(e) => setBlogTitleFr(e.target.value)}
            />
          </div>
          <Select value={blogCat} onChange={(e) => setBlogCat(e.target.value)}>
            <option value="sustainability">Sustainability</option>
            <option value="recipes">Recipes</option>
            <option value="spg_trust">SPG Trust</option>
          </Select>
          <Textarea
            rows={3}
            required
            placeholder="المحتوى بالعربية"
            value={blogBodyAr}
            onChange={(e) => setBlogBodyAr(e.target.value)}
          />
          <Textarea
            rows={3}
            required
            placeholder="Contenu en français"
            value={blogBodyFr}
            onChange={(e) => setBlogBodyFr(e.target.value)}
          />
          <Button type="submit">
            {locale === 'ar' ? 'نشر المقال' : "Publier l'article"}
          </Button>
        </form>

        <div className="bg-white border border-[#E5E1D8] rounded-lg divide-y divide-[#F2EFE9]">
          {blogPosts.map((p) => (
            <div key={p.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#17211C]">
                  {locale === 'ar' ? p.titleAr : p.titleFr}
                </p>
                <p className="text-xs text-[#52615A]">{p.category}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  await apiRequest(`/blog/${p.id}`, { method: 'DELETE' });
                  loadAll();
                }}
              >
                <Trash2 className="w-4 h-4 text-[#B91C1C]" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // TAB: AUDIT LOG
  return (
    <div className="space-y-4">
      <h2 className="font-editorial text-2xl text-[#17211C]">
        {t.dashboard.tabs.audit}
      </h2>
      <div className="bg-white border border-[#E5E1D8] rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-start">
          <thead className="bg-[#FAF9F6] border-b border-[#E5E1D8] text-xs text-[#52615A]">
            <tr>
              <th className="py-3 px-4 text-start">Action</th>
              <th className="py-3 px-4 text-start">Entity</th>
              <th className="py-3 px-4 text-start">Actor</th>
              <th className="py-3 px-4 text-end">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2EFE9]">
            {kpiData.auditLogs.map((log) => (
              <tr key={log.id}>
                <td className="py-2.5 px-4 font-mono text-xs text-[#1B4D3E]">
                  {log.action}
                </td>
                <td className="py-2.5 px-4 font-mono text-xs">
                  {log.entity} #{log.entityId}
                </td>
                <td className="py-2.5 px-4 text-xs text-[#52615A]">
                  {log.actorName}
                </td>
                <td className="py-2.5 px-4 text-end font-mono text-xs text-[#52615A] tabular-nums">
                  {formatDateTimeLocalized(log.createdAt, locale)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
