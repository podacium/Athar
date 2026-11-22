import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { apiRequest } from '../lib/api.ts';
import { GENERATED_IMAGES } from '../lib/algeria.ts';
import { formatDateLocalized } from '../i18n/messages.ts';
import { Button, Input, SafeImage, Textarea } from '../components/ui/Primitives.tsx';

export function HowItWorksPage() {
  const { locale, navigate } = useApp();

  const steps =
    locale === 'ar'
      ? [
          {
            num: '01',
            title: 'التسجيل وتقييم الممارسات الأولية',
            body: 'يسجّل الفلاح أو التعاونية ملف المزرعة، الموقع في الولاية، مصادر المياه، البذور، وطرق مكافحة الآفات الطبيعية.',
          },
          {
            num: '02',
            title: 'زيارة ميدانية لسفير الضمان التشاركي (SPG)',
            body: 'يقوم سفير مستهلك مدرّب بزيارة المزرعة وتوثيقها بصور مرتبطة بالإحداثيات الجغرافية وقائمة تدقيق من 6 معايير صارمة.',
          },
          {
            num: '03',
            title: 'المراجعة ومنح شارة الثقة في سلسلة التجزئة SHA-256',
            body: 'تراجع لجنة الإدارة التقرير وتوافق على منح أو تجديد أو تعليق شارة SPG، ليُسجَّل الحدث تلقائياً في جواز المنتج الرقمي غير القابل للتزوير.',
          },
          {
            num: '04',
            title: 'التحقق الفوري من طرف المستهلك وكسب رصيد أثرك',
            body: 'يمكن لكل مشتري الضغط على «تحقق من سلامة السلسلة» لمراجعة التجزئات المشفرة، ثم كسب نقاط أثر عند تسليم الطلب.',
          },
        ]
      : [
          {
            num: '01',
            title: 'Inscription et charte agroécologique',
            body: 'La ferme déclare sa wilaya, ses parcelles, ses pratiques sans pesticides de synthèse et sa gestion raisonnée de l’eau.',
          },
          {
            num: '02',
            title: 'Visite terrain par un Ambassadeur SPG',
            body: 'Un ambassadeur consommateur formé audite la ferme sur place, remplit une grille en 6 points et capture des photos géolocalisées.',
          },
          {
            num: '03',
            title: 'Validation et scellement SHA-256 dans le Passeport',
            body: 'L’équipe Athar valide le rapport, attribue ou révoque le badge SPG et ajoute un bloc cryptographique au Passeport Produit.',
          },
          {
            num: '04',
            title: 'Vérification citoyenne et récompense Atharouk',
            body: 'Chaque acheteur peut recalculer l’intégrité SHA-256 en un clic et cumuler des points Athar dès la livraison.',
          },
        ];

  return (
    <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-12 border-b border-[#E5E1D8]">
        <div className="lg:col-span-6">
          <p className="text-xs font-medium text-[#4A7C59]">
            {locale === 'ar'
              ? 'منهجية الثقة الميدانية'
              : 'Méthodologie de vérification'}
          </p>
          <h1 className="mt-2 font-editorial text-3xl sm:text-4xl text-[#17211C]">
            {locale === 'ar'
              ? 'كيف تتحقق منصة أثر من كل منتج أخضر؟'
              : 'Comment Athar vérifie chaque produit vert ?'}
          </h1>
          <p className="mt-4 text-sm text-[#52615A] leading-relaxed">
            {locale === 'ar'
              ? 'نجمع بين الزيارات الميدانية التشاركية (Digital SPG) وسجل التتبع المشفر (SHA-256 Hash Chain) لضمان شفافية كاملة في السوق الجزائري دون تكاليف شهادات مستوردة باهظة.'
              : 'Nous combinons l’audit citoyen sur le terrain (SPG numérique) et une chaîne de hachage SHA-256 pour offrir une garantie fiable et accessible aux producteurs algériens.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => navigate({ name: 'catalog' })}>
              {locale === 'ar' ? 'تصفح المنتجات الموثّقة' : 'Voir les produits vérifiés'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate({ name: 'auth', mode: 'register' })}
            >
              {locale === 'ar' ? 'انضم كسفير SPG' : 'Devenir Ambassadeur SPG'}
            </Button>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-[#E5E1D8]">
            <SafeImage
              src={GENERATED_IMAGES.spgVisit}
              alt="SPG farm visit"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((s) => (
          <div
            key={s.num}
            className="bg-white border border-[#E5E1D8] rounded-lg p-6"
          >
            <span className="font-mono text-sm font-semibold text-[#1B4D3E]">
              {s.num}.
            </span>
            <h2 className="mt-2 text-lg font-semibold text-[#17211C]">{s.title}</h2>
            <p className="mt-2 text-sm text-[#52615A] leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface BlogArticle {
  id: number;
  titleAr: string;
  titleFr: string;
  excerptAr: string;
  excerptFr: string;
  bodyAr: string;
  bodyFr: string;
  category: string;
  image: string;
  published: boolean;
  createdAt: string;
}

export function CommunityBlogPage() {
  const { locale } = useApp();
  const [posts, setPosts] = useState<BlogArticle[]>([]);
  const [selected, setSelected] = useState<BlogArticle | null>(null);
  const [cat, setCat] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ posts: BlogArticle[] }>('/blog')
      .then((res) => setPosts((res.posts || []).filter((p) => p.published)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    cat === 'ALL' ? posts : posts.filter((p) => p.category === cat);

  return (
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-[#E5E1D8] flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-[#17211C]">
            {locale === 'ar'
              ? 'مجتمع أثر: مقالات، وصفات، ونصائح استدامة'
              : 'Communauté Athar : articles, recettes et conseils'}
          </h1>
          <p className="mt-1.5 text-sm text-[#52615A]">
            {locale === 'ar'
              ? 'محتوى معرفي موثّق حول الزراعة النظيفة في الجزائر وتقليل البصمة البيئية.'
              : 'Ressources pratiques sur l’agroécologie algérienne, la saisonnalité et le zéro déchet.'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F2EFE9] rounded-md">
          {[
            { k: 'ALL', ar: 'الكل', fr: 'Tout' },
            { k: 'spg_trust', ar: 'الثقة و SPG', fr: 'SPG & Confiance' },
            { k: 'recipes', ar: 'وصفات موسمية', fr: 'Recettes' },
            { k: 'sustainability', ar: 'الاستدامة', fr: 'Durabilité' },
          ].map((tab) => (
            <button
              key={tab.k}
              type="button"
              onClick={() => {
                setCat(tab.k);
                setSelected(null);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                cat === tab.k
                  ? 'bg-white text-[#17211C] shadow-sm'
                  : 'text-[#52615A] hover:text-[#17211C]'
              }`}
            >
              {locale === 'ar' ? tab.ar : tab.fr}
            </button>
          ))}
        </div>
      </div>

      {selected ? (
        <article className="mt-8 bg-white border border-[#E5E1D8] rounded-lg overflow-hidden max-w-3xl mx-auto">
          <div className="aspect-[16/9] bg-[#F2EFE9]">
            <SafeImage
              src={selected.image}
              alt={locale === 'ar' ? selected.titleAr : selected.titleFr}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-10">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-xs font-medium text-[#1B4D3E] hover:underline mb-4 cursor-pointer"
            >
              {locale === 'ar' ? '← العودة إلى المقالات' : '← Retour aux articles'}
            </button>
            <p className="text-xs text-[#52615A]">
              {formatDateLocalized(selected.createdAt, locale)} · {selected.category}
            </p>
            <h2 className="mt-2 font-editorial text-2xl sm:text-3xl text-[#17211C]">
              {locale === 'ar' ? selected.titleAr : selected.titleFr}
            </h2>
            <p className="mt-5 text-base text-[#17211C] leading-loose whitespace-pre-line">
              {locale === 'ar' ? selected.bodyAr : selected.bodyFr}
            </p>
          </div>
        </article>
      ) : loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-72 rounded-lg bg-[#F2EFE9]/70 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-[#E5E1D8] rounded-lg overflow-hidden flex flex-col"
            >
              <div className="aspect-[16/10] bg-[#F2EFE9]">
                <SafeImage
                  src={post.image}
                  alt={locale === 'ar' ? post.titleAr : post.titleFr}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-1">
                <p className="text-xs text-[#52615A]">
                  {formatDateLocalized(post.createdAt, locale)} · {post.category}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[#17211C] leading-snug">
                  {locale === 'ar' ? post.titleAr : post.titleFr}
                </h2>
                <p className="mt-2 text-sm text-[#52615A] line-clamp-3 leading-relaxed">
                  {locale === 'ar' ? post.excerptAr : post.excerptFr}
                </p>
                <div className="mt-auto pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(post)}
                  >
                    {locale === 'ar' ? 'قراءة المقال' : "Lire l'article"}
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

export function InfoStaticPage({
  page,
}: {
  page: 'about' | 'contact' | 'faq' | 'privacy' | 'terms';
}) {
  const { locale, pushToast } = useApp();
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');

  if (page === 'contact') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-editorial text-3xl text-[#17211C]">
          {locale === 'ar' ? 'اتصل بفريق أثر' : "Contacter l'équipe Athar"}
        </h1>
        <p className="mt-2 text-sm text-[#52615A]">
          {locale === 'ar'
            ? 'مقرنا في الجزائر العاصمة — نرافق الفلاحين والمستهلكين عبر 58 ولاية.'
            : 'Basés à Alger — nous accompagnons producteurs et citoyens à travers les 58 wilayas.'}
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setContactName('');
            setContactEmail('');
            setContactMsg('');
            pushToast(
              locale === 'ar'
                ? 'تم استلام رسالتك بنجاح، سنرد خلال 24 ساعة.'
                : 'Message envoyé avec succès, réponse sous 24h.'
            );
          }}
          className="mt-6 bg-white border border-[#E5E1D8] rounded-lg p-6 space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-[#52615A] mb-1">
              {locale === 'ar' ? 'الاسم الكامل' : 'Nom complet'}
            </label>
            <Input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#52615A] mb-1">
              {locale === 'ar' ? 'البريد الإلكتروني' : 'Adresse e-mail'}
            </label>
            <Input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#52615A] mb-1">
              {locale === 'ar' ? 'رسالتك' : 'Votre message'}
            </label>
            <Textarea
              rows={4}
              required
              value={contactMsg}
              onChange={(e) => setContactMsg(e.target.value)}
            />
          </div>
          <Button type="submit">
            {locale === 'ar' ? 'إرسال الرسالة' : 'Envoyer le message'}
          </Button>
        </form>
      </div>
    );
  }

  if (page === 'faq') {
    const items =
      locale === 'ar'
        ? [
            {
              q: 'ما هو نظام الضمان التشاركي (SPG)؟',
              a: 'نظام تحقق محلي يعتمد على زيارات ميدانية ينفذها سفراء مستهلكون مدربون ومهندسون فلاحيون لتوثيق الممارسات العضوية دون وسطاء باهظين.',
            },
            {
              q: 'كيف أتحقق من صحة جواز المنتج الرقمي؟',
              a: 'افتح صفحة أي منتج واضغط على «جواز المنتج الرقمي»، ثم اضغط «تحقق من سلامة السلسلة» لإعادة حساب تجزئات SHA-256 لكل حدث.',
            },
            {
              q: 'ما هي وسائل الدفع والتوصيل المتاحة في الجزائر؟',
              a: 'الدفع عند الاستلام (COD) هو الخيار الافتراضي، مع دعم محاكاة SATIM/CIB وBaridiMob، وتوصيل للمنزل أو نقاط استلام بيئية.',
            },
            {
              q: 'متى أحصل على نقاط الولاء «أثرك»؟',
              a: 'تُضاف النقاط تلقائياً إلى محفظتك فور تسليم الطلب بناءً على المياه والكربون الموفرين، ويمكنك استبدالها بخصم أو شهادة غرس شجرة.',
            },
          ]
        : [
            {
              q: "Qu'est-ce que le Système Participatif de Garantie (SPG) ?",
              a: 'Un mécanisme local d’audit terrain mené par des ambassadeurs formés et des agronomes pour garantir les pratiques agroécologiques avec photos géolocalisées.',
            },
            {
              q: 'Comment vérifier le Passeport Produit Numérique ?',
              a: 'Cliquez sur « Passeport Numérique » depuis n’importe quel produit puis sur « Vérifier l’intégrité » pour recalculer toute la chaîne SHA-256.',
            },
            {
              q: 'Quels modes de paiement sont acceptés ?',
              a: 'Le paiement à la livraison (COD) est activé par défaut, complété par des simulations SATIM CIB et BaridiMob ainsi que le retrait en point relais vert.',
            },
            {
              q: 'Comment gagner et utiliser mes points Athar ?',
              a: 'Vos points sont crédités automatiquement à la livraison selon l’eau et le CO2 évités, puis échangeables contre des remises ou un certificat de plantation d’arbre.',
            },
          ];

    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="font-editorial text-3xl text-[#17211C]">
          {locale === 'ar' ? 'الأسئلة الشائعة' : 'Foire aux questions'}
        </h1>
        <div className="mt-8 divide-y divide-[#E5E1D8] border-y border-[#E5E1D8] bg-white rounded-lg">
          {items.map((it) => (
            <div key={it.q} className="p-6">
              <h2 className="text-base font-semibold text-[#17211C]">{it.q}</h2>
              <p className="mt-2 text-sm text-[#52615A] leading-relaxed">{it.a}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const contentMap = {
    about: {
      titleAr: 'عن منصة أثر (Athar)',
      titleFr: 'À propos de la plateforme Athar',
      bodyAr:
        'تأسست أثر لمعالجة أزمة الثقة والتضليل الأخضر في سوق المنتجات العضوية والبيئية بالجزائر. نربط مباشرة بين المزارع العائلية الملتزمة والمستهلكين عبر زيارات التحقق التشاركي (Digital SPG)، جوازات المنتجات المشفرة بـ SHA-256، وبرنامج الولاء الأخضر «أثرك».',
      bodyFr:
        'Athar est née pour résoudre le manque de confiance et le greenwashing sur le marché des produits verts en Algérie. Nous relions fermes engagées et citoyens grâce au SPG numérique, au Passeport Produit cryptographique SHA-256 et au programme de fidélité impact Atharouk.',
    },
    privacy: {
      titleAr: 'سياسة الخصوصية وحماية البيانات',
      titleFr: 'Politique de confidentialité',
      bodyAr:
        'تحترم أثر القانون الجزائري لحماية المعطيات ذات الطابع الشخصي. تُشفّر كلمات المرور بخوارزمية bcrypt، وتُستخدم عناوين التوصيل حصراً لتنفيذ الطلبات، ولا نبيع بيانات المستخدمين لأي طرف ثالث.',
      bodyFr:
        'Athar protège vos données personnelles conformément à la réglementation algérienne. Les mots de passe sont hachés via bcrypt, les adresses servent uniquement à la livraison et aucune donnée n’est revendue à des tiers.',
    },
    terms: {
      titleAr: 'شروط الاستخدام والضمان',
      titleFr: "Conditions générales d'utilisation",
      bodyAr:
        'يلتزم كل منتج مسجل بفتح مزرعته لزيارات سفراء أثر الميدانية وبشفافية بيانات القطف. للمستهلك حق فتح نزاع موثّق في حال عدم مطابقة الطلب أو تضرره أثناء الشحن مع قرار استرجاع أو استبدال شفاف.',
      bodyFr:
        'Chaque producteur s’engage à accepter les audits terrain SPG et à fournir des informations sincères sur ses récoltes. Les consommateurs peuvent ouvrir un litige documenté en cas de non-conformité pour remboursement ou remplacement.',
    },
  };

  const doc = contentMap[page];
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="bg-white border border-[#E5E1D8] rounded-lg p-8">
        <ShieldCheck className="w-7 h-7 text-[#1B4D3E] mb-3" aria-hidden="true" />
        <h1 className="font-editorial text-3xl text-[#17211C]">
          {locale === 'ar' ? doc.titleAr : doc.titleFr}
        </h1>
        <p className="mt-4 text-base text-[#52615A] leading-loose">
          {locale === 'ar' ? doc.bodyAr : doc.bodyFr}
        </p>
      </div>
    </div>
  );
}
