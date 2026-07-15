import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface ImageUploadFieldProps {
  images: string[];
  onChange: (images: string[]) => void;
  label?: string;
}

export function ImageUploadField({ images, onChange, label = 'الصور' }: ImageUploadFieldProps) {
  const { token } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/admin/uploads', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'فشل رفع الصورة');
        }

        const data = await res.json();
        uploaded.push(data.url);
      }
      onChange([...images, ...uploaded]);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشل رفع الصورة');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div key={i} className="relative group h-20 w-20 rounded-lg overflow-hidden border border-border">
            <img src={img} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <Trash2 className="h-4 w-4 text-white" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Upload className="h-5 w-5" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="أو ألصق رابط صورة واضغط إضافة"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const value = (e.target as HTMLInputElement).value.trim();
              if (value) {
                onChange([...images, value]);
                (e.target as HTMLInputElement).value = '';
              }
            }
          }}
        />
      </div>
    </div>
  );
}
