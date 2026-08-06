import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

// هذا هو مكون الهيرو (Hero) وضعناه هنا مباشرة لضمان عمله
function HeroSection({
  title,
  description,
  image,
  titleColor,
  titleSize,
}: any) {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4 text-right" dir="rtl">
        <div className="flex flex-wrap items-center -mx-4">
          <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
            <div className="max-w-lg">
              <h1
                className="font-bold mb-6 leading-tight"
                style={{
                  color: titleColor || "inherit",
                  fontSize: titleSize ? `${titleSize}px` : "3.75rem",
                }}
              >
                {title}
              </h1>
              <p className="text-xl text-muted-foreground mb-10">
                {description}
              </p>
              <div className="flex flex-wrap gap-4 justify-start">
                <Button size="lg" className="px-8">
                  ابدأ الآن
                </Button>
                <Button size="lg" variant="outline" className="px-8">
                  تعرف علينا
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 px-4">
            <img
              className="rounded-2xl shadow-2xl w-full h-[500px] object-cover"
              src={image}
              alt="Hero"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  // جلب البيانات من السيرفر
  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/settings"],
  });

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        جاري التحميل...
      </div>
    );

  return (
    <main className="min-h-screen bg-background">
      <HeroSection
        title={settings?.heroTitle || "أهلاً بك في موقعك المطور"}
        description={
          settings?.heroDescription ||
          "يمكنك الآن التحكم في هذا النص والألوان من لوحة التحكم."
        }
        image={
          settings?.heroImage ||
          "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
        }
        titleColor={settings?.heroTitleColor}
        titleSize={settings?.heroTitleSize}
      />

      {/* رسالة بسيطة لبقية الأقسام لضمان عدم حدوث أخطاء */}
      <div className="py-20 text-center border-t border-dashed">
        <p className="text-gray-400">
          سيتم إضافة أقسام المميزات والأسعار هنا قريباً
        </p>
      </div>
    </main>
  );
}
