import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCustomerAuth } from '@/hooks/use-customer-auth';

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

export function CustomerAuthModal({ open, onOpenChange }: CustomerAuthModalProps) {
  const { login } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setError(null);
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    resetForm();
  };

  const handleMethodChange = (val: 'email' | 'phone') => {
    setMethod(val);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (activeTab === 'register' && password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = activeTab === 'login' ? '/auth/login' : '/auth/register';
      const body: any = { method, password };
      
      if (activeTab === 'register') {
        body.name = name;
      }
      
      if (method === 'email') {
        body.email = email;
      } else {
        body.phone = phone;
      }

      const res = await fetch(`${BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'حدث خطأ');
      }

      login(data.token, data.user || data.customer);
      onOpenChange(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">مرحباً بك في المتجر</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mt-4" dir="rtl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">تسجيل دخول</TabsTrigger>
            <TabsTrigger value="register">إنشاء حساب</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-muted p-1 rounded-lg">
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    method === 'email' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => handleMethodChange('email')}
                >
                  البريد الإلكتروني
                </button>
                <button
                  type="button"
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    method === 'phone' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => handleMethodChange('phone')}
                >
                  رقم الهاتف
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">الاسم الكامل</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="أحمد محمد"
                  />
                </div>
              )}

              {method === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    dir="ltr"
                    className="text-right"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                    className="text-right"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                  className="text-right"
                />
              </div>

              {activeTab === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    dir="ltr"
                    className="text-right"
                  />
                </div>
              )}

              {error && (
                <div className="text-sm font-medium text-destructive mt-2 bg-destructive/10 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                {isLoading ? 'جاري المعالجة...' : activeTab === 'login' ? 'دخول' : 'إنشاء حساب'}
              </Button>
            </form>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
