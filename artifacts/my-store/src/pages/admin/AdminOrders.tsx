import { useState, useEffect } from 'react';
import { useListOrders, useUpdateOrder, useDeleteOrder, getListOrdersQueryKey, Order, OrderStatus } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Eye, MapPin, User, Package, Calendar, Trash2, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [isSavingTracking, setIsSavingTracking] = useState(false);

  useEffect(() => {
    setTrackingNumber((selectedOrder as any)?.trackingNumber ?? '');
    setTrackingUrl((selectedOrder as any)?.trackingUrl ?? '');
  }, [selectedOrder]);

  const { data: orders, isLoading } = useListOrders(statusFilter === 'all' ? undefined : { status: statusFilter as OrderStatus });
  const updateOrder = useUpdateOrder();
  const deleteOrder = useDeleteOrder({
    mutation: {
      onSuccess: () => {
        toast.success('تم حذف الطلب نهائياً');
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setOrderToDelete(null);
        if (selectedOrder && selectedOrder.id === orderToDelete?.id) {
          setSelectedOrder(null);
        }
      },
      onError: () => {
        toast.error('تعذّر حذف الطلب');
        setOrderToDelete(null);
      },
    },
  });

  const handleSaveTracking = async () => {
    if (!selectedOrder) return;
    setIsSavingTracking(true);
    try {
      const updated = await updateOrder.mutateAsync({
        id: selectedOrder.id,
        data: { trackingNumber: trackingNumber || null, trackingUrl: trackingUrl || null },
      });
      toast.success('تم حفظ معلومات التتبع');
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      setSelectedOrder({ ...selectedOrder, ...(updated as any) });
    } catch {
      toast.error('تعذّر حفظ معلومات التتبع');
    } finally {
      setIsSavingTracking(false);
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, data: { status: newStatus } });
      toast.success('تم تحديث حالة الطلب');
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('تعذر تحديث حالة الطلب');
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">معلق</Badge>;
      case 'processing': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">قيد المعالجة</Badge>;
      case 'shipped': return <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">مشحون</Badge>;
      case 'delivered': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">مكتمل</Badge>;
      case 'cancelled': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">ملغي</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">الطلبات</h1>
          <p className="text-sm text-muted-foreground">إدارة وتتبع طلبات المتجر</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الطلبات</SelectItem>
              <SelectItem value="pending">معلق</SelectItem>
              <SelectItem value="processing">قيد المعالجة</SelectItem>
              <SelectItem value="shipped">مشحون</SelectItem>
              <SelectItem value="delivered">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا توجد طلبات
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-medium text-primary">#{order.orderNumber}</TableCell>
                      <TableCell>{new Date(order.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{order.customerName}</span>
                          <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">{order.total.toLocaleString('ar-SA')} رس</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-left">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => { e.stopPropagation(); setOrderToDelete(order); }}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between pb-4 border-b border-border">
                <DialogTitle className="text-xl flex items-center gap-2">
                  طلب #{selectedOrder.orderNumber}
                  {getStatusBadge(selectedOrder.status)}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">تغيير الحالة:</span>
                  <Select 
                    value={selectedOrder.status} 
                    onValueChange={(val: OrderStatus) => handleStatusChange(selectedOrder.id, val)}
                  >
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const allDigital = (selectedOrder.items as any[]).every((i: any) => i.isDigital);
                        return <>
                          <SelectItem value="pending">معلق</SelectItem>
                          <SelectItem value="processing">قيد المعالجة</SelectItem>
                          {!allDigital && <SelectItem value="shipped">مشحون</SelectItem>}
                          <SelectItem value="delivered">مكتمل</SelectItem>
                          <SelectItem value="cancelled">ملغي</SelectItem>
                        </>;
                      })()}
                    </SelectContent>
                  </Select>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-4 flex gap-3">
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1">معلومات العميل</h3>
                        <p className="text-sm">{selectedOrder.customerName}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrder.customerPhone}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex gap-3">
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1">عنوان التوصيل</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedOrder.address}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 flex gap-3">
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm mb-1">تاريخ الطلب</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(selectedOrder.createdAt).toLocaleDateString('ar-SA')} - {new Date(selectedOrder.createdAt).toLocaleTimeString('ar-SA')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> المنتجات
                  </h3>
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded bg-background object-cover border border-border" />
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.price.toLocaleString('ar-SA')} رس × {item.quantity}</p>
                        </div>
                        <div className="font-bold text-sm">
                          {(item.price * item.quantity).toLocaleString('ar-SA')} رس
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t border-border pt-3 mt-4 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">المجموع الفرعي</span>
                        <span>{selectedOrder.subtotal.toLocaleString('ar-SA')} رس</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الشحن</span>
                        <span>{selectedOrder.shippingCost.toLocaleString('ar-SA')} رس</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">الضريبة</span>
                        <span>{selectedOrder.tax.toLocaleString('ar-SA')} رس</span>
                      </div>
                      {selectedOrder.discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>الخصم {selectedOrder.discountCode && `(${selectedOrder.discountCode})`}</span>
                          <span>-{selectedOrder.discountAmount.toLocaleString('ar-SA')} رس</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t border-border">
                        <span>الإجمالي الكلي</span>
                        <span className="text-primary">{selectedOrder.total.toLocaleString('ar-SA')} رس</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Tracking ── */}
              {!(selectedOrder.items as any[]).every((i: any) => i.isDigital) && (
                <div className="col-span-full">
                  <Card>
                    <CardContent className="p-4 flex gap-3">
                      <div className="bg-primary/10 p-2 rounded-full h-fit">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-bold text-sm">معلومات تتبع الشحنة</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">رقم التتبع</Label>
                            <Input
                              value={trackingNumber}
                              onChange={(e) => setTrackingNumber(e.target.value)}
                              placeholder="مثال: 1Z9999999999999"
                              dir="ltr"
                              className="text-left font-mono text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">رابط تتبع الشحنة</Label>
                            <Input
                              value={trackingUrl}
                              onChange={(e) => setTrackingUrl(e.target.value)}
                              placeholder="https://..."
                              dir="ltr"
                              className="text-left text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={handleSaveTracking}
                          disabled={isSavingTracking}
                          className="mt-1"
                        >
                          {isSavingTracking ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                          حفظ معلومات التتبع
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الطلب نهائياً</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الطلب{' '}
              <span className="font-semibold text-foreground">#{orderToDelete?.orderNumber}</span>{' '}
              الخاص بـ <span className="font-semibold text-foreground">{orderToDelete?.customerName}</span>؟
              <br />
              <span className="text-destructive font-medium">هذا الإجراء لا يمكن التراجع عنه.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>تراجع</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => orderToDelete && deleteOrder.mutate({ id: orderToDelete.id })}
              disabled={deleteOrder.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOrder.isPending ? 'جاري الحذف...' : 'حذف نهائياً'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
