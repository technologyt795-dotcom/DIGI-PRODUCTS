import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { LayoutGrid, Package, LogOut, ExternalLink, ShoppingBag, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

const navItems = [
  { name: 'المنتجات', path: '/admin', icon: Package },
  { name: 'التصنيفات', path: '/admin/categories', icon: LayoutGrid },
  { name: 'الإعدادات', path: '/admin/settings', icon: Settings2 },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAdminAuth();
  const { settings } = useStoreSettings();
  
  const storeName = settings?.storeName || 'My Store';

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/30 text-foreground font-sans" dir="rtl">
      <aside className="md:w-64 shrink-0 border-b md:border-b-0 md:border-l border-border bg-background flex md:flex-col">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-border hidden md:flex">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={storeName} className="h-9 w-9 object-contain rounded" />
          ) : (
            <div className="h-9 w-9 rounded-lg bg-primary text-secondary flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
          )}
          <div className="flex flex-col leading-none overflow-hidden">
            <span className="font-bold text-primary truncate">{storeName}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">لوحة التحكم</span>
          </div>
        </div>

        <nav className="flex md:flex-col flex-1 gap-1 p-2 md:p-4 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 md:p-4 flex md:flex-col gap-1 border-t border-border">
          <a
            href={import.meta.env.BASE_URL}
            className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors whitespace-nowrap"
          >
            <ExternalLink className="h-4 w-4" />
            زيارة المتجر
          </a>
          <Button
            variant="ghost"
            onClick={logout}
            className="justify-start gap-3 px-4 text-muted-foreground hover:text-destructive font-medium"
          >
            <LogOut className="h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">{children}</main>
    </div>
  );
}
