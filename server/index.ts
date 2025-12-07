import express from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { registerRoutes } from './routes';
import { tenantMiddleware } from './tenant';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MemoryStore = createMemoryStore(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'sinjapan-manager.com';
const cookieDomain = process.env.NODE_ENV === 'production' ? `.${ROOT_DOMAIN}` : undefined;

app.use(session({
  secret: process.env.SESSION_SECRET || 'sin-japan-manager-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    domain: cookieDomain,
  }
}));

app.use(tenantMiddleware);

registerRoutes(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  // Catch-all for SPA, but exclude API routes and public pages
  app.get('*', (req, res, next) => {
    const publicPaths = ['/articles/', '/sitemap.xml', '/rss.xml', '/robots.txt'];
    // Skip if it's a public page (handled by routes.ts SSR)
    if (publicPaths.some(p => req.path.startsWith(p) || req.path === p.replace('/', ''))) {
      return next();
    }
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
