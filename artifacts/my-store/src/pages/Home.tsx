import { Link } from 'wouter';
import { useListCategories, useListFeaturedProducts } from '@workspace/api-client-react';
import { ShieldCheck, Truck, HeadphonesIcon, ArrowLeft } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: featuredProducts, isLoading: isLoadingFeatured } = useListFeaturedProducts();

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/55 to-black/10"></div>
        
        <div className="container relative z-10 mx-auto px-4 py-24 md:py-32 lg:py-40 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 space-y-8">
            <div className="inline-flex items-center rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
              <span className="flex h-2 w-2 rounded-full bg-secondary mr-2"></span>
              وجهتك الموثوقة للتسوق
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1]">
              تسوق بذكاء، <br/>
              <span className="text-secondary">جودة تستحق ثقتك</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
              نوفر لك تشكيلة منتقاة بعناية من أفضل المنتجات لمنزلك، تقنياتك، وسيارتك. تسوق الآن واستمتع بتجربة استثنائية.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button asChild size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg h-14 px-8 rounded-full">
                <Link href="/products">تصفح المنتجات</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/20 text-primary hover:bg-primary-foreground/10 hover:text-primary-foreground font-bold text-lg h-14 px-8 rounded-full">
                <Link href="/category/tech-products">أحدث التقنيات</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="bg-background py-12 border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">جودة مضمونة</h3>
                <p className="text-muted-foreground text-sm mt-1">منتجات أصلية 100% ومختارة بعناية</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Truck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">شحن سريع وآمن</h3>
                <p className="text-muted-foreground text-sm mt-1">توصيل لجميع مناطق المملكة</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                <HeadphonesIcon className="h-8 w-8" />
              </div>
              <div>
                <h3 className="font-bold text-lg">دعم فني متميز</h3>
                <p className="text-muted-foreground text-sm mt-1">متواجدون لخدمتك على مدار الساعة</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-3">تسوق حسب الفئة</h2>
              <p className="text-muted-foreground">اكتشف مجموعتنا المتنوعة من المنتجات</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingCategories ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
              ))
            ) : categories ? (
              categories.map((category) => (
                <Link key={category.id} href={`/category/${category.slug}`} className="group relative overflow-hidden rounded-3xl aspect-[4/5] flex flex-col justify-end p-6">
                  <div className="absolute inset-0 bg-muted">
                    <img 
                      src={category.image || `https://placehold.co/600x800/1e293b/d4af37?text=${encodeURIComponent(category.name)}`} 
                      alt={category.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10"></div>
                  <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-2">
                    <h3 className="text-2xl font-bold text-white mb-2">{category.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-foreground/80 text-sm font-medium">{category.productCount} منتج</span>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : null}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-black text-foreground mb-3">منتجات مميزة</h2>
              <p className="text-muted-foreground">أفضل الاختيارات الموصى بها لك</p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:flex text-primary hover:text-primary hover:bg-primary/5 font-bold">
              <Link href="/products">
                عرض الكل <ArrowLeft className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoadingFeatured ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[400px] rounded-2xl" />
              ))
            ) : featuredProducts ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : null}
          </div>
          
          <div className="mt-10 sm:hidden flex justify-center">
             <Button asChild variant="outline" className="w-full font-bold">
              <Link href="/products">
                عرض كل المنتجات
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
