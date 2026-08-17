import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingBag, Lock, Loader2, CheckCircle, Tag, MapPin, CreditCard, Truck, Phone, ShieldCheck, RefreshCw } from 'lucide-react';
import { useValidateDiscount, useCreateOrder } from '@workspace/api-client-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SEO } from '@/components/SEO';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

async function sendOtp(phone: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل إرسال الكود');
}

async function verifyOtp(phone: string, code: string): Promise<void> {
  const res = await fetch(`${BASE}/auth/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'الكود غير صحيح');
}

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const validateDiscount = useValidateDiscount();
  const createOrder = useCreateOrder();
  const { customer, isAuthenticated } = useCustomerAuth();

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'online'>('cash');
  const [policyAccepted, setPolicyAccepted] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pending order payload (saved before OTP step)
  const pendingPayloadRef = useRef<Parameters<typeof createOrder.mutateAsync>[0] | null>(null);

  // If every item in the cart is digital, cash on delivery makes no sense
  const allDigital = items.length > 0 && items.every(item => (item.product as any).isDigital === true);

  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    address: '',
    notes: ''
  });

  // Pre-fill form with logged-in customer data
  useEffect(() => {
    if (isAuthenticated && customer) {
      setForm(prev => ({
        ...prev,
        customerName: customer.name || prev.customerName,
        customerEmail: customer.email && !customer.email.endsWith('@phone.local')
          ? customer.email
          : prev.customerEmail,
        customerPhone: customer.phone || prev.customerPhone,
      }));
    }
  }, [isAuthenticated, customer]);

  // Force online payment when all items are digital
  useEffect(() => {
    if (allDigital) setPaymentMethod('online');
  }, [allDigital]);

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // No tax or shipping for all-digital orders — both are irrelevant/misleading
  const taxAmount = allDigital ? 0 : totalPrice * 0.15;
  const subtotalWithTax = totalPrice + taxAmount;
  const finalTotal = subtotalWithTax - (appliedDiscount?.amount || 0);

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    try {
      const res = await validateDiscount.mutateAsync({ data: { code: discountCode, orderTotal: subtotalWithTax } });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAppliedDiscount({ code: discountCode, amount: (res as any).discountAmount });
      toast.success('تم تطبيق كود الخصم بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'كود الخصم غير صالح');
      setAppliedDiscount(null);
    }
  };

  const startResendTimer = () => {
    setOtpResendTimer(60);
    timerRef.current = setInterval(() => {
      setOtpResendTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (phone: string) => {
    setOtpSending(true);
    try {
      await sendOtp(phone);
      setOtpStep(true);
      setOtpCode('');
      startResendTimer();
      toast.success(`تم إرسال كود التحقق إلى ${phone}`);
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال الكود');
    } finally {
      setOtpSending(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!policyAccepted) {
      toast.error('يرجى الموافقة على سياسات المتجر قبل إتمام الطلب');
      return;
    }

    const orderItems = items.map(item => ({
      productId: item.product.id,
      name: item.product.name,
      image: item.product.images[0] || '',
      price: item.product.price,
      quantity: item.quantity
    }));

    const payload = {
      data: {
        ...form,
        items: orderItems,
        discountCode: appliedDiscount?.code,
        paymentMethod,
      }
    };

    // If customer is already authenticated — skip OTP
    if (isAuthenticated) {
      await submitOrder(payload);
      return;
    }

    // Require OTP verification for guests
    pendingPayloadRef.current = payload;
    await handleSendOtp(form.customerPhone);
  };

  const submitOrder = async (payload: Parameters<typeof createOrder.mutateAsync>[0]) => {
    const res = await createOrder.mutateAsync(payload);
    clearCart();

    if (paymentMethod === 'online') {
      const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
      setLocation(`${baseUrl}/payment-checkout?orderNumber=${encodeURIComponent(res.orderNumber)}&total=${encodeURIComponent(finalTotal)}`);
    } else {
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">تم تأكيد طلبك بنجاح!</span>
          <span>رقم الطلب: #{res.orderNumber}</span>
        </div>,
        { duration: 5000 }
      );
      setLocation('/');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingPayloadRef.current) return;
    setOtpVerifying(true);
    try {
      await verifyOtp(form.customerPhone, otpCode);
      // OTP verified — submit the order
      await submitOrder(pendingPayloadRef.current);
    } catch (err: any) {
      toast.error(err.message || 'الكود غير صحيح');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendTimer > 0) return;
    await handleSendOtp(form.customerPhone);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24">
        <SEO
          title="سلة التسوق"
          description="راجع المنتجات التي اخترتها قبل إتمام الطلب."
          path="/cart"
          noIndex
        />
        <div className="max-w-md mx-auto text-center flex flex-col items-center">
          <div className="w-32 h-32 bg-muted/50 rounded-full flex items-center justify-center mb-8">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/50" />
          </div>
          <h1 className="text-3xl font-black mb-4">سلة المشتريات فارغة</h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            يبدو أنك لم تقم بإضافة أي منتجات إلى السلة بعد. تصفح منتجاتنا واكتشف ما يناسبك.
          </p>
          <Button asChild size="lg" className="h-14 px-8 text-lg font-bold rounded-full">
            <Link href="/products">تسوق الآن</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO
        title="سلة التسوق"
        description="راجع المنتجات التي اخترتها قبل إتمام الطلب."
        path="/cart"
        noIndex
      />
      <h1 className="text-4xl font-black mb-10">إتمام الشراء</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left Column: Cart Items & Form */}
        <div className="flex-1 space-y-10">

          {/* Cart Items Box */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="p-6 bg-muted/30 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> منتجات السلة</h2>
              <span className="text-muted-foreground font-medium">{items.length} منتجات</span>
            </div>

            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.product.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                  <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col flex-1">
                      <h3 className="font-bold text-foreground line-clamp-1">{item.product.name}</h3>
                      <span className="text-primary font-bold mt-1">{formatPrice(item.product.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
                    <div className="flex items-center border border-border rounded-lg bg-background w-28 h-9">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <div className="flex-1 h-full flex items-center justify-center font-bold text-sm border-x border-border">
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-8 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="font-bold w-20 text-left">
                      {formatPrice(item.product.price * item.quantity)}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checkout Form Box */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="h-5 w-5" /> بيانات التوصيل</h2>
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الكامل *</Label>
                  <Input required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="الاسم الأول والأخير" disabled={otpStep} />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input required value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="05xxxxxxxx" dir="ltr" className="text-right" disabled={otpStep} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني *</Label>
                <Input type="email" required value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="example@email.com" dir="ltr" className="text-right" disabled={otpStep} />
              </div>
              {!allDigital && (
                <div className="space-y-2">
                  <Label>عنوان التوصيل بالتفصيل *</Label>
                  <Textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="المدينة، الحي، الشارع، رقم المبنى" className="resize-none" rows={3} disabled={otpStep} />
                </div>
              )}
              <div className="space-y-2">
                <Label>ملاحظات إضافية (اختياري)</Label>
                <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="أي تعليمات خاصة للمندوب..." className="resize-none" rows={2} disabled={otpStep} />
              </div>
              <label className="flex items-start gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm leading-6">
                <input
                  type="checkbox"
                  checked={policyAccepted}
                  onChange={e => setPolicyAccepted(e.target.checked)}
                  disabled={otpStep}
                  required
                  className="mt-1 h-4 w-4 shrink-0 accent-primary"
                />
                <span>
                  أوافق على{' '}
                  <Link href="/policies/terms" className="font-bold text-primary hover:underline" target="_blank">
                    الشروط والأحكام
                  </Link>{' '}
                  و
                  <Link href="/refund-policy" className="font-bold text-primary hover:underline" target="_blank">
                    سياسة الاسترجاع
                  </Link>{' '}
                  و
                  <Link href="/policies/privacy" className="font-bold text-primary hover:underline" target="_blank">
                    سياسة الخصوصية
                  </Link>
                  .
                </span>
              </label>
            </form>
          </div>

          {/* OTP Verification Step */}
          {otpStep && (
            <div className="bg-card border-2 border-primary/30 rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 to-primary rounded-t-3xl" />
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold">التحقق من رقم الجوال</h2>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  تم إرسال كود التحقق المكون من 6 أرقام إلى
                </p>
                <p className="font-bold text-foreground mt-1 dir-ltr" dir="ltr">{form.customerPhone}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-xs mx-auto">
                <div className="space-y-2">
                  <Label className="text-center block">أدخل الكود</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="text-center text-2xl tracking-[0.5em] font-bold h-14"
                    dir="ltr"
                    autoFocus
                    required
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 font-bold"
                  disabled={otpVerifying || otpCode.length < 6}
                >
                  {otpVerifying ? (
                    <><Loader2 className="ml-2 h-4 w-4 animate-spin" /> جاري التحقق...</>
                  ) : (
                    <><ShieldCheck className="ml-2 h-4 w-4" /> تأكيد الكود</>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-2 text-sm">
                  {otpResendTimer > 0 ? (
                    <span className="text-muted-foreground">
                      إعادة الإرسال بعد <span className="font-bold text-foreground">{otpResendTimer}</span> ثانية
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpSending}
                      className="text-primary font-medium flex items-center gap-1.5 hover:underline disabled:opacity-50"
                    >
                      {otpSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      إعادة إرسال الكود
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => { setOtpStep(false); setOtpCode(''); }}
                  className="text-muted-foreground text-sm w-full text-center hover:text-foreground transition-colors"
                >
                  تعديل بيانات التوصيل
                </button>
              </form>
            </div>
          )}

          {/* Payment Method Selection */}
          {!otpStep && (
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm p-6 sm:p-8">
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2"><CreditCard className="h-5 w-5" /> طريقة الدفع</h2>

              {allDigital ? (
                <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-primary bg-primary/5">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">الدفع الإلكتروني</p>
                    <p className="text-sm text-muted-foreground">بطاقة بنكية · Apple Pay · STC Pay</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-primary mr-auto shrink-0" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center',
                      paymentMethod === 'cash'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                      paymentMethod === 'cash' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <Truck className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-base">الدفع عند الاستلام</p>
                      <p className="text-muted-foreground text-sm mt-0.5">ادفع نقداً عند استلام طلبك</p>
                    </div>
                    {paymentMethod === 'cash' && (
                      <CheckCircle className="h-5 w-5 text-primary absolute top-3 left-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('online')}
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center relative',
                      paymentMethod === 'online'
                        ? 'border-primary bg-primary/5 shadow-md'
                        : 'border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/60'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                      paymentMethod === 'online' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    )}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-base">الدفع الإلكتروني</p>
                      <p className="text-muted-foreground text-sm mt-0.5">بطاقة بنكية · Apple Pay · STC Pay</p>
                    </div>
                    {paymentMethod === 'online' && (
                      <CheckCircle className="h-5 w-5 text-primary absolute top-3 left-3" />
                    )}
                  </button>
                </div>
              )}

              {paymentMethod === 'online' && (
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                  <Lock className="h-4 w-4 shrink-0 text-primary" />
                  <span>سيتم توجيهك إلى بوابة ميسر الآمنة لإتمام عملية الدفع</span>
                </div>
              )}
              {allDigital && (
                <p className="mt-3 text-xs text-muted-foreground text-center">
                  🔒 المنتجات الرقمية تتطلب الدفع الإلكتروني — ستصلك روابط التحميل فور إتمام الدفع
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticky top-28 shadow-sm">
            <h2 className="text-xl font-black mb-6 border-b border-border pb-4">ملخص الطلب</h2>

            {/* Discount Code */}
            {!otpStep && (
              <div className="mb-6 space-y-3 pb-6 border-b border-border">
                <Label className="flex items-center gap-1.5"><Tag className="h-4 w-4" /> كود الخصم</Label>
                <div className="flex gap-2">
                  <Input
                    value={discountCode}
                    onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود"
                    dir="ltr"
                    disabled={!!appliedDiscount || validateDiscount.isPending}
                    className="font-bold text-center uppercase"
                  />
                  {!appliedDiscount ? (
                    <Button variant="secondary" onClick={handleApplyDiscount} disabled={!discountCode || validateDiscount.isPending}>
                      {validateDiscount.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                    </Button>
                  ) : (
                    <Button variant="outline" className="text-destructive border-destructive/50 hover:bg-destructive/10" onClick={() => { setAppliedDiscount(null); setDiscountCode(''); }}>
                      إلغاء
                    </Button>
                  )}
                </div>
                {appliedDiscount && (
                  <div className="text-sm text-green-600 font-medium flex items-center gap-1.5 mt-2">
                    <CheckCircle className="h-4 w-4" /> تم تطبيق خصم {formatPrice(appliedDiscount.amount)}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              {!allDigital && (
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>الشحن</span>
                  <span className="font-bold text-foreground">مجاني</span>
                </div>
              )}
              {!allDigital && (
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span className="font-bold text-foreground">{formatPrice(taxAmount)}</span>
                </div>
              )}
              {appliedDiscount && (
                <div className="flex justify-between text-green-600 text-sm font-medium">
                  <span>الخصم</span>
                  <span>-{formatPrice(appliedDiscount.amount)}</span>
                </div>
              )}
            </div>

            <div className="border-t border-border pt-6 mb-8 flex justify-between items-end">
              <span className="font-bold">الإجمالي الكلي</span>
              <span className="text-3xl font-black text-primary">{formatPrice(finalTotal)}</span>
            </div>

            {/* Submit button changes based on OTP step */}
            {otpStep ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 bg-primary/5 border border-primary/20 rounded-xl p-3 text-sm text-primary font-medium">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>أدخل كود التحقق لإتمام الطلب</span>
                </div>
              </div>
            ) : (
              <Button
                type="submit"
                form="checkout-form"
                size="lg"
                disabled={createOrder.isPending || otpSending}
                className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
              >
                {otpSending ? (
                  <><Loader2 className="ml-2 h-5 w-5 animate-spin" /> جاري الإرسال...</>
                ) : createOrder.isPending ? (
                  <><Loader2 className="ml-2 h-5 w-5 animate-spin" /></>
                ) : paymentMethod === 'online' ? (
                  <><CreditCard className="ml-2 h-5 w-5" /> المتابعة للدفع</>
                ) : (
                  'تأكيد الطلب'
                )}
              </Button>
            )}

            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              <span>{paymentMethod === 'online' ? 'دفع آمن عبر بوابة ميسر' : 'دفع آمن عند الاستلام'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
