import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Hash,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { type ProductItem, useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { formatDateTimeLocalized } from '../i18n/messages.ts';
import { Button, SafeImage } from '../components/ui/Primitives.tsx';

interface PassportEvent {
  id: number;
  eventType: string;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

interface VerificationResult {
  valid: boolean;
  totalEvents: number;
  brokenAtIndex: number | null;
  brokenEventId: number | null;
  reason?: string;
  checkedAt: string;
}

interface PassportData {
  product: ProductItem;
  producer: {
    id: number;
    farmName: string;
    farmNameFr: string;
    wilaya: string;
    practices: string[];
  };
  badges: Array<{ id: number; status: string; validUntil: string }>;
  verification: VerificationResult;
  events: PassportEvent[];
}

export function PassportPage({ productId }: { productId: number }) {
  const { locale, t, navigate, pushToast } = useApp();
  const [data, setData] = useState<PassportData | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [simulatedTamper, setSimulatedTamper] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);

  const BackIcon = locale === 'ar' ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setLoading(true);
    apiRequest<PassportData>(`/products/${productId}/passport`)
      .then((res) => {
        setData(res);
        setVerification(res.verification);
        setSimulatedTamper(false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  const runVerification = async (tamper = false) => {
    setVerifying(true);
    try {
      const res = await apiRequest<{
        verification: VerificationResult;
        simulatedTamper: boolean;
      }>(`/products/${productId}/passport/verify`, {
        method: 'POST',
        body: JSON.stringify({ simulateTamper: tamper }),
      });
      setVerification(res.verification);
      setSimulatedTamper(res.simulatedTamper);
      pushToast(
        res.verification.valid
          ? t.passport.validTitle
          : t.passport.tamperedTitle,
        res.verification.valid ? 'success' : 'error'
      );
    } catch (err: unknown) {
      pushToast(
        err instanceof Error ? err.message : 'Verification error',
        'error'
      );
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-12">
        <div className="h-80 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-[1040px] px-4 py-16 text-center text-sm text-[#52615A]">
        Passport not found.
      </div>
    );
  }

  const { product, producer, badges, events } = data;
  const activeBadge = badges.find(
    (b) => b.status === 'ACTIVE' && new Date(b.validUntil) > new Date()
  );

  return (
    <div className="mx-auto max-w-[1040px] px-4 sm:px-6 lg:px-8 py-10">
      <button
        type="button"
        onClick={() => navigate({ name: 'product', id: product.id })}
        className="inline-flex items-center gap-1.5 text-sm text-[#52615A] hover:text-[#17211C] mb-6 cursor-pointer"
      >
        <BackIcon className="w-4 h-4" />
        <span>{locale === 'ar' ? product.nameAr : product.nameFr}</span>
      </button>

      {/* Passport Header Card */}
      <div className="bg-white border border-[#E5E1D8] rounded-lg p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <SafeImage
              src={product.images?.[0]}
              alt={locale === 'ar' ? product.nameAr : product.nameFr}
              className="w-20 h-20 rounded-md object-cover border border-[#E5E1D8] shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-[#4A7C59]">
                {t.passport.title} · #{product.id}
              </p>
              <h1 className="mt-1 font-editorial text-2xl text-[#17211C]">
                {locale === 'ar' ? product.nameAr : product.nameFr}
              </h1>
              <p className="mt-1 text-sm text-[#52615A]">{t.passport.subtitle}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button
              disabled={verifying}
              onClick={() => runVerification(false)}
            >
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
              <span>{t.passport.verifyButton}</span>
            </Button>
            <Button
              variant="outline"
              disabled={verifying}
              onClick={() => runVerification(true)}
            >
              <AlertTriangle className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
              <span>{t.passport.simulateTamper}</span>
            </Button>
          </div>
        </div>

        {/* Integrity Verification Banner */}
        {verification && (
          <div
            className={`mt-6 rounded-md border p-4 flex items-start gap-3 ${
              verification.valid
                ? 'border-[#1B4D3E]/30 bg-[#1B4D3E]/5 text-[#1B4D3E]'
                : 'border-[#B91C1C]/35 bg-[#B91C1C]/5 text-[#991B1B]'
            }`}
          >
            {verification.valid ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            ) : (
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            )}
            <div className="text-sm">
              <p className="font-semibold">
                {verification.valid
                  ? t.passport.validTitle
                  : t.passport.tamperedTitle}
              </p>
              <p className="mt-1 text-xs opacity-90 font-mono tabular-nums">
                {verification.reason
                  ? `${verification.reason} · `
                  : ''}
                {t.passport.blocksCount}: {verification.totalEvents} ·{' '}
                {formatDateTimeLocalized(verification.checkedAt, locale)}
                {simulatedTamper
                  ? locale === 'ar'
                    ? ' (اختبار محاكاة غير تدميري)'
                    : ' (Test de simulation non destructif)'
                  : ''}
              </p>
            </div>
          </div>
        )}

        {/* Key Origin & Impact Strip */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#E5E1D8] text-sm">
          <div>
            <p className="text-xs text-[#52615A]">{t.passport.farmOrigin}</p>
            <button
              type="button"
              onClick={() => navigate({ name: 'producer', id: producer.id })}
              className="mt-1 font-semibold text-[#1B4D3E] hover:underline cursor-pointer text-start"
            >
              {locale === 'ar'
                ? producer.farmName
                : producer.farmNameFr || producer.farmName}
            </button>
            <p className="text-xs text-[#52615A]">{producer.wilaya}</p>
          </div>
          <div>
            <p className="text-xs text-[#52615A]">{t.passport.spgStatus}</p>
            <p
              className={`mt-1 font-semibold ${
                activeBadge ? 'text-[#1B4D3E]' : 'text-[#B45309]'
              }`}
            >
              {activeBadge
                ? t.catalog.spgVerified
                : t.catalog.selfDeclared}
            </p>
            {activeBadge && (
              <p className="text-xs text-[#52615A] font-mono tabular-nums">
                → {activeBadge.validUntil.slice(0, 10)}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-[#52615A]">{t.product.harvestDate}</p>
            <p className="mt-1 font-mono font-semibold text-[#17211C] tabular-nums">
              {product.harvestDate}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#52615A]">{t.catalog.sustainabilityScore}</p>
            <p className="mt-1 font-mono font-semibold text-[#17211C] tabular-nums">
              {product.sustainabilityScore}/100 · {product.waterSavedPerUnit}L /{' '}
              {product.co2SavedPerUnit}kg CO2
            </p>
          </div>
        </div>
      </div>

      {/* Cryptographic Hash Chain Timeline */}
      <div className="mt-8">
        <h2 className="font-editorial text-xl text-[#17211C] mb-5">
          {locale === 'ar'
            ? 'سجل الأحداث المتسلسل (Hash Chain Ledger)'
            : 'Chronologie cryptographique (Hash Chain)'}
        </h2>

        <div className="space-y-4">
          {events.map((ev, index) => {
            const eventLabel =
              t.passport.eventTypes[
                ev.eventType as keyof typeof t.passport.eventTypes
              ] || ev.eventType;
            const summary =
              locale === 'ar'
                ? String(ev.payload.summaryAr || ev.payload.summaryFr || '')
                : String(ev.payload.summaryFr || ev.payload.summaryAr || '');
            const isBroken =
              verification && !verification.valid && verification.brokenAtIndex === index;

            return (
              <div
                key={ev.id}
                className={`bg-white border rounded-lg p-5 ${
                  isBroken ? 'border-[#B91C1C]' : 'border-[#E5E1D8]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-[#1B4D3E] tabular-nums">
                      #{String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-sm font-semibold text-[#17211C]">
                      {eventLabel}
                    </h3>
                  </div>
                  <div className="text-xs text-[#52615A] font-mono tabular-nums">
                    {formatDateTimeLocalized(ev.createdAt, locale)}
                  </div>
                </div>

                {summary && (
                  <p className="mt-2 text-sm text-[#52615A]">{summary}</p>
                )}

                <p className="mt-2 text-xs text-[#52615A]">
                  {locale === 'ar' ? 'الجهة الموثِّقة:' : 'Acteur :'} {ev.actorName} (
                  {ev.actorRole})
                </p>

                <div className="mt-4 pt-3 border-t border-[#F2EFE9] grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono text-[#52615A]">
                  <div className="truncate">
                    <span className="inline-flex items-center gap-1 text-[#7A8780] me-1">
                      <Hash className="w-3 h-3" aria-hidden="true" />
                      {t.passport.previousHash}:
                    </span>
                    <span className="text-[#17211C]">{ev.previousHash}</span>
                  </div>
                  <div className="truncate">
                    <span className="inline-flex items-center gap-1 text-[#7A8780] me-1">
                      <Hash className="w-3 h-3" aria-hidden="true" />
                      {t.passport.currentHash}:
                    </span>
                    <span className="text-[#1B4D3E] font-medium">{ev.hash}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
