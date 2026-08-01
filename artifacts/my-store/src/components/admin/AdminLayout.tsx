import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  LayoutGrid,
  Tag,
  Star,
  BarChart2,
  Wallet,
  Settings2,
  LogOut,
  ExternalLink,
  ShoppingBag,
  Menu,
  X,
  Smartphone,
  Megaphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';

const navItems = [
  { name: 'لوحة التحكم', path: '/admin', icon: LayoutDashboard },
  { name: 'الطلبات', path: '/admin/orders', icon: ShoppingCart },
  { name: 'العملاء', path: '/admin/customers', icon: Users },
  { name: 'المنتجات', path: '/admin/products', icon: Package },
  { name: 'التصنيفات', path: '/admin/categories', icon: LayoutGrid },
  { name: 'الخصومات', path: '/admin/discounts', icon: Tag },
  { name: 'التقييمات', path: '/admin/reviews', icon: Star },
  { name: 'التحليلات', path: '/admin/analytics', icon: BarChart2 },
  { name: 'المالية', path: '/admin/finance', icon: Wallet },
  { name: 'التسويق', path: '/admin/marketing', icon: Megaphone },
  { name: 'الإعدادات', path: '/admin/settings', icon: Settings2 },
  { name: 'معاينة المتجر', path: '/admin/preview', icon: Smartphone },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout } = useAdminAuth();
  const { settings } = useStoreSettings();
  const [mobileOpen, setMobileOpen] = useState(false);

  const storeName = settings?.storeName || 'My Store';

  const NavContent = () => (
    <>
      {/* Logo / Store Name */}
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
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

      {/* Nav Items */}
      <nav className="flex flex-col flex-1 gap-1 p-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === '/admin' ? location === '/admin' : location.startsWith(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 flex flex-col gap-1 border-t border-border shrink-0">
        <a
          href={import.meta.env.BASE_URL}
          className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          زيارة المتجر
        </a>
        <Button
          variant="ghost"
          onClick={logout}
          className="justify-start gap-3 px-4 py-3 h-auto text-muted-foreground hover:text-destructive font-medium"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-muted/30 text-foreground font-sans" dir="rtl">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex md:w-64 shrink-0 border-l border-border bg-background flex-col h-[100dvh] sticky top-0">
        <NavContent />
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-background border-b border-border sticky top-0 z-30">
        <div className="flex items-center gap-2">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt={storeName} className="h-8 w-8 object-contain rounded" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-primary text-secondary flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          )}
          <span className="font-bold text-primary">{storeName}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* ── Mobile Drawer Overlay ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <div
        className={cn(
          'md:hidden fixed top-0 right-0 h-full w-72 z-50 bg-background border-l border-border flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="font-semibold text-foreground">القائمة</span>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <NavContent />
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden min-w-0">{children}</main>
    </div>
  );
}
