import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Loader2, Upload, File as FileIcon, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import {
  useListProducts,
  useListCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  getListProductsQueryKey,
  type Product,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

const MAX_DIGITAL_FILES = 4;

interface ProductFormState {
  slug: string;
  name: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  description: string;
  images: string[];
  stock: string;
  isFeatured: boolean;
  isNew: boolean;
  badge: string;
  isDigital: boolean;
  downloadUrls: string[];
}

const emptyForm: ProductFormState = {
  slug: '',
  name: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  description: '',
  images: [],
  stock: '0',
  isFeatured: false,
  isNew: false,
  badge: '',
  isDigital: false,
  downloadUrls: [],
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const { token: adminToken } = useAdminAuth();
  const { data: products, isLoading } = useListProducts();
  const { data: categories } = useListCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitalFileUpload = async (file: File, slotIndex: number) => {
    if (!adminToken) { toast.error('يجب تسجيل الدخول أولاً'); return; }
    setUploadingSlot(slotIndex);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${BASE}/admin/digital-uploads`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'فشل رفع الملف');
      }
      const { url } = await res.json();
      setForm((prev) => {
        const urls = [...prev.downloadUrls];
        urls[slotIndex] = url;
        return { ...prev, downloadUrls: urls };
      });
      setUploadedFileNames((prev) => {
        const names = [...prev];
        names[slotIndex] = file.name;
        return names;
      });
      toast.success('تم رفع الملف بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذّر رفع الملف');
    } finally {
      setUploadingSlot(null);
    }
  };

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setUploadedFileNames([]);
    setIsDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      slug: product.slug,
      name: product.name,
      categoryId: String(product.categoryId),
      price: String(product.price),
      compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : '',
      description: product.description,
      images: product.images,
      stock: String(product.stock),
      isFeatured: product.isFeatured,
      isNew: product.isNew,
      badge: product.badge || '',
      isDigital: product.isDigital,
      downloadUrls: product.downloadUrls || [],
    });
    setUploadedFileNames([]);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      slug: form.slug,
      name: form.name,
      categoryId: Number(form.categoryId),
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      description: form.description,
      images: form.images,
      stock: Number(form.stock),
      isFeatured: form.isFeatured,
      isNew: form.isNew,
      badge: form.badge || null,
      isDigital: form.isDigital,
      downloadUrls: form.isDigital ? form.downloadUrls.filter(Boolean) : [],
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: payload });
        toast.success('تم تحديث المنتج');
      } else {
        await createMutation.mutateAsync({ data: payload });
        toast.success('تم إنشاء المنتج');
      }
      await invalidate();
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ ما');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteTarget.id });
      toast.success('تم حذف المنتج');
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر حذف المنتج');
    } finally {
      setDeleteTarget(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">المنتجات</h1>
          <p className="text-sm text-muted-foreground">إدارة منتجات المتجر، الأسعار والصور</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          منتج جديد
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الصورة</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead>التصنيف</TableHead>
                <TableHead>السعر</TableHead>
                <TableHead>المخزون</TableHead>
                <TableHead className="text-left">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <img
                      src={product.images[0] || 'https://placehold.co/60x60'}
                      alt={product.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  </TableCell>
                  <TableCell className="font-medium max-w-[220px] truncate">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.categoryName}</TableCell>
                  <TableCell>{formatPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    لا توجد منتجات بعد
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل المنتج' : 'منتج جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الرابط (slug)</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>التصنيف</Label>
                <Select
                  value={form.categoryId}
                  onValueChange={(value) => setForm({ ...form, categoryId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر تصنيفاً" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المخزون</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ر.س)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>السعر قبل الخصم (اختياري)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.compareAtPrice}
                  onChange={(e) => setForm({ ...form, compareAtPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <ImageUploadField
              images={form.images}
              onChange={(images) => setForm({ ...form, images })}
              label="صور المنتج"
            />

            <div className="space-y-2">
              <Label>شارة (اختياري، مثال: خصم 20%)</Label>
              <Input
                value={form.badge}
                onChange={(e) => setForm({ ...form, badge: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isFeatured}
                  onCheckedChange={(checked) => setForm({ ...form, isFeatured: checked })}
                />
                <Label>منتج مميز</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isNew}
                  onCheckedChange={(checked) => setForm({ ...form, isNew: checked })}
                />
                <Label>منتج جديد</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.isDigital}
                  onCheckedChange={(checked) => setForm({ ...form, isDigital: checked, downloadUrl: checked ? form.downloadUrl : '' })}
                />
                <Label>منتج رقمي</Label>
              </div>
            </div>

            {form.isDigital && (
              <div className="space-y-3">
                <Label>ملفات التحميل الرقمية (حتى {MAX_DIGITAL_FILES} ملفات)</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: MAX_DIGITAL_FILES }).map((_, idx) => {
                    const url = form.downloadUrls[idx] || '';
                    const name = uploadedFileNames[idx] || (url ? url.split('/').pop() || 'ملف محفوظ' : '');
                    const isUploading = uploadingSlot === idx;
                    return (
                      <div key={idx}>
                        <input
                          ref={(el) => { fileInputRefs.current[idx] = el; }}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDigitalFileUpload(file, idx);
                            e.target.value = '';
                          }}
                        />
                        {url ? (
                          <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/40">
                            <FileIcon className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs flex-1 truncate text-muted-foreground">{name}</span>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={() => fileInputRefs.current[idx]?.click()}
                                disabled={isUploading}
                              >
                                تغيير
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive"
                                onClick={() => {
                                  setForm((p) => {
                                    const urls = [...p.downloadUrls];
                                    urls[idx] = '';
                                    return { ...p, downloadUrls: urls };
                                  });
                                  setUploadedFileNames((p) => {
                                    const names = [...p];
                                    names[idx] = '';
                                    return names;
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full gap-2 border-dashed h-12 text-sm"
                            onClick={() => fileInputRefs.current[idx]?.click()}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> جاري الرفع...</>
                            ) : (
                              <><Upload className="h-4 w-4" /> ملف {idx + 1}</>
                            )}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">الملفات ستُتاح للعميل بعد تأكيد الطلب — يُقبل أي نوع ملف</p>
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={isSaving || !form.categoryId}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف "{deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
