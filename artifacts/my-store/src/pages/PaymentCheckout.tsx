import { useEffect, useRef, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import { SEO } from '@/components/SEO';

// Augment window for Moyasar
declare global {
  interface Window {
    Moyasar: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

function useQuery() {
  return new URLSearchParams(window.location.search);
}

export default function PaymentCheckout() {
  const [, setLocation] = useLocation();
  const query = useQuery();
  const orderNumber = query.get('orderNumber') || '';
  const totalRaw = query.get('total') || '0';
  const total = parseFloat(totalRaw);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const initDoneRef = useRef(false);

  const [publishableKey, setPublishableKey] = useState<string>('');

  // Fetch publishable key from backend
  useEffect(() => {
    fetch('/api/payments/config')
      .then(r => r.json())
      .then((d: { publishableKey: string }) => setPublishableKey(d.publishableKey))
      .catch(() => {});
  }, []);

  // Load Moyasar.js CSS + JS from CDN
  useEffect(() => {
    if (!orderNumber) return;

    // CSS
    const existingLink = document.getElementById('moyasar-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'moyasar-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.css';
      document.head.appendChild(link);
    }

    // JS
    const existingScript = document.getElementById('moyasar-js');
    if (existingScript) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = 'moyasar-js';
    script.src = 'https://cdn.moyasar.com/mpf/1.14.0/moyasar.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);

    return () => {
      // Don't remove — may be used again
    };
  }, [orderNumber]);

  // Init Moyasar form after script loads AND publishable key is ready
  useEffect(() => {
    if (!scriptLoaded || initDoneRef.current || !formRef.current) return;
    if (!window.Moyasar) return;
    if (!publishableKey) return; // wait for key before init
    initDoneRef.current = true;

    // The order number is verified server-side from Moyasar metadata. Keeping
    // the callback URL query-free prevents ambiguous query-string handling by 3DS redirects.
    const callbackUrl =
      `${window.location.origin}${import.meta.env.BASE_URL}payment-callback`;

    window.Moyasar.init({
      element: '.mysr-form',
      amount: Math.round(total * 100), // halalas
      currency: 'SAR',
      description: `طلب رقم ${orderNumber}`,
      publishable_api_key: publishableKey || '',
      callback_url: callbackUrl,
      methods: ['creditcard', 'applepay', 'stcpay'],
      apple_pay: {
        country: 'SA',
        label: `طلب ${orderNumber}`,
        validate_merchant_url: 'https://api.moyasar.com/v1/applepay/initiate',
      },
    });
  }, [scriptLoaded, orderNumber, total, publishableKey]);

  if (!orderNumber || !total) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <SEO
          title="إتمام الدفع"
          description="أكمل عملية الدفع بأمان لإتمام طلبك."
          path="/payment-checkout"
          noIndex
        />
        <p className="text-muted-foreground text-lg mb-6">رابط الدفع غير صالح</p>
        <Button asChild><Link href="/cart">العودة للسلة</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-xl" dir="rtl">
      <SEO
        title="إتمام الدفع"
        description="أكمل عملية الدفع بأمان لإتمام طلبك."
        path="/payment-checkout"
        noIndex
      />
      <div className="mb-8">
        <Button variant="ghost" size="sm" className="gap-2 mb-4" asChild>
          <Link href="/cart"><ArrowRight className="h-4 w-4" /> العودة</Link>
        </Button>
        <h1 className="text-3xl font-black">إتمام الدفع</h1>
        <p className="text-muted-foreground mt-1">رقم الطلب: <span className="font-bold text-foreground">#{orderNumber}</span></p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex justify-between items-center">
        <span className="text-muted-foreground font-medium">إجمالي الطلب</span>
        <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
      </div>

      {scriptError && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-center text-destructive font-medium mb-4">
          تعذر تحميل نموذج الدفع. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.
        </div>
      )}

      {!scriptLoaded && !scriptError && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل نموذج الدفع...</p>
        </div>
      )}

      {/* Moyasar form mounts here */}
      <div
        className="mysr-form"
        ref={formRef}
        style={{ display: scriptLoaded ? 'block' : 'none' }}
      />

      <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
        <ShieldCheck className="h-4 w-4" />
        <span>جميع المعاملات محمية بتشفير SSL</span>
      </div>
    </div>
  );
}
