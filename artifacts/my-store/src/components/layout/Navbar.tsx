import { Link } from 'wouter';
import { ShoppingBag, Lock, Menu, Search, X } from 'lucide-react';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { useListCategories } from '@workspace/api-client-react';
import { AnimatePresence, motion } from 'framer-motion';

export function Navbar() {
  const { totalItems } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const { settings } = useStoreSettings();
  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/products?search=${encodeURIComponent(searchQuery)}`);
      setIsMenuOpen(false);
    }
  };

  // Static links always visible
  const staticLinks = [
    { name: 'الرئيسية', path: '/' },
    { name: 'كل المنتجات', path: '/products' },
  ];

  // Dynamic category links — only visible, non-empty categories
  const categoryLinks = (categories ?? [])
    .filter((c) => !c.isHidden)
    .map((c) => ({ name: c.name, path: `/category/${c.slug}` }));

  const storeName = settings?.storeName || 'My Store';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between gap-4">
          
          {/* Mobile Menu Toggle */}
          <div className="flex items-center lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-90">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt={storeName} className="h-10 w-auto object-contain rounded" />
            ) : (
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-secondary">
                <ShoppingBag className="h-6 w-6 absolute" />
                <Lock className="h-3 w-3 absolute mt-2 ml-1 text-background" />
              </div>
            )}
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-bold leading-none tracking-tight text-primary">{storeName}</span>
              {settings?.tagline && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mt-1">
                  {settings.tagline}
                </span>
              )}
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-muted-foreground overflow-hidden">
            {/* Static links — always shown, no animation needed */}
            {staticLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className="px-3 py-1.5 rounded-md transition-colors hover:text-primary hover:bg-muted/50 whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}

            {/* Animated category links */}
            <AnimatePresence initial={false} mode="popLayout">
              {categoryLinks.map((link) => (
                <motion.div
                  key={link.path}
                  layout
                  initial={{ opacity: 0, scale: 0.85, width: 0, marginLeft: 0 }}
                  animate={{ opacity: 1, scale: 1, width: 'auto', marginLeft: 0 }}
                  exit={{ opacity: 0, scale: 0.85, width: 0, marginLeft: 0 }}
                  transition={{
                    layout: { type: 'spring', stiffness: 400, damping: 35 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    width: { type: 'spring', stiffness: 400, damping: 35 },
                  }}
                  style={{ overflow: 'hidden' }}
                >
                  <Link
                    href={link.path}
                    className="block px-3 py-1.5 rounded-md transition-colors hover:text-primary hover:bg-muted/50 whitespace-nowrap"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </nav>

          {/* Search & Cart */}
          <div className="flex items-center gap-2 sm:gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-sm items-center">
              <Search className="absolute right-3 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="ابحث عن المنتجات..." 
                className="h-10 w-full rounded-full border border-border bg-muted/50 pr-10 pl-4 text-sm outline-none transition-colors focus:border-primary focus:bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            
            <Link href="/cart" className="relative p-2 text-foreground transition-colors hover:text-primary group">
              <ShoppingBag className="h-6 w-6 group-hover:scale-110 transition-transform" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-secondary-foreground shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="fixed inset-y-0 right-0 w-full max-w-xs border-l bg-background p-6 shadow-xl flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                {settings?.logoUrl ? (
                  <img src={settings.logoUrl} alt={storeName} className="h-8 w-auto object-contain rounded" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-secondary">
                    <ShoppingBag className="h-5 w-5" />
                  </div>
                )}
                <span className="text-lg font-bold text-primary">{storeName}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <form onSubmit={handleSearch} className="relative mb-6">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <input 
                type="search" 
                placeholder="ابحث..." 
                className="h-10 w-full rounded-md border border-border bg-muted/50 pr-10 pl-4 text-sm outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <nav className="flex flex-col gap-1 text-base font-medium">
              {/* Static links */}
              {staticLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="px-3 py-2 rounded-md text-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                >
                  {link.name}
                </Link>
              ))}

              {/* Animated category links in mobile */}
              <AnimatePresence initial={false}>
                {categoryLinks.map((link) => (
                  <motion.div
                    key={link.path}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-foreground hover:text-primary hover:bg-muted/50 transition-colors"
                    >
                      {link.name}
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
