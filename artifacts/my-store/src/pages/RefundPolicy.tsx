import { Link } from 'wouter';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

export default function RefundPolicy() {
  const { settings, isLoading } = useStoreSettings();

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
      <SEO
        title="سياسة الاسترجاع والاسترداد"
        description="اطّلع على سياسة الاسترجاع والاسترداد الخاصة بمتجر Digl Products قبل إتمام الشراء."
        path="/refund-policy"
      />
      {/* Back */}
      <div className="mb-8 no-print">
        <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowRight className="h-4 w-4" />
            العودة للرئيسية
          </Link>
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-primary px-8 py-10 text-primary-foreground">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="h-8 w-8 opacity-80" />
            <h1 className="text-3xl font-bold">سياسة الاسترجاع</h1>
          </div>
          <p className="text-primary-foreground/70 text-sm">
            {settings?.storeName || 'المتجر'} — تعرّف على حقوقك وشروط الاسترجاع
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-10">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
              <div className="h-4 bg-muted animate-pulse rounded w-full" />
              <div className="h-4 bg-muted animate-pulse rounded w-5/6" />
            </div>
          ) : settings?.refundPolicy ? (
            <div
              className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap"
              style={{ fontFamily: 'inherit' }}
            >
              {settings.refundPolicy}
            </div>
          ) : (
            <div className="space-y-8 text-[15px] leading-8 text-muted-foreground">
              <section>
                <h2 className="text-xl font-black text-foreground mb-3">مدة طلب الاسترجاع</h2>
                <p>يمكنك التواصل معنا لطلب الاسترجاع أو الاستبدال خلال المدة الموضحة في صفحة المنتج أو الفاتورة، مع مراعاة الحالات والاستثناءات التي تنص عليها الأنظمة المعمول بها.</p>
              </section>
              <section>
                <h2 className="text-xl font-black text-foreground mb-3">شروط قبول المنتج</h2>
                <ul className="list-disc pr-5 space-y-2">
                  <li>أن يكون المنتج بالحالة التي استلمته بها، مع الملحقات والتغليف متى كان ذلك ممكنًا.</li>
                  <li>إرفاق رقم الطلب ووصف واضح للسبب، وصور المنتج عند وجود تلف أو خطأ في الشحنة.</li>
                  <li>قد لا تشمل سياسة الاسترجاع المنتجات الرقمية بعد بدء التحميل أو الوصول إليها، إلا عند وجود عيب يمنع الانتفاع بها أو بحسب ما تقرره الأنظمة.</li>
                </ul>
              </section>
              <section>
                <h2 className="text-xl font-black text-foreground mb-3">التكلفة وإعادة المبلغ</h2>
                <p>تُحدد مسؤولية تكلفة الشحن بحسب سبب الإرجاع. بعد اعتماد الطلب، تتم إعادة المبلغ إلى وسيلة الدفع الأصلية أو بالطريقة المتاحة، وقد تحتاج العملية عدة أيام عمل من طرف البنك أو مزود الدفع.</p>
              </section>
              <section className="rounded-xl bg-muted/60 p-4 text-sm">
                <p>للمساعدة، تواصل معنا مع ذكر رقم الطلب وتفاصيل المشكلة. لا تتردد في الاطلاع على <Link href="/policies" className="font-bold text-primary hover:underline">مركز سياسات المتجر</Link> لبقية السياسات.</p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
