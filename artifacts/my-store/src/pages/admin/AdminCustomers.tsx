import { useState } from 'react';
import { useListCustomers, useUpdateCustomer, useDeleteCustomer, getListCustomersQueryKey, CustomerWithStats } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Search, Pencil, Trash2, Mail, Phone, ShoppingBag, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
import { toast } from 'sonner';

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<CustomerWithStats | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<CustomerWithStats | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const { data: customers, isLoading } = useListCustomers();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();

  const filteredCustomers = customers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const openEdit = (customer: CustomerWithStats) => {
    setEditingCustomer(customer);
    setForm({ name: customer.name, email: customer.email, phone: customer.phone });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    try {
      await updateCustomer.mutateAsync({ id: editingCustomer.id, data: form });
      toast.success('تم تحديث بيانات العميل');
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      setEditingCustomer(null);
    } catch (err) {
      toast.error('حدث خطأ أثناء التحديث');
    }
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      await deleteCustomer.mutateAsync({ id: deletingCustomer.id });
      toast.success('تم حذف العميل');
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
    } catch (err) {
      toast.error('حدث خطأ أثناء الحذف');
    } finally {
      setDeletingCustomer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">العملاء</h1>
          <p className="text-sm text-muted-foreground">إدارة عملاء المتجر</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="بحث بالاسم، البريد أو الهاتف..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-3 pr-9"
          />
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
                  <TableHead>العميل</TableHead>
                  <TableHead>معلومات الاتصال</TableHead>
                  <TableHead className="text-center">الطلبات</TableHead>
                  <TableHead className="text-center">إجمالي الإنفاق</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      لا يوجد عملاء
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers?.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          {customer.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{customer.email}</span>
                          <span className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{customer.phone || '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <div className="flex items-center justify-center gap-1.5">
                          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                          {customer.totalOrders}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-primary">
                        <div className="flex items-center justify-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          {customer.totalSpent.toLocaleString('ar-SA')}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(customer.createdAt).toLocaleDateString('ar-SA')}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingCustomer(customer)}>
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

      <Dialog open={!!editingCustomer} onOpenChange={(open) => !open && setEditingCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>الاسم</Label>
              <Input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-right" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>إلغاء</Button>
              <Button type="submit" disabled={updateCustomer.isPending}>
                {updateCustomer.isPending ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العميل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العميل {deletingCustomer?.name}؟ 
              هذا الإجراء سيحذف العميل وجميع بياناته ولا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={deleteCustomer.isPending}>
              {deleteCustomer.isPending ? 'جاري الحذف...' : 'حذف العميل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
