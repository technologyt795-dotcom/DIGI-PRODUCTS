import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Layout } from '@/components/layout/Layout';
import { CartProvider } from '@/hooks/use-cart';
import { AdminAuthProvider } from '@/hooks/use-admin-auth';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Pages
import Home from '@/pages/Home';
import Products from '@/pages/Products';
import Category from '@/pages/Category';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import AdminLogin from '@/pages/admin/AdminLogin';
import AdminProducts from '@/pages/admin/AdminProducts';
import AdminCategories from '@/pages/admin/AdminCategories';

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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>
        <CartProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Switch>
              <Route path="/admin/login" component={AdminLogin} />
              <Route path="/admin">
                <AdminGuard>
                  <AdminLayout>
                    <AdminProducts />
                  </AdminLayout>
                </AdminGuard>
              </Route>
              <Route path="/admin/categories">
                <AdminGuard>
                  <AdminLayout>
                    <AdminCategories />
                  </AdminLayout>
                </AdminGuard>
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
    </QueryClientProvider>
  );
}

export default App;
