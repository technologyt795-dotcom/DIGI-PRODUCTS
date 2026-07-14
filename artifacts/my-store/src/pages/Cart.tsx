import { Link } from 'wouter';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, totalPrice, clearCart } = useCart();

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
      <h1 className="text-4xl font-black mb-10">سلة المشتريات</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cart Items */}
        <div className="flex-1 space-y-6">
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="hidden sm:grid grid-cols-12 gap-4 p-6 bg-muted/30 border-b border-border text-sm font-bold text-muted-foreground">
              <div className="col-span-6">المنتج</div>
              <div className="col-span-2 text-center">السعر</div>
              <div className="col-span-2 text-center">الكمية</div>
              <div className="col-span-2 text-left pl-4">المجموع</div>
            </div>
            
            <div className="divide-y divide-border">
              {items.map((item) => (
                <div key={item.product.id} className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  {/* Product Info */}
                  <div className="col-span-1 sm:col-span-6 flex items-center gap-4">
                    <Link href={`/product/${item.product.id}`} className="shrink-0">
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted border border-border/50">
                        <img 
                          src={item.product.images[0]} 
                          alt={item.product.name} 
                          className="w-full h-full object-cover hover:scale-110 transition-transform"
                        />
                      </div>
                    </Link>
                    <div className="flex flex-col flex-1">
                      <Link href={`/category/${item.product.categorySlug}`} className="text-xs text-muted-foreground hover:text-primary mb-1 transition-colors">
                        {item.product.categoryName}
                      </Link>
                      <Link href={`/product/${item.product.id}`} className="font-bold text-foreground hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {item.product.name}
                      </Link>
                      
                      {/* Mobile Price & Total */}
                      <div className="sm:hidden mt-2 flex items-center justify-between">
                        <span className="font-bold text-primary">{formatPrice(item.product.price)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Price */}
                  <div className="hidden sm:block col-span-2 text-center font-bold text-foreground/80">
                    {formatPrice(item.product.price)}
                  </div>
                  
                  {/* Quantity Controls */}
                  <div className="col-span-1 sm:col-span-2 flex justify-center">
                    <div className="flex items-center border border-border rounded-lg bg-background w-32 h-10">
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <div className="flex-1 h-full flex items-center justify-center font-bold text-sm border-x border-border">
                        {item.quantity}
                      </div>
                      <button 
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-10 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Total & Remove */}
                  <div className="hidden sm:flex col-span-2 items-center justify-end gap-4 pl-2">
                    <span className="font-bold text-lg text-primary">{formatPrice(item.product.price * item.quantity)}</span>
                    <button 
                      onClick={() => removeItem(item.product.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/10"
                      aria-label="إزالة المنتج"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                  
                  {/* Mobile Remove */}
                  <div className="sm:hidden flex justify-end w-full border-t border-border/50 pt-4 mt-2">
                     <button 
                      onClick={() => removeItem(item.product.id)}
                      className="text-destructive font-bold text-sm flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> إزالة
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 bg-muted/20 border-t border-border flex justify-between items-center">
              <Button variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={clearCart}>
                إفراغ السلة
              </Button>
              <Button asChild variant="outline" className="font-bold">
                <Link href="/products">متابعة التسوق <ArrowLeft className="mr-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-96 shrink-0">
          <div className="bg-card border border-border rounded-3xl p-8 sticky top-28 shadow-sm">
            <h2 className="text-2xl font-black mb-6 border-b border-border pb-4">ملخص الطلب</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الشحن</span>
                <span className="font-bold text-foreground">مجاني</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>الضريبة (15%)</span>
                <span className="font-bold text-foreground">{formatPrice(totalPrice * 0.15)}</span>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mb-8 flex justify-between items-end">
              <div>
                <span className="block text-sm text-muted-foreground mb-1">الإجمالي الكلي</span>
                <span className="text-xs text-muted-foreground">شامل ضريبة القيمة المضافة</span>
              </div>
              <span className="text-3xl font-black text-primary">{formatPrice(totalPrice * 1.15)}</span>
            </div>
            
            <Button size="lg" className="w-full h-14 text-lg font-bold rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-md">
              إتمام الطلب
            </Button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Lock className="h-4 w-4" />
              <span>دفع آمن ومشفر 100%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
