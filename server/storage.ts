import { db } from './db';
import { users, customers, tasks, notifications, chatMessages, employees, agencySales, businesses, businessSales, memos, aiLogs, aiConversations, aiKnowledge, seoArticles, seoCategories, systemSettings, leads, leadActivities, clientProjects, clientInvoices, companies, quickNotes, investments, staffAffiliates } from '../shared/schema';
import { eq, and, or, desc, sql, isNull, gte, lte, like, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, InsertUser, Customer, InsertCustomer, Task, InsertTask, Notification, InsertNotification, ChatMessage, InsertChatMessage, Employee, InsertEmployee, AgencySale, InsertAgencySale, Business, InsertBusiness, BusinessSale, InsertBusinessSale, Memo, InsertMemo, AiLog, InsertAiLog, AiConversation, InsertAiConversation, AiKnowledge, InsertAiKnowledge, SeoArticle, InsertSeoArticle, SeoCategory, InsertSeoCategory, SystemSetting, Lead, InsertLead, LeadActivity, InsertLeadActivity, ClientProject, InsertClientProject, ClientInvoice, InsertClientInvoice, Company, InsertCompany, QuickNote, InsertQuickNote, Investment, InsertInvestment } from '../shared/schema';

export const storage = {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  async createUser(data: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const [user] = await db.insert(users).values({ ...data, password: hashedPassword }).returning();
    return user;
  },

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  },

  async deleteUser(id: number): Promise<boolean> {
    await db.update(notifications).set({ createdBy: null }).where(eq(notifications.createdBy, id));
    await db.update(chatMessages).set({ senderId: null }).where(eq(chatMessages.senderId, id));
    await db.update(chatMessages).set({ receiverId: null }).where(eq(chatMessages.receiverId, id));
    await db.update(tasks).set({ assignedTo: null }).where(eq(tasks.assignedTo, id));
    await db.update(tasks).set({ createdBy: null }).where(eq(tasks.createdBy, id));
    await db.update(customers).set({ assignedTo: null }).where(eq(customers.assignedTo, id));
    await db.delete(employees).where(eq(employees.userId, id));
    await db.delete(notifications).where(eq(notifications.userId, id));
    await db.delete(agencySales).where(eq(agencySales.agencyId, id));
    const result = await db.delete(users).where(eq(users.id, id));
    return true;
  },

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt));
  },

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.role, role));
  },

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  },

  async getCustomers(userId?: number, role?: string): Promise<Customer[]> {
    if (role === 'admin' || role === 'ceo' || role === 'manager') {
      return db.select().from(customers).orderBy(desc(customers.createdAt));
    }
    if (userId) {
      return db.select().from(customers).where(eq(customers.assignedTo, userId)).orderBy(desc(customers.createdAt));
    }
    return [];
  },

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  },

  async createCustomer(data: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(data).returning();
    return customer;
  },

  async updateCustomer(id: number, data: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set({ ...data, updatedAt: new Date() }).where(eq(customers.id, id)).returning();
    return customer;
  },

  async deleteCustomer(id: number): Promise<boolean> {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  },

  async getTasks(userId?: number, role?: string): Promise<Task[]> {
    if (role === 'admin' || role === 'ceo' || role === 'manager') {
      return db.select().from(tasks).orderBy(desc(tasks.createdAt));
    }
    if (userId) {
      return db.select().from(tasks).where(
        or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId))
      ).orderBy(desc(tasks.createdAt));
    }
    return [];
  },

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  },

  async createTask(data: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(data).returning();
    return task;
  },

  async updateTask(id: number, data: Partial<InsertTask>): Promise<Task | undefined> {
    const [task] = await db.update(tasks).set({ ...data, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return task;
  },

  async deleteTask(id: number): Promise<boolean> {
    await db.delete(tasks).where(eq(tasks.id, id));
    return true;
  },

  async getNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  },

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  },

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(data).returning();
    return notification;
  },

  async createBulkNotifications(userIds: number[], data: Omit<InsertNotification, 'userId'>): Promise<Notification[]> {
    const notificationsData = userIds.map(userId => ({ ...data, userId }));
    return db.insert(notifications).values(notificationsData).returning();
  },

  async markNotificationRead(id: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  },

  async markAllNotificationsRead(userId: number): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  },

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return Number(result[0]?.count || 0);
  },

  async getSentNotifications(userId: number): Promise<Notification[]> {
    return db.select().from(notifications).where(eq(notifications.createdBy, userId)).orderBy(desc(notifications.createdAt));
  },

  async getChatMessages(userId: number, otherUserId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(
      or(
        and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, otherUserId)),
        and(eq(chatMessages.senderId, otherUserId), eq(chatMessages.receiverId, userId))
      )
    ).orderBy(chatMessages.createdAt);
  },

  async getChatPartners(userId: number): Promise<User[]> {
    const partners = await db.selectDistinct({ 
      id: users.id, 
      email: users.email, 
      name: users.name, 
      role: users.role, 
      companyId: users.companyId,
      avatarUrl: users.avatarUrl, 
      phone: users.phone, 
      department: users.department, 
      position: users.position, 
      isActive: users.isActive, 
      createdAt: users.createdAt, 
      updatedAt: users.updatedAt, 
      password: users.password,
      bankName: users.bankName,
      bankBranch: users.bankBranch,
      bankAccountType: users.bankAccountType,
      bankAccountNumber: users.bankAccountNumber,
      bankAccountHolder: users.bankAccountHolder,
    })
      .from(chatMessages)
      .innerJoin(users, or(
        and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, users.id)),
        and(eq(chatMessages.receiverId, userId), eq(chatMessages.senderId, users.id))
      ));
    return partners;
  },

  async createChatMessage(data: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db.insert(chatMessages).values(data).returning();
    return message;
  },

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    await db.update(chatMessages).set({ isRead: true })
      .where(and(eq(chatMessages.senderId, senderId), eq(chatMessages.receiverId, receiverId)));
  },

  async getUnreadMessageCount(userId: number): Promise<number> {
    const messages = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false)));
    return messages.length;
  },

  async getEmployee(userId: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.userId, userId));
    return employee;
  },

  async getAllEmployees(): Promise<(Employee & { user: User | null })[]> {
    const result = await db.select().from(employees).leftJoin(users, eq(employees.userId, users.id));
    return result.map(r => ({ ...r.employees, user: r.users }));
  },

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [employee] = await db.insert(employees).values(data).returning();
    return employee;
  },

  async updateEmployee(id: number, data: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const [employee] = await db.update(employees).set({ ...data, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return employee;
  },

  async getAgencySales(agencyId?: number): Promise<AgencySale[]> {
    if (agencyId) {
      return db.select().from(agencySales).where(eq(agencySales.agencyId, agencyId)).orderBy(desc(agencySales.createdAt));
    }
    return db.select().from(agencySales).orderBy(desc(agencySales.createdAt));
  },

  async createAgencySale(data: InsertAgencySale): Promise<AgencySale> {
    const saleData = {
      ...data,
      saleDate: data.saleDate ? new Date(data.saleDate as any) : new Date(),
    };
    const [sale] = await db.insert(agencySales).values(saleData).returning();
    return sale;
  },

  async updateAgencySale(id: number, data: Partial<InsertAgencySale>): Promise<AgencySale | undefined> {
    const [sale] = await db.update(agencySales).set(data).where(eq(agencySales.id, id)).returning();
    return sale;
  },

  async deleteAgencySale(id: number): Promise<void> {
    await db.delete(agencySales).where(eq(agencySales.id, id));
  },

  async getDashboardStats(userId: number, role: string) {
    const customerCount = role === 'admin' || role === 'ceo' || role === 'manager'
      ? await db.select({ count: sql<number>`count(*)` }).from(customers)
      : await db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.assignedTo, userId));

    const taskCount = role === 'admin' || role === 'ceo' || role === 'manager'
      ? await db.select({ count: sql<number>`count(*)` }).from(tasks)
      : await db.select({ count: sql<number>`count(*)` }).from(tasks).where(
          or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId))
        );

    const pendingTasks = role === 'admin' || role === 'ceo' || role === 'manager'
      ? await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'pending'))
      : await db.select({ count: sql<number>`count(*)` }).from(tasks).where(
          and(eq(tasks.status, 'pending'), or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
        );

    const unreadNotifications = await db.select({ count: sql<number>`count(*)` }).from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayMemos = await db.select().from(memos)
      .where(and(
        eq(memos.userId, userId),
        gte(memos.date, today),
        lte(memos.date, tomorrow)
      ));

    const recentTasks = role === 'admin' || role === 'ceo' || role === 'manager'
      ? await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5)
      : await db.select().from(tasks)
          .where(or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
          .orderBy(desc(tasks.createdAt)).limit(5);

    const recentNotifications = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt)).limit(5);

    let totalRevenue = '0';
    let totalExpense = '0';
    if (role === 'admin' || role === 'ceo' || role === 'manager') {
      // Get first day of current month
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      
      const revenueResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(businessSales).where(and(eq(businessSales.type, 'revenue'), gte(businessSales.saleDate, firstDayOfMonth)));
      const expenseResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
        .from(businessSales).where(and(eq(businessSales.type, 'expense'), gte(businessSales.saleDate, firstDayOfMonth)));
      totalRevenue = revenueResult[0]?.total || '0';
      totalExpense = expenseResult[0]?.total || '0';
    }

    const aiLogCount = await db.select({ count: sql<number>`count(*)` }).from(aiLogs)
      .where(eq(aiLogs.userId, userId));

    const seoArticleCount = await db.select({ count: sql<number>`count(*)` }).from(seoArticles);
    const publishedArticleCount = await db.select({ count: sql<number>`count(*)` }).from(seoArticles)
      .where(eq(seoArticles.status, 'published'));

    return {
      customers: Number(customerCount[0]?.count || 0),
      tasks: Number(taskCount[0]?.count || 0),
      pendingTasks: Number(pendingTasks[0]?.count || 0),
      unreadNotifications: Number(unreadNotifications[0]?.count || 0),
      todayMemos,
      recentTasks,
      recentNotifications,
      totalRevenue,
      totalExpense,
      aiLogCount: Number(aiLogCount[0]?.count || 0),
      seoArticleCount: Number(seoArticleCount[0]?.count || 0),
      publishedArticleCount: Number(publishedArticleCount[0]?.count || 0),
    };
  },

  async getBusinesses(): Promise<Business[]> {
    return db.select().from(businesses).orderBy(desc(businesses.createdAt));
  },

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  },

  async createBusiness(data: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(data).returning();
    return business;
  },

  async updateBusiness(id: string, data: Partial<InsertBusiness>): Promise<Business | undefined> {
    const [business] = await db.update(businesses).set({ ...data, updatedAt: new Date() }).where(eq(businesses.id, id)).returning();
    return business;
  },

  async deleteBusiness(id: string): Promise<boolean> {
    // Delete related records first to avoid foreign key constraint violations
    await db.execute(sql`DELETE FROM contracts WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM budgets WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM campaigns WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM business_sales WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM competitor_comparisons WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM deals WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM differentiation_factors WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM differentiation_initiatives WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM employee_profiles WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM expense_reports WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM investments WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM indicators WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM invoices WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM job_postings WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM journal_entries WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM kpis WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM meetings WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM payroll_business_allocations WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM payroll_runs WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM performance_snapshots WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM positioning_canvases WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM projects WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM quotes WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM shifts WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM social_posts WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM swot_profiles WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM transactions WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM workflow_executions WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM calendar_events WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM expenses WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM attendance_records WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM inventory_items WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM saved_reports WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM ai_proposals WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM backlink_prospects WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM content_briefs WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM daily_growth_actions WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM daily_sales_actions WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM dm_campaigns WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM growth_initiatives WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM intel_reports WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM local_profiles WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM sales_automation_campaigns WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM sales_forecasts WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM seo_keywords WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM social_accounts WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM seo_articles WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM publishing_targets WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM web_search_history WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM agencies WHERE business_id = ${id}`);
    await db.execute(sql`DELETE FROM business_competitors WHERE business_id = ${id}`);
    // Finally delete the business itself
    await db.delete(businesses).where(eq(businesses.id, id));
    return true;
  },

  async getMemos(userId: number, startDate?: Date, endDate?: Date): Promise<Memo[]> {
    if (startDate && endDate) {
      return db.select().from(memos)
        .where(and(eq(memos.userId, userId), gte(memos.date, startDate), lte(memos.date, endDate)))
        .orderBy(desc(memos.date));
    }
    return db.select().from(memos).where(eq(memos.userId, userId)).orderBy(desc(memos.date));
  },

  async createMemo(data: InsertMemo): Promise<Memo> {
    const [memo] = await db.insert(memos).values(data).returning();
    return memo;
  },

  async updateMemo(id: number, data: Partial<InsertMemo>): Promise<Memo | undefined> {
    const [memo] = await db.update(memos).set({ ...data, updatedAt: new Date() }).where(eq(memos.id, id)).returning();
    return memo;
  },

  async deleteMemo(id: number): Promise<boolean> {
    await db.delete(memos).where(eq(memos.id, id));
    return true;
  },

  async getBusinessSales(businessId: string, userId?: number): Promise<BusinessSale[]> {
    if (userId) {
      return db.select().from(businessSales)
        .where(and(eq(businessSales.businessId, businessId), eq(businessSales.createdBy, userId)))
        .orderBy(desc(businessSales.saleDate));
    }
    return db.select().from(businessSales)
      .where(eq(businessSales.businessId, businessId))
      .orderBy(desc(businessSales.saleDate));
  },

  async createBusinessSale(data: InsertBusinessSale): Promise<BusinessSale> {
    const saleData = {
      ...data,
      saleDate: data.saleDate ? new Date(data.saleDate as any) : new Date(),
    };
    const [sale] = await db.insert(businessSales).values(saleData).returning();
    return sale;
  },

  async deleteBusinessSale(id: number): Promise<boolean> {
    await db.delete(businessSales).where(eq(businessSales.id, id));
    return true;
  },

  async getBusinessTotals(businessId: string): Promise<{ revenue: number; expenses: number }> {
    const sales = await db.select().from(businessSales).where(eq(businessSales.businessId, businessId));
    let revenue = 0;
    let expenses = 0;
    for (const sale of sales) {
      const amount = parseFloat(sale.amount) || 0;
      if (sale.type === 'revenue') {
        revenue += amount;
      } else {
        expenses += amount;
      }
    }
    return { revenue, expenses };
  },

  async createAiLog(data: InsertAiLog): Promise<AiLog> {
    const [log] = await db.insert(aiLogs).values(data).returning();
    return log;
  },

  async getAiLogs(userId: number): Promise<AiLog[]> {
    return db.select().from(aiLogs)
      .where(eq(aiLogs.userId, userId))
      .orderBy(desc(aiLogs.createdAt))
      .limit(100);
  },

  async getSeoCategories(): Promise<SeoCategory[]> {
    return db.select().from(seoCategories).orderBy(seoCategories.name);
  },

  async createSeoCategory(data: InsertSeoCategory): Promise<SeoCategory> {
    const [category] = await db.insert(seoCategories).values(data).returning();
    return category;
  },

  async deleteSeoCategory(id: number): Promise<boolean> {
    await db.update(seoArticles).set({ categoryId: null }).where(eq(seoArticles.categoryId, id));
    await db.delete(seoCategories).where(eq(seoCategories.id, id));
    return true;
  },

  async getSeoArticles(): Promise<SeoArticle[]> {
    return db.select().from(seoArticles).orderBy(desc(seoArticles.createdAt));
  },

  async getPublishedSeoArticles(): Promise<SeoArticle[]> {
    return db.select().from(seoArticles)
      .where(eq(seoArticles.isPublished, true))
      .orderBy(desc(seoArticles.publishedAt));
  },

  async getSeoArticle(id: string): Promise<SeoArticle | undefined> {
    const [article] = await db.select().from(seoArticles).where(eq(seoArticles.id, id));
    return article;
  },

  async getSeoArticleBySlug(slug: string): Promise<SeoArticle | undefined> {
    const [article] = await db.select().from(seoArticles).where(eq(seoArticles.slug, slug));
    return article;
  },

  async createSeoArticle(data: Omit<InsertSeoArticle, 'id' | 'slug'> & { slug?: string }): Promise<SeoArticle> {
    const id = `seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = data.slug || `article-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const [article] = await db.insert(seoArticles).values({ ...data, id, slug } as InsertSeoArticle).returning();
    return article;
  },

  async updateSeoArticle(id: string, data: Partial<InsertSeoArticle>): Promise<SeoArticle | undefined> {
    const [article] = await db.update(seoArticles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(seoArticles.id, id))
      .returning();
    return article;
  },

  async deleteSeoArticle(id: string): Promise<boolean> {
    await db.delete(seoArticles).where(eq(seoArticles.id, id));
    return true;
  },

  async publishSeoArticle(id: string): Promise<SeoArticle | undefined> {
    const [article] = await db.update(seoArticles)
      .set({ isPublished: true, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(seoArticles.id, id))
      .returning();
    return article;
  },

  async unpublishSeoArticle(id: string): Promise<SeoArticle | undefined> {
    const [article] = await db.update(seoArticles)
      .set({ isPublished: false, publishedAt: null, updatedAt: new Date() })
      .where(eq(seoArticles.id, id))
      .returning();
    return article;
  },

  async updateIndexingStatus(id: string, status: string): Promise<SeoArticle | undefined> {
    const [article] = await db.update(seoArticles)
      .set({ indexingStatus: status, indexedAt: status === 'sent' ? new Date() : null, updatedAt: new Date() })
      .where(eq(seoArticles.id, id))
      .returning();
    return article;
  },

  async getSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting?.value || null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    await db.insert(systemSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({ target: systemSettings.key, set: { value, updatedAt: new Date() } });
  },

  async getAllSettings(): Promise<SystemSetting[]> {
    return db.select().from(systemSettings);
  },

  // Lead management
  async getLeads(filters?: { status?: string; source?: string; search?: string }): Promise<Lead[]> {
    let query = db.select().from(leads);
    if (filters?.status) {
      query = query.where(eq(leads.status, filters.status)) as any;
    }
    if (filters?.source) {
      query = query.where(eq(leads.source, filters.source)) as any;
    }
    if (filters?.search) {
      query = query.where(
        or(
          ilike(leads.name, `%${filters.search}%`),
          ilike(leads.company, `%${filters.search}%`),
          ilike(leads.email, `%${filters.search}%`),
          ilike(leads.phone, `%${filters.search}%`)
        )
      ) as any;
    }
    return query.orderBy(desc(leads.createdAt));
  },

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  },

  async createLead(data: InsertLead): Promise<Lead> {
    const id = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const [lead] = await db.insert(leads).values({ ...data, id }).returning();
    return lead;
  },

  async updateLead(id: string, data: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db.update(leads).set({ ...data, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    return lead;
  },

  async deleteLead(id: string): Promise<boolean> {
    await db.delete(leadActivities).where(eq(leadActivities.leadId, id));
    await db.delete(leads).where(eq(leads.id, id));
    return true;
  },

  async createLeadActivity(data: InsertLeadActivity): Promise<LeadActivity> {
    const [activity] = await db.insert(leadActivities).values(data).returning();
    // Update last contacted timestamp
    await db.update(leads).set({ lastContactedAt: new Date(), updatedAt: new Date() }).where(eq(leads.id, data.leadId));
    return activity;
  },

  async getLeadActivities(leadId: string): Promise<LeadActivity[]> {
    return db.select().from(leadActivities).where(eq(leadActivities.leadId, leadId)).orderBy(desc(leadActivities.createdAt));
  },

  async bulkCreateLeads(dataList: InsertLead[]): Promise<Lead[]> {
    const leadsToInsert = dataList.map(data => ({
      ...data,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));
    const result = await db.insert(leads).values(leadsToInsert).returning();
    return result;
  },

  // AI Conversations (Memory)
  async getAiConversations(userId: number, limit: number = 50): Promise<AiConversation[]> {
    return db.select().from(aiConversations)
      .where(eq(aiConversations.userId, userId))
      .orderBy(desc(aiConversations.createdAt))
      .limit(limit);
  },

  async addAiConversation(data: InsertAiConversation): Promise<AiConversation> {
    const [conversation] = await db.insert(aiConversations).values(data).returning();
    return conversation;
  },

  async clearAiConversations(userId: number): Promise<boolean> {
    await db.delete(aiConversations).where(eq(aiConversations.userId, userId));
    return true;
  },

  // AI Knowledge Base
  async getAiKnowledge(activeOnly: boolean = true): Promise<AiKnowledge[]> {
    if (activeOnly) {
      return db.select().from(aiKnowledge)
        .where(eq(aiKnowledge.isActive, true))
        .orderBy(aiKnowledge.category, aiKnowledge.title);
    }
    return db.select().from(aiKnowledge).orderBy(aiKnowledge.category, aiKnowledge.title);
  },

  async addAiKnowledge(data: InsertAiKnowledge): Promise<AiKnowledge> {
    const [knowledge] = await db.insert(aiKnowledge).values(data).returning();
    return knowledge;
  },

  async updateAiKnowledge(id: number, data: Partial<InsertAiKnowledge>): Promise<AiKnowledge | undefined> {
    const [knowledge] = await db.update(aiKnowledge)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(aiKnowledge.id, id))
      .returning();
    return knowledge;
  },

  async deleteAiKnowledge(id: number): Promise<boolean> {
    await db.delete(aiKnowledge).where(eq(aiKnowledge.id, id));
    return true;
  },

  // Client Projects
  async getClientProjects(): Promise<ClientProject[]> {
    return db.select().from(clientProjects).orderBy(desc(clientProjects.createdAt));
  },

  async createClientProject(data: InsertClientProject): Promise<ClientProject> {
    const projectData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate as any) : null,
      endDate: data.endDate ? new Date(data.endDate as any) : null,
    };
    const [project] = await db.insert(clientProjects).values(projectData).returning();
    return project;
  },

  async updateClientProject(id: number, data: Partial<InsertClientProject>): Promise<ClientProject | undefined> {
    const [project] = await db.update(clientProjects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientProjects.id, id))
      .returning();
    return project;
  },

  async deleteClientProject(id: number): Promise<boolean> {
    await db.delete(clientProjects).where(eq(clientProjects.id, id));
    return true;
  },

  // Client Invoices
  async getClientInvoices(): Promise<ClientInvoice[]> {
    return db.select().from(clientInvoices).orderBy(desc(clientInvoices.createdAt));
  },

  async createClientInvoice(data: InsertClientInvoice): Promise<ClientInvoice> {
    const invoiceData = {
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate as any) : new Date(),
      paidDate: data.paidDate ? new Date(data.paidDate as any) : null,
    };
    const [invoice] = await db.insert(clientInvoices).values(invoiceData).returning();
    return invoice;
  },

  async updateClientInvoice(id: number, data: Partial<InsertClientInvoice>): Promise<ClientInvoice | undefined> {
    const [invoice] = await db.update(clientInvoices)
      .set(data)
      .where(eq(clientInvoices.id, id))
      .returning();
    return invoice;
  },

  async deleteClientInvoice(id: number): Promise<boolean> {
    await db.delete(clientInvoices).where(eq(clientInvoices.id, id));
    return true;
  },

  // Companies
  async getCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  },

  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  },

  async createCompany(data: InsertCompany): Promise<Company> {
    const companyData = {
      ...data,
      establishedDate: data.establishedDate ? new Date(data.establishedDate as any) : null,
    };
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  },

  async updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.establishedDate) {
      updateData.establishedDate = new Date(data.establishedDate as any);
    }
    const [company] = await db.update(companies)
      .set(updateData)
      .where(eq(companies.id, id))
      .returning();
    return company;
  },

  async deleteCompany(id: string): Promise<boolean> {
    // Delete related records first to avoid foreign key constraint violations
    await db.execute(sql`UPDATE businesses SET company_id = NULL WHERE company_id = ${id}`);
    await db.execute(sql`DELETE FROM saved_reports WHERE company_id = ${id}`);
    await db.delete(companies).where(eq(companies.id, id));
    return true;
  },

  // Quick Notes
  async getQuickNotes(userId: number): Promise<QuickNote[]> {
    return db.select().from(quickNotes)
      .where(eq(quickNotes.userId, userId))
      .orderBy(desc(quickNotes.isPinned), desc(quickNotes.updatedAt));
  },

  async createQuickNote(data: InsertQuickNote): Promise<QuickNote> {
    const [note] = await db.insert(quickNotes).values(data).returning();
    return note;
  },

  async updateQuickNote(id: number, data: Partial<InsertQuickNote>): Promise<QuickNote | undefined> {
    const [note] = await db.update(quickNotes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(quickNotes.id, id))
      .returning();
    return note;
  },

  async deleteQuickNote(id: number): Promise<boolean> {
    await db.delete(quickNotes).where(eq(quickNotes.id, id));
    return true;
  },

  // Investments
  async getInvestments(businessId?: string, userId?: number): Promise<Investment[]> {
    const conditions = [];
    if (businessId) {
      conditions.push(eq(investments.businessId, businessId));
    }
    if (userId) {
      conditions.push(eq(investments.createdBy, userId));
    }
    if (conditions.length > 0) {
      return db.select().from(investments)
        .where(and(...conditions))
        .orderBy(desc(investments.investmentDate));
    }
    return db.select().from(investments).orderBy(desc(investments.investmentDate));
  },

  async createInvestment(data: InsertInvestment): Promise<Investment> {
    const [investment] = await db.insert(investments).values(data).returning();
    return investment;
  },

  async deleteInvestment(id: number): Promise<boolean> {
    await db.delete(investments).where(eq(investments.id, id));
    return true;
  },

  async getInvestmentTotals(): Promise<{ total: number }> {
    const result = await db.select({
      total: sql<number>`COALESCE(SUM(${investments.amount}), 0)`,
    }).from(investments);
    return { total: parseFloat(String(result[0]?.total || 0)) };
  },

  // Affiliate tracking
  async getAffiliateByCode(code: string): Promise<any> {
    const [affiliate] = await db.select().from(staffAffiliates).where(eq(staffAffiliates.affiliateCode, code));
    return affiliate;
  },

  async incrementAffiliateClicks(id: number): Promise<void> {
    await db.update(staffAffiliates)
      .set({ totalClicks: sql`COALESCE(${staffAffiliates.totalClicks}, 0) + 1` })
      .where(eq(staffAffiliates.id, id));
  },
};
