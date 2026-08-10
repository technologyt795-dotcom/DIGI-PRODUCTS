import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Package, ChevronLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { useListMyOrders, useDeleteMyOrder, getListMyOrdersQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SEO } from '@/components/SEO';

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
  const queryClient = useQueryClient();

  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/');
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: orders, isLoading } = useListMyOrders({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    query: { enabled: !!token, queryKey: getListMyOrdersQueryKey() },
  });

  const deleteMutation = useDeleteMyOrder({
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    mutation: {
      onSuccess: () => {
        const status = orders?.find((o) => o.orderNumber === orderToDelete)?.status;
        if (status === 'pending') {
          toast.success('تم إلغاء الطلب');
        } else {
          toast.success('تم إخفاء الطلب من قائمتك');
        }
        queryClient.invalidateQueries({ queryKey: getListMyOrdersQueryKey() });
        setOrderToDelete(null);
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.error || 'تعذّر تنفيذ العملية، حاول مرة أخرى';
        toast.error(msg);
        setOrderToDelete(null);
      },
    },
  });

  const confirmDelete = () => {
    if (!orderToDelete) return;
    deleteMutation.mutate({ orderNumber: orderToDelete });
  };

  // Determine action label based on order status
  const getDeleteAction = (status: string) => {
    if (status === 'pending') return { label: 'إلغاء الطلب', allowed: true };
    if (status === 'cancelled') return { label: 'إخفاء من قائمتي', allowed: true };
    return { label: '', allowed: false };
  };

  if (authLoading || !isAuthenticated) return null;

  return (
    <>
      <SEO
        title="طلباتي"
        description="تابع حالة طلباتك واطّلع على تفاصيل مشترياتك."
        path="/my-orders"
        noIndex
      />
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
              const deleteAction = getDeleteAction(order.status);

              return (
                <div key={order.id} className="border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-muted/20 transition-all group">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <Link href={`/my-orders/${order.orderNumber}`} className="flex-1 min-w-0">
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
                    </Link>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{formatPrice(order.total)}</span>
                      <Link href={`/my-orders/${order.orderNumber}`}>
                        <ChevronLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                      {deleteAction.allowed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title={deleteAction.label}
                          onClick={(e) => {
                            e.preventDefault();
                            setOrderToDelete(order.orderNumber);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent dir="rtl">
          {(() => {
            const pendingOrder = orders?.find((o) => o.orderNumber === orderToDelete);
            const isPending = pendingOrder?.status === 'pending';
            return (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {isPending ? 'إلغاء الطلب' : 'إخفاء الطلب'}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {isPending ? (
                      <>
                        هل تريد إلغاء الطلب <span className="font-semibold text-foreground">{orderToDelete}</span>؟
                        <br />
                        سيتحول إلى حالة "ملغى" ولن يمكن معالجته.
                      </>
                    ) : (
                      <>
                        هل تريد إخفاء الطلب <span className="font-semibold text-foreground">{orderToDelete}</span> من قائمتك؟
                        <br />
                        لن يظهر في طلباتك بعد الآن.
                      </>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2">
                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    disabled={deleteMutation.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleteMutation.isPending
                      ? (isPending ? 'جاري الإلغاء...' : 'جاري الإخفاء...')
                      : (isPending ? 'إلغاء الطلب' : 'إخفاء')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </>
            );
          })()}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
