import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { CartProvider } from '@/hooks/use-cart';
import { AdminAuthProvider } from '@/hooks/use-admin-auth';
import { CustomerAuthProvider } from '@/hooks/use-customer-auth';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StoreSettingsProvider, ThemeApplier } from '@/contexts/StoreSettingsContext';

// Pages
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Category from '@/pages/Category';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import MyOrders from '@/pages/MyOrders';
import OrderDetail from '@/pages/OrderDetail';

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

function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>{children}</AdminLayout>
    </AdminGuard>
  );
}

function StoreRouter() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/category/:slug" component={Category} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/cart" component={Cart} />
      <Route path="/my-orders/:orderNumber" component={OrderDetail} />
      <Route path="/my-orders" component={MyOrders} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreSettingsProvider>
        <ThemeApplier />
        <CustomerAuthProvider>
          <AdminAuthProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Switch>
                  {/* Admin Login — no guard needed */}
                <Route path="/admin/login" component={AdminLogin} />

                {/* Admin pages — order matters: more specific first */}
                <Route path="/admin/orders">
                  <AdminPage><AdminOrders /></AdminPage>
                </Route>
                <Route path="/admin/customers">
                  <AdminPage><AdminCustomers /></AdminPage>
                </Route>
                <Route path="/admin/products">
                  <AdminPage><AdminProducts /></AdminPage>
                </Route>
                <Route path="/admin/categories">
                  <AdminPage><AdminCategories /></AdminPage>
                </Route>
                <Route path="/admin/discounts">
                  <AdminPage><AdminDiscounts /></AdminPage>
                </Route>
                <Route path="/admin/reviews">
                  <AdminPage><AdminReviews /></AdminPage>
                </Route>
                <Route path="/admin/analytics">
                  <AdminPage><AdminAnalytics /></AdminPage>
                </Route>
                <Route path="/admin/finance">
                  <AdminPage><AdminFinance /></AdminPage>
                </Route>
                <Route path="/admin/settings">
                  <AdminPage><AdminSettings /></AdminPage>
                </Route>
                <Route path="/admin">
                  <AdminPage><AdminDashboard /></AdminPage>
                </Route>

                {/* Store */}
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
        </CustomerAuthProvider>
      </StoreSettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
