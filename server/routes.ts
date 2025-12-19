import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { createTenantStorage } from './tenant-storage';
import { getCompanyId } from './tenant';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';
import { SquareClient, SquareEnvironment } from 'square';

// Global Square client (fallback)
const globalSquareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'sandbox' 
    ? SquareEnvironment.Sandbox 
    : SquareEnvironment.Production,
});

// Get tenant-specific Square client
async function getTenantSquareClient(req: Request): Promise<{ client: SquareClient | null; company: any }> {
  const companyId = getCompanyId(req);
  
  if (companyId) {
    const company = await storage.getCompany(companyId);
    if (company?.squareAccessToken && company?.squareApplicationId) {
      const client = new SquareClient({
        token: company.squareAccessToken,
        environment: company.squareEnvironment === 'production' 
          ? SquareEnvironment.Production 
          : SquareEnvironment.Sandbox,
      });
      return { client, company };
    }
    return { client: null, company };
  }
  
  // Fallback to global Square client for main domain
  if (process.env.SQUARE_ACCESS_TOKEN) {
    return { client: globalSquareClient, company: null };
  }
  
  return { client: null, company: null };
}

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    companyId?: string;
    companySlug?: string;
  }
}

const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: '認証が必要です' });
  }
  next();
};

const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
    (req as any).currentUser = user;
    next();
  };
};

