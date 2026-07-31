import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle, XCircle, Loader2, Download, ExternalLink, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

type DigitalItem = {
  idx: number;
  name: string;
  downloadUrls: string[];
  downloadLabels: string[];
  productUrl: string | null;
};

export default function PaymentCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderNumber, setOrderNumber] = useState('');
  const [digitalItems, setDigitalItems] = useState<DigitalItem[]>([]);
  const [loadingDownloads, setLoadingDownloads] = useState(false);

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
      if (directPayment === 'success') fetchDownloads(orderNum);
      return;
    }

    // Case 2: Moyasar redirected with ?id=PAYMENT_ID (standard flow)
    const paymentId = params.get('id') || params.get('payment_id');
    const orderNum = params.get('orderNumber') || params.get('order_number') || '';
    setOrderNumber(orderNum);

    if (!paymentId) {
      setStatus('failed');
      return;
    }

    // Call backend to verify payment — backend returns JSON now
    fetch(
      `/api/payments/callback?id=${encodeURIComponent(paymentId)}&orderNumber=${encodeURIComponent(orderNum)}`,
    )
      .then(async (r) => {
        if (!r.ok) {
          setStatus('failed');
          return;
        }
        const data = (await r.json()) as { status: string; orderNumber: string };
        const resolvedOrder = data.orderNumber || orderNum;
        setOrderNumber(resolvedOrder);
        const isPaid = data.status === 'paid';
        setStatus(isPaid ? 'success' : 'failed');
        if (isPaid) await fetchDownloads(resolvedOrder);
      })
      .catch(() => setStatus('failed'));
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
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
                <Link href={`/my-orders/${orderNumber}`}>
                  <Package className="h-4 w-4 ml-2" />
                  {digitalItems.length > 0 ? 'تفاصيل الطلب' : 'تتبع الطلب'}
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
  return (
    <div className="min-h-[60vh] flex items-center justify-center container px-4">
      <div className="max-w-md w-full text-center space-y-6" dir="rtl">
        <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="h-14 w-14 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black">فشل الدفع</h1>
          <p className="text-muted-foreground text-lg">لم تتم عملية الدفع. يمكنك المحاولة مرة أخرى</p>
          {orderNumber && (
            <p className="font-bold text-muted-foreground">رقم الطلب: #{orderNumber}</p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg" className="rounded-xl font-bold">
            <Link href="/cart">العودة للسلة</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
            <Link href="/">الرئيسية</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
