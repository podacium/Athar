import React, { useCallback, useEffect, useState } from 'react';
import { Camera, MapPin, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { apiRequest } from '../../lib/api.ts';
import { formatDateLocalized } from '../../i18n/messages.ts';
import {
  Button,
  Input,
  Select,
  Textarea,
} from '../../components/ui/Primitives.tsx';

interface FarmOption {
  id: number;
  farmName: string;
  farmNameFr: string;
  wilaya: string;
}

interface AmbassadorReport {
  id: number;
  producerId: number;
  farmName: string;
  farmNameFr: string;
  farmWilaya: string;
  score: number;
  recommendation: string;
  notes: string;
  status: string;
  adminComment?: string;
  gpsLat?: number;
  gpsLng?: number;
  scheduledAt: string;
  submittedAt?: string;
}

export function AmbassadorDashboard({ activeTab }: { activeTab: string }) {
  const { locale, t, pushToast } = useApp();
  const [farms, setFarms] = useState<FarmOption[]>([]);
  const [reports, setReports] = useState<AmbassadorReport[]>([]);
  const [loading, setLoading] = useState(true);

  const [producerId, setProducerId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [checklist, setChecklist] = useState({
    noSyntheticPesticides: true,
    waterConservation: true,
    soilRegeneration: true,
    fairLabor: true,
    traceableHarvest: true,
    ecoPackaging: true,
  });
  const [score, setScore] = useState(92);
  const [recommendation, setRecommendation] = useState<'GRANT' | 'RENEW' | 'REVOKE'>(
    'GRANT'
  );
  const [notes, setNotes] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [farmRes, repRes] = await Promise.all([
        apiRequest<{ producers: FarmOption[] }>('/producers'),
        apiRequest<{ reports: AmbassadorReport[] }>('/spg/reports'),
      ]);
      setFarms(farmRes.producers || []);
      setReports(repRes.reports || []);
      if (farmRes.producers?.length && !producerId) {
        setProducerId(String(farmRes.producers[0].id));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [producerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const checkedCount = Object.values(next).filter(Boolean).length;
      setScore(Math.round((checkedCount / 6) * 95) + 3);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producerId) return;
    setSubmitting(true);
    try {
      await apiRequest('/spg/reports', {
        method: 'POST',
        body: JSON.stringify({
          producerId: Number(producerId),
          scheduledAt: scheduledDate,
          checklist,
          score: Number(score),
          recommendation,
          notes,
          caption: caption || undefined,
          status: 'SUBMITTED',
        }),
      });
      setNotes('');
      setCaption('');
      pushToast(
        locale === 'ar'
          ? 'تم إرسال تقرير الزيارة الميدانية بصور موثّقة جغرافياً لمراجعة الإدارة'
          : 'Rapport SPG géolocalisé soumis pour validation administrative'
      );
      loadData();
    } catch (err: unknown) {
      pushToast(err instanceof Error ? err.message : 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-64 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />;
  }

  if (activeTab === 'myVisits') {
    return (
      <div className="space-y-4">
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.myVisits} ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'لم تقم بتقديم أي تقارير زيارة بعد.'
              : 'Aucun rapport de visite soumis.'}
          </p>
        ) : (
          <div className="space-y-4">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white border border-[#E5E1D8] rounded-lg p-5 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#52615A]">
                  <span className="font-semibold text-[#17211C]">
                    #{rep.id} ·{' '}
                    {locale === 'ar' ? rep.farmName : rep.farmNameFr || rep.farmName} (
                    {rep.farmWilaya})
                  </span>
                  <span className="font-semibold text-[#1B4D3E]">
                    {t.statuses[rep.status as keyof typeof t.statuses] || rep.status} ·{' '}
                    {rep.recommendation} · {rep.score}/100
                  </span>
                </div>
                <p className="text-sm text-[#52615A] leading-relaxed">{rep.notes}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#7A8780]">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#1B4D3E]" />
                    GPS: {rep.gpsLat?.toFixed(4)}, {rep.gpsLng?.toFixed(4)}
                  </span>
                  <span>{formatDateLocalized(rep.scheduledAt, locale)}</span>
                </div>
                {rep.adminComment && (
                  <p className="text-xs text-[#1B4D3E] pt-1">
                    {locale === 'ar' ? 'تعليق الإدارة:' : 'Décision admin :'}{' '}
                    {rep.adminComment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const checklistLabels: Array<{
    key: keyof typeof checklist;
    ar: string;
    fr: string;
  }> = [
    {
      key: 'noSyntheticPesticides',
      ar: 'غياب تام للمبيدات والأسمدة الكيميائية المصنّعة',
      fr: 'Absence totale de pesticides et engrais de synthèse',
    },
    {
      key: 'waterConservation',
      ar: 'استخدام الري بالتقطير أو تقنيات اقتصاد المياه',
      fr: 'Irrigation goutte-à-goutte ou économie d’eau',
    },
    {
      key: 'soilRegeneration',
      ar: 'تسميد عضوي طبيعي ودورة زراعية تحافظ على التربة',
      fr: 'Compostage naturel et régénération des sols',
    },
    {
      key: 'fairLabor',
      ar: 'ظروف عمل عادلة وآمنة للفلاحين والعمال',
      fr: 'Conditions de travail équitables et sûres',
    },
    {
      key: 'traceableHarvest',
      ar: 'سجل قطف واضح وقابل للتتبع بالدفعات',
      fr: 'Registre de récolte traçable par lot',
    },
    {
      key: 'ecoPackaging',
      ar: 'تغليف بيئي قابل لإعادة التدوير أو الإرجاع',
      fr: 'Emballage écologique recyclable ou consigné',
    },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl bg-white border border-[#E5E1D8] rounded-lg p-6 sm:p-8 space-y-6"
    >
      <div>
        <h2 className="font-editorial text-2xl text-[#17211C]">
          {t.dashboard.tabs.submitVisit}
        </h2>
        <p className="mt-1 text-sm text-[#52615A]">
          {locale === 'ar'
            ? 'أكمل قائمة التدقيق الميداني وأرفق التوثيق الجغرافي لإرساله إلى لجنة اعتماد شارات SPG.'
            : 'Complétez la grille d’audit terrain et joignez la preuve géolocalisée pour validation SPG.'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#52615A] mb-1">
            {locale === 'ar' ? 'المزرعة المستهدفة بالزيارة' : 'Ferme visitée'}
          </label>
          <Select
            value={producerId}
            onChange={(e) => setProducerId(e.target.value)}
          >
            {farms.map((f) => (
              <option key={f.id} value={f.id}>
                {locale === 'ar' ? f.farmName : f.farmNameFr || f.farmName} ({f.wilaya})
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#52615A] mb-1">
            {locale === 'ar' ? 'تاريخ الزيارة الميدانية' : 'Date de visite'}
          </label>
          <Input
            type="date"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
          />
        </div>
      </div>

      {/* SPG Checklist */}
      <div className="space-y-2.5 pt-2 border-t border-[#E5E1D8]">
        <h3 className="text-sm font-semibold text-[#17211C]">
          {locale === 'ar' ? 'قائمة تدقيق الممارسات (6 معايير)' : 'Grille d’audit SPG (6 critères)'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {checklistLabels.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-2.5 p-3 rounded-md border border-[#E5E1D8] text-xs cursor-pointer hover:bg-[#FAF9F6]"
            >
              <input
                type="checkbox"
                checked={checklist[item.key]}
                onChange={() => toggleCheck(item.key)}
                className="mt-0.5 w-4 h-4 accent-[#1B4D3E]"
              />
              <span className="text-[#17211C] leading-snug">
                {locale === 'ar' ? item.ar : item.fr}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#52615A] mb-1">
            {locale === 'ar' ? 'الدرجة النهائية (0–100)' : 'Score global (0–100)'}:{' '}
            <strong className="font-mono text-[#1B4D3E]">{score}/100</strong>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-[#1B4D3E]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#52615A] mb-1">
            {locale === 'ar' ? 'التوصية المرفوعة للإدارة' : 'Recommandation SPG'}
          </label>
          <Select
            value={recommendation}
            onChange={(e) =>
              setRecommendation(e.target.value as 'GRANT' | 'RENEW' | 'REVOKE')
            }
          >
            <option value="GRANT">
              {locale === 'ar' ? 'منح شارة SPG (GRANT)' : 'Accorder le badge SPG (GRANT)'}
            </option>
            <option value="RENEW">
              {locale === 'ar' ? 'تجديد الشارة (RENEW)' : 'Renouveler le badge (RENEW)'}
            </option>
            <option value="REVOKE">
              {locale === 'ar' ? 'تعليق / سحب الشارة (REVOKE)' : 'Révoquer le badge (REVOKE)'}
            </option>
          </Select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          <span className="inline-flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#1B4D3E]" />
            {locale === 'ar'
              ? 'وصف الصورة الميدانية الموثقة جغرافياً (محاكاة رفع GPS)'
              : 'Légende photo terrain géolocalisée (upload GPS simulé)'}
          </span>
        </label>
        <Input
          placeholder={
            locale === 'ar'
              ? 'مثلاً: فحص نظام الري بالتقطير والتربة العضوية في القطعة الشمالية'
              : 'Ex : Vérification du goutte-à-goutte et compost parcelle nord'
          }
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#52615A] mb-1">
          {locale === 'ar' ? 'ملاحظات التقرير الميداني' : 'Observations détaillées'}
        </label>
        <Textarea
          rows={4}
          required
          minLength={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting}>
        <ShieldCheck className="w-4 h-4" />
        <span>
          {locale === 'ar'
            ? 'إرسال التقرير الميداني الموثّق'
            : 'Soumettre le rapport SPG'}
        </span>
      </Button>
    </form>
  );
}
