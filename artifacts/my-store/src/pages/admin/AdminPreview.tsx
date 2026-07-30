import { useState, useRef } from 'react';
import {
  Smartphone, RefreshCw, Home, ShoppingBag, ShoppingCart,
  Package, ChevronLeft, ChevronRight, Monitor, Tablet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

const PAGES = [
  { label: 'الرئيسية',    path: '/',          icon: Home },
  { label: 'المنتجات',   path: '/products',   icon: Package },
  { label: 'السلة',      path: '/cart',        icon: ShoppingCart },
  { label: 'طلباتي',    path: '/my-orders',   icon: ShoppingBag },
];

type DeviceSize = 'sm' | 'md' | 'lg' | 'tablet';

const DEVICES: { id: DeviceSize; label: string; icon: typeof Smartphone; w: number; h: number }[] = [
  { id: 'sm',     label: 'صغير',   icon: Smartphone, w: 320,  h: 568 },
  { id: 'md',     label: 'عادي',   icon: Smartphone, w: 390,  h: 844 },
  { id: 'lg',     label: 'كبير',   icon: Smartphone, w: 430,  h: 932 },
  { id: 'tablet', label: 'تابلت',  icon: Tablet,     w: 768,  h: 1024 },
];

export default function AdminPreview() {
  const [activePage, setActivePage] = useState('/');
  const [device, setDevice] = useState<DeviceSize>('md');
  const [key, setKey] = useState(0); // force iframe reload
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dev = DEVICES.find((d) => d.id === device)!;
  const src = `${BASE}${activePage}`;
  const isTablet = device === 'tablet';

  const refresh = () => setKey((k) => k + 1);

  /* Scale the phone so it always fits inside the panel */
  const SCALE_BASE_W = isTablet ? 820 : 460;
  const SCALE_BASE_H = isTablet ? 1080 : 960;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">معاينة المتجر</h1>
        <p className="text-muted-foreground text-sm mt-1">شاهد كيف يبدو متجرك على الأجهزة المختلفة</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Page picker */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {PAGES.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.path}
                onClick={() => setActivePage(p.path)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  activePage === p.path
                    ? 'bg-background shadow text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Device picker */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  device === d.id
                    ? 'bg-background shadow text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Refresh */}
        <Button variant="outline" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </Button>
      </div>

      {/* Preview area */}
      <div
        className="relative flex items-start justify-center overflow-auto rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-border min-h-[640px]"
        style={{ padding: '2.5rem 1rem 3rem' }}
      >
        {/* Dimensions badge */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/20 text-white text-xs px-3 py-1 rounded-full font-mono backdrop-blur-sm select-none">
          {dev.w} × {dev.h}
        </div>

        {/* Phone / Tablet shell */}
        <div
          className="relative flex-shrink-0"
          style={{
            width: dev.w + (isTablet ? 30 : 24),
            maxWidth: '100%',
          }}
        >
          {/* Outer frame */}
          <div
            className={cn(
              'relative bg-slate-900 shadow-2xl overflow-hidden',
              isTablet ? 'rounded-[24px]' : 'rounded-[44px]',
            )}
            style={{
              padding: isTablet ? '12px' : '10px',
            }}
          >
            {/* Top notch / status bar */}
            {!isTablet && (
              <div className="relative bg-slate-900 h-7 flex items-center justify-center mb-0.5">
                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-900 rounded-b-2xl z-10" />
                {/* Status bar icons */}
                <div className="absolute top-1 right-4 flex items-center gap-1">
                  <div className="flex gap-0.5">
                    {[3, 4, 5].map((h) => (
                      <div key={h} className="w-0.5 rounded-sm bg-white/70" style={{ height: h }} />
                    ))}
                  </div>
                  <span className="text-white/70 text-[8px] font-mono">WiFi</span>
                  <div className="w-5 h-2.5 rounded-sm border border-white/50 relative">
                    <div className="absolute inset-0.5 right-auto w-3 bg-white/70 rounded-sm" />
                    <div className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-white/50 rounded-r-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* Screen */}
            <div
              className={cn('overflow-hidden bg-white', isTablet ? 'rounded-[14px]' : 'rounded-[34px]')}
              style={{ width: dev.w, height: dev.h }}
            >
              <iframe
                key={key}
                ref={iframeRef}
                src={src}
                width={dev.w}
                height={dev.h}
                className="block border-0"
                title="معاينة المتجر"
                style={{ pointerEvents: 'auto' }}
              />
            </div>

            {/* Home indicator bar (iPhone style) */}
            {!isTablet && (
              <div className="flex justify-center pt-2 pb-0.5">
                <div className="w-28 h-1 bg-white/30 rounded-full" />
              </div>
            )}
          </div>

          {/* Side buttons (phone only) */}
          {!isTablet && (
            <>
              {/* Volume up */}
              <div className="absolute -right-1.5 top-24 w-1.5 h-8 bg-slate-700 rounded-r-md" />
              {/* Volume down */}
              <div className="absolute -right-1.5 top-36 w-1.5 h-10 bg-slate-700 rounded-r-md" />
              {/* Power */}
              <div className="absolute -left-1.5 top-28 w-1.5 h-14 bg-slate-700 rounded-l-md" />
            </>
          )}
        </div>
      </div>

      {/* Quick tip */}
      <p className="text-xs text-muted-foreground text-center">
        💡 يمكنك التنقل داخل الإطار والتفاعل مع المتجر مباشرةً — أي تغيير في الإعدادات يظهر فور الحفظ وتحديث الصفحة
      </p>
    </div>
  );
}
