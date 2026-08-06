import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
// دالة بديلة لـ apiRequest في حال عدم وجود الملف
const apiRequest = async (method: string, url: string, data?: any) => {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });
  if (!res.ok) throw new Error("فشل الطلب");
  return res.json();
};

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/settings"],
  });

  const form = useForm({
    values: settings || {
      heroTitle: "",
      heroDescription: "",
      heroImage: "",
      heroTitleColor: "#000000",
      heroTitleSize: 60,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      // تحويل القيم الرقمية للتأكد من أنها أرقام وليست نصوص
      const formattedData = {
        ...data,
        heroTitleSize: parseInt(data.heroTitleSize) || 60,
      };
      await apiRequest("POST", "/api/admin/settings", formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({
        title: "تم الحفظ!",
        description: "تم تحديث إعدادات الموقع بنجاح.",
      });
    },
  });

  if (isLoading) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div className="container mx-auto py-10 px-4" dir="rtl">
      <h1 className="text-3xl font-bold mb-8">لوحة التحكم</h1>
      <form
        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
        className="space-y-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>إعدادات الهيرو (Hero)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>العنوان</Label>
              <Input {...form.register("heroTitle")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>لون العنوان</Label>
                <Input
                  type="color"
                  {...form.register("heroTitleColor")}
                  className="h-10"
                />
              </div>
              <div className="grid gap-2">
                <Label>حجم الخط (px)</Label>
                <Input type="number" {...form.register("heroTitleSize")} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>الوصف</Label>
              <Textarea {...form.register("heroDescription")} />
            </div>
            <div className="grid gap-2">
              <Label>رابط الصورة</Label>
              <Input {...form.register("heroImage")} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </form>
    </div>
  );
}
