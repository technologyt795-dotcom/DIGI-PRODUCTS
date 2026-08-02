import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Mail, Users, BarChart2, Send, Trash2, Plus,
  CheckCircle, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Crown, Repeat2, UserPlus, Clock, TrendingUp, ShoppingBag,
  Settings, Eye, MessageCircle, Star, Tag, Copy, Check,
  Smartphone, Zap, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useQueryClient } from '@tanstack/react-query';
import { getGetSettingsQueryKey } from '@workspace/api-client-react';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'promo' | 'coupons' | 'whatsapp' | 'campaigns' | 'reviews_req' | 'segments' | 'stats';

type Campaign = {
  id: number; title: string; subject: string; body: string;
  segment: string; status: string; recipientCount: number;
  sentAt: string | null; createdAt: string;
};

type Discount = {
  id: number; code: string; type: 'percentage' | 'fixed'; value: number;
  minOrderAmount: number | null; maxUses: number | null; usedCount: number;
  expiresAt: string | null; isActive: boolean; createdAt: string;
};

type Customer = { id: number; name: string; email: string; phone: string };

type SegmentCustomer = {
  id: number; name: string; email: string;
  totalSpend: number; orderCount: number;
};

type SegmentsData = {
  total: number;
  segments: Record<string, { count: number; customers: SegmentCustomer[] }>;
};

type StatsData = {
  topProducts: { id: number; name: string; revenue: number; unitsSold: number }[];
  revenueByCategory: { category: string; revenue: number }[];
  topCustomers: { id: number; name: string; email: string; orderCount: number; totalSpend: number }[];
  repeatPurchaseRate: number;
  averageOrderValue: number;
};

type Settings = Record<string, unknown>;

const SEGMENT_META: Record<string, { label: string; icon: typeof Crown; color: string; desc: string }> = {
  vip:      { label: 'VIP',        icon: Crown,    color: 'text-yellow-500', desc: 'أعلى 20% بالإنفاق' },
  frequent: { label: 'متكررون',    icon: Repeat2,  color: 'text-blue-500',  desc: '3 طلبات أو أكثر' },
  new:      { label: 'جدد',        icon: UserPlus, color: 'text-green-500', desc: 'أول طلب خلال 30 يوم' },
  inactive: { label: 'غير نشطين', icon: Clock,    color: 'text-red-400',   desc: 'لم يشتروا منذ 60 يوم' },
};

