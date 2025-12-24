import { db } from './db';
import { users, customers, tasks, notifications, chatMessages, employees, agencySales, agencyIncentives, businesses, businessSales, memos, aiLogs, aiConversations, aiKnowledge, seoArticles, seoCategories, leads, leadActivities, clientProjects, clientInvoices, investments, quickNotes, marketingCampaigns, siteCredentials, staffSalaries, staffShifts, advancePayments, taskEvidence, staffAffiliates, staffMemos, businessDesigns } from '../shared/schema';
import { eq, and, or, desc, sql, isNull, gte, lte, like, ilike } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, InsertUser, Customer, InsertCustomer, Task, InsertTask, Notification, InsertNotification, ChatMessage, InsertChatMessage, Employee, InsertEmployee, AgencySale, InsertAgencySale, AgencyIncentive, InsertAgencyIncentive, Business, InsertBusiness, BusinessSale, InsertBusinessSale, Memo, InsertMemo, AiLog, InsertAiLog, AiConversation, InsertAiConversation, AiKnowledge, InsertAiKnowledge, SeoArticle, InsertSeoArticle, SeoCategory, InsertSeoCategory, Lead, InsertLead, LeadActivity, InsertLeadActivity, ClientProject, InsertClientProject, ClientInvoice, InsertClientInvoice, Investment, InsertInvestment, QuickNote, InsertQuickNote, MarketingCampaign, InsertMarketingCampaign, SiteCredential, InsertSiteCredential, StaffSalary, InsertStaffSalary, StaffShift, InsertStaffShift, AdvancePayment, InsertAdvancePayment, TaskEvidence, InsertTaskEvidence, StaffAffiliate, InsertStaffAffiliate, StaffMemo, InsertStaffMemo, BusinessDesign, InsertBusinessDesign } from '../shared/schema';

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

    async getBusinessSales(businessId: string, userId?: number): Promise<BusinessSale[]> {
      const conditions = [eq(businessSales.businessId, businessId)];
      if (companyId) {
        conditions.push(eq(businessSales.companyId, companyId));
      }
      if (userId) {
        conditions.push(eq(businessSales.createdBy, userId));
      }
      return db.select().from(businessSales).where(and(...conditions)).orderBy(desc(businessSales.saleDate));
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

    async getEmployeeById(employeeId: number): Promise<Employee | undefined> {
      const [employee] = await db.select().from(employees).where(eq(employees.id, employeeId));
      return employee;
    },

    async createEmployee(data: InsertEmployee): Promise<Employee> {
      const employeeNumber = data.employeeNumber && data.employeeNumber.trim() !== '' 
        ? data.employeeNumber 
        : `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const employeeData = companyId 
        ? { ...data, employeeNumber, companyId } 
        : { ...data, employeeNumber };
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

    async createSeoArticle(data: Omit<InsertSeoArticle, 'id' | 'slug'> & { slug?: string }): Promise<SeoArticle> {
      const id = `seo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const slug = data.slug || `article-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const articleData = companyId ? { ...data, id, slug, companyId } : { ...data, id, slug };
      const [article] = await db.insert(seoArticles).values(articleData as InsertSeoArticle).returning();
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

    async getInvestments(businessId?: string, userId?: number): Promise<Investment[]> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(investments.companyId, companyId));
      }
      if (businessId) {
        conditions.push(eq(investments.businessId, businessId));
      }
      if (userId) {
        conditions.push(eq(investments.createdBy, userId));
      }
      if (conditions.length > 0) {
        return db.select().from(investments).where(and(...conditions)).orderBy(desc(investments.investmentDate));
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

    async getAiLogs(userId?: number): Promise<AiLog[]> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(aiLogs.companyId, companyId));
      }
      if (userId) {
        conditions.push(eq(aiLogs.userId, userId));
      }
      if (conditions.length > 0) {
        return db.select().from(aiLogs).where(and(...conditions)).orderBy(desc(aiLogs.createdAt)).limit(100);
      }
      return db.select().from(aiLogs).orderBy(desc(aiLogs.createdAt)).limit(100);
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

    async addAiConversation(data: InsertAiConversation): Promise<AiConversation> {
      const conversationData = companyId ? { ...data, companyId } : data;
      const [conversation] = await db.insert(aiConversations).values(conversationData).returning();
      return conversation;
    },

    async clearAiConversations(userId: number): Promise<boolean> {
      if (companyId) {
        await db.delete(aiConversations).where(and(eq(aiConversations.userId, userId), eq(aiConversations.companyId, companyId)));
      } else {
        await db.delete(aiConversations).where(eq(aiConversations.userId, userId));
      }
      return true;
    },

    async getAiKnowledge(activeOnly: boolean = true, userId?: number): Promise<AiKnowledge[]> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(aiKnowledge.companyId, companyId));
      }
      if (activeOnly) {
        conditions.push(eq(aiKnowledge.isActive, true));
      }
      if (userId) {
        conditions.push(eq(aiKnowledge.createdBy, userId));
      }
      if (conditions.length > 0) {
        return db.select().from(aiKnowledge).where(and(...conditions)).orderBy(aiKnowledge.category, aiKnowledge.title);
      }
      return db.select().from(aiKnowledge).orderBy(aiKnowledge.category, aiKnowledge.title);
    },

    async addAiKnowledge(data: InsertAiKnowledge): Promise<AiKnowledge> {
      const knowledgeData = companyId ? { ...data, companyId } : data;
      const [knowledge] = await db.insert(aiKnowledge).values(knowledgeData).returning();
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

    async getMarketingCampaigns(category?: string): Promise<MarketingCampaign[]> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(marketingCampaigns.companyId, companyId));
      }
      if (category) {
        conditions.push(eq(marketingCampaigns.category, category));
      }
      if (conditions.length > 0) {
        return db.select().from(marketingCampaigns).where(and(...conditions)).orderBy(desc(marketingCampaigns.createdAt));
      }
      return db.select().from(marketingCampaigns).orderBy(desc(marketingCampaigns.createdAt));
    },

    async getMarketingCampaign(id: number): Promise<MarketingCampaign | undefined> {
      const conditions = [eq(marketingCampaigns.id, id)];
      if (companyId) {
        conditions.push(eq(marketingCampaigns.companyId, companyId));
      }
      const [campaign] = await db.select().from(marketingCampaigns).where(and(...conditions));
      return campaign;
    },

    async createMarketingCampaign(data: InsertMarketingCampaign): Promise<MarketingCampaign> {
      const campaignData = companyId ? { ...data, companyId } : data;
      const [campaign] = await db.insert(marketingCampaigns).values(campaignData).returning();
      return campaign;
    },

    async updateMarketingCampaign(id: number, data: Partial<InsertMarketingCampaign>): Promise<MarketingCampaign | undefined> {
      const conditions = [eq(marketingCampaigns.id, id)];
      if (companyId) {
        conditions.push(eq(marketingCampaigns.companyId, companyId));
      }
      const [campaign] = await db.update(marketingCampaigns)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return campaign;
    },

    async deleteMarketingCampaign(id: number): Promise<boolean> {
      const conditions = [eq(marketingCampaigns.id, id)];
      if (companyId) {
        conditions.push(eq(marketingCampaigns.companyId, companyId));
      }
      const result = await db.delete(marketingCampaigns).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getMarketingStats(category?: string): Promise<{
      totalCampaigns: number;
      activeCampaigns: number;
      totalBudget: string;
      totalSpent: string;
      totalRevenue: string;
      totalImpressions: number;
      totalClicks: number;
      totalConversions: number;
    }> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(marketingCampaigns.companyId, companyId));
      }
      if (category) {
        conditions.push(eq(marketingCampaigns.category, category));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      const activeConditions = [...conditions, eq(marketingCampaigns.status, 'active')];
      const activeWhereClause = and(...activeConditions);
      
      const totalResult = whereClause 
        ? await db.select({ count: sql<number>`count(*)` }).from(marketingCampaigns).where(whereClause)
        : await db.select({ count: sql<number>`count(*)` }).from(marketingCampaigns);
      
      const activeResult = await db.select({ count: sql<number>`count(*)` }).from(marketingCampaigns).where(activeWhereClause);
      
      const statsResult = whereClause
        ? await db.select({
            totalBudget: sql<string>`COALESCE(SUM(budget), 0)`,
            totalSpent: sql<string>`COALESCE(SUM(spent), 0)`,
            totalRevenue: sql<string>`COALESCE(SUM(revenue), 0)`,
            totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
            totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
            totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
          }).from(marketingCampaigns).where(whereClause)
        : await db.select({
            totalBudget: sql<string>`COALESCE(SUM(budget), 0)`,
            totalSpent: sql<string>`COALESCE(SUM(spent), 0)`,
            totalRevenue: sql<string>`COALESCE(SUM(revenue), 0)`,
            totalImpressions: sql<number>`COALESCE(SUM(impressions), 0)`,
            totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
            totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
          }).from(marketingCampaigns);
      
      return {
        totalCampaigns: Number(totalResult[0]?.count || 0),
        activeCampaigns: Number(activeResult[0]?.count || 0),
        totalBudget: statsResult[0]?.totalBudget || '0',
        totalSpent: statsResult[0]?.totalSpent || '0',
        totalRevenue: statsResult[0]?.totalRevenue || '0',
        totalImpressions: Number(statsResult[0]?.totalImpressions || 0),
        totalClicks: Number(statsResult[0]?.totalClicks || 0),
        totalConversions: Number(statsResult[0]?.totalConversions || 0),
      };
    },

    // Site Credentials (サイト情報)
    async getSiteCredentials(): Promise<SiteCredential[]> {
      if (companyId) {
        return db.select().from(siteCredentials).where(eq(siteCredentials.companyId, companyId)).orderBy(desc(siteCredentials.createdAt));
      }
      return db.select().from(siteCredentials).orderBy(desc(siteCredentials.createdAt));
    },

    async getSiteCredential(id: number): Promise<SiteCredential | undefined> {
      const conditions = [eq(siteCredentials.id, id)];
      if (companyId) {
        conditions.push(eq(siteCredentials.companyId, companyId));
      }
      const [credential] = await db.select().from(siteCredentials).where(and(...conditions));
      return credential;
    },

    async createSiteCredential(data: InsertSiteCredential): Promise<SiteCredential> {
      const credentialData = companyId ? { ...data, companyId } : data;
      const [credential] = await db.insert(siteCredentials).values(credentialData).returning();
      return credential;
    },

    async updateSiteCredential(id: number, data: Partial<InsertSiteCredential>): Promise<SiteCredential | undefined> {
      const conditions = [eq(siteCredentials.id, id)];
      if (companyId) {
        conditions.push(eq(siteCredentials.companyId, companyId));
      }
      const [credential] = await db.update(siteCredentials)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return credential;
    },

    async deleteSiteCredential(id: number): Promise<boolean> {
      const conditions = [eq(siteCredentials.id, id)];
      if (companyId) {
        conditions.push(eq(siteCredentials.companyId, companyId));
      }
      const result = await db.delete(siteCredentials).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getStaffSalaries(employeeId: number): Promise<StaffSalary[]> {
      const conditions = [eq(staffSalaries.employeeId, employeeId)];
      if (companyId) {
        conditions.push(eq(staffSalaries.companyId, companyId));
      }
      return db.select().from(staffSalaries).where(and(...conditions)).orderBy(desc(staffSalaries.month));
    },

    async createStaffSalary(data: InsertStaffSalary): Promise<StaffSalary> {
      const salaryData = companyId ? { ...data, companyId } : data;
      const [salary] = await db.insert(staffSalaries).values(salaryData).returning();
      return salary;
    },

    async updateStaffSalary(id: number, data: Partial<InsertStaffSalary>): Promise<StaffSalary | undefined> {
      const conditions = [eq(staffSalaries.id, id)];
      if (companyId) {
        conditions.push(eq(staffSalaries.companyId, companyId));
      }
      const [salary] = await db.update(staffSalaries)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return salary;
    },

    async deleteStaffSalary(id: number): Promise<boolean> {
      const conditions = [eq(staffSalaries.id, id)];
      if (companyId) {
        conditions.push(eq(staffSalaries.companyId, companyId));
      }
      const result = await db.delete(staffSalaries).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getStaffShifts(employeeId: number, startDate?: Date, endDate?: Date): Promise<StaffShift[]> {
      const conditions = [eq(staffShifts.employeeId, employeeId)];
      if (companyId) {
        conditions.push(eq(staffShifts.companyId, companyId));
      }
      if (startDate) {
        conditions.push(gte(staffShifts.date, startDate));
      }
      if (endDate) {
        conditions.push(lte(staffShifts.date, endDate));
      }
      return db.select().from(staffShifts).where(and(...conditions)).orderBy(desc(staffShifts.date));
    },

    async getAllPendingShifts(): Promise<StaffShift[]> {
      const conditions: any[] = [eq(staffShifts.approvalStatus, 'pending')];
      if (companyId) {
        conditions.push(eq(staffShifts.companyId, companyId));
      }
      return db.select().from(staffShifts).where(and(...conditions)).orderBy(desc(staffShifts.date));
    },

    async getAllPendingSalaries(): Promise<StaffSalary[]> {
      const conditions: any[] = [eq(staffSalaries.status, 'pending')];
      if (companyId) {
        conditions.push(eq(staffSalaries.companyId, companyId));
      }
      return db.select().from(staffSalaries).where(and(...conditions)).orderBy(desc(staffSalaries.createdAt));
    },

    async createStaffShift(data: InsertStaffShift): Promise<StaffShift> {
      const shiftData = companyId ? { ...data, companyId } : data;
      const [shift] = await db.insert(staffShifts).values(shiftData).returning();
      return shift;
    },

    async updateStaffShift(id: number, data: Partial<InsertStaffShift>): Promise<StaffShift | undefined> {
      const conditions = [eq(staffShifts.id, id)];
      if (companyId) {
        conditions.push(eq(staffShifts.companyId, companyId));
      }
      const [shift] = await db.update(staffShifts)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return shift;
    },

    async deleteStaffShift(id: number): Promise<boolean> {
      const conditions = [eq(staffShifts.id, id)];
      if (companyId) {
        conditions.push(eq(staffShifts.companyId, companyId));
      }
      const result = await db.delete(staffShifts).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getAdvancePayments(employeeId?: number): Promise<AdvancePayment[]> {
      const conditions: any[] = [];
      if (employeeId) {
        conditions.push(eq(advancePayments.employeeId, employeeId));
      }
      if (companyId) {
        conditions.push(eq(advancePayments.companyId, companyId));
      }
      if (conditions.length === 0) {
        return db.select().from(advancePayments).orderBy(desc(advancePayments.requestedAt));
      }
      return db.select().from(advancePayments).where(and(...conditions)).orderBy(desc(advancePayments.requestedAt));
    },

    async createAdvancePayment(data: InsertAdvancePayment): Promise<AdvancePayment> {
      const paymentData = companyId ? { ...data, companyId } : data;
      const [payment] = await db.insert(advancePayments).values(paymentData).returning();
      return payment;
    },

    async updateAdvancePayment(id: number, data: Partial<InsertAdvancePayment>): Promise<AdvancePayment | undefined> {
      const conditions = [eq(advancePayments.id, id)];
      if (companyId) {
        conditions.push(eq(advancePayments.companyId, companyId));
      }
      const [payment] = await db.update(advancePayments)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return payment;
    },

    async deleteAdvancePayment(id: number): Promise<boolean> {
      const conditions = [eq(advancePayments.id, id)];
      if (companyId) {
        conditions.push(eq(advancePayments.companyId, companyId));
      }
      const result = await db.delete(advancePayments).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getTaskEvidence(taskId: number): Promise<TaskEvidence[]> {
      const conditions = [eq(taskEvidence.taskId, taskId)];
      if (companyId) {
        conditions.push(eq(taskEvidence.companyId, companyId));
      }
      return db.select().from(taskEvidence).where(and(...conditions)).orderBy(desc(taskEvidence.submittedAt));
    },

    async createTaskEvidence(data: InsertTaskEvidence): Promise<TaskEvidence> {
      const evidenceData = companyId ? { ...data, companyId } : data;
      const [evidence] = await db.insert(taskEvidence).values(evidenceData).returning();
      return evidence;
    },

    async deleteTaskEvidence(id: number): Promise<boolean> {
      const conditions = [eq(taskEvidence.id, id)];
      if (companyId) {
        conditions.push(eq(taskEvidence.companyId, companyId));
      }
      const result = await db.delete(taskEvidence).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getStaffAffiliates(employeeId?: number): Promise<StaffAffiliate[]> {
      const conditions: any[] = [];
      if (employeeId) {
        conditions.push(eq(staffAffiliates.employeeId, employeeId));
      }
      if (companyId) {
        conditions.push(eq(staffAffiliates.companyId, companyId));
      }
      if (conditions.length === 0) {
        return db.select().from(staffAffiliates).orderBy(desc(staffAffiliates.createdAt));
      }
      return db.select().from(staffAffiliates).where(and(...conditions)).orderBy(desc(staffAffiliates.createdAt));
    },

    async createStaffAffiliate(data: InsertStaffAffiliate): Promise<StaffAffiliate> {
      const affiliateData = companyId ? { ...data, companyId } : data;
      const [affiliate] = await db.insert(staffAffiliates).values(affiliateData).returning();
      return affiliate;
    },

    async updateStaffAffiliate(id: number, data: Partial<InsertStaffAffiliate>): Promise<StaffAffiliate | undefined> {
      const conditions = [eq(staffAffiliates.id, id)];
      if (companyId) {
        conditions.push(eq(staffAffiliates.companyId, companyId));
      }
      const [affiliate] = await db.update(staffAffiliates)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return affiliate;
    },

    async recordAffiliateConversion(id: number, amount: number): Promise<StaffAffiliate | undefined> {
      const conditions = [eq(staffAffiliates.id, id)];
      if (companyId) {
        conditions.push(eq(staffAffiliates.companyId, companyId));
      }
      const [affiliate] = await db.update(staffAffiliates)
        .set({
          totalConversions: sql`COALESCE(${staffAffiliates.totalConversions}, 0) + 1`,
          totalEarnings: sql`COALESCE(${staffAffiliates.totalEarnings}, 0) + ${amount}`,
          updatedAt: new Date()
        })
        .where(and(...conditions))
        .returning();
      return affiliate;
    },

    async deleteStaffAffiliate(id: number): Promise<boolean> {
      const conditions = [eq(staffAffiliates.id, id)];
      if (companyId) {
        conditions.push(eq(staffAffiliates.companyId, companyId));
      }
      const result = await db.delete(staffAffiliates).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getStaffMemos(employeeId?: number): Promise<StaffMemo[]> {
      const conditions: any[] = [];
      if (employeeId) {
        conditions.push(eq(staffMemos.employeeId, employeeId));
      }
      if (companyId) {
        conditions.push(eq(staffMemos.companyId, companyId));
      }
      if (conditions.length === 0) {
        return db.select().from(staffMemos).orderBy(desc(staffMemos.createdAt));
      }
      return db.select().from(staffMemos).where(and(...conditions)).orderBy(desc(staffMemos.createdAt));
    },

    async createStaffMemo(data: InsertStaffMemo): Promise<StaffMemo> {
      const memoData = companyId ? { ...data, companyId } : data;
      const [memo] = await db.insert(staffMemos).values(memoData).returning();
      return memo;
    },

    async updateStaffMemo(id: number, data: Partial<InsertStaffMemo>): Promise<StaffMemo | undefined> {
      const conditions = [eq(staffMemos.id, id)];
      if (companyId) {
        conditions.push(eq(staffMemos.companyId, companyId));
      }
      const [memo] = await db.update(staffMemos)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return memo;
    },

    async deleteStaffMemo(id: number): Promise<boolean> {
      const conditions = [eq(staffMemos.id, id)];
      if (companyId) {
        conditions.push(eq(staffMemos.companyId, companyId));
      }
      const result = await db.delete(staffMemos).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getTasksByUserId(userId: number): Promise<Task[]> {
      const conditions = [eq(tasks.assignedTo, userId)];
      if (companyId) {
        conditions.push(eq(tasks.companyId, companyId));
      }
      return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
    },

    async getAgencyIncentives(): Promise<AgencyIncentive[]> {
      if (companyId) {
        return db.select().from(agencyIncentives).where(eq(agencyIncentives.companyId, companyId)).orderBy(desc(agencyIncentives.createdAt));
      }
      return db.select().from(agencyIncentives).orderBy(desc(agencyIncentives.createdAt));
    },

    async createAgencyIncentive(data: InsertAgencyIncentive): Promise<AgencyIncentive> {
      const incentiveData = companyId ? { ...data, companyId } : data;
      const [incentive] = await db.insert(agencyIncentives).values(incentiveData).returning();
      return incentive;
    },

    async updateAgencyIncentive(id: number, data: Partial<InsertAgencyIncentive>): Promise<AgencyIncentive | undefined> {
      const conditions = [eq(agencyIncentives.id, id)];
      if (companyId) {
        conditions.push(eq(agencyIncentives.companyId, companyId));
      }
      const [incentive] = await db.update(agencyIncentives)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return incentive;
    },

    async deleteAgencyIncentive(id: number): Promise<boolean> {
      const conditions = [eq(agencyIncentives.id, id)];
      if (companyId) {
        conditions.push(eq(agencyIncentives.companyId, companyId));
      }
      const result = await db.delete(agencyIncentives).where(and(...conditions)).returning();
      return result.length > 0;
    },

    async getBusinessDesigns(businessId?: string): Promise<BusinessDesign[]> {
      const conditions = [];
      if (companyId) {
        conditions.push(eq(businessDesigns.companyId, companyId));
      }
      if (businessId) {
        conditions.push(eq(businessDesigns.businessId, businessId));
      }
      if (conditions.length > 0) {
        return db.select().from(businessDesigns).where(and(...conditions)).orderBy(desc(businessDesigns.createdAt));
      }
      return db.select().from(businessDesigns).orderBy(desc(businessDesigns.createdAt));
    },

    async getBusinessDesign(id: number): Promise<BusinessDesign | undefined> {
      const conditions = [eq(businessDesigns.id, id)];
      if (companyId) {
        conditions.push(eq(businessDesigns.companyId, companyId));
      }
      const [design] = await db.select().from(businessDesigns).where(and(...conditions));
      return design;
    },

    async createBusinessDesign(data: InsertBusinessDesign): Promise<BusinessDesign> {
      const designData = companyId ? { ...data, companyId } : data;
      const [design] = await db.insert(businessDesigns).values(designData).returning();
      return design;
    },

    async updateBusinessDesign(id: number, data: Partial<InsertBusinessDesign>): Promise<BusinessDesign | undefined> {
      const conditions = [eq(businessDesigns.id, id)];
      if (companyId) {
        conditions.push(eq(businessDesigns.companyId, companyId));
      }
      const [design] = await db.update(businessDesigns)
        .set({ ...data, updatedAt: new Date() })
        .where(and(...conditions))
        .returning();
      return design;
    },

    async deleteBusinessDesign(id: number): Promise<boolean> {
      const conditions = [eq(businessDesigns.id, id)];
      if (companyId) {
        conditions.push(eq(businessDesigns.companyId, companyId));
      }
      const result = await db.delete(businessDesigns).where(and(...conditions)).returning();
      return result.length > 0;
    },
  };
}

export type TenantStorage = ReturnType<typeof createTenantStorage>;
