import { X } from 'lucide-react';
import { useState } from 'react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

export function AnnouncementBar() {
  const { settings } = useStoreSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!settings?.announcementBarEnabled || !settings?.announcementBarText || dismissed) {
    return null;
  }

  const color = settings.announcementBarColor ?? 'primary';

  const colorMap: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'bg-primary', text: 'text-primary-foreground' },
    green:   { bg: 'bg-emerald-600', text: 'text-white' },
    orange:  { bg: 'bg-orange-500', text: 'text-white' },
    red:     { bg: 'bg-red-600', text: 'text-white' },
    purple:  { bg: 'bg-purple-600', text: 'text-white' },
    dark:    { bg: 'bg-gray-900', text: 'text-white' },
  };

  const style = colorMap[color] ?? colorMap.primary;
  const content = (
    <span className="text-sm font-medium tracking-wide">{settings.announcementBarText}</span>
  );

  return (
    <div className={`${style.bg} ${style.text} relative flex items-center justify-center px-10 py-2 text-center`} dir="rtl">
      {settings.announcementBarLink ? (
        <a
          href={settings.announcementBarLink}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline"
        >
          {content}
        </a>
      ) : content}
      <button
        onClick={() => setDismissed(true)}
        className="absolute left-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="إغلاق"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
