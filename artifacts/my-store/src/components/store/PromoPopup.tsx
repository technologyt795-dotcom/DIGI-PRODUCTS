import { useEffect, useState } from 'react';
import { X, Tag, Copy, Check } from 'lucide-react';

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
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!visible || !settings) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="bg-card border border-border rounded-2xl shadow-2xl max-w-sm w-full p-6 relative"
        style={{ animation: 'popup-in 0.25s ease-out' }}
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        {settings.logoUrl && (
          <div className="flex justify-center mb-4">
            <img src={settings.logoUrl} alt={settings.storeName} className="h-10 object-contain" />
          </div>
        )}

        {/* Title */}
        {settings.popupTitle && (
          <h2 className="text-xl font-black text-center mb-2 leading-snug">
            {settings.popupTitle}
          </h2>
        )}

        {/* Message */}
        {settings.popupMessage && (
          <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
            {settings.popupMessage}
          </p>
        )}

        {/* Discount code */}
        {settings.popupDiscountCode && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center mb-4">
            <p className="text-xs text-muted-foreground mb-1 font-medium">كود الخصم</p>
            <button
              onClick={copyCode}
              className="flex items-center gap-2 mx-auto font-mono font-black text-2xl text-primary tracking-widest hover:opacity-70 transition-opacity"
            >
              {copied ? <Check className="h-5 w-5 text-green-500" /> : <Tag className="h-5 w-5" />}
              {settings.popupDiscountCode}
              {copied ? null : <Copy className="h-4 w-4 opacity-50" />}
            </button>
            <p className="text-xs text-muted-foreground mt-1.5">
              {copied ? '✅ تم نسخ الكود!' : 'اضغط لنسخ الكود'}
            </p>
          </div>
        )}

        {/* CTA button */}
        <button
          onClick={dismiss}
          className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          تسوق الآن ←
        </button>

        <p className="text-xs text-muted-foreground text-center mt-3 opacity-60">
          {settings.storeName}
        </p>
      </div>

      <style>{`
        @keyframes popup-in {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
