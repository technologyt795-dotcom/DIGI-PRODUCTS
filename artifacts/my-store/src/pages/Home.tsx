import { Link } from "wouter";
import {
  useListCategories,
  useListFeaturedProducts,
} from "@workspace/api-client-react";
import {
  ShieldCheck,
  Truck,
  HeadphonesIcon,
  ArrowLeft,
  Download,
  Zap,
  Code2,
  FileCode,
  Lock,
  Infinity,
  Star,
  Globe,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useTheme, useStoreSettings } from "@/contexts/StoreSettingsContext";

/* ─── Digital Hero ──────────────────────────────────────────── */
function DigitalHero() {
  return (
    <section className="relative overflow-hidden bg-background text-foreground min-h-[92vh] flex items-center">
      {/* Animated grid dots */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid-dots"
            x="0"
            y="0"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="hsl(186,100%,42%)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-dots)" />
      </svg>

      {/* Corner glow blobs */}
      <div
        className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,212,212,0.13) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.11) 0%, transparent 70%)",
        }}
      />

      {/* Floating decorative code cards */}
      <div className="absolute top-16 left-8 hidden xl:block opacity-60 select-none pointer-events-none">
        <div
          className="border border-cyan-500/20 bg-black/40 backdrop-blur-sm rounded p-3 text-[11px] font-mono text-cyan-400/70 w-52"
          style={{ boxShadow: "0 0 20px rgba(0,212,212,0.08)" }}
        >
          <span className="text-purple-400/80">const</span> product = {"{"}
          <br />
          &nbsp;&nbsp;<span className="text-cyan-300/80">type</span>:{" "}
          <span className="text-green-400/80">"digital"</span>,<br />
          &nbsp;&nbsp;<span className="text-cyan-300/80">download</span>:{" "}
          <span className="text-orange-400/80">true</span>
          <br />
          {"}"}
        </div>
      </div>

      <div className="absolute bottom-24 left-12 hidden xl:block opacity-50 select-none pointer-events-none">
        <div
          className="border border-purple-500/20 bg-black/40 backdrop-blur-sm rounded p-3 text-[11px] font-mono text-purple-400/70 w-48"
          style={{ boxShadow: "0 0 20px rgba(139,92,246,0.08)" }}
        >
          <span className="text-cyan-400/80">✓</span> licence.key
          <br />
          <span className="text-cyan-400/80">✓</span> instant_access
          <br />
          <span className="text-cyan-400/80">✓</span> lifetime_updates
        </div>
      </div>

      {/* Right side — visual stack of product cards */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3 pl-10 opacity-75 pointer-events-none select-none">
        {[
          {
            icon: <FileCode className="h-5 w-5" />,
            name: "نظام إدارة الميزانية",
            price: "٨٩",
            color: "border-cyan-500/30",
          },
          {
            icon: <Code2 className="h-5 w-5" />,
            name: "حزمة إضافات Figma",
            price: "١٢٠",
            color: "border-purple-500/30",
          },
          {
            icon: <Globe className="h-5 w-5" />,
            name: "كورس تصميم كامل",
            price: "٢٥٠",
            color: "border-cyan-400/30",
          },
          {
            icon: <Lock className="h-5 w-5" />,
            name: "مفتاح ترخيص",
            price: "٤٥",
            color: "border-green-500/20",
          },
        ].map((item, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 border ${item.color} bg-black/50 backdrop-blur-sm rounded px-4 py-2.5 text-sm`}
            style={{
              transform: `translateX(${i % 2 === 0 ? "-4px" : "4px"})`,
              boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
            }}
          >
            <span className="text-primary">{item.icon}</span>
            <span className="text-foreground/80 font-medium">{item.name}</span>
            <span className="mr-auto text-primary font-bold text-xs">
              {item.price} ر.س
            </span>
            <Download className="h-3.5 w-3.5 text-primary/60" />
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="container relative z-10 mx-auto px-4 py-24 flex flex-col lg:flex-row items-center gap-16">
        <div className="w-full lg:w-3/5 space-y-8">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded border px-3 py-1.5 text-xs font-mono font-semibold"
            style={{
              borderColor: "rgba(0,212,212,0.35)",
              background: "rgba(0,212,212,0.06)",
              color: "hsl(186,100%,55%)",
              boxShadow: "0 0 12px rgba(0,212,212,0.12)",
            }}
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "hsl(186,100%,42%)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "hsl(186,100%,42%)" }}
              />
            </span>
            منتجات رقمية — تحميل فوري بعد الشراء
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.15]">
            <span className="text-foreground">كل ما تحتاجه </span>
            <br />
            <span
              style={{
                background:
                  "linear-gradient(90deg, hsl(186,100%,52%), hsl(262,68%,72%))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              رقمياً وفورياً
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            أنظمة وأدوات رقمية احترافية تساعدك على إنجاز أعمالك وتنظيم حياتك.
            اشترِ الآن وابدأ مباشرة — بدون انتظار، بدون شحن.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              size="lg"
              className="font-bold text-base h-13 px-8"
              style={{ borderRadius: "4px" }}
            >
              <Link href="/products">
                <Download className="ml-2 h-5 w-5" />
                تصفح المنتجات الرقمية
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-bold text-base h-13 px-8"
              style={{
                borderRadius: "4px",
                borderColor: "rgba(0,212,212,0.35)",
                color: "hsl(186,100%,52%)",
              }}
            >
              <Link href="/category/digital-products">
                <Zap className="ml-2 h-5 w-5" />
                أحدث الإصدارات
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div
            className="flex flex-wrap gap-8 pt-4 border-t"
            style={{ borderColor: "rgba(0,212,212,0.12)" }}
          >
            {[
              { value: "+٢٠٠", label: "منتج رقمي" },
              { value: "+١٥٠٠", label: "عميل سعيد" },
              {
                value: "٤.٩",
                label: "تقييم المتجر",
                icon: <Star className="h-3 w-3 fill-current" />,
              },
              { value: "فوري", label: "التسليم" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col">
                <span
                  className="text-2xl font-black flex items-center gap-1"
                  style={{
                    color: "hsl(186,100%,52%)",
                    textShadow: "0 0 16px rgba(0,212,212,0.4)",
                  }}
                >
                  {s.icon}
                  {s.value}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right decorative panel — terminal window */}
        <div className="hidden lg:block w-2/5 pointer-events-none select-none">
          <div
            className="border rounded-lg overflow-hidden"
            style={{
              borderColor: "rgba(0,212,212,0.25)",
              background: "rgba(6,10,22,0.9)",
              boxShadow:
                "0 0 60px rgba(0,212,212,0.1), 0 24px 64px rgba(0,0,0,0.6)",
            }}
          >
            {/* Terminal header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b"
              style={{
                borderColor: "rgba(0,212,212,0.12)",
                background: "rgba(0,0,0,0.3)",
              }}
            >
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
              </div>
              <span className="text-xs font-mono text-muted-foreground mr-2">
                purchase.sh
              </span>
            </div>
            {/* Terminal body */}
            <div className="p-5 font-mono text-sm space-y-2">
              <div>
                <span className="text-green-400/80">$</span>{" "}
                <span className="text-cyan-300/80">buy</span>{" "}
                <span className="text-foreground/70">
                  --product "UI Kit Pro"
                </span>
              </div>
              <div className="text-muted-foreground/60 text-xs">
                جارٍ معالجة الدفع...
              </div>
              <div className="text-green-400/80">✓ تم الدفع بنجاح</div>
              <div className="text-green-400/80">✓ جارٍ تجهيز الملف</div>
              <div className="text-cyan-400/80">
                ↓ بدء التحميل <span className="animate-pulse">█</span>
              </div>
              <div
                className="mt-3 border rounded px-3 py-2 text-xs"
                style={{
                  borderColor: "rgba(0,212,212,0.2)",
                  background: "rgba(0,212,212,0.05)",
                }}
              >
                <div className="text-muted-foreground/60 mb-1">
                  ui-kit-pro-v2.zip
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  <div
                    className="h-full rounded-full w-3/4"
                    style={{
                      background:
                        "linear-gradient(90deg, hsl(186,100%,42%), hsl(262,68%,66%))",
                    }}
                  />
                </div>
                <div
                  className="text-right text-xs mt-1"
                  style={{ color: "hsl(186,100%,52%)" }}
                >
                  75%
                </div>
              </div>
              <div className="text-xs text-muted-foreground/50 mt-2">
                الوصول مدى الحياة · تحديثات مجانية
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Standard Hero ─────────────────────────────────────────── */
function StandardHero() {
  const { settings } = useStoreSettings();
  const bgImageUrl =
    settings?.heroBgImage ||
    "https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2000&auto=format&fit=crop";

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url('${bgImageUrl}')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-l from-black/80 via-black/55 to-black/10" />
      <div className="container relative z-10 mx-auto px-4 py-24 md:py-32 lg:py-40 flex flex-col md:flex-row items-center">
        <div className="w-full md:w-1/2 space-y-8">
          <div className="inline-flex items-center rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-sm font-medium text-secondary">
            <span className="flex h-2 w-2 rounded-full bg-secondary mr-2" />
            ذكاء في الاختيار.. توفير في السعر
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1]">
            أفضل المنتجات الرقمية، <br />
            <span className="text-secondary">بأفضل الأسعار الذكية</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-lg leading-relaxed">
            نوفر لك تشكيلة واسعة من الحلول الرقمية الأصلية بأسعار تنافسية. وفر
            وقتك ومالك واحصل على منتجك مباشرة.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-bold text-lg h-14 px-8 rounded-full"
            >
              <Link href="/products">تصفح المنتجات</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary hover:bg-primary-foreground/10 hover:text-primary-foreground font-bold text-lg h-14 px-8 rounded-full"
            >
              <Link href="/category/tech-products">أحدث التقنيات</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Features ────────────────────────────────────────── */
function TrustFeatures({ isDigital }: { isDigital: boolean }) {
  const features = isDigital
    ? [
        {
          icon: <Download className="h-8 w-8" />,
          title: "تحميل فوري",
          desc: "استلم ملفاتك فور إتمام الدفع مباشرة",
        },
        {
          icon: <Infinity className="h-8 w-8" />,
          title: "وصول مدى الحياة",
          desc: "تحديثات مجانية وتحميل غير محدود",
        },
        {
          icon: <Lock className="h-8 w-8" />,
          title: "دفع آمن 100%",
          desc: "بياناتك محمية بأحدث معايير التشفير",
        },
      ]
    : [
        {
          icon: <ShieldCheck className="h-8 w-8" />,
          title: "جودة مضمونة",
          desc: "منتجات أصلية 100% ومختارة بعناية",
        },
        {
          icon: <Truck className="h-8 w-8" />,
          title: "شحن سريع وآمن",
          desc: "توصيل لجميع مناطق المملكة",
        },
        {
          icon: <HeadphonesIcon className="h-8 w-8" />,
          title: "دعم فني متميز",
          desc: "متواجدون لخدمتك على مدار الساعة",
        },
      ];

  return (
    <section className="bg-background py-12 border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-muted/50 transition-colors"
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/5 text-primary">
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg">{f.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function Home() {
  const { data: categories, isLoading: isLoadingCategories } =
    useListCategories();
  const { data: featuredProducts, isLoading: isLoadingFeatured } =
    useListFeaturedProducts();
  const theme = useTheme();
  const isDigital = theme === "digital";

  return (
    <div className="flex flex-col w-full">
      {isDigital ? <DigitalHero /> : <StandardHero />}

      <TrustFeatures isDigital={isDigital} />

      {/* Categories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-foreground mb-3">
              تسوق حسب الفئة
            </h2>
            <p className="text-muted-foreground">
              اكتشف مجموعتنا المتنوعة من المنتجات
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {isLoadingCategories
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="aspect-[4/5] rounded-3xl w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  />
                ))
              : categories?.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="group relative overflow-hidden rounded-3xl aspect-[4/5] flex flex-col justify-end p-6 w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  >
                    <div className="absolute inset-0 bg-muted">
                      <img
                        src={
                          category.image ||
                          `https://placehold.co/600x800/1e293b/d4af37?text=${encodeURIComponent(category.name)}`
                        }
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                    <div className="relative z-10 transition-transform duration-300 group-hover:-translate-y-2">
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {category.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-white/80 text-sm font-medium">
                          {category.productCount} منتج
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm text-white group-hover:bg-secondary group-hover:text-secondary-foreground transition-colors">
                          <ArrowLeft className="h-5 w-5" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-foreground mb-3">
              منتجات مميزة
            </h2>
            <p className="text-muted-foreground">
              أفضل الاختيارات الموصى بها لك
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {isLoadingFeatured
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-[400px] rounded-2xl w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  />
                ))
              : featuredProducts?.map((product) => (
                  <div
                    key={product.id}
                    className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
          </div>
          <div className="mt-10 sm:hidden flex justify-center">
            <Button asChild variant="outline" className="w-full font-bold">
              <Link href="/products">عرض كل المنتجات</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
