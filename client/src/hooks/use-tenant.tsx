import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TenantInfo {
  id: string | null;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
}

interface TenantContextType {
  tenant: TenantInfo | null;
  isLoading: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  refreshTenant: async () => {},
});

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTenant = async () => {
    try {
      const response = await fetch('/api/tenant');
      if (response.ok) {
        const data = await response.json();
        setTenant(data);
        if (data.primaryColor) {
          document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        }
        if (data.secondaryColor) {
          document.documentElement.style.setProperty('--secondary-color', data.secondaryColor);
        }
      }
    } catch (error) {
      console.error('Failed to fetch tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, isLoading, refreshTenant: fetchTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
