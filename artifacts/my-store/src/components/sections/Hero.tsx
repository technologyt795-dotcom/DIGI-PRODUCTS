import { Button } from "@/components/ui/button";

interface HeroProps {
  title: string;
  description: string;
  image: string;
  titleColor?: string; // خاصية اللون
  titleSize?: string; // خاصية الحجم
}

export default function Hero({
  title,
  description,
  image,
  titleColor,
  titleSize,
}: HeroProps) {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap items-center -mx-4">
          <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
            <div className="max-w-lg">
              {/* هنا نطبق اللون والحجم ديناميكياً */}
              <h1
                className="font-bold font-heading mb-6 leading-tight"
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
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="px-8">
                  ابدأ الآن
                </Button>
                <Button size="lg" variant="outline" className="px-8">
                  تعرف علينا
                </Button>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 px-4 text-center">
            <img
              className="inline-block rounded-2xl shadow-2xl w-full max-w-md h-[500px] object-cover"
              src={image}
              alt="Hero"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
