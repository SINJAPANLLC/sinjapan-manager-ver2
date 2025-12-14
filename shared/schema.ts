import { pgTable, text, serial, integer, boolean, timestamp, varchar, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("client"),
  companyId: varchar("company_id", { length: 255 }),
  avatarUrl: text("avatar_url"),
  phone: text("phone"),
  department: text("department"),
  position: text("position"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businesses = pgTable("businesses", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  url: text("url"),
  targetRevenue: decimal("target_revenue", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const businessSales = pgTable("business_sales", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  businessId: text("business_id").notNull(),
  type: text("type").notNull().default("revenue"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const memos = pgTable("memos", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  date: timestamp("date").notNull(),
  content: text("content").notNull(),
  color: text("color").default("blue"),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  category: text("category").notNull().default("direct"),
  businessId: integer("business_id").references(() => businesses.id, { onDelete: "set null" }),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  content: text("content").notNull(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
  receiverId: integer("receiver_id").references(() => users.id, { onDelete: "set null" }),
  attachmentUrl: text("attachment_url"),
  attachmentName: text("attachment_name"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  employeeNumber: text("employee_number"),
  hireDate: timestamp("hire_date"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencySales = pgTable("agency_sales", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  agencyId: integer("agency_id").references(() => users.id, { onDelete: "cascade" }),
  businessId: text("business_id"),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  clientName: text("client_name"),
  projectName: text("project_name"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 12, scale: 2 }),
  status: text("status").notNull().default("pending"),
  description: text("description"),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks, { relationName: "assignedTasks" }),
  createdTasks: many(tasks, { relationName: "createdTasks" }),
  notifications: many(notifications, { relationName: "userNotifications" }),
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  receivedMessages: many(chatMessages, { relationName: "receivedMessages" }),
  employee: one(employees, { fields: [users.id], references: [employees.userId] }),
  sales: many(agencySales),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedUser: one(users, { fields: [customers.assignedTo], references: [users.id] }),
  tasks: many(tasks),
  sales: many(agencySales),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, { fields: [tasks.assignedTo], references: [users.id], relationName: "assignedTasks" }),
  creator: one(users, { fields: [tasks.createdBy], references: [users.id], relationName: "createdTasks" }),
  customer: one(customers, { fields: [tasks.customerId], references: [customers.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type AgencySale = typeof agencySales.$inferSelect;
export type InsertAgencySale = typeof agencySales.$inferInsert;
export type Business = typeof businesses.$inferSelect;
export type InsertBusiness = typeof businesses.$inferInsert;
export type BusinessSale = typeof businessSales.$inferSelect;
export type InsertBusinessSale = typeof businessSales.$inferInsert;
export type Memo = typeof memos.$inferSelect;
export type InsertMemo = typeof memos.$inferInsert;

export const aiLogs = pgTable("ai_logs", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  type: text("type").notNull(),
  prompt: text("prompt"),
  result: text("result"),
  status: text("status").notNull().default("success"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiLog = typeof aiLogs.$inferSelect;
export type InsertAiLog = typeof aiLogs.$inferInsert;

export const aiConversations = pgTable("ai_conversations", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = typeof aiConversations.$inferInsert;

export const aiKnowledge = pgTable("ai_knowledge", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AiKnowledge = typeof aiKnowledge.$inferSelect;
export type InsertAiKnowledge = typeof aiKnowledge.$inferInsert;

export const seoCategories = pgTable("seo_categories", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const seoArticles = pgTable("seo_articles", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  content: text("content").notNull(),
  metaTitle: varchar("meta_title", { length: 255 }),
  metaDescription: text("meta_description"),
  keywords: text("keywords"),
  ctaUrl: text("cta_url"),
  ctaText: text("cta_text").default("お問い合わせはこちら"),
  domain: text("domain"),
  siteName: text("site_name"),
  categoryId: integer("category_id").references(() => seoCategories.id),
  status: varchar("status", { length: 50 }).default("draft"),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  indexingStatus: text("indexing_status").default("not_sent"),
  indexedAt: timestamp("indexed_at"),
  userId: integer("user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SeoCategory = typeof seoCategories.$inferSelect;
export type InsertSeoCategory = typeof seoCategories.$inferInsert;
export type SeoArticle = typeof seoArticles.$inferSelect;
export type InsertSeoArticle = typeof seoArticles.$inferInsert;

export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SystemSetting = typeof systemSettings.$inferSelect;

export const leads = pgTable("leads", {
  id: varchar("id", { length: 255 }).primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: text("website"),
  address: text("address"),
  category: varchar("category", { length: 100 }),
  source: varchar("source", { length: 100 }),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  lineId: varchar("line_id", { length: 100 }),
  googleMapsUrl: text("google_maps_url"),
  status: varchar("status", { length: 50 }).default("new"),
  notes: text("notes"),
  score: integer("score").default(0),
  lastContactedAt: timestamp("last_contacted_at"),
  assignedTo: varchar("assigned_to", { length: 255 }),
  customerId: varchar("customer_id", { length: 255 }),
  convertedToDealId: varchar("converted_to_deal_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  leadId: varchar("lead_id", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;

export const clientProjects = pgTable("client_projects", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  clientId: integer("client_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ClientProject = typeof clientProjects.$inferSelect;
export type InsertClientProject = typeof clientProjects.$inferInsert;

export const clientInvoices = pgTable("client_invoices", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  clientId: integer("client_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ClientInvoice = typeof clientInvoices.$inferSelect;
export type InsertClientInvoice = typeof clientInvoices.$inferInsert;

export const companies = pgTable("companies", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique(),
  address: text("address"),
  phone: text("phone"),
  fax: text("fax"),
  email: text("email"),
  website: text("website"),
  representativeName: text("representative_name"),
  establishedDate: timestamp("established_date"),
  capital: decimal("capital", { precision: 15, scale: 2 }),
  businessDescription: text("business_description"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  logoUrl: text("logo_url"),
  primaryColor: varchar("primary_color", { length: 20 }).default("#3B82F6"),
  secondaryColor: varchar("secondary_color", { length: 20 }).default("#1E40AF"),
  // Square決済設定（テナント別）
  squareAccessToken: text("square_access_token"),
  squareApplicationId: text("square_application_id"),
  squareEnvironment: varchar("square_environment", { length: 20 }).default("sandbox"),
  squareLocationId: text("square_location_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

export const quickNotes = pgTable("quick_notes", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  color: varchar("color", { length: 20 }).default("yellow"),
  isPinned: boolean("is_pinned").default(false),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type QuickNote = typeof quickNotes.$inferSelect;
export type InsertQuickNote = typeof quickNotes.$inferInsert;

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  businessId: varchar("business_id"),
  type: varchar("type", { length: 50 }).notNull().default("asset_purchase"),
  category: varchar("category", { length: 100 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  investmentDate: timestamp("investment_date").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;
