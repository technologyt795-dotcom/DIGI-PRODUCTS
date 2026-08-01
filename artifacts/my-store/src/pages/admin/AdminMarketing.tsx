import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, Mail, Users, BarChart2, Send, Trash2, Plus,
  CheckCircle, AlertCircle, Loader2, RefreshCw, ChevronDown,
  ChevronUp, Crown, Repeat2, UserPlus, Clock, TrendingUp,
  ShoppingBag, Settings, Eye, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'banner' | 'campaigns' | 'segments' | 'stats';

type Campaign = {
  id: number; title: string; subject: string; body: string;
  segment: string; status: string; recipientCount: number;
  sentAt: string | null; createdAt: string;
};

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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function authHeader(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminMarketing() {
  const { token } = useAdminAuth();
  const [tab, setTab] = useState<Tab>('banner');

  const tabs: { id: Tab; label: string; icon: typeof Megaphone }[] = [
    { id: 'banner',    label: 'البانر الترويجي', icon: Megaphone },
    { id: 'campaigns', label: 'حملات البريد',    icon: Mail },
    { id: 'segments',  label: 'شرائح العملاء',   icon: Users },
    { id: 'stats',     label: 'الإحصائيات',      icon: BarChart2 },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-black flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          التسويق
        </h1>
        <p className="text-muted-foreground text-sm mt-1">إدارة حملات التسويق وتحليل العملاء</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all flex-1 justify-center
                ${tab === t.id ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Icon className="h-4 w-4" />{t.label}
            </button>
          );
        })}
      </div>

      {tab === 'banner'    && <BannerTab token={token!} />}
      {tab === 'campaigns' && <CampaignsTab token={token!} />}
      {tab === 'segments'  && <SegmentsTab token={token!} />}
      {tab === 'stats'     && <StatsTab token={token!} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Announcement Banner
// ══════════════════════════════════════════════════════════════════════════════
function BannerTab({ token }: { token: string }) {
  const [enabled, setEnabled] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState('primary');
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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
        setEnabled(Boolean(s.announcementBarEnabled));
        setText(String(s.announcementBarText ?? ''));
        setColor(String(s.announcementBarColor ?? 'primary'));
        setLink(String(s.announcementBarLink ?? ''));
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/admin/settings`, {
        method: 'PUT',
        headers: authHeader(token),
        body: JSON.stringify({
          announcementBarEnabled: enabled,
          announcementBarText: text,
          announcementBarColor: color,
          announcementBarLink: link || null,
        }),
      });
      toast.success('تم حفظ البانر');
    } catch {
      toast.error('فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner />;

  const colorCls = colors.find(c => c.id === color)?.cls ?? 'bg-primary';

  return (
    <div className="space-y-6">
      {/* Preview */}
      {text && (
        <div className={`${colorCls} text-white rounded-xl p-3 text-center text-sm font-medium flex items-center justify-center gap-2`}>
          <Megaphone className="h-4 w-4 shrink-0" />
          <span>{text}</span>
          {link && <span className="opacity-70 text-xs">← رابط</span>}
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">البانر الترويجي</p>
            <p className="text-sm text-muted-foreground">شريط إعلانات يظهر أعلى المتجر</p>
          </div>
          <button
            onClick={() => setEnabled(v => !v)}
            className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">نص الإعلان</label>
          <Input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="مثال: 🎉 شحن مجاني على الطلبات فوق 100 ريال!"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground text-left">{text.length}/120</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">اللون</label>
          <div className="flex gap-2 flex-wrap">
            {colors.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                className={`flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all ${color === c.id ? 'border-primary' : 'border-transparent'}`}
              >
                <span className={`w-7 h-7 rounded-md ${c.cls}`} />
                <span className="text-xs">{c.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold">الرابط (اختياري)</label>
          <Input
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="https://..."
            type="url"
          />
        </div>

        <Button onClick={save} disabled={saving} className="w-full font-bold">
          {saving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
          حفظ البانر
        </Button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Email Campaigns
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
      const r = await fetch(`${BASE}/admin/marketing/campaigns`, { headers: authHeader(token) });
      if (r.ok) setCampaigns(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const sendCampaign = async (id: number) => {
    if (!confirm('سيتم إرسال هذه الحملة فوراً. هل أنت متأكد؟')) return;
    setSending(id);
    try {
      const r = await fetch(`${BASE}/admin/marketing/campaigns/${id}/send`, {
        method: 'POST', headers: authHeader(token),
      });
      const d = await r.json();
      if (r.ok) {
        toast.success(`تم الإرسال لـ ${d.sent} عميل${d.failed > 0 ? ` (فشل ${d.failed})` : ''}`);
        load();
      } else {
        toast.error(d.error ?? 'فشل الإرسال');
      }
    } finally { setSending(null); }
  };

  const deleteCampaign = async (id: number) => {
    if (!confirm('هل تريد حذف هذه الحملة؟')) return;
    setDeleting(id);
    await fetch(`${BASE}/admin/marketing/campaigns/${id}`, {
      method: 'DELETE', headers: authHeader(token),
    });
    setCampaigns(c => c.filter(x => x.id !== id));
    setDeleting(null);
  };

  return (
    <div className="space-y-4">
      {/* Sub-nav */}
      <div className="flex gap-2">
        {([['list', 'الحملات'], ['new', 'حملة جديدة'], ['smtp', 'إعدادات SMTP']] as const).map(([id, lbl]) => (
          <button
            key={id}
            onClick={() => setSubTab(id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-colors
              ${subTab === id ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {subTab === 'list' && (
        <div className="space-y-3">
          {loading ? <Spinner /> : campaigns.length === 0 ? (
            <Empty icon={Mail} text="لا توجد حملات بعد. أنشئ حملتك الأولى!" />
          ) : campaigns.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold truncate">{c.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {c.status === 'sent' ? 'تم الإرسال' : 'مسودة'}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                      {SEGMENT_LABELS[c.segment] ?? c.segment}
                    </span>
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
                    <Button
                      size="sm"
                      onClick={() => sendCampaign(c.id)}
                      disabled={sending === c.id}
                      className="gap-1 font-bold"
                    >
                      {sending === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                      إرسال
                    </Button>
                  )}
                  <Button
                    size="sm" variant="ghost"
                    onClick={() => deleteCampaign(c.id)}
                    disabled={deleting === c.id}
                    className="text-destructive hover:text-destructive"
                  >
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
    if (!form.title || !form.subject || !form.body) {
      toast.error('يرجى تعبئة جميع الحقول');
      return;
    }
    setSaving(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/campaigns`, {
        method: 'POST',
        headers: authHeader(token),
        body: JSON.stringify(form),
      });
      if (!r.ok) { toast.error('فشل الحفظ'); return; }
      const c = await r.json() as Campaign;

      if (sendNow) {
        const sr = await fetch(`${BASE}/admin/marketing/campaigns/${c.id}/send`, {
          method: 'POST', headers: authHeader(token),
        });
        const sd = await sr.json();
        if (sr.ok) toast.success(`تم الإرسال لـ ${sd.sent} عميل`);
        else toast.error(sd.error ?? 'فشل الإرسال');
      } else {
        toast.success('تم حفظ الحملة كمسودة');
      }
      onCreated();
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <h3 className="font-bold text-lg">حملة بريدية جديدة</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">اسم الحملة (داخلي)</label>
          <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="مثال: عرض رمضان 2026" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">موضوع البريد</label>
          <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="مثال: 🎉 عرض حصري لك!" />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-semibold">الشريحة المستهدفة</label>
        <select
          value={form.segment}
          onChange={e => set('segment', e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          {Object.entries(SEGMENT_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold">محتوى البريد (HTML)</label>
          <div className="flex gap-2">
            <button
              onClick={() => { if (!form.body) set('body', TEMPLATE); }}
              className="text-xs text-primary hover:underline"
            >
              استخدم القالب
            </button>
            <button onClick={() => setPreview(v => !v)} className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground">
              <Eye className="h-3 w-3" />{preview ? 'تعديل' : 'معاينة'}
            </button>
          </div>
        </div>
        {preview ? (
          <div
            className="border border-border rounded-xl p-4 bg-white min-h-[200px] max-h-[400px] overflow-y-auto"
            dangerouslySetInnerHTML={{ __html: form.body.replace(/\{\{customerName\}\}/g, 'أحمد').replace(/\{\{storeName\}\}/g, 'المتجر') }}
          />
        ) : (
          <textarea
            value={form.body}
            onChange={e => set('body', e.target.value)}
            rows={12}
            placeholder="اكتب HTML هنا... يمكنك استخدام {{customerName}} و {{storeName}}"
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono resize-y"
          />
        )}
        <p className="text-xs text-muted-foreground">المتغيرات المتاحة: <code className="bg-muted px-1 rounded">{'{{customerName}}'}</code> · <code className="bg-muted px-1 rounded">{'{{storeName}}'}</code></p>
      </div>

      <div className="flex gap-3">
        <Button onClick={() => save(false)} disabled={saving} variant="outline" className="flex-1 font-bold">
          حفظ كمسودة
        </Button>
        <Button onClick={() => save(true)} disabled={saving} className="flex-1 font-bold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          إرسال الآن
        </Button>
      </div>
    </div>
  );
}

function SmtpForm({ token }: { token: string }) {
  const [form, setForm] = useState({
    smtpHost: '', smtpPort: 587, smtpSecure: false,
    smtpUser: '', smtpPass: '', smtpFrom: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loading, setLoading] = useState(true);

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    fetch(`${BASE}/settings`)
      .then(r => r.json())
      .then((s: Settings) => {
        if (s.smtpHost) set('smtpHost', s.smtpHost as string);
        if (s.smtpPort) set('smtpPort', s.smtpPort as number);
        if (s.smtpSecure !== undefined) set('smtpSecure', s.smtpSecure as boolean);
        if (s.smtpUser) set('smtpUser', s.smtpUser as string);
        if (s.smtpPass) set('smtpPass', s.smtpPass as string);
        if (s.smtpFrom) set('smtpFrom', s.smtpFrom as string);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}/admin/settings`, {
        method: 'PUT', headers: authHeader(token),
        body: JSON.stringify(form),
      });
      toast.success('تم حفظ إعدادات SMTP');
    } catch { toast.error('فشل الحفظ'); }
    finally { setSaving(false); }
  };

  const testSmtp = async () => {
    if (!testEmail) { toast.error('أدخل بريد الاختبار'); return; }
    setTesting(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/smtp/test`, {
        method: 'POST', headers: authHeader(token),
        body: JSON.stringify({ ...form, testEmail }),
      });
      const d = await r.json();
      if (r.ok) toast.success('✅ تم الاختبار بنجاح! تحقق من بريدك');
      else toast.error(d.error ?? 'فشل الاتصال');
    } finally { setTesting(false); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Settings className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-lg">إعدادات خادم البريد (SMTP)</h3>
      </div>
      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
        💡 يمكنك استخدام Gmail (smtp.gmail.com · منفذ 587) أو أي خدمة بريد أخرى. لـ Gmail تحتاج <a href="https://myaccount.google.com/apppasswords" target="_blank" className="text-primary hover:underline">كلمة مرور التطبيق</a>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold">خادم SMTP</label>
          <Input value={form.smtpHost} onChange={e => set('smtpHost', e.target.value)} placeholder="smtp.gmail.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">المنفذ</label>
          <Input type="number" value={form.smtpPort} onChange={e => set('smtpPort', Number(e.target.value))} placeholder="587" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">اسم المستخدم / البريد</label>
          <Input value={form.smtpUser} onChange={e => set('smtpUser', e.target.value)} placeholder="your@email.com" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">كلمة المرور / App Password</label>
          <Input type="password" value={form.smtpPass} onChange={e => set('smtpPass', e.target.value)} placeholder="••••••••••••" />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">اسم المرسل (From)</label>
          <Input value={form.smtpFrom} onChange={e => set('smtpFrom', e.target.value)} placeholder="متجرك <store@email.com>" />
        </div>
        <div className="flex items-center gap-3 pt-5">
          <input
            id="smtpSecure"
            type="checkbox"
            checked={form.smtpSecure}
            onChange={e => set('smtpSecure', e.target.checked)}
            className="h-4 w-4 rounded"
          />
          <label htmlFor="smtpSecure" className="text-sm font-medium cursor-pointer">TLS/SSL (منفذ 465)</label>
        </div>
      </div>

      <div className="flex gap-3 pt-2 flex-wrap">
        <Button onClick={save} disabled={saving} className="font-bold gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          حفظ الإعدادات
        </Button>
        <div className="flex gap-2 flex-1">
          <Input
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="بريد الاختبار"
            type="email"
            className="flex-1"
          />
          <Button variant="outline" onClick={testSmtp} disabled={testing} className="font-bold gap-2 shrink-0">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            اختبر
          </Button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — Customer Segments
// ══════════════════════════════════════════════════════════════════════════════
function SegmentsTab({ token }: { token: string }) {
  const [data, setData] = useState<SegmentsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/segments`, { headers: authHeader(token) });
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
              <button
                className="w-full p-4 text-right flex items-center gap-3 hover:bg-muted/50 transition-colors"
                onClick={() => setExpanded(isOpen ? null : key)}
              >
                <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
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
// TAB 4 — Marketing Stats
// ══════════════════════════════════════════════════════════════════════════════
function StatsTab({ token }: { token: string }) {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/admin/marketing/stats`, { headers: authHeader(token) });
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Spinner />;
  if (!data) return <Empty icon={BarChart2} text="تعذر تحميل الإحصائيات" />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
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

      {/* Top Products */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-bold">أكثر المنتجات مبيعاً</h3>
        </div>
        {data.topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>
        ) : (
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
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(100, (p.revenue / (data.topProducts[0]?.revenue || 1)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.unitsSold} وحدة</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue by Category */}
      {data.revenueByCategory.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h3 className="font-bold">الإيرادات حسب التصنيف</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueByCategory} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                formatter={(v: number) => [formatPrice(v), 'الإيرادات']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {data.revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Customers */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Crown className="h-5 w-5 text-yellow-500" />
          <h3 className="font-bold">أفضل العملاء</h3>
        </div>
        {data.topCustomers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">لا توجد بيانات بعد</p>
        ) : (
          <div className="space-y-2">
            {data.topCustomers.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3 py-2">
                <span className={`text-sm font-black w-6 shrink-0 ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-orange-400' : 'text-muted-foreground'}`}>
                  {i + 1}
                </span>
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
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function Empty({ icon: Icon, text }: { icon: typeof Megaphone; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
      <Icon className="h-12 w-12 opacity-30" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
