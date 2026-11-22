import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Droplets,
  Leaf,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { formatDateLocalized, formatDzd } from '../i18n/messages.ts';
import { PACKAGING_OPTIONS } from '../lib/algeria.ts';
import { Button, SafeImage, Select, Textarea } from '../components/ui/Primitives.tsx';

interface ProductDetailPayload {
  product: ProductItem;
  producer: {
    id: number;
    farmName: string;
    farmNameFr: string;
    wilaya: string;
    storyAr: string;
    storyFr: string;
    practices: string[];
  };
  scoreBreakdown: {
    total: number;
    waterScore: number;
    carbonScore: number;
    localityScore: number;
    packagingScore: number;
    trustScore: number;
  };
  passportEventsCount: number;
  reviews: Array<{
    id: number;
    rating: number;
    comment: string;
    authorName: string;
    authorWilaya: string;
    createdAt: string;
  }>;
}

export function ProductDetailPage({ productId }: { productId: number }) {
  const { locale, t, user, navigate, addToCart, pushToast } = useApp();
  const [data, setData] = useState<ProductDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  // Review state (only available for delivered orders)
  const [deliveredOrderIds, setDeliveredOrderIds] = useState<number[]>([]);
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  const loadDetail = () => {
    setLoading(true);
    apiRequest<ProductDetailPayload>(`/products/${productId}`)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Product not found'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDetail();
  }, [productId]);

  useEffect(() => {
    if (!user) return;
    apiRequest<{ orders: Array<{ id: number; status: string; items: Array<{ productId: number }> }> }>(
      '/orders'
    )
      .then((res) => {
        const eligible = (res.orders || [])
          .filter(
            (o) =>
              o.status === 'DELIVERED' &&
              o.items.some((i) => i.productId === productId)
          )
          .map((o) => o.id);
        setDeliveredOrderIds(eligible);
        if (eligible.length > 0) setReviewOrderId(String(eligible[0]));
      })
      .catch(() => {});
  }, [user, productId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewOrderId) return;
    setSubmittingReview(true);
    try {
      await apiRequest('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          productId,
          orderId: Number(reviewOrderId),
          rating: Number(reviewRating),
          comment: reviewComment,
        }),
      });
      setReviewComment('');
      pushToast(
        locale === 'ar' ? 'تم نشر تقييمك بنجاح' : 'Votre avis a été publié'
      );
      loadDetail();
    } catch (err: unknown) {
      pushToast(
        err instanceof Error ? err.message : 'Failed to post review',
        'error'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-sm text-[#991B1B]">{error || 'Product not found'}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate({ name: 'catalog' })}
        >
          {t.product.backToCatalog}
        </Button>
      </div>
    );
  }

  const { product, producer, scoreBreakdown, reviews } = data;
  const title = locale === 'ar' ? product.nameAr : product.nameFr;
  const desc = locale === 'ar' ? product.descriptionAr : product.descriptionFr;
  const pkgLabel = PACKAGING_OPTIONS.find((p) => p.key === product.packaging);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-8">
      <button
        type="button"
        onClick={() => navigate({ name: 'catalog' })}
        className="inline-flex items-center gap-1.5 text-sm text-[#52615A] hover:text-[#17211C] mb-6 cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        <span>{t.product.backToCatalog}</span>
      </button>

      {/* Main Contiguous PDP Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Product Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#E5E1D8] bg-[#F2EFE9]">
            <SafeImage
              src={product.images?.[0]}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Impact Metrics Strip */}
          <div className="mt-4 grid grid-cols-3 border border-[#E5E1D8] rounded-lg bg-white divide-x rtl:divide-x-reverse divide-[#E5E1D8]">
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#52615A]">
                <Droplets className="w-3.5 h-3.5 text-[#1B4D3E]" aria-hidden="true" />
                <span>{t.product.waterSaved}</span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-[#17211C] tabular-nums">
                {product.waterSavedPerUnit} L
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#52615A]">
                <Leaf className="w-3.5 h-3.5 text-[#1B4D3E]" aria-hidden="true" />
                <span>{t.product.co2Saved}</span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-[#17211C] tabular-nums">
                {product.co2SavedPerUnit} kg
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-xs text-[#52615A]">
                <MapPin className="w-3.5 h-3.5 text-[#1B4D3E]" aria-hidden="true" />
                <span>{t.product.localDistance}</span>
              </div>
              <p className="mt-1 font-mono text-lg font-semibold text-[#17211C] tabular-nums">
                {product.localKm} km
              </p>
            </div>
          </div>
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-6 bg-white border border-[#E5E1D8] rounded-lg p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#52615A]">
            <span>{product.producerWilaya}</span>
            <span aria-hidden="true">·</span>
            <span
              className={
                product.hasActiveSpgBadge
                  ? 'font-semibold text-[#1B4D3E]'
                  : 'text-[#52615A]'
              }
            >
              {product.hasActiveSpgBadge
                ? t.catalog.spgVerified
                : t.catalog.selfDeclared}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-[#17211C]">
              {t.catalog.sustainabilityScore}: {product.sustainabilityScore}/100
            </span>
          </div>

          <h1 className="mt-3 font-editorial text-2xl sm:text-3xl text-[#17211C]">
            {title}
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="font-mono text-2xl font-bold text-[#1B4D3E] tabular-nums">
              {formatDzd(product.priceDzd, locale)}
            </span>
            <span className="text-sm text-[#52615A]">/ {product.unit}</span>
            <span className="text-xs text-[#52615A] ms-auto tabular-nums">
              {product.stock > 0
                ? `${t.catalog.inStock} (${product.stock})`
                : t.catalog.outOfStock}
            </span>
          </div>

          <p className="mt-5 text-sm text-[#52615A] leading-relaxed">{desc}</p>

          {/* Key Metadata Table */}
          <dl className="mt-6 divide-y divide-[#F2EFE9] border-y border-[#E5E1D8] text-sm">
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#52615A]">{t.product.producer}</dt>
              <dd>
                <button
                  type="button"
                  onClick={() => navigate({ name: 'producer', id: producer.id })}
                  className="font-medium text-[#1B4D3E] hover:underline cursor-pointer"
                >
                  {locale === 'ar'
                    ? producer.farmName
                    : producer.farmNameFr || producer.farmName}
                </button>
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#52615A]">{t.product.harvestDate}</dt>
              <dd className="font-mono tabular-nums text-[#17211C]">
                {product.harvestDate}
              </dd>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <dt className="text-[#52615A]">{t.product.packaging}</dt>
              <dd className="text-[#17211C]">
                {pkgLabel ? (locale === 'ar' ? pkgLabel.ar : pkgLabel.fr) : product.packaging}
              </dd>
            </div>
          </dl>

          {/* Quantity & Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center border border-[#D4CFC3] rounded-md h-11">
              <button
                type="button"
                aria-label="Decrease"
                onClick={() => setQty((v) => Math.max(1, v - 1))}
                className="px-3 text-[#52615A] hover:text-[#17211C]"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold tabular-nums">{qty}</span>
              <button
                type="button"
                aria-label="Increase"
                onClick={() => setQty((v) => Math.min(product.stock || 1, v + 1))}
                className="px-3 text-[#52615A] hover:text-[#17211C]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <Button
              size="lg"
              className="flex-1"
              disabled={product.stock <= 0}
              onClick={() => addToCart(product, qty)}
            >
              <ShoppingBag className="w-4 h-4" aria-hidden="true" />
              <span>{t.catalog.addToCart}</span>
            </Button>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full mt-3"
            onClick={() => navigate({ name: 'passport', id: product.id })}
          >
            <ShieldCheck className="w-4 h-4 text-[#1B4D3E]" aria-hidden="true" />
            <span>
              {t.catalog.viewPassport} ({data.passportEventsCount})
            </span>
          </Button>

          {/* Sustainability Score Breakdown */}
          <div className="mt-8 pt-6 border-t border-[#E5E1D8]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[#17211C]">
                {t.product.scoreBreakdown}
              </h2>
              <span className="font-mono text-sm font-bold text-[#1B4D3E] tabular-nums">
                {scoreBreakdown.total}/100
              </span>
            </div>
            <div className="space-y-3">
              {[
                { label: t.product.waterMetric, val: scoreBreakdown.waterScore, max: 25 },
                { label: t.product.carbonMetric, val: scoreBreakdown.carbonScore, max: 25 },
                { label: t.product.localityMetric, val: scoreBreakdown.localityScore, max: 20 },
                { label: t.product.packagingMetric, val: scoreBreakdown.packagingScore, max: 15 },
                { label: t.product.trustMetric, val: scoreBreakdown.trustScore, max: 15 },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-xs text-[#52615A] mb-1">
                    <span>{bar.label}</span>
                    <span className="font-mono tabular-nums">
                      {bar.val}/{bar.max}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F2EFE9] overflow-hidden">
                    <div
                      className="h-full bg-[#1B4D3E] rounded-full"
                      style={{ width: `${Math.round((bar.val / bar.max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verified Reviews Section */}
      <section className="mt-14 pt-10 border-t border-[#E5E1D8]">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.product.reviewsTitle} ({reviews.length})
        </h2>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-[#52615A]">{t.product.noReviews}</p>
            ) : (
              reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-[#E5E1D8] rounded-lg p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-medium text-[#17211C]">
                      {r.authorName}
                      {r.authorWilaya ? (
                        <span className="text-xs font-normal text-[#52615A] ms-2">
                          · {r.authorWilaya}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-0.5 text-[#B45309]">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5 fill-current"
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm text-[#52615A] leading-relaxed">
                    {r.comment}
                  </p>
                  <p className="mt-2 text-xs text-[#7A8780]">
                    {formatDateLocalized(r.createdAt, locale)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-5">
            {deliveredOrderIds.length > 0 ? (
              <form
                onSubmit={handleReviewSubmit}
                className="bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
              >
                <h3 className="text-base font-semibold text-[#17211C]">
                  {t.product.writeReview}
                </h3>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {locale === 'ar' ? 'الطلب المسلّم' : 'Commande livrée'}
                  </label>
                  <Select
                    value={reviewOrderId}
                    onChange={(e) => setReviewOrderId(e.target.value)}
                  >
                    {deliveredOrderIds.map((oid) => (
                      <option key={oid} value={oid}>
                        #{oid}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {locale === 'ar' ? 'التقييم' : 'Note'}
                  </label>
                  <Select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                  >
                    <option value="5">5 / 5</option>
                    <option value="4">4 / 5</option>
                    <option value="3">3 / 5</option>
                    <option value="2">2 / 5</option>
                    <option value="1">1 / 5</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#52615A] mb-1">
                    {locale === 'ar' ? 'تعليقك' : 'Votre commentaire'}
                  </label>
                  <Textarea
                    rows={3}
                    required
                    minLength={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={submittingReview}>
                  {t.product.submitReview}
                </Button>
              </form>
            ) : (
              <div className="bg-[#F2EFE9]/70 border border-[#E5E1D8] rounded-lg p-6 text-sm text-[#52615A]">
                {locale === 'ar'
                  ? 'لحماية مصداقية التقييمات، لا يُسمح بنشر تقييم إلا للمستهلكين الذين استلموا طلباً يحتوي على هذا المنتج.'
                  : 'Pour garantir des avis authentiques, seuls les acheteurs ayant reçu une commande livrée contenant ce produit peuvent publier un avis.'}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
