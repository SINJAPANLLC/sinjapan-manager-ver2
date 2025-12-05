import { db } from './db';
import { users, customers, tasks, notifications, chatMessages, employees, agencySales } from '../shared/schema';
import { eq, and, or, desc, sql, isNull } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { User, InsertUser, Customer, InsertCustomer, Task, InsertTask, Notification, InsertNotification, ChatMessage, InsertChatMessage, Employee, InsertEmployee, AgencySale, InsertAgencySale } from '../shared/schema';

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

  async getChatMessages(userId: number, otherUserId: number): Promise<ChatMessage[]> {
    return db.select().from(chatMessages).where(
      or(
        and(eq(chatMessages.senderId, userId), eq(chatMessages.receiverId, otherUserId)),
        and(eq(chatMessages.senderId, otherUserId), eq(chatMessages.receiverId, userId))
      )
    ).orderBy(chatMessages.createdAt);
  },

  async getChatPartners(userId: number): Promise<User[]> {
    const partners = await db.selectDistinct({ id: users.id, email: users.email, name: users.name, role: users.role, avatarUrl: users.avatarUrl, phone: users.phone, department: users.department, position: users.position, isActive: users.isActive, createdAt: users.createdAt, updatedAt: users.updatedAt, password: users.password })
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
    const [sale] = await db.insert(agencySales).values(data).returning();
    return sale;
  },

  async updateAgencySale(id: number, data: Partial<InsertAgencySale>): Promise<AgencySale | undefined> {
    const [sale] = await db.update(agencySales).set(data).where(eq(agencySales.id, id)).returning();
    return sale;
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

    return {
      customers: Number(customerCount[0]?.count || 0),
      tasks: Number(taskCount[0]?.count || 0),
      pendingTasks: Number(pendingTasks[0]?.count || 0),
      unreadNotifications: Number(unreadNotifications[0]?.count || 0),
    };
  },
};
