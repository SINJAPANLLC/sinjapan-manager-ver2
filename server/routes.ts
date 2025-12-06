import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import OpenAI from 'openai';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
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
      req.session.userId = user.id;
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.get('/api/users', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.post('/api/users', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    try {
      const user = await storage.createUser(req.body);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.message?.includes('unique')) {
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
    const user = await storage.getUser(req.session.userId!);
    const customers = await storage.getCustomers(req.session.userId!, user?.role);
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
    const customer = await storage.createCustomer({ ...req.body, assignedTo: req.session.userId });
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
    const user = await storage.getUser(req.session.userId!);
    const tasks = await storage.getTasks(req.session.userId!, user?.role);
    res.json(tasks);
  });

  app.post('/api/tasks', requireRole('admin', 'ceo', 'manager', 'staff'), async (req: Request, res: Response) => {
    const task = await storage.createTask({ ...req.body, createdBy: req.session.userId });
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

  app.get('/api/chat/partners', requireAuth, async (req: Request, res: Response) => {
    const partners = await storage.getChatPartners(req.session.userId!);
    res.json(partners.map(p => ({ ...p, password: undefined })));
  });

  app.get('/api/chat/users', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    let users = await storage.getAllUsers();
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

  app.get('/api/employees', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const employees = await storage.getAllEmployees();
    res.json(employees);
  });

  app.post('/api/employees', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const employee = await storage.createEmployee(req.body);
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

  app.post('/api/agency/sales', requireRole('agency'), async (req: Request, res: Response) => {
    const sale = await storage.createAgencySale({ ...req.body, agencyId: req.session.userId });
    res.json(sale);
  });

  app.patch('/api/agency/sales/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const sale = await storage.updateAgencySale(parseInt(req.params.id), req.body);
    if (!sale) {
      return res.status(404).json({ message: '売上が見つかりません' });
    }
    res.json(sale);
  });

  app.get('/api/dashboard/stats', requireAuth, async (req: Request, res: Response) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    const stats = await storage.getDashboardStats(req.session.userId!, user.role);
    res.json(stats);
  });

  app.get('/api/businesses', requireAuth, async (req: Request, res: Response) => {
    const businesses = await storage.getBusinesses();
    res.json(businesses);
  });

  app.post('/api/businesses', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const business = await storage.createBusiness(req.body);
    res.json(business);
  });

  app.patch('/api/businesses/:id', requireRole('admin', 'ceo', 'manager'), async (req: Request, res: Response) => {
    const business = await storage.updateBusiness(parseInt(req.params.id), req.body);
    if (!business) {
      return res.status(404).json({ message: '事業が見つかりません' });
    }
    res.json(business);
  });

  app.delete('/api/businesses/:id', requireRole('admin', 'ceo'), async (req: Request, res: Response) => {
    await storage.deleteBusiness(parseInt(req.params.id));
    res.json({ message: '削除しました' });
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
}
