import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle, XCircle, Loader2, Download, ExternalLink, Package, AlertCircle, CreditCard, RefreshCw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

type DigitalItem = {
  idx: number;
  name: string;
  downloadUrls: string[];
  downloadLabels: string[];
  productUrl: string | null;
};

// Map Moyasar/bank error messages to Arabic
const ERROR_TRANSLATIONS: Record<string, { ar: string; hint: string; icon: string }> = {
  'insufficient funds':          { ar: 'رصيد غير كافٍ',                    hint: 'تأكد من وجود رصيد كافٍ في بطاقتك أو جرّب بطاقة أخرى.',           icon: '💳' },
  'insufficient balance':        { ar: 'رصيد غير كافٍ',                    hint: 'تأكد من وجود رصيد كافٍ في بطاقتك أو جرّب بطاقة أخرى.',           icon: '💳' },
  'do not honor':                { ar: 'رُفض الطلب من البنك',              hint: 'تواصل مع بنكك للاستفسار، أو جرّب بطاقة أخرى.',                   icon: '🏦' },
  'card declined':               { ar: 'تم رفض البطاقة',                   hint: 'تواصل مع بنكك أو جرّب وسيلة دفع أخرى.',                          icon: '🚫' },
  'invalid card number':         { ar: 'رقم البطاقة غير صحيح',            hint: 'تحقق من رقم البطاقة وأعد المحاولة.',                              icon: '🔢' },
  'invalid card':                { ar: 'بيانات البطاقة غير صحيحة',        hint: 'تحقق من جميع بيانات البطاقة وأعد المحاولة.',                     icon: '🔢' },
  'expired card':                { ar: 'البطاقة منتهية الصلاحية',         hint: 'استخدم بطاقة سارية المفعول.',                                    icon: '📅' },
  'wrong cvv':                   { ar: 'رمز CVV غير صحيح',                 hint: 'تحقق من الرقم المكوّن من 3 أرقام خلف البطاقة.',                  icon: '🔐' },
  'cvv mismatch':                { ar: 'رمز CVV غير صحيح',                 hint: 'تحقق من الرقم المكوّن من 3 أرقام خلف البطاقة.',                  icon: '🔐' },
  'invalid cvv':                 { ar: 'رمز CVV غير صحيح',                 hint: 'تحقق من الرقم المكوّن من 3 أرقام خلف البطاقة.',                  icon: '🔐' },
  'restricted card':             { ar: 'البطاقة مقيدة',                   hint: 'البطاقة مقيدة من قِبل البنك. تواصل معهم أو جرّب بطاقة أخرى.',    icon: '🔒' },
  'transaction not permitted':   { ar: 'العملية غير مسموح بها',           hint: 'بنكك لا يسمح بهذا النوع من المعاملات. تواصل معهم.',              icon: '⛔' },
  'exceeds withdrawal':          { ar: 'تجاوزت الحد المسموح به',          hint: 'تجاوزت حد السحب اليومي. جرّب غداً أو بطاقة أخرى.',              icon: '📊' },
  '3ds':                         { ar: 'فشل التحقق الثنائي (3D Secure)', hint: 'لم تكتمل عملية التحقق. أعد المحاولة وتأكد من إدخال رمز OTP.', icon: '📱' },
  'authentication failed':       { ar: 'فشل التحقق الثنائي (3D Secure)', hint: 'لم تكتمل عملية التحقق. أعد المحاولة وتأكد من إدخال رمز OTP.', icon: '📱' },
  'timeout':                     { ar: 'انتهت مهلة العملية',              hint: 'استغرقت العملية وقتاً طويلاً. أعد المحاولة.',                    icon: '⏱️' },
  'connection':                  { ar: 'خطأ في الاتصال',                  hint: 'تحقق من اتصالك بالإنترنت وأعد المحاولة.',                        icon: '🌐' },
};

function translateError(msg: string): { ar: string; hint: string; icon: string } | null {
  if (!msg) return null;
  const lower = msg.toLowerCase();
  for (const [key, val] of Object.entries(ERROR_TRANSLATIONS)) {
    if (lower.includes(key)) return val;
  }
  return null;
}

