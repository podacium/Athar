import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { GENERATED_IMAGES } from '../lib/algeria.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Button, SafeImage } from '../components/ui/Primitives.tsx';

interface ProducerSummary {
  id: number;
  farmName: string;
  farmNameFr: string;
  storyAr: string;
  storyFr: string;
  wilaya: string;
  photos: string[];
  activeBadges: Array<{ id: number; validUntil: string }>;
  productCount: number;
}

export function HomePage() {
  const { locale, t, navigate } = useApp();
  const [recommended, setRecommended] = useState<ProductItem[]>([]);
  const [producers, setProducers] = useState<ProducerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      apiRequest<{ recommendations: ProductItem[] }>('/recommendations?limit=6'),
      apiRequest<{ producers: ProducerSummary[] }>('/producers'),
    ])
      .then(([recData, prodData]) => {
        if (!mounted) return;
        setRecommended(recData.recommendations || []);
        setProducers((prodData.producers || []).slice(0, 2));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err.message || 'Failed to load marketplace data');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      {/* 1. Balanced 2-Column Editorial Hero */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-10 pb-14 lg:pt-14 lg:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-sm font-medium text-[#4A7C59]">{t.hero.kicker}</p>
            <h1 className="mt-3 font-editorial text-3xl sm:text-4xl lg:text-[2.85rem] leading-[1.15] text-[#17211C] max-w-2xl">
              {t.hero.title}
            </h1>
            <p className="mt-5 text-base text-[#52615A] leading-relaxed max-w-xl">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate({ name: 'catalog' })}>
                <span>{t.hero.ctaPrimary}</span>
                <ArrowIcon className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate({ name: 'how-it-works' })}
              >
                {t.hero.ctaSecondary}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[300px] lg:min-h-[420px] rounded-lg overflow-hidden border border-[#E5E1D8] bg-[#F2EFE9]">
              <SafeImage
                src={GENERATED_IMAGES.heroFarm}
                alt={t.hero.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-6 text-white">
                <p className="text-xs font-medium text-white/85">
                  {locale === 'ar'
                    ? 'البليدة · المتيجة · زيارة سفير SPG موثّقة جغرافياً'
                    : 'Blida · Mitidja · Ferme auditée par ambassadeur SPG'}
                </p>
                <p className="mt-1 text-sm font-semibold">
                  {locale === 'ar'
                    ? 'مزرعة بساتين المتيجة البيئية — درجة التحقق 96/100'
                    : 'Vergers de la Mitidja — Indice de vérification 96/100'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Proof Strip Below Split */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 border-y border-[#E5E1D8] divide-y lg:divide-y-0 lg:divide-x rtl:lg:divide-x-reverse divide-[#E5E1D8]">
          {[
            { value: '100%', label: t.hero.stat1Label },
            { value: 'SHA-256', label: t.hero.stat2Label },
            { value: '< 50 km', label: t.hero.stat3Label },
            { value: 'DZD', label: t.hero.stat4Label },
          ].map((stat) => (
            <div key={stat.label} className="py-5 px-4 sm:px-6">
              <p className="font-mono text-xl sm:text-2xl font-semibold text-[#1B4D3E] tabular-nums">
                {stat.value}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-[#52615A]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Featured Seasonal & AI-Assisted Recommendations */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E5E1D8]">
          <div>
            <p className="text-xs font-medium text-[#4A7C59]">{t.sections.aiLabel}</p>
            <h2 className="mt-1.5 font-editorial text-2xl sm:text-3xl text-[#17211C]">
              {t.sections.featuredTitle}
            </h2>
            <p className="mt-2 text-sm text-[#52615A] max-w-2xl">
              {t.sections.featuredSub}
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate({ name: 'catalog' })}>
            <span>{t.sections.viewAll}</span>
            <ArrowIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {error && (
          <div className="mt-6 rounded-md border border-[#B91C1C]/30 bg-white p-4 text-sm text-[#991B1B]">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-lg border border-[#E5E1D8] bg-[#F2EFE9]/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 3. How SPG & Digital Product Passport Work */}
      <section className="mt-10 border-y border-[#E5E1D8] bg-white py-16">
        <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5">
              <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#E5E1D8] bg-[#F2EFE9]">
                <SafeImage
                  src={GENERATED_IMAGES.spgVisit}
                  alt={t.sections.spgTitle}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-7">
              <h2 className="font-editorial text-2xl sm:text-3xl text-[#17211C]">
                {t.sections.spgTitle}
              </h2>
              <p className="mt-2 text-sm text-[#52615A] max-w-xl">{t.sections.spgSub}</p>

              <div className="mt-8 divide-y divide-[#E5E1D8]">
                {[
                  {
                    num: t.sections.pillar1Num,
                    title: t.sections.pillar1Title,
                    desc: t.sections.pillar1Desc,
                  },
                  {
                    num: t.sections.pillar2Num,
                    title: t.sections.pillar2Title,
                    desc: t.sections.pillar2Desc,
                  },
                  {
                    num: t.sections.pillar3Num,
                    title: t.sections.pillar3Title,
                    desc: t.sections.pillar3Desc,
                  },
                ].map((pillar) => (
                  <div key={pillar.num} className="py-5 flex gap-5">
                    <span className="font-mono text-sm font-semibold text-[#1B4D3E] tabular-nums shrink-0 pt-0.5">
                      {pillar.num}.
                    </span>
                    <div>
                      <h3 className="text-base font-semibold text-[#17211C]">
                        {pillar.title}
                      </h3>
                      <p className="mt-1 text-sm text-[#52615A] leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Producer Stories & Closing CTA */}
      <section className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#17211C]">
              {t.sections.producersTitle}
            </h2>
            <p className="mt-1.5 text-sm text-[#52615A]">{t.sections.producersSub}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate({ name: 'producers' })}>
            <span>{t.nav.producers}</span>
            <ArrowIcon className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {producers.map((farm) => (
            <div
              key={farm.id}
              className="flex flex-col sm:flex-row bg-white border border-[#E5E1D8] rounded-lg overflow-hidden"
            >
              <div className="sm:w-48 aspect-[4/3] sm:aspect-auto shrink-0 bg-[#F2EFE9]">
                <SafeImage
                  src={farm.photos?.[0] || GENERATED_IMAGES.heroFarm}
                  alt={locale === 'ar' ? farm.farmName : farm.farmNameFr}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center gap-2 text-xs text-[#52615A]">
                  <span>{farm.wilaya}</span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[#1B4D3E] font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.catalog.spgVerified}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold text-[#17211C]">
                  {locale === 'ar' ? farm.farmName : farm.farmNameFr || farm.farmName}
                </h3>
                <p className="mt-2 text-sm text-[#52615A] line-clamp-3 leading-relaxed">
                  {locale === 'ar' ? farm.storyAr : farm.storyFr}
                </p>
                <div className="mt-auto pt-4">
                  <button
                    type="button"
                    onClick={() => navigate({ name: 'producer', id: farm.id })}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1B4D3E] hover:underline cursor-pointer"
                  >
                    <span>{t.sections.viewFarm}</span>
                    <ArrowIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Clean Action Band */}
        <div className="mt-16 rounded-lg bg-[#1B4D3E] text-white p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h2 className="font-editorial text-2xl sm:text-3xl text-white">
              {t.sections.ctaBandTitle}
            </h2>
            <p className="mt-2 text-sm text-white/80 max-w-2xl">
              {t.sections.ctaBandSub}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate({ name: 'auth', mode: 'register' })}
            >
              {t.sections.ctaJoinConsumer}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/40 text-white hover:bg-white/10"
              onClick={() => navigate({ name: 'auth', mode: 'register' })}
            >
              {t.sections.ctaJoinProducer}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
