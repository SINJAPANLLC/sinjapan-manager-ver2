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
  businessId: varchar("business_id", { length: 255 }),
  dueDate: timestamp("due_date"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  assignmentType: text("assignment_type").default("individual"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
  isRecurring: boolean("is_recurring").default(false),
  recurringFrequency: text("recurring_frequency"),
  parentTaskId: integer("parent_task_id"),
  lastGeneratedAt: timestamp("last_generated_at"),
  rewardAmount: decimal("reward_amount", { precision: 12, scale: 2 }),
  rewardApprovedAt: timestamp("reward_approved_at"),
  rewardApprovedBy: integer("reward_approved_by").references(() => users.id, { onDelete: "set null" }),
  rewardPaidAt: timestamp("reward_paid_at"),
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

export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const chatGroupMembers = pgTable("chat_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => chatGroups.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").default("member"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  content: text("content").notNull(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "set null" }),
  receiverId: integer("receiver_id").references(() => users.id, { onDelete: "set null" }),
  groupId: integer("group_id").references(() => chatGroups.id, { onDelete: "cascade" }),
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
  contractType: text("contract_type").default("employee"),
  hireDate: timestamp("hire_date"),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  closingDay: text("closing_day"),
  paymentDay: text("payment_day"),
  paymentMethod: text("payment_method"),
  transferFee: decimal("transfer_fee", { precision: 10, scale: 2 }),
  healthInsurance: decimal("health_insurance", { precision: 12, scale: 2 }),
  pensionInsurance: decimal("pension_insurance", { precision: 12, scale: 2 }),
  employmentInsurance: decimal("employment_insurance", { precision: 12, scale: 2 }),
  incomeTax: decimal("income_tax", { precision: 12, scale: 2 }),
  residentTax: decimal("resident_tax", { precision: 12, scale: 2 }),
  otherDeductions: decimal("other_deductions", { precision: 12, scale: 2 }),
  deduction1Name: text("deduction1_name"),
  deduction1Amount: decimal("deduction1_amount", { precision: 12, scale: 2 }),
  deduction2Name: text("deduction2_name"),
  deduction2Amount: decimal("deduction2_amount", { precision: 12, scale: 2 }),
  deduction3Name: text("deduction3_name"),
  deduction3Amount: decimal("deduction3_amount", { precision: 12, scale: 2 }),
  deduction4Name: text("deduction4_name"),
  deduction4Amount: decimal("deduction4_amount", { precision: 12, scale: 2 }),
  deduction5Name: text("deduction5_name"),
  deduction5Amount: decimal("deduction5_amount", { precision: 12, scale: 2 }),
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

export const agencyIncentives = pgTable("agency_incentives", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  projectName: text("project_name").notNull(),
  description: text("description"),
  incentiveType: text("incentive_type").notNull().default("percentage"),
  incentiveValue: decimal("incentive_value", { precision: 10, scale: 2 }).notNull(),
  targetAgencyId: integer("target_agency_id").references(() => users.id, { onDelete: "set null" }),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyMemos = pgTable("agency_memos", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  agencyId: integer("agency_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
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
export type ChatGroup = typeof chatGroups.$inferSelect;
export type InsertChatGroup = typeof chatGroups.$inferInsert;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type InsertChatGroupMember = typeof chatGroupMembers.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;
export type AgencySale = typeof agencySales.$inferSelect;
export type InsertAgencySale = typeof agencySales.$inferInsert;
export type AgencyIncentive = typeof agencyIncentives.$inferSelect;
export type InsertAgencyIncentive = typeof agencyIncentives.$inferInsert;
export type AgencyMemo = typeof agencyMemos.$inferSelect;
export type InsertAgencyMemo = typeof agencyMemos.$inferInsert;
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

export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  category: varchar("category", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"),
  budget: decimal("budget", { precision: 15, scale: 2 }),
  spent: decimal("spent", { precision: 15, scale: 2 }).default("0"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  targetUrl: text("target_url"),
  platform: varchar("platform", { length: 100 }),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

export const siteCredentials = pgTable("site_credentials", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  siteName: varchar("site_name", { length: 255 }).notNull(),
  siteUrl: text("site_url"),
  loginId: text("login_id"),
  password: text("password"),
  apiKey: text("api_key"),
  notes: text("notes"),
  category: varchar("category", { length: 100 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type SiteCredential = typeof siteCredentials.$inferSelect;
export type InsertSiteCredential = typeof siteCredentials.$inferInsert;

export const staffSalaries = pgTable("staff_salaries", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  baseSalary: decimal("base_salary", { precision: 12, scale: 2 }).default("0"),
  overtime: decimal("overtime", { precision: 12, scale: 2 }).default("0"),
  bonus: decimal("bonus", { precision: 12, scale: 2 }).default("0"),
  deductions: decimal("deductions", { precision: 12, scale: 2 }).default("0"),
  netSalary: decimal("net_salary", { precision: 12, scale: 2 }).default("0"),
  paidAt: timestamp("paid_at"),
  status: varchar("status", { length: 50 }).default("pending"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffSalary = typeof staffSalaries.$inferSelect;
export type InsertStaffSalary = typeof staffSalaries.$inferInsert;

export const staffShifts = pgTable("staff_shifts", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull(),
  startTime: varchar("start_time", { length: 10 }),
  endTime: varchar("end_time", { length: 10 }),
  breakMinutes: integer("break_minutes").default(0),
  workHours: decimal("work_hours", { precision: 5, scale: 2 }).default("0"),
  projectName: varchar("project_name", { length: 255 }),
  amount: decimal("amount", { precision: 12, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  approvalStatus: varchar("approval_status", { length: 50 }).default("pending"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffShift = typeof staffShifts.$inferSelect;
export type InsertStaffShift = typeof staffShifts.$inferInsert;

export const advancePayments = pgTable("advance_payments", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  feeAmount: decimal("fee_amount", { precision: 12, scale: 2 }),
  netAmount: decimal("net_amount", { precision: 12, scale: 2 }),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 50 }).default("pending"),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AdvancePayment = typeof advancePayments.$inferSelect;
export type InsertAdvancePayment = typeof advancePayments.$inferInsert;

export const taskEvidence = pgTable("task_evidence", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  taskId: integer("task_id").references(() => tasks.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  evidenceType: varchar("evidence_type", { length: 50 }).default("file"),
  fileName: varchar("file_name", { length: 255 }),
  fileUrl: text("file_url"),
  description: text("description"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TaskEvidence = typeof taskEvidence.$inferSelect;
export type InsertTaskEvidence = typeof taskEvidence.$inferInsert;

export const staffAffiliates = pgTable("staff_affiliates", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  affiliateName: varchar("affiliate_name", { length: 255 }).notNull(),
  affiliateUrl: text("affiliate_url"),
  affiliateCode: varchar("affiliate_code", { length: 100 }),
  platform: varchar("platform", { length: 100 }),
  commissionRate: decimal("commission_rate", { precision: 5, scale: 2 }),
  totalClicks: integer("total_clicks").default(0),
  totalConversions: integer("total_conversions").default(0),
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 }).default("0"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffAffiliate = typeof staffAffiliates.$inferSelect;
export type InsertStaffAffiliate = typeof staffAffiliates.$inferInsert;

export const staffMemos = pgTable("staff_memos", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  employeeId: integer("employee_id").references(() => employees.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).default("general"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffMemo = typeof staffMemos.$inferSelect;
export type InsertStaffMemo = typeof staffMemos.$inferInsert;

export const businessDesigns = pgTable("business_designs", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  businessId: varchar("business_id", { length: 255 }).notNull(),
  purpose: text("purpose"),
  customerProblem: text("customer_problem"),
  solution: text("solution"),
  alternatives: text("alternatives"),
  numbers: text("numbers"),
  responsibility: text("responsibility"),
  successCriteria: text("success_criteria"),
  operationLoop: text("operation_loop"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BusinessDesign = typeof businessDesigns.$inferSelect;
export type InsertBusinessDesign = typeof businessDesigns.$inferInsert;

export const financialEntries = pgTable("financial_entries", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  statementType: varchar("statement_type", { length: 10 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  subCategory: varchar("sub_category", { length: 100 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type FinancialEntry = typeof financialEntries.$inferSelect;
export type InsertFinancialEntry = typeof financialEntries.$inferInsert;

export const agencyPaymentSettings = pgTable("agency_payment_settings", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  agencyId: integer("agency_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  closingDay: varchar("closing_day", { length: 20 }).notNull().default("end_of_month"),
  payoutOffsetMonths: integer("payout_offset_months").notNull().default(2),
  payoutDay: integer("payout_day").notNull().default(5),
  transferFee: decimal("transfer_fee", { precision: 10, scale: 0 }).notNull().default("330"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AgencyPaymentSettings = typeof agencyPaymentSettings.$inferSelect;
export type InsertAgencyPaymentSettings = typeof agencyPaymentSettings.$inferInsert;

// ==================== LOGISTICS MODULE ====================

// 荷主 (Shippers)
export const logisticsShippers = pgTable("logistics_shippers", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  postalCode: text("postal_code"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsShipper = typeof logisticsShippers.$inferSelect;
export type InsertLogisticsShipper = typeof logisticsShippers.$inferInsert;

// 自社・協力会社 (Companies/Partners)
export const logisticsCompanies = pgTable("logistics_companies", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  type: text("type").notNull().default("partner"), // 'own' or 'partner'
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  postalCode: text("postal_code"),
  bankName: text("bank_name"),
  bankBranch: text("bank_branch"),
  bankAccountType: text("bank_account_type"),
  bankAccountNumber: text("bank_account_number"),
  bankAccountHolder: text("bank_account_holder"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsCompany = typeof logisticsCompanies.$inferSelect;
export type InsertLogisticsCompany = typeof logisticsCompanies.$inferInsert;

// 車両 (Vehicles)
export const logisticsVehicles = pgTable("logistics_vehicles", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  vehicleNumber: text("vehicle_number").notNull(),
  vehicleType: text("vehicle_type").notNull(), // トラック, バン, etc.
  capacity: text("capacity"), // 積載量
  ownerCompanyId: integer("owner_company_id").references(() => logisticsCompanies.id, { onDelete: "set null" }),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  inspectionDate: timestamp("inspection_date"),
  insuranceExpiry: timestamp("insurance_expiry"),
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, maintenance, inactive
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsVehicle = typeof logisticsVehicles.$inferSelect;
export type InsertLogisticsVehicle = typeof logisticsVehicles.$inferInsert;

// 案件 (Projects)
export const logisticsProjects = pgTable("logistics_projects", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  projectNumber: text("project_number").notNull(),
  shipperId: integer("shipper_id").references(() => logisticsShippers.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description"),
  pickupAddress: text("pickup_address"),
  deliveryAddress: text("delivery_address"),
  scheduledDate: timestamp("scheduled_date"),
  completedDate: timestamp("completed_date"),
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  amount: decimal("amount", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsProject = typeof logisticsProjects.$inferSelect;
export type InsertLogisticsProject = typeof logisticsProjects.$inferInsert;

// 配車・シフト (Dispatch/Shifts)
export const logisticsDispatch = pgTable("logistics_dispatch", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "cascade" }),
  vehicleId: integer("vehicle_id").references(() => logisticsVehicles.id, { onDelete: "set null" }),
  driverName: text("driver_name"),
  dispatchDate: timestamp("dispatch_date").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  status: text("status").notNull().default("scheduled"), // scheduled, dispatched, completed, cancelled
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsDispatch = typeof logisticsDispatch.$inferSelect;
export type InsertLogisticsDispatch = typeof logisticsDispatch.$inferInsert;

// マスターカード (Master Cards - vehicle/driver compliance)
export const logisticsMasterCards = pgTable("logistics_master_cards", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  vehicleId: integer("vehicle_id").references(() => logisticsVehicles.id, { onDelete: "cascade" }),
  cardType: text("card_type").notNull(), // 車検証, 保険証, 免許証, etc.
  cardNumber: text("card_number"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  fileUrl: text("file_url"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsMasterCard = typeof logisticsMasterCards.$inferSelect;
export type InsertLogisticsMasterCard = typeof logisticsMasterCards.$inferInsert;

// 見積書 (Quotations)
export const logisticsQuotations = pgTable("logistics_quotations", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  quotationNumber: text("quotation_number").notNull(),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  shipperId: integer("shipper_id").references(() => logisticsShippers.id, { onDelete: "set null" }),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  validUntil: timestamp("valid_until"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }),
  tax: decimal("tax", { precision: 15, scale: 2 }),
  total: decimal("total", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, sent, accepted, rejected
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsQuotation = typeof logisticsQuotations.$inferSelect;
export type InsertLogisticsQuotation = typeof logisticsQuotations.$inferInsert;

// 指示書 (Instructions)
export const logisticsInstructions = pgTable("logistics_instructions", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  instructionNumber: text("instruction_number").notNull(),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  dispatchId: integer("dispatch_id").references(() => logisticsDispatch.id, { onDelete: "set null" }),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  pickupLocation: text("pickup_location"),
  deliveryLocation: text("delivery_location"),
  cargoDetails: text("cargo_details"),
  specialInstructions: text("special_instructions"),
  status: text("status").notNull().default("issued"), // issued, acknowledged, completed
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsInstruction = typeof logisticsInstructions.$inferSelect;
export type InsertLogisticsInstruction = typeof logisticsInstructions.$inferInsert;

// 請求書 (Invoices)
export const logisticsInvoices = pgTable("logistics_invoices", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  invoiceNumber: text("invoice_number").notNull(),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  shipperId: integer("shipper_id").references(() => logisticsShippers.id, { onDelete: "set null" }),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }),
  tax: decimal("tax", { precision: 15, scale: 2 }),
  total: decimal("total", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsInvoice = typeof logisticsInvoices.$inferSelect;
export type InsertLogisticsInvoice = typeof logisticsInvoices.$inferInsert;

// 受領書 (Receipts)
export const logisticsReceipts = pgTable("logistics_receipts", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  receiptNumber: text("receipt_number").notNull(),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  receivedBy: text("received_by"),
  deliveryConfirmed: boolean("delivery_confirmed").default(false),
  notes: text("notes"),
  signatureUrl: text("signature_url"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsReceipt = typeof logisticsReceipts.$inferSelect;
export type InsertLogisticsReceipt = typeof logisticsReceipts.$inferInsert;

// 支払書 (Payments to partners)
export const logisticsPayments = pgTable("logistics_payments", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  paymentNumber: text("payment_number").notNull(),
  partnerCompanyId: integer("partner_company_id").references(() => logisticsCompanies.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date"),
  status: text("status").notNull().default("pending"), // pending, paid
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsPayment = typeof logisticsPayments.$inferSelect;
export type InsertLogisticsPayment = typeof logisticsPayments.$inferInsert;

// 入出金 (Cashflow entries)
export const logisticsCashflow = pgTable("logistics_cashflow", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  type: text("type").notNull(), // income, expense
  category: text("category"), // 売上, 経費, etc.
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  relatedProjectId: integer("related_project_id").references(() => logisticsProjects.id, { onDelete: "set null" }),
  relatedInvoiceId: integer("related_invoice_id").references(() => logisticsInvoices.id, { onDelete: "set null" }),
  relatedPaymentId: integer("related_payment_id").references(() => logisticsPayments.id, { onDelete: "set null" }),
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type LogisticsCashflow = typeof logisticsCashflow.$inferSelect;
export type InsertLogisticsCashflow = typeof logisticsCashflow.$inferInsert;

// ============================================
// 人材 (Staffing/Recruitment) Module
// ============================================

// 案件一覧 (Job listings)
export const staffingJobs = pgTable("staffing_jobs", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  title: text("title").notNull(),
  clientName: text("client_name"),
  location: text("location"),
  employmentType: text("employment_type").default("fulltime"), // fulltime, parttime, contract, dispatch
  salary: text("salary"),
  salaryMin: decimal("salary_min", { precision: 15, scale: 2 }),
  salaryMax: decimal("salary_max", { precision: 15, scale: 2 }),
  description: text("description"),
  requirements: text("requirements"),
  benefits: text("benefits"),
  positions: integer("positions").default(1),
  status: text("status").notNull().default("open"), // open, closed, filled, cancelled
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingJob = typeof staffingJobs.$inferSelect;
export type InsertStaffingJob = typeof staffingJobs.$inferInsert;

// 求職者 (Job seekers/Candidates)
export const staffingCandidates = pgTable("staffing_candidates", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  nationality: text("nationality"),
  visaStatus: text("visa_status"),
  currentStatus: text("current_status").default("seeking"), // seeking, employed, not_seeking
  desiredEmploymentType: text("desired_employment_type"),
  desiredSalary: text("desired_salary"),
  availableFrom: timestamp("available_from"),
  skills: text("skills"),
  experience: text("experience"),
  education: text("education"),
  languages: text("languages"),
  notes: text("notes"),
  status: text("status").notNull().default("active"), // active, inactive, placed
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingCandidate = typeof staffingCandidates.$inferSelect;
export type InsertStaffingCandidate = typeof staffingCandidates.$inferInsert;

// 求職者進捗 (Candidate applications/progress)
export const staffingApplications = pgTable("staffing_applications", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  candidateId: integer("candidate_id").references(() => staffingCandidates.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => staffingJobs.id, { onDelete: "cascade" }),
  stage: text("stage").notNull().default("applied"), // applied, screening, interview1, interview2, offer, hired, rejected
  appliedDate: timestamp("applied_date").defaultNow().notNull(),
  interviewDate: timestamp("interview_date"),
  offerDate: timestamp("offer_date"),
  hiredDate: timestamp("hired_date"),
  rejectedDate: timestamp("rejected_date"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingApplication = typeof staffingApplications.$inferSelect;
export type InsertStaffingApplication = typeof staffingApplications.$inferInsert;

// 職務経歴書 (Resumes)
export const staffingResumes = pgTable("staffing_resumes", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  candidateId: integer("candidate_id").references(() => staffingCandidates.id, { onDelete: "cascade" }),
  title: text("title"),
  summary: text("summary"),
  workHistory: text("work_history"),
  education: text("education"),
  certifications: text("certifications"),
  skills: text("skills"),
  fileUrl: text("file_url"),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingResume = typeof staffingResumes.$inferSelect;
export type InsertStaffingResume = typeof staffingResumes.$inferInsert;

// 請求書 (Staffing Invoices)
export const staffingInvoices = pgTable("staffing_invoices", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  invoiceNumber: text("invoice_number").notNull(),
  clientName: text("client_name").notNull(),
  candidateId: integer("candidate_id").references(() => staffingCandidates.id, { onDelete: "set null" }),
  jobId: integer("job_id").references(() => staffingJobs.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  description: text("description"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingInvoice = typeof staffingInvoices.$inferSelect;
export type InsertStaffingInvoice = typeof staffingInvoices.$inferInsert;

// 売上 (Staffing Sales)
export const staffingSales = pgTable("staffing_sales", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  type: text("type").notNull().default("placement"), // placement, monthly, referral
  clientName: text("client_name").notNull(),
  candidateId: integer("candidate_id").references(() => staffingCandidates.id, { onDelete: "set null" }),
  jobId: integer("job_id").references(() => staffingJobs.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => staffingInvoices.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  fee: decimal("fee", { precision: 15, scale: 2 }),
  feePercentage: decimal("fee_percentage", { precision: 5, scale: 2 }),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  description: text("description"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StaffingSale = typeof staffingSales.$inferSelect;
export type InsertStaffingSale = typeof staffingSales.$inferInsert;

// ============================================
// IT Module
// ============================================

// システム一覧 (System List)
export const itSystems = pgTable("it_systems", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("web"), // web, mobile, desktop, api, other
  technology: text("technology"),
  status: text("status").notNull().default("active"), // active, maintenance, deprecated
  url: text("url"),
  repositoryUrl: text("repository_url"),
  clientId: integer("client_id"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItSystem = typeof itSystems.$inferSelect;
export type InsertItSystem = typeof itSystems.$inferInsert;

// 案件一覧 (IT Projects)
export const itProjects = pgTable("it_projects", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  description: text("description"),
  clientId: integer("client_id"),
  systemId: integer("system_id").references(() => itSystems.id, { onDelete: "set null" }),
  type: text("type").default("development"), // development, maintenance, consulting, support
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  budget: decimal("budget", { precision: 15, scale: 2 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  deadline: timestamp("deadline"),
  priority: text("priority").default("medium"), // low, medium, high, urgent
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItProject = typeof itProjects.$inferSelect;
export type InsertItProject = typeof itProjects.$inferInsert;

// クライアント一覧 (IT Clients)
export const itClients = pgTable("it_clients", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  industry: text("industry"),
  status: text("status").notNull().default("active"), // active, inactive, prospect
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItClient = typeof itClients.$inferSelect;
export type InsertItClient = typeof itClients.$inferInsert;

// 外注一覧 (IT Vendors/Outsource)
export const itVendors = pgTable("it_vendors", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  specialty: text("specialty"),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
  rating: integer("rating"),
  status: text("status").notNull().default("active"), // active, inactive
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItVendor = typeof itVendors.$inferSelect;
export type InsertItVendor = typeof itVendors.$inferInsert;

// 請求書 (IT Invoices)
export const itInvoices = pgTable("it_invoices", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  invoiceNumber: text("invoice_number").notNull(),
  clientId: integer("client_id").references(() => itClients.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => itProjects.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  description: text("description"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItInvoice = typeof itInvoices.$inferSelect;
export type InsertItInvoice = typeof itInvoices.$inferInsert;

// 売上 (IT Sales)
export const itSales = pgTable("it_sales", {
  id: serial("id").primaryKey(),
  companyId: varchar("company_id", { length: 255 }),
  type: text("type").notNull().default("project"), // project, maintenance, consulting, support
  clientId: integer("client_id").references(() => itClients.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => itProjects.id, { onDelete: "set null" }),
  invoiceId: integer("invoice_id").references(() => itInvoices.id, { onDelete: "set null" }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  saleDate: timestamp("sale_date").defaultNow().notNull(),
  description: text("description"),
  notes: text("notes"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ItSale = typeof itSales.$inferSelect;
export type InsertItSale = typeof itSales.$inferInsert;
