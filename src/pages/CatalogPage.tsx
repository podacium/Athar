import React, { useCallback, useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { ALGERIA_WILAYAS, PRODUCT_CATEGORIES, SEASONS } from '../lib/algeria.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Button, Input, Select } from '../components/ui/Primitives.tsx';

export function CatalogPage() {
  const { locale, t } = useApp();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('ALL');
  const [wilaya, setWilaya] = useState('ALL');
  const [season, setSeason] = useState('ALL');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minScore, setMinScore] = useState('0');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('trust');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set('q', q.trim());
      if (category !== 'ALL') params.set('category', category);
      if (wilaya !== 'ALL') params.set('wilaya', wilaya);
      if (season !== 'ALL') params.set('season', season);
      if (verifiedOnly) params.set('verified', 'true');
      if (Number(minScore) > 0) params.set('minScore', minScore);
      if (Number(maxPrice) > 0) params.set('maxPrice', maxPrice);
      params.set('sort', sort);
      params.set('page', String(page));
      params.set('pageSize', '9');

      const data = await apiRequest<{
        products: ProductItem[];
        pagination: { total: number; totalPages: number; page: number };
      }>(`/products?${params.toString()}`);

      setProducts(data.products || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  }, [q, category, wilaya, season, verifiedOnly, minScore, maxPrice, sort, page]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const resetFilters = () => {
    setQ('');
    setCategory('ALL');
    setWilaya('ALL');
    setSeason('ALL');
    setVerifiedOnly(false);
    setMinScore('0');
    setMaxPrice('');
    setSort('trust');
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-[#E5E1D8]">
        <h1 className="font-editorial text-3xl text-[#17211C]">{t.catalog.title}</h1>
        <p className="mt-1.5 text-sm text-[#52615A]">{t.catalog.subtitle}</p>
      </div>

      {/* Filter Bar */}
      <div className="mt-6 bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 relative">
            <Search
              className="w-4 h-4 text-[#7A8780] absolute top-1/2 -translate-y-1/2 start-3.5"
              aria-hidden="true"
            />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t.catalog.searchPlaceholder}
              className="ps-10"
              aria-label={t.catalog.searchPlaceholder}
            />
          </div>

          <div className="md:col-span-2">
            <Select
              aria-label={t.catalog.allCategories}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">{t.catalog.allCategories}</option>
              {PRODUCT_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {locale === 'ar' ? c.ar : c.fr}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <Select
              aria-label={t.catalog.allWilayas}
              value={wilaya}
              onChange={(e) => {
                setWilaya(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">{t.catalog.allWilayas}</option>
              {ALGERIA_WILAYAS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select
              aria-label={t.catalog.sortBy}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="trust">{t.catalog.sortTrust}</option>
              <option value="price_asc">{t.catalog.sortPriceAsc}</option>
              <option value="price_desc">{t.catalog.sortPriceDesc}</option>
              <option value="newest">{t.catalog.sortNewest}</option>
            </Select>
          </div>
        </div>

        <div className="pt-3 border-t border-[#F2EFE9] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#52615A]" aria-hidden="true" />
              <Select
                aria-label={t.catalog.allSeasons}
                value={season}
                onChange={(e) => {
                  setSeason(e.target.value);
                  setPage(1);
                }}
                className="w-36 min-h-[36px] text-xs"
              >
                <option value="ALL">{t.catalog.allSeasons}</option>
                {SEASONS.filter((s) => s.key !== 'ALL').map((s) => (
                  <option key={s.key} value={s.key}>
                    {locale === 'ar' ? s.ar : s.fr}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              aria-label={t.catalog.minScore}
              value={minScore}
              onChange={(e) => {
                setMinScore(e.target.value);
                setPage(1);
              }}
              className="w-44 min-h-[36px] text-xs"
            >
              <option value="0">{t.catalog.minScore}: 0+</option>
              <option value="70">{t.catalog.minScore}: 70+</option>
              <option value="85">{t.catalog.minScore}: 85+</option>
              <option value="90">{t.catalog.minScore}: 90+</option>
            </Select>

            <Input
              type="number"
              min={0}
              step={100}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPage(1);
              }}
              placeholder={t.catalog.maxPrice}
              className="w-36 min-h-[36px] text-xs"
            />

            <label className="inline-flex items-center gap-2 text-xs font-medium text-[#17211C] cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => {
                  setVerifiedOnly(e.target.checked);
                  setPage(1);
                }}
                className="w-4 h-4 accent-[#1B4D3E]"
              />
              <span>{t.catalog.spgOnly}</span>
            </label>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#52615A]">
            <span className="tabular-nums">
              {total} {locale === 'ar' ? 'منتج' : 'produits'}
            </span>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              {t.catalog.resetFilters}
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-md border border-[#B91C1C]/30 bg-white p-4 text-sm text-[#991B1B]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-80 rounded-lg border border-[#E5E1D8] bg-[#F2EFE9]/60 animate-pulse"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-lg border border-[#E5E1D8] bg-white p-12 text-center">
          <p className="text-sm text-[#52615A]">{t.catalog.noResults}</p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            {t.catalog.resetFilters}
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t.catalog.prev}
              </Button>
              <span className="text-sm text-[#52615A] tabular-nums">
                {t.catalog.page} {page} {t.catalog.of} {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t.catalog.next}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
