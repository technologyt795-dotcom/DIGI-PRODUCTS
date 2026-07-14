import { Link } from "wouter";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex w-full items-center justify-center min-h-[60vh] bg-background">
      <div className="text-center p-8 max-w-md w-full bg-card border border-border rounded-3xl shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <h1 className="text-4xl font-black text-foreground mb-4">404</h1>
        <p className="text-xl font-bold text-foreground mb-2">الصفحة غير موجودة</p>
        <p className="text-muted-foreground mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Button asChild className="w-full h-12 rounded-xl font-bold">
          <Link href="/">العودة للرئيسية</Link>
        </Button>
      </div>
    </div>
  );
}
