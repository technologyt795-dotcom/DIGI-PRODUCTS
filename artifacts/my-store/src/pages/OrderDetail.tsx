import { useParams, Link } from 'wouter';
import { ArrowRight, Download, Printer, Package } from 'lucide-react';
import { useGetMyOrder } from '@workspace/api-client-react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
  processing: { label: 'جاري التجهيز', variant: 'default' },
  shipped: { label: 'تم الشحن', variant: 'default' },
  delivered: { label: 'تم التسليم', variant: 'default' },
  cancelled: { label: 'ملغى', variant: 'destructive' },
};

// Downloads are allowed for non-cancelled orders that are at least "processing"
const DOWNLOAD_ALLOWED_STATUSES = new Set(['processing', 'shipped', 'delivered']);

export default function OrderDetail() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { token } = useCustomerAuth();
  const { settings } = useStoreSettings();

  const { data: order, isLoading, isError } = useGetMyOrder(orderNumber!, {
    request: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
    query: { enabled: !!token && !!orderNumber },
  });

  const handlePrint = () => window.print();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
        <div className="space-y-4">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-md" />
          <div className="h-64 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl text-center" dir="rtl">
        <Package className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">الطلب غير موجود</h2>
        <p className="text-muted-foreground mb-6">تعذّر العثور على هذا الطلب في حسابك.</p>
        <Button asChild>
          <Link href="/my-orders">العودة لطلباتي</Link>
        </Button>
      </div>
    );
  }

  const status = STATUS_MAP[order.status] ?? { label: order.status, variant: 'outline' as const };
  const date = new Date(order.createdAt).toLocaleDateString('ar-SA', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const canDownload = DOWNLOAD_ALLOWED_STATUSES.has(order.status);
  const storeName = settings?.storeName ?? 'المتجر';

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-show { display: block !important; }
          body { background: white !important; }
          header, footer, nav { display: none !important; }
        }
        @media screen {
          .print-show { display: none; }
        }
      `}</style>

      <div className="container mx-auto px-4 py-10 max-w-3xl" dir="rtl">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6 no-print flex-wrap gap-3">
          <Link href="/my-orders" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowRight className="h-4 w-4" />
            العودة لطلباتي
          </Link>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة الفاتورة
          </Button>
        </div>

        {/* Invoice card */}
        <div className="border border-border rounded-2xl overflow-hidden shadow-sm bg-card">
          {/* Header */}
          <div className="bg-primary/5 border-b border-border px-6 py-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-foreground">{storeName}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">فاتورة طلب</p>
              </div>
              <div className="text-left text-right">
                <p className="font-mono text-base font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-6">
            {/* Status + customer info */}
            <div className="flex flex-wrap items-start gap-6 justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">الحالة</p>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">معلومات العميل</p>
                <p className="font-medium text-sm">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                {order.customerPhone && <p className="text-xs text-muted-foreground">{order.customerPhone}</p>}
                {order.address && <p className="text-xs text-muted-foreground mt-0.5">{order.address}</p>}
              </div>
            </div>

            <Separator />

            {/* Items */}
            <div>
              <h2 className="font-semibold text-sm mb-4 text-muted-foreground uppercase tracking-wide">المنتجات</h2>
              <div className="space-y-3">
                {(order.items as any[]).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-4">
                    {/* Image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover border border-border shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                      {item.isDigital && (
                        <Badge variant="outline" className="mt-1 text-xs border-primary/40 text-primary">
                          منتج رقمي
                        </Badge>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm">{formatPrice(item.price * item.quantity)}</p>
                      {/* Download button */}
                      {item.isDigital && item.downloadUrl && canDownload && (
                        <a
                          href={item.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="no-print"
                        >
                          <Button
                            size="sm"
                            variant="secondary"
                            className="mt-2 gap-1.5 text-xs h-7 px-2.5"
                          >
                            <Download className="h-3 w-3" />
                            تحميل
                          </Button>
                        </a>
                      )}
                      {item.isDigital && !canDownload && (
                        <p className="text-xs text-muted-foreground mt-1 no-print">
                          {order.status === 'pending' ? 'ينتظر التأكيد' : 'غير متاح'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {Number(order.shippingCost) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الشحن</span>
                  <span>{formatPrice(order.shippingCost)}</span>
                </div>
              )}
              {Number(order.tax) > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الضريبة</span>
                  <span>{formatPrice(order.tax)}</span>
                </div>
              )}
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم {order.discountCode && `(${order.discountCode})`}</span>
                  <span>- {formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>الإجمالي</span>
                <span className="text-primary">{formatPrice(order.total)}</span>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              </>
            )}

            {/* Digital download note */}
            {(order.items as any[]).some((i: any) => i.isDigital) && !canDownload && order.status !== 'cancelled' && (
              <div className="bg-muted/60 border border-border rounded-lg p-4 no-print">
                <p className="text-sm text-muted-foreground text-center">
                  🔒 روابط تحميل المنتجات الرقمية ستتاح بعد تأكيد الطلب
                </p>
              </div>
            )}
          </div>

          {/* Print footer */}
          <div className="print-show px-6 pb-6 text-center text-xs text-muted-foreground border-t border-border pt-4">
            <p>شكراً لتسوقك معنا — {storeName}</p>
          </div>
        </div>
      </div>
    </>
  );
}
