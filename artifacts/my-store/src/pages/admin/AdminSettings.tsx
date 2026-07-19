import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploadField } from '@/components/admin/ImageUploadField';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useUpdateSettings } from '@workspace/api-client-react';
import { toast } from 'sonner';
import { Loader2, Palette, Info, Truck, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StoreSettingsUpdateActiveTheme } from '@workspace/api-client-react';

export default function AdminSettings() {
  const { settings, isLoading, refreshSettings } = useStoreSettings();
  const { token: adminToken } = useAdminAuth();
  
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<StoreSettingsUpdateActiveTheme>('classic');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number | null>(null);
  const [enableFreeShipping, setEnableFreeShipping] = useState(false);
  const [flatShippingRate, setFlatShippingRate] = useState(0);
  const [taxRate, setTaxRate] = useState(0);
  const [taxInclusive, setTaxInclusive] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Initialize form when settings load
  useEffect(() => {
    if (settings) {
      setStoreName(settings.storeName || '');
      setTagline(settings.tagline || '');
      setLogoUrl(settings.logoUrl || null);
      setActiveTheme(settings.activeTheme as StoreSettingsUpdateActiveTheme || 'classic');
      setContactEmail(settings.contactEmail || '');
      setContactPhone(settings.contactPhone || '');
      setAddress(settings.address || '');
      setFreeShippingThreshold(settings.freeShippingThreshold);
      setEnableFreeShipping(settings.freeShippingThreshold !== null);
      setFlatShippingRate(settings.flatShippingRate || 0);
      setTaxRate(settings.taxRate || 0);
      setTaxInclusive(settings.taxInclusive || false);
      setFacebookUrl(settings.facebookUrl || '');
      setInstagramUrl(settings.instagramUrl || '');
      setTwitterUrl(settings.twitterUrl || '');
      setWhatsappNumber(settings.whatsappNumber || '');
    }
  }, [settings]);

  const updateMutation = useUpdateSettings({
    request: adminToken ? { headers: { Authorization: `Bearer ${adminToken}` } } : undefined,
    mutation: {
      onSuccess: () => {
        toast.success('تم حفظ الإعدادات بنجاح');
        refreshSettings();
      },
      onError: (err) => {
        toast.error('حدث خطأ أثناء حفظ الإعدادات');
        console.error(err);
      }
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      data: {
        storeName,
        tagline,
        logoUrl,
        activeTheme,
        contactEmail,
        contactPhone,
        address,
        freeShippingThreshold: enableFreeShipping ? Number(freeShippingThreshold) : null,
        flatShippingRate: Number(flatShippingRate),
        taxRate: Number(taxRate),
        taxInclusive,
        facebookUrl: facebookUrl || null,
        instagramUrl: instagramUrl || null,
        twitterUrl: twitterUrl || null,
        whatsappNumber: whatsappNumber || null,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const themes = [
    {
      id: 'classic' as StoreSettingsUpdateActiveTheme,
      name: 'كلاسيكي (Classic)',
      description: 'ألوان دافئة مع خلفية بيضاء وزرقاء',
      preview: 'bg-[#fafaf9] border-[#e2e8f0]',
      primary: 'bg-[#0f172a]',
      secondary: 'bg-[#d97706]'
    },
    {
      id: 'modern' as StoreSettingsUpdateActiveTheme,
      name: 'عصري (Modern)',
      description: 'مظهر داكن مع أزرق فاقع',
      preview: 'bg-[#0a0a0a] border-[#333]',
      primary: 'bg-[#2563eb]',
      secondary: 'bg-[#16a34a]'
    },
    {
      id: 'minimal' as StoreSettingsUpdateActiveTheme,
      name: 'بسيط (Minimal)',
      description: 'خلفية بيضاء نقية مع نصوص رمادية',
      preview: 'bg-white border-[#e5e7eb]',
      primary: 'bg-[#1e293b]',
      secondary: 'bg-[#f1f5f9]'
    },
    {
      id: 'luxury' as StoreSettingsUpdateActiveTheme,
      name: 'فاخر (Luxury)',
      description: 'خلفية داكنة مع ذهبي فاخر',
      preview: 'bg-[#1a1208] border-[#7a6020]',
      primary: 'bg-[#c9952a]',
      secondary: 'bg-[#2d6b4a]'
    },
    {
      id: 'ocean' as StoreSettingsUpdateActiveTheme,
      name: 'بحري (Ocean)',
      description: 'خلفية زرقاء داكنة مع فيروزي مضيء',
      preview: 'bg-[#0b1929] border-[#1e3a5f]',
      primary: 'bg-[#00b4d8]',
      secondary: 'bg-[#1e3a5f]'
    },
    {
      id: 'glass' as StoreSettingsUpdateActiveTheme,
      name: 'زجاجي (Glass)',
      description: 'تأثير زجاجي احترافي مع تدرجات بنفسجية',
      preview: 'bg-[#0c0423] border-[#5b21b6]',
      primary: 'bg-[#8b5cf6]',
      secondary: 'bg-[#06b6d4]'
    },
    {
      id: 'digital' as StoreSettingsUpdateActiveTheme,
      name: 'رقمي (Digital)',
      description: 'مصمم للمنتجات الرقمية — سواد عميق مع سيان نيون',
      preview: 'bg-[#030712] border-[#0e7490]',
      primary: 'bg-[#00d4d4]',
      secondary: 'bg-[#8b5cf6]'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">إعدادات المتجر</h1>
          <p className="text-muted-foreground mt-1">إدارة مظهر المتجر ومعلوماته الأساسية</p>
        </div>
        <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2">
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          حفظ التغييرات
        </Button>
      </div>

      <Tabs defaultValue="appearance" className="w-full" dir="rtl">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">المظهر</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-2">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">المعلومات</span>
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">الشحن والضرائب</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="gap-2">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">التواصل</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>شعار المتجر</CardTitle>
              <CardDescription>قم برفع الشعار الذي سيظهر في أعلى المتجر</CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                images={logoUrl ? [logoUrl] : []}
                onChange={(imgs) => setLogoUrl(imgs.length > 0 ? imgs[imgs.length - 1] : null)}
                label="الشعار"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>القالب الفني</CardTitle>
              <CardDescription>اختر المظهر العام للمتجر</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {themes.map((theme) => (
                  <div
                    key={theme.id}
                    className={cn(
                      "relative flex flex-col cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md",
                      activeTheme === theme.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setActiveTheme(theme.id)}
                  >
                    <div className={cn("h-32 w-full rounded-md border flex flex-col mb-4 overflow-hidden", theme.preview)}>
                      <div className="h-8 border-b border-inherit flex items-center px-2 gap-2 opacity-50">
                        <div className={cn("h-3 w-3 rounded-full", theme.primary)}></div>
                        <div className={cn("h-3 w-12 rounded", theme.secondary)}></div>
                      </div>
                      <div className="flex-1 p-3 flex gap-2">
                        <div className={cn("flex-1 rounded-sm opacity-20", theme.primary)}></div>
                        <div className={cn("w-1/3 rounded-sm opacity-20", theme.secondary)}></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{theme.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border flex items-center justify-center",
                        activeTheme === theme.id ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                        {activeTheme === theme.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>معلومات المتجر الأساسية</CardTitle>
              <CardDescription>تظهر هذه المعلومات للعملاء في واجهة المتجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="storeName">اسم المتجر</Label>
                  <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">الشعار اللفظي (Tagline)</Label>
                  <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">البريد الإلكتروني للتواصل</Label>
                  <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">رقم الهاتف</Label>
                  <Input id="contactPhone" type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} dir="ltr" className="text-left" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان الفعلي</Label>
                <Textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الشحن</CardTitle>
              <CardDescription>تحديد تكلفة الشحن وشروط الشحن المجاني</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="flatShippingRate">تكلفة الشحن الثابتة (ريال)</Label>
                <Input 
                  id="flatShippingRate" 
                  type="number" 
                  min="0"
                  value={flatShippingRate} 
                  onChange={(e) => setFlatShippingRate(Number(e.target.value))} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">تفعيل الشحن المجاني</Label>
                  <p className="text-sm text-muted-foreground">تقديم شحن مجاني للطلبات التي تتجاوز قيمة معينة</p>
                </div>
                <Switch checked={enableFreeShipping} onCheckedChange={setEnableFreeShipping} />
              </div>

              {enableFreeShipping && (
                <div className="space-y-2 md:w-1/2 animate-in fade-in slide-in-from-top-2">
                  <Label htmlFor="freeShippingThreshold">الحد الأدنى للشحن المجاني (ريال)</Label>
                  <Input 
                    id="freeShippingThreshold" 
                    type="number" 
                    min="0"
                    value={freeShippingThreshold || 0} 
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))} 
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>إعدادات الضرائب</CardTitle>
              <CardDescription>تحديد نسبة الضريبة وعرضها</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 md:w-1/2">
                <Label htmlFor="taxRate">نسبة الضريبة (%)</Label>
                <Input 
                  id="taxRate" 
                  type="number" 
                  min="0" 
                  max="100"
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Number(e.target.value))} 
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-base">الأسعار تشمل الضريبة</Label>
                  <p className="text-sm text-muted-foreground">إذا تم التفعيل، لن يتم إضافة الضريبة عند الدفع</p>
                </div>
                <Switch checked={taxInclusive} onCheckedChange={setTaxInclusive} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>حسابات التواصل الاجتماعي</CardTitle>
              <CardDescription>تظهر روابط هذه الحسابات في أسفل المتجر</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="facebookUrl">رابط صفحة فيسبوك</Label>
                  <Input id="facebookUrl" placeholder="https://facebook.com/..." value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagramUrl">رابط حساب انستغرام</Label>
                  <Input id="instagramUrl" placeholder="https://instagram.com/..." value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">رابط حساب تويتر (X)</Label>
                  <Input id="twitterUrl" placeholder="https://twitter.com/..." value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} dir="ltr" className="text-left" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">رقم واتساب للتواصل</Label>
                  <Input id="whatsappNumber" placeholder="+966500000000" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} dir="ltr" className="text-left" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