export default function PaymentCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderNumber, setOrderNumber] = useState('');
  const [digitalItems, setDigitalItems] = useState<DigitalItem[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(false);
  const [failureMessage, setFailureMessage] = useState<string | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);

  // Let the customer see an explicit success confirmation before taking them to
  // the invoice page. The manual invoice button remains available immediately.
  useEffect(() => {
    if (status !== 'success' || !orderNumber) {
      setRedirectCountdown(null);
      return;
    }

    const redirectAfterSeconds = 5;
    setRedirectCountdown(redirectAfterSeconds);
    const interval = window.setInterval(() => {
      setRedirectCountdown((current) =>
        current !== null && current > 1 ? current - 1 : current,
      );
    }, 1000);
    const redirectTimer = window.setTimeout(() => {
      // Use a full navigation here rather than an in-app route update. The
      // payment callback can be restored after a 3DS return, and a direct
      // navigation reliably opens the protected invoice page in that case.
      window.sessionStorage.setItem(`my-store-paid-invoice:${orderNumber}`, '1');
      window.location.assign(`/my-orders/${encodeURIComponent(orderNumber)}`);
    }, redirectAfterSeconds * 1000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirectTimer);
    };
  }, [status, orderNumber]);

  // Fetch download links after confirmed payment
  async function fetchDownloads(orderNum: string) {
    if (!orderNum) return;
    setLoadingDownloads(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderNum)}/downloads`);
      if (res.ok) {
        const data = (await res.json()) as { hasDigital: boolean; items: DigitalItem[] };
        if (data.hasDigital) setDigitalItems(data.items);
      }
    } catch {
      // silently ignore — downloads are also available in order detail
    } finally {
      setLoadingDownloads(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Case 1: arrived here after Moyasar redirect with ?payment=success/failed
    const directPayment = params.get('payment');
    if (directPayment === 'success' || directPayment === 'failed') {
      const orderNum = params.get('orderNumber') || '';
      setOrderNumber(orderNum);
      setStatus(directPayment === 'success' ? 'success' : 'failed');
      // Moyasar may also pass ?message= in the redirect URL
      const msg = params.get('message') || params.get('error') || null;
      if (msg) setFailureMessage(msg);
      if (directPayment === 'success') fetchDownloads(orderNum);
      return;
    }

    // Case 2: Moyasar redirected with ?id=PAYMENT_ID (standard flow)
    const paymentId = params.get('id') || params.get('payment_id');
    const orderNum = params.get('orderNumber') || params.get('order_number') || '';
    // Moyasar sometimes passes the message directly in the callback URL too
    const urlMessage = params.get('message') || params.get('error') || null;
    setOrderNumber(orderNum);

    if (!paymentId) {
      setStatus('failed');
      if (urlMessage) setFailureMessage(urlMessage);
      return;
    }

    // Verify the final payment state. Moyasar may return from 3DS while the
    // payment is still being finalized, so retry a short, bounded number of times.
    let retryTimer: number | undefined;
    let cancelled = false;
    let attempts = 0;
    const maxVerificationAttempts = 8;

    const verifyPayment = async (): Promise<void> => {
      try {
        const response = await fetch(
          `/api/payments/callback?id=${encodeURIComponent(paymentId)}&orderNumber=${encodeURIComponent(orderNum)}`,
        );
        const data = (await response.json()) as {
          status: string;
          orderNumber: string;
          failureMessage?: string;
          failureCode?: string;
        };
        const resolvedOrder = data.orderNumber || orderNum;
        setOrderNumber(resolvedOrder);

        if (data.status === 'pending' && attempts < maxVerificationAttempts) {
          attempts += 1;
          retryTimer = window.setTimeout(() => {
            if (!cancelled) void verifyPayment();
          }, 1500);
          return;
        }

        const isPaid = data.status === 'paid';
        setStatus(isPaid ? 'success' : 'failed');
        if (!isPaid) {
          setFailureMessage(
            data.status === 'pending'
              ? 'تعذر تأكيد الدفع تلقائياً. تحقق من حالة طلبك قبل إعادة المحاولة.'
              : data.failureMessage || urlMessage,
          );
        }
        if (isPaid) await fetchDownloads(resolvedOrder);
      } catch {
        setStatus('failed');
        if (urlMessage) setFailureMessage(urlMessage);
      }
    };

    void verifyPayment();
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <SEO
          title="حالة الدفع والطلب"
          description="تحقق من حالة عملية الدفع واطّلع على تفاصيل طلبك."
          path="/payment-callback"
          noIndex
        />
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
          <p className="text-xl font-bold">جاري التحقق من الدفع...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center container px-4 py-12">
        <SEO
          title="حالة الدفع والطلب"
          description="تحقق من حالة عملية الدفع واطّلع على تفاصيل طلبك."
          path="/payment-callback"
          noIndex
        />
        <div className="max-w-lg w-full text-center space-y-6" dir="rtl">
          {/* Success icon */}
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-14 w-14 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black">تم الدفع بنجاح!</h1>
            <p className="text-muted-foreground text-lg">
              {digitalItems.length > 0
                ? 'ملفاتك جاهزة للتحميل الآن'
                : 'تم تأكيد طلبك وسيتم معالجته قريباً'}
            </p>
            {redirectCountdown !== null && (
              <div
                role="status"
                className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
              >
                تم الدفع بنجاح. سيتم توجيهك إلى صفحة الفاتورة خلال {redirectCountdown} ثوانٍ.
              </div>
            )}
            {orderNumber && (
              <p className="font-bold text-primary text-lg">رقم الطلب: #{orderNumber}</p>
            )}
          </div>

          {/* Digital downloads — shown immediately if order has digital products */}
          {loadingDownloads && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>جاري تحضير ملفاتك...</span>
            </div>
          )}

          {digitalItems.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 text-right space-y-4">
              <div className="flex items-center gap-2 font-bold text-base">
                <Download className="h-5 w-5 text-primary" />
                <span>ملفاتك جاهزة للتحميل</span>
              </div>

              <div className="space-y-4">
                {digitalItems.map((item) => (
                  <div key={item.idx} className="space-y-2">
                    <p className="text-sm font-semibold text-muted-foreground">{item.name}</p>

                    {/* File download buttons */}
                    {item.downloadUrls.map((url, fIdx) => {
                      if (!url) return null;
                      const label = item.downloadLabels[fIdx] || `ملف ${fIdx + 1}`;
                      return (
                        <a
                          key={fIdx}
                          href={url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 transition-opacity mr-2"
                        >
                          <Download className="h-4 w-4" />
                          {label}
                        </a>
                      );
                    })}

                    {/* Product URL link */}
                    {item.productUrl && (
                      <a
                        href={item.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary/5 transition-colors mr-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        فتح المنتج
                      </a>
                    )}
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground pt-1">
                يمكنك دائماً إعادة التحميل من صفحة طلباتي
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {orderNumber && (
              <Button asChild size="lg" className="rounded-xl font-bold">
                <Link
                  href={`/my-orders/${orderNumber}`}
                  onClick={() => window.sessionStorage.setItem(`my-store-paid-invoice:${orderNumber}`, '1')}
                >
                  <Package className="h-4 w-4 ml-2" />
                  {digitalItems.length > 0 ? 'عرض الفاتورة والمرفقات' : 'عرض الفاتورة'}
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
              <Link href="/">العودة للرئيسية</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Failed state
  const translated = failureMessage ? translateError(failureMessage) : null;

  return (
    <div className="min-h-[60vh] flex items-center justify-center container px-4 py-12">
      <SEO
        title="حالة الدفع والطلب"
        description="تحقق من حالة عملية الدفع واطّلع على تفاصيل طلبك."
        path="/payment-callback"
        noIndex
      />
      <div className="max-w-md w-full text-center space-y-6" dir="rtl">
        {/* Icon */}
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-14 w-14 text-red-500" />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black">فشل الدفع</h1>
          <p className="text-muted-foreground">لم تتم عملية الدفع بنجاح</p>
          {orderNumber && (
            <p className="font-semibold text-muted-foreground text-sm">رقم الطلب: #{orderNumber}</p>
          )}
        </div>

        {/* Error reason card */}
        {failureMessage && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-right space-y-3">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="font-bold text-base">سبب الرفض</span>
            </div>

            {/* Translated reason */}
            <div className="space-y-1">
              <p className="font-bold text-red-800 text-lg">
                {translated ? `${translated.icon} ${translated.ar}` : failureMessage}
              </p>
              {translated && (
                <p className="text-sm text-red-700">{translated.hint}</p>
              )}
              {/* Show original message if no translation found */}
              {!translated && (
                <p className="text-xs text-red-500 font-mono bg-red-100 rounded-lg px-3 py-1.5 inline-block">
                  {failureMessage}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generic tips when no specific reason */}
        {!failureMessage && (
          <div className="bg-muted/50 border border-border rounded-2xl p-5 text-right space-y-3">
            <p className="font-bold flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              أسباب شائعة لفشل الدفع:
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><span>•</span>رصيد غير كافٍ في البطاقة</li>
              <li className="flex items-start gap-2"><span>•</span>بيانات البطاقة غير صحيحة (الرقم، تاريخ الانتهاء، CVV)</li>
              <li className="flex items-start gap-2"><span>•</span>البطاقة غير مفعّلة للمدفوعات الإلكترونية</li>
              <li className="flex items-start gap-2"><span>•</span>انتهاء مهلة رمز OTP</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl font-bold gap-2">
            <Link href="/cart">
              <RefreshCw className="h-4 w-4" />
              إعادة المحاولة
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl font-bold gap-2">
            <Link href="/">الرئيسية</Link>
          </Button>
        </div>

        {/* Support hint */}
        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
          <Phone className="h-3 w-3" />
          إذا استمرت المشكلة، تواصل مع دعم العملاء أو جرّب بطاقة أخرى
        </p>
      </div>
    </div>
  );
}
