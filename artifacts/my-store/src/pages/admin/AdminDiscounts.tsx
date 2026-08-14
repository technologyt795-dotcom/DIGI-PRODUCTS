import { useState } from 'react';
import { useListDiscounts, useCreateDiscount, useUpdateDiscount, useDeleteDiscount, getListDiscountsQueryKey, DiscountType, DiscountInputType, Discount } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Pencil, Trash2, Percent, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AdminDiscounts() {
  const queryClient = useQueryClient();
  const { data: discounts, isLoading } = useListDiscounts();
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  const deleteDiscount = useDeleteDiscount();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  
  const defaultForm = {
    code: '',
    type: 'percentage' as DiscountInputType,
    value: 0,
    minOrderAmount: '' as string | number,
    maxUses: '' as string | number,
    expiresAt: '',
    isActive: true,
  };
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => {
    setEditingDiscount(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingDiscount(d);
    setForm({
      code: d.code,
      type: d.type as DiscountInputType,
      value: d.value,
      minOrderAmount: d.minOrderAmount ?? '',
      maxUses: d.maxUses ?? '',
      expiresAt: d.expiresAt ? new Date(d.expiresAt).toISOString().split('T')[0] : '',
      isActive: d.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingDiscount) {
        await updateDiscount.mutateAsync({ id: editingDiscount.id, data: payload });
        toast.success('تم تحديث الخصم');
      } else {
        await createDiscount.mutateAsync({ data: payload });
        toast.success('تم إضافة كود الخصم');
      }
      queryClient.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
      setDialogOpen(false);
    } catch (err) {
      toast.error('حدث خطأ أثناء حفظ الخصم');
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updateDiscount.mutateAsync({ id, data: { isActive } });
      toast.success(isActive ? 'تم تفعيل الكود' : 'تم تعطيل الكود');
      queryClient.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
    } catch (err) {
      toast.error('تعذر تغيير حالة الكود');
    }
  };

  const handleDelete = async () => {
    if (!deletingDiscount) return;
    try {
      await deleteDiscount.mutateAsync({ id: deletingDiscount.id });
      toast.success('تم حذف كود الخصم');
      queryClient.invalidateQueries({ queryKey: getListDiscountsQueryKey() });
    } catch (err) {
      toast.error('تعذر الحذف');
    } finally {
      setDeletingDiscount(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">كوبونات الخصم</h1>
          <p className="text-sm text-muted-foreground">إدارة أكواد الخصم والعروض</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> كود خصم جديد
        </Button>
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
                  <TableHead>الكود</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>القيمة</TableHead>
                  <TableHead>الاستخدامات</TableHead>
                  <TableHead>تاريخ الانتهاء</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      لا توجد أكواد خصم نشطة
                    </TableCell>
                  </TableRow>
                ) : (
                  discounts?.map((d) => (
                    <TableRow key={d.id} className={!d.isActive ? 'opacity-60' : ''}>
                      <TableCell className="font-bold text-primary uppercase tracking-wider">{d.code}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1.5">
                          {d.type === 'percentage' ? <Percent className="h-3 w-3" /> : <Calculator className="h-3 w-3" />}
                          {d.type === 'percentage' ? 'نسبة' : 'مبلغ ثابت'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold">
                        {d.type === 'percentage' ? `${d.value}%` : `${d.value} رس`}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          {d.usedCount} {d.maxUses ? `/ ${d.maxUses}` : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        {d.expiresAt ? new Date(d.expiresAt).toLocaleDateString('ar-SA') : <span className="text-muted-foreground text-xs">لا يوجد</span>}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={d.isActive} 
                          onCheckedChange={(checked) => handleToggleActive(d.id, checked)} 
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingDiscount(d)}>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDiscount ? 'تعديل كود الخصم' : 'إنشاء كود خصم جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الكود</Label>
                <Input required value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="مثال: SUMMER24" dir="ltr" className="uppercase font-bold" />
              </div>
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(val: DiscountInputType) => setForm({...form, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">نسبة مئوية (%)</SelectItem>
                    <SelectItem value="fixed">مبلغ ثابت (رس)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>القيمة</Label>
                <Input type="number" required min="1" value={form.value} onChange={e => setForm({...form, value: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>الحد الأدنى للطلب (اختياري)</Label>
                <Input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الحد الأقصى للاستخدام (اختياري)</Label>
                <Input type="number" min="1" value={form.maxUses} onChange={e => setForm({...form, maxUses: e.target.value})} placeholder="بدون حد" />
              </div>
              <div className="space-y-2">
                <Label>تاريخ الانتهاء (اختياري)</Label>
                <Input type="date" value={form.expiresAt} onChange={e => setForm({...form, expiresAt: e.target.value})} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="space-y-0.5">
                <Label>تفعيل الكود</Label>
                <div className="text-xs text-muted-foreground">يمكن للعملاء استخدام الكود النشط</div>
              </div>
              <Switch checked={form.isActive} onCheckedChange={(checked) => setForm({...form, isActive: checked})} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createDiscount.isPending || updateDiscount.isPending}>
                حفظ الكود
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDiscount} onOpenChange={(open) => !open && setDeletingDiscount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف كود الخصم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الكود <strong>{deletingDiscount?.code}</strong>؟ 
              لن يتمكن العملاء من استخدامه بعد الآن.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteDiscount.isPending}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
