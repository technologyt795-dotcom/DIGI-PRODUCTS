import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Trash2, ShoppingBag, Lock, Loader2, CheckCircle, Tag, MapPin } from 'lucide-react';
import { useValidateDiscount, useCreateOrder } from '@workspace/api-client-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { toast } from 'sonner';

export default function Cart() {
  const [, setLocation] = useLocation();
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();
  const validateDiscount = useValidateDiscount();
  const createOrder = useCreateOrder();
  const { customer, isAuthenticated } = useCustomerAuth();

  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  
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

  const taxAmount = totalPrice * 0.15;
  const subtotalWithTax = totalPrice + taxAmount;
  const finalTotal = subtotalWithTax - (appliedDiscount?.amount || 0);

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    try {
      const res = await validateDiscount.mutateAsync({ data: { code: discountCode, orderTotal: subtotalWithTax } });
      setAppliedDiscount({ code: discountCode, amount: res.discountAmount });
      toast.success('تم تطبيق كود الخصم بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'كود الخصم غير صالح');
      setAppliedDiscount(null);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    
    try {
      const orderItems = items.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        image: item.product.images[0] || '',
        price: item.product.price,
        quantity: item.quantity
      }));

      const payload = {
        ...form,
        items: orderItems,
        discountCode: appliedDiscount?.code,
      };

      const res = await createOrder.mutateAsync({ data: payload });
      clearCart();
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">تم تأكيد طلبك بنجاح!</span>
          <span>رقم الطلب: #{res.orderNumber}</span>
        </div>,
        { duration: 5000 }
      );
      setLocation('/');
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء إتمام الطلب');
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24">
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
                  <Input required value={form.customerName} onChange={e => setForm({...form, customerName: e.target.value})} placeholder="الاسم الأول والأخير" />
                </div>
                <div className="space-y-2">
                  <Label>رقم الهاتف *</Label>
                  <Input required value={form.customerPhone} onChange={e => setForm({...form, customerPhone: e.target.value})} placeholder="05xxxxxxxx" dir="ltr" className="text-right" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني *</Label>
                <Input type="email" required value={form.customerEmail} onChange={e => setForm({...form, customerEmail: e.target.value})} placeholder="example@email.com" dir="ltr" className="text-right" />
              </div>
              <div className="space-y-2">
                <Label>عنوان التوصيل بالتفصيل *</Label>
                <Textarea required value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="المدينة، الحي، الشارع، رقم المبنى" className="resize-none" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات إضافية (اختياري)</Label>
                <Textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="أي تعليمات خاصة للمندوب..." className="resize-none" rows={2} />
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 sticky top-28 shadow-sm">
            <h2 className="text-xl font-black mb-6 border-b border-border pb-4">ملخص الطلب</h2>
            
            {/* Discount Code */}
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

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>الشحن</span>
                <span className="font-bold text-foreground">مجاني</span>
              </div>
              <div className="flex justify-between text-muted-foreground text-sm">
                <span>ضريبة القيمة المضافة (15%)</span>
                <span className="font-bold text-foreground">{formatPrice(taxAmount)}</span>
              </div>
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
            
            <Button 
              type="submit" 
              form="checkout-form"
              size="lg" 
              disabled={createOrder.isPending}
              className="w-full h-14 text-lg font-bold rounded-xl shadow-md"
            >
              {createOrder.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'تأكيد الطلب'}
            </Button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              <span>دفع آمن عند الاستلام</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
