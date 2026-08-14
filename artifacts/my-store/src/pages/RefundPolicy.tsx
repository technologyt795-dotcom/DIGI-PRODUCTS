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
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لم تُضَف سياسة الاسترجاع بعد.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
