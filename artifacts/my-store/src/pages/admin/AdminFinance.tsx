import { useGetFinance } from '@workspace/api-client-react';
import { Loader2, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Banknote } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function AdminFinance() {
  const { data: finance, isLoading } = useGetFinance();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!finance) return null;

  const monthDiff = finance.thisMonthRevenue - finance.lastMonthRevenue;
  const monthGrowth = finance.lastMonthRevenue === 0 
    ? 100 
    : (monthDiff / finance.lastMonthRevenue) * 100;
  
  const isPositiveGrowth = monthDiff >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">المالية والمبيعات</h1>
        <p className="text-sm text-muted-foreground">التقارير المالية وإيرادات المتجر</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finance.totalRevenue.toLocaleString('ar-SA')} رس</div>
            <p className="text-xs text-muted-foreground mt-1">طوال فترة عمل المتجر</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">إيرادات الشهر الحالي</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finance.thisMonthRevenue.toLocaleString('ar-SA')} رس</div>
            <div className="flex items-center mt-1 text-xs font-medium">
              <span className={cn("flex items-center gap-1", isPositiveGrowth ? "text-green-600" : "text-red-600")}>
                {isPositiveGrowth ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(monthGrowth).toFixed(1)}%
              </span>
              <span className="text-muted-foreground mr-1">مقارنة بالشهر الماضي</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">الشهر الماضي</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finance.lastMonthRevenue.toLocaleString('ar-SA')} رس</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">متوسط قيمة الطلب</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{finance.avgOrderValue.toLocaleString('ar-SA')} رس</div>
            <p className="text-xs text-muted-foreground mt-1">لكل {finance.totalOrders} طلبات</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإيرادات الشهرية (آخر 12 شهر)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={finance.revenueByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `${v}`} />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  formatter={(value: number) => [`${value.toLocaleString('ar-SA')} رس`, 'الإيرادات']} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
