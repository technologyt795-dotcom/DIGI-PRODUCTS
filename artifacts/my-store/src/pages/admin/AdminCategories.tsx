import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, EyeOff, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import {
  useListAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  getListAdminCategoriesQueryKey,
  type Category,
} from '@workspace/api-client-react';

const ADMIN_TOKEN_KEY = 'my-store-admin-token';

async function adminDelete(path: string) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  const res = await fetch(path, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
}
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface CategoryFormState {
  slug: string;
  name: string;
  description: string;
  image: string;
}

const emptyForm: CategoryFormState = { slug: '', name: '', description: '', image: '' };

type DeleteMode = 'safe' | 'withProducts';

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListAdminCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteMode, setDeleteMode] = useState<DeleteMode>('safe');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingHide, setIsTogglingHide] = useState<number | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListAdminCategoriesQueryKey() });

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      slug: category.slug,
      name: category.name,
      description: category.description,
      image: category.image,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data: form });
        toast.success('تم تحديث التصنيف');
      } else {
        await createMutation.mutateAsync({ data: form });
        toast.success('تم إنشاء التصنيف');
      }
      await invalidate();
      setIsDialogOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'حدث خطأ ما');
    }
  };

  const handleToggleHide = async (category: Category) => {
    setIsTogglingHide(category.id);
    try {
      await updateMutation.mutateAsync({
        id: category.id,
        data: { isHidden: !category.isHidden },
      });
      toast.success(category.isHidden ? 'تم إظهار التصنيف' : 'تم إخفاء التصنيف');
      await invalidate();
    } catch (err) {
      toast.error('تعذّر تغيير حالة التصنيف');
    } finally {
      setIsTogglingHide(null);
    }
  };

  const openDelete = (category: Category) => {
    setDeleteTarget(category);
    setDeleteMode(category.productCount > 0 ? 'withProducts' : 'safe');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const url =
        deleteMode === 'withProducts'
          ? `/api/categories/id/${deleteTarget.id}?withProducts=true`
          : `/api/categories/id/${deleteTarget.id}`;
      await adminDelete(url);
      toast.success(
        deleteMode === 'withProducts'
          ? `تم حذف "${deleteTarget.name}" وجميع منتجاته`
          : `تم حذف "${deleteTarget.name}"`
      );
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'تعذر حذف التصنيف');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">التصنيفات</h1>
          <p className="text-sm text-muted-foreground">إدارة تصنيفات المتجر</p>
        </div>
        <Button onClick={openCreate} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          تصنيف جديد
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
                  <TableHead>الرابط (slug)</TableHead>
                  <TableHead>المنتجات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category) => (
                  <TableRow
                    key={category.id}
                    className={category.isHidden ? 'opacity-50' : ''}
                  >
                    <TableCell>
                      <img
                        src={category.image || 'https://placehold.co/60x60'}
                        alt={category.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                    <TableCell>{category.productCount}</TableCell>
                    <TableCell>
                      {category.isHidden ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <EyeOff className="h-3 w-3" />
                          مخفي
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-600/30 bg-green-500/10">
                          <Eye className="h-3 w-3" />
                          ظاهر
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {/* Hide / Show */}
                        <Button
                          variant="ghost"
                          size="icon"
                          title={category.isHidden ? 'إظهار التصنيف' : 'إخفاء التصنيف'}
                          disabled={isTogglingHide === category.id}
                          onClick={() => handleToggleHide(category)}
                        >
                          {isTogglingHide === category.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : category.isHidden ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Edit */}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(category)}>
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {/* Delete */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => openDelete(category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {categories?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      لا توجد تصنيفات بعد
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit / Create Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل التصنيف' : 'تصنيف جديد'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="مثال: home-organization"
                required
              />
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
              images={form.image ? [form.image] : []}
              onChange={(images) => setForm({ ...form, image: images[images.length - 1] || '' })}
              label="صورة التصنيف"
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف التصنيف</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  هل أنت متأكد من حذف <strong>"{deleteTarget?.name}"</strong>؟
                  لا يمكن التراجع عن هذا الإجراء.
                </p>

                {(deleteTarget?.productCount ?? 0) > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-sm font-medium text-foreground">
                      هذا التصنيف يحتوي على <strong>{deleteTarget?.productCount} منتج</strong>. اختر:
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <input
                          type="radio"
                          name="deleteMode"
                          value="withProducts"
                          checked={deleteMode === 'withProducts'}
                          onChange={() => setDeleteMode('withProducts')}
                          className="mt-0.5"
                        />
                        <div>
                          <div className="text-sm font-medium text-destructive">حذف التصنيف ومنتجاته كاملاً</div>
                          <div className="text-xs text-muted-foreground">سيتم حذف {deleteTarget?.productCount} منتج نهائياً</div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors opacity-50">
                        <input
                          type="radio"
                          name="deleteMode"
                          value="safe"
                          checked={deleteMode === 'safe'}
                          onChange={() => setDeleteMode('safe')}
                          className="mt-0.5"
                          disabled
                        />
                        <div>
                          <div className="text-sm font-medium">حذف التصنيف فقط</div>
                          <div className="text-xs text-muted-foreground">غير متاح — يجب حذف المنتجات أولاً</div>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الحذف...</>
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
