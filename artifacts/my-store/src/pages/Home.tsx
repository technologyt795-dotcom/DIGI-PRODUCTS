import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/sections/Hero";

export default function Home() {
  const {
    data: settings,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["/api/admin/settings"],
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        جاري التحميل...
      </div>
    );

  // إذا حدث خطأ في جلب البيانات، سنعرض الصفحة بقيم افتراضية بدلاً من أن تنهار
  if (error) console.error("Error fetching settings:", error);

  return (
    <main className="min-h-screen bg-background" dir="rtl">
      <Hero
        title={settings?.heroTitle || "أهلاً بك في موقعنا"}
        description={
          settings?.heroDescription || "نحن نقدم أفضل الحلول التقنية لعملائنا."
        }
        image={
          settings?.heroImage ||
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
        }
        titleColor={settings?.heroTitleColor || "#000000"}
        titleSize={settings?.heroTitleSize || 60}
      />

      {/* قمنا بإخفاء الأقسام الأخرى مؤقتاً لنتأكد من عمل الهيرو أولاً */}
      <div className="container mx-auto px-4 py-20 text-center text-gray-400">
        سيتم إضافة بقية الأقسام هنا قريباً...
      </div>
    </main>
  );
}
