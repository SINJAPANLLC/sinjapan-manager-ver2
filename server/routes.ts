import { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import OpenAI from 'openai';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { google } from 'googleapis';

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
      const { message, history } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const messages = [
        { role: 'system' as const, content: 'あなたは親切で知識豊富なAIアシスタントです。日本語で回答してください。' },
        ...(history || []).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: message }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });

      const reply = completion.choices[0]?.message?.content || '';

      await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          return res.status(400).json({ error: errorMsg, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
        
        // Check for failed generation (metadata.failed_count)
        if (data.metadata?.failed_count && parseInt(data.metadata.failed_count) > 0) {
          await storage.createAiLog({
            type: 'image',
            prompt: prompt,
            status: 'error',
            userId: req.session.userId,
          });
          return res.status(400).json({ error: 'コンテンツポリシー違反により画像を生成できませんでした。別のプロンプトをお試しください。', translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        }
        
        if (data.data?.image_urls && data.data.image_urls.length > 0) {
          await storage.createAiLog({
            type: 'image',
            prompt: prompt,
            result: data.data.image_urls[0],
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ imageUrl: data.data.image_urls[0], translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
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
          await storage.createAiLog({
            type: 'video',
            prompt: prompt,
            result: data.data.video_url,
            status: 'success',
            userId: req.session.userId,
          });
          res.json({ videoUrl: data.data.video_url, translatedPrompt: translatedPrompt !== prompt ? translatedPrompt : undefined });
        } else {
          await storage.createAiLog({
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
            await storage.createAiLog({
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
          await storage.createAiLog({
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
- 適切な見出し構造`
          },
          {
            role: 'user',
            content: `トピック: ${topic}\nキーワード: ${keywords || 'なし'}`
          }
        ],
      });

      const article = completion.choices[0]?.message?.content || '';

      await storage.createAiLog({
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
      const { text } = req.body;
      const modelslabKey = process.env.MODELSLAB_API_KEY;
      
      if (!modelslabKey) {
        return res.status(400).json({ error: 'MODELSLAB APIキーが設定されていません。' });
      }

      const response = await fetch('https://modelslab.com/api/v6/voice/text_to_speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: modelslabKey,
          text: text,
          language: 'japanese',
        }),
      });

      const data = await response.json();
      
      if (data.status === 'success' && data.output) {
        await storage.createAiLog({
          type: 'voice',
          prompt: text,
          result: data.output,
          status: 'success',
          userId: req.session.userId,
        });
        res.json({ audioUrl: data.output });
      } else {
        res.status(400).json({ error: data.message || '音声生成に失敗しました' });
      }
    } catch (error) {
      console.error('Voice generation error:', error);
      res.status(500).json({ error: '音声生成エラーが発生しました' });
    }
  });

  app.post('/api/ai/list', requireAuth, async (req: Request, res: Response) => {
    try {
      const { topic, count } = req.body;
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたはリスト生成の専門家です。指定されたトピックについて、${count || 10}項目のリストを作成してください。各項目は簡潔で有用な情報を含めてください。番号付きリストで出力してください。`
          },
          {
            role: 'user',
            content: topic
          }
        ],
      });

      const list = completion.choices[0]?.message?.content || '';

      await storage.createAiLog({
        type: 'list',
        prompt: topic,
        result: list.substring(0, 500),
        status: 'success',
        userId: req.session.userId,
      });

      res.json({ list });
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
        proposal: '提案書',
        invoice: '請求書',
        report: '報告書',
        email: 'ビジネスメール',
        minutes: '議事録',
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

      await storage.createAiLog({
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
      const logs = await storage.getAiLogs(req.session.userId!);
      res.json(logs);
    } catch (error) {
      console.error('Get AI logs error:', error);
      res.status(500).json([]);
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

  // SEO Categories API
  app.get('/api/seo-categories', requireAuth, async (req: Request, res: Response) => {
    try {
      const categories = await storage.getSeoCategories();
      res.json(categories);
    } catch (error) {
      console.error('Get SEO categories error:', error);
      res.status(500).json([]);
    }
  });

  app.post('/api/seo-categories', requireAuth, async (req: Request, res: Response) => {
    try {
      const { name, slug, description } = req.body;
      const category = await storage.createSeoCategory({ name, slug, description });
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
      const articles = await storage.getSeoArticles();
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
      const { title, slug, content, metaTitle, metaDescription, keywords, ctaUrl, ctaText, domain, categoryId } = req.body;
      const article = await storage.createSeoArticle({
        title,
        slug,
        content,
        metaTitle,
        metaDescription,
        keywords,
        ctaUrl,
        ctaText,
        domain,
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
      const { title, slug, content, metaTitle, metaDescription, keywords, isPublished, ctaUrl, ctaText, domain, categoryId } = req.body;
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
          <title>${article.title} | SIN JAPAN</title>
          <meta name="description" content="${article.metaDescription || article.content.substring(0, 160)}">
          <meta name="keywords" content="${article.keywords || ''}">
          <link rel="canonical" href="${seoDomain}/articles/${article.slug}">
          <meta property="og:title" content="${article.title}">
          <meta property="og:description" content="${article.metaDescription || article.content.substring(0, 160)}">
          <meta property="og:type" content="article">
          <meta property="og:url" content="${seoDomain}/articles/${article.slug}">
          <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.8;
              color: #1e293b;
              background: #f8fafc;
            }
            
            /* Hero Section */
            .hero {
              background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0ea5e9 100%);
              padding: 80px 20px 100px;
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
              background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
              opacity: 0.5;
            }
            .hero-content {
              position: relative;
              z-index: 1;
              max-width: 900px;
              margin: 0 auto;
            }
            .hero-badge {
              display: inline-block;
              background: rgba(255,255,255,0.15);
              backdrop-filter: blur(10px);
              color: #e0f2fe;
              padding: 8px 20px;
              border-radius: 50px;
              font-size: 0.875rem;
              font-weight: 500;
              margin-bottom: 24px;
              border: 1px solid rgba(255,255,255,0.2);
            }
            .hero h1 {
              font-size: clamp(2rem, 5vw, 3.5rem);
              font-weight: 900;
              color: white;
              margin-bottom: 20px;
              text-shadow: 0 2px 20px rgba(0,0,0,0.3);
              letter-spacing: -0.02em;
            }
            .hero-description {
              font-size: 1.125rem;
              color: #cbd5e1;
              max-width: 600px;
              margin: 0 auto 30px;
            }
            .hero-meta {
              color: #94a3b8;
              font-size: 0.875rem;
            }
            
            /* Navigation */
            nav {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: rgba(15, 23, 42, 0.95);
              backdrop-filter: blur(10px);
              padding: 16px 20px;
              z-index: 1000;
              border-bottom: 1px solid rgba(255,255,255,0.1);
            }
            nav .container {
              max-width: 1200px;
              margin: 0 auto;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .logo {
              font-size: 1.25rem;
              font-weight: 700;
              color: white;
              text-decoration: none;
            }
            .logo span {
              background: linear-gradient(135deg, #38bdf8, #0ea5e9);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            
            /* Main Content */
            main {
              max-width: 800px;
              margin: -60px auto 0;
              padding: 0 20px 60px;
              position: relative;
              z-index: 10;
            }
            .content-card {
              background: white;
              border-radius: 24px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
              padding: 50px;
              margin-bottom: 30px;
            }
            .content-card h2 {
              font-size: 1.75rem;
              font-weight: 700;
              color: #0f172a;
              margin: 40px 0 20px;
              padding-bottom: 12px;
              border-bottom: 3px solid #0ea5e9;
              display: inline-block;
            }
            .content-card h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #1e293b;
              margin: 30px 0 15px;
            }
            .content-card p {
              color: #475569;
              margin: 16px 0;
              font-size: 1.0625rem;
            }
            .content-card ul {
              margin: 20px 0;
              padding-left: 0;
              list-style: none;
            }
            .content-card li {
              position: relative;
              padding-left: 28px;
              margin: 12px 0;
              color: #475569;
            }
            .content-card li::before {
              content: '';
              position: absolute;
              left: 0;
              top: 10px;
              width: 8px;
              height: 8px;
              background: linear-gradient(135deg, #0ea5e9, #38bdf8);
              border-radius: 50%;
            }
            .content-card strong {
              color: #0f172a;
              font-weight: 600;
            }
            
            /* CTA Section */
            .cta-section {
              background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
              border-radius: 20px;
              padding: 50px;
              text-align: center;
              color: white;
            }
            .cta-section h2 {
              font-size: 1.75rem;
              font-weight: 700;
              margin-bottom: 15px;
              border: none;
              color: white;
            }
            .cta-section p {
              color: rgba(255,255,255,0.9);
              margin-bottom: 25px;
            }
            .cta-button {
              display: inline-block;
              background: white;
              color: #0284c7;
              padding: 16px 40px;
              border-radius: 50px;
              font-weight: 700;
              font-size: 1.125rem;
              text-decoration: none;
              transition: all 0.3s ease;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            .cta-button:hover {
              transform: translateY(-3px);
              box-shadow: 0 15px 40px rgba(0,0,0,0.3);
            }
            
            /* Footer */
            footer {
              background: #0f172a;
              color: #94a3b8;
              padding: 40px 20px;
              text-align: center;
            }
            footer a {
              color: #38bdf8;
              text-decoration: none;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
              .hero { padding: 100px 20px 80px; }
              .content-card { padding: 30px 25px; border-radius: 16px; }
              main { margin-top: -40px; }
            }
          </style>
        </head>
        <body>
          <nav>
            <div class="container">
              <a href="/" class="logo">SIN <span>JAPAN</span></a>
            </div>
          </nav>
          
          <div class="hero">
            <div class="hero-content">
              <span class="hero-badge">SIN JAPAN BLOG</span>
              <h1>${article.title}</h1>
              <p class="hero-description">${article.metaDescription || ''}</p>
              <p class="hero-meta">公開日: ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('ja-JP') : new Date(article.createdAt).toLocaleDateString('ja-JP')}</p>
            </div>
          </div>
          
          <main>
            <div class="content-card">
              <p>${contentHtml}</p>
            </div>
            
            ${article.ctaUrl ? `
            <div class="cta-section">
              <h2>${article.ctaText || 'お問い合わせはこちら'}</h2>
              <p>ご質問やご相談がございましたら、お気軽にお問い合わせください。</p>
              <a href="${article.ctaUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">詳しく見る</a>
            </div>
            ` : ''}
          </main>
          
          <footer>
            <p>&copy; ${new Date().getFullYear()} SIN JAPAN. All rights reserved.</p>
          </footer>
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
}
