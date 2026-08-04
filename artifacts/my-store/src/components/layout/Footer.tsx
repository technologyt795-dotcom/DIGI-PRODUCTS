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

  const paddingY =
    settings?.footerPadding === 'mini'    ? '1rem'  :
    settings?.footerPadding === 'compact' ? '2rem'  :
    settings?.footerPadding === 'large'   ? '6rem'  :
    '4rem';

  const footerStyle: React.CSSProperties = {
    backgroundColor: settings?.footerBgColor  || undefined,
    color:           settings?.footerTextColor || undefined,
  };

  // When a custom text color is set, override the hardcoded child classes
  const tc = settings?.footerTextColor;
  const headingCls   = tc ? '' : 'text-white';
  const bodyCls      = tc ? '' : 'text-primary-foreground/70';
  const dimCls       = tc ? '' : 'text-primary-foreground/50';
  const headingStyle = tc ? { color: tc }                    : {};
  const bodyStyle    = tc ? { color: tc, opacity: 0.75 }     : {};
  const dimStyle     = tc ? { color: tc, opacity: 0.5  }     : {};

  return (
    <footer
      className={[
        'mt-auto',
        settings?.footerBgColor  ? '' : 'bg-primary',
        settings?.footerTextColor ? '' : 'text-primary-foreground',
      ].join(' ')}
      style={footerStyle}
    >
      <div className="container mx-auto px-4" style={{ paddingTop: paddingY, paddingBottom: paddingY }}>
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
        
        {/* Payment Methods */}
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className={`text-sm ${dimCls}`} style={dimStyle}>
              جميع الحقوق محفوظة &copy; {new Date().getFullYear()} {storeName}
            </p>

            {/* Only render the badges section if at least one method is enabled */}
            {((settings as any)?.paymentVisaEnabled ||
              (settings as any)?.paymentMastercardEnabled ||
              (settings as any)?.paymentMadaEnabled ||
              (settings as any)?.paymentApplePayEnabled ||
              (settings as any)?.paymentStcPayEnabled) && (
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs ml-1 ${dimCls}`} style={dimStyle}>وسائل الدفع المتاحة:</span>

                {/* Visa */}
                {(settings as any)?.paymentVisaEnabled && (
                  <span className="inline-flex items-center justify-center bg-white rounded px-2 py-1 h-8 shadow-sm">
                    <svg viewBox="0 0 60 20" width="38" height="13" xmlns="http://www.w3.org/2000/svg">
                      <text x="0" y="16" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#1A1F71">VISA</text>
                    </svg>
                  </span>
                )}

                {/* Mastercard */}
                {(settings as any)?.paymentMastercardEnabled && (
                  <span className="inline-flex items-center justify-center bg-white rounded px-2 py-1 h-8 shadow-sm">
                    <svg viewBox="0 0 38 24" width="38" height="24" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="13" cy="12" r="10" fill="#EB001B"/>
                      <circle cx="25" cy="12" r="10" fill="#F79E1B"/>
                      <path d="M19 5.27A10 10 0 0 1 23.73 12 10 10 0 0 1 19 18.73 10 10 0 0 1 14.27 12 10 10 0 0 1 19 5.27Z" fill="#FF5F00"/>
                    </svg>
                  </span>
                )}

                {/* Mada */}
                {(settings as any)?.paymentMadaEnabled && (
                  <span className="inline-flex items-center justify-center bg-white rounded px-2 py-1 h-8 shadow-sm">
                    <svg viewBox="0 0 52 20" width="42" height="16" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="52" height="20" rx="3" fill="white"/>
                      <text x="4" y="15" fontFamily="Arial" fontWeight="bold" fontSize="13" fill="#004B87">mada</text>
                      <circle cx="44" cy="10" r="6" fill="#00A651"/>
                      <circle cx="40" cy="10" r="6" fill="#004B87" opacity="0.85"/>
                    </svg>
                  </span>
                )}

                {/* Apple Pay */}
                {(settings as any)?.paymentApplePayEnabled && (
                  <span className="inline-flex items-center justify-center bg-black rounded px-2 py-1 h-8 shadow-sm gap-1">
                    <svg viewBox="0 0 16 20" width="10" height="13" fill="white" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.18 10.5c-.02-2.08 1.7-3.08 1.78-3.13-0.97-1.42-2.48-1.61-3.02-1.63-1.29-.13-2.52.76-3.17.76-.65 0-1.66-.74-2.73-.72C4.6 5.8 3.1 6.65 2.27 8.02 0.57 10.8 1.83 14.92 3.47 17.2c.82 1.17 1.79 2.48 3.07 2.43 1.23-.05 1.7-.79 3.19-.79 1.49 0 1.91.79 3.22.77 1.33-.02 2.17-1.2 2.98-2.38.94-1.36 1.33-2.68 1.35-2.75-.03-.01-2.58-1-2.6-3.98zm-2.44-7.3c.68-.82 1.14-1.97 1.01-3.11-.98.04-2.16.65-2.86 1.47-.63.72-1.18 1.88-1.03 2.99 1.09.08 2.2-.55 2.88-1.35z"/>
                    </svg>
                    <span style={{ color: 'white', fontSize: '11px', fontFamily: 'Arial', fontWeight: 600, letterSpacing: 0.2 }}>Pay</span>
                  </span>
                )}

                {/* STC Pay */}
                {(settings as any)?.paymentStcPayEnabled && (
                  <span className="inline-flex items-center justify-center bg-white rounded px-2 py-1 h-8 shadow-sm">
                    <svg viewBox="0 0 54 20" width="44" height="16" xmlns="http://www.w3.org/2000/svg">
                      <text x="1" y="15" fontFamily="Arial" fontWeight="bold" fontSize="11" fill="#6D2077">STC</text>
                      <rect x="30" y="2" width="22" height="16" rx="3" fill="#6D2077"/>
                      <text x="33" y="14" fontFamily="Arial" fontWeight="bold" fontSize="10" fill="white">Pay</text>
                    </svg>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