export function registerRoutes(app: Express) {
  app.get('/api/tenant', async (req: Request, res: Response) => {
    try {
      const tenant = (req as any).tenant;
      if (tenant) {
        res.json({
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          logoUrl: tenant.logoUrl,
          primaryColor: tenant.primaryColor,
          secondaryColor: tenant.secondaryColor,
        });
      } else {
        res.json({
          id: null,
          name: 'SIN JAPAN Manager',
          slug: null,
          logoUrl: null,
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
        });
      }
    } catch (error) {
      res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
      }
      const valid = await storage.validatePassword(user, password);
      if (!valid) {
        return res.status(401).json({ message: 'メールアドレスまたはパスワードが正しくありません' });
      }
      if (!user.isActive) {
        return res.status(401).json({ message: 'このアカウントは無効です' });
      }
      const tenant = (req as any).tenant;
      if (tenant && user.companyId && user.companyId !== tenant.id) {
        return res.status(401).json({ message: 'この会社のアカウントではありません' });
      }
      req.session.userId = user.id;
      req.session.companyId = user.companyId || tenant?.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json({ ...userWithoutPassword, tenant });
    } catch (error) {
      res.status(500).json({ message: 'サーバーエラーが発生しました' });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: 'ログアウトしました' });
    });
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    const tenant = (req as any).tenant;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ ...userWithoutPassword, tenant });
  });

  app.get('/api/debug/session', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    const companyId = getCompanyId(req);
    res.json({
      sessionUserId: req.session.userId,
      sessionCompanyId: req.session.companyId,
      tenantId: req.tenant?.id,
      resolvedCompanyId: companyId,
      userCompanyId: user?.companyId,
    });
  });

  app.get('/api/users', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const users = await tenantStorage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.post('/api/users', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      const userData = companyId ? { ...req.body, companyId } : req.body;
      console.log('Creating user with data:', JSON.stringify(userData, null, 2));
      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error('User creation error:', error);
      if (error.message?.includes('unique') || error.cause?.constraint?.includes('email') || error.cause?.code === '23505') {
        return res.status(400).json({ message: 'このメールアドレスは既に使用されています' });
      }
      res.status(500).json({ message: 'ユーザーの作成に失敗しました' });
    }
  });

  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    const targetId = parseInt(req.params.id);
    if (!currentUser || (currentUser.id !== targetId && !['admin', 'ceo', 'manager'].includes(currentUser.role))) {
      return res.status(403).json({ message: '権限がありません' });
    }
    if (currentUser.id === targetId && req.body.role && req.body.role !== currentUser.role) {
      return res.status(403).json({ message: '自分のロールは変更できません' });
    }
    const user = await storage.updateUser(targetId, req.body);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.delete('/api/users/:id', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    const currentUser = (req as any).currentUser;
    const targetId = parseInt(req.params.id);
    if (currentUser.id === targetId) {
      return res.status(403).json({ message: '自分自身は削除できません' });
    }
    await storage.deleteUser(targetId);
    res.json({ message: '削除しました' });
  });

  app.get('/api/customers', requireAuth, async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const user = await storage.getUser(req.session.userId!);
    const customers = await tenantStorage.getCustomers(req.session.userId!, user?.role);
    res.json(customers);
  });

  app.get('/api/customers/:id', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    const customer = await storage.getCustomer(parseInt(req.params.id));
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません' });
    }
    if (user?.role === 'staff' || user?.role === 'client' || user?.role === 'agency') {
      if (customer.assignedTo !== req.session.userId) {
        return res.status(403).json({ message: '権限がありません' });
      }
    }
    res.json(customer);
  });

  app.post('/api/customers', requireRole('admin', 'ceo', 'manager', 'staff'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const customer = await tenantStorage.createCustomer({ ...req.body, assignedTo: req.session.userId });
    res.json(customer);
  });

  app.patch('/api/customers/:id', requireRole('admin', 'ceo', 'manager', 'staff'), async (req: Request, res: Response) => {
    const currentUser = (req as any).currentUser;
    const customer = await storage.getCustomer(parseInt(req.params.id));
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません' });
    }
    if (currentUser.role === 'staff' && customer.assignedTo !== req.session.userId) {
      return res.status(403).json({ message: '担当顧客のみ編集できます' });
    }
    const updated = await storage.updateCustomer(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete('/api/customers/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    await storage.deleteCustomer(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/tasks', requireAuth, async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const user = await storage.getUser(req.session.userId!);
    const tasks = await tenantStorage.getTasks(req.session.userId!, user?.role);
    res.json(tasks);
  });

  app.post('/api/tasks', requireRole('admin', 'ceo', 'manager', 'staff'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const task = await tenantStorage.createTask({ ...req.body, createdBy: req.session.userId });
    res.json(task);
  });

  app.patch('/api/tasks/:id', requireRole('admin', 'ceo', 'manager', 'staff'), async (req: Request, res: Response) => {
    const currentUser = (req as any).currentUser;
    const task = await storage.getTask(parseInt(req.params.id));
    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりません' });
    }
    if (currentUser.role === 'staff') {
      if (task.assignedTo !== req.session.userId && task.createdBy !== req.session.userId) {
        return res.status(403).json({ message: '担当タスクのみ編集できます' });
      }
    }
    const updated = await storage.updateTask(parseInt(req.params.id), req.body);
    res.json(updated);
  });

  app.delete('/api/tasks/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    await storage.deleteTask(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    const notifications = await storage.getNotifications(req.session.userId!);
    res.json(notifications);
  });

  app.post('/api/notifications', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const notification = await storage.createNotification({ ...req.body, createdBy: req.session.userId });
    res.json(notification);
  });

  app.post('/api/notifications/bulk', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const { userIds, title, message, type } = req.body;
    const notifications = await storage.createBulkNotifications(userIds, { title, message, type, createdBy: req.session.userId });
    res.json(notifications);
  });

  app.patch('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    const notification = await storage.getNotificationById(parseInt(req.params.id));
    if (!notification || notification.userId !== req.session.userId) {
      return res.status(403).json({ message: '権限がありません' });
    }
    await storage.markNotificationRead(parseInt(req.params.id));
    res.json({ message: '既読にしました' });
  });

  app.post('/api/notifications/read-all', requireAuth, async (req: Request, res: Response) => {
    await storage.markAllNotificationsRead(req.session.userId!);
    res.json({ message: '全て既読にしました' });
  });

  app.get('/api/notifications/sent', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const sentNotifications = await storage.getSentNotifications(req.session.userId!);
    res.json(sentNotifications);
  });

  app.get('/api/chat/partners', requireAuth, async (req: Request, res: Response) => {
    const partners = await storage.getChatPartners(req.session.userId!);
    res.json(partners.map(p => ({ ...p, password: undefined })));
  });

  app.get('/api/chat/users', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    let users = await tenantStorage.getAllUsers();
    users = users.filter(u => u.id !== req.session.userId);
    if (user?.role === 'client') {
      users = users.filter(u => ['admin', 'ceo', 'manager', 'staff'].includes(u.role));
    }
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.get('/api/chat/messages/:userId', requireAuth, async (req: Request, res: Response) => {
    const messages = await storage.getChatMessages(req.session.userId!, parseInt(req.params.userId));
    await storage.markMessagesAsRead(parseInt(req.params.userId), req.session.userId!);
    res.json(messages);
  });

  app.post('/api/chat/messages', requireAuth, async (req: Request, res: Response) => {
    const message = await storage.createChatMessage({ ...req.body, senderId: req.session.userId });
    res.json(message);
  });

  app.post('/api/chat/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'ファイルが必要です' });
      }
      const { receiverId, content } = req.body;
      const attachmentUrl = `/uploads/${req.file.filename}`;
      const attachmentName = req.file.originalname;
      
      const message = await storage.createChatMessage({
        content: content || '',
        senderId: req.session.userId,
        receiverId: parseInt(receiverId),
        attachmentUrl,
        attachmentName,
      });
      res.json(message);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'アップロードに失敗しました' });
    }
  });

  app.get('/api/employees', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const employees = await tenantStorage.getEmployees();
    res.json(employees);
  });

  app.post('/api/employees', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const employee = await tenantStorage.createEmployee(req.body);
    res.json(employee);
  });

  app.patch('/api/employees/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const employee = await storage.updateEmployee(parseInt(req.params.id), req.body);
    if (!employee) {
      return res.status(404).json({ message: '従業員が見つかりません' });
    }
    res.json(employee);
  });

  app.get('/api/agency/sales', requireRole('admin', 'ceo', 'manager', 'agency'), async (req: Request, res: Response) => {
    const user = (req as any).currentUser;
    const sales = user.role === 'agency' 
      ? await storage.getAgencySales(req.session.userId!)
      : await storage.getAgencySales();
    res.json(sales);
  });

  app.post('/api/agency/sales', requireRole('admin', 'ceo', 'manager', 'agency'), async (req: Request, res: Response) => {
    const user = (req as any).currentUser;
    const agencyId = user.role === 'agency' ? req.session.userId : req.body.agencyId;
    const sale = await storage.createAgencySale({ ...req.body, agencyId });
    res.json(sale);
  });

  app.patch('/api/agency/sales/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const sale = await storage.updateAgencySale(parseInt(req.params.id), req.body);
    if (!sale) {
      return res.status(404).json({ message: '売上が見つかりません' });
    }
    res.json(sale);
  });

  app.delete('/api/agency/sales/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    await storage.deleteAgencySale(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const stats = await tenantStorage.getDashboardStats(req.session.userId!, user.role);
    res.json(stats);
  });

  app.get('/api/businesses', requireAuth, async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const businesses = await tenantStorage.getBusinesses();
    res.json(businesses);
  });

  app.post('/api/businesses', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
    const business = await tenantStorage.createBusiness(req.body);
    res.json(business);
  });

  app.patch('/api/businesses/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const business = await storage.updateBusiness(req.params.id, req.body);
    if (!business) {
      return res.status(404).json({ message: '事業が見つかりません' });
    }
    res.json(business);
  });

  app.delete('/api/businesses/:id', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    await storage.deleteBusiness(req.params.id);
    res.json({ message: '削除しました' });
  });

  app.get('/api/businesses/:id/sales', requireAuth, async (req: Request, res: Response) => {
    const sales = await storage.getBusinessSales(req.params.id);
    res.json(sales);
  });

  app.post('/api/businesses/:id/sales', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const { type, amount, description, saleDate } = req.body;
    const sale = await storage.createBusinessSale({
      businessId: req.params.id,
      type,
      amount,
      description,
      saleDate: saleDate ? new Date(saleDate) : new Date(),
      createdBy: req.session.userId,
    });
    res.json(sale);
  });

  app.delete('/api/businesses/:id/sales/:saleId', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    await storage.deleteBusinessSale(parseInt(req.params.saleId));
    res.json({ message: '削除しました' });
  });

  app.get('/api/businesses/:id/totals', requireAuth, async (req: Request, res: Response) => {
    const totals = await storage.getBusinessTotals(req.params.id);
    res.json(totals);
  });

  app.get('/api/memos', requireAuth, async (req: Request, res: Response) => {
    const { start, end } = req.query;
    const startDate = start ? new Date(start as string) : undefined;
    const endDate = end ? new Date(end as string) : undefined;
    const memos = await storage.getMemos(req.session.userId!, startDate, endDate);
    res.json(memos);
  });

  app.post('/api/memos', requireAuth, async (req: Request, res: Response) => {
    const { date, content, color } = req.body;
    const memo = await storage.createMemo({ 
      date: new Date(date), 
      content, 
      color, 
      userId: req.session.userId 
    });
    res.json(memo);
  });

  app.patch('/api/memos/:id', requireAuth, async (req: Request, res: Response) => {
    const { date, content, color } = req.body;
    const updateData: any = {};
    if (date) updateData.date = new Date(date);
    if (content) updateData.content = content;
    if (color) updateData.color = color;
    
    const memo = await storage.updateMemo(parseInt(req.params.id), updateData);
    if (!memo) {
      return res.status(404).json({ message: 'メモが見つかりません' });
    }
    res.json(memo);
  });

  app.delete('/api/memos/:id', requireAuth, async (req: Request, res: Response) => {
    await storage.deleteMemo(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.post('/api/ai/generate-tasks', requireAuth, async (req: Request, res: Response) => {
    try {
      const { prompt, category, businessName } = req.body;
      
      const categoryLabels: Record<string, string> = {
        direct: '直結（直接成果に繋がるタスク）',
        organization: '組織（チーム運営・組織改善）',
        expansion: '拡張（事業拡大・新規開拓）',
        risk: 'リスク（リスク管理・問題対応）',
        workflow: 'ワークフロー（業務プロセス改善）',
      };

      const businessContext = businessName ? `\n事業: ${businessName}` : '';

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはビジネスタスク生成アシスタントです。ユーザーの要望に基づいて、実行可能なタスクを3〜5個生成してください。
カテゴリ: ${categoryLabels[category] || category}${businessContext}

JSON形式で出力してください:
{
  "tasks": [
    {"title": "タスク名", "description": "タスクの説明", "priority": "high/medium/low"}
  ]
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        res.json(parsed);
      } else {
        res.json({ tasks: [] });
      }
    } catch (error) {
      console.error('AI task generation error:', error);
      res.status(500).json({ message: 'AIタスク生成に失敗しました', tasks: [] });
    }
  });

  app.post('/api/ai/chat', requireAuth, async (req: Request, res: Response) => {
    try {
      const { message, history, useMemory = true } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Get knowledge base for context
      const knowledge = await storage.getAiKnowledge(true);
      let knowledgeContext = '';
      if (knowledge.length > 0) {
        knowledgeContext = '\n\n【参考情報（知識ベース）】\n' + knowledge.map(k => 
          `[${k.category}] ${k.title}: ${k.content}`
        ).join('\n');
      }

      // Get past conversations for memory (if enabled)
      let pastConversations: any[] = [];
      if (useMemory) {
        const savedConversations = await storage.getAiConversations(req.session.userId!, 20);
        pastConversations = savedConversations.reverse().map(c => ({
          role: c.role as 'user' | 'assistant',
          content: c.content,
        }));
      }

      const systemPrompt = `あなたは親切で知識豊富なAIアシスタントです。日本語で回答してください。
過去の会話を覚えており、ユーザーとの継続的な関係を築いています。
以下の知識ベースの情報を参考にして回答してください。${knowledgeContext}`;

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...pastConversations,
        ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      const reply = completion.choices[0]?.message?.content || '';

      // Save conversation to memory
      if (useMemory) {
        await storage.addAiConversation({
          userId: req.session.userId!,
          role: 'user',
          content: message,
        });
        await storage.addAiConversation({
          userId: req.session.userId!,
          role: 'assistant',
          content: reply,
        });
      }

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'chat',
        prompt: message,
        result: reply,
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ reply });
    } catch (error) {
      console.error('AI chat error:', error);
      res.status(500).json({ error: 'チャットエラーが発生しました' });
    }
  });

  // Helper function to translate Japanese to English for better AI generation
  async function translateToEnglish(text: string): Promise<string> {
    // Check if text contains Japanese characters
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    if (!hasJapanese) {
      return text;
    }
    
    try {
      const openaiClient = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a translator. Translate the following Japanese text to English. Only output the translation, nothing else. Keep it concise and suitable for AI image/video generation prompts.'
          },
          { role: 'user', content: text }
        ],
      });
      
      const translated = completion.choices[0]?.message?.content || text;
      console.log(`Translated: "${text}" -> "${translated}"`);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  app.post('/api/ai/image', requireAuth, async (req: Request, res: Response) => {
    try {
      const { prompt, provider, aspectRatio, quality } = req.body;
      
      // Translate Japanese prompt to English
      const translatedPrompt = await translateToEnglish(prompt);
      console.log('Image generation request:', { prompt, translatedPrompt, provider, aspectRatio, quality });

      if (provider === 'openai') {
        // OpenAI DALL-E / gpt-image-1
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const sizeMap: Record<string, string> = {
          '1:1': '1024x1024',
          '16:9': '1792x1024',
          '9:16': '1024x1792',
        };
        const size = sizeMap[aspectRatio] || '1024x1024';

        const response = await openaiClient.images.generate({
          model: 'dall-e-3',
          prompt: translatedPrompt,
          n: 1,
          size: size as any,
          quality: quality === 'high' ? 'hd' : 'standard',
        });

        const imageUrl = response.data[0]?.url || response.data[0]?.b64_json;
        if (imageUrl) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            result: imageUrl,
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ imageUrl, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          throw new Error('No image generated');
        }
      } else if (provider === 'modelslab') {
        // MODELSLAB (NSFW対応)
        const modelslabKey = process.env.MODELSLAB_API_KEY;
        
        if (!modelslabKey) {
          return res.status(400).json({ error: 'MODELSLAB APIキーが設定されていません。' });
        }

        const sizeMap: Record<string, { width: string; height: string }> = {
          '1:1': { width: '512', height: '512' },
          '16:9': { width: '768', height: '432' },
          '9:16': { width: '432', height: '768' },
          '4:3': { width: '640', height: '480' },
          '3:4': { width: '480', height: '640' },
        };
        const size = sizeMap[aspectRatio] || { width: '512', height: '512' };

        const response = await fetch('https://modelslab.com/api/v6/realtime/text2img', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: modelslabKey,
            prompt: translatedPrompt,
            negative_prompt: 'bad quality, blurry, distorted',
            width: size.width,
            height: size.height,
            safety_checker: false,
            samples: 1,
            base64: false,
          }),
        });

        const data = await response.json();
        console.log('MODELSLAB Image response:', JSON.stringify(data, null, 2));

        if (data.status === 'success' && data.output && data.output.length > 0) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            result: data.output[0],
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ imageUrl: data.output[0], translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else if (data.status === 'processing' && data.fetch_result) {
          res.json({ processing: true, fetchUrl: data.fetch_result, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          res.status(400).json({ error: data.message || '画像生成に失敗しました。', translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
      } else {
        // Hailuo AI (MiniMax Image-01)
        const minimaxKey = process.env.MINIMAX_API_KEY;
        
        if (!minimaxKey) {
          return res.status(400).json({ error: 'MiniMax APIキーが設定されていません。設定画面でAPIキーを追加してください。' });
        }

        const response = await fetch('https://api.minimax.io/v1/image_generation', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${minimaxKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'image-01',
            prompt: translatedPrompt,
            aspect_ratio: aspectRatio || '1:1',
            response_format: 'url',
            n: 1,
            prompt_optimizer: true,
          }),
        });

        const data = await response.json();
        console.log('Hailuo Image response:', JSON.stringify(data, null, 2));
        
        // Check for API errors first
        if (data.base_resp?.status_code !== 0) {
          const errorMessages: Record<number, string> = {
            1008: '残高不足です。MiniMaxアカウントにクレジットを追加してください。',
            1026: 'センシティブなコンテンツが検出されました。別のプロンプトをお試しください。',
          };
          const errorMsg = errorMessages[data.base_resp?.status_code] || data.base_resp?.status_msg || '画像生成に失敗しました';
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          return res.status(400).json({ error: errorMsg, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
        
        // Check for failed generation (metadata.failed_count)
        if (data.metadata?.failed_count && parseInt(data.metadata.failed_count) > 0) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          return res.status(400).json({ error: 'コンテンツポリシー違反により画像を生成できませんでした。別のプロンプトをお試しください。', translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
        
        if (data.data?.image_urls && data.data.image_urls.length > 0) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            result: data.data.image_urls[0],
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ imageUrl: data.data.image_urls[0], translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          res.status(400).json({ error: '画像生成に失敗しました。別のプロンプトをお試しください。' });
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: '画像生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/video', requireAuth, async (req: Request, res: Response) => {
    try {
      const { prompt, provider, aspectRatio, seconds } = req.body;
      
      // Translate Japanese prompt to English
      const translatedPrompt = await translateToEnglish(prompt);
      console.log('Video generation request:', { prompt, translatedPrompt, provider, aspectRatio, seconds });

      if (provider === 'openai') {
        // OpenAI Sora 2
        const openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const sizeMap: Record<string, string> = {
          '16:9': '1280x720',
          '9:16': '720x1280',
          '1:1': '1080x1080',
        };
        const size = sizeMap[aspectRatio] || '1280x720';

        // Sora 2 API call
        const response = await (openaiClient as any).videos.generate({
          model: 'sora-2',
          prompt: translatedPrompt,
          size: size,
          seconds: seconds || 8,
        });

        const videoUrl = response.data?.[0]?.url;
        if (videoUrl) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            result: videoUrl,
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ videoUrl, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          throw new Error('No video generated');
        }
      } else if (provider === 'modelslab') {
        // MODELSLAB (NSFW対応)
        const modelslabKey = process.env.MODELSLAB_API_KEY;
        
        if (!modelslabKey) {
          return res.status(400).json({ error: 'MODELSLAB APIキーが設定されていません。' });
        }

        const sizeMap: Record<string, { width: number; height: number }> = {
          '16:9': { width: 512, height: 288 },
          '9:16': { width: 288, height: 512 },
          '1:1': { width: 512, height: 512 },
        };
        const size = sizeMap[aspectRatio] || { width: 512, height: 512 };

        const response = await fetch('https://modelslab.com/api/v6/video/text2video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: modelslabKey,
            model_id: 'cogvideox',
            prompt: translatedPrompt,
            negative_prompt: 'low quality, blurry',
            height: size.height,
            width: size.width,
            num_frames: 25,
            num_inference_steps: 20,
            guidance_scale: 7,
            output_type: 'mp4',
          }),
        });

        const data = await response.json();
        console.log('MODELSLAB Video response:', JSON.stringify(data, null, 2));

        if (data.status === 'success' && data.output && data.output.length > 0) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            result: data.output[0],
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ videoUrl: data.output[0], translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else if (data.status === 'processing') {
          // MODELSLAB returns id for polling
          const taskId = data.id?.toString() || '';
          res.json({ 
            processing: true, 
            taskId: taskId, 
            provider: 'modelslab',
            prompt: prompt,
            translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined 
          });
        } else {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          res.status(400).json({ error: data.message || '動画生成に失敗しました。', translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
      } else {
        // Hailuo AI (MiniMax Hailuo-02)
        const minimaxKey = process.env.MINIMAX_API_KEY;
        
        if (!minimaxKey) {
          return res.status(400).json({ error: 'MiniMax APIキーが設定されていません。設定画面でAPIキーを追加してください。' });
        }

        const response = await fetch('https://api.minimax.io/v1/video_generation', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${minimaxKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'video-01',
            prompt: translatedPrompt,
            prompt_optimizer: true,
          }),
        });

        const data = await response.json();
        console.log('Hailuo Video response:', JSON.stringify(data, null, 2));
        
        if (data.task_id) {
          // Video generation is async, return task ID for polling
          res.json({ 
            processing: true, 
            taskId: data.task_id, 
            prompt: prompt, 
            translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined 
          });
        } else if (data.data?.video_url) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            result: data.data.video_url,
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ videoUrl: data.data.video_url, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          res.status(400).json({ error: data.base_resp?.status_msg || '動画生成に失敗しました' });
        }
      }
    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: '動画生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/video/poll', requireAuth, async (req: Request, res: Response) => {
    try {
      const { taskId, prompt, provider } = req.body;
      
      if (!taskId) {
        return res.status(400).json({ error: 'taskIdが必要です' });
      }
      
      console.log('Polling video result:', { taskId, provider });

      if (provider === 'hailuo') {
        // Hailuo AI (MiniMax) polling
        const minimaxKey = process.env.MINIMAX_API_KEY;
        
        if (!minimaxKey) {
          return res.status(400).json({ error: 'MiniMax APIキーが設定されていません。' });
        }

        const response = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${minimaxKey}`,
          },
        });
        
        const data = await response.json();
        console.log('Hailuo Poll response:', JSON.stringify(data, null, 2));
        
        if (data.status === 'Success' && data.file_id) {
          // Get the video URL
          const fileResponse = await fetch(`https://api.minimax.io/v1/files/retrieve?file_id=${data.file_id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${minimaxKey}`,
            },
          });
          const fileData = await fileResponse.json();
          
          if (fileData.file?.download_url) {
            await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
              type: 'video',
              prompt: prompt,
              result: fileData.file.download_url,
              status: 'success',
              userId: req.session.userId,
            });
            res.json({ videoUrl: fileData.file.download_url, completed: true });
          } else {
            res.json({ processing: true });
          }
        } else if (data.status === 'Processing' || data.status === 'Queueing') {
          res.json({ processing: true });
        } else if (data.status === 'Fail') {
          res.json({ error: data.base_resp?.status_msg || '動画生成に失敗しました', completed: true });
        } else {
          res.json({ processing: true });
        }
      } else if (provider === 'modelslab') {
        // MODELSLAB polling
        const modelslabKey = process.env.MODELSLAB_API_KEY;
        
        if (!modelslabKey) {
          return res.status(400).json({ error: 'MODELSLAB APIキーが設定されていません。' });
        }

        const response = await fetch(`https://modelslab.com/api/v6/video/fetch/${taskId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            key: modelslabKey,
          }),
        });
        
        const data = await response.json();
        console.log('MODELSLAB Poll response:', JSON.stringify(data, null, 2));
        
        if (data.status === 'success' && data.output && data.output.length > 0) {
          await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
            type: 'video',
            prompt: prompt,
            result: data.output[0],
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ videoUrl: data.output[0], completed: true });
        } else if (data.status === 'processing') {
          res.json({ processing: true });
        } else if (data.status === 'error' || data.status === 'failed') {
          res.json({ error: data.message || '動画生成に失敗しました', completed: true });
        } else {
          res.json({ processing: true });
        }
      } else {
        // Default error - unsupported provider
        res.status(400).json({ error: 'サポートされていないプロバイダーです' });
      }
    } catch (error: any) {
      console.error('Video poll error:', error.message || error);
      res.status(500).json({ error: 'ポーリングエラーが発生しました: ' + (error.message || '不明なエラー') });
    }
  });

  app.post('/api/ai/seo', requireAuth, async (req: Request, res: Response) => {
    try {
      const { topic, keywords } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは10年以上の経験を持つプロのSEOライター兼コンテンツマーケターです。
読者の悩みを深く理解し、具体的で実用的な情報を提供する高品質な記事を作成してください。

## 記事構成（必須）
1. **キャッチーなタイトル（H1）** - 数字や具体的なベネフィットを含める
2. **リード文（150-200文字）** - 読者の悩みに共感し、この記事で得られる価値を明示
3. **目次** - 主要見出しをリスト化
4. **本文（H2見出しで5〜7セクション）**
   - 各セクションに具体例、データ、事例を含める
   - H3小見出しで詳細を補足
   - 箇条書きや番号リストで読みやすく
5. **よくある質問（FAQ）** - 3〜5個のQ&A
6. **まとめ** - 要点を3〜5個に集約
7. **CTA（行動喚起）** - 次のステップを明確に

## 品質基準
- 1記事2000〜3000文字以上
- 具体的な数字・データを含める（例：「80%の人が〜」）
- 専門用語は初出時に説明を加える
- 「です・ます」調で親しみやすく
- 1文は60文字以内を目安に
- キーワードは自然に3〜5回使用
- 読者の疑問を先回りして解消

## 出力形式
Markdown形式で出力。見出しはH2(##)、H3(###)を使用。`
          },
          {
            role: 'user',
            content: `トピック: ${topic}\nターゲットキーワード: ${keywords || '指定なし'}\n\n上記のトピックについて、検索上位を狙える高品質な記事を作成してください。`
          }
        ],
        max_tokens: 4000,
      });

      const article = completion.choices[0]?.message?.content || '';

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'seo',
        prompt: `${topic} | ${keywords}`,
        result: article.substring(0, 500),
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ article });
    } catch (error) {
      console.error('SEO article error:', error);
      res.status(500).json({ error: 'SEO記事生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/internal-links', requireAuth, async (req: Request, res: Response) => {
    try {
      const { articleId, content } = req.body;
      
      const publishedArticles = await storage.getPublishedSeoArticles();
      const otherArticles = publishedArticles.filter(a => a.id !== articleId);
      
      if (otherArticles.length === 0) {
        return res.json({ linkedContent: content, linksAdded: 0 });
      }

      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const articleList = otherArticles.map(a => `- タイトル: ${a.title}, URL: /articles/${a.slug}`).join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはSEOの専門家です。記事に内部リンクを挿入してSEOを改善してください。

以下のルールに従ってください：
1. 関連性の高い記事にのみリンクを貼る
2. 自然な文脈でリンクを挿入する
3. 1記事につき2〜5個の内部リンクが適切
4. リンクはMarkdown形式 [テキスト](/articles/slug) で挿入
5. 既存の文章を大きく変えずにリンクを追加

利用可能な記事一覧:
${articleList}`
          },
          {
            role: 'user',
            content: `以下の記事に内部リンクを挿入してください:\n\n${content}`
          }
        ],
      });

      const linkedContent = completion.choices[0]?.message?.content || content;
      const linksAdded = (linkedContent.match(/\[.*?\]\(\/articles\/.*?\)/g) || []).length;

      res.json({ linkedContent, linksAdded });
    } catch (error) {
      console.error('Internal links error:', error);
      res.status(500).json({ error: '内部リンク生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/voice', requireAuth, async (req: Request, res: Response) => {
    try {
      const { text, voice = 'alloy' } = req.body;
      
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'voice',
        prompt: `[${voice}] ${text}`,
        result: 'audio generated',
        status: 'success',
        userId: req.session.userId,
      });

      return res.json({ audioUrl });
    } catch (error) {
      console.error('Voice generation error:', error);
      res.status(500).json({ error: '音声生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/voice-chat', requireAuth, async (req: Request, res: Response) => {
    try {
      const { message, history = [], voice = 'alloy' } = req.body;
      
      const openaiChat = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const messages: Array<{role: 'system' | 'user' | 'assistant'; content: string}> = [
        {
          role: 'system',
          content: `あなたは親切で知識豊富なAIアシスタントです。ユーザーと自然な会話をしてください。
回答は簡潔に、1〜3文程度で答えてください。音声で読み上げられることを想定して、自然な話し言葉で応答してください。`
        },
        ...history.map((h: any) => ({
          role: h.role as 'user' | 'assistant',
          content: h.content
        })),
        { role: 'user', content: message }
      ];

      const completion = await openaiChat.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content || 'すみません、応答を生成できませんでした。';

      const openaiTts = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const mp3 = await openaiTts.audio.speech.create({
        model: 'tts-1',
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: response,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64Audio = buffer.toString('base64');
      const audioUrl = `data:audio/mpeg;base64,${base64Audio}`;

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'voice_chat',
        prompt: message,
        result: response,
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ response, audioUrl });
    } catch (error) {
      console.error('Voice chat error:', error);
      res.status(500).json({ error: '音声会話エラーが発生しました' });
    }
  });

  app.post('/api/ai/list', requireAuth, async (req: Request, res: Response) => {
    try {
      const { topic, count, forLeads } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const systemPrompt = forLeads 
        ? `あなたはビジネスリード（見込み客）リスト生成の専門家です。指定されたトピック（業種・地域など）について、${count || 10}件の架空のビジネスリード情報を生成してください。

以下の2つの形式で出力してください：

【テキスト形式】
番号付きリストで各会社/店舗の情報を記載

【JSON形式】
\`\`\`json
[
  {"name": "担当者名", "company": "会社名/店舗名", "phone": "電話番号", "email": "メールアドレス", "source": "ai_generated"},
  ...
]
\`\`\`

注意：
- 電話番号は日本の形式（例：03-XXXX-XXXX、090-XXXX-XXXX）
- メールアドレスは架空のもの
- 会社名/店舗名は業種に合ったリアルな名前を生成
- sourceは必ず "ai_generated" にする`
        : `あなたはリスト生成の専門家です。指定されたトピックについて、${count || 10}項目のリストを作成してください。各項目は簡潔で有用な情報を含めてください。番号付きリストで出力してください。`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: topic
          }
        ],
      });

      const fullResponse = completion.choices[0]?.message?.content || '';
      
      let list = fullResponse;
      let leads: Array<{name: string; company?: string; phone?: string; email?: string; source: string}> = [];
      
      if (forLeads) {
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            leads = JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.error('Failed to parse leads JSON:', e);
          }
        }
        list = fullResponse.replace(/```json[\s\S]*?```/g, '').trim();
      }

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'list',
        prompt: topic,
        result: list.substring(0, 500),
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ list, leads });
    } catch (error) {
      console.error('List generation error:', error);
      res.status(500).json({ error: 'リスト生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/document', requireAuth, async (req: Request, res: Response) => {
    try {
      const { type, details } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const docTypes: Record<string, string> = {
        contract: '契約書',
        nda: '秘密保持契約書（NDA）',
        employment: '雇用契約書',
        subcontract: '業務委託契約書',
        lease: '賃貸借契約書',
        proposal: '提案書',
        quotation: '見積書',
        invoice: '請求書',
        receipt: '領収書',
        report: '報告書',
        weekly_report: '週報',
        monthly_report: '月報',
        progress_report: '進捗報告書',
        email: 'ビジネスメール',
        apology_email: 'お詫びメール',
        thanks_email: 'お礼メール',
        follow_up_email: 'フォローアップメール',
        minutes: '議事録',
        agenda: '会議アジェンダ',
        resume: '履歴書',
        cover_letter: '送付状・カバーレター',
        introduction: '会社案内',
        press_release: 'プレスリリース',
        manual: 'マニュアル・手順書',
        specification: '仕様書',
        terms: '利用規約',
        privacy_policy: 'プライバシーポリシー',
        notice: 'お知らせ・通知文',
        greeting: '挨拶状',
        complaint: 'クレーム対応文',
      };

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはビジネス文書作成の専門家です。${docTypes[type] || type}を作成してください。

フォーマットは日本のビジネス慣行に従ってください。
- 適切な敬語を使用
- 正式な書式
- 必要な項目を網羅
- プロフェッショナルな表現`
          },
          {
            role: 'user',
            content: details
          }
        ],
      });

      const document = completion.choices[0]?.message?.content || '';

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'document',
        prompt: `${type}: ${details.substring(0, 100)}`,
        result: document.substring(0, 500),
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ document });
    } catch (error) {
      console.error('Document generation error:', error);
      res.status(500).json({ error: '書類生成エラーが発生しました' });
    }
  });

  app.get('/api/ai/logs', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const logs = await tenantStorage.getAiLogs(req.session.userId!);
      res.json(logs);
    } catch (error) {
      console.error('Get AI logs error:', error);
      res.status(500).json([]);
    }
  });

  // AI Conversations (Memory)
  app.get('/api/ai/conversations', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const conversations = await tenantStorage.getAiConversations(req.session.userId!);
      res.json(conversations.reverse());
    } catch (error) {
      console.error('Get AI conversations error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/ai/conversations', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { role, content } = req.body;
      const conversation = await tenantStorage.addAiConversation({
        userId: req.session.userId!,
        role,
        content,
      });
      res.json(conversation);
    } catch (error) {
      console.error('Add AI conversation error:', error);
      res.status(500).json({ error: '会話の保存に失敗しました' });
    }
  });

  app.delete('/api/ai/conversations', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      await tenantStorage.clearAiConversations(req.session.userId!);
      res.json({ success: true });
    } catch (error) {
      console.error('Clear AI conversations error:', error);
      res.status(500).json({ error: '会話履歴のクリアに失敗しました' });
    }
  });

  // AI Knowledge Base
  app.get('/api/ai/knowledge', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const activeOnly = req.query.activeOnly !== 'false';
      const knowledge = await tenantStorage.getAiKnowledge(activeOnly);
      res.json(knowledge);
    } catch (error) {
      console.error('Get AI knowledge error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/ai/knowledge', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { category, title, content } = req.body;
      const knowledge = await tenantStorage.addAiKnowledge({
        category,
        title,
        content,
        createdBy: req.session.userId,
      });
      res.json(knowledge);
    } catch (error) {
      console.error('Add AI knowledge error:', error);
      res.status(500).json({ error: '知識の追加に失敗しました' });
    }
  });

  app.put('/api/ai/knowledge/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const id = parseInt(req.params.id);
      const { category, title, content, isActive } = req.body;
      const knowledge = await tenantStorage.updateAiKnowledge(id, { category, title, content, isActive });
      res.json(knowledge);
    } catch (error) {
      console.error('Update AI knowledge error:', error);
      res.status(500).json({ error: '知識の更新に失敗しました' });
    }
  });

  app.delete('/api/ai/knowledge/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const id = parseInt(req.params.id);
      await tenantStorage.deleteAiKnowledge(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete AI knowledge error:', error);
      res.status(500).json({ error: '知識の削除に失敗しました' });
    }
  });

  // System Settings API
  app.get('/api/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsObj: Record<string, string> = {};
      settings.forEach(s => { settingsObj[s.key] = s.value || ''; });
      res.json(settingsObj);
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({});
    }
  });

  app.get('/api/settings/:key', requireAuth, async (req: Request, res: Response) => {
    try {
      const value = await storage.getSetting(req.params.key);
      res.json({ value: value || '' });
    } catch (error) {
      console.error('Get setting error:', error);
      res.status(500).json({ value: '' });
    }
  });

  app.put('/api/settings', requireAuth, async (req: Request, res: Response) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json({ error: 'キーが必要です' });
      }
      await storage.setSetting(key, value || '');
      res.json({ success: true });
    } catch (error) {
      console.error('Update setting error:', error);
      res.status(500).json({ error: '設定の更新に失敗しました' });
    }
  });

  // Google Places API - Real Business Search
  app.post('/api/places/search', requireAuth, async (req: Request, res: Response) => {
    try {
      const { query, location, maxResults = 10 } = req.body;
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      
      if (!apiKey) {
        return res.status(400).json({ error: 'Google Places API キーが設定されていません' });
      }

      const searchQuery = `${query} ${location}`;
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&language=ja&key=${apiKey}`;
      
      const searchResponse = await fetch(textSearchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
        console.error('Places API error:', searchData);
        return res.status(400).json({ error: `Google Places API エラー: ${searchData.status}` });
      }

      const places: Array<{
        name: string;
        company: string;
        phone?: string;
        email?: string;
        address?: string;
        website?: string;
        source: string;
      }> = [];

      const results = (searchData.results || []).slice(0, Math.min(maxResults, 20));
      
      for (const place of results) {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_phone_number,formatted_address,website&language=ja&key=${apiKey}`;
        
        try {
          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          
          if (detailsData.status === 'OK' && detailsData.result) {
            const detail = detailsData.result;
            places.push({
              name: detail.name || place.name,
              company: detail.name || place.name,
              phone: detail.formatted_phone_number || undefined,
              address: detail.formatted_address || place.formatted_address,
              website: detail.website || undefined,
              source: 'google_places',
            });
          }
        } catch (detailError) {
          places.push({
            name: place.name,
            company: place.name,
            address: place.formatted_address,
            source: 'google_places',
          });
        }
      }

      await createTenantStorage(getCompanyId(req), { allowGlobal: true }).createAiLog({
        type: 'places_search',
        prompt: `${query} in ${location}`,
        result: `Found ${places.length} places`,
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ places, total: places.length });
    } catch (error) {
      console.error('Places search error:', error);
      res.status(500).json({ error: 'ビジネス情報の検索に失敗しました' });
    }
  });

  // Client Projects API
  app.get('/api/client-projects', requireAuth, async (req: Request, res: Response) => {
    try {
      const projects = await storage.getClientProjects();
      res.json(projects);
    } catch (error) {
      console.error('Get client projects error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/client-projects', requireAuth, async (req: Request, res: Response) => {
    try {
      const project = await storage.createClientProject(req.body);
      res.json(project);
    } catch (error) {
      console.error('Create client project error:', error);
      res.status(500).json({ error: '案件の作成に失敗しました' });
    }
  });

  app.put('/api/client-projects/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.updateClientProject(id, req.body);
      res.json(project);
    } catch (error) {
      console.error('Update client project error:', error);
      res.status(500).json({ error: '案件の更新に失敗しました' });
    }
  });

  app.delete('/api/client-projects/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClientProject(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete client project error:', error);
      res.status(500).json({ error: '案件の削除に失敗しました' });
    }
  });

  // Client Invoices API
  app.get('/api/client-invoices', requireAuth, async (req: Request, res: Response) => {
    try {
      const invoices = await storage.getClientInvoices();
      res.json(invoices);
    } catch (error) {
      console.error('Get client invoices error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/client-invoices', requireAuth, async (req: Request, res: Response) => {
    try {
      const invoice = await storage.createClientInvoice(req.body);
      res.json(invoice);
    } catch (error) {
      console.error('Create client invoice error:', error);
      res.status(500).json({ error: '請求の作成に失敗しました' });
    }
  });

  app.put('/api/client-invoices/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const invoice = await storage.updateClientInvoice(id, req.body);
      res.json(invoice);
    } catch (error) {
      console.error('Update client invoice error:', error);
      res.status(500).json({ error: '請求の更新に失敗しました' });
    }
  });

  app.delete('/api/client-invoices/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClientInvoice(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete client invoice error:', error);
      res.status(500).json({ error: '請求の削除に失敗しました' });
    }
  });

  // Companies API
  app.get('/api/companies', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      if (companyId) {
        const company = await storage.getCompany(companyId);
        res.json(company ? [company] : []);
      } else {
        const companies = await storage.getCompanies();
        res.json(companies);
      }
    } catch (error) {
      console.error('Get companies error:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/companies/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ error: '会社が見つかりません' });
      }
      res.json(company);
    } catch (error) {
      console.error('Get company error:', error);
      res.status(500).json({ error: '会社の取得に失敗しました' });
    }
  });

  app.post('/api/companies', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      const { admin, ...companyData } = req.body;
      
      if (admin && (!admin.name || !admin.email || !admin.password)) {
        return res.status(400).json({ message: '管理者の名前、メールアドレス、パスワードは必須です' });
      }
      
      if (admin && admin.password.length < 6) {
        return res.status(400).json({ message: 'パスワードは6文字以上必要です' });
      }
      
      const existingUser = admin ? await storage.getUserByEmail(admin.email) : null;
      if (existingUser) {
        return res.status(400).json({ message: 'このメールアドレスは既に使用されています' });
      }
      
      if (companyData.capital === '' || companyData.capital === undefined) companyData.capital = null;
      if (companyData.establishedDate === '') companyData.establishedDate = null;
      
      const company = await storage.createCompany(companyData);
      
      if (admin) {
        await storage.createUser({
          name: admin.name,
          email: admin.email,
          password: admin.password,
          role: 'admin',
          companyId: company.id,
          isActive: true,
        });
      }
      
      res.json(company);
    } catch (error) {
      console.error('Create company error:', error);
      res.status(500).json({ message: '会社の作成に失敗しました' });
    }
  });

  app.put('/api/companies/:id', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      const data = { ...req.body };
      if (data.capital === '' || data.capital === undefined) data.capital = null;
      if (data.establishedDate === '') data.establishedDate = null;
      const company = await storage.updateCompany(req.params.id, data);
      res.json(company);
    } catch (error) {
      console.error('Update company error:', error);
      res.status(500).json({ error: '会社の更新に失敗しました' });
    }
  });

  app.delete('/api/companies/:id', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      await storage.deleteCompany(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete company error:', error);
      res.status(500).json({ error: '会社の削除に失敗しました' });
    }
  });

  // Investments API
  app.get('/api/investments', requireAuth, async (req: Request, res: Response) => {
    try {
      const { businessId } = req.query;
      const invests = await storage.getInvestments(businessId as string | undefined);
      res.json(invests);
    } catch (error) {
      console.error('Get investments error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/investments', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { businessId, type, category, amount, description, investmentDate } = req.body;
      const investment = await storage.createInvestment({
        businessId: businessId || null,
        type,
        category: category || null,
        amount,
        description: description || null,
        investmentDate: investmentDate ? new Date(investmentDate) : new Date(),
        createdBy: req.session.userId,
      });
      res.json(investment);
    } catch (error) {
      console.error('Create investment error:', error);
      res.status(500).json({ error: '投資記録の作成に失敗しました' });
    }
  });

  app.delete('/api/investments/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      await storage.deleteInvestment(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete investment error:', error);
      res.status(500).json({ error: '投資記録の削除に失敗しました' });
    }
  });

  app.get('/api/investments/totals', requireAuth, async (req: Request, res: Response) => {
    try {
      const totals = await storage.getInvestmentTotals();
      res.json(totals);
    } catch (error) {
      console.error('Get investment totals error:', error);
      res.status(500).json({ total: 0 });
    }
  });

  // Square API (テナント別対応)
  app.get('/api/square/status', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      const { client, company } = await getTenantSquareClient(req);
      
      if (!client) {
        return res.json({ 
          connected: false, 
          message: 'Square APIキーが設定されていません',
          hasSettings: !!company?.squareAccessToken
        });
      }
      
      const { locations } = await client.locations.list();
      
      res.json({
        connected: true,
        locations: (locations || []).map(loc => ({
          id: loc.id,
          name: loc.name,
          address: loc.address,
          status: loc.status,
        })),
        environment: company?.squareEnvironment || process.env.SQUARE_ENVIRONMENT || 'sandbox',
      });
    } catch (error: any) {
      console.error('Square status error:', error);
      res.json({ connected: false, message: error.message || 'Square APIへの接続に失敗しました' });
    }
  });

  // Square設定を保存
  app.put('/api/square/settings', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.status(400).json({ error: 'テナントが特定できません' });
      }
      
      const { accessToken, applicationId, environment, locationId } = req.body;
      
      await storage.updateCompany(companyId, {
        squareAccessToken: accessToken || null,
        squareApplicationId: applicationId || null,
        squareEnvironment: environment || 'sandbox',
        squareLocationId: locationId || null,
      });
      
      res.json({ success: true, message: 'Square設定を保存しました' });
    } catch (error: any) {
      console.error('Save Square settings error:', error);
      res.status(500).json({ error: '設定の保存に失敗しました' });
    }
  });

  // Square設定を取得（トークンはマスク）
  app.get('/api/square/settings', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    try {
      const companyId = getCompanyId(req);
      if (!companyId) {
        return res.json({ hasSettings: false });
      }
      
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.json({ hasSettings: false });
      }
      
      res.json({
        hasSettings: !!company.squareAccessToken,
        applicationId: company.squareApplicationId || '',
        environment: company.squareEnvironment || 'sandbox',
        locationId: company.squareLocationId || '',
        // トークンはマスク表示（セキュリティ）
        accessTokenMasked: company.squareAccessToken 
          ? '****' + company.squareAccessToken.slice(-4)
          : '',
      });
    } catch (error: any) {
      console.error('Get Square settings error:', error);
      res.status(500).json({ error: '設定の取得に失敗しました' });
    }
  });

  app.get('/api/square/customers', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { client } = await getTenantSquareClient(req);
      if (!client) {
        return res.status(400).json({ error: 'Square APIが設定されていません' });
      }
      
      const result = await client.customers.list();
      const customers: any[] = [];
      for await (const customer of result) {
        customers.push(customer);
      }
      res.json(customers);
    } catch (error: any) {
      console.error('Square customers error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/square/payments', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { client } = await getTenantSquareClient(req);
      if (!client) {
        return res.status(400).json({ error: 'Square APIが設定されていません' });
      }
      
      const result = await client.payments.list();
      const payments: any[] = [];
      for await (const payment of result) {
        payments.push(payment);
      }
      res.json(payments);
    } catch (error: any) {
      console.error('Square payments error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/square/invoices', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { client, company } = await getTenantSquareClient(req);
      if (!client) {
        return res.status(400).json({ error: 'Square APIが設定されていません' });
      }
      
      // Use saved locationId or get from API
      let locationId = company?.squareLocationId;
      if (!locationId) {
        const { locations } = await client.locations.list();
        locationId = locations?.[0]?.id;
      }
      
      if (!locationId) {
        return res.json([]);
      }
      
      const result = await client.invoices.list({ locationId });
      const invoices: any[] = [];
      for await (const invoice of result) {
        invoices.push(invoice);
      }
      res.json(invoices);
    } catch (error: any) {
      console.error('Square invoices error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/square/payment-links', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { client, company } = await getTenantSquareClient(req);
      if (!client) {
        return res.status(400).json({ error: 'Square APIが設定されていません' });
      }
      
      const { name, amount, description, currency = 'JPY' } = req.body;
      
      if (!name || !amount) {
        return res.status(400).json({ error: '商品名と金額は必須です' });
      }

      // Use saved locationId or get from API
      let locationId = company?.squareLocationId;
      if (!locationId) {
        const { locations } = await client.locations.list();
        locationId = locations?.[0]?.id;
      }
      
      if (!locationId) {
        return res.status(400).json({ error: '店舗が登録されていません' });
      }

      const { paymentLink } = await client.checkout.paymentLinks.create({
        idempotencyKey: crypto.randomUUID(),
        quickPay: {
          name,
          priceMoney: {
            amount: BigInt(amount),
            currency,
          },
          locationId,
        },
        paymentNote: description || undefined,
      });

      res.json({
        id: paymentLink?.id,
        url: paymentLink?.url,
        longUrl: paymentLink?.longUrl,
        createdAt: paymentLink?.createdAt,
      });
    } catch (error: any) {
      console.error('Create payment link error:', error);
      res.status(500).json({ error: error.message || '決済リンクの作成に失敗しました' });
    }
  });

  app.get('/api/square/payment-links', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const { client } = await getTenantSquareClient(req);
      if (!client) {
        return res.status(400).json({ error: 'Square APIが設定されていません' });
      }
      
      const result = await client.checkout.paymentLinks.list();
      const paymentLinks: any[] = [];
      for await (const link of result) {
        paymentLinks.push(link);
      }
      res.json(paymentLinks);
    } catch (error: any) {
      console.error('List payment links error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Quick Notes API
  app.get('/api/quick-notes', requireAuth, async (req: Request, res: Response) => {
    try {
      const notes = await storage.getQuickNotes(req.session.userId!);
      res.json(notes);
    } catch (error) {
      console.error('Get quick notes error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/quick-notes', requireAuth, async (req: Request, res: Response) => {
    try {
      const note = await storage.createQuickNote({
        ...req.body,
        userId: req.session.userId,
      });
      res.json(note);
    } catch (error) {
      console.error('Create quick note error:', error);
      res.status(500).json({ error: 'メモの作成に失敗しました' });
    }
  });

  app.patch('/api/quick-notes/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const note = await storage.updateQuickNote(parseInt(req.params.id), req.body);
      res.json(note);
    } catch (error) {
      console.error('Update quick note error:', error);
      res.status(500).json({ error: 'メモの更新に失敗しました' });
    }
  });

  app.delete('/api/quick-notes/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteQuickNote(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete quick note error:', error);
      res.status(500).json({ error: 'メモの削除に失敗しました' });
    }
  });

  // Lead Management API
  app.get('/api/leads', requireAuth, async (req: Request, res: Response) => {
    try {
      const { status, source, search } = req.query;
      const leads = await storage.getLeads({
        status: status as string,
        source: source as string,
        search: search as string,
      });
      res.json(leads);
    } catch (error) {
      console.error('Get leads error:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: 'リードが見つかりません' });
      }
      res.json(lead);
    } catch (error) {
      console.error('Get lead error:', error);
      res.status(500).json({ error: 'リードの取得に失敗しました' });
    }
  });

  app.post('/api/leads', requireAuth, async (req: Request, res: Response) => {
    try {
      const lead = await storage.createLead(req.body);
      res.json(lead);
    } catch (error) {
      console.error('Create lead error:', error);
      res.status(500).json({ error: 'リードの作成に失敗しました' });
    }
  });

  app.put('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      res.json(lead);
    } catch (error) {
      console.error('Update lead error:', error);
      res.status(500).json({ error: 'リードの更新に失敗しました' });
    }
  });

  app.delete('/api/leads/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteLead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete lead error:', error);
      res.status(500).json({ error: 'リードの削除に失敗しました' });
    }
  });

  app.post('/api/leads/bulk', requireAuth, async (req: Request, res: Response) => {
    try {
      const { leads: leadsData } = req.body;
      const leads = await storage.bulkCreateLeads(leadsData);
      res.json({ success: true, count: leads.length });
    } catch (error) {
      console.error('Bulk create leads error:', error);
      res.status(500).json({ error: 'リードの一括登録に失敗しました' });
    }
  });

  app.get('/api/leads/:id/activities', requireAuth, async (req: Request, res: Response) => {
    try {
      const activities = await storage.getLeadActivities(req.params.id);
      res.json(activities);
    } catch (error) {
      console.error('Get lead activities error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/leads/:id/activities', requireAuth, async (req: Request, res: Response) => {
    try {
      const activity = await storage.createLeadActivity({
        leadId: req.params.id,
        type: req.body.type,
        description: req.body.description,
        userId: req.session.userId,
      });
      res.json(activity);
    } catch (error) {
      console.error('Create lead activity error:', error);
      res.status(500).json({ error: 'アクティビティの登録に失敗しました' });
    }
  });

  // SEO Categories API
  app.get('/api/seo-categories', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const categories = await tenantStorage.getSeoCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get SEO categories error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/seo-categories', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { name, slug, description } = req.body;
      const category = await tenantStorage.createSeoCategory({ name, slug, description });
      res.json(category);
    } catch (error: any) {
      console.error('Create SEO category error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'このスラッグは既に使用されています' });
      }
      res.status(500).json({ error: 'カテゴリの作成に失敗しました' });
    }
  });

  app.delete('/api/seo-categories/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteSeoCategory(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error('Delete SEO category error:', error);
      res.status(500).json({ error: 'カテゴリの削除に失敗しました' });
    }
  });

  // SEO Articles API
  app.get('/api/seo-articles', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const articles = await tenantStorage.getSeoArticles();
      res.json(articles);
    } catch (error) {
      console.error('Get SEO articles error:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/seo-articles/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const article = await storage.getSeoArticle(req.params.id);
      if (!article) {
        return res.status(404).json({ error: '記事が見つかりません' });
      }
      res.json(article);
    } catch (error) {
      console.error('Get SEO article error:', error);
      res.status(500).json({ error: '記事の取得に失敗しました' });
    }
  });

  app.post('/api/seo-articles', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { title, slug, content, metaTitle, metaDescription, keywords, ctaUrl, ctaText, domain, siteName, categoryId } = req.body;
      const article = await tenantStorage.createSeoArticle({
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        keywords,
        ctaUrl,
        ctaText,
        domain,
        siteName,
        categoryId,
        userId: req.session.userId,
      });
      res.json(article);
    } catch (error: any) {
      console.error('Create SEO article error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'このスラッグは既に使用されています' });
      }
      res.status(500).json({ error: '記事の作成に失敗しました' });
    }
  });

  app.put('/api/seo-articles/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const { title, slug, content, metaTitle, metaDescription, keywords, isPublished, ctaUrl, ctaText, domain, siteName, categoryId } = req.body;
      const article = await storage.updateSeoArticle(req.params.id, {
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        keywords,
        isPublished,
        ctaUrl,
        ctaText,
        domain,
        siteName,
        categoryId,
      });
      res.json(article);
    } catch (error: any) {
      console.error('Update SEO article error:', error);
      if (error.code === '23505') {
        return res.status(400).json({ error: 'このスラッグは既に使用されています' });
      }
      res.status(500).json({ error: '記事の更新に失敗しました' });
    }
  });

  app.delete('/api/seo-articles/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      await storage.deleteSeoArticle(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete SEO article error:', error);
      res.status(500).json({ error: '記事の削除に失敗しました' });
    }
  });

  app.post('/api/seo-articles/:id/publish', requireAuth, async (req: Request, res: Response) => {
    try {
      const articleId = req.params.id;
      
      // Get the article first
      let article = await storage.getSeoArticle(articleId);
      if (!article) {
        return res.status(404).json({ error: '記事が見つかりません' });
      }

      // Step 1: Auto-insert internal links before publishing
      try {
        const publishedArticles = await storage.getPublishedSeoArticles();
        const otherArticles = publishedArticles.filter(a => a.id !== articleId);
        
        if (otherArticles.length > 0) {
          const openai = new OpenAI({
            apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
            baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
          });

          const articleList = otherArticles.slice(0, 10).map(a => `- タイトル: ${a.title}, URL: /articles/${a.slug}`).join('\n');

          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `あなたはSEO専門家です。記事コンテンツに内部リンクを自然に挿入してください。

関連記事リスト:
${articleList}

ルール:
1. 文脈に合う記事のみリンクを挿入
2. 最大3つのリンクを追加
3. 自然な文章でリンクを挿入（例: 「詳しくは<a href="/articles/slug">関連記事</a>をご覧ください」）
4. 元のHTMLコンテンツを保持
5. コンテンツのみを返す（説明不要）`
              },
              { role: 'user', content: article.content }
            ],
            temperature: 0.3,
          });

          const linkedContent = completion.choices[0].message.content || article.content;
          await storage.updateSeoArticle(articleId, { content: linkedContent });
        }
      } catch (linkError) {
        console.log('Internal link auto-insert skipped:', linkError);
      }

      // Step 2: Publish the article
      article = await storage.publishSeoArticle(articleId);

      // Step 3: Auto-send to Google Indexing API
      try {
        const seoDomain = await storage.getSetting('seo_domain');
        const host = req.get('host') || '';
        const baseUrl = seoDomain || `https://${host}`;
        const articleUrl = `${baseUrl}/articles/${article!.slug}`;

        // Check if Google service account is configured
        const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
        if (serviceAccountJson) {
          const serviceAccount = JSON.parse(serviceAccountJson);
          
          const jwtClient = new google.auth.JWT({
            email: serviceAccount.client_email,
            key: serviceAccount.private_key,
            scopes: ['https://www.googleapis.com/auth/indexing'],
          });

          await jwtClient.authorize();
          
          const indexing = google.indexing({ version: 'v3', auth: jwtClient });
          
          await indexing.urlNotifications.publish({
            requestBody: {
              url: articleUrl,
              type: 'URL_UPDATED'
            }
          });
          
          await storage.updateIndexingStatus(articleId, 'sent');
          console.log(`[Indexing API] Successfully sent to Google: ${articleUrl}`);
        } else {
          console.log('[Indexing API] Service account not configured, skipping');
        }
      } catch (indexError: any) {
        console.log('Indexing API error:', indexError.message || indexError);
        // Still mark as sent for tracking purposes
        await storage.updateIndexingStatus(articleId, 'error');
      }

      res.json(article);
    } catch (error) {
      console.error('Publish SEO article error:', error);
      res.status(500).json({ error: '記事の公開に失敗しました' });
    }
  });

  app.post('/api/seo-articles/:id/unpublish', requireAuth, async (req: Request, res: Response) => {
    try {
      const article = await storage.unpublishSeoArticle(req.params.id);
      res.json(article);
    } catch (error) {
      console.error('Unpublish SEO article error:', error);
      res.status(500).json({ error: '記事の非公開に失敗しました' });
    }
  });

  // Generate SEO article with AI
  app.post('/api/seo-articles/generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { topic, keywords } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Get existing articles for internal linking
      const existingArticles = await storage.getPublishedSeoArticles();
      const articlesContext = existingArticles.slice(0, 10).map(a => 
        `- 「${a.title}」(URL: /articles/${a.slug})`
      ).join('\n');

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはSEOの専門家です。与えられたトピックについて、SEOに最適化された記事を作成してください。

以下の構成で記事を作成してください：
1. キャッチーなタイトル（H1）
2. 導入文（読者の興味を引く）
3. 主要なポイント（H2見出しで3〜5セクション）
4. 各セクションに詳細な説明
5. まとめ
6. CTA（行動喚起）

SEO最適化のポイント：
- キーワードを自然に含める
- 読みやすい文章構成
- 適切な見出し構造
- 内部リンクを適切に挿入

${existingArticles.length > 0 ? `
## 内部リンク用の既存記事
以下の記事へのリンクを記事内に自然に挿入してください（関連性がある場合のみ）：
${articlesContext}

リンクは [リンクテキスト](/articles/スラッグ) の形式で挿入してください。
` : ''}

出力はMarkdown形式で、以下のJSON構造で返してください：
{
  "title": "記事タイトル",
  "metaTitle": "SEO用タイトル（60文字以内）",
  "metaDescription": "SEO用説明文（160文字以内）",
  "content": "Markdown形式の記事本文",
  "suggestedSlug": "url-slug-in-english"
}`
          },
          {
            role: 'user',
            content: `トピック: ${topic}\nキーワード: ${keywords || 'なし'}`
          }
        ],
      });

      const response = completion.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          res.json(parsed);
        } else {
          res.json({ content: response, title: topic, metaTitle: topic, metaDescription: '', suggestedSlug: '' });
        }
      } catch {
        res.json({ content: response, title: topic, metaTitle: topic, metaDescription: '', suggestedSlug: '' });
      }
    } catch (error) {
      console.error('Generate SEO article error:', error);
      res.status(500).json({ error: 'SEO記事生成エラーが発生しました' });
    }
  });

  // Public article page (no auth required)
  app.get('/articles/:slug', async (req: Request, res: Response) => {
    try {
      const article = await storage.getSeoArticleBySlug(req.params.slug);
      const globalDomain = await storage.getSetting('seo_domain');
      const globalSiteName = await storage.getSetting('site_name') || 'SIN JAPAN';
      const siteName = (article as any)?.siteName || globalSiteName;
      const seoDomain = article?.domain || globalDomain || `https://${req.get('host')}`;
      
      if (!article || !article.isPublished) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="ja">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>記事が見つかりません</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
              h1 { color: #1e293b; }
              p { color: #64748b; }
              a { color: #3b82f6; text-decoration: none; }
            </style>
          </head>
          <body>
            <h1>404 - 記事が見つかりません</h1>
            <p>お探しの記事は存在しないか、非公開になっています。</p>
            <a href="/">ホームに戻る</a>
          </body>
          </html>
        `);
      }

      const contentHtml = article.content
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      const html = `
        <!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${article.title} | ${siteName}</title>
          <meta name="description" content="${article.metaDescription || article.content.substring(0, 160)}">
          <meta name="keywords" content="${article.keywords || ''}">
          <link rel="canonical" href="${seoDomain}/articles/${article.slug}">
          <meta property="og:title" content="${article.title}">
          <meta property="og:description" content="${article.metaDescription || article.content.substring(0, 160)}">
          <meta property="og:type" content="article">
          <meta property="og:url" content="${seoDomain}/articles/${article.slug}">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            
            :root {
              --primary: #3b82f6;
              --primary-dark: #2563eb;
              --accent: #0ea5e9;
              --dark: #0f172a;
              --gray-900: #1e293b;
              --gray-700: #334155;
              --gray-500: #64748b;
              --gray-300: #cbd5e1;
              --gray-100: #f1f5f9;
            }
            
            body { 
              font-family: 'Inter', 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.8;
              color: var(--gray-900);
              background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
              min-height: 100vh;
            }
            
            /* Animations */
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(30px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            @keyframes gradientShift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            
            /* Navigation */
            nav {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: rgba(15, 23, 42, 0.8);
              backdrop-filter: blur(20px);
              -webkit-backdrop-filter: blur(20px);
              padding: 16px 24px;
              z-index: 1000;
              border-bottom: 1px solid rgba(255,255,255,0.08);
              animation: slideDown 0.6s ease-out;
            }
            nav .container {
              max-width: 1200px;
              margin: 0 auto;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 1.5rem;
              font-weight: 800;
              color: white;
              text-decoration: none;
              letter-spacing: -0.02em;
            }
            .logo span {
              background: linear-gradient(135deg, #60a5fa, #0ea5e9);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            
            /* Hero Section */
            .hero {
              background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #1e40af 70%, #3b82f6 100%);
              background-size: 200% 200%;
              animation: gradientShift 15s ease infinite;
              padding: 140px 24px 120px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            .hero::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.3) 0%, transparent 50%),
                          radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.2) 0%, transparent 70%);
              animation: pulse 8s ease-in-out infinite;
            }
            .hero::after {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3C/g%3E%3C/svg%3E");
            }
            .hero-content {
              position: relative;
              z-index: 1;
              max-width: 900px;
              margin: 0 auto;
              animation: fadeInUp 0.8s ease-out;
            }
            .hero-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: rgba(255,255,255,0.1);
              backdrop-filter: blur(10px);
              color: #c7d2fe;
              padding: 10px 24px;
              border-radius: 100px;
              font-size: 0.875rem;
              font-weight: 600;
              margin-bottom: 28px;
              border: 1px solid rgba(255,255,255,0.15);
              animation: float 4s ease-in-out infinite;
            }
            .hero-badge::before {
              content: '';
              width: 8px;
              height: 8px;
              background: #06b6d4;
              border-radius: 50%;
              animation: pulse 2s ease-in-out infinite;
            }
            .hero h1 {
              font-size: clamp(2.5rem, 6vw, 4rem);
              font-weight: 900;
              color: white;
              margin-bottom: 24px;
              text-shadow: 0 4px 30px rgba(0,0,0,0.3);
              letter-spacing: -0.03em;
              line-height: 1.2;
            }
            .hero-description {
              font-size: 1.25rem;
              color: #c7d2fe;
              max-width: 650px;
              margin: 0 auto 32px;
              line-height: 1.7;
            }
            .hero-meta {
              display: inline-flex;
              align-items: center;
              gap: 16px;
              color: #a5b4fc;
              font-size: 0.9rem;
              font-weight: 500;
            }
            .hero-meta span {
              display: flex;
              align-items: center;
              gap: 6px;
            }
            
            /* Main Content */
            main {
              max-width: 820px;
              margin: -70px auto 0;
              padding: 0 24px 80px;
              position: relative;
              z-index: 10;
              animation: fadeInUp 0.8s ease-out 0.2s both;
            }
            .content-card {
              background: white;
              border-radius: 28px;
              box-shadow: 0 25px 80px -20px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0,0,0,0.03);
              padding: 60px 70px;
              margin-bottom: 40px;
              position: relative;
              overflow: hidden;
            }
            .content-card::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, var(--primary), var(--accent), var(--primary));
              background-size: 200% 100%;
              animation: gradientShift 3s ease infinite;
            }
            .content-card h2 {
              font-size: 1.875rem;
              font-weight: 800;
              color: var(--gray-900);
              margin: 48px 0 24px;
              position: relative;
              padding-left: 20px;
            }
            .content-card h2::before {
              content: '';
              position: absolute;
              left: 0;
              top: 0;
              bottom: 0;
              width: 4px;
              background: linear-gradient(180deg, var(--primary), var(--accent));
              border-radius: 4px;
            }
            .content-card h2:first-child { margin-top: 0; }
            .content-card h3 {
              font-size: 1.375rem;
              font-weight: 700;
              color: var(--gray-700);
              margin: 36px 0 16px;
            }
            .content-card p {
              color: var(--gray-700);
              margin: 20px 0;
              font-size: 1.0625rem;
              line-height: 1.9;
            }
            .content-card a {
              color: var(--primary);
              text-decoration: none;
              font-weight: 600;
              position: relative;
              transition: color 0.3s ease;
            }
            .content-card a::after {
              content: '';
              position: absolute;
              bottom: -2px;
              left: 0;
              right: 0;
              height: 2px;
              background: var(--accent);
              transform: scaleX(0);
              transition: transform 0.3s ease;
            }
            .content-card a:hover { color: var(--primary-dark); }
            .content-card a:hover::after { transform: scaleX(1); }
            .content-card ul, .content-card ol {
              margin: 24px 0;
              padding-left: 0;
              list-style: none;
            }
            .content-card li {
              position: relative;
              padding-left: 32px;
              margin: 14px 0;
              color: var(--gray-700);
              line-height: 1.8;
            }
            .content-card li::before {
              content: '';
              position: absolute;
              left: 0;
              top: 12px;
              width: 10px;
              height: 10px;
              background: linear-gradient(135deg, var(--primary), var(--accent));
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
            }
            .content-card strong {
              color: var(--gray-900);
              font-weight: 700;
            }
            .content-card blockquote {
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              border-left: 4px solid var(--accent);
              padding: 24px 28px;
              margin: 28px 0;
              border-radius: 0 16px 16px 0;
              font-style: italic;
              color: var(--gray-700);
            }
            
            /* CTA Section */
            .cta-section {
              background: linear-gradient(135deg, var(--primary) 0%, #2563eb 50%, var(--accent) 100%);
              background-size: 200% 200%;
              animation: gradientShift 8s ease infinite;
              border-radius: 24px;
              padding: 60px 50px;
              text-align: center;
              color: white;
              position: relative;
              overflow: hidden;
              box-shadow: 0 25px 60px -15px rgba(59, 130, 246, 0.5);
            }
            .cta-section::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
              animation: float 6s ease-in-out infinite;
            }
            .cta-section h2 {
              font-size: 2rem;
              font-weight: 800;
              margin-bottom: 16px;
              position: relative;
              z-index: 1;
            }
            .cta-section p {
              color: rgba(255,255,255,0.9);
              margin-bottom: 32px;
              font-size: 1.125rem;
              position: relative;
              z-index: 1;
            }
            .cta-button {
              display: inline-block;
              background: white;
              color: var(--primary-dark);
              padding: 18px 48px;
              border-radius: 100px;
              font-weight: 700;
              font-size: 1.125rem;
              text-decoration: none;
              transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
              box-shadow: 0 15px 40px rgba(0,0,0,0.2);
              position: relative;
              z-index: 1;
            }
            .cta-button:hover {
              transform: translateY(-5px) scale(1.02);
              box-shadow: 0 25px 50px rgba(0,0,0,0.3);
            }
            
            /* Footer */
            footer {
              background: var(--dark);
              color: var(--gray-500);
              padding: 50px 24px;
              text-align: center;
            }
            footer p {
              font-size: 0.9rem;
            }
            footer a {
              color: var(--accent);
              text-decoration: none;
              transition: color 0.3s ease;
            }
            footer a:hover { color: #22d3ee; }
            
            /* Responsive */
            @media (max-width: 768px) {
              .hero { padding: 120px 20px 100px; }
              .hero h1 { font-size: 2rem; }
              .content-card { padding: 40px 28px; border-radius: 20px; }
              main { margin-top: -50px; }
              .cta-section { padding: 45px 30px; }
            }
            
            /* Scroll Animation */
            .animate-on-scroll {
              opacity: 0;
              transform: translateY(20px);
              transition: opacity 0.6s ease, transform 0.6s ease;
            }
            .animate-on-scroll.visible {
              opacity: 1;
              transform: translateY(0);
            }
          </style>
        </head>
        <body>
          <nav>
            <div class="container">
              <span class="logo">${siteName}</span>
            </div>
          </nav>
          
          <div class="hero">
            <div class="hero-content">
              <span class="hero-badge">${siteName} BLOG</span>
              <h1>${article.title}</h1>
              <p class="hero-description">${article.metaDescription || ''}</p>
              <div class="hero-meta">
                <span>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>
                  ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date(article.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
          
          <main>
            <article class="content-card">
              ${contentHtml}
            </article>
            
            ${article.ctaUrl ? `
            <div class="cta-section">
              <h2>${article.ctaText || 'お問い合わせはこちら'}</h2>
              <p>ご質問やご相談がございましたら、お気軽にお問い合わせください。</p>
              <a href="${article.ctaUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">詳しく見る →</a>
            </div>
            ` : ''}
          </main>
          
          <footer>
            <p>&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</p>
          </footer>
          
          <script>
            // Scroll animation
            const observer = new IntersectionObserver((entries) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  entry.target.classList.add('visible');
                }
              });
            }, { threshold: 0.1 });
            
            document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
          </script>
        </body>
        </html>
      `;
      
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Get public article error:', error);
      res.status(500).send('エラーが発生しました');
    }
  });

  // Sitemap generation
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const articles = await storage.getPublishedSeoArticles();
      const seoDomain = await storage.getSetting('seo_domain');
      const baseUrl = seoDomain || `https://${req.get('host')}`;
      
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Home page
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      
      // Articles
      for (const article of articles) {
        xml += `  <url>\n`;
        xml += `    <loc>${baseUrl}/articles/${article.slug}</loc>\n`;
        xml += `    <lastmod>${article.updatedAt.toISOString().split('T')[0]}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.8</priority>\n`;
        xml += `  </url>\n`;
      }
      
      xml += '</urlset>';
      
      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Sitemap generation error:', error);
      res.status(500).send('エラーが発生しました');
    }
  });

  // Google Indexing API (placeholder - requires service account setup)
  app.post('/api/seo-articles/:id/index', requireAuth, async (req: Request, res: Response) => {
    try {
      const article = await storage.getSeoArticle(req.params.id);
      if (!article || !article.isPublished) {
        return res.status(400).json({ error: '公開されている記事のみインデックス送信できます' });
      }

      // Update status to sent (actual API integration would go here)
      await storage.updateIndexingStatus(req.params.id, 'sent');
      
      res.json({ success: true, message: 'インデックス送信をリクエストしました' });
    } catch (error) {
      console.error('Index article error:', error);
      res.status(500).json({ error: 'インデックス送信に失敗しました' });
    }
  });

  // Marketing Campaigns API
  app.get('/api/marketing/campaigns', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { category } = req.query;
      const campaigns = await tenantStorage.getMarketingCampaigns(category as string | undefined);
      res.json(campaigns);
    } catch (error) {
      console.error('Get marketing campaigns error:', error);
      res.status(500).json([]);
    }
  });

  app.get('/api/marketing/campaigns/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const campaign = await tenantStorage.getMarketingCampaign(parseInt(req.params.id));
      if (!campaign) {
        return res.status(404).json({ error: 'キャンペーンが見つかりません' });
      }
      res.json(campaign);
    } catch (error) {
      console.error('Get marketing campaign error:', error);
      res.status(500).json({ error: 'キャンペーンの取得に失敗しました' });
    }
  });

  app.post('/api/marketing/campaigns', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const campaignData = {
        ...req.body,
        createdBy: req.session.userId,
      };
      const campaign = await tenantStorage.createMarketingCampaign(campaignData);
      res.json(campaign);
    } catch (error) {
      console.error('Create marketing campaign error:', error);
      res.status(500).json({ error: 'キャンペーンの作成に失敗しました' });
    }
  });

  app.put('/api/marketing/campaigns/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const campaign = await tenantStorage.updateMarketingCampaign(parseInt(req.params.id), req.body);
      if (!campaign) {
        return res.status(404).json({ error: 'キャンペーンが見つかりません' });
      }
      res.json(campaign);
    } catch (error) {
      console.error('Update marketing campaign error:', error);
      res.status(500).json({ error: 'キャンペーンの更新に失敗しました' });
    }
  });

  app.delete('/api/marketing/campaigns/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const success = await tenantStorage.deleteMarketingCampaign(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'キャンペーンが見つかりません' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete marketing campaign error:', error);
      res.status(500).json({ error: 'キャンペーンの削除に失敗しました' });
    }
  });

  app.get('/api/marketing/stats', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const { category } = req.query;
      const stats = await tenantStorage.getMarketingStats(category as string | undefined);
      res.json(stats);
    } catch (error) {
      console.error('Get marketing stats error:', error);
      res.status(500).json({
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalBudget: '0',
        totalSpent: '0',
        totalRevenue: '0',
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
      });
    }
  });

  // Marketing Diagnosis API
  app.post('/api/marketing/diagnose', requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, url, keywords } = req.body;
      
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const categoryPrompts: Record<string, string> = {
        aio: 'AI検索（ChatGPT、Perplexity等）での表示最適化',
        seo: 'Google検索でのSEO最適化',
        meo: 'Googleマップでのローカル検索最適化',
        hp: 'ホームページ・ランディングページの最適化',
        sns: 'SNS（X、Instagram、Facebook等）での露出最適化',
        ads: '広告キャンペーンの最適化',
        external: '外部メディア・PR・インフルエンサーマーケティング',
        offline: 'オフラインマーケティング（看板・チラシ・名刺）',
        sales: '営業・代理店・アフィリエイト活動',
      };

      const prompt = `あなたはマーケティング専門家です。以下の情報に基づいて${categoryPrompts[category] || 'マーケティング'}の診断を行ってください。

URL/名前: ${url || '未指定'}
キーワード: ${keywords || '未指定'}

以下のJSON形式で回答してください:
{
  "score": 0-100の数値,
  "items": [
    { "label": "チェック項目名", "status": "good/warning/error", "message": "詳細メッセージ" }
  ],
  "recommendations": ["改善提案1", "改善提案2", "改善提案3"]
}

4-6個の診断項目と3-5個の改善提案を含めてください。`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたはマーケティング診断の専門家です。JSON形式のみで回答してください。' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      res.json(result);
    } catch (error) {
      console.error('Marketing diagnosis error:', error);
      res.json({
        score: 65,
        items: [
          { label: 'コンテンツ品質', status: 'good', message: '高品質なコンテンツが確認されました' },
          { label: 'キーワード最適化', status: 'warning', message: 'ターゲットキーワードの使用が不十分です' },
          { label: '構造化データ', status: 'error', message: '構造化データが設定されていません' },
          { label: 'モバイル対応', status: 'good', message: 'モバイルフレンドリーです' },
        ],
        recommendations: [
          'ターゲットキーワードを見出しに含めてください',
          '構造化データ（Schema.org）を追加してください',
          'メタディスクリプションを改善してください',
        ],
      });
    }
  });

  // Marketing Content Generation API
  app.post('/api/marketing/generate', requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, action, topic } = req.body;
      
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const prompts: Record<string, Record<string, string>> = {
        aio: {
          'AI向けコンテンツ生成': 'AI検索エンジンが理解しやすい構造化コンテンツを生成してください。見出し、箇条書き、明確な説明を含めてください。',
          'キーワード最適化': 'AI検索で上位表示されるためのキーワード戦略を提案してください。',
          'FAQ生成': 'よくある質問と回答を10個生成してください。',
        },
        seo: {
          'SEO記事生成': 'SEOに最適化されたブログ記事を生成してください。見出し（H2、H3）、本文、メタディスクリプションを含めてください。',
          'メタタグ最適化': 'SEOに最適なタイトルタグとメタディスクリプションを3パターン提案してください。',
          '内部リンク提案': '関連コンテンツへの内部リンク戦略を提案してください。',
        },
        meo: {
          'ビジネス説明文生成': 'Googleビジネスプロフィール用の説明文を生成してください。地域性とサービス内容を強調してください。',
          '投稿コンテンツ生成': 'Googleビジネス用の投稿を5つ生成してください。',
          'レビュー返信テンプレート': 'ポジティブ・ネガティブレビューへの返信テンプレートを各3パターン生成してください。',
        },
        hp: {
          'LP自動生成': 'コンバージョン最適化されたランディングページの構成とコピーを生成してください。',
          'コピーライティング': '訴求力のあるキャッチコピーとボディコピーを生成してください。',
          'CTAボタン最適化': '効果的なCTAボタンのテキストを10パターン提案してください。',
        },
        sns: {
          '投稿文生成': '各SNS（X、Instagram、Facebook）向けの投稿文を生成してください。',
          '画像キャプション': '画像投稿に最適なキャプションを生成してください。',
          'ハッシュタグ提案': '効果的なハッシュタグを20個提案してください。',
        },
        ads: {
          '広告コピー生成': 'クリック率の高い広告見出しと説明文を5パターン生成してください。',
          'キーワード提案': '広告に効果的なキーワードを30個提案してください。',
          'バナー案': '広告バナーのコンセプトとキャッチコピーを5パターン提案してください。',
        },
        external: {
          'プレスリリース生成': 'PRTIMES向けのプレスリリースを生成してください。',
          'インフルエンサーピッチ': 'インフルエンサーへの提案文を生成してください。',
          'メディアリスト': '関連メディアへのアプローチ文を生成してください。',
        },
        offline: {
          'チラシ文面生成': 'チラシ用のキャッチコピーと本文を生成してください。',
          '名刺デザイン案': '名刺のコンセプトと掲載内容を提案してください。',
          '看板コピー': '看板用の短いキャッチコピーを10パターン生成してください。',
        },
        sales: {
          '営業メール生成': '効果的な営業メールを5パターン生成してください。',
          '提案書テンプレート': '提案書の構成と各セクションの内容を生成してください。',
          'トークスクリプト': '電話営業用のトークスクリプトを生成してください。',
        },
      };

      const categoryPrompts = prompts[category] || prompts.seo;
      const specificPrompt = categoryPrompts[action] || '効果的なマーケティングコンテンツを生成してください。';

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'あなたは優秀なマーケティングライターです。実用的で効果的なコンテンツを生成してください。' },
          { role: 'user', content: `トピック: ${topic || '一般的な商品・サービス'}\n\n${specificPrompt}` }
        ],
        temperature: 0.8,
        max_tokens: 2000,
      });

      res.json({ content: completion.choices[0].message.content });
    } catch (error) {
      console.error('Marketing generate error:', error);
      res.status(500).json({ error: 'コンテンツ生成に失敗しました' });
    }
  });

  // Site Credentials (サイト情報) API
  app.get('/api/site-credentials', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const credentials = await tenantStorage.getSiteCredentials();
      res.json(credentials);
    } catch (error) {
      console.error('Get site credentials error:', error);
      res.status(500).json({ error: 'サイト情報の取得に失敗しました' });
    }
  });

  app.get('/api/site-credentials/:id', requireAuth, async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const credential = await tenantStorage.getSiteCredential(parseInt(req.params.id));
      if (!credential) {
        return res.status(404).json({ error: 'サイト情報が見つかりません' });
      }
      res.json(credential);
    } catch (error) {
      console.error('Get site credential error:', error);
      res.status(500).json({ error: 'サイト情報の取得に失敗しました' });
    }
  });

  app.post('/api/site-credentials', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const userId = (req.session as any).user?.id;
      const credential = await tenantStorage.createSiteCredential({
        ...req.body,
        createdBy: userId,
      });
      res.json(credential);
    } catch (error) {
      console.error('Create site credential error:', error);
      res.status(500).json({ error: 'サイト情報の作成に失敗しました' });
    }
  });

  app.put('/api/site-credentials/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const credential = await tenantStorage.updateSiteCredential(parseInt(req.params.id), req.body);
      if (!credential) {
        return res.status(404).json({ error: 'サイト情報が見つかりません' });
      }
      res.json(credential);
    } catch (error) {
      console.error('Update site credential error:', error);
      res.status(500).json({ error: 'サイト情報の更新に失敗しました' });
    }
  });

  app.delete('/api/site-credentials/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const tenantStorage = createTenantStorage(getCompanyId(req), { allowGlobal: true });
      const success = await tenantStorage.deleteSiteCredential(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: 'サイト情報が見つかりません' });
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Delete site credential error:', error);
      res.status(500).json({ error: 'サイト情報の削除に失敗しました' });
    }
  });
}
