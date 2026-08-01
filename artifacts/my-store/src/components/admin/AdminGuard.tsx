import { ReactNode, useEffect, useState } from 'react';
import { Redirect } from 'wouter';
import { useAdminAuth } from '@/hooks/use-admin-auth';

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, token, logout } = useAdminAuth();
  const [verified, setVerified] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setVerified(false);
      return;
    }

    fetch('/api/admin/verify', {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.ok) {
        setVerified(true);
      } else {
        logout();
        setVerified(false);
      }
    }).catch(() => {
      setVerified(false);
    });
  }, [token]);

  if (verified === null) return null; // جاري التحقق
  if (!verified) return <Redirect to="/admin/login" />;

  return <>{children}</>;
}
