import { db } from './db';
import { users, customers, tasks, notifications, chatMessages, chatGroups, chatGroupMembers, employees, agencySales, agencyMemos, businesses, businessSales, memos, aiLogs, aiConversations, aiKnowledge, seoArticles, seoCategories, systemSettings, leads, leadActivities, clientProjects, clientInvoices, companies, quickNotes, investments, staffAffiliates, financialEntries, agencyPaymentSettings, logisticsShippers, logisticsCompanies, logisticsVehicles, logisticsProjects, logisticsDispatch, logisticsMasterCards, logisticsQuotations, logisticsInstructions, logisticsInvoices, logisticsReceipts, logisticsPayments, logisticsCashflow, staffingJobs, staffingCandidates, staffingApplications, staffingResumes, staffingInvoices, staffingSales } from '../shared/schema';
import { eq, and, or, desc, sql, isNull, gte, lte, like, ilike, inArray } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, InsertUser, Customer, InsertCustomer, Task, InsertTask, Notification, InsertNotification, ChatMessage, InsertChatMessage, ChatGroup, InsertChatGroup, ChatGroupMember, InsertChatGroupMember, Employee, InsertEmployee, AgencySale, InsertAgencySale, AgencyMemo, InsertAgencyMemo, Business, InsertBusiness, BusinessSale, InsertBusinessSale, Memo, InsertMemo, AiLog, InsertAiLog, AiConversation, InsertAiConversation, AiKnowledge, InsertAiKnowledge, SeoArticle, InsertSeoArticle, SeoCategory, InsertSeoCategory, SystemSetting, Lead, InsertLead, LeadActivity, InsertLeadActivity, ClientProject, InsertClientProject, ClientInvoice, InsertClientInvoice, Company, InsertCompany, QuickNote, InsertQuickNote, Investment, InsertInvestment, FinancialEntry, InsertFinancialEntry, AgencyPaymentSettings, InsertAgencyPaymentSettings, LogisticsShipper, InsertLogisticsShipper, LogisticsCompany, InsertLogisticsCompany, LogisticsVehicle, InsertLogisticsVehicle, LogisticsProject, InsertLogisticsProject, LogisticsDispatch, InsertLogisticsDispatch, LogisticsMasterCard, InsertLogisticsMasterCard, LogisticsQuotation, InsertLogisticsQuotation, LogisticsInstruction, InsertLogisticsInstruction, LogisticsInvoice, InsertLogisticsInvoice, LogisticsReceipt, InsertLogisticsReceipt, LogisticsPayment, InsertLogisticsPayment, LogisticsCashflow, InsertLogisticsCashflow, StaffingJob, InsertStaffingJob, StaffingCandidate, InsertStaffingCandidate, StaffingApplication, InsertStaffingApplication, StaffingResume, InsertStaffingResume, StaffingInvoice, InsertStaffingInvoice, StaffingSale, InsertStaffingSale } from '../shared/schema';

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

  async deleteAllTasks(): Promise<number> {
    const result = await db.delete(tasks).returning();
    return result.length;
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

  async deleteNotification(id: number): Promise<boolean> {
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
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

  async getUnreadMessagesBySender(userId: number): Promise<Record<number, number>> {
    const messages = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.receiverId, userId), eq(chatMessages.isRead, false)));
    const countBySender: Record<number, number> = {};
    for (const msg of messages) {
      if (msg.senderId) {
        countBySender[msg.senderId] = (countBySender[msg.senderId] || 0) + 1;
      }
    }
    return countBySender;
  },

  async createChatGroup(data: InsertChatGroup): Promise<ChatGroup> {
    const [group] = await db.insert(chatGroups).values(data).returning();
    return group;
  },

  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    const [group] = await db.select().from(chatGroups).where(eq(chatGroups.id, id));
    return group;
  },

  async getUserChatGroups(userId: number): Promise<(ChatGroup & { memberCount: number })[]> {
    const memberGroups = await db.select({ groupId: chatGroupMembers.groupId })
      .from(chatGroupMembers)
      .where(eq(chatGroupMembers.userId, userId));
    
    if (memberGroups.length === 0) return [];
    
    const groupIds = memberGroups.map(m => m.groupId);
    const groups = await db.select().from(chatGroups).where(inArray(chatGroups.id, groupIds)).orderBy(desc(chatGroups.updatedAt));
    
    const groupsWithCount = await Promise.all(groups.map(async (group) => {
      const countResult = await db.select({ count: sql<number>`count(*)` }).from(chatGroupMembers).where(eq(chatGroupMembers.groupId, group.id));
      return { ...group, memberCount: Number(countResult[0]?.count || 0) };
    }));
    
    return groupsWithCount;
  },

  async updateChatGroup(id: number, data: Partial<InsertChatGroup>): Promise<ChatGroup | undefined> {
    const [group] = await db.update(chatGroups).set({ ...data, updatedAt: new Date() }).where(eq(chatGroups.id, id)).returning();
    return group;
  },

  async deleteChatGroup(id: number): Promise<boolean> {
    await db.delete(chatGroups).where(eq(chatGroups.id, id));
    return true;
  },

  async addChatGroupMember(groupId: number, userId: number, role: string = 'member'): Promise<ChatGroupMember> {
    const [member] = await db.insert(chatGroupMembers).values({ groupId, userId, role }).returning();
    return member;
  },

  async removeChatGroupMember(groupId: number, userId: number): Promise<boolean> {
    await db.delete(chatGroupMembers).where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.userId, userId)));
    return true;
  },

  async getChatGroupMembers(groupId: number): Promise<(ChatGroupMember & { user: User | null })[]> {
    const members = await db.select().from(chatGroupMembers)
      .leftJoin(users, eq(chatGroupMembers.userId, users.id))
      .where(eq(chatGroupMembers.groupId, groupId));
    return members.map(m => ({ ...m.chat_group_members, user: m.users }));
  },

  async isGroupMember(groupId: number, userId: number): Promise<boolean> {
    const [member] = await db.select().from(chatGroupMembers)
      .where(and(eq(chatGroupMembers.groupId, groupId), eq(chatGroupMembers.userId, userId)));
    return !!member;
  },

  async getGroupMessages(groupId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(eq(chatMessages.groupId, groupId)).orderBy(chatMessages.createdAt);
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

  async getAgencyMemos(agencyId: number): Promise<AgencyMemo[]> {
    return db.select().from(agencyMemos).where(eq(agencyMemos.agencyId, agencyId)).orderBy(desc(agencyMemos.createdAt));
  },

  async createAgencyMemo(data: InsertAgencyMemo): Promise<AgencyMemo> {
    const [memo] = await db.insert(agencyMemos).values(data).returning();
    return memo;
  },

  async deleteAgencyMemo(id: number): Promise<void> {
    await db.delete(agencyMemos).where(eq(agencyMemos.id, id));
  },

  async getAgencyPaymentSettings(agencyId: number): Promise<AgencyPaymentSettings | undefined> {
    const [settings] = await db.select().from(agencyPaymentSettings).where(eq(agencyPaymentSettings.agencyId, agencyId));
    return settings;
  },

  async createAgencyPaymentSettings(data: InsertAgencyPaymentSettings): Promise<AgencyPaymentSettings> {
    const [settings] = await db.insert(agencyPaymentSettings).values(data).returning();
    return settings;
  },

  async updateAgencyPaymentSettings(agencyId: number, data: Partial<InsertAgencyPaymentSettings>): Promise<AgencyPaymentSettings | undefined> {
    const [settings] = await db.update(agencyPaymentSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(agencyPaymentSettings.agencyId, agencyId))
      .returning();
    return settings;
  },

  async getOrCreateAgencyPaymentSettings(agencyId: number, companyId?: string): Promise<AgencyPaymentSettings> {
    const existing = await this.getAgencyPaymentSettings(agencyId);
    if (existing) return existing;
    return this.createAgencyPaymentSettings({
      agencyId,
      companyId,
      closingDay: 'end_of_month',
      payoutOffsetMonths: 2,
      payoutDay: 5,
      transferFee: '330',
    });
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

  async getFinancialEntries(statementType?: string, startDate?: Date, endDate?: Date): Promise<FinancialEntry[]> {
    const conditions = [];
    if (statementType) {
      conditions.push(eq(financialEntries.statementType, statementType));
    }
    if (startDate) {
      conditions.push(gte(financialEntries.entryDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(financialEntries.entryDate, endDate));
    }
    if (conditions.length > 0) {
      return db.select().from(financialEntries)
        .where(and(...conditions))
        .orderBy(desc(financialEntries.entryDate));
    }
    return db.select().from(financialEntries).orderBy(desc(financialEntries.entryDate));
  },

  async createFinancialEntry(data: InsertFinancialEntry): Promise<FinancialEntry> {
    const [entry] = await db.insert(financialEntries).values(data).returning();
    return entry;
  },

  async updateFinancialEntry(id: number, data: Partial<InsertFinancialEntry>): Promise<FinancialEntry | undefined> {
    const [entry] = await db.update(financialEntries)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(financialEntries.id, id))
      .returning();
    return entry;
  },

  async deleteFinancialEntry(id: number): Promise<boolean> {
    await db.delete(financialEntries).where(eq(financialEntries.id, id));
    return true;
  },

  async getFinancialEntrySummary(statementType: string, startDate?: Date, endDate?: Date): Promise<{ category: string; subCategory: string | null; total: number }[]> {
    const conditions = [eq(financialEntries.statementType, statementType)];
    if (startDate) {
      conditions.push(gte(financialEntries.entryDate, startDate));
    }
    if (endDate) {
      conditions.push(lte(financialEntries.entryDate, endDate));
    }
    const result = await db.select({
      category: financialEntries.category,
      subCategory: financialEntries.subCategory,
      total: sql<number>`COALESCE(SUM(${financialEntries.amount}), 0)`,
    }).from(financialEntries)
      .where(and(...conditions))
      .groupBy(financialEntries.category, financialEntries.subCategory);
    return result.map(r => ({
      category: r.category,
      subCategory: r.subCategory,
      total: parseFloat(String(r.total || 0)),
    }));
  },

  // ==================== LOGISTICS MODULE ====================

  // Shippers
  async getLogisticsShippers(): Promise<LogisticsShipper[]> {
    return db.select().from(logisticsShippers).orderBy(desc(logisticsShippers.createdAt));
  },

  async getLogisticsShipper(id: number): Promise<LogisticsShipper | undefined> {
    const [shipper] = await db.select().from(logisticsShippers).where(eq(logisticsShippers.id, id));
    return shipper;
  },

  async createLogisticsShipper(data: InsertLogisticsShipper): Promise<LogisticsShipper> {
    const [shipper] = await db.insert(logisticsShippers).values(data).returning();
    return shipper;
  },

  async updateLogisticsShipper(id: number, data: Partial<InsertLogisticsShipper>): Promise<LogisticsShipper | undefined> {
    const [shipper] = await db.update(logisticsShippers).set({ ...data, updatedAt: new Date() }).where(eq(logisticsShippers.id, id)).returning();
    return shipper;
  },

  async deleteLogisticsShipper(id: number): Promise<boolean> {
    await db.delete(logisticsShippers).where(eq(logisticsShippers.id, id));
    return true;
  },

  // Companies
  async getLogisticsCompanies(): Promise<LogisticsCompany[]> {
    return db.select().from(logisticsCompanies).orderBy(desc(logisticsCompanies.createdAt));
  },

  async getLogisticsCompany(id: number): Promise<LogisticsCompany | undefined> {
    const [company] = await db.select().from(logisticsCompanies).where(eq(logisticsCompanies.id, id));
    return company;
  },

  async createLogisticsCompany(data: InsertLogisticsCompany): Promise<LogisticsCompany> {
    const [company] = await db.insert(logisticsCompanies).values(data).returning();
    return company;
  },

  async updateLogisticsCompany(id: number, data: Partial<InsertLogisticsCompany>): Promise<LogisticsCompany | undefined> {
    const [company] = await db.update(logisticsCompanies).set({ ...data, updatedAt: new Date() }).where(eq(logisticsCompanies.id, id)).returning();
    return company;
  },

  async deleteLogisticsCompany(id: number): Promise<boolean> {
    await db.delete(logisticsCompanies).where(eq(logisticsCompanies.id, id));
    return true;
  },

  // Vehicles
  async getLogisticsVehicles(): Promise<LogisticsVehicle[]> {
    return db.select().from(logisticsVehicles).orderBy(desc(logisticsVehicles.createdAt));
  },

  async getLogisticsVehicle(id: number): Promise<LogisticsVehicle | undefined> {
    const [vehicle] = await db.select().from(logisticsVehicles).where(eq(logisticsVehicles.id, id));
    return vehicle;
  },

  async createLogisticsVehicle(data: InsertLogisticsVehicle): Promise<LogisticsVehicle> {
    const [vehicle] = await db.insert(logisticsVehicles).values(data).returning();
    return vehicle;
  },

  async updateLogisticsVehicle(id: number, data: Partial<InsertLogisticsVehicle>): Promise<LogisticsVehicle | undefined> {
    const [vehicle] = await db.update(logisticsVehicles).set({ ...data, updatedAt: new Date() }).where(eq(logisticsVehicles.id, id)).returning();
    return vehicle;
  },

  async deleteLogisticsVehicle(id: number): Promise<boolean> {
    await db.delete(logisticsVehicles).where(eq(logisticsVehicles.id, id));
    return true;
  },

  // Projects
  async getLogisticsProjects(): Promise<LogisticsProject[]> {
    return db.select().from(logisticsProjects).orderBy(desc(logisticsProjects.createdAt));
  },

  async getLogisticsProject(id: number): Promise<LogisticsProject | undefined> {
    const [project] = await db.select().from(logisticsProjects).where(eq(logisticsProjects.id, id));
    return project;
  },

  async createLogisticsProject(data: InsertLogisticsProject): Promise<LogisticsProject> {
    const [project] = await db.insert(logisticsProjects).values(data).returning();
    return project;
  },

  async updateLogisticsProject(id: number, data: Partial<InsertLogisticsProject>): Promise<LogisticsProject | undefined> {
    const [project] = await db.update(logisticsProjects).set({ ...data, updatedAt: new Date() }).where(eq(logisticsProjects.id, id)).returning();
    return project;
  },

  async deleteLogisticsProject(id: number): Promise<boolean> {
    await db.delete(logisticsProjects).where(eq(logisticsProjects.id, id));
    return true;
  },

  // Dispatch
  async getLogisticsDispatchList(): Promise<LogisticsDispatch[]> {
    return db.select().from(logisticsDispatch).orderBy(desc(logisticsDispatch.dispatchDate));
  },

  async getLogisticsDispatch(id: number): Promise<LogisticsDispatch | undefined> {
    const [dispatch] = await db.select().from(logisticsDispatch).where(eq(logisticsDispatch.id, id));
    return dispatch;
  },

  async createLogisticsDispatch(data: InsertLogisticsDispatch): Promise<LogisticsDispatch> {
    const [dispatch] = await db.insert(logisticsDispatch).values(data).returning();
    return dispatch;
  },

  async updateLogisticsDispatch(id: number, data: Partial<InsertLogisticsDispatch>): Promise<LogisticsDispatch | undefined> {
    const [dispatch] = await db.update(logisticsDispatch).set({ ...data, updatedAt: new Date() }).where(eq(logisticsDispatch.id, id)).returning();
    return dispatch;
  },

  async deleteLogisticsDispatch(id: number): Promise<boolean> {
    await db.delete(logisticsDispatch).where(eq(logisticsDispatch.id, id));
    return true;
  },

  // Master Cards
  async getLogisticsMasterCards(): Promise<LogisticsMasterCard[]> {
    return db.select().from(logisticsMasterCards).orderBy(desc(logisticsMasterCards.createdAt));
  },

  async getLogisticsMasterCard(id: number): Promise<LogisticsMasterCard | undefined> {
    const [card] = await db.select().from(logisticsMasterCards).where(eq(logisticsMasterCards.id, id));
    return card;
  },

  async createLogisticsMasterCard(data: InsertLogisticsMasterCard): Promise<LogisticsMasterCard> {
    const [card] = await db.insert(logisticsMasterCards).values(data).returning();
    return card;
  },

  async updateLogisticsMasterCard(id: number, data: Partial<InsertLogisticsMasterCard>): Promise<LogisticsMasterCard | undefined> {
    const [card] = await db.update(logisticsMasterCards).set({ ...data, updatedAt: new Date() }).where(eq(logisticsMasterCards.id, id)).returning();
    return card;
  },

  async deleteLogisticsMasterCard(id: number): Promise<boolean> {
    await db.delete(logisticsMasterCards).where(eq(logisticsMasterCards.id, id));
    return true;
  },

  // Quotations
  async getLogisticsQuotations(): Promise<LogisticsQuotation[]> {
    return db.select().from(logisticsQuotations).orderBy(desc(logisticsQuotations.createdAt));
  },

  async getLogisticsQuotation(id: number): Promise<LogisticsQuotation | undefined> {
    const [quotation] = await db.select().from(logisticsQuotations).where(eq(logisticsQuotations.id, id));
    return quotation;
  },

  async createLogisticsQuotation(data: InsertLogisticsQuotation): Promise<LogisticsQuotation> {
    const [quotation] = await db.insert(logisticsQuotations).values(data).returning();
    return quotation;
  },

  async updateLogisticsQuotation(id: number, data: Partial<InsertLogisticsQuotation>): Promise<LogisticsQuotation | undefined> {
    const [quotation] = await db.update(logisticsQuotations).set({ ...data, updatedAt: new Date() }).where(eq(logisticsQuotations.id, id)).returning();
    return quotation;
  },

  async deleteLogisticsQuotation(id: number): Promise<boolean> {
    await db.delete(logisticsQuotations).where(eq(logisticsQuotations.id, id));
    return true;
  },

  // Instructions
  async getLogisticsInstructions(): Promise<LogisticsInstruction[]> {
    return db.select().from(logisticsInstructions).orderBy(desc(logisticsInstructions.createdAt));
  },

  async getLogisticsInstruction(id: number): Promise<LogisticsInstruction | undefined> {
    const [instruction] = await db.select().from(logisticsInstructions).where(eq(logisticsInstructions.id, id));
    return instruction;
  },

  async createLogisticsInstruction(data: InsertLogisticsInstruction): Promise<LogisticsInstruction> {
    const [instruction] = await db.insert(logisticsInstructions).values(data).returning();
    return instruction;
  },

  async updateLogisticsInstruction(id: number, data: Partial<InsertLogisticsInstruction>): Promise<LogisticsInstruction | undefined> {
    const [instruction] = await db.update(logisticsInstructions).set({ ...data, updatedAt: new Date() }).where(eq(logisticsInstructions.id, id)).returning();
    return instruction;
  },

  async deleteLogisticsInstruction(id: number): Promise<boolean> {
    await db.delete(logisticsInstructions).where(eq(logisticsInstructions.id, id));
    return true;
  },

  // Invoices
  async getLogisticsInvoices(): Promise<LogisticsInvoice[]> {
    return db.select().from(logisticsInvoices).orderBy(desc(logisticsInvoices.createdAt));
  },

  async getLogisticsInvoice(id: number): Promise<LogisticsInvoice | undefined> {
    const [invoice] = await db.select().from(logisticsInvoices).where(eq(logisticsInvoices.id, id));
    return invoice;
  },

  async createLogisticsInvoice(data: InsertLogisticsInvoice): Promise<LogisticsInvoice> {
    const [invoice] = await db.insert(logisticsInvoices).values(data).returning();
    return invoice;
  },

  async updateLogisticsInvoice(id: number, data: Partial<InsertLogisticsInvoice>): Promise<LogisticsInvoice | undefined> {
    const [invoice] = await db.update(logisticsInvoices).set({ ...data, updatedAt: new Date() }).where(eq(logisticsInvoices.id, id)).returning();
    return invoice;
  },

  async deleteLogisticsInvoice(id: number): Promise<boolean> {
    await db.delete(logisticsInvoices).where(eq(logisticsInvoices.id, id));
    return true;
  },

  // Receipts
  async getLogisticsReceipts(): Promise<LogisticsReceipt[]> {
    return db.select().from(logisticsReceipts).orderBy(desc(logisticsReceipts.createdAt));
  },

  async getLogisticsReceipt(id: number): Promise<LogisticsReceipt | undefined> {
    const [receipt] = await db.select().from(logisticsReceipts).where(eq(logisticsReceipts.id, id));
    return receipt;
  },

  async createLogisticsReceipt(data: InsertLogisticsReceipt): Promise<LogisticsReceipt> {
    const [receipt] = await db.insert(logisticsReceipts).values(data).returning();
    return receipt;
  },

  async updateLogisticsReceipt(id: number, data: Partial<InsertLogisticsReceipt>): Promise<LogisticsReceipt | undefined> {
    const [receipt] = await db.update(logisticsReceipts).set({ ...data, updatedAt: new Date() }).where(eq(logisticsReceipts.id, id)).returning();
    return receipt;
  },

  async deleteLogisticsReceipt(id: number): Promise<boolean> {
    await db.delete(logisticsReceipts).where(eq(logisticsReceipts.id, id));
    return true;
  },

  // Payments
  async getLogisticsPayments(): Promise<LogisticsPayment[]> {
    return db.select().from(logisticsPayments).orderBy(desc(logisticsPayments.createdAt));
  },

  async getLogisticsPayment(id: number): Promise<LogisticsPayment | undefined> {
    const [payment] = await db.select().from(logisticsPayments).where(eq(logisticsPayments.id, id));
    return payment;
  },

  async createLogisticsPayment(data: InsertLogisticsPayment): Promise<LogisticsPayment> {
    const [payment] = await db.insert(logisticsPayments).values(data).returning();
    return payment;
  },

  async updateLogisticsPayment(id: number, data: Partial<InsertLogisticsPayment>): Promise<LogisticsPayment | undefined> {
    const [payment] = await db.update(logisticsPayments).set({ ...data, updatedAt: new Date() }).where(eq(logisticsPayments.id, id)).returning();
    return payment;
  },

  async deleteLogisticsPayment(id: number): Promise<boolean> {
    await db.delete(logisticsPayments).where(eq(logisticsPayments.id, id));
    return true;
  },

  // Cashflow
  async getLogisticsCashflow(): Promise<LogisticsCashflow[]> {
    return db.select().from(logisticsCashflow).orderBy(desc(logisticsCashflow.transactionDate));
  },

  async getLogisticsCashflowEntry(id: number): Promise<LogisticsCashflow | undefined> {
    const [entry] = await db.select().from(logisticsCashflow).where(eq(logisticsCashflow.id, id));
    return entry;
  },

  async createLogisticsCashflow(data: InsertLogisticsCashflow): Promise<LogisticsCashflow> {
    const [entry] = await db.insert(logisticsCashflow).values(data).returning();
    return entry;
  },

  async updateLogisticsCashflow(id: number, data: Partial<InsertLogisticsCashflow>): Promise<LogisticsCashflow | undefined> {
    const [entry] = await db.update(logisticsCashflow).set({ ...data, updatedAt: new Date() }).where(eq(logisticsCashflow.id, id)).returning();
    return entry;
  },

  async deleteLogisticsCashflow(id: number): Promise<boolean> {
    await db.delete(logisticsCashflow).where(eq(logisticsCashflow.id, id));
    return true;
  },

  async getLogisticsCashflowSummary(): Promise<{ income: number; expense: number; balance: number }> {
    const incomeResult = await db.select({
      total: sql<number>`COALESCE(SUM(${logisticsCashflow.amount}), 0)`,
    }).from(logisticsCashflow).where(eq(logisticsCashflow.type, 'income'));
    
    const expenseResult = await db.select({
      total: sql<number>`COALESCE(SUM(${logisticsCashflow.amount}), 0)`,
    }).from(logisticsCashflow).where(eq(logisticsCashflow.type, 'expense'));
    
    const income = parseFloat(String(incomeResult[0]?.total || 0));
    const expense = parseFloat(String(expenseResult[0]?.total || 0));
    
    return { income, expense, balance: income - expense };
  },

  // ============================================
  // Staffing/Recruitment Module
  // ============================================

  // Jobs
  async getStaffingJobs(): Promise<StaffingJob[]> {
    return db.select().from(staffingJobs).orderBy(desc(staffingJobs.createdAt));
  },

  async getStaffingJob(id: number): Promise<StaffingJob | undefined> {
    const [job] = await db.select().from(staffingJobs).where(eq(staffingJobs.id, id));
    return job;
  },

  async createStaffingJob(data: InsertStaffingJob): Promise<StaffingJob> {
    const [job] = await db.insert(staffingJobs).values(data).returning();
    return job;
  },

  async updateStaffingJob(id: number, data: Partial<InsertStaffingJob>): Promise<StaffingJob | undefined> {
    const [job] = await db.update(staffingJobs).set({ ...data, updatedAt: new Date() }).where(eq(staffingJobs.id, id)).returning();
    return job;
  },

  async deleteStaffingJob(id: number): Promise<boolean> {
    await db.delete(staffingJobs).where(eq(staffingJobs.id, id));
    return true;
  },

  // Candidates
  async getStaffingCandidates(): Promise<StaffingCandidate[]> {
    return db.select().from(staffingCandidates).orderBy(desc(staffingCandidates.createdAt));
  },

  async getStaffingCandidate(id: number): Promise<StaffingCandidate | undefined> {
    const [candidate] = await db.select().from(staffingCandidates).where(eq(staffingCandidates.id, id));
    return candidate;
  },

  async createStaffingCandidate(data: InsertStaffingCandidate): Promise<StaffingCandidate> {
    const [candidate] = await db.insert(staffingCandidates).values(data).returning();
    return candidate;
  },

  async updateStaffingCandidate(id: number, data: Partial<InsertStaffingCandidate>): Promise<StaffingCandidate | undefined> {
    const [candidate] = await db.update(staffingCandidates).set({ ...data, updatedAt: new Date() }).where(eq(staffingCandidates.id, id)).returning();
    return candidate;
  },

  async deleteStaffingCandidate(id: number): Promise<boolean> {
    await db.delete(staffingCandidates).where(eq(staffingCandidates.id, id));
    return true;
  },

  // Applications
  async getStaffingApplications(): Promise<StaffingApplication[]> {
    return db.select().from(staffingApplications).orderBy(desc(staffingApplications.createdAt));
  },

  async getStaffingApplicationsByCandidate(candidateId: number): Promise<StaffingApplication[]> {
    return db.select().from(staffingApplications).where(eq(staffingApplications.candidateId, candidateId)).orderBy(desc(staffingApplications.createdAt));
  },

  async getStaffingApplication(id: number): Promise<StaffingApplication | undefined> {
    const [application] = await db.select().from(staffingApplications).where(eq(staffingApplications.id, id));
    return application;
  },

  async createStaffingApplication(data: InsertStaffingApplication): Promise<StaffingApplication> {
    const [application] = await db.insert(staffingApplications).values(data).returning();
    return application;
  },

  async updateStaffingApplication(id: number, data: Partial<InsertStaffingApplication>): Promise<StaffingApplication | undefined> {
    const [application] = await db.update(staffingApplications).set({ ...data, updatedAt: new Date() }).where(eq(staffingApplications.id, id)).returning();
    return application;
  },

  async deleteStaffingApplication(id: number): Promise<boolean> {
    await db.delete(staffingApplications).where(eq(staffingApplications.id, id));
    return true;
  },

  // Resumes
  async getStaffingResumes(): Promise<StaffingResume[]> {
    return db.select().from(staffingResumes).orderBy(desc(staffingResumes.createdAt));
  },

  async getStaffingResumesByCandidate(candidateId: number): Promise<StaffingResume[]> {
    return db.select().from(staffingResumes).where(eq(staffingResumes.candidateId, candidateId)).orderBy(desc(staffingResumes.createdAt));
  },

  async getStaffingResume(id: number): Promise<StaffingResume | undefined> {
    const [resume] = await db.select().from(staffingResumes).where(eq(staffingResumes.id, id));
    return resume;
  },

  async createStaffingResume(data: InsertStaffingResume): Promise<StaffingResume> {
    const [resume] = await db.insert(staffingResumes).values(data).returning();
    return resume;
  },

  async updateStaffingResume(id: number, data: Partial<InsertStaffingResume>): Promise<StaffingResume | undefined> {
    const [resume] = await db.update(staffingResumes).set({ ...data, updatedAt: new Date() }).where(eq(staffingResumes.id, id)).returning();
    return resume;
  },

  async deleteStaffingResume(id: number): Promise<boolean> {
    await db.delete(staffingResumes).where(eq(staffingResumes.id, id));
    return true;
  },

  // Invoices
  async getStaffingInvoices(): Promise<StaffingInvoice[]> {
    return db.select().from(staffingInvoices).orderBy(desc(staffingInvoices.createdAt));
  },

  async getStaffingInvoice(id: number): Promise<StaffingInvoice | undefined> {
    const [invoice] = await db.select().from(staffingInvoices).where(eq(staffingInvoices.id, id));
    return invoice;
  },

  async createStaffingInvoice(data: InsertStaffingInvoice): Promise<StaffingInvoice> {
    const [invoice] = await db.insert(staffingInvoices).values(data).returning();
    return invoice;
  },

  async updateStaffingInvoice(id: number, data: Partial<InsertStaffingInvoice>): Promise<StaffingInvoice | undefined> {
    const [invoice] = await db.update(staffingInvoices).set({ ...data, updatedAt: new Date() }).where(eq(staffingInvoices.id, id)).returning();
    return invoice;
  },

  async deleteStaffingInvoice(id: number): Promise<boolean> {
    await db.delete(staffingInvoices).where(eq(staffingInvoices.id, id));
    return true;
  },

  // Sales
  async getStaffingSales(): Promise<StaffingSale[]> {
    return db.select().from(staffingSales).orderBy(desc(staffingSales.saleDate));
  },

  async getStaffingSale(id: number): Promise<StaffingSale | undefined> {
    const [sale] = await db.select().from(staffingSales).where(eq(staffingSales.id, id));
    return sale;
  },

  async createStaffingSale(data: InsertStaffingSale): Promise<StaffingSale> {
    const [sale] = await db.insert(staffingSales).values(data).returning();
    return sale;
  },

  async updateStaffingSale(id: number, data: Partial<InsertStaffingSale>): Promise<StaffingSale | undefined> {
    const [sale] = await db.update(staffingSales).set({ ...data, updatedAt: new Date() }).where(eq(staffingSales.id, id)).returning();
    return sale;
  },

  async deleteStaffingSale(id: number): Promise<boolean> {
    await db.delete(staffingSales).where(eq(staffingSales.id, id));
    return true;
  },

  async getStaffingSalesSummary(): Promise<{ totalSales: number; placementCount: number; monthlyRevenue: number }> {
    const result = await db.select({
      totalSales: sql<number>`COALESCE(SUM(${staffingSales.amount}), 0)`,
      placementCount: sql<number>`COUNT(*)`,
    }).from(staffingSales);
    
    const monthlyResult = await db.select({
      total: sql<number>`COALESCE(SUM(${staffingSales.amount}), 0)`,
    }).from(staffingSales).where(
      gte(staffingSales.saleDate, sql`DATE_TRUNC('month', CURRENT_DATE)`)
    );
    
    return {
      totalSales: parseFloat(String(result[0]?.totalSales || 0)),
      placementCount: Number(result[0]?.placementCount || 0),
      monthlyRevenue: parseFloat(String(monthlyResult[0]?.total || 0)),
    };
  },
};
