import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { companies } from '../shared/schema';
import { eq } from 'drizzle-orm';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantInfo;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    companyId?: string;
    companySlug?: string;
  }
}

const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'mail', 'ftp'];
const ROOT_DOMAIN = 'sinjapan-manager.com';

export function extractSlugFromHost(host: string): string | null {
  if (!host) return null;
  
  const hostWithoutPort = host.split(':')[0];
  
  if (hostWithoutPort === ROOT_DOMAIN || hostWithoutPort === `www.${ROOT_DOMAIN}`) {
    return null;
  }
  
  if (hostWithoutPort.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostWithoutPort.replace(`.${ROOT_DOMAIN}`, '');
    if (!RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
      return subdomain.toLowerCase();
    }
  }
  
  if (hostWithoutPort.includes('replit') || hostWithoutPort === 'localhost') {
    return null;
  }
  
  return null;
}

export async function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const host = req.get('host') || '';
    const slug = extractSlugFromHost(host);
    
    // Only set tenant from subdomain - main domain should see all data
    if (slug) {
      const company = await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);
      
      if (company.length > 0) {
        req.tenant = {
          id: company[0].id,
          name: company[0].name,
          slug: company[0].slug || slug,
          logoUrl: company[0].logoUrl,
          primaryColor: company[0].primaryColor,
          secondaryColor: company[0].secondaryColor,
        };
      }
    }
    
    // DO NOT set tenant from session for main domain
    // Main domain (no subdomain) = super admin view that sees all data
    // req.tenant stays undefined for main domain
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  if (!req.tenant && !req.session?.companyId) {
    return res.status(400).json({ error: 'Tenant not found' });
  }
  next();
}

export function getCompanyId(req: Request): string | null {
  // If there's a tenant from subdomain, use that
  if (req.tenant?.id) {
    return req.tenant.id;
  }
  
  // Check if we're on the main domain (no subdomain)
  const host = req.get('host') || '';
  const slug = extractSlugFromHost(host);
  
  // Main domain (no subdomain) = super admin view, return null to see all data
  if (!slug) {
    return null;
  }
  
  // Only use session companyId for subdomain access
  return req.session?.companyId || null;
}
