import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

const STORAGE_KEY = 'my-store-customer-token';
const ADMIN_STORAGE_KEY = 'my-store-admin-token';
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '') + '/api';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // add any other fields as needed
}

interface CustomerAuthContextType {
  token: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, customer: Customer) => void;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomer = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`${BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Unauthorized');
        }

        const data = await res.json();
        setCustomer(data);
      } catch (error) {
        localStorage.removeItem(STORAGE_KEY);
        setToken(null);
        setCustomer(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [token]);

  const login = (newToken: string, newCustomer: Customer) => {
    localStorage.removeItem(ADMIN_STORAGE_KEY); // لا يمكن أن يكون أدمن وعميل في نفس الوقت
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setCustomer(newCustomer);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        token,
        customer,
        isAuthenticated: !!token && !!customer,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
