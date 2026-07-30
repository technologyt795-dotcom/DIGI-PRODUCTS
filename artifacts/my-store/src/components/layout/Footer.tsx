import React from 'react';
import { Link } from 'wouter';
import { ShoppingBag, Lock, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';
import { useStoreSettings } from '@/contexts/StoreSettingsContext';
import { FaWhatsapp } from 'react-icons/fa';
import { useListCategories } from '@workspace/api-client-react';

export function Footer() {
  const { settings } = useStoreSettings();
  const { data: categories } = useListCategories();
  const visibleCategories = (categories ?? []).filter((c) => !c.isHidden);
  const storeName = settings?.storeName || 'My Store';

  const paddingClass =
    settings?.footerPadding === 'compact' ? 'py-8' :
    settings?.footerPadding === 'large'   ? 'py-24' :
    'py-16';

  const footerStyle: React.CSSProperties = {
    ...(settings?.footerBgColor ? { background: settings.footerBgColor } : {}),
    ...(settings?.footerTextColor ? { color: settings.footerTextColor } : {}),
  };

  return (
    <footer className="bg-primary text-primary-foreground mt-auto" style={footerStyle}>
      <div className={`container mx-auto px-4 ${paddingClass}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt={storeName} className="h-12 w-auto object-contain rounded bg-white p-1" />
              ) : (
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                  <ShoppingBag className="h-7 w-7 absolute" />
                  <Lock className="h-3 w-3 absolute mt-2 ml-1 text-primary" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none tracking-tight text-white">{storeName}</span>
                {settings?.tagline && (
                  <span className="text-xs uppercase tracking-wider text-secondary font-medium mt-1">
                    {settings.tagline}
                  </span>
                )}
              </div>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              وجهتك الموثوقة للتسوق الإلكتروني. نجمع لك أفضل المنتجات تحت سقف واحد بمعايير جودة عالية.
            </p>
            <div className="flex gap-4 pt-2">
              {settings?.instagramUrl && (
                <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Instagram className="h-5 w-5" /></a>
              )}
              {settings?.twitterUrl && (
                <a href={settings.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Twitter className="h-5 w-5" /></a>
              )}
              {settings?.facebookUrl && (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Facebook className="h-5 w-5" /></a>
              )}
              {settings?.whatsappNumber && (
                <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-primary-foreground/70 hover:text-secondary transition-colors"><FaWhatsapp className="h-5 w-5" /></a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">روابط سريعة</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/" className="hover:text-secondary transition-colors">الرئيسية</Link></li>
              <li><Link href="/products" className="hover:text-secondary transition-colors">كل المنتجات</Link></li>
              <li><Link href="/cart" className="hover:text-secondary transition-colors">سلة المشتريات</Link></li>
              <li><Link href="/my-orders" className="hover:text-secondary transition-colors">تتبع طلبك</Link></li>
              {settings?.refundPolicy && (
                <li><Link href="/refund-policy" className="hover:text-secondary transition-colors">سياسة الاسترجاع</Link></li>
              )}
            </ul>
          </div>

          {/* Categories — dynamic, hidden categories are excluded */}
          {visibleCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-white mb-6">الفئات</h3>
              <ul className="space-y-3 text-sm text-primary-foreground/70">
                {visibleCategories.map((cat) => (
                  <li key={cat.id}>
                    <Link
                      href={`/category/${cat.slug}`}
                      className="hover:text-secondary transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-primary-foreground/70">
              {settings?.address && (
                <li className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-secondary shrink-0" />
                  <span>{settings.address}</span>
                </li>
              )}
              {settings?.contactPhone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-secondary shrink-0" />
                  <span dir="ltr">{settings.contactPhone}</span>
                </li>
              )}
              {settings?.contactEmail && (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-secondary shrink-0" />
                  <span>{settings.contactEmail}</span>
                </li>
              )}
            </ul>
          </div>
          
        </div>
        
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex items-center justify-center text-sm text-primary-foreground/50">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {storeName}</p>
        </div>
      </div>
    </footer>
  );
}
