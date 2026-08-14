import { X, Sparkles, Zap, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

/* ─── colour themes ──────────────────────────────────────────────────── */
const THEMES: Record<string, {
  bg: string;
  shimmer: string;
  glow: string;
  dot: string;
  Icon: typeof Sparkles;
}> = {
  primary: {
    bg:      'linear-gradient(90deg,#4f46e5 0%,#7c3aed 40%,#a855f7 70%,#4f46e5 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(124,58,237,0.45)',
    dot:     'rgba(255,255,255,0.25)',
    Icon:    Sparkles,
  },
  green: {
    bg:      'linear-gradient(90deg,#059669 0%,#10b981 40%,#34d399 70%,#059669 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(16,185,129,0.45)',
    dot:     'rgba(255,255,255,0.25)',
    Icon:    Zap,
  },
  orange: {
    bg:      'linear-gradient(90deg,#ea580c 0%,#f97316 40%,#fbbf24 70%,#ea580c 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.4) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(249,115,22,0.5)',
    dot:     'rgba(255,255,255,0.25)',
    Icon:    Zap,
  },
  red: {
    bg:      'linear-gradient(90deg,#dc2626 0%,#e11d48 40%,#f43f5e 70%,#dc2626 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(225,29,72,0.45)',
    dot:     'rgba(255,255,255,0.25)',
    Icon:    Star,
  },
  purple: {
    bg:      'linear-gradient(90deg,#7c3aed 0%,#c026d3 40%,#db2777 70%,#7c3aed 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.35) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(192,38,211,0.45)',
    dot:     'rgba(255,255,255,0.25)',
    Icon:    Sparkles,
  },
  dark: {
    bg:      'linear-gradient(90deg,#0f172a 0%,#1e293b 40%,#334155 70%,#0f172a 100%)',
    shimmer: 'linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.12) 50%,transparent 60%)',
    glow:    '0 4px 24px 0 rgba(15,23,42,0.8)',
    dot:     'rgba(255,255,255,0.15)',
    Icon:    Star,
  },
};

/* ─── component ──────────────────────────────────────────────────────── */
export function AnnouncementBar() {
  const { settings } = useStoreSettings();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (settings?.announcementBarEnabled && settings?.announcementBarText && !dismissed) {
      const t = requestAnimationFrame(() => setMounted(true));
      return () => cancelAnimationFrame(t);
    }

    return undefined;
  }, [settings?.announcementBarEnabled, settings?.announcementBarText, dismissed]);

  if (!settings?.announcementBarEnabled || !settings?.announcementBarText || dismissed) {
    return null;
  }

  const theme = THEMES[settings.announcementBarColor ?? 'primary'] ?? THEMES.primary;
  const { Icon } = theme;
  const text = settings.announcementBarText;

  /* repeat text so the marquee loop is seamless */
  const segment = (
    <span className="announcement-segment" dir="rtl">
      <Icon className="announcement-icon" />
      <span>{text}</span>
      <Icon className="announcement-icon" />
      <span className="announcement-dot" />
    </span>
  );

  const track = (
    <div className="announcement-track" aria-label={text}>
      {Array.from({ length: 8 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <span key={i} className="announcement-segment-wrap">{segment}</span>
      ))}
    </div>
  );

  return (
    <div
      className="announcement-bar"
      style={{
        background: theme.bg,
        boxShadow: theme.glow,
        '--announcement-shimmer': theme.shimmer,
        '--announcement-dot-color': theme.dot,
        '--announcement-enter': mounted ? '1' : '0',
      } as React.CSSProperties}
    >
      {/* animated shimmer sweep */}
      <div className="announcement-shimmer" />

      {/* floating sparkle dots */}
      <span className="announcement-float announcement-float-1" />
      <span className="announcement-float announcement-float-2" />
      <span className="announcement-float announcement-float-3" />

      {/* scrolling marquee */}
      <div className="announcement-viewport">
        {settings.announcementBarLink ? (
          <a
            href={settings.announcementBarLink}
            target="_blank"
            rel="noopener noreferrer"
            className="announcement-link"
          >
            {track}
          </a>
        ) : track}
      </div>

      {/* close button */}
      <button
        onClick={() => setDismissed(true)}
        className="announcement-close"
        aria-label="إغلاق"
      >
        <X />
      </button>
    </div>
  );
}