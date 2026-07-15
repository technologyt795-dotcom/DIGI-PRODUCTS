import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { setAuthTokenGetter } from '@workspace/api-client-react';

const STORAGE_KEY = 'my-store-admin-token';

interface AdminAuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY)
  );

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem(STORAGE_KEY));
  }, []);

  const login = (newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  return (
    <AdminAuthContext.Provider
      value={{ token, isAuthenticated: !!token, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
