import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('id') || params.get('payment_id');
    const orderNum = params.get('orderNumber') || params.get('order_number') || '';
    setOrderNumber(orderNum);

    if (!paymentId) {
      setStatus('failed');
      return;
    }

    // Call backend to verify and redirect
    fetch(`/api/payments/callback?id=${encodeURIComponent(paymentId)}&orderNumber=${encodeURIComponent(orderNum)}`, {
      redirect: 'manual',
    })
      .then(async (r) => {
        if (r.status === 0 || r.type === 'opaqueredirect') {
          // Follow redirect manually
          const text = await r.text?.();
          void text;
          // Just check the home page for payment status
          const homeParams = new URLSearchParams(window.location.search);
          const s = homeParams.get('payment');
          setStatus(s === 'success' ? 'success' : 'failed');
        } else if (r.ok) {
          const data = (await r.json()) as { status: string; orderNumber: string };
          setStatus(data.status === 'paid' ? 'success' : 'failed');
          if (data.orderNumber) setOrderNumber(data.orderNumber);
        } else {
          setStatus('failed');
        }
      })
      .catch(() => setStatus('failed'));
  }, []);

  // Also handle redirect from home page with ?payment=... param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    const orderNum = params.get('orderNumber') || '';
    if (payment === 'success' || payment === 'failed') {
      setStatus(payment === 'success' ? 'success' : 'failed');
      if (orderNum) setOrderNumber(orderNum);
    }
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
      <div className="min-h-[60vh] flex items-center justify-center container px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-14 w-14 text-green-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black">تم الدفع بنجاح!</h1>
            <p className="text-muted-foreground text-lg">تم تأكيد طلبك وسيتم معالجته قريباً</p>
            {orderNumber && (
              <p className="font-bold text-primary text-lg">رقم الطلب: #{orderNumber}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {orderNumber && (
              <Button asChild size="lg" className="rounded-xl font-bold">
                <Link href={`/my-orders/${orderNumber}`}>تتبع الطلب</Link>
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

  return (
    <div className="min-h-[60vh] flex items-center justify-center container px-4">
      <div className="max-w-md w-full text-center space-y-6">
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
