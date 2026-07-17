import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { CartProvider } from '@/hooks/use-cart';
import { AdminAuthProvider } from '@/hooks/use-admin-auth';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StoreSettingsProvider, ThemeApplier } from '@/contexts/StoreSettingsContext';

// Pages
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Category from '@/pages/Category';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';

// Admin Pages
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminOrders from '@/pages/admin/AdminOrders';
import AdminCustomers from '@/pages/admin/AdminCustomers';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';
import AdminDiscounts from '@/pages/admin/AdminDiscounts';
import AdminReviews from '@/pages/admin/AdminReviews';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminFinance from '@/pages/admin/AdminFinance';
import AdminSettings from '@/pages/admin/AdminSettings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function StoreRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AdminRouter() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Switch>
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/orders" component={AdminOrders} />
          <Route path="/admin/customers" component={AdminCustomers} />
          <Route path="/admin/products" component={AdminProducts} />
          <Route path="/admin/categories" component={AdminCategories} />
          <Route path="/admin/discounts" component={AdminDiscounts} />
          <Route path="/admin/reviews" component={AdminReviews} />
          <Route path="/admin/analytics" component={AdminAnalytics} />
          <Route path="/admin/finance" component={AdminFinance} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    </AdminGuard>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreSettingsProvider>
        <ThemeApplier />
        <AdminAuthProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Switch>
                <Route path="/admin/login" component={AdminLogin} />
                <Route path="/admin" nested>
                  <AdminRouter />
                </Route>
                <Route>
                  <Layout>
                    <StoreRouter />
                  </Layout>
                </Route>
              </Switch>
            </WouterRouter>
            <Toaster richColors position="bottom-left" dir="rtl" />
          </CartProvider>
        </AdminAuthProvider>
      </StoreSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
