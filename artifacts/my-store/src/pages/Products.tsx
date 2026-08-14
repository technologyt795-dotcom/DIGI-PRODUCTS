import { useState, useEffect } from 'react';
import { useListProducts, useListCategories } from '@workspace/api-client-react';
import { ProductCard } from '@/components/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocation } from 'wouter';
import { Search, SlidersHorizontal } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export default function Products() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialSearch = searchParams.get('search') || '';
  
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<'newest'|'price_asc'|'price_desc'|'rating'>('newest');
  const { settings } = useStoreSettings();

  // Simple debounce for search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts({
    search: debouncedSearch,
    categorySlug: selectedCategory,
    sort
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <SEO
        title="المنتجات الرقمية"
        description="تصفح أفضل المنتجات الرقمية الأصلية من Digl Products، واختر حلولًا عملية بأسعار ذكية مع تحميل فوري."
        path="/products"
        image={settings?.heroBgImage || settings?.logoUrl}
      />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground mb-4">كل المنتجات</h1>
          <p className="text-muted-foreground text-lg">تصفح مجموعتنا الكاملة من المنتجات المختارة بعناية</p>
        </div>
        <div className="w-full md:w-auto relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="ابحث عن منتج..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 h-12 rounded-xl border border-border bg-card pr-12 pl-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border/50">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-lg">تصفية النتائج</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-4 text-foreground">الفئات</h4>
                <div className="space-y-3">
                  <button 
                    onClick={() => setSelectedCategory(undefined)}
                    className={`flex items-center w-full text-sm font-medium transition-colors ${!selectedCategory ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ml-3 ${!selectedCategory ? 'border-primary' : 'border-muted-foreground'}`}>
                      {!selectedCategory && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    الكل
                  </button>
                  {categories?.map(c => (
                    <button 
                      key={c.id}
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`flex items-center w-full text-sm font-medium transition-colors ${selectedCategory === c.slug ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ml-3 ${selectedCategory === c.slug ? 'border-primary' : 'border-muted-foreground'}`}>
                        {selectedCategory === c.slug && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {c.name}
                      <span className="mr-auto text-xs opacity-60">({c.productCount})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold mb-4 text-foreground">الترتيب</h4>
                <div className="space-y-3">
                  {[
                    { value: 'newest', label: 'الأحدث' },
                    { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
                    { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
                    { value: 'rating', label: 'الأعلى تقييماً' },
                  ].map(option => (
                    <button 
                      key={option.value}
                      onClick={() => setSort(option.value as any)}
                      className={`flex items-center w-full text-sm font-medium transition-colors ${sort === option.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ml-3 ${sort === option.value ? 'border-primary' : 'border-muted-foreground'}`}>
                        {sort === option.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-[400px] rounded-2xl" />
              ))}
            </div>
          ) : products?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-card rounded-2xl border border-border border-dashed">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">لم نتمكن من العثور على منتجات تطابق بحثك.</p>
              <button 
                onClick={() => { setSearch(''); setSelectedCategory(undefined); }}
                className="mt-4 text-primary font-bold hover:underline"
              >
                مسح عوامل التصفية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
