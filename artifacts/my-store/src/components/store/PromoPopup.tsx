import { useEffect, useState, useCallback } from "react";
import { X, Copy, Check, Sparkles, Tag } from "lucide-react";

type PopupSettings = {
  popupEnabled: boolean;
  popupTitle: string | null;
  popupMessage: string | null;
  popupDiscountCode: string | null;
  popupDelay: number | null;
  storeName: string;
  logoUrl: string | null;
};

const DISMISSED_KEY = "promo-popup-dismissed";

export function PromoPopup() {
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  }, []);

  useEffect(() => {
    // 1. التحقق مما إذا كانت النافذة قد أُغلقت بالفعل في هذه الجلسة
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");

    // 2. جلب الإعدادات من الخادم
    fetch(`${base}/api/settings`)
      .then((r) => r.json())
      .then((s: PopupSettings) => {
        if (s.popupEnabled && (s.popupTitle || s.popupMessage)) {
          setSettings(s);

          // 3. إضافة مستشعر "نية الخروج" (Exit-Intent)
          const handleMouseLeave = (e: MouseEvent) => {
            // يظهر فقط إذا تحرك الماوس خارج الجزء العلوي من المتصفح (نية إغلاق التبويب أو كتابة URL جديد)
            if (e.clientY <= 0) {
              setVisible(true);
              // إزالة المستشعر بعد الظهور لأول مرة لضمان عدم تكرار الإزعاج
              document.removeEventListener("mouseleave", handleMouseLeave);
            }
          };

          document.addEventListener("mouseleave", handleMouseLeave);

          // تنظيف المستشعر عند مسح المكون
          return () =>
            document.removeEventListener("mouseleave", handleMouseLeave);
        }
      })
      .catch(() => {});
  }, []);

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
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
      onClick={dismiss}
    >
      <div
        className="relative max-w-sm w-full overflow-hidden rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] bg-white"
        style={{
          animation: "popup-in 0.5s cubic-bezier(0.34,1.56,0.64,1)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* ── زر الإغلاق الاحترافي "X" ── */}
        <button
          onClick={dismiss}
          className="absolute top-4 left-4 z-[60] bg-white/20 hover:bg-white/40 text-white backdrop-blur-md p-2 rounded-full transition-all duration-300 hover:rotate-90 active:scale-90 shadow-lg border border-white/30"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ── Header Gradient ── */}
        <div
          className="relative px-6 pt-12 pb-10 text-white text-center overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
          }}
        >
          {/* Decorative Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-20 blur-2xl bg-white" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 blur-xl bg-white" />

          {/* Logo/Icon Container */}
          <div className="flex justify-center mb-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-md group-hover:blur-lg transition-all" />
              <div className="relative h-16 w-16 rounded-3xl bg-white/25 flex items-center justify-center backdrop-blur-md border border-white/30 shadow-xl overflow-hidden">
                {settings.logoUrl ? (
                  <img
                    src={settings.logoUrl}
                    alt={settings.storeName}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                )}
              </div>
            </div>
          </div>

          {settings.popupTitle && (
            <h2 className="text-2xl font-black leading-tight drop-shadow-md mb-2">
              {settings.popupTitle}
            </h2>
          )}
          {settings.popupMessage && (
            <p className="text-base text-white/90 leading-relaxed font-medium px-2">
              {settings.popupMessage}
            </p>
          )}
        </div>

        {/* ── Body Content ── */}
        <div className="bg-white px-8 pb-8 pt-4">
          {/* Discount Code Section */}
          {settings.popupDiscountCode && (
            <div className="relative -mt-10 mb-6">
              <button
                onClick={copyCode}
                className="w-full group relative overflow-hidden rounded-[1.5rem] border-2 border-dashed border-indigo-200 hover:border-indigo-400 transition-all duration-300 p-5 text-center bg-indigo-50/50"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs text-indigo-600 font-bold tracking-widest uppercase">
                    كود الخصم الحصري
                  </span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <span className="font-mono font-black text-3xl text-indigo-600 tracking-[0.15em]">
                    {settings.popupDiscountCode}
                  </span>
                  <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    {copied ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </div>
                </div>
                <div className="mt-3 overflow-hidden h-5">
                  <p
                    className={`text-sm font-bold transition-all duration-300 ${copied ? "text-green-600 -translate-y-0" : "text-indigo-400"}`}
                  >
                    {copied
                      ? "✅ تم النسخ! استخدمه عند الدفع"
                      : "انقر للنسخ والحصول على الخصم"}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Call to Action Button */}
          <button
            onClick={dismiss}
            className="w-full rounded-[1.25rem] py-4 text-base font-black text-white tracking-wide hover:brightness-110 active:scale-[0.98] transition-all duration-200 shadow-[0_10px_20px_-5px_rgba(99,102,241,0.5)]"
            style={{
              background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            }}
          >
            استخدم الخصم الآن
          </button>

          <div className="mt-5 flex items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-opacity">
            <div className="h-px w-8 bg-gray-300" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">
              {settings.storeName}
            </span>
            <div className="h-px w-8 bg-gray-300" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes popup-in {
          0% { opacity: 0; transform: scale(0.9) translateY(30px); }
          70% { transform: scale(1.02) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
