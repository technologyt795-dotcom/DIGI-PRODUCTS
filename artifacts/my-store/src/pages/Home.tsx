import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/sections/Hero";

export default function Home() {
  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/settings"],
  });

  if (isLoading) return <div>جاري التحميل...</div>;

  return (
    <main>
      <Hero
        title={settings?.heroTitle || "العنوان الافتراضي"}
        description={settings?.heroDescription || "الوصف الافتراضي"}
        image={settings?.heroImage || "https://via.placeholder.com/500"}
        titleColor={settings?.heroTitleColor}
        titleSize={settings?.heroTitleSize}
      />
    </main>
  );
}
