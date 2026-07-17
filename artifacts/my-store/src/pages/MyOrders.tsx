import { Link, useLocation } from 'wouter';
import { Package, ChevronLeft, ShoppingBag } from 'lucide-react';
import { useListMyOrders } from '@workspace/api-client-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { useEffect } from 'react';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
  processing: { label: 'جاري التجهيز', variant: 'default' },
  shipped: { label: 'تم الشحن', variant: 'default' },
  delivered: { label: 'تم التسليم', variant: 'default' },
  cancelled: { label: 'ملغى', variant: 'destructive' },
};

export default function MyOrders() {
  const { isAuthenticated, isLoading: authLoading, token } = useCustomerAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: orders, isLoading } = useListMyOrders({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    query: { enabled: !!token },
  });

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
      <div className="flex items-center gap-3 mb-8">
        <Package className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">طلباتي</h1>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/40" />
          <h2 className="text-xl font-semibold text-muted-foreground">لا توجد طلبات بعد</h2>
          <p className="text-sm text-muted-foreground">ابدأ التسوق وستجد طلباتك هنا</p>
          <Button asChild className="mt-2">
            <Link href="/products">تصفح المنتجات</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = STATUS_MAP[order.status] ?? { label: order.status, variant: 'outline' as const };
            const date = new Date(order.createdAt).toLocaleDateString('ar-SA', {
              year: 'numeric', month: 'long', day: 'numeric',
            });
            const hasDigital = (order.items as any[]).some((i: any) => i.isDigital);

            return (
              <Link key={order.id} href={`/my-orders/${order.orderNumber}`}>
                <div className="border border-border rounded-xl p-5 hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground">{order.orderNumber}</span>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {hasDigital && (
                          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                            رقمي
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{date}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.items.length} {order.items.length === 1 ? 'منتج' : 'منتجات'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-primary">{formatPrice(order.total)}</span>
                      <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
