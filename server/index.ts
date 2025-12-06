import express from 'express';
import session from 'express-session';
import createMemoryStore from 'memorystore';
import { registerRoutes } from './routes';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const MemoryStore = createMemoryStore(session);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'sin-japan-manager-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

registerRoutes(app);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist/public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/public/index.html'));
  });
}

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
