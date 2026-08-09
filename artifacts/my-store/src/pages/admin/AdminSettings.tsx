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
  const [navbarBgColor, setNavbarBgColor] = useState<string | null>(null);
  const [navbarTextColor, setNavbarTextColor] = useState<string | null>(null);
  const [navbarColorsEnabled, setNavbarColorsEnabled] = useState(false);
  const [drawerBgColor, setDrawerBgColor] = useState<string | null>(null);
  const [drawerTextColor, setDrawerTextColor] = useState<string | null>(null);
  const [drawerColorsEnabled, setDrawerColorsEnabled] = useState(false);
  const [refundPolicy, setRefundPolicy] = useState<string>('');
  const [heroBgImage, setHeroBgImage] = useState<string | null>(null);
  const [heroBgOpacity, setHeroBgOpacity] = useState(0.3);
  const [footerBgColor, setFooterBgColor] = useState<string | null>(null);
  const [footerTextColor, setFooterTextColor] = useState<string | null>(null);
  const [footerPadding, setFooterPadding] = useState<string>('normal');
  const [footerColorsEnabled, setFooterColorsEnabled] = useState(false);
  // Payment method badges
  const [paymentVisaEnabled, setPaymentVisaEnabled] = useState(true);
  const [paymentMastercardEnabled, setPaymentMastercardEnabled] = useState(true);
  const [paymentMadaEnabled, setPaymentMadaEnabled] = useState(true);
  const [paymentApplePayEnabled, setPaymentApplePayEnabled] = useState(false);
  const [paymentStcPayEnabled, setPaymentStcPayEnabled] = useState(false);

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
      setNavbarBgColor(settings.navbarBgColor ?? null);
      setNavbarTextColor(settings.navbarTextColor ?? null);
      setNavbarColorsEnabled(!!(settings.navbarBgColor || settings.navbarTextColor));
      setDrawerBgColor(settings.drawerBgColor ?? null);
      setDrawerTextColor(settings.drawerTextColor ?? null);
      setDrawerColorsEnabled(!!(settings.drawerBgColor || settings.drawerTextColor));
      setRefundPolicy(settings.refundPolicy ?? '');
      setHeroBgImage(settings.heroBgImage ?? null);
      setHeroBgOpacity(settings.heroBgOpacity ?? 0.3);
      setFooterBgColor(settings.footerBgColor ?? null);
      setFooterTextColor(settings.footerTextColor ?? null);
      setFooterPadding(settings.footerPadding ?? 'normal');
      setFooterColorsEnabled(!!(settings.footerBgColor || settings.footerTextColor));
      setPaymentVisaEnabled((settings as any).paymentVisaEnabled ?? true);
      setPaymentMastercardEnabled((settings as any).paymentMastercardEnabled ?? true);
      setPaymentMadaEnabled((settings as any).paymentMadaEnabled ?? true);
      setPaymentApplePayEnabled((settings as any).paymentApplePayEnabled ?? false);
      setPaymentStcPayEnabled((settings as any).paymentStcPayEnabled ?? false);
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
        navbarBgColor: navbarColorsEnabled ? (navbarBgColor || null) : null,
        navbarTextColor: navbarColorsEnabled ? (navbarTextColor || null) : null,
        drawerBgColor: drawerColorsEnabled ? (drawerBgColor || null) : null,
        drawerTextColor: drawerColorsEnabled ? (drawerTextColor || null) : null,
        refundPolicy: refundPolicy || null,
        heroBgImage: heroBgImage || null,
        heroBgOpacity,
        footerBgColor: footerColorsEnabled ? (footerBgColor || null) : null,
        footerTextColor: footerColorsEnabled ? (footerTextColor || null) : null,
        footerPadding: footerPadding || null,
        paymentVisaEnabled,
        paymentMastercardEnabled,
        paymentMadaEnabled,
        paymentApplePayEnabled,
        paymentStcPayEnabled,
      } as any
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
    },
    {
      id: 'emerald' as StoreSettingsUpdateActiveTheme,
      name: 'زمرد (Emerald)',
      description: 'غابة داكنة عميقة مع زمرد متوهج وذهب فاخر',
      preview: 'bg-[#060f0a] border-[#1a6640]',
      primary: 'bg-[#14a04b]',
      secondary: 'bg-[#c9952a]'
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
          {/* Navbar Custom Colors */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle>ألوان شريط التنقل</CardTitle>
                  <CardDescription>
                    {navbarColorsEnabled
                      ? 'خصّص لون خلفية ونصوص شريط التنقل العلوي للمتجر'
                      : 'التخصيص معطَّل — يستخدم المتجر ألوان القالب الافتراضية'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 pt-0.5 shrink-0">
                  <Label htmlFor="navbarColorsToggle" className="text-sm text-muted-foreground cursor-pointer select-none">
                    {navbarColorsEnabled ? 'مفعّل' : 'معطَّل'}
                  </Label>
                  <Switch
                    id="navbarColorsToggle"
                    checked={navbarColorsEnabled}
                    onCheckedChange={(checked) => {
                      setNavbarColorsEnabled(checked);
                      // When disabling, clear stored colors so the preview updates immediately
                      if (!checked) {
                        setNavbarBgColor(null);
                        setNavbarTextColor(null);
                      }
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            {navbarColorsEnabled && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Background color */}
                  <div className="space-y-3">
                    <Label>لون الخلفية</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={navbarBgColor || '#0f172a'}
                        onChange={(e) => setNavbarBgColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={navbarBgColor || ''}
                        onChange={(e) => setNavbarBgColor(e.target.value || null)}
                        placeholder="مثال: #0f172a"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {navbarBgColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNavbarBgColor(null)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                    <div
                      className="h-10 rounded-md border border-border flex items-center justify-center text-xs"
                      style={{ background: navbarBgColor || undefined }}
                    >
                      <span style={{ color: navbarTextColor || undefined }}>معاينة الشريط</span>
                    </div>
                  </div>

                  {/* Text color */}
                  <div className="space-y-3">
                    <Label>لون النصوص</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={navbarTextColor || '#ffffff'}
                        onChange={(e) => setNavbarTextColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={navbarTextColor || ''}
                        onChange={(e) => setNavbarTextColor(e.target.value || null)}
                        placeholder="مثال: #ffffff"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {navbarTextColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNavbarTextColor(null)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                    <div
                      className="h-10 rounded-md border border-border flex items-center justify-center text-xs font-medium"
                      style={{ background: navbarBgColor || undefined, color: navbarTextColor || undefined }}
                    >
                      نص تجريبي — اسم المتجر
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── Drawer Colors ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    ألوان القائمة الجانبية (الموبايل)
                  </CardTitle>
                  <CardDescription>تخصيص لون خلفية ونصوص نافذة التنقل على الجوال</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {drawerColorsEnabled ? 'مفعّل' : 'معطَّل'}
                  </span>
                  <Switch
                    checked={drawerColorsEnabled}
                    onCheckedChange={(checked) => {
                      setDrawerColorsEnabled(checked);
                      if (!checked) {
                        setDrawerBgColor(null);
                        setDrawerTextColor(null);
                      }
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            {drawerColorsEnabled && (
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Background color */}
                  <div className="space-y-3">
                    <Label>لون الخلفية</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={drawerBgColor || '#ffffff'}
                        onChange={(e) => setDrawerBgColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={drawerBgColor || ''}
                        onChange={(e) => setDrawerBgColor(e.target.value || null)}
                        placeholder="مثال: #ffffff"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {drawerBgColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDrawerBgColor(null)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                    <div
                      className="h-10 rounded-md border border-border flex items-center justify-center text-xs"
                      style={{ background: drawerBgColor || undefined }}
                    >
                      <span style={{ color: drawerTextColor || undefined }}>معاينة الخلفية</span>
                    </div>
                  </div>

                  {/* Text color */}
                  <div className="space-y-3">
                    <Label>لون النصوص</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={drawerTextColor || '#111111'}
                        onChange={(e) => setDrawerTextColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={drawerTextColor || ''}
                        onChange={(e) => setDrawerTextColor(e.target.value || null)}
                        placeholder="مثال: #111111"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {drawerTextColor && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDrawerTextColor(null)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          حذف
                        </Button>
                      )}
                    </div>
                    <div
                      className="h-10 rounded-md border border-border flex items-center justify-center text-xs font-medium"
                      style={{ background: drawerBgColor || undefined, color: drawerTextColor || undefined }}
                    >
                      الرئيسية · كل المنتجات
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ── Hero Background Image ──────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>صورة خلفية الـ Hero</CardTitle>
              <CardDescription>
                صورة تظهر خلف نص القسم الرئيسي في الصفحة الرئيسية — الحجم الموصى به: <strong>1920 × 1080 px</strong>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploadField
                images={heroBgImage ? [heroBgImage] : []}
                onChange={(imgs) => setHeroBgImage(imgs.length > 0 ? imgs[imgs.length - 1] : null)}
                label="صورة الخلفية"
              />
              {heroBgImage && (
                <div className="mt-4 rounded-xl overflow-hidden border border-border h-40 relative bg-primary">
                  <img
                    src={heroBgImage}
                    alt="معاينة الخلفية"
                    className="w-full h-full object-cover"
                    style={{ opacity: heroBgOpacity }}
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-sm font-medium">معاينة الخلفية</span>
                  </div>
                </div>
              )}
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="heroBgOpacity">شفافية صورة الخلفية</Label>
                  <span className="text-sm font-bold text-primary">
                    {Math.round(heroBgOpacity * 100)}%
                  </span>
                </div>
                <input
                  id="heroBgOpacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={heroBgOpacity}
                  onChange={(e) => setHeroBgOpacity(Number(e.target.value))}
                  className="w-full accent-primary"
                  aria-label="شفافية صورة الخلفية"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>شفافة</span>
                  <span>واضحة بالكامل</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Footer Colors ─────────────────────────────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    ألوان وحجم الفوتر
                  </CardTitle>
                  <CardDescription>تخصيص ألوان الفوتر وحجم التبادد الداخلي</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {footerColorsEnabled ? 'مفعّل' : 'معطَّل'}
                  </span>
                  <Switch
                    checked={footerColorsEnabled}
                    onCheckedChange={(checked) => {
                      setFooterColorsEnabled(checked);
                      if (!checked) {
                        setFooterBgColor(null);
                        setFooterTextColor(null);
                      }
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {footerColorsEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bg color */}
                  <div className="space-y-3">
                    <Label>لون الخلفية</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={footerBgColor || '#0f172a'}
                        onChange={(e) => setFooterBgColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={footerBgColor || ''}
                        onChange={(e) => setFooterBgColor(e.target.value || null)}
                        placeholder="مثال: #0f172a"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {footerBgColor && (
                        <Button variant="ghost" size="sm" onClick={() => setFooterBgColor(null)} className="shrink-0 text-muted-foreground hover:text-destructive">حذف</Button>
                      )}
                    </div>
                  </div>
                  {/* Text color */}
                  <div className="space-y-3">
                    <Label>لون النصوص</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={footerTextColor || '#ffffff'}
                        onChange={(e) => setFooterTextColor(e.target.value)}
                        className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent p-0.5 shrink-0"
                      />
                      <Input
                        value={footerTextColor || ''}
                        onChange={(e) => setFooterTextColor(e.target.value || null)}
                        placeholder="مثال: #ffffff"
                        dir="ltr"
                        className="text-left font-mono text-sm"
                      />
                      {footerTextColor && (
                        <Button variant="ghost" size="sm" onClick={() => setFooterTextColor(null)} className="shrink-0 text-muted-foreground hover:text-destructive">حذف</Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer padding — always visible */}
              <div className="space-y-2 md:w-1/2">
                <Label>حجم التبادد الداخلي (Padding)</Label>
                <select
                  value={footerPadding}
                  onChange={(e) => setFooterPadding(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="nano">مصغّر (nano)</option>
                  <option value="mini">صغير جداً (mini)</option>
                  <option value="compact">مضغوط (compact)</option>
                  <option value="normal">عادي (normal)</option>
                  <option value="large">واسع (large)</option>
                </select>
              </div>

              {/* Preview */}
              <div
                className="rounded-xl border border-border p-4 text-xs flex items-center justify-center"
                style={{
                  background: footerColorsEnabled ? (footerBgColor || '#0f172a') : '#0f172a',
                  color: footerColorsEnabled ? (footerTextColor || '#ffffff') : '#ffffff',
                }}
              >
                معاينة الفوتر — {footerPadding === 'nano' ? 'مصغّر' : footerPadding === 'mini' ? 'صغير جداً' : footerPadding === 'compact' ? 'مضغوط' : footerPadding === 'large' ? 'واسع' : 'عادي'}
              </div>
            </CardContent>
          </Card>
          {/* ── Payment Method Badges ─────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💳</span>
                شعارات بوابات الدفع في الفوتر
              </CardTitle>
              <CardDescription>
                فعّل فقط وسائل الدفع التي تقبلها فعلاً — ستظهر شعاراتها في أسفل المتجر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    key: 'visa', label: 'Visa', description: 'بطاقات فيزا الائتمانية والمدفوعة مسبقاً',
                    checked: paymentVisaEnabled, onChange: setPaymentVisaEnabled,
                    badge: (
                      <span className="inline-flex items-center justify-center bg-white border rounded px-2 py-0.5 h-7 shadow-sm">
                        <svg viewBox="0 0 60 20" width="36" height="12" xmlns="http://www.w3.org/2000/svg">
                          <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#1A1F71">VISA</text>
                        </svg>
                      </span>
                    )
                  },
                  {
                    key: 'mastercard', label: 'Mastercard', description: 'بطاقات ماستركارد الائتمانية',
                    checked: paymentMastercardEnabled, onChange: setPaymentMastercardEnabled,
                    badge: (
                      <span className="inline-flex items-center justify-center bg-white border rounded px-2 py-0.5 h-7 shadow-sm">
                        <svg viewBox="0 0 38 24" width="32" height="20" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="13" cy="12" r="10" fill="#EB001B"/>
                          <circle cx="25" cy="12" r="10" fill="#F79E1B"/>
                          <path d="M19 5.27A10 10 0 0 1 23.73 12 10 10 0 0 1 19 18.73 10 10 0 0 1 14.27 12 10 10 0 0 1 19 5.27Z" fill="#FF5F00"/>
                        </svg>
                      </span>
                    )
                  },
                  {
                    key: 'mada', label: 'مدى (Mada)', description: 'البطاقات المصرفية السعودية المحلية',
                    checked: paymentMadaEnabled, onChange: setPaymentMadaEnabled,
                    badge: (
                      <span className="inline-flex items-center justify-center bg-white border rounded px-2 py-0.5 h-7 shadow-sm">
                        <svg viewBox="0 0 86 28" width="60" height="20" xmlns="http://www.w3.org/2000/svg">
                          <rect width="86" height="28" rx="3" fill="white"/>
                          <circle cx="16" cy="14" r="11" fill="#00B6AD"/>
                          <circle cx="27" cy="14" r="11" fill="#003F8A" opacity="0.88"/>
                          <text x="42" y="19" fontFamily="Arial" fontWeight="800" fontSize="13" fill="#003F8A">mada</text>
                        </svg>
                      </span>
                    )
                  },
                  {
                    key: 'applepay', label: 'Apple Pay', description: 'الدفع عبر Apple Pay (يتطلب إعداداً خاصاً مع Moyasar)',
                    checked: paymentApplePayEnabled, onChange: setPaymentApplePayEnabled,
                    badge: (
                      <span className="inline-flex items-center justify-center bg-black border rounded px-2 py-0.5 h-7 shadow-sm gap-1">
                        <svg viewBox="0 0 16 20" width="9" height="12" fill="white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.18 10.5c-.02-2.08 1.7-3.08 1.78-3.13-0.97-1.42-2.48-1.61-3.02-1.63-1.29-.13-2.52.76-3.17.76-.65 0-1.66-.74-2.73-.72C4.6 5.8 3.1 6.65 2.27 8.02 0.57 10.8 1.83 14.92 3.47 17.2c.82 1.17 1.79 2.48 3.07 2.43 1.23-.05 1.7-.79 3.19-.79 1.49 0 1.91.79 3.22.77 1.33-.02 2.17-1.2 2.98-2.38.94-1.36 1.33-2.68 1.35-2.75-.03-.01-2.58-1-2.6-3.98zm-2.44-7.3c.68-.82 1.14-1.97 1.01-3.11-.98.04-2.16.65-2.86 1.47-.63.72-1.18 1.88-1.03 2.99 1.09.08 2.2-.55 2.88-1.35z"/>
                        </svg>
                        <span style={{ color: 'white', fontSize: '10px', fontFamily: 'Arial', fontWeight: 600 }}>Pay</span>
                      </span>
                    )
                  },
                  {
                    key: 'stcpay', label: 'STC Pay', description: 'المحفظة الرقمية من STC',
                    checked: paymentStcPayEnabled, onChange: setPaymentStcPayEnabled,
                    badge: (
                      <span className="inline-flex items-center justify-center bg-white border rounded px-2 py-0.5 h-7 shadow-sm">
                        <svg viewBox="0 0 54 20" width="42" height="15" xmlns="http://www.w3.org/2000/svg">
                          <text x="1" y="15" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#6D2077">STC</text>
                          <rect x="30" y="2" width="22" height="16" rx="3" fill="#6D2077"/>
                          <text x="33" y="14" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">Pay</text>
                        </svg>
                      </span>
                    )
                  },
                ].map(({ key, label, description, checked, onChange, badge }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      {badge}
                      <div>
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">{description}</p>
                      </div>
                    </div>
                    <Switch checked={checked} onCheckedChange={onChange} />
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

          {/* Refund Policy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                سياسة الاسترجاع
              </CardTitle>
              <CardDescription>
                هذا النص يظهر للعملاء في صفحة سياسة الاسترجاع — اتركه فارغاً لإخفاء الصفحة من الفوتر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="refundPolicy"
                value={refundPolicy}
                onChange={(e) => setRefundPolicy(e.target.value)}
                rows={8}
                placeholder="مثال: يمكن استرجاع المنتجات خلال 7 أيام من تاريخ الاستلام بشرط..."
              />
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
