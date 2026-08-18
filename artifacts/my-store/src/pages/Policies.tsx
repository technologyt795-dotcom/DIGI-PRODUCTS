import { Link, useRoute } from 'wouter';
import {
  ArrowRight,
  BadgePercent,
  CheckCircle2,
  ChevronLeft,
  CircleHelp,
  Cookie,
  CreditCard,
  FileText,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import type { StoreSettings } from '@workspace/api-client-react';

type PolicyKey =
  | 'privacy'
  | 'terms'
  | 'shipping'
  | 'payment'
  | 'warranty'
  | 'digital'
  | 'promotions'
  | 'complaints'
  | 'cookies';

type PolicyDefinition = {
  title: string;
  shortTitle: string;
  description: string;
  icon: typeof FileText;
  sections: Array<{
    title: string;
    paragraphs?: string[];
    items?: string[];
  }>;
};

const policyDefinitions: Record<PolicyKey, PolicyDefinition> = {
  privacy: {
    title: 'سياسة الخصوصية',
    shortTitle: 'الخصوصية وحماية البيانات',
    description: 'كيف يجمع المتجر بياناتك ويستخدمها ويحافظ على خصوصيتها.',
    icon: LockKeyhole,
    sections: [
      {
        title: 'البيانات التي نجمعها',
        paragraphs: ['قد نطلب الاسم، رقم الجوال، البريد الإلكتروني، وعنوان التوصيل عند إنشاء الطلب أو الحساب.'],
        items: [
          'بيانات الطلب والدفع اللازمة لتنفيذ العملية وخدمة العميل.',
          'بيانات استخدام أساسية تساعدنا على تحسين المتجر وتجربة التسوق.',
        ],
      },
      {
        title: 'كيف نستخدم بياناتك',
        items: [
          'تأكيد الطلبات والتواصل معك بشأن حالتها والتوصيل.',
          'إتاحة تحميل المنتجات الرقمية وتقديم الدعم بعد الشراء.',
          'تحسين المنتجات والمتجر ومنع الاستخدام غير المصرح به.',
          'إرسال العروض التسويقية فقط وفق تفضيلاتك، مع إتاحة إلغاء الاشتراك.',
        ],
      },
      {
        title: 'مشاركة البيانات وحمايتها',
        paragraphs: [
          'لا نبيع بياناتك الشخصية. قد نشارك الحد الأدنى اللازم من البيانات مع مزود الدفع أو شركة الشحن أو مزود الخدمات التقنية لتنفيذ طلبك.',
          'نطبق إجراءات مناسبة لحماية البيانات، ولا نطلب منك مشاركة بيانات بطاقتك البنكية عبر المحادثات أو البريد الإلكتروني.',
        ],
      },
      {
        title: 'حقوقك',
        paragraphs: [
          'يمكنك طلب معرفة البيانات المرتبطة بك أو تصحيحها أو الاستفسار عن طريقة استخدامها عبر قنوات التواصل الموضحة في أسفل الصفحة، مع مراعاة المتطلبات النظامية والبيانات اللازمة للاحتفاظ بها لأغراض قانونية أو محاسبية.',
        ],
      },
    ],
  },
  terms: {
    title: 'الشروط والأحكام',
    shortTitle: 'الشروط والأحكام',
    description: 'الشروط التي تنظم استخدام المتجر وإتمام الطلبات.',
    icon: FileText,
    sections: [
      {
        title: 'استخدام المتجر',
        paragraphs: [
          'باستخدامك للمتجر، تقر بأن البيانات التي تقدمها صحيحة ومحدثة، وأنك تستخدم المتجر لأغراض مشروعة وبما لا يضر بحقوق المتجر أو العملاء الآخرين.',
        ],
      },
      {
        title: 'المنتجات والأسعار',
        items: [
          'تظهر مواصفات المنتج وصوره وسعره في صفحة المنتج، وقد تختلف الألوان أو التفاصيل البصرية البسيطة عن الصورة.',
          'الأسعار بالريال السعودي ما لم يُذكر خلاف ذلك، وقد تضاف الضريبة أو رسوم الشحن كما تظهر قبل تأكيد الطلب.',
          'يحق للمتجر تصحيح الأخطاء الواضحة في الأسعار أو الوصف وإبلاغ العميل عند الحاجة.',
        ],
      },
      {
        title: 'الطلبات',
        paragraphs: [
          'إرسال الطلب لا يعني قبوله نهائيًا حتى يتم تأكيده من المتجر. قد يُلغى الطلب عند نفاد المنتج أو تعذر التحقق من البيانات أو وجود سبب تشغيلي مشروع، وسيتم رد المبلغ المدفوع عند انطباق ذلك.',
        ],
      },
      {
        title: 'الملكية الفكرية',
        paragraphs: [
          'جميع النصوص والصور والعلامات والمحتوى المعروض في المتجر مملوك للمتجر أو مرخص له. لا يجوز نسخه أو إعادة نشره أو استخدامه تجاريًا دون إذن مكتوب.',
        ],
      },
    ],
  },
  shipping: {
    title: 'سياسة الشحن والتوصيل',
    shortTitle: 'الشحن والتوصيل',
    description: 'معلومات التوصيل للمنتجات المادية والوصول إلى المنتجات الرقمية.',
    icon: Truck,
    sections: [
      {
        title: 'المنتجات المادية',
        items: [
          'تتم معالجة الطلب بعد تأكيده وسداد المبلغ أو اعتماد الدفع عند الاستلام.',
          'تظهر تكلفة الشحن والمدة المتوقعة قبل إتمام الطلب متى كانت متاحة.',
          'قد يتواصل مندوب التوصيل معك على رقم الجوال المسجل في الطلب.',
          'يتحمل العميل مسؤولية صحة العنوان ورقم التواصل، وقد يتطلب تغيير العنوان بعد الشحن رسومًا إضافية.',
        ],
      },
      {
        title: 'تأخير التوصيل',
        paragraphs: [
          'المدة المعروضة تقديرية وقد تتأثر بمناطق التوصيل أو مواسم الطلب أو الظروف الخارجة عن السيطرة. إذا تأخر الطلب، تواصل معنا برقم الطلب لمتابعته مع شركة الشحن.',
        ],
      },
      {
        title: 'المنتجات الرقمية',
        paragraphs: [
          'لا تحتاج المنتجات الرقمية إلى شحن. بعد اكتمال الدفع، يُتاح رابط التحميل أو الوصول إلى المنتج عبر البريد الإلكتروني أو حساب العميل بحسب طريقة إعداد المنتج.',
        ],
      },
    ],
  },
  payment: {
    title: 'سياسة الدفع',
    shortTitle: 'الدفع والاسترداد المالي',
    description: 'وسائل الدفع المتاحة وطريقة التعامل مع العمليات المالية.',
    icon: CreditCard,
    sections: [
      {
        title: 'وسائل الدفع',
        paragraphs: [
          'قد تتوفر وسائل مثل البطاقات البنكية، مدى، Apple Pay، STC Pay، أو الدفع عند الاستلام بحسب المنتج والمنطقة والإعدادات المتاحة في المتجر.',
        ],
      },
      {
        title: 'الدفع الإلكتروني',
        items: [
          'تتم معالجة الدفع الإلكتروني عبر بوابة دفع آمنة، ولا يخزن المتجر بيانات البطاقة البنكية الكاملة.',
          'إذا فشلت العملية أو ظهرت عملية مكررة، لا تعاود الدفع مرات متعددة قبل التحقق من حالة الطلب أو التواصل معنا.',
          'لا يتم اعتبار الطلب مدفوعًا إلا بعد وصول تأكيد ناجح من بوابة الدفع.',
        ],
      },
      {
        title: 'الدفع عند الاستلام',
        paragraphs: [
          'يتوفر الدفع عند الاستلام للطلبات المؤهلة فقط. يجب توفير المبلغ أو وسيلة الدفع المطلوبة عند وصول الطلب، وقد يتم التواصل لتأكيد الطلب قبل الشحن.',
        ],
      },
      {
        title: 'إعادة المبالغ',
        paragraphs: [
          'تتم إعادة المبلغ إلى وسيلة الدفع الأصلية أو بالطريقة المتاحة بحسب حالة العملية وسياسة الاسترجاع، وقد تحتاج العملية عدة أيام عمل من طرف البنك أو مزود الدفع.',
        ],
      },
    ],
  },
  warranty: {
    title: 'سياسة الضمان',
    shortTitle: 'الضمان والمنتجات التالفة',
    description: 'ما يجب فعله عند وصول منتج تالف أو وجود عيب مصنعي.',
    icon: ShieldCheck,
    sections: [
      {
        title: 'نطاق الضمان',
        paragraphs: [
          'يشمل الضمان المنتجات التي يذكر في صفحة المنتج أو فاتورته أنها مشمولة بالضمان، ويمتد للمدة والشروط الموضحة هناك.',
        ],
      },
      {
        title: 'ما لا يشمله الضمان عادةً',
        items: [
          'الأضرار الناتجة عن سوء الاستخدام أو التركيب غير الصحيح أو الحوادث.',
          'الاستهلاك الطبيعي أو الخدوش والتلف الناتج عن استخدام غير مطابق للتعليمات.',
          'الأعطال الناتجة عن تعديل المنتج أو إصلاحه لدى جهة غير معتمدة.',
        ],
      },
      {
        title: 'تقديم طلب الضمان',
        paragraphs: [
          'أرسل رقم الطلب ووصف المشكلة وصورًا أو مقطعًا يوضحها عبر قنوات التواصل. بعد التحقق، قد يكون الحل إصلاح المنتج أو استبداله أو رد قيمته وفق الحالة والأنظمة المعمول بها.',
        ],
      },
    ],
  },
  digital: {
    title: 'سياسة المنتجات الرقمية',
    shortTitle: 'المنتجات الرقمية وحقوق الاستخدام',
    description: 'قواعد الوصول إلى الملفات الرقمية واستخدامها بعد الشراء.',
    icon: PackageCheck,
    sections: [
      {
        title: 'الوصول والتحميل',
        paragraphs: [
          'يتم إرسال رابط التحميل أو إتاحة المنتج بعد تأكيد الدفع. احتفظ بالبريد الإلكتروني ورقم الطلب، وتواصل معنا إذا لم يصلك الرابط.',
        ],
      },
      {
        title: 'حقوق الاستخدام',
        items: [
          'المنتج الرقمي مخصص للاستخدام الشخصي أو للاستخدام الموضح في صفحة المنتج.',
          'يُمنع إعادة بيع الملفات أو مشاركتها أو رفعها على منصات عامة أو تقديمها كمنتج خاص بك.',
          'لا يُسمح بإزالة حقوق الملكية أو إعادة توزيع نسخ معدلة من المنتج دون إذن.',
        ],
      },
      {
        title: 'الاسترجاع للمنتجات الرقمية',
        paragraphs: [
          'بسبب طبيعة المنتجات الرقمية، قد لا يمكن استرجاع المنتج بعد بدء التحميل أو الوصول إليه، مع مراعاة الحالات التي يفرض فيها النظام خلاف ذلك أو وجود عيب يمنع الانتفاع بالمنتج.',
        ],
      },
    ],
  },
  promotions: {
    title: 'سياسة العروض والخصومات',
    shortTitle: 'العروض والكوبونات',
    description: 'قواعد استخدام الكوبونات والعروض الترويجية في المتجر.',
    icon: BadgePercent,
    sections: [
      {
        title: 'صلاحية العرض',
        items: [
          'كل عرض أو كوبون صالح خلال المدة والمنتجات والمناطق الموضحة في تفاصيله.',
          'قد يتطلب الكوبون حدًا أدنى لقيمة الطلب أو يكون غير قابل للجمع مع عروض أخرى.',
          'لا يمكن تحويل قيمة الخصم إلى مبلغ نقدي أو استبدالها بعد انتهاء صلاحيتها.',
        ],
      },
      {
        title: 'إلغاء الطلبات المخفضة',
        paragraphs: [
          'عند إرجاع جزء من طلب استخدم كوبونًا، قد يعاد المبلغ بعد احتساب الخصم الفعلي المطبق على المنتجات المرتجعة. يحق للمتجر إلغاء كوبون استُخدم بطريقة مخالفة لشروطه.',
        ],
      },
    ],
  },
  complaints: {
    title: 'سياسة الشكاوى وخدمة العملاء',
    shortTitle: 'الشكاوى وخدمة العملاء',
    description: 'كيف تتواصل معنا وكيف نتابع طلبك أو شكواك.',
    icon: MessageCircle,
    sections: [
      {
        title: 'التواصل معنا',
        paragraphs: [
          'عند التواصل، اذكر رقم الطلب والاسم المسجل ووصف المشكلة بوضوح. تساعدنا الصور أو المستندات ذات الصلة على معالجة الطلب بشكل أسرع.',
        ],
      },
      {
        title: 'معالجة الشكوى',
        items: [
          'نراجع الطلب ونتحقق من تفاصيل الدفع والشحن أو المنتج.',
          'قد نطلب معلومات إضافية أو صورًا أو تسجيلًا قصيرًا للمشكلة.',
          'نوضح لك الإجراء التالي والمدة المتوقعة متى أمكن.',
        ],
      },
      {
        title: 'بيانات التواصل',
        paragraphs: [
          'ستجد رقم الجوال والبريد الإلكتروني المتاحين حاليًا في قسم "تواصل معنا" أسفل هذه الصفحة. إذا لم تظهر وسيلة، يرجى استخدام الوسيلة المعروضة في فاتورة الطلب أو رسالة التأكيد.',
        ],
      },
    ],
  },
  cookies: {
    title: 'سياسة ملفات الارتباط',
    shortTitle: 'ملفات الارتباط والكوكيز',
    description: 'كيف يستخدم المتجر ملفات الارتباط لتشغيل وتحسين تجربة التسوق.',
    icon: Cookie,
    sections: [
      {
        title: 'ما هي ملفات الارتباط؟',
        paragraphs: [
          'ملفات الارتباط هي ملفات صغيرة تُحفظ على جهازك عند زيارة المتجر، وتساعد في تذكر السلة والجلسة وبعض تفضيلات العرض.',
        ],
      },
      {
        title: 'لماذا نستخدمها؟',
        items: [
          'تشغيل وظائف أساسية مثل السلة وتسجيل الدخول وتأكيد الطلب.',
          'حفظ تفضيلات المتجر وتحسين الأداء.',
          'فهم الاستخدام العام للمتجر عندما تكون أدوات التحليل مفعلة.',
        ],
      },
      {
        title: 'إدارة ملفات الارتباط',
        paragraphs: [
          'يمكنك التحكم في ملفات الارتباط من إعدادات المتصفح. قد يؤدي تعطيل الملفات الأساسية إلى عدم عمل بعض وظائف المتجر بالشكل المتوقع.',
        ],
      },
    ],
  },
};

const policyOrder: PolicyKey[] = [
  'privacy',
  'terms',
  'shipping',
  'payment',
  'warranty',
  'digital',
  'promotions',
  'complaints',
  'cookies',
];

const policySettingsKeys: Record<PolicyKey, keyof StoreSettings> = {
  privacy: 'privacyPolicy',
  terms: 'termsPolicy',
  shipping: 'shippingPolicy',
  payment: 'paymentPolicy',
  warranty: 'warrantyPolicy',
  digital: 'digitalPolicy',
  promotions: 'promotionsPolicy',
  complaints: 'complaintsPolicy',
  cookies: 'cookiesPolicy',
};

function PolicyHeader({ title, description, icon: Icon }: Pick<PolicyDefinition, 'title' | 'description' | 'icon'>) {
  const { settings } = useStoreSettings();
  return (
    <div className="relative overflow-hidden bg-primary px-6 py-10 text-primary-foreground sm:px-10">
      <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full border border-primary-foreground/10" />
      <div className="absolute -bottom-24 right-8 h-48 w-48 rounded-full border border-primary-foreground/10" />
      <div className="relative">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-foreground/10">
          <Icon className="h-7 w-7 text-secondary" />
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-primary-foreground/70">
          {description} {settings?.storeName ? `— ${settings.storeName}` : ''}
        </p>
      </div>
    </div>
  );
}

function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14" dir="rtl">
      <div className="mb-7">
        <Link
          href="/policies"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowRight className="h-4 w-4" />
          مركز السياسات
        </Link>
      </div>
      {children}
    </div>
  );
}

