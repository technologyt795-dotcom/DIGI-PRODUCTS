import { useRoute } from 'wouter';
import { useGetCategory, useListProducts, getGetCategoryQueryKey, getListProductsQueryKey } from '@workspace/api-client-react';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

export default function Category() {
  const [, params] = useRoute('/category/:slug');
  const slug = params?.slug || '';

  const { data: category, isLoading: isLoadingCategory } = useGetCategory(slug, {
    query: { enabled: !!slug, queryKey: getGetCategoryQueryKey(slug) }
  });

  const { data: products, isLoading: isLoadingProducts } = useListProducts({
    categorySlug: slug
  }, {
    query: { enabled: !!slug, queryKey: getListProductsQueryKey({ categorySlug: slug }) }
  });

  if (isLoadingCategory) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-[300px] w-full rounded-3xl mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold mb-4">الفئة غير موجودة</h1>
        <p className="text-muted-foreground mb-8">عذراً، لم نتمكن من العثور على الفئة المطلوبة.</p>
        <Link href="/products" className="text-primary font-bold hover:underline">
          تصفح كل المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Category Header */}
      <div className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0 bg-primary">
          <img 
            src={category.image || `https://placehold.co/1200x400/1e293b/d4af37?text=${encodeURIComponent(category.name)}`}
            alt={category.name}
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent"></div>
        <div className="container relative z-10 mx-auto px-4 text-center text-white pt-16">
          <div className="flex items-center justify-center gap-2 text-sm text-white/70 mb-4">
            <Link href="/" className="hover:text-white transition-colors">الرئيسية</Link>
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span>الفئات</span>
            <ChevronRight className="h-4 w-4 rotate-180" />
            <span className="text-secondary font-medium">{category.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">{category.name}</h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            {category.description}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4">
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-3xl border border-border border-dashed">
            <h3 className="text-2xl font-bold mb-2">لا توجد منتجات حالياً</h3>
            <p className="text-muted-foreground">سنقوم بإضافة منتجات لهذه الفئة قريباً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
