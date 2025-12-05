import { Express, Request, Response } from 'express';
import { storage } from './storage';

declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

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

  app.get('/api/users', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || !['admin', 'ceo', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
    const users = await storage.getAllUsers();
    res.json(users.map(u => ({ ...u, password: undefined })));
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || !['admin', 'ceo', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
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
    const user = await storage.updateUser(targetId, req.body);
    if (!user) {
      return res.status(404).json({ message: 'ユーザーが見つかりません' });
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || !['admin', 'ceo'].includes(currentUser.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
    await storage.deleteUser(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/customers', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    const customers = await storage.getCustomers(req.session.userId, user?.role);
    res.json(customers);
  });

  app.get('/api/customers/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const customer = await storage.getCustomer(parseInt(req.params.id));
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません' });
    }
    res.json(customer);
  });

  app.post('/api/customers', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const customer = await storage.createCustomer(req.body);
    res.json(customer);
  });

  app.patch('/api/customers/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const customer = await storage.updateCustomer(parseInt(req.params.id), req.body);
    if (!customer) {
      return res.status(404).json({ message: '顧客が見つかりません' });
    }
    res.json(customer);
  });

  app.delete('/api/customers/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    await storage.deleteCustomer(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/tasks', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    const tasks = await storage.getTasks(req.session.userId, user?.role);
    res.json(tasks);
  });

  app.post('/api/tasks', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const task = await storage.createTask({ ...req.body, createdBy: req.session.userId });
    res.json(task);
  });

  app.patch('/api/tasks/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const task = await storage.updateTask(parseInt(req.params.id), req.body);
    if (!task) {
      return res.status(404).json({ message: 'タスクが見つかりません' });
    }
    res.json(task);
  });

  app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    await storage.deleteTask(parseInt(req.params.id));
    res.json({ message: '削除しました' });
  });

  app.get('/api/notifications', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const notifications = await storage.getNotifications(req.session.userId);
    res.json(notifications);
  });

  app.post('/api/notifications', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const notification = await storage.createNotification({ ...req.body, createdBy: req.session.userId });
    res.json(notification);
  });

  app.post('/api/notifications/bulk', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || !['admin', 'ceo', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
    const { userIds, title, message, type } = req.body;
    const notifications = await storage.createBulkNotifications(userIds, { title, message, type, createdBy: req.session.userId });
    res.json(notifications);
  });

  app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    await storage.markNotificationRead(parseInt(req.params.id));
    res.json({ message: '既読にしました' });
  });

  app.post('/api/notifications/read-all', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    await storage.markAllNotificationsRead(req.session.userId);
    res.json({ message: '全て既読にしました' });
  });

  app.get('/api/chat/partners', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const partners = await storage.getChatPartners(req.session.userId);
    res.json(partners.map(p => ({ ...p, password: undefined })));
  });

  app.get('/api/chat/users', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const users = await storage.getAllUsers();
    res.json(users.filter(u => u.id !== req.session.userId).map(u => ({ ...u, password: undefined })));
  });

  app.get('/api/chat/messages/:userId', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const messages = await storage.getChatMessages(req.session.userId, parseInt(req.params.userId));
    await storage.markMessagesAsRead(parseInt(req.params.userId), req.session.userId);
    res.json(messages);
  });

  app.post('/api/chat/messages', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const message = await storage.createChatMessage({ ...req.body, senderId: req.session.userId });
    res.json(message);
  });

  app.get('/api/employees', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const currentUser = await storage.getUser(req.session.userId);
    if (!currentUser || !['admin', 'ceo', 'manager'].includes(currentUser.role)) {
      return res.status(403).json({ message: '権限がありません' });
    }
    const employees = await storage.getAllEmployees();
    res.json(employees);
  });

  app.post('/api/employees', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const employee = await storage.createEmployee(req.body);
    res.json(employee);
  });

  app.patch('/api/employees/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const employee = await storage.updateEmployee(parseInt(req.params.id), req.body);
    if (!employee) {
      return res.status(404).json({ message: '従業員が見つかりません' });
    }
    res.json(employee);
  });

  app.get('/api/agency/sales', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    const sales = user.role === 'agency' 
      ? await storage.getAgencySales(req.session.userId)
      : await storage.getAgencySales();
    res.json(sales);
  });

  app.post('/api/agency/sales', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const sale = await storage.createAgencySale({ ...req.body, agencyId: req.session.userId });
    res.json(sale);
  });

  app.patch('/api/agency/sales/:id', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const sale = await storage.updateAgencySale(parseInt(req.params.id), req.body);
    if (!sale) {
      return res.status(404).json({ message: '売上が見つかりません' });
    }
    res.json(sale);
  });

  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: '認証が必要です' });
    }
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ message: 'ユーザーが見つかりません' });
    }
    const stats = await storage.getDashboardStats(req.session.userId, user.role);
    res.json(stats);
  });
}
