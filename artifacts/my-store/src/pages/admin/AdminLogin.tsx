import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminLogin } from '@workspace/api-client-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { SEO } from '@/components/SEO';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [, setLocation] = useLocation();
  const { login, isAuthenticated } = useAdminAuth();
  const loginMutation = useAdminLogin();

  // الانتقال بعد اكتمال تحديث حالة المصادقة
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/admin');
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const session = await loginMutation.mutateAsync({ data: { password } });
      login(session.token);
      toast.success('تم تسجيل الدخول بنجاح');
    } catch {
      toast.error('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <SEO
        title="دخول لوحة تحكم المتجر"
        description="تسجيل الدخول إلى لوحة إدارة متجر Digl Products."
        path="/admin/login"
        noIndex
      />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-sm"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary text-secondary flex items-center justify-center mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-foreground">لوحة تحكم المتجر</h1>
          <p className="text-sm text-muted-foreground mt-1">أدخل كلمة المرور للمتابعة</p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
          />
          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'جاري الدخول...' : 'دخول'}
          </Button>
        </div>
      </form>
    </div>
  );
}