const SEGMENT_LABELS: Record<string, string> = {
  all: 'كل العملاء', vip: 'VIP', frequent: 'متكررون', new: 'جدد', inactive: 'غير نشطين',
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function randomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminMarketing() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('promo');

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'promo',       label: 'الترويج',     icon: Megaphone },
    { id: 'coupons',     label: 'الكوبونات',   icon: Tag },
    { id: 'whatsapp',    label: 'واتساب',       icon: MessageCircle },
    { id: 'campaigns',   label: 'البريد',       icon: Mail },
    { id: 'reviews_req', label: 'المراجعات',   icon: Star },
    { id: 'segments',    label: 'العملاء',     icon: Users },
    { id: 'stats',       label: 'الإحصائيات', icon: BarChart2 },
  ];

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          التسويق
        </h1>
        <p className="text-muted-foreground text-sm mt-1">أدوات تسويقية متكاملة لزيادة المبيعات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-1 justify-center
                ${tab === t.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'promo'       && <PromoTab token={token!} />}
      {tab === 'coupons'     && <CouponsTab token={token!} />}
      {tab === 'whatsapp'    && <WhatsAppTab token={token!} />}
      {tab === 'campaigns'   && <CampaignsTab token={token!} />}
      {tab === 'reviews_req' && <ReviewRequestsTab token={token!} />}
      {tab === 'segments'    && <SegmentsTab token={token!} />}
      {tab === 'stats'       && <StatsTab token={token!} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Promo (Banner + Popup)
// ══════════════════════════════════════════════════════════════════════════════
function PromoTab({ token }: { token: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'banner' | 'popup' | null>(null);
  const queryClient = useQueryClient();

  // Banner state
  const [bannerEnabled, setBannerEnabled] = useState(false);
  const [bannerText, setBannerText] = useState('');
  const [bannerColor, setBannerColor] = useState('primary');
  const [bannerLink, setBannerLink] = useState('');

  // Popup state
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupCode, setPopupCode] = useState('');
  const [popupDelay, setPopupDelay] = useState(3);

  const colors = [
    { id: 'primary', label: 'الأساسي', cls: 'bg-primary' },
    { id: 'green',   label: 'أخضر',   cls: 'bg-emerald-600' },
    { id: 'orange',  label: 'برتقالي', cls: 'bg-orange-500' },
    { id: 'red',     label: 'أحمر',   cls: 'bg-red-600' },
    { id: 'purple',  label: 'بنفسجي', cls: 'bg-purple-600' },
    { id: 'dark',    label: 'داكن',   cls: 'bg-gray-900' },
  ];

  useEffect(() => {
    fetch(`${BASE}/settings`)
      .then(r => r.json())
      .then((s: Settings) => {
        setBannerEnabled(Boolean(s.announcementBarEnabled));
        setBannerText(String(s.announcementBarText ?? ''));
        setBannerColor(String(s.announcementBarColor ?? 'primary'));
        setBannerLink(String(s.announcementBarLink ?? ''));
        setPopupEnabled(Boolean(s.popupEnabled));
        setPopupTitle(String(s.popupTitle ?? ''));
        setPopupMessage(String(s.popupMessage ?? ''));
        setPopupCode(String(s.popupDiscountCode ?? ''));
        setPopupDelay(Number(s.popupDelay ?? 3));
      })
      .finally(() => setLoading(false));
  }, []);

  const invalidateSettings = () =>
    queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });

  const saveBanner = async () => {
    setSaving('banner');
    try {
      const r = await fetch(`${BASE}/admin/settings`, {
        method: 'PUT', headers: authHeader(token),
        body: JSON.stringify({
          announcementBarEnabled: bannerEnabled,
          announcementBarText: bannerText,
          announcementBarColor: bannerColor,
          announcementBarLink: bannerLink || null,
        }),
      });
      if (r.ok) { invalidateSettings(); toast.success('تم حفظ البانر'); }
      else toast.error('فشل الحفظ');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(null); }
  };

  const savePopup = async () => {
    setSaving('popup');
    try {
      const r = await fetch(`${BASE}/admin/settings`, {
        method: 'PUT', headers: authHeader(token),
        body: JSON.stringify({
          popupEnabled,
          popupTitle: popupTitle || null,
          popupMessage: popupMessage || null,
          popupDiscountCode: popupCode || null,
          popupDelay,
        }),
      });
      if (r.ok) { invalidateSettings(); toast.success('تم حفظ النافذة المنبثقة'); }
      else toast.error('فشل الحفظ');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(null); }
  };

  if (loading) return <Spinner />;

  const colorCls = colors.find(c => c.id === bannerColor)?.cls ?? 'bg-primary';

  return (
    <div className="space-y-6">
      {/* ── Banner ── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Megaphone className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">البانر الإعلاني</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">شريط إعلاني يظهر أعلى المتجر</p>

        {bannerText && (
          <div className={`${colorCls} text-white rounded-xl p-3 text-center text-sm font-medium`}>
            <Megaphone className="inline h-4 w-4 ml-2" />{bannerText}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">تفعيل البانر</span>
          <Toggle value={bannerEnabled} onChange={setBannerEnabled} />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">نص الإعلان</label>
          <Input value={bannerText} onChange={e => setBannerText(e.target.value)}
            placeholder="🎉 شحن مجاني على الطلبات فوق 100 ريال!" maxLength={120} />
          <p className="text-xs text-muted-foreground text-left">{bannerText.length}/120</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">اللون</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map(c => (
              <button key={c.id} onClick={() => setBannerColor(c.id)}
                className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${bannerColor === c.id ? 'border-primary' : 'border-transparent'}`}>
                <span className={`w-7 h-7 rounded-md ${c.cls}`} />
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">الرابط (اختياري)</label>
          <Input value={bannerLink} onChange={e => setBannerLink(e.target.value)} placeholder="https://..." type="url" />
        </div>

        <Button onClick={saveBanner} disabled={saving === 'banner'} className="w-full font-bold">
          {saving === 'banner' ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}حفظ البانر
        </Button>
      </div>

      {/* ── Popup ── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-lg">النافذة المنبثقة (Popup)</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">نافذة ترحيبية تظهر للزوار بعد ثوانٍ من دخولهم المتجر</p>

        {/* Live Preview */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />معاينة مباشرة
          </p>
          <div className="rounded-2xl overflow-hidden shadow-xl border border-border max-w-xs mx-auto" dir="rtl">
            {/* Gradient header */}
            <div
              className="relative px-5 pt-6 pb-8 text-white text-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
            >
              <div className="absolute -top-5 -right-5 w-20 h-20 rounded-full opacity-20 bg-white" />
              <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-full opacity-15 bg-white" />
              <div className="absolute top-3 left-6 w-2.5 h-2.5 rounded-full opacity-40 bg-white" />

              <X className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-white/60" />

              <div className="flex justify-center mb-2.5">
                <div className="h-11 w-11 rounded-xl bg-white/25 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
              </div>

              <p className="font-black text-sm leading-snug drop-shadow-sm">
                {popupTitle || <span className="opacity-50">عنوان النافذة</span>}
              </p>
              {(popupMessage || !popupTitle) && (
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  {popupMessage || <span className="opacity-50">نص الرسالة الترحيبية</span>}
                </p>
              )}
            </div>

            {/* White body */}
            <div className="bg-card px-5 pb-5 -mt-0.5">
              {popupCode ? (
                <div className="relative -mt-4 mb-4 rounded-xl border-2 border-dashed border-primary/40 p-3 text-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.06) 0%, hsl(var(--primary)/0.12) 100%)' }}>
                  <p className="text-xs text-muted-foreground font-semibold mb-0.5">كود الخصم</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-mono font-black text-xl text-primary tracking-[0.2em]">{popupCode}</span>
                    <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                      <Copy className="h-3.5 w-3.5 text-primary" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">اضغط لنسخ الكود</p>
                </div>
              ) : (
                <div className="h-3" />
              )}
              <button
                className="w-full rounded-xl py-2.5 text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)', boxShadow: '0 3px 12px rgba(99,102,241,0.3)' }}
              >
                تسوق الآن ←
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">تفعيل النافذة</span>
          <Toggle value={popupEnabled} onChange={setPopupEnabled} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold">العنوان</label>
            <Input value={popupTitle} onChange={e => setPopupTitle(e.target.value)} placeholder="🎁 عرض خاص للزوار الجدد!" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-semibold">كود الخصم (اختياري)</label>
            <Input value={popupCode} onChange={e => setPopupCode(e.target.value.toUpperCase())} placeholder="WELCOME10" className="font-mono" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">الرسالة</label>
          <Input value={popupMessage} onChange={e => setPopupMessage(e.target.value)} placeholder="اشترك الآن واحصل على خصم 10% على أول طلب" />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">التأخير قبل الظهور (ثانية)</label>
          <Input type="number" min={0} max={30} value={popupDelay} onChange={e => setPopupDelay(Number(e.target.value))} className="w-32" />
        </div>

        <Button onClick={savePopup} disabled={saving === 'popup'} className="w-full font-bold">
          {saving === 'popup' ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}حفظ النافذة
        </Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Coupons
// ══════════════════════════════════════════════════════════════════════════════
function CouponsTab({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [form, setForm] = useState({ code: randomCode(), type: 'percentage', value: 10, minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`${BASE}/admin/discounts`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) setCoupons(await r.json());
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const create = async () => {
    if (!form.code || !form.value) { toast.error('أدخل الكود والقيمة'); return; }
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        code: form.code.toUpperCase(), type: form.type, value: Number(form.value), isActive: form.isActive,
      };
      if (form.minOrderAmount) body.minOrderAmount = Number(form.minOrderAmount);
      if (form.maxUses) body.maxUses = Number(form.maxUses);
      if (form.expiresAt) body.expiresAt = form.expiresAt;

      const r = await fetch(`${BASE}/admin/discounts`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(body) });
      if (r.ok) {
        toast.success('تم إنشاء الكوبون');
        setShowForm(false);
        setForm({ code: randomCode(), type: 'percentage', value: 10, minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true });
        load();
      } else {
        const d = await r.json();
        toast.error(d.error ?? 'فشل الإنشاء');
      }
    } finally { setCreating(false); }
  };

  const toggle = async (id: number, isActive: boolean) => {
    await fetch(`${BASE}/admin/discounts/${id}`, { method: 'PATCH', headers: authHeader(token), body: JSON.stringify({ isActive }) });
    setCoupons(cs => cs.map(c => c.id === id ? { ...c, isActive } : c));
  };

  const remove = async (id: number) => {
    if (!confirm('حذف هذا الكوبون؟')) return;
    await fetch(`${BASE}/admin/discounts/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCoupons(cs => cs.filter(c => c.id !== id));
    toast.success('تم الحذف');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{coupons.length} كوبون</p>
        <Button size="sm" onClick={() => setShowForm(v => !v)} className="gap-1 font-bold">
          <Plus className="h-4 w-4" />كوبون جديد
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h3 className="font-bold">إنشاء كوبون خصم جديد</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">كود الخصم</label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className="font-mono" />
                <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, code: randomCode() }))} className="shrink-0">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">نوع الخصم</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
                <option value="percentage">نسبة مئوية (%)</option>
                <option value="fixed">مبلغ ثابت (ريال)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">القيمة ({form.type === 'percentage' ? '%' : 'ريال'})</label>
              <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: Number(e.target.value) }))} min={0} max={form.type === 'percentage' ? 100 : undefined} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">حد أدنى للطلب (اختياري)</label>
              <Input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))} placeholder="مثال: 100" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">عدد الاستخدامات (اختياري)</label>
              <Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="غير محدود" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">تاريخ الانتهاء (اختياري)</label>
              <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={create} disabled={creating} className="flex-1 font-bold gap-1">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}إنشاء الكوبون
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} className="font-bold">إلغاء</Button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : coupons.length === 0 ? (
        <Empty icon={Tag} text="لا توجد كوبونات بعد. أنشئ أول كوبون خصم!" />
      ) : (
        <div className="space-y-3">
          {coupons.map(c => (
            <div key={c.id} className={`bg-card border rounded-xl p-4 transition-opacity ${c.isActive ? 'border-border' : 'border-border opacity-60'}`}>
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => copyCode(c.code)} className="flex items-center gap-2 font-mono font-black text-lg text-primary hover:opacity-70 transition-opacity">
                  {copied === c.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {c.code}
                </button>
                <div className="flex gap-2 flex-wrap text-xs">
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                    {c.type === 'percentage' ? `${c.value}%` : `${c.value} ريال`}
                  </span>
                  {c.minOrderAmount != null && <span className="bg-muted px-2 py-0.5 rounded-full">حد أدنى: {c.minOrderAmount} ريال</span>}
                  {c.maxUses != null && <span className="bg-muted px-2 py-0.5 rounded-full">{c.usedCount}/{c.maxUses} استخدام</span>}
                  {!c.maxUses && c.usedCount > 0 && <span className="bg-muted px-2 py-0.5 rounded-full">{c.usedCount} استخدام</span>}
                  {c.expiresAt && <span className="bg-muted px-2 py-0.5 rounded-full">ينتهي: {new Date(c.expiresAt).toLocaleDateString('ar-SA')}</span>}
                </div>
                <div className="mr-auto flex items-center gap-2">
                  <Toggle value={c.isActive} onChange={v => toggle(c.id, v)} small />
                  <button onClick={() => remove(c.id)} className="text-destructive hover:opacity-70 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — WhatsApp Broadcast
// ══════════════════════════════════════════════════════════════════════════════
function WhatsAppTab({ token }: { token: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('مرحباً {{name}}، لدينا عروض حصرية خصيصاً لك! تفضل بزيارة متجرنا الآن 🛍️');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`${BASE}/admin/marketing/customers-phones`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: Customer[]) => setCustomers(data))
      .finally(() => setLoading(false));
  }, [token]);

  const withPhone = customers.filter(c => c.phone && c.phone.trim() !== '');
  const filtered = withPhone.filter(c =>
    !search || c.name.includes(search) || c.phone.includes(search)
  );

  const openWhatsApp = (customer: Customer) => {
    const phone = customer.phone.replace(/\D/g, '');
    const text = message.replace(/\{\{name\}\}/g, customer.name);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-primary">{customers.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">إجمالي العملاء</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-500">{withPhone.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">لديهم واتساب</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-muted-foreground">{customers.length - withPhone.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">بدون رقم</p>
        </div>
      </div>

      {/* Message template */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          <h3 className="font-bold">نص الرسالة</h3>
        </div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-y"
          placeholder="اكتب رسالتك... يمكنك استخدام {{name}} لاسم العميل"
        />
        <p className="text-xs text-muted-foreground">
          المتغيرات: <code className="bg-muted px-1 rounded">{'{{name}}'}</code> — اسم العميل
        </p>
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الرقم..." className="flex-1" />
        </div>

        {loading ? <Spinner /> : filtered.length === 0 ? (
          <Empty icon={Smartphone} text={withPhone.length === 0 ? 'لا يوجد عملاء لديهم أرقام هاتف' : 'لا توجد نتائج'} />
        ) : (
          <div className="space-y-2">
            {filtered.map(c => (
              <div key={c.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.phone}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => openWhatsApp(c)}
                  className="gap-1.5 bg-green-600 hover:bg-green-700 text-white font-bold shrink-0"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  واتساب
                </Button>
              </div>
            ))}
            {filtered.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-1">{filtered.length} عميل</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 4 — Email Campaigns
// ══════════════════════════════════════════════════════════════════════════════
function CampaignsTab({ token }: { token: string }) {
  const [subTab, setSubTab] = useState<'list' | 'new' | 'smtp'>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/campaigns`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setCampaigns(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const sendCampaign = async (id: number) => {
    if (!confirm('سيتم إرسال هذه الحملة فوراً. هل أنت متأكد؟')) return;
    setSending(id);
    try {
      const r = await fetch(`${BASE}/admin/marketing/campaigns/${id}/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) { toast.success(`تم الإرسال لـ ${d.sent} عميل${d.failed > 0 ? ` (فشل ${d.failed})` : ''}`); load(); }
      else toast.error(d.error ?? 'فشل الإرسال');
    } finally { setSending(null); }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('حذف هذه الحملة؟')) return;
    setDeleting(id);
    await fetch(`${BASE}/admin/marketing/campaigns/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setCampaigns(c => c.filter(x => x.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([['list', 'الحملات'], ['new', 'حملة جديدة'], ['smtp', 'إعدادات SMTP']] as const).map(([id, lbl]) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors
              ${subTab === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}>
            {lbl}
          </button>
        ))}
      </div>

      {subTab === 'list' && (
        <div className="space-y-3">
          {loading ? <Spinner /> : campaigns.length === 0 ? <Empty icon={Mail} text="لا توجد حملات. أنشئ حملتك الأولى!" /> : campaigns.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{c.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.status === 'sent' ? 'تم الإرسال' : 'مسودة'}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{SEGMENT_LABELS[c.segment] ?? c.segment}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">الموضوع: {c.subject}</p>
                  {c.status === 'sent' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      أُرسلت لـ {c.recipientCount} عميل · {new Date(c.sentAt!).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {c.status === 'draft' && (
                    <Button size="sm" onClick={() => sendCampaign(c.id)} disabled={sending === c.id} className="gap-1 font-bold">
                      {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}إرسال
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => deleteCampaign(c.id)} disabled={deleting === c.id} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {subTab === 'new' && <NewCampaignForm token={token} onCreated={() => { load(); setSubTab('list'); }} />}
      {subTab === 'smtp' && <SmtpForm token={token} />}
    </div>
  );
}

function NewCampaignForm({ token, onCreated }: { token: string; onCreated: () => void }) {
  const [form, setForm] = useState({ title: '', subject: '', segment: 'all', body: '' });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);

  const TEMPLATE = `<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333">
  <h2 style="color:#6366f1">مرحباً {{customerName}}،</h2>
  <p>نود أن نُعلمك بأحدث عروضنا وتخفيضاتنا الحصرية.</p>
  <p>اكتشف تشكيلتنا الجديدة الآن وتمتع بأفضل الأسعار!</p>
  <a href="#" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
    تسوق الآن ←
  </a>
  <hr style="margin:24px 0;border:none;border-top:1px solid #eee"/>
  <p style="font-size:12px;color:#999">{{storeName}}</p>
</div>`;

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const save = async (sendNow = false) => {
    if (!form.title || !form.subject || !form.body) { toast.error('يرجى تعبئة جميع الحقول'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/campaigns`, { method: 'POST', headers: authHeader(token), body: JSON.stringify(form) });
      if (!r.ok) { toast.error('فشل الحفظ'); return; }
      const c = await r.json() as Campaign;
      if (sendNow) {
        const sr = await fetch(`${BASE}/admin/marketing/campaigns/${c.id}/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const sd = await sr.json();
        if (sr.ok) toast.success(`تم الإرسال لـ ${sd.sent} عميل`);
        else toast.error(sd.error ?? 'فشل الإرسال');
      } else { toast.success('تم حفظ الحملة كمسودة'); }
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg">حملة بريدية جديدة</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">اسم الحملة</label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: عرض رمضان 2026" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">موضوع البريد</label>
          <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="مثال: 🎉 عرض حصري لك!" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-semibold">الشريحة المستهدفة</label>
        <select value={form.segment} onChange={e => set('segment', e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm">
          {Object.entries(SEGMENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">محتوى البريد (HTML)</label>
          <div className="flex gap-2">
            <button onClick={() => { if (!form.body) set('body', TEMPLATE); }} className="text-xs text-primary hover:underline">استخدم القالب</button>
            <button onClick={() => setPreview(v => !v)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Eye className="h-3 w-3" />{preview ? 'تعديل' : 'معاينة'}
            </button>
          </div>
        </div>
        {preview ? (
          <div className="border border-border rounded-xl p-4 bg-white min-h-[200px] max-h-[400px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: form.body.replace(/\{\{customerName\}\}/g, 'أحمد').replace(/\{\{storeName\}\}/g, 'المتجر') }} />
        ) : (
          <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={10}
            placeholder="اكتب HTML هنا... أو استخدم القالب أعلاه"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono resize-y" />
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={() => save(false)} disabled={saving} variant="outline" className="flex-1 font-bold">حفظ كمسودة</Button>
        <Button onClick={() => save(true)} disabled={saving} className="flex-1 font-bold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}إرسال الآن
        </Button>
      </div>
    </div>
  );
}

function SmtpForm({ token }: { token: string }) {
  const [form, setForm] = useState({ smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', smtpPass: '', smtpFrom: '' });
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${BASE}/settings`).then(r => r.json()).then((s: Settings) => {
      if (s.smtpHost) setForm(f => ({ ...f, smtpHost: s.smtpHost as string }));
      if (s.smtpPort) setForm(f => ({ ...f, smtpPort: s.smtpPort as number }));
      if (s.smtpSecure !== undefined) setForm(f => ({ ...f, smtpSecure: s.smtpSecure as boolean }));
      if (s.smtpUser) setForm(f => ({ ...f, smtpUser: s.smtpUser as string }));
      if (s.smtpFrom) setForm(f => ({ ...f, smtpFrom: s.smtpFrom as string }));
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/admin/settings`, { method: 'PUT', headers: authHeader(token), body: JSON.stringify(form) });
      toast.success('تم حفظ إعدادات SMTP');
    } catch { toast.error('فشل الحفظ'); } finally { setSaving(false); }
  };

  const testSmtp = async () => {
    if (!testEmail) { toast.error('أدخل بريد الاختبار'); return; }
    setTesting(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/smtp/test`, { method: 'POST', headers: authHeader(token), body: JSON.stringify({ ...form, testEmail }) });
      const d = await r.json();
      if (r.ok) toast.success('✅ تم الاختبار بنجاح!');
      else toast.error(d.error ?? 'فشل الاتصال');
    } finally { setTesting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">إعدادات SMTP</h3>
      </div>
      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        💡 لـ Gmail: smtp.gmail.com · منفذ 587. تحتاج <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary hover:underline">كلمة مرور التطبيق</a>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">خادم SMTP</label>
          <Input value={form.smtpHost} onChange={e => setForm(f => ({ ...f, smtpHost: e.target.value }))} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">المنفذ</label>
          <Input type="number" value={form.smtpPort} onChange={e => setForm(f => ({ ...f, smtpPort: Number(e.target.value) }))} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">البريد / اسم المستخدم</label>
          <Input value={form.smtpUser} onChange={e => setForm(f => ({ ...f, smtpUser: e.target.value }))} placeholder="your@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">كلمة المرور / App Password</label>
          <Input type="password" value={form.smtpPass} onChange={e => setForm(f => ({ ...f, smtpPass: e.target.value }))} placeholder="••••••••••••" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">اسم المرسل</label>
          <Input value={form.smtpFrom} onChange={e => setForm(f => ({ ...f, smtpFrom: e.target.value }))} placeholder="متجرك <store@email.com>" />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input id="smtpSecure" type="checkbox" checked={form.smtpSecure} onChange={e => setForm(f => ({ ...f, smtpSecure: e.target.checked }))} className="h-4 w-4 rounded" />
          <label htmlFor="smtpSecure" className="text-sm font-medium cursor-pointer">TLS/SSL (منفذ 465)</label>
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        <Button onClick={save} disabled={saving} className="font-bold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}حفظ الإعدادات
        </Button>
        <div className="flex gap-2 flex-1">
          <Input value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="بريد الاختبار" type="email" className="flex-1" />
          <Button variant="outline" onClick={testSmtp} disabled={testing} className="font-bold gap-2 shrink-0">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}اختبر
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 5 — Review Requests
// ══════════════════════════════════════════════════════════════════════════════
function ReviewRequestsTab({ token }: { token: string }) {
  const [preview, setPreview] = useState<{ count: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [smtpOk, setSmtpOk] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/admin/marketing/review-requests/preview`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
      fetch(`${BASE}/settings`).then(r => r.json()),
    ]).then(([prev, settings]) => {
      if (prev) setPreview(prev);
      setSmtpOk(Boolean(settings?.smtpHost && settings?.smtpUser && settings?.smtpPass));
    }).finally(() => setLoading(false));
  }, [token]);

  const send = async () => {
    if (!confirm(`سيتم إرسال طلب مراجعة لـ ${preview?.count} عميل. متابعة؟`)) return;
    setSending(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/review-requests/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (r.ok) toast.success(`✅ تم الإرسال لـ ${d.sent} عميل${d.failed > 0 ? ` (فشل ${d.failed})` : ''}`);
      else toast.error(d.error ?? 'فشل الإرسال');
    } finally { setSending(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      {/* Info card */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h2 className="font-bold text-lg">طلب المراجعات التلقائي</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          أرسل رسائل بريد إلكتروني لعملائك الذين استلموا طلباتهم يطلب منهم تقييم المنتجات التي اشتروها. المراجعات تعزز الثقة وتزيد المبيعات.
        </p>

        {/* SMTP warning */}
        {!smtpOk && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            ⚠️ يجب أولاً إعداد SMTP في تبويب <strong>البريد → إعدادات SMTP</strong> حتى يعمل الإرسال.
          </div>
        )}

        {/* Count */}
        <div className="bg-muted/50 rounded-xl p-5 text-center">
          <p className="text-4xl font-black text-primary">{preview?.count ?? 0}</p>
          <p className="text-sm font-medium mt-1">عميل سيستقبل الرسالة</p>
          <p className="text-xs text-muted-foreground mt-0.5">عملاء لديهم طلبات مكتملة ومسلّمة</p>
        </div>

        {/* Preview email */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">معاينة الرسالة:</p>
          <p className="text-sm font-bold">الموضوع: رأيك يهمنا – كيف كانت تجربتك؟</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>مرحباً [اسم العميل]،</p>
            <p>شكراً لتسوقك! هل يمكنك مشاركتنا رأيك في المنتجات التي اشتريتها؟</p>
            <p className="text-primary font-medium">[روابط المنتجات التي اشتراها]</p>
            <p>رأيك يساعد المتسوقين الآخرين.</p>
          </div>
        </div>

        <Button
          onClick={send}
          disabled={sending || !smtpOk || (preview?.count ?? 0) === 0}
          className="w-full font-bold gap-2 h-12"
        >
          {sending
            ? <><Loader2 className="h-5 w-5 animate-spin" />جاري الإرسال...</>
            : <><Send className="h-5 w-5" />إرسال طلبات المراجعة</>
          }
        </Button>

        {(preview?.count ?? 0) === 0 && (
          <p className="text-center text-sm text-muted-foreground">لا يوجد عملاء لديهم طلبات مكتملة حتى الآن.</p>
        )}
      </div>

      {/* Tips */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />نصائح للحصول على مراجعات أكثر</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>أرسل الطلب بعد 3-5 أيام من التسليم</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>كن موجزاً ومهذباً — لا تطلب مراجعة إيجابية تحديداً</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>اجعل رابط المراجعة واضحاً وسهل الوصول</li>
          <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>لا ترسل أكثر من مرة واحدة لنفس العميل</li>
        </ul>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 6 — Customer Segments
// ══════════════════════════════════════════════════════════════════════════════
function SegmentsTab({ token }: { token: string }) {
  const [data, setData] = useState<SegmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/segments`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!data) return <Empty icon={Users} text="تعذر تحميل البيانات" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">إجمالي العملاء: <strong>{data.total}</strong></p>
        <Button variant="ghost" size="sm" onClick={load} className="gap-1">
          <RefreshCw className="h-4 w-4" />تحديث
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(SEGMENT_META).map(([key, meta]) => {
          const seg = data.segments[key];
          const Icon = meta.icon;
          const isOpen = expanded === key;
          return (
            <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden">
              <button className="w-full p-4 text-right flex items-center gap-3 hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : key)}>
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-lg">{seg?.count ?? 0}</p>
                  <p className="text-sm font-medium">{meta.label}</p>
                  <p className="text-xs text-muted-foreground">{meta.desc}</p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
              </button>
              {isOpen && seg && seg.customers.length > 0 && (
                <div className="border-t border-border divide-y divide-border">
                  {seg.customers.map(c => (
                    <div key={c.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-bold text-primary text-xs">{formatPrice(c.totalSpend)}</p>
                        <p className="text-xs text-muted-foreground">{c.orderCount} طلب</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 7 — Stats
// ══════════════════════════════════════════════════════════════════════════════
function StatsTab({ token }: { token: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/stats`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!data) return <Empty icon={BarChart2} text="تعذر تحميل الإحصائيات" />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{data.repeatPurchaseRate}%</p>
          <p className="text-sm font-medium mt-1">معدل الشراء المتكرر</p>
          <p className="text-xs text-muted-foreground">% العملاء بأكثر من طلب</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{formatPrice(data.averageOrderValue)}</p>
          <p className="text-sm font-medium mt-1">متوسط قيمة الطلب</p>
          <p className="text-xs text-muted-foreground">Average Order Value</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><TrendingUp className="h-5 w-5 text-primary" /><h3 className="font-bold">أكثر المنتجات مبيعاً</h3></div>
        {data.topProducts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p> : (
          <div className="space-y-2">
            {data.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-lg font-black text-muted-foreground w-6 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-sm font-bold text-primary shrink-0 mr-2">{formatPrice(p.revenue)}</p>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (p.revenue / (data.topProducts[0]?.revenue || 1)) * 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.unitsSold} وحدة</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data.revenueByCategory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4"><ShoppingBag className="h-5 w-5 text-primary" /><h3 className="font-bold">الإيرادات حسب التصنيف</h3></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueByCategory} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip formatter={(v: number) => [formatPrice(v), 'الإيرادات']} contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: 'hsl(var(--muted))' }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {data.revenueByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4"><Crown className="h-5 w-5 text-yellow-500" /><h3 className="font-bold">أفضل العملاء</h3></div>
        {data.topCustomers.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p> : (
          <div className="space-y-2">
            {data.topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 py-2">
                <span className={`text-sm font-black w-6 shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'}`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.email}</p>
                </div>
                <div className="text-left shrink-0">
                  <p className="font-bold text-primary text-sm">{formatPrice(c.totalSpend)}</p>
                  <p className="text-xs text-muted-foreground">{c.orderCount} طلب</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function Spinner() {
  return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
}

function Empty({ icon: Icon, text }: { icon: typeof Megaphone; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Icon className="h-12 w-12 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function Toggle({ value, onChange, small }: { value: boolean; onChange: (v: boolean) => void; small?: boolean }) {
  const h = small ? 'h-5' : 'h-6';
  const w = small ? 'w-9' : 'w-11';
  const th = small ? 'h-3.5' : 'h-5';
  const tw = small ? 'w-3.5' : 'w-5';
  const tx = small ? (value ? 'translate-x-4' : 'translate-x-0.5') : (value ? 'translate-x-5' : 'translate-x-0.5');
  return (
    <button onClick={() => onChange(!value)} className={`relative inline-flex ${h} ${w} rounded-full transition-colors ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
      <span className={`inline-block ${th} ${tw} mt-0.5 rounded-full bg-white shadow transition-transform ${tx}`} />
    </button>
  );
}
