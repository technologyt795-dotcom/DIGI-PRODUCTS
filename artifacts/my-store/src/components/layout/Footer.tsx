import { Link } from 'wouter';
import { ShoppingBag, Lock, Mail, Phone, MapPin, Instagram, Twitter, Facebook } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-primary">
                <ShoppingBag className="h-7 w-7 absolute" />
                <Lock className="h-3 w-3 absolute mt-2 ml-1 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold leading-none tracking-tight text-white">My Store</span>
                <span className="text-xs uppercase tracking-wider text-secondary font-medium">الجودة والثقة</span>
              </div>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed max-w-xs">
              وجهتك الموثوقة للتسوق الإلكتروني. نجمع لك أفضل المنتجات في المنزل، التقنية، والسيارات تحت سقف واحد بمعايير جودة عالية.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Instagram className="h-5 w-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Twitter className="h-5 w-5" /></a>
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors"><Facebook className="h-5 w-5" /></a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">روابط سريعة</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/" className="hover:text-secondary transition-colors">الرئيسية</Link></li>
              <li><Link href="/products" className="hover:text-secondary transition-colors">كل المنتجات</Link></li>
              <li><Link href="/cart" className="hover:text-secondary transition-colors">سلة المشتريات</Link></li>
              <li><a href="#" className="hover:text-secondary transition-colors">تتبع طلبك</a></li>
              <li><a href="#" className="hover:text-secondary transition-colors">سياسة الاسترجاع</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">الفئات</h3>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li><Link href="/category/home-organization" className="hover:text-secondary transition-colors">المنزل والتنظيم</Link></li>
              <li><Link href="/category/digital-products" className="hover:text-secondary transition-colors">المنتجات الرقمية</Link></li>
              <li><Link href="/category/tech-products" className="hover:text-secondary transition-colors">المنتجات التقنية</Link></li>
              <li><Link href="/category/car-accessories" className="hover:text-secondary transition-colors">إكسسوارات السيارات</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6">تواصل معنا</h3>
            <ul className="space-y-4 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-secondary" />
                <span>الرياض، المملكة العربية السعودية</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary" />
                <span dir="ltr">+966 50 123 4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary" />
                <span>support@mystore.com</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          <p>جميع الحقوق محفوظة &copy; {new Date().getFullYear()} My Store</p>
        </div>
      </div>
    </footer>
  );
}
