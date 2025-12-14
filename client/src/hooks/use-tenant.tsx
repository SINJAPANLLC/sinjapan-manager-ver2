import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export const ALL_FEATURES = [
  { id: 'ai', label: 'AI機能', description: 'AI会話、画像生成、動画生成、SEO記事生成など' },
  { id: 'employees', label: 'HR Hub', description: '従業員管理、給与情報' },
  { id: 'agency', label: '代理店', description: '代理店売上追跡' },
  { id: 'clients', label: 'クライアント', description: 'クライアント管理' },
  { id: 'financials', label: 'PL BS CF', description: '財務諸表' },
  { id: 'business', label: '事業管理', description: '事業・売上/経費管理' },
  { id: 'square', label: 'Square決済', description: 'Square決済連携' },
] as const;

export type FeatureId = typeof ALL_FEATURES[number]['id'];

interface TenantInfo {
  id: string | null;
  name: string;
  slug: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  enabledFeatures: FeatureId[];
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
