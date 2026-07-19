import { Link } from 'wouter';
import { Product } from '@workspace/api-client-react';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Star } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
  };

  return (
    <Link href={`/product/${product.id}`} className="group flex flex-col bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        <img
          src={product.images[0] || 'https://placehold.co/400x600/e2e8f0/1e293b?text=Product'}
          alt={product.name}
          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.badge && (
          <div className="absolute top-3 right-3 bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            {product.badge}
          </div>
        )}
        {product.isNew && !product.badge && (
          <div className="absolute top-3 right-3 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">
            جديد
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs text-muted-foreground mb-2 font-medium">{product.categoryName}</div>
        <h3 className="font-bold text-foreground text-base mb-2 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-4 mt-auto">
          <Star className="h-4 w-4 fill-secondary text-secondary" />
          <span className="text-sm font-bold">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
          </div>
          
          <Button 
            size="icon" 
            variant="secondary" 
            className="h-10 w-10 rounded-xl hover:scale-105 transition-transform"
            onClick={handleAdd}
          >
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}
