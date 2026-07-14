import { useState } from 'react';
import { useRoute, Link } from 'wouter';
import { useGetProduct, useListRelatedProducts } from '@workspace/api-client-react';
import { useCart } from '@/hooks/use-cart';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductCard } from '@/components/ProductCard';
import { ChevronRight, Minus, Plus, ShoppingCart, Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react';

export default function ProductDetail() {
  const [, params] = useRoute('/product/:id');
  const id = params?.id ? parseInt(params.id, 10) : 0;

  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem } = useCart();

  const { data: product, isLoading } = useGetProduct(id, {
    query: { enabled: !!id }
  });

  const { data: relatedProducts, isLoading: isLoadingRelated } = useListRelatedProducts(id, {
    query: { enabled: !!id }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <Skeleton className="aspect-square rounded-3xl" />
          <div className="space-y-6 pt-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-14 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">المنتج غير موجود</h1>
        <p className="text-muted-foreground mb-8">عذراً، لم نتمكن من العثور على المنتج المطلوب.</p>
        <Button asChild>
          <Link href="/products">تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem(product, quantity);
  };

  const increaseQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  return (
    <div className="pb-24">
      <div className="bg-muted/30 border-b border-border/50 py-4 mb-8">
        <div className="container mx-auto px-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">الرئيسية</Link>
          <ChevronRight className="h-4 w-4 rotate-180" />
          <Link href={`/category/${product.categorySlug}`} className="hover:text-primary transition-colors">{product.categoryName}</Link>
          <ChevronRight className="h-4 w-4 rotate-180" />
          <span className="text-foreground font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-16 mb-24">
          
          {/* Images */}
          <div className="flex flex-col-reverse md:flex-row gap-4 h-full">
            <div className="flex md:flex-col gap-4 overflow-x-auto md:overflow-y-auto pb-2 md:pb-0 md:w-24 shrink-0 no-scrollbar">
              {product.images.map((img, idx) => (
                <button 
                  key={idx} 
                  onClick={() => setActiveImage(idx)}
                  className={`relative aspect-square w-20 md:w-full shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-primary ring-2 ring-primary/20 ring-offset-1' : 'border-transparent opacity-70 hover:opacity-100'}`}
                >
                  <img src={img} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover bg-muted" />
                </button>
              ))}
            </div>
            <div className="relative flex-1 aspect-square md:aspect-auto rounded-3xl overflow-hidden bg-muted/50 border border-border">
              <img 
                src={product.images[activeImage]} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <div className="absolute top-6 right-6 bg-secondary text-secondary-foreground text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                  {product.badge}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col py-4">
            <div className="mb-6">
              <Link href={`/category/${product.categorySlug}`} className="text-primary font-bold text-sm mb-2 inline-block hover:underline">
                {product.categoryName}
              </Link>
              <h1 className="text-3xl md:text-4xl font-black text-foreground mb-4 leading-tight">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded-lg">
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                  <span className="font-bold text-foreground">{product.rating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({product.reviewCount} تقييم)</span>
                </div>
                {product.stock > 0 ? (
                  <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg text-sm font-bold">متوفر في المخزون</span>
                ) : (
                  <span className="text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-sm font-bold">نفذت الكمية</span>
                )}
              </div>

              <div className="flex items-end gap-3 mb-8">
                <span className="text-4xl font-black text-primary">{formatPrice(product.price)}</span>
                {product.compareAtPrice && (
                  <span className="text-xl text-muted-foreground line-through mb-1">{formatPrice(product.compareAtPrice)}</span>
                )}
              </div>
              
              <p className="text-muted-foreground text-lg leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            </div>

            <div className="mt-auto space-y-8">
              <div className="flex items-center gap-6 p-6 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex items-center border border-border rounded-xl bg-background overflow-hidden h-14">
                  <button 
                    onClick={increaseQuantity}
                    disabled={quantity >= product.stock}
                    className="w-12 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <div className="w-12 h-full flex items-center justify-center font-bold text-lg border-x border-border">
                    {quantity}
                  </div>
                  <button 
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1}
                    className="w-12 h-full flex items-center justify-center hover:bg-muted text-foreground transition-colors disabled:opacity-50"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                </div>
                
                <Button 
                  size="lg" 
                  className="flex-1 h-14 text-lg font-bold rounded-xl shadow-md gap-3"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-6 w-6" />
                  إضافة للسلة
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">ضمان الجودة</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <Truck className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">شحن مجاني للطلبات فوق 500 ريال</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary shrink-0">
                    <RotateCcw className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">استرجاع خلال 14 يوم</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="pt-16 border-t border-border/50">
            <div className="flex items-end justify-between mb-10">
              <h2 className="text-3xl font-black text-foreground">منتجات ذات صلة</h2>
              <Button asChild variant="ghost" className="text-primary font-bold">
                <Link href={`/category/${product.categorySlug}`}>
                  عرض المزيد
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
