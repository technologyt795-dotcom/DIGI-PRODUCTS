import { useState } from 'react';
import { useListReviews, useUpdateReview, useDeleteReview, getListReviewsQueryKey, Review } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Star, CheckCircle, Trash2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);

  const { data: allReviews, isLoading } = useListReviews();
  const updateReview = useUpdateReview();
  const deleteReview = useDeleteReview();

  const handleApprove = async (id: number, isApproved: boolean) => {
    try {
      await updateReview.mutateAsync({ id, data: { isApproved } });
      toast.success(isApproved ? 'تمت الموافقة على التقييم' : 'تم إلغاء الموافقة');
      queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
    } catch (err) {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deletingReview) return;
    try {
      await deleteReview.mutateAsync({ id: deletingReview.id });
      toast.success('تم حذف التقييم');
      queryClient.invalidateQueries({ queryKey: getListReviewsQueryKey() });
    } catch (err) {
      toast.error('تعذر حذف التقييم');
    } finally {
      setDeletingReview(null);
    }
  };

  const filteredReviews = allReviews?.filter(r => {
    if (tab === 'pending') return !r.isApproved;
    if (tab === 'approved') return r.isApproved;
    return true;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star key={star} className={cn("h-4 w-4", star <= rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التقييمات</h1>
          <p className="text-sm text-muted-foreground">إدارة مراجعات وتقييمات المنتجات</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">الكل</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2"><Clock className="h-4 w-4" /> بانتظار الموافقة</TabsTrigger>
          <TabsTrigger value="approved" className="gap-2"><CheckCircle className="h-4 w-4" /> موافق عليها</TabsTrigger>
        </TabsList>

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
                    <TableHead>العميل</TableHead>
                    <TableHead>التقييم</TableHead>
                    <TableHead className="w-1/3">التعليق</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        لا توجد تقييمات
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReviews?.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell className="font-medium">
                          {review.customerName}
                          <div className="text-xs text-muted-foreground">منتج #{review.productId}</div>
                        </TableCell>
                        <TableCell>{renderStars(review.rating)}</TableCell>
                        <TableCell>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.comment || <span className="italic opacity-50">بدون تعليق</span>}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(review.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {review.isApproved ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><CheckCircle className="h-3 w-3" /> موافق عليه</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="h-3 w-3" /> بانتظار المراجعة</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {!review.isApproved ? (
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-500/10" onClick={() => handleApprove(review.id, true)}>
                                قبول
                              </Button>
                            ) : (
                              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-500/10" onClick={() => handleApprove(review.id, false)}>
                                إخفاء
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingReview(review)}>
                              <Trash2 className="h-4 w-4" />
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
      </Tabs>

      <AlertDialog open={!!deletingReview} onOpenChange={(open) => !open && setDeletingReview(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التقييم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التقييم نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteReview.isPending}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
