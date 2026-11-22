import React, { useEffect, useState } from 'react';
import { Compass, MapPin, ShieldCheck } from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { GENERATED_IMAGES } from '../lib/algeria.ts';
import { formatDateLocalized } from '../i18n/messages.ts';
import { ProductCard } from '../components/ProductCard.tsx';
import { Button, SafeImage } from '../components/ui/Primitives.tsx';

interface ProducerListItem {
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
  activeBadges: Array<{ id: number; validUntil: string }>;
  productCount: number;
}

export function ProducersDirectoryPage() {
  const { locale, t, navigate } = useApp();
  const [producers, setProducers] = useState<ProducerListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ producers: ProducerListItem[] }>('/producers')
      .then((res) => setProducers(res.producers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-[#E5E1D8]">
        <h1 className="font-editorial text-3xl text-[#17211C]">
          {t.sections.producersTitle}
        </h1>
        <p className="mt-1.5 text-sm text-[#52615A]">{t.sections.producersSub}</p>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-72 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {producers.map((farm) => (
            <article
              key={farm.id}
              className="bg-white border border-[#E5E1D8] rounded-lg overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/9] bg-[#F2EFE9] overflow-hidden">
                <SafeImage
                  src={farm.photos?.[0] || GENERATED_IMAGES.heroFarm}
                  alt={locale === 'ar' ? farm.farmName : farm.farmNameFr}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#52615A]">
                  <span>{farm.wilaya}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#1B4D3E]">
                    {farm.activeBadges?.length > 0
                      ? t.catalog.spgVerified
                      : t.statuses[farm.verificationStatus as keyof typeof t.statuses] ||
                        farm.verificationStatus}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">
                    {farm.productCount} {locale === 'ar' ? 'منتجات' : 'produits'}
                  </span>
                </div>
                <h2 className="mt-2 font-editorial text-xl text-[#17211C]">
                  {locale === 'ar' ? farm.farmName : farm.farmNameFr || farm.farmName}
                </h2>
                <p className="mt-2 text-sm text-[#52615A] leading-relaxed">
                  {locale === 'ar' ? farm.storyAr : farm.storyFr}
                </p>
                <div className="mt-5 pt-4 border-t border-[#F2EFE9] flex items-center justify-between">
                  <span className="text-xs text-[#52615A] truncate max-w-[65%]">
                    {(farm.practices || []).slice(0, 2).join(' · ')}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate({ name: 'producer', id: farm.id })}
                  >
                    {t.sections.viewFarm}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProducerProfilePage({ producerId }: { producerId: number }) {
  const { locale, t } = useApp();
  const [data, setData] = useState<{
    producer: ProducerListItem;
    badges: Array<{ id: number; status: string; validUntil: string }>;
    products: ProductItem[];
    approvedReports: Array<{
      id: number;
      score: number;
      notes: string;
      submittedAt: string;
      gpsLat: number;
      gpsLng: number;
    }>;
  } | null>(null);
  const [panoramicAngle, setPanoramicAngle] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest<typeof data>(`/producers/${producerId}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [producerId]);

  if (loading || !data) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-12">
        <div className="h-80 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
      </div>
    );
  }

  const { producer, badges, products, approvedReports } = data;
  const activeBadge = badges.find(
    (b) => b.status === 'ACTIVE' && new Date(b.validUntil) > new Date()
  );

  return (
    <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Farm Header & Interactive 360° Panoramic Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-white border border-[#E5E1D8] rounded-lg overflow-hidden">
        <div className="lg:col-span-6 relative min-h-[300px] bg-[#F2EFE9] overflow-hidden">
          <img
            src={producer.photos?.[0] || GENERATED_IMAGES.heroFarm}
            alt={locale === 'ar' ? producer.farmName : producer.farmNameFr}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-all duration-200"
            style={{ objectPosition: `${panoramicAngle}% 50%` }}
          />
          <div className="absolute inset-x-4 bottom-4 rounded-md bg-black/65 backdrop-blur-sm px-4 py-3 text-white flex items-center gap-3">
            <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-xs whitespace-nowrap">
              {locale === 'ar' ? 'جولة 360° بالمزرعة' : 'Vue 360° de la ferme'}
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={panoramicAngle}
              onChange={(e) => setPanoramicAngle(Number(e.target.value))}
              aria-label="360 farm panoramic view"
              className="flex-1 accent-white"
            />
          </div>
        </div>

        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#52615A]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#1B4D3E]" aria-hidden="true" />
              {producer.wilaya}
            </span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[#1B4D3E]">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              {activeBadge ? t.catalog.spgVerified : producer.verificationStatus}
            </span>
            {activeBadge && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {locale === 'ar' ? 'صالحة حتى' : 'Valide jusqu’au'}{' '}
                  {formatDateLocalized(activeBadge.validUntil, locale)}
                </span>
              </>
            )}
          </div>

          <h1 className="mt-3 font-editorial text-2xl sm:text-3xl text-[#17211C]">
            {locale === 'ar'
              ? producer.farmName
              : producer.farmNameFr || producer.farmName}
          </h1>

          <p className="mt-3 text-sm text-[#52615A] leading-relaxed">
            {locale === 'ar' ? producer.storyAr : producer.storyFr}
          </p>

          <div className="mt-6 pt-5 border-t border-[#E5E1D8]">
            <h2 className="text-xs font-semibold text-[#17211C] mb-2">
              {locale === 'ar' ? 'الممارسات البيئية الموثّقة' : 'Pratiques agroécologiques vérifiées'}
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#52615A]">
              {(producer.practices || []).map((practice) => (
                <li key={practice}>· {practice}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Approved SPG Audit Reports */}
      {approvedReports.length > 0 && (
        <section>
          <h2 className="font-editorial text-2xl text-[#17211C] mb-4">
            {locale === 'ar'
              ? 'تقارير زيارات سفراء الضمان التشاركي (SPG)'
              : 'Rapports de visites SPG approuvés'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvedReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-[#E5E1D8] rounded-lg p-5"
              >
                <div className="flex items-center justify-between text-xs text-[#52615A]">
                  <span className="font-mono font-semibold text-[#1B4D3E] tabular-nums">
                    {locale === 'ar' ? 'درجة التدقيق:' : 'Score audit :'} {rep.score}/100
                  </span>
                  <span className="font-mono tabular-nums">
                    GPS: {rep.gpsLat?.toFixed(4)}, {rep.gpsLng?.toFixed(4)}
                  </span>
                </div>
                <p className="mt-2.5 text-sm text-[#17211C] leading-relaxed">
                  {rep.notes}
                </p>
                {rep.submittedAt && (
                  <p className="mt-2 text-xs text-[#7A8780]">
                    {formatDateLocalized(rep.submittedAt, locale)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Farm Products */}
      <section>
        <h2 className="font-editorial text-2xl text-[#17211C] mb-6">
          {locale === 'ar' ? 'منتجات المزرعة المتوفرة' : 'Produits de la ferme'} (
          {products.length})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
