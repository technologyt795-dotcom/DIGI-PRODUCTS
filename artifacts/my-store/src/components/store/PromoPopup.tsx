import { useEffect, useState } from 'react';
import { X, Copy, Check, Sparkles, Tag } from 'lucide-react';

type PopupSettings = {
  popupEnabled: boolean;
  popupTitle: string | null;
  popupMessage: string | null;
  popupDiscountCode: string | null;
  popupDelay: number | null;
  storeName: string;
  logoUrl: string | null;
};

const DISMISSED_KEY = 'promo-popup-dismissed';

export function PromoPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    fetch(`${base}/api/settings`)
      .then(r => r.json())
      .then((s: PopupSettings) => {
        if (s.popupEnabled && (s.popupTitle || s.popupMessage)) {
          setSettings(s);
          const delay = Math.max(0, (s.popupDelay ?? 3)) * 1000;
          setTimeout(() => setVisible(true), delay);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
  };

  const copyCode = () => {
    if (!settings?.popupDiscountCode) return;
    navigator.clipboard.writeText(settings.popupDiscountCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  if (!visible || !settings) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={dismiss}
    >
      <div
        className="relative max-w-sm w-full overflow-hidden rounded-3xl shadow-2xl"
        style={{ animation: 'popup-in 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* ── Gradient header ── */}
        <div
          className="relative px-6 pt-8 pb-10 text-white text-center overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)' }}
        >
          {/* Decorative circles */}
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full opacity-15" style={{ background: 'rgba(255,255,255,0.4)' }} />
          <div className="absolute top-4 left-8 w-3 h-3 rounded-full opacity-40 bg-white" />
          <div className="absolute bottom-8 right-10 w-2 h-2 rounded-full opacity-30 bg-white" />

          {/* Close button */}
          <button
            onClick={dismiss}
            className="absolute top-3 left-3 text-white/70 hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/20"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Logo or icon */}
          {settings.logoUrl ? (
            <div className="flex justify-center mb-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 p-1.5 flex items-center justify-center backdrop-blur-sm">
                <img src={settings.logoUrl} alt={settings.storeName} className="h-full object-contain" />
              </div>
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-2xl bg-white/25 flex items-center justify-center backdrop-blur-sm">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
            </div>
          )}

          {settings.popupTitle && (
            <h2 className="text-xl font-black leading-snug drop-shadow-sm">
              {settings.popupTitle}
            </h2>
          )}
          {settings.popupMessage && (
            <p className="text-sm text-white/85 mt-2 leading-relaxed font-medium">
              {settings.popupMessage}
            </p>
          )}
        </div>

        {/* ── White body ── */}
        <div className="bg-card px-6 pb-6 -mt-1">
          {/* Discount code */}
          {settings.popupDiscountCode && (
            <div className="relative -mt-5 mb-5">
              <button
                onClick={copyCode}
                className="w-full group relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary transition-all duration-200 p-4 text-center"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)/0.06) 0%, hsl(var(--primary)/0.12) 100%)' }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Tag className="h-4 w-4 text-primary opacity-70" />
                  <span className="text-xs text-muted-foreground font-semibold tracking-wide uppercase">كود الخصم</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono font-black text-2xl text-primary tracking-[0.2em]">
                    {settings.popupDiscountCode}
                  </span>
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    {copied
                      ? <Check className="h-4 w-4 text-green-600" />
                      : <Copy className="h-4 w-4 text-primary" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {copied ? '✅ تم نسخ الكود بنجاح!' : 'اضغط لنسخ الكود'}
                </p>
              </button>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={dismiss}
            className="w-full rounded-2xl py-3.5 text-sm font-black text-white tracking-wide hover:opacity-90 active:scale-95 transition-all duration-150 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            تسوق الآن ←
          </button>

          <p className="text-xs text-muted-foreground/60 text-center mt-3 font-medium">
            {settings.storeName}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes popup-in {
          from { opacity: 0; transform: scale(0.88) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
