import { db } from './db';
import { users, customers, tasks, notifications, chatMessages, employees, agencySales, businesses, businessSales, memos, aiLogs, aiConversations, seoArticles, seoCategories, leads, leadActivities, clientProjects, clientInvoices, investments, quickNotes } from '../shared/schema';
import { eq, and, or, desc, sql, isNull, gte, lte, like, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, InsertUser, Customer, InsertCustomer, Task, InsertTask, Notification, InsertNotification, ChatMessage, InsertChatMessage, Employee, InsertEmployee, AgencySale, InsertAgencySale, Business, InsertBusiness, BusinessSale, InsertBusinessSale, Memo, InsertMemo, AiLog, InsertAiLog, AiConversation, InsertAiConversation, SeoArticle, InsertSeoArticle, SeoCategory, InsertSeoCategory, Lead, InsertLead, LeadActivity, InsertLeadActivity, ClientProject, InsertClientProject, ClientInvoice, InsertClientInvoice, Investment, InsertInvestment, QuickNote, InsertQuickNote } from '../shared/schema';

export function createTenantStorage(companyId: string | null, options?: { allowGlobal?: boolean }) {
  const requiresTenantScope = !options?.allowGlobal;
  
  const assertTenantScope = () => {
    if (requiresTenantScope && !companyId) {
      throw new Error('Tenant scope required but companyId is null');
    }
  };

  return {
    companyId,
    hasTenantScope: !!companyId,

    async getAllUsers(): Promise<User[]> {
      if (companyId) {
        return db.select().from(users).where(eq(users.companyId, companyId)).orderBy(desc(users.createdAt));
      }
      return db.select().from(users).orderBy(desc(users.createdAt));
    },

    async getUsersByRole(role: string): Promise<User[]> {
      if (companyId) {
        return db.select().from(users).where(and(eq(users.companyId, companyId), eq(users.role, role)));
      }
      return db.select().from(users).where(eq(users.role, role));
    },

    async getCustomers(userId?: number, role?: string): Promise<Customer[]> {
      const companyFilter = companyId ? eq(customers.companyId, companyId) : undefined;
      
      if (role === 'admin' || role === 'ceo' || role === 'manager') {
        if (companyFilter) {
          return db.select().from(customers).where(companyFilter).orderBy(desc(customers.createdAt));
        }
        return db.select().from(customers).orderBy(desc(customers.createdAt));
      }
      if (userId) {
        const userFilter = eq(customers.assignedTo, userId);
        if (companyFilter) {
          return db.select().from(customers).where(and(companyFilter, userFilter)).orderBy(desc(customers.createdAt));
        }
        return db.select().from(customers).where(userFilter).orderBy(desc(customers.createdAt));
      }
      return [];
    },

    async createCustomer(data: InsertCustomer): Promise<Customer> {
      const customerData = companyId ? { ...data, companyId } : data;
      const [customer] = await db.insert(customers).values(customerData).returning();
      return customer;
    },

    async getTasks(userId?: number, role?: string): Promise<Task[]> {
      const companyFilter = companyId ? eq(tasks.companyId, companyId) : undefined;
      
      if (role === 'admin' || role === 'ceo' || role === 'manager') {
        if (companyFilter) {
          return db.select().from(tasks).where(companyFilter).orderBy(desc(tasks.createdAt));
        }
        return db.select().from(tasks).orderBy(desc(tasks.createdAt));
      }
      if (userId) {
        const userFilter = or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId));
        if (companyFilter) {
          return db.select().from(tasks).where(and(companyFilter, userFilter!)).orderBy(desc(tasks.createdAt));
        }
        return db.select().from(tasks).where(userFilter).orderBy(desc(tasks.createdAt));
      }
      return [];
    },

    async createTask(data: InsertTask): Promise<Task> {
      const taskData = companyId ? { ...data, companyId } : data;
      const [task] = await db.insert(tasks).values(taskData).returning();
      return task;
    },

    async getBusinesses(): Promise<Business[]> {
      if (companyId) {
        return db.select().from(businesses).where(eq(businesses.companyId, companyId)).orderBy(desc(businesses.createdAt));
      }
      return db.select().from(businesses).orderBy(desc(businesses.createdAt));
    },

    async createBusiness(data: InsertBusiness): Promise<Business> {
      const businessData = companyId ? { ...data, companyId } : data;
      const [business] = await db.insert(businesses).values(businessData).returning();
      return business;
    },

    async getBusinessSales(businessId: string): Promise<BusinessSale[]> {
      return db.select().from(businessSales).where(eq(businessSales.businessId, businessId)).orderBy(desc(businessSales.saleDate));
    },

    async createBusinessSale(data: InsertBusinessSale): Promise<BusinessSale> {
      const [sale] = await db.insert(businessSales).values(data).returning();
      return sale;
    },

    async getLeads(userId?: number, role?: string): Promise<Lead[]> {
      const companyFilter = companyId ? eq(leads.companyId, companyId) : undefined;
      
      if (role === 'admin' || role === 'ceo' || role === 'manager') {
        if (companyFilter) {
          return db.select().from(leads).where(companyFilter).orderBy(desc(leads.createdAt));
        }
        return db.select().from(leads).orderBy(desc(leads.createdAt));
      }
      if (userId) {
        const userFilter = eq(leads.assignedTo, String(userId));
        if (companyFilter) {
          return db.select().from(leads).where(and(companyFilter, userFilter)).orderBy(desc(leads.createdAt));
        }
        return db.select().from(leads).where(userFilter).orderBy(desc(leads.createdAt));
      }
      return [];
    },

    async createLead(data: InsertLead): Promise<Lead> {
      const leadData = companyId ? { ...data, companyId } : data;
      const [lead] = await db.insert(leads).values(leadData).returning();
      return lead;
    },

    async getEmployees(): Promise<Employee[]> {
      if (companyId) {
        return db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(desc(employees.createdAt));
      }
      return db.select().from(employees).orderBy(desc(employees.createdAt));
    },

    async createEmployee(data: InsertEmployee): Promise<Employee> {
      const employeeData = companyId ? { ...data, companyId } : data;
      const [employee] = await db.insert(employees).values(employeeData).returning();
      return employee;
    },

    async getAgencySales(): Promise<AgencySale[]> {
      if (companyId) {
        return db.select().from(agencySales).where(eq(agencySales.companyId, companyId)).orderBy(desc(agencySales.createdAt));
      }
      return db.select().from(agencySales).orderBy(desc(agencySales.createdAt));
    },

    async createAgencySale(data: InsertAgencySale): Promise<AgencySale> {
      const saleData = companyId ? { ...data, companyId } : data;
      const [sale] = await db.insert(agencySales).values(saleData).returning();
      return sale;
    },

    async getSeoArticles(): Promise<SeoArticle[]> {
      if (companyId) {
        return db.select().from(seoArticles).where(eq(seoArticles.companyId, companyId)).orderBy(desc(seoArticles.createdAt));
      }
      return db.select().from(seoArticles).orderBy(desc(seoArticles.createdAt));
    },

    async createSeoArticle(data: InsertSeoArticle): Promise<SeoArticle> {
      const articleData = companyId ? { ...data, companyId } : data;
      const [article] = await db.insert(seoArticles).values(articleData).returning();
      return article;
    },

    async getSeoCategories(): Promise<SeoCategory[]> {
      if (companyId) {
        return db.select().from(seoCategories).where(eq(seoCategories.companyId, companyId)).orderBy(seoCategories.name);
      }
      return db.select().from(seoCategories).orderBy(seoCategories.name);
    },

    async createSeoCategory(data: InsertSeoCategory): Promise<SeoCategory> {
      const categoryData = companyId ? { ...data, companyId } : data;
      const [category] = await db.insert(seoCategories).values(categoryData).returning();
      return category;
    },

    async getMemos(date: Date): Promise<Memo[]> {
      const dateFilter = eq(memos.date, date);
      if (companyId) {
        return db.select().from(memos).where(and(eq(memos.companyId, companyId), dateFilter));
      }
      return db.select().from(memos).where(dateFilter);
    },

    async createMemo(data: InsertMemo): Promise<Memo> {
      const memoData = companyId ? { ...data, companyId } : data;
      const [memo] = await db.insert(memos).values(memoData).returning();
      return memo;
    },

    async getNotifications(userId: number): Promise<Notification[]> {
      return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
    },

    async getChatMessages(userId: number, otherUserId: number): Promise<ChatMessage[]> {
      return db.select().from(chatMessages).where(
        or(
          and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, otherUserId)),
          and(eq(chatMessages.senderId, otherUserId), eq(chatMessages.receiverId, userId))
        )
      ).orderBy(chatMessages.createdAt);
    },

    async getInvestments(): Promise<Investment[]> {
      if (companyId) {
        return db.select().from(investments).where(eq(investments.companyId, companyId)).orderBy(desc(investments.investmentDate));
      }
      return db.select().from(investments).orderBy(desc(investments.investmentDate));
    },

    async createInvestment(data: InsertInvestment): Promise<Investment> {
      const investmentData = companyId ? { ...data, companyId } : data;
      const [investment] = await db.insert(investments).values(investmentData).returning();
      return investment;
    },

    async getQuickNotes(): Promise<QuickNote[]> {
      if (companyId) {
        return db.select().from(quickNotes).where(eq(quickNotes.companyId, companyId)).orderBy(desc(quickNotes.createdAt));
      }
      return db.select().from(quickNotes).orderBy(desc(quickNotes.createdAt));
    },

    async createQuickNote(data: InsertQuickNote): Promise<QuickNote> {
      const noteData = companyId ? { ...data, companyId } : data;
      const [note] = await db.insert(quickNotes).values(noteData).returning();
      return note;
    },

    async getClientProjects(clientId?: number): Promise<ClientProject[]> {
      const companyFilter = companyId ? eq(clientProjects.companyId, companyId) : undefined;
      
      if (clientId) {
        const clientFilter = eq(clientProjects.clientId, clientId);
        if (companyFilter) {
          return db.select().from(clientProjects).where(and(companyFilter, clientFilter)).orderBy(desc(clientProjects.createdAt));
        }
        return db.select().from(clientProjects).where(clientFilter).orderBy(desc(clientProjects.createdAt));
      }
      
      if (companyFilter) {
        return db.select().from(clientProjects).where(companyFilter).orderBy(desc(clientProjects.createdAt));
      }
      return db.select().from(clientProjects).orderBy(desc(clientProjects.createdAt));
    },

    async createClientProject(data: InsertClientProject): Promise<ClientProject> {
      const projectData = companyId ? { ...data, companyId } : data;
      const [project] = await db.insert(clientProjects).values(projectData).returning();
      return project;
    },

    async getClientInvoices(clientId?: number): Promise<ClientInvoice[]> {
      const companyFilter = companyId ? eq(clientInvoices.companyId, companyId) : undefined;
      
      if (clientId) {
        const clientFilter = eq(clientInvoices.clientId, clientId);
        if (companyFilter) {
          return db.select().from(clientInvoices).where(and(companyFilter, clientFilter)).orderBy(desc(clientInvoices.createdAt));
        }
        return db.select().from(clientInvoices).where(clientFilter).orderBy(desc(clientInvoices.createdAt));
      }
      
      if (companyFilter) {
        return db.select().from(clientInvoices).where(companyFilter).orderBy(desc(clientInvoices.createdAt));
      }
      return db.select().from(clientInvoices).orderBy(desc(clientInvoices.createdAt));
    },

    async createClientInvoice(data: InsertClientInvoice): Promise<ClientInvoice> {
      const invoiceData = companyId ? { ...data, companyId } : data;
      const [invoice] = await db.insert(clientInvoices).values(invoiceData).returning();
      return invoice;
    },

    async getAiLogs(userId: number): Promise<AiLog[]> {
      return db.select().from(aiLogs).where(eq(aiLogs.userId, userId)).orderBy(desc(aiLogs.createdAt));
    },

    async createAiLog(data: InsertAiLog): Promise<AiLog> {
      const logData = companyId ? { ...data, companyId } : data;
      const [log] = await db.insert(aiLogs).values(logData).returning();
      return log;
    },

    async getAiConversations(userId: number): Promise<AiConversation[]> {
      return db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.createdAt));
    },

    async createAiConversation(data: InsertAiConversation): Promise<AiConversation> {
      const conversationData = companyId ? { ...data, companyId } : data;
      const [conversation] = await db.insert(aiConversations).values(conversationData).returning();
      return conversation;
    },

    async getDashboardStats(userId: number, role: string) {
      const companyFilter = companyId ? eq(customers.companyId, companyId) : undefined;
      const taskCompanyFilter = companyId ? eq(tasks.companyId, companyId) : undefined;
      const businessCompanyFilter = companyId ? eq(businesses.companyId, companyId) : undefined;
      const seoCompanyFilter = companyId ? eq(seoArticles.companyId, companyId) : undefined;

      // Customer count (tenant-scoped)
      const customerCount = role === 'admin' || role === 'ceo' || role === 'manager'
        ? companyFilter 
          ? await db.select({ count: sql<number>`count(*)` }).from(customers).where(companyFilter)
          : await db.select({ count: sql<number>`count(*)` }).from(customers)
        : await db.select({ count: sql<number>`count(*)` }).from(customers).where(
            companyFilter 
              ? and(companyFilter, eq(customers.assignedTo, userId))
              : eq(customers.assignedTo, userId)
          );

      // Task count (tenant-scoped)
      const taskCount = role === 'admin' || role === 'ceo' || role === 'manager'
        ? taskCompanyFilter
          ? await db.select({ count: sql<number>`count(*)` }).from(tasks).where(taskCompanyFilter)
          : await db.select({ count: sql<number>`count(*)` }).from(tasks)
        : await db.select({ count: sql<number>`count(*)` }).from(tasks).where(
            taskCompanyFilter
              ? and(taskCompanyFilter, or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
              : or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId))
          );

      // Pending tasks (tenant-scoped)
      const pendingTasks = role === 'admin' || role === 'ceo' || role === 'manager'
        ? taskCompanyFilter
          ? await db.select({ count: sql<number>`count(*)` }).from(tasks).where(and(taskCompanyFilter, eq(tasks.status, 'pending')))
          : await db.select({ count: sql<number>`count(*)` }).from(tasks).where(eq(tasks.status, 'pending'))
        : await db.select({ count: sql<number>`count(*)` }).from(tasks).where(
            taskCompanyFilter
              ? and(taskCompanyFilter, eq(tasks.status, 'pending'), or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
              : and(eq(tasks.status, 'pending'), or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
          );

      // Unread notifications (user-specific, not tenant-scoped)
      const unreadNotifications = await db.select({ count: sql<number>`count(*)` }).from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

      // Today's memos (user-specific)
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

      // Recent tasks (tenant-scoped)
      const recentTasks = role === 'admin' || role === 'ceo' || role === 'manager'
        ? taskCompanyFilter
          ? await db.select().from(tasks).where(taskCompanyFilter).orderBy(desc(tasks.createdAt)).limit(5)
          : await db.select().from(tasks).orderBy(desc(tasks.createdAt)).limit(5)
        : await db.select().from(tasks)
            .where(
              taskCompanyFilter
                ? and(taskCompanyFilter, or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId)))
                : or(eq(tasks.assignedTo, userId), eq(tasks.createdBy, userId))
            )
            .orderBy(desc(tasks.createdAt)).limit(5);

      // Recent notifications (user-specific)
      const recentNotifications = await db.select().from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt)).limit(5);

      // Revenue and expense (tenant-scoped via business)
      let totalRevenue = '0';
      let totalExpense = '0';
      if (role === 'admin' || role === 'ceo' || role === 'manager') {
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);

        if (businessCompanyFilter) {
          // Get business IDs for this tenant first
          const tenantBusinesses = await db.select({ id: businesses.id }).from(businesses).where(businessCompanyFilter);
          const businessIds = tenantBusinesses.map(b => b.id);
          
          if (businessIds.length > 0) {
            const revenueResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
              .from(businessSales)
              .where(and(
                eq(businessSales.type, 'revenue'),
                gte(businessSales.saleDate, firstDayOfMonth),
                sql`${businessSales.businessId} IN (${sql.join(businessIds.map(id => sql`${id}`), sql`, `)})`
              ));
            const expenseResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
              .from(businessSales)
              .where(and(
                eq(businessSales.type, 'expense'),
                gte(businessSales.saleDate, firstDayOfMonth),
                sql`${businessSales.businessId} IN (${sql.join(businessIds.map(id => sql`${id}`), sql`, `)})`
              ));
            totalRevenue = revenueResult[0]?.total || '0';
            totalExpense = expenseResult[0]?.total || '0';
          }
        } else {
          const revenueResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
            .from(businessSales).where(and(eq(businessSales.type, 'revenue'), gte(businessSales.saleDate, firstDayOfMonth)));
          const expenseResult = await db.select({ total: sql<string>`COALESCE(SUM(amount), 0)` })
            .from(businessSales).where(and(eq(businessSales.type, 'expense'), gte(businessSales.saleDate, firstDayOfMonth)));
          totalRevenue = revenueResult[0]?.total || '0';
          totalExpense = expenseResult[0]?.total || '0';
        }
      }

      // AI log count (user-specific)
      const aiLogCount = await db.select({ count: sql<number>`count(*)` }).from(aiLogs)
        .where(eq(aiLogs.userId, userId));

      // SEO article count (tenant-scoped)
      const seoArticleCount = seoCompanyFilter
        ? await db.select({ count: sql<number>`count(*)` }).from(seoArticles).where(seoCompanyFilter)
        : await db.select({ count: sql<number>`count(*)` }).from(seoArticles);
      const publishedArticleCount = seoCompanyFilter
        ? await db.select({ count: sql<number>`count(*)` }).from(seoArticles).where(and(seoCompanyFilter, eq(seoArticles.status, 'published')))
        : await db.select({ count: sql<number>`count(*)` }).from(seoArticles).where(eq(seoArticles.status, 'published'));

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
  };
}

export type TenantStorage = ReturnType<typeof createTenantStorage>;