export function PoliciesIndex() {
  return (
    <PolicyLayout>
      <SEO
        title="سياسات المتجر"
        description="اطّلع على سياسات الخصوصية والدفع والشحن والاسترجاع واستخدام المتجر."
        path="/policies"
      />
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-secondary">معلومات مهمة قبل الشراء</p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">سياسات المتجر</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          كل ما تحتاج معرفته عن الشراء، الدفع، التوصيل، الاسترجاع، وحماية بياناتك في مكان واحد.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PolicyCard href="/refund-policy" title="الاسترجاع والاسترداد" description="شروط إرجاع المنتجات واستعادة المبالغ." icon={RefreshCw} />
        {policyOrder.map((key) => {
          const policy = policyDefinitions[key];
          return (
            <PolicyCard
              key={key}
              href={`/policies/${key}`}
              title={policy.shortTitle}
              description={policy.description}
              icon={policy.icon}
            />
          );
        })}
      </div>

      <div className="mt-10 flex items-start gap-3 rounded-2xl border border-secondary/30 bg-secondary/10 p-5 text-sm leading-7 text-foreground">
        <CircleHelp className="mt-1 h-5 w-5 shrink-0 text-secondary" />
        <p>
          إذا كان لديك سؤال عن طلب محدد، أرفق رقم الطلب عند التواصل معنا ليسهل علينا مساعدتك.
        </p>
      </div>
    </PolicyLayout>
  );
}

function PolicyCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: typeof FileText;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-44 flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <ChevronLeft className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

export function PolicyDetail({ policyKey }: { policyKey: PolicyKey }) {
  const policy = policyDefinitions[policyKey];
  const Icon = policy.icon;
  const { settings } = useStoreSettings();
  const contactEmail = settings?.contactEmail;
  const contactPhone = settings?.contactPhone;
  const customContent = settings?.[policySettingsKeys[policyKey]] as string | null | undefined;
  const updatedAt = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <PolicyLayout>
      <SEO title={policy.title} description={policy.description} path={`/policies/${policyKey}`} />
      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <PolicyHeader title={policy.title} description={policy.description} icon={Icon} />
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span>آخر تحديث: {updatedAt}</span>
            {settings?.storeName && <span>{settings.storeName}</span>}
          </div>
          {customContent?.trim() ? (
            <div className="whitespace-pre-wrap text-[15px] leading-8 text-muted-foreground">
              {customContent}
            </div>
          ) : (
            <div className="space-y-9">
              {policy.sections.map((section) => (
                <section key={section.title}>
                  <h2 className="mb-3 flex items-center gap-2 text-xl font-black">
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                    {section.title}
                  </h2>
                  {section.paragraphs?.map((paragraph) => (
                    <p key={paragraph} className="mb-3 text-[15px] leading-8 text-muted-foreground last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                  {section.items && (
                    <ul className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">
                      {section.items.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}

          {(contactEmail || contactPhone) && (
            <div className="mt-10 rounded-2xl bg-muted/60 p-5">
              <p className="font-bold">هل تحتاج إلى مساعدة؟</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {contactEmail && <>البريد الإلكتروني: <span dir="ltr">{contactEmail}</span></>}
                {contactEmail && contactPhone && ' · '}
                {contactPhone && <>الجوال: <span dir="ltr">{contactPhone}</span></>}
              </p>
            </div>
          )}
        </div>
      </article>
    </PolicyLayout>
  );
}

export function PolicyRoute() {
  const [, params] = useRoute<{ policyKey: string }>('/policies/:policyKey');
  const key = params?.policyKey as PolicyKey | undefined;
  if (!key || !policyDefinitions[key]) return <PoliciesIndex />;
  return <PolicyDetail policyKey={key} />;
}

export { policyDefinitions };