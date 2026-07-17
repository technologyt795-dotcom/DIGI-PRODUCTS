import { useGetAnalytics } from '@workspace/api-client-react';
import { Loader2, TrendingUp, BarChart, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useGetAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!analytics) return null;

  const COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#22c55e', '#ef4444'];

  const getStatusName = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'processing': return 'قيد المعالجة';
      case 'shipped': return 'مشحون';
      case 'delivered': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const pieData = analytics.ordersByStatus.map((item) => ({
    name: getStatusName(item.status),
    value: item.count,
  }));

  const chartData = analytics.revenueByDay.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">التحليلات التفصيلية</h1>
        <p className="text-sm text-muted-foreground">أداء المتجر والمبيعات خلال 30 يوماً</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium opacity-80">إجمالي الإيرادات</span>
              <TrendingUp className="h-5 w-5 opacity-80" />
            </div>
            <div>
              <div className="text-3xl font-black">{analytics.totalRevenue.toLocaleString('ar-SA')} رس</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">إجمالي الطلبات</span>
              <BarChart className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-3xl font-bold">{analytics.totalOrders.toLocaleString('ar-SA')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col justify-between h-full gap-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground">المنتجات النشطة</span>
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-3xl font-bold">{analytics.totalProducts.toLocaleString('ar-SA')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الإيرادات اليومية</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `${v}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toLocaleString('ar-SA')} رس`, 'الإيرادات']} 
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--background))" }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>الطلبات اليومية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(value: number) => [value, 'عدد الطلبات']} 
                  />
                  <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[300px]">
             {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => [val, 'العدد']} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
             ) : (
                <div className="text-muted-foreground text-sm">لا توجد بيانات للطلبات</div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
