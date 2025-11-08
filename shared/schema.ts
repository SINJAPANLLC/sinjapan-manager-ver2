import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  decimal,
  jsonb,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== AUTH TABLES (Replit Auth Required) ====================

// Session storage table - MANDATORY for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password"), // Hashed password for local auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 50 }).default("staff"), // CEO, Manager, Staff, AI, Agency, Client
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// ロール別権限管理
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: varchar("role", { length: 50 }).notNull(), // CEO, Manager, Staff, AI, Agency, Client
  resource: varchar("resource", { length: 100 }).notNull(), // users, businesses, tasks, finance, etc.
  canCreate: boolean("can_create").default(false),
  canRead: boolean("can_read").default(false),
  canUpdate: boolean("can_update").default(false),
  canDelete: boolean("can_delete").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// ==================== BUSINESS TABLES ====================

// 11 Business divisions
export const businesses = pgTable("businesses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  nameJa: varchar("name_ja", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, planning
  revenue: decimal("revenue", { precision: 15, scale: 2 }).default("0"),
  expenses: decimal("expenses", { precision: 15, scale: 2 }).default("0"),
  profit: decimal("profit", { precision: 15, scale: 2 }).default("0"),
  managerId: varchar("manager_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessesRelations = relations(businesses, ({ one, many }) => ({
  manager: one(users, {
    fields: [businesses.managerId],
    references: [users.id],
  }),
  contracts: many(contracts),
  shifts: many(shifts),
  quotes: many(quotes),
  projects: many(projects),
  meetings: many(meetings),
  jobPostings: many(jobPostings),
  transactions: many(transactions),
  kpis: many(kpis),
}));

export const insertBusinessSchema = createInsertSchema(businesses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBusiness = z.infer<typeof insertBusinessSchema>;
export type Business = typeof businesses.$inferSelect;

// ==================== CONTRACT TABLES ====================

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  clientName: varchar("client_name", { length: 255 }),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 50 }).default("active"), // active, expired, renewed, cancelled
  autoRenewal: boolean("auto_renewal").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contractsRelations = relations(contracts, ({ one }) => ({
  business: one(businesses, {
    fields: [contracts.businessId],
    references: [businesses.id],
  }),
}));

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

// ==================== BUSINESS OPERATIONS TABLES ====================

// シフト管理
export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  breakDuration: integer("break_duration").default(0), // 休憩時間（分）
  location: varchar("location", { length: 255 }),
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, confirmed, completed, absent, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const shiftsRelations = relations(shifts, ({ one }) => ({
  business: one(businesses, {
    fields: [shifts.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [shifts.userId],
    references: [users.id],
  }),
}));

export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Shift = typeof shifts.$inferSelect;

// 見積書
export const quotes = pgTable("quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  quoteNumber: varchar("quote_number", { length: 100 }).notNull(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientEmail: varchar("client_email", { length: 255 }),
  clientPhone: varchar("client_phone", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  items: jsonb("items").notNull(), // [{name, description, quantity, unitPrice, amount}]
  validUntil: timestamp("valid_until"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, approved, rejected, expired
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const quotesRelations = relations(quotes, ({ one }) => ({
  business: one(businesses, {
    fields: [quotes.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
}));

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = typeof quotes.$inferSelect;

// Note: invoicesテーブルは既存のDETAILED FINANCE TABLESセクションに定義されています

// 案件管理
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  projectNumber: varchar("project_number", { length: 100 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  clientName: varchar("client_name", { length: 255 }),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  estimatedBudget: decimal("estimated_budget", { precision: 15, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 15, scale: 2 }).default("0"),
  status: varchar("status", { length: 50 }).default("planning"), // planning, in_progress, on_hold, completed, cancelled
  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, urgent
  progress: integer("progress").default(0), // 0-100%
  managerId: varchar("manager_id").references(() => users.id),
  teamMembers: text("team_members").array(), // user IDs
  tags: text("tags").array(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectsRelations = relations(projects, ({ one, many }) => ({
  business: one(businesses, {
    fields: [projects.businessId],
    references: [businesses.id],
  }),
  manager: one(users, {
    fields: [projects.managerId],
    references: [users.id],
  }),
  meetings: many(meetings),
}));

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

// 面談管理
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  projectId: varchar("project_id").references(() => projects.id), // オプション：プロジェクトに関連する場合
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  location: varchar("location", { length: 500 }), // 場所またはURL
  meetingType: varchar("meeting_type", { length: 50 }).default("in_person"), // in_person, online, phone
  participants: text("participants").array(), // user IDs or external names
  organizer: varchar("organizer").references(() => users.id),
  agenda: text("agenda"),
  notes: text("notes"),
  actionItems: jsonb("action_items"), // [{task, assignee, dueDate, status}]
  status: varchar("status", { length: 50 }).default("scheduled"), // scheduled, completed, cancelled, rescheduled
  recordingUrl: varchar("recording_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const meetingsRelations = relations(meetings, ({ one }) => ({
  business: one(businesses, {
    fields: [meetings.businessId],
    references: [businesses.id],
  }),
  project: one(projects, {
    fields: [meetings.projectId],
    references: [projects.id],
  }),
  organizerUser: one(users, {
    fields: [meetings.organizer],
    references: [users.id],
  }),
}));

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// ==================== RECRUITMENT TABLES (INDEED連携) ====================

// 求人情報管理
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(), // 職種名
  description: text("description").notNull(), // 職務内容
  requirements: text("requirements"), // 応募要件
  location: varchar("location", { length: 255 }).notNull(), // 勤務地
  employmentType: varchar("employment_type", { length: 50 }).notNull(), // full-time, part-time, contract, internship
  salaryMin: decimal("salary_min", { precision: 15, scale: 2 }), // 最低給与
  salaryMax: decimal("salary_max", { precision: 15, scale: 2 }), // 最高給与
  benefits: text("benefits"), // 福利厚生
  status: varchar("status", { length: 50 }).default("draft"), // draft, published, closed
  postedAt: timestamp("posted_at"), // 公開日
  closedAt: timestamp("closed_at"), // 締切日
  indeedJobKey: varchar("indeed_job_key", { length: 255 }), // Indeed求人キー
  externalUrl: varchar("external_url", { length: 500 }), // 外部求人URL
  contactEmail: varchar("contact_email", { length: 255 }),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  business: one(businesses, {
    fields: [jobPostings.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [jobPostings.createdBy],
    references: [users.id],
  }),
  applicants: many(applicants),
}));

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;

// 応募者管理
export const applicants = pgTable("applicants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobPostingId: varchar("job_posting_id").references(() => jobPostings.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // 氏名
  email: varchar("email", { length: 255 }).notNull(), // メールアドレス
  phone: varchar("phone", { length: 50 }), // 電話番号
  resumeUrl: varchar("resume_url", { length: 500 }), // 履歴書URL
  coverLetter: text("cover_letter"), // 志望動機
  source: varchar("source", { length: 50 }).default("website"), // indeed, website, referral, linkedin, other
  status: varchar("status", { length: 50 }).default("applied"), // applied, screening, interview, offer, hired, rejected
  currentStage: varchar("current_stage", { length: 100 }), // 書類選考、一次面接、二次面接、最終面接など
  rating: integer("rating"), // 評価（1-5）
  appliedAt: timestamp("applied_at").defaultNow(), // 応募日
  interviewDate: timestamp("interview_date"), // 面接日
  notes: text("notes"), // メモ・評価コメント
  assignedTo: varchar("assigned_to").references(() => users.id), // 担当者
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applicantsRelations = relations(applicants, ({ one }) => ({
  jobPosting: one(jobPostings, {
    fields: [applicants.jobPostingId],
    references: [jobPostings.id],
  }),
  assignedUser: one(users, {
    fields: [applicants.assignedTo],
    references: [users.id],
  }),
}));

export const insertApplicantSchema = createInsertSchema(applicants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertApplicant = z.infer<typeof insertApplicantSchema>;
export type Applicant = typeof applicants.$inferSelect;

// ==================== FINANCIAL TABLES ====================

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // revenue, expense
  category: varchar("category", { length: 100 }), // PL category
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
  business: one(businesses, {
    fields: [transactions.businessId],
    references: [businesses.id],
  }),
}));

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// ==================== TASK TABLES ====================

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // sales, org, risk, expand
  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, urgent
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, cancelled
  assignedTo: varchar("assigned_to").references(() => users.id),
  businessId: varchar("business_id").references(() => businesses.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").references(() => users.id),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
    relationName: "assignedTasks",
  }),
  createdByUser: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "createdTasks",
  }),
  business: one(businesses, {
    fields: [tasks.businessId],
    references: [businesses.id],
  }),
}));

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

// ==================== KPI TABLES ====================

export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }), // %, ¥, count, etc.
  period: varchar("period", { length: 50 }).notNull(), // monthly, quarterly, yearly
  periodDate: timestamp("period_date").notNull(), // date representing the period
  targetValue: decimal("target_value", { precision: 15, scale: 2 }),
  changeRate: decimal("change_rate", { precision: 10, scale: 2 }), // % change from previous period
  createdAt: timestamp("created_at").defaultNow(),
});

export const kpisRelations = relations(kpis, ({ one }) => ({
  business: one(businesses, {
    fields: [kpis.businessId],
    references: [businesses.id],
  }),
}));

export const insertKpiSchema = createInsertSchema(kpis).omit({
  id: true,
  createdAt: true,
});

export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;

// ==================== COMMUNICATION TABLES ====================

export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // email, slack, line
  direction: varchar("direction", { length: 50 }).notNull(), // inbound, outbound
  sender: varchar("sender", { length: 255 }),
  recipient: varchar("recipient", { length: 255 }),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  metadata: jsonb("metadata"), // additional data like threadId, labels, etc.
  status: varchar("status", { length: 50 }).default("unread"), // unread, read, archived
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type Communication = typeof communications.$inferSelect;

// ==================== AI TABLES ====================

export const aiEvents = pgTable("ai_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentType: varchar("agent_type", { length: 50 }).notNull(), // SIGMA, MIZUKI, NEURAL
  actionType: varchar("action_type", { length: 100 }).notNull(), // analysis, task_generation, document_generation, etc.
  input: jsonb("input"),
  output: jsonb("output"),
  status: varchar("status", { length: 50 }).default("success"), // success, error, in_progress
  errorMessage: text("error_message"),
  executionTime: integer("execution_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiEventSchema = createInsertSchema(aiEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertAiEvent = z.infer<typeof insertAiEventSchema>;
export type AiEvent = typeof aiEvents.$inferSelect;

// AI Memory for long-term context
export const memory = pgTable("memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 50 }).notNull(), // fact, insight, decision, pattern
  content: text("content").notNull(),
  context: jsonb("context"), // related entities, metadata
  importance: integer("importance").default(5), // 1-10 scale
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMemorySchema = createInsertSchema(memory).omit({
  id: true,
  createdAt: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memory.$inferSelect;

// AI Chat History for persistent conversations
export const chatHistory = pgTable("chat_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id", { length: 255 }), // group related messages
  role: varchar("role", { length: 50 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // model used, tokens, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
  user: one(users, {
    fields: [chatHistory.userId],
    references: [users.id],
  }),
}));

export const insertChatHistorySchema = createInsertSchema(chatHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertChatHistory = z.infer<typeof insertChatHistorySchema>;
export type ChatHistory = typeof chatHistory.$inferSelect;

// AI Generated Content (images, documents, etc.)
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // image, document, video
  prompt: text("prompt").notNull(),
  result: text("result"), // URL for images, text for documents
  metadata: jsonb("metadata"), // model, size, format, etc.
  status: varchar("status", { length: 50 }).default("completed"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiGeneratedContentRelations = relations(aiGeneratedContent, ({ one }) => ({
  user: one(users, {
    fields: [aiGeneratedContent.userId],
    references: [users.id],
  }),
}));

export const insertAiGeneratedContentSchema = createInsertSchema(aiGeneratedContent).omit({
  id: true,
  createdAt: true,
});

export type InsertAiGeneratedContent = z.infer<typeof insertAiGeneratedContentSchema>;
export type AiGeneratedContent = typeof aiGeneratedContent.$inferSelect;

// Marketing Campaigns
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // email, social, content, paid_ads, event
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, paused, completed
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: integer("budget"),
  targetAudience: text("target_audience"),
  goals: jsonb("goals"), // { impressions: 10000, clicks: 1000, conversions: 100 }
  metrics: jsonb("metrics"), // actual performance metrics
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  business: one(businesses, {
    fields: [campaigns.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id],
  }),
  posts: many(socialPosts),
}));

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// Social Media Posts
export const socialPosts = pgTable("social_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").references(() => campaigns.id),
  businessId: varchar("business_id").references(() => businesses.id),
  platform: varchar("platform", { length: 50 }).notNull(), // twitter, instagram, facebook, linkedin
  content: text("content").notNull(),
  mediaUrls: text("media_urls").array(), // images, videos
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: varchar("status", { length: 50 }).default("draft"), // draft, scheduled, published, failed
  externalId: varchar("external_id", { length: 255 }), // ID from social platform
  metrics: jsonb("metrics"), // { likes: 0, shares: 0, comments: 0, impressions: 0 }
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialPostsRelations = relations(socialPosts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [socialPosts.campaignId],
    references: [campaigns.id],
  }),
  business: one(businesses, {
    fields: [socialPosts.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [socialPosts.createdBy],
    references: [users.id],
  }),
}));

export const insertSocialPostSchema = createInsertSchema(socialPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialPost = z.infer<typeof insertSocialPostSchema>;
export type SocialPost = typeof socialPosts.$inferSelect;

// Social Media Connections (OAuth tokens for SNS integration)
export const socialConnections = pgTable("social_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { length: 50 }).notNull(), // twitter, instagram, facebook, linkedin
  accessToken: text("access_token").notNull(), // OAuth access token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"), // Token expiration time
  platformUserId: varchar("platform_user_id", { length: 255 }), // User ID on the platform
  platformUsername: varchar("platform_username", { length: 255 }), // Username on the platform
  profileData: jsonb("profile_data"), // Additional profile information
  isActive: boolean("is_active").default(true), // Connection status
  lastUsed: timestamp("last_used"), // Last time connection was used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const socialConnectionsRelations = relations(socialConnections, ({ one }) => ({
  user: one(users, {
    fields: [socialConnections.userId],
    references: [users.id],
  }),
}));

export const insertSocialConnectionSchema = createInsertSchema(socialConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialConnection = z.infer<typeof insertSocialConnectionSchema>;
export type SocialConnection = typeof socialConnections.$inferSelect;

// ==================== CRM TABLES ====================

// 顧客企業
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  nameKana: varchar("name_kana", { length: 255 }),
  type: varchar("type", { length: 50 }).default("corporation"), // corporation, individual
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  postalCode: varchar("postal_code", { length: 20 }),
  address: text("address"),
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, prospective
  rating: varchar("rating", { length: 20 }), // A, B, C
  source: varchar("source", { length: 100 }), // referral, website, event, cold_call
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const customersRelations = relations(customers, ({ one, many }) => ({
  assignedUser: one(users, {
    fields: [customers.assignedTo],
    references: [users.id],
  }),
  contacts: many(contacts),
  leads: many(leads),
  deals: many(deals),
  activities: many(activities),
}));

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// 顧客担当者
export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  firstNameKana: varchar("first_name_kana", { length: 100 }),
  lastNameKana: varchar("last_name_kana", { length: 100 }),
  title: varchar("title", { length: 100 }), // 役職
  department: varchar("department", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  isPrimary: boolean("is_primary").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const contactsRelations = relations(contacts, ({ one }) => ({
  customer: one(customers, {
    fields: [contacts.customerId],
    references: [customers.id],
  }),
}));

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// 見込み顧客（リード）
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  title: varchar("title", { length: 100 }),
  source: varchar("source", { length: 100 }), // website, referral, event, cold_call
  status: varchar("status", { length: 50 }).default("new"), // new, contacted, qualified, unqualified, converted
  score: integer("score").default(0), // Lead scoring: 0-100
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  convertedToDealId: varchar("converted_to_deal_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const leadsRelations = relations(leads, ({ one }) => ({
  customer: one(customers, {
    fields: [leads.customerId],
    references: [customers.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
}));

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// 商談
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  stage: varchar("stage", { length: 50 }).default("prospecting"), // prospecting, qualification, proposal, negotiation, closed_won, closed_lost
  probability: integer("probability").default(0), // 0-100%
  expectedCloseDate: timestamp("expected_close_date"),
  actualCloseDate: timestamp("actual_close_date"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  source: varchar("source", { length: 100 }),
  nextStep: text("next_step"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const dealsRelations = relations(deals, ({ one, many }) => ({
  customer: one(customers, {
    fields: [deals.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [deals.businessId],
    references: [businesses.id],
  }),
  assignedUser: one(users, {
    fields: [deals.assignedTo],
    references: [users.id],
  }),
  activities: many(activities),
}));

export const insertDealSchema = createInsertSchema(deals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// 営業活動記録
export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  dealId: varchar("deal_id").references(() => deals.id),
  type: varchar("type", { length: 50 }).notNull(), // call, meeting, email, task, note
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("planned"), // planned, completed, cancelled
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  assignedTo: varchar("assigned_to").references(() => users.id),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activitiesRelations = relations(activities, ({ one }) => ({
  customer: one(customers, {
    fields: [activities.customerId],
    references: [customers.id],
  }),
  deal: one(deals, {
    fields: [activities.dealId],
    references: [deals.id],
  }),
  assignedUser: one(users, {
    fields: [activities.assignedTo],
    references: [users.id],
  }),
  completedByUser: one(users, {
    fields: [activities.completedBy],
    references: [users.id],
  }),
}));

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

// ==================== DETAILED FINANCE TABLES ====================

// 勘定科目マスタ
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  type: varchar("type", { length: 50 }).notNull(), // asset, liability, equity, revenue, expense
  category: varchar("category", { length: 100 }), // current_asset, fixed_asset, current_liability, long_term_liability, sales, cost_of_sales, operating_expense, non_operating
  parentId: varchar("parent_id").references((): any => accounts.id),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parent: one(accounts, {
    fields: [accounts.parentId],
    references: [accounts.id],
    relationName: "accountHierarchy",
  }),
  children: many(accounts, {
    relationName: "accountHierarchy",
  }),
  journalLines: many(journalEntryLines),
}));

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accounts.$inferSelect;

// 仕訳帳
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entryNumber: varchar("entry_number", { length: 50 }).notNull().unique(),
  entryDate: timestamp("entry_date").notNull(),
  description: text("description"),
  businessId: varchar("business_id").references(() => businesses.id),
  status: varchar("status", { length: 50 }).default("draft"), // draft, posted, approved, void
  reference: varchar("reference", { length: 100 }), // 参照番号（請求書番号など）
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  business: one(businesses, {
    fields: [journalEntries.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
    relationName: "journalCreator",
  }),
  approver: one(users, {
    fields: [journalEntries.approvedBy],
    references: [users.id],
    relationName: "journalApprover",
  }),
  lines: many(journalEntryLines),
}));

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// 仕訳明細
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id).notNull(),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  debit: decimal("debit", { precision: 15, scale: 2 }).default("0"),
  credit: decimal("credit", { precision: 15, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalEntryLines.accountId],
    references: [accounts.id],
  }),
}));

export const insertJournalEntryLineSchema = createInsertSchema(journalEntryLines).omit({
  id: true,
  createdAt: true,
});

export type InsertJournalEntryLine = z.infer<typeof insertJournalEntryLineSchema>;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;

// 予算
export const budgets = pgTable("budgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  accountId: varchar("account_id").references(() => accounts.id).notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // monthly, quarterly, yearly
  periodNumber: integer("period_number"), // 1-12 for monthly, 1-4 for quarterly
  budgetAmount: decimal("budget_amount", { precision: 15, scale: 2 }).notNull(),
  actualAmount: decimal("actual_amount", { precision: 15, scale: 2 }).default("0"),
  variance: decimal("variance", { precision: 15, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const budgetsRelations = relations(budgets, ({ one }) => ({
  business: one(businesses, {
    fields: [budgets.businessId],
    references: [businesses.id],
  }),
  account: one(accounts, {
    fields: [budgets.accountId],
    references: [accounts.id],
  }),
}));

export const insertBudgetSchema = createInsertSchema(budgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

// 請求書
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: varchar("customer_id").references(() => customers.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id),
  issueDate: timestamp("issue_date").notNull(),
  dueDate: timestamp("due_date").notNull(),
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 15, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 15, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft"), // draft, sent, paid, overdue, cancelled
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// 請求書明細
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id).notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1"),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("10"), // 消費税率
  createdAt: timestamp("created_at").defaultNow(),
});

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// 支払い記録
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").references(() => invoices.id),
  paymentNumber: varchar("payment_number", { length: 50 }).notNull().unique(),
  paymentDate: timestamp("payment_date").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, credit_card, cash, check
  reference: varchar("reference", { length: 100 }), // 取引参照番号
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  creator: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;

// 経費精算
export const expenseReports = pgTable("expense_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportNumber: varchar("report_number", { length: 50 }).notNull().unique(),
  submittedBy: varchar("submitted_by").references(() => users.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalAmount: decimal("total_amount", { precision: 15, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).default("draft"), // draft, submitted, approved, rejected, paid
  submittedAt: timestamp("submitted_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const expenseReportsRelations = relations(expenseReports, ({ one, many }) => ({
  submitter: one(users, {
    fields: [expenseReports.submittedBy],
    references: [users.id],
    relationName: "expenseSubmitter",
  }),
  business: one(businesses, {
    fields: [expenseReports.businessId],
    references: [businesses.id],
  }),
  approver: one(users, {
    fields: [expenseReports.approvedBy],
    references: [users.id],
    relationName: "expenseApprover",
  }),
  items: many(expenseItems),
}));

export const insertExpenseReportSchema = createInsertSchema(expenseReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExpenseReport = z.infer<typeof insertExpenseReportSchema>;
export type ExpenseReport = typeof expenseReports.$inferSelect;

// 経費明細
export const expenseItems = pgTable("expense_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseReportId: varchar("expense_report_id").references(() => expenseReports.id).notNull(),
  expenseDate: timestamp("expense_date").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // travel, meal, entertainment, supplies, etc.
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  receipt: varchar("receipt", { length: 500 }), // URL to receipt image
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const expenseItemsRelations = relations(expenseItems, ({ one }) => ({
  expenseReport: one(expenseReports, {
    fields: [expenseItems.expenseReportId],
    references: [expenseReports.id],
  }),
}));

export const insertExpenseItemSchema = createInsertSchema(expenseItems).omit({
  id: true,
  createdAt: true,
});

export type InsertExpenseItem = z.infer<typeof insertExpenseItemSchema>;
export type ExpenseItem = typeof expenseItems.$inferSelect;

// ==================== WORKFLOW MANAGEMENT TABLES ====================

// ワークフローテンプレート
export const workflows = pgTable("workflows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // contract, expense, approval, project, marketing
  version: integer("version").default(1),
  isTemplate: boolean("is_template").default(true), // テンプレートか実行インスタンスか
  isActive: boolean("is_active").default(true),
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  color: varchar("color", { length: 50 }), // Color for visualization
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowsRelations = relations(workflows, ({ one, many }) => ({
  creator: one(users, {
    fields: [workflows.createdBy],
    references: [users.id],
  }),
  steps: many(workflowSteps),
  connections: many(workflowConnections),
  executions: many(workflowExecutions),
  triggers: many(workflowTriggers),
  documents: many(workflowDocuments),
}));

export const insertWorkflowSchema = createInsertSchema(workflows).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflow = z.infer<typeof insertWorkflowSchema>;
export type Workflow = typeof workflows.$inferSelect;

// ワークフローステップ
export const workflowSteps = pgTable("workflow_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // task, approval, automation, condition, start, end
  position: jsonb("position"), // { x: number, y: number } for visualization
  config: jsonb("config"), // ステップ固有の設定
  manualContent: text("manual_content"), // マニュアル・手順書
  assigneeRole: varchar("assignee_role", { length: 50 }), // CEO, Manager, Staff
  estimatedDuration: integer("estimated_duration"), // 予想所要時間（分）
  rewardAmount: decimal("reward_amount", { precision: 15, scale: 2 }), // 報酬金額
  isRequired: boolean("is_required").default(true),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowStepsRelations = relations(workflowSteps, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowSteps.workflowId],
    references: [workflows.id],
  }),
  sourceConnections: many(workflowConnections, {
    relationName: "sourceStep",
  }),
  targetConnections: many(workflowConnections, {
    relationName: "targetStep",
  }),
  executionSteps: many(workflowExecutionSteps),
}));

export const insertWorkflowStepSchema = createInsertSchema(workflowSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowStep = z.infer<typeof insertWorkflowStepSchema>;
export type WorkflowStep = typeof workflowSteps.$inferSelect;

// ワークフロー接続（エッジ）
export const workflowConnections = pgTable("workflow_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  sourceStepId: varchar("source_step_id").references(() => workflowSteps.id).notNull(),
  targetStepId: varchar("target_step_id").references(() => workflowSteps.id).notNull(),
  label: varchar("label", { length: 255 }), // 条件ラベル（承認/却下など）
  condition: jsonb("condition"), // 条件式
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowConnectionsRelations = relations(workflowConnections, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowConnections.workflowId],
    references: [workflows.id],
  }),
  sourceStep: one(workflowSteps, {
    fields: [workflowConnections.sourceStepId],
    references: [workflowSteps.id],
    relationName: "sourceStep",
  }),
  targetStep: one(workflowSteps, {
    fields: [workflowConnections.targetStepId],
    references: [workflowSteps.id],
    relationName: "targetStep",
  }),
}));

export const insertWorkflowConnectionSchema = createInsertSchema(workflowConnections).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowConnection = z.infer<typeof insertWorkflowConnectionSchema>;
export type WorkflowConnection = typeof workflowConnections.$inferSelect;

// ワークフロー実行インスタンス
export const workflowExecutions = pgTable("workflow_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("running"), // running, completed, failed, cancelled, paused
  currentStepId: varchar("current_step_id").references(() => workflowSteps.id),
  initiatedBy: varchar("initiated_by").references(() => users.id),
  businessId: varchar("business_id").references(() => businesses.id),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // customer, deal, invoice, contract
  relatedEntityId: varchar("related_entity_id", { length: 255 }),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata"), // 実行時のコンテキストデータ
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowExecutionsRelations = relations(workflowExecutions, ({ one, many }) => ({
  workflow: one(workflows, {
    fields: [workflowExecutions.workflowId],
    references: [workflows.id],
  }),
  currentStep: one(workflowSteps, {
    fields: [workflowExecutions.currentStepId],
    references: [workflowSteps.id],
  }),
  initiator: one(users, {
    fields: [workflowExecutions.initiatedBy],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [workflowExecutions.businessId],
    references: [businesses.id],
  }),
  executionSteps: many(workflowExecutionSteps),
  logs: many(workflowLogs),
}));

export const insertWorkflowExecutionSchema = createInsertSchema(workflowExecutions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowExecution = z.infer<typeof insertWorkflowExecutionSchema>;
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;

// ワークフロー実行ステップ
export const workflowExecutionSteps = pgTable("workflow_execution_steps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").references(() => workflowExecutions.id).notNull(),
  stepId: varchar("step_id").references(() => workflowSteps.id).notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, in_progress, completed, failed, skipped
  assignedTo: varchar("assigned_to").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  result: jsonb("result"), // ステップの実行結果
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowExecutionStepsRelations = relations(workflowExecutionSteps, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [workflowExecutionSteps.executionId],
    references: [workflowExecutions.id],
  }),
  step: one(workflowSteps, {
    fields: [workflowExecutionSteps.stepId],
    references: [workflowSteps.id],
  }),
  assignedUser: one(users, {
    fields: [workflowExecutionSteps.assignedTo],
    references: [users.id],
    relationName: "assignedExecutionSteps",
  }),
  completedByUser: one(users, {
    fields: [workflowExecutionSteps.completedBy],
    references: [users.id],
    relationName: "completedExecutionSteps",
  }),
}));

export const insertWorkflowExecutionStepSchema = createInsertSchema(workflowExecutionSteps).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowExecutionStep = z.infer<typeof insertWorkflowExecutionStepSchema>;
export type WorkflowExecutionStep = typeof workflowExecutionSteps.$inferSelect;

// ワークフローログ
export const workflowLogs = pgTable("workflow_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  executionId: varchar("execution_id").references(() => workflowExecutions.id).notNull(),
  stepId: varchar("step_id").references(() => workflowSteps.id),
  level: varchar("level", { length: 20 }).default("info"), // info, warning, error, success
  message: text("message").notNull(),
  metadata: jsonb("metadata"),
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workflowLogsRelations = relations(workflowLogs, ({ one }) => ({
  execution: one(workflowExecutions, {
    fields: [workflowLogs.executionId],
    references: [workflowExecutions.id],
  }),
  step: one(workflowSteps, {
    fields: [workflowLogs.stepId],
    references: [workflowSteps.id],
  }),
  user: one(users, {
    fields: [workflowLogs.userId],
    references: [users.id],
  }),
}));

export const insertWorkflowLogSchema = createInsertSchema(workflowLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertWorkflowLog = z.infer<typeof insertWorkflowLogSchema>;
export type WorkflowLog = typeof workflowLogs.$inferSelect;

// ワークフロートリガー
export const workflowTriggers = pgTable("workflow_triggers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // schedule, event, manual, webhook
  config: jsonb("config"), // トリガー固有の設定（cron式、イベントタイプなど）
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowTriggersRelations = relations(workflowTriggers, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowTriggers.workflowId],
    references: [workflows.id],
  }),
}));

export const insertWorkflowTriggerSchema = createInsertSchema(workflowTriggers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowTrigger = z.infer<typeof insertWorkflowTriggerSchema>;
export type WorkflowTrigger = typeof workflowTriggers.$inferSelect;

// ワークフロードキュメント
export const workflowDocuments = pgTable("workflow_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workflowId: varchar("workflow_id").references(() => workflows.id).notNull(),
  stepId: varchar("step_id").references(() => workflowSteps.id),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"), // Markdown形式
  fileUrl: varchar("file_url", { length: 500 }), // 添付ファイルURL
  type: varchar("type", { length: 50 }).default("manual"), // manual, guide, template, checklist
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workflowDocumentsRelations = relations(workflowDocuments, ({ one }) => ({
  workflow: one(workflows, {
    fields: [workflowDocuments.workflowId],
    references: [workflows.id],
  }),
  step: one(workflowSteps, {
    fields: [workflowDocuments.stepId],
    references: [workflowSteps.id],
  }),
  creator: one(users, {
    fields: [workflowDocuments.createdBy],
    references: [users.id],
  }),
}));

export const insertWorkflowDocumentSchema = createInsertSchema(workflowDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertWorkflowDocument = z.infer<typeof insertWorkflowDocumentSchema>;
export type WorkflowDocument = typeof workflowDocuments.$inferSelect;

// ==================== KGI/KPI/KTF MANAGEMENT TABLES ====================

// 指標定義（KGI/KPI/KTF統合管理）
export const indicators = pgTable("indicators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // kgi, kpi, ktf
  category: varchar("category", { length: 100 }), // sales, finance, operations, marketing, hr
  parentId: varchar("parent_id").references((): any => indicators.id), // 階層構造
  formula: text("formula"), // 計算式
  unit: varchar("unit", { length: 50 }), // %, ¥, 件, 時間, etc.
  targetValue: decimal("target_value", { precision: 15, scale: 2 }),
  warningThreshold: decimal("warning_threshold", { precision: 15, scale: 2 }), // 警告閾値
  criticalThreshold: decimal("critical_threshold", { precision: 15, scale: 2 }), // 危険閾値
  measurementFrequency: varchar("measurement_frequency", { length: 50 }), // daily, weekly, monthly, quarterly, yearly
  dataSource: varchar("data_source", { length: 100 }), // manual, auto_calculated, api_integration
  ownerId: varchar("owner_id").references(() => users.id), // 指標責任者
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // 優先度
  tags: text("tags").array(), // タグ
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const indicatorsRelations = relations(indicators, ({ one, many }) => ({
  business: one(businesses, {
    fields: [indicators.businessId],
    references: [businesses.id],
  }),
  parent: one(indicators, {
    fields: [indicators.parentId],
    references: [indicators.id],
    relationName: "indicatorHierarchy",
  }),
  children: many(indicators, {
    relationName: "indicatorHierarchy",
  }),
  owner: one(users, {
    fields: [indicators.ownerId],
    references: [users.id],
    relationName: "indicatorOwner",
  }),
  creator: one(users, {
    fields: [indicators.createdBy],
    references: [users.id],
    relationName: "indicatorCreator",
  }),
  measurements: many(indicatorMeasurements),
  targets: many(indicatorTargets),
  dependencies: many(indicatorDependencies, {
    relationName: "dependentIndicator",
  }),
  dependents: many(indicatorDependencies, {
    relationName: "sourceIndicator",
  }),
}));

export const insertIndicatorSchema = createInsertSchema(indicators).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIndicator = z.infer<typeof insertIndicatorSchema>;
export type Indicator = typeof indicators.$inferSelect;

// 指標実績データ
export const indicatorMeasurements = pgTable("indicator_measurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  indicatorId: varchar("indicator_id").references(() => indicators.id).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  status: varchar("status", { length: 50 }).default("normal"), // normal, warning, critical, excellent
  variance: decimal("variance", { precision: 15, scale: 2 }), // 目標との差異
  variancePercent: decimal("variance_percent", { precision: 10, scale: 2 }), // 差異率
  previousValue: decimal("previous_value", { precision: 15, scale: 2 }), // 前期の値
  changeRate: decimal("change_rate", { precision: 10, scale: 2 }), // 前期比
  notes: text("notes"),
  measuredBy: varchar("measured_by").references(() => users.id),
  measuredAt: timestamp("measured_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const indicatorMeasurementsRelations = relations(indicatorMeasurements, ({ one }) => ({
  indicator: one(indicators, {
    fields: [indicatorMeasurements.indicatorId],
    references: [indicators.id],
  }),
  measuredByUser: one(users, {
    fields: [indicatorMeasurements.measuredBy],
    references: [users.id],
  }),
}));

export const insertIndicatorMeasurementSchema = createInsertSchema(indicatorMeasurements).omit({
  id: true,
  createdAt: true,
});

export type InsertIndicatorMeasurement = z.infer<typeof insertIndicatorMeasurementSchema>;
export type IndicatorMeasurement = typeof indicatorMeasurements.$inferSelect;

// 指標目標設定
export const indicatorTargets = pgTable("indicator_targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  indicatorId: varchar("indicator_id").references(() => indicators.id).notNull(),
  fiscalYear: integer("fiscal_year").notNull(),
  quarter: integer("quarter"), // 1-4
  month: integer("month"), // 1-12
  targetValue: decimal("target_value", { precision: 15, scale: 2 }).notNull(),
  stretchTarget: decimal("stretch_target", { precision: 15, scale: 2 }), // ストレッチ目標
  minimumTarget: decimal("minimum_target", { precision: 15, scale: 2 }), // 最低目標
  description: text("description"),
  setBy: varchar("set_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const indicatorTargetsRelations = relations(indicatorTargets, ({ one }) => ({
  indicator: one(indicators, {
    fields: [indicatorTargets.indicatorId],
    references: [indicators.id],
  }),
  setter: one(users, {
    fields: [indicatorTargets.setBy],
    references: [users.id],
  }),
}));

export const insertIndicatorTargetSchema = createInsertSchema(indicatorTargets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIndicatorTarget = z.infer<typeof insertIndicatorTargetSchema>;
export type IndicatorTarget = typeof indicatorTargets.$inferSelect;

// 指標間の依存関係
export const indicatorDependencies = pgTable("indicator_dependencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceIndicatorId: varchar("source_indicator_id").references(() => indicators.id).notNull(),
  dependentIndicatorId: varchar("dependent_indicator_id").references(() => indicators.id).notNull(),
  relationshipType: varchar("relationship_type", { length: 50 }).default("influences"), // influences, requires, blocks
  weight: decimal("weight", { precision: 5, scale: 2 }), // 影響度の重み
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const indicatorDependenciesRelations = relations(indicatorDependencies, ({ one }) => ({
  sourceIndicator: one(indicators, {
    fields: [indicatorDependencies.sourceIndicatorId],
    references: [indicators.id],
    relationName: "sourceIndicator",
  }),
  dependentIndicator: one(indicators, {
    fields: [indicatorDependencies.dependentIndicatorId],
    references: [indicators.id],
    relationName: "dependentIndicator",
  }),
}));

export const insertIndicatorDependencySchema = createInsertSchema(indicatorDependencies).omit({
  id: true,
  createdAt: true,
});

export type InsertIndicatorDependency = z.infer<typeof insertIndicatorDependencySchema>;
export type IndicatorDependency = typeof indicatorDependencies.$inferSelect;

// ボトルネック分析
export const bottlenecks = pgTable("bottlenecks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  indicatorId: varchar("indicator_id").references(() => indicators.id),
  workflowId: varchar("workflow_id").references(() => workflows.id),
  dealId: varchar("deal_id").references(() => deals.id),
  taskId: varchar("task_id").references(() => tasks.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // performance, process, resource, dependency
  severity: varchar("severity", { length: 50 }).default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 50 }).default("identified"), // identified, analyzing, resolving, resolved
  impactArea: varchar("impact_area", { length: 100 }), // sales, finance, operations, etc.
  estimatedImpact: decimal("estimated_impact", { precision: 15, scale: 2 }), // 推定影響額
  rootCause: text("root_cause"),
  proposedSolution: text("proposed_solution"),
  identifiedBy: varchar("identified_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  identifiedAt: timestamp("identified_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const bottlenecksRelations = relations(bottlenecks, ({ one }) => ({
  indicator: one(indicators, {
    fields: [bottlenecks.indicatorId],
    references: [indicators.id],
  }),
  workflow: one(workflows, {
    fields: [bottlenecks.workflowId],
    references: [workflows.id],
  }),
  deal: one(deals, {
    fields: [bottlenecks.dealId],
    references: [deals.id],
  }),
  task: one(tasks, {
    fields: [bottlenecks.taskId],
    references: [tasks.id],
  }),
  identifier: one(users, {
    fields: [bottlenecks.identifiedBy],
    references: [users.id],
    relationName: "bottleneckIdentifier",
  }),
  assignee: one(users, {
    fields: [bottlenecks.assignedTo],
    references: [users.id],
    relationName: "bottleneckAssignee",
  }),
}));

export const insertBottleneckSchema = createInsertSchema(bottlenecks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBottleneck = z.infer<typeof insertBottleneckSchema>;
export type Bottleneck = typeof bottlenecks.$inferSelect;

// パフォーマンス分析スナップショット
export const performanceSnapshots = pgTable("performance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  snapshotDate: timestamp("snapshot_date").notNull(),
  period: varchar("period", { length: 50 }).notNull(), // daily, weekly, monthly, quarterly, yearly
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }), // 総合スコア 0-100
  kgiAchievementRate: decimal("kgi_achievement_rate", { precision: 5, scale: 2 }), // KGI達成率
  kpiAchievementRate: decimal("kpi_achievement_rate", { precision: 5, scale: 2 }), // KPI達成率
  ktfCompletionRate: decimal("ktf_completion_rate", { precision: 5, scale: 2 }), // KTF完了率
  bottleneckCount: integer("bottleneck_count").default(0),
  criticalIssues: integer("critical_issues").default(0),
  improvements: jsonb("improvements"), // 改善点リスト
  highlights: jsonb("highlights"), // ハイライト
  metadata: jsonb("metadata"), // その他の分析データ
  createdAt: timestamp("created_at").defaultNow(),
});

export const performanceSnapshotsRelations = relations(performanceSnapshots, ({ one }) => ({
  business: one(businesses, {
    fields: [performanceSnapshots.businessId],
    references: [businesses.id],
  }),
}));

export const insertPerformanceSnapshotSchema = createInsertSchema(performanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export type InsertPerformanceSnapshot = z.infer<typeof insertPerformanceSnapshotSchema>;
export type PerformanceSnapshot = typeof performanceSnapshots.$inferSelect;

// ==================== DIFFERENTIATION STRATEGY TABLES ====================

// 競合企業
export const competitors = pgTable("competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  industry: varchar("industry", { length: 100 }),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  size: varchar("size", { length: 50 }), // startup, small, medium, large, enterprise
  marketShare: decimal("market_share", { precision: 5, scale: 2 }), // %
  revenue: decimal("revenue", { precision: 15, scale: 2 }), // 推定売上
  employeeCount: integer("employee_count"),
  foundedYear: integer("founded_year"),
  headquarters: varchar("headquarters", { length: 255 }),
  targetMarket: text("target_market").array(),
  productServices: text("product_services").array(),
  pricingModel: varchar("pricing_model", { length: 100 }),
  overallThreatLevel: varchar("overall_threat_level", { length: 50 }).default("medium"), // low, medium, high, critical
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const competitorsRelations = relations(competitors, ({ one, many }) => ({
  creator: one(users, {
    fields: [competitors.createdBy],
    references: [users.id],
  }),
  strengths: many(competitorStrengths),
  businessCompetitors: many(businessCompetitors),
  metrics: many(competitorMetrics),
  comparisons: many(competitorComparisons),
}));

export const insertCompetitorSchema = createInsertSchema(competitors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompetitor = z.infer<typeof insertCompetitorSchema>;
export type Competitor = typeof competitors.$inferSelect;

// 競合の強み・弱み分析
export const competitorStrengths = pgTable("competitor_strengths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorId: varchar("competitor_id").references(() => competitors.id).notNull(),
  category: varchar("category", { length: 50 }).notNull(), // strength, weakness, opportunity, threat
  area: varchar("area", { length: 100 }), // technology, marketing, sales, support, pricing, etc.
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  impact: varchar("impact", { length: 50 }).default("medium"), // low, medium, high
  evidence: text("evidence"), // 根拠・証拠
  source: varchar("source", { length: 255 }), // 情報源
  identifiedAt: timestamp("identified_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitorStrengthsRelations = relations(competitorStrengths, ({ one }) => ({
  competitor: one(competitors, {
    fields: [competitorStrengths.competitorId],
    references: [competitors.id],
  }),
  creator: one(users, {
    fields: [competitorStrengths.createdBy],
    references: [users.id],
  }),
}));

export const insertCompetitorStrengthSchema = createInsertSchema(competitorStrengths).omit({
  id: true,
  createdAt: true,
});

export type InsertCompetitorStrength = z.infer<typeof insertCompetitorStrengthSchema>;
export type CompetitorStrength = typeof competitorStrengths.$inferSelect;

// 事業部門と競合の関連
export const businessCompetitors = pgTable("business_competitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  competitorId: varchar("competitor_id").references(() => competitors.id).notNull(),
  competitionIntensity: varchar("competition_intensity", { length: 50 }).default("medium"), // low, medium, high
  marketOverlap: decimal("market_overlap", { precision: 5, scale: 2 }), // %
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const businessCompetitorsRelations = relations(businessCompetitors, ({ one }) => ({
  business: one(businesses, {
    fields: [businessCompetitors.businessId],
    references: [businesses.id],
  }),
  competitor: one(competitors, {
    fields: [businessCompetitors.competitorId],
    references: [competitors.id],
  }),
}));

export const insertBusinessCompetitorSchema = createInsertSchema(businessCompetitors).omit({
  id: true,
  createdAt: true,
});

export type InsertBusinessCompetitor = z.infer<typeof insertBusinessCompetitorSchema>;
export type BusinessCompetitor = typeof businessCompetitors.$inferSelect;

// 競合メトリクス
export const competitorMetrics = pgTable("competitor_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  competitorId: varchar("competitor_id").references(() => competitors.id).notNull(),
  metricName: varchar("metric_name", { length: 255 }).notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  period: varchar("period", { length: 50 }), // monthly, quarterly, yearly
  periodDate: timestamp("period_date"),
  source: varchar("source", { length: 255 }),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitorMetricsRelations = relations(competitorMetrics, ({ one }) => ({
  competitor: one(competitors, {
    fields: [competitorMetrics.competitorId],
    references: [competitors.id],
  }),
}));

export const insertCompetitorMetricSchema = createInsertSchema(competitorMetrics).omit({
  id: true,
  createdAt: true,
});

export type InsertCompetitorMetric = z.infer<typeof insertCompetitorMetricSchema>;
export type CompetitorMetric = typeof competitorMetrics.$inferSelect;

// SWOT分析プロファイル
export const swotProfiles = pgTable("swot_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  period: varchar("period", { length: 50 }), // Q1 2025, FY2025, etc.
  strengths: jsonb("strengths"), // [{ title, description, impact }]
  weaknesses: jsonb("weaknesses"),
  opportunities: jsonb("opportunities"),
  threats: jsonb("threats"),
  strategicImplications: text("strategic_implications"),
  actionItems: jsonb("action_items"), // [{ action, priority, owner, deadline }]
  status: varchar("status", { length: 50 }).default("draft"), // draft, active, archived
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const swotProfilesRelations = relations(swotProfiles, ({ one }) => ({
  business: one(businesses, {
    fields: [swotProfiles.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [swotProfiles.createdBy],
    references: [users.id],
  }),
}));

export const insertSwotProfileSchema = createInsertSchema(swotProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSwotProfile = z.infer<typeof insertSwotProfileSchema>;
export type SwotProfile = typeof swotProfiles.$inferSelect;

// 市場ポジショニング
export const positioningCanvases = pgTable("positioning_canvases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  targetCustomer: text("target_customer"), // ターゲット顧客
  customerNeeds: text("customer_needs").array(), // 顧客ニーズ
  marketCategory: varchar("market_category", { length: 100 }), // 市場カテゴリ
  competitiveAlternatives: text("competitive_alternatives").array(), // 競合代替品
  uniqueValue: text("unique_value"), // 独自の価値
  keyDifferentiator: text("key_differentiator"), // 主要な差別化要因
  proofPoints: text("proof_points").array(), // 証拠・実績
  valueProposition: text("value_proposition"), // 価値提案
  brandPosition: varchar("brand_position", { length: 255 }), // ブランドポジション
  messagingPillars: jsonb("messaging_pillars"), // メッセージングの柱
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const positioningCanvasesRelations = relations(positioningCanvases, ({ one }) => ({
  business: one(businesses, {
    fields: [positioningCanvases.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [positioningCanvases.createdBy],
    references: [users.id],
  }),
}));

export const insertPositioningCanvasSchema = createInsertSchema(positioningCanvases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPositioningCanvas = z.infer<typeof insertPositioningCanvasSchema>;
export type PositioningCanvas = typeof positioningCanvases.$inferSelect;

// 差別化要因
export const differentiationFactors = pgTable("differentiation_factors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // product, service, technology, pricing, support, brand, process
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  uspStatement: text("usp_statement"), // USP（独自の売り提案）
  competitiveAdvantage: text("competitive_advantage"), // 競争優位性
  sustainability: varchar("sustainability", { length: 50 }).default("medium"), // low, medium, high - 持続可能性
  implementationDifficulty: varchar("implementation_difficulty", { length: 50 }), // easy, medium, hard
  customerImpact: varchar("customer_impact", { length: 50 }).default("medium"), // low, medium, high
  evidenceMetrics: text("evidence_metrics").array(), // 証拠となる指標
  relatedIndicatorIds: text("related_indicator_ids").array(), // KPI連携
  priority: integer("priority").default(0),
  status: varchar("status", { length: 50 }).default("active"), // active, developing, retired
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const differentiationFactorsRelations = relations(differentiationFactors, ({ one, many }) => ({
  business: one(businesses, {
    fields: [differentiationFactors.businessId],
    references: [businesses.id],
  }),
  creator: one(users, {
    fields: [differentiationFactors.createdBy],
    references: [users.id],
  }),
  initiatives: many(differentiationInitiatives),
}));

export const insertDifferentiationFactorSchema = createInsertSchema(differentiationFactors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDifferentiationFactor = z.infer<typeof insertDifferentiationFactorSchema>;
export type DifferentiationFactor = typeof differentiationFactors.$inferSelect;

// 競合比較分析
export const competitorComparisons = pgTable("competitor_comparisons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  competitorId: varchar("competitor_id").references(() => competitors.id).notNull(),
  dimension: varchar("dimension", { length: 100 }).notNull(), // feature, price, quality, support, etc.
  ourScore: decimal("our_score", { precision: 5, scale: 2 }), // 0-100
  competitorScore: decimal("competitor_score", { precision: 5, scale: 2 }), // 0-100
  ourValue: text("our_value"), // 具体的な値・内容
  competitorValue: text("competitor_value"),
  advantage: varchar("advantage", { length: 50 }), // us, competitor, neutral
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const competitorComparisonsRelations = relations(competitorComparisons, ({ one }) => ({
  business: one(businesses, {
    fields: [competitorComparisons.businessId],
    references: [businesses.id],
  }),
  competitor: one(competitors, {
    fields: [competitorComparisons.competitorId],
    references: [competitors.id],
  }),
}));

export const insertCompetitorComparisonSchema = createInsertSchema(competitorComparisons).omit({
  id: true,
  createdAt: true,
});

export type InsertCompetitorComparison = z.infer<typeof insertCompetitorComparisonSchema>;
export type CompetitorComparison = typeof competitorComparisons.$inferSelect;

// 差別化施策
export const differentiationInitiatives = pgTable("differentiation_initiatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  factorId: varchar("factor_id").references(() => differentiationFactors.id),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  objective: text("objective"), // 目的
  targetOutcome: text("target_outcome"), // 期待される結果
  budget: decimal("budget", { precision: 15, scale: 2 }),
  timeline: varchar("timeline", { length: 100 }),
  startDate: timestamp("start_date"),
  targetCompletionDate: timestamp("target_completion_date"),
  status: varchar("status", { length: 50 }).default("planned"), // planned, in_progress, completed, on_hold, cancelled
  priority: varchar("priority", { length: 50 }).default("medium"), // low, medium, high, critical
  ownerId: varchar("owner_id").references(() => users.id),
  teamMembers: text("team_members").array(), // User IDs
  milestones: jsonb("milestones"), // [{ title, date, status, description }]
  relatedKpiIds: text("related_kpi_ids").array(), // KPI連携
  expectedImpact: text("expected_impact"),
  actualImpact: text("actual_impact"),
  lessonsLearned: text("lessons_learned"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const differentiationInitiativesRelations = relations(differentiationInitiatives, ({ one, many }) => ({
  business: one(businesses, {
    fields: [differentiationInitiatives.businessId],
    references: [businesses.id],
  }),
  factor: one(differentiationFactors, {
    fields: [differentiationInitiatives.factorId],
    references: [differentiationFactors.id],
  }),
  owner: one(users, {
    fields: [differentiationInitiatives.ownerId],
    references: [users.id],
    relationName: "initiativeOwner",
  }),
  creator: one(users, {
    fields: [differentiationInitiatives.createdBy],
    references: [users.id],
    relationName: "initiativeCreator",
  }),
  progress: many(initiativeProgress),
}));

export const insertDifferentiationInitiativeSchema = createInsertSchema(differentiationInitiatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDifferentiationInitiative = z.infer<typeof insertDifferentiationInitiativeSchema>;
export type DifferentiationInitiative = typeof differentiationInitiatives.$inferSelect;

// 施策進捗
export const initiativeProgress = pgTable("initiative_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  initiativeId: varchar("initiative_id").references(() => differentiationInitiatives.id).notNull(),
  progressPercent: decimal("progress_percent", { precision: 5, scale: 2 }).notNull(), // 0-100
  status: varchar("status", { length: 50 }).notNull(),
  update: text("update").notNull(),
  challenges: text("challenges"),
  nextSteps: text("next_steps"),
  recordedBy: varchar("recorded_by").references(() => users.id),
  recordedAt: timestamp("recorded_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const initiativeProgressRelations = relations(initiativeProgress, ({ one }) => ({
  initiative: one(differentiationInitiatives, {
    fields: [initiativeProgress.initiativeId],
    references: [differentiationInitiatives.id],
  }),
  recorder: one(users, {
    fields: [initiativeProgress.recordedBy],
    references: [users.id],
  }),
}));

export const insertInitiativeProgressSchema = createInsertSchema(initiativeProgress).omit({
  id: true,
  createdAt: true,
});

export type InsertInitiativeProgress = z.infer<typeof insertInitiativeProgressSchema>;
export type InitiativeProgress = typeof initiativeProgress.$inferSelect;

// ==================== PAYROLL & HR TABLES ====================

// 従業員マスタ
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeNumber: varchar("employee_number", { length: 50 }).unique().notNull(),
  userId: varchar("user_id").references(() => users.id), // Link to user account (optional)
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  firstNameKana: varchar("first_name_kana", { length: 100 }),
  lastNameKana: varchar("last_name_kana", { length: 100 }),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: varchar("gender", { length: 20 }),
  hireDate: timestamp("hire_date").notNull(),
  terminationDate: timestamp("termination_date"),
  employmentStatus: varchar("employment_status", { length: 50 }).default("active"), // active, on_leave, terminated
  employmentType: varchar("employment_type", { length: 50 }).default("full_time"), // full_time, part_time, contract, intern
  department: varchar("department", { length: 100 }),
  position: varchar("position", { length: 100 }),
  grade: varchar("grade", { length: 50 }), // 等級
  bankName: varchar("bank_name", { length: 100 }),
  bankBranch: varchar("bank_branch", { length: 100 }),
  bankAccountType: varchar("bank_account_type", { length: 50 }), // ordinary, checking
  bankAccountNumber: varchar("bank_account_number", { length: 50 }),
  bankAccountHolder: varchar("bank_account_holder", { length: 255 }),
  socialInsuranceNumber: varchar("social_insurance_number", { length: 50 }), // 社会保険番号
  taxIdNumber: varchar("tax_id_number", { length: 50 }), // マイナンバー等（暗号化推奨）
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  business: one(businesses, {
    fields: [employees.businessId],
    references: [businesses.id],
  }),
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [employees.createdBy],
    references: [users.id],
    relationName: "employeeCreator",
  }),
  compensationProfiles: many(compensationProfiles),
  payrollLineItems: many(payrollLineItems),
}));

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;

// 報酬プロファイル（給与構成）
export const compensationProfiles = pgTable("compensation_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  effectiveFrom: timestamp("effective_from").notNull(),
  effectiveTo: timestamp("effective_to"),
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).notNull(), // 基本給
  housingAllowance: decimal("housing_allowance", { precision: 15, scale: 2 }).default("0"), // 住宅手当
  transportAllowance: decimal("transport_allowance", { precision: 15, scale: 2 }).default("0"), // 交通費
  familyAllowance: decimal("family_allowance", { precision: 15, scale: 2 }).default("0"), // 家族手当
  roleAllowance: decimal("role_allowance", { precision: 15, scale: 2 }).default("0"), // 役職手当
  otherAllowances: decimal("other_allowances", { precision: 15, scale: 2 }).default("0"), // その他手当
  monthlyTotal: decimal("monthly_total", { precision: 15, scale: 2 }).notNull(), // 月額合計
  annualBonus: decimal("annual_bonus", { precision: 15, scale: 2 }).default("0"), // 年間賞与
  paymentFrequency: varchar("payment_frequency", { length: 50 }).default("monthly"), // monthly, bi_weekly, weekly
  currency: varchar("currency", { length: 10 }).default("JPY"),
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const compensationProfilesRelations = relations(compensationProfiles, ({ one }) => ({
  employee: one(employees, {
    fields: [compensationProfiles.employeeId],
    references: [employees.id],
  }),
  creator: one(users, {
    fields: [compensationProfiles.createdBy],
    references: [users.id],
  }),
}));

export const insertCompensationProfileSchema = createInsertSchema(compensationProfiles).omit({
  id: true,
  createdAt: true,
});

export type InsertCompensationProfile = z.infer<typeof insertCompensationProfileSchema>;
export type CompensationProfile = typeof compensationProfiles.$inferSelect;

// 給与支払いバッチ（月次給与処理）
export const payrollRuns = pgTable("payroll_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").references(() => businesses.id),
  runNumber: varchar("run_number", { length: 50 }).unique().notNull(), // 給与番号 e.g., "2025-01"
  payPeriodStart: timestamp("pay_period_start").notNull(),
  payPeriodEnd: timestamp("pay_period_end").notNull(),
  paymentDate: timestamp("payment_date").notNull(), // 支払日
  status: varchar("status", { length: 50 }).default("draft"), // draft, calculated, approved, paid, cancelled
  totalGrossPay: decimal("total_gross_pay", { precision: 15, scale: 2 }).default("0"), // 総支給額
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0"), // 総控除額
  totalNetPay: decimal("total_net_pay", { precision: 15, scale: 2 }).default("0"), // 総支給額（手取り）
  employeeCount: integer("employee_count").default(0),
  notes: text("notes"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const payrollRunsRelations = relations(payrollRuns, ({ one, many }) => ({
  business: one(businesses, {
    fields: [payrollRuns.businessId],
    references: [businesses.id],
  }),
  approver: one(users, {
    fields: [payrollRuns.approvedBy],
    references: [users.id],
    relationName: "payrollApprover",
  }),
  creator: one(users, {
    fields: [payrollRuns.createdBy],
    references: [users.id],
    relationName: "payrollCreator",
  }),
  lineItems: many(payrollLineItems),
  businessAllocations: many(payrollBusinessAllocations),
}));

export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollRun = typeof payrollRuns.$inferSelect;

// 給与明細行項目
export const payrollLineItems = pgTable("payroll_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollRunId: varchar("payroll_run_id").references(() => payrollRuns.id).notNull(),
  employeeId: varchar("employee_id").references(() => employees.id).notNull(),
  
  // 支給項目
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).default("0"),
  housingAllowance: decimal("housing_allowance", { precision: 15, scale: 2 }).default("0"),
  transportAllowance: decimal("transport_allowance", { precision: 15, scale: 2 }).default("0"),
  familyAllowance: decimal("family_allowance", { precision: 15, scale: 2 }).default("0"),
  roleAllowance: decimal("role_allowance", { precision: 15, scale: 2 }).default("0"),
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }).default("0"), // 残業代
  bonus: decimal("bonus", { precision: 15, scale: 2 }).default("0"), // 賞与
  otherEarnings: decimal("other_earnings", { precision: 15, scale: 2 }).default("0"), // その他支給
  grossPay: decimal("gross_pay", { precision: 15, scale: 2 }).notNull(), // 総支給額
  
  // 控除項目
  healthInsurance: decimal("health_insurance", { precision: 15, scale: 2 }).default("0"), // 健康保険
  pensionInsurance: decimal("pension_insurance", { precision: 15, scale: 2 }).default("0"), // 厚生年金
  employmentInsurance: decimal("employment_insurance", { precision: 15, scale: 2 }).default("0"), // 雇用保険
  incomeTax: decimal("income_tax", { precision: 15, scale: 2 }).default("0"), // 所得税
  residentTax: decimal("resident_tax", { precision: 15, scale: 2 }).default("0"), // 住民税
  otherDeductions: decimal("other_deductions", { precision: 15, scale: 2 }).default("0"), // その他控除
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).notNull(), // 総控除額
  
  netPay: decimal("net_pay", { precision: 15, scale: 2 }).notNull(), // 差引支給額（手取り）
  
  workDays: decimal("work_days", { precision: 5, scale: 2 }), // 勤務日数
  overtimeHours: decimal("overtime_hours", { precision: 8, scale: 2 }), // 残業時間
  
  accountId: varchar("account_id").references(() => accounts.id), // 仕訳連携用
  journalEntryId: varchar("journal_entry_id").references(() => journalEntries.id), // 仕訳連携
  
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollLineItemsRelations = relations(payrollLineItems, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollLineItems.payrollRunId],
    references: [payrollRuns.id],
  }),
  employee: one(employees, {
    fields: [payrollLineItems.employeeId],
    references: [employees.id],
  }),
  account: one(accounts, {
    fields: [payrollLineItems.accountId],
    references: [accounts.id],
  }),
  journalEntry: one(journalEntries, {
    fields: [payrollLineItems.journalEntryId],
    references: [journalEntries.id],
  }),
}));

export const insertPayrollLineItemSchema = createInsertSchema(payrollLineItems).omit({
  id: true,
  createdAt: true,
});

export type InsertPayrollLineItem = z.infer<typeof insertPayrollLineItemSchema>;
export type PayrollLineItem = typeof payrollLineItems.$inferSelect;

// 給与の事業部門配賦
export const payrollBusinessAllocations = pgTable("payroll_business_allocations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  payrollRunId: varchar("payroll_run_id").references(() => payrollRuns.id).notNull(),
  businessId: varchar("business_id").references(() => businesses.id).notNull(),
  allocationPercent: decimal("allocation_percent", { precision: 5, scale: 2 }).notNull(), // %
  allocatedAmount: decimal("allocated_amount", { precision: 15, scale: 2 }).notNull(),
  accountId: varchar("account_id").references(() => accounts.id), // 配賦先勘定科目
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payrollBusinessAllocationsRelations = relations(payrollBusinessAllocations, ({ one }) => ({
  payrollRun: one(payrollRuns, {
    fields: [payrollBusinessAllocations.payrollRunId],
    references: [payrollRuns.id],
  }),
  business: one(businesses, {
    fields: [payrollBusinessAllocations.businessId],
    references: [businesses.id],
  }),
  account: one(accounts, {
    fields: [payrollBusinessAllocations.accountId],
    references: [accounts.id],
  }),
}));

export const insertPayrollBusinessAllocationSchema = createInsertSchema(payrollBusinessAllocations).omit({
  id: true,
  createdAt: true,
});

export type InsertPayrollBusinessAllocation = z.infer<typeof insertPayrollBusinessAllocationSchema>;
export type PayrollBusinessAllocation = typeof payrollBusinessAllocations.$inferSelect;

// ==================== COMPANY SETTINGS ====================

// 会社設定・概要情報
export const companySettings = pgTable("company_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  companyNameEn: varchar("company_name_en", { length: 255 }),
  companyNameKana: varchar("company_name_kana", { length: 255 }),
  legalName: varchar("legal_name", { length: 255 }), // 正式名称
  registrationNumber: varchar("registration_number", { length: 100 }), // 法人番号
  establishedDate: timestamp("established_date"),
  fiscalYearEnd: varchar("fiscal_year_end", { length: 10 }), // 決算月 e.g., "03-31"
  
  // 連絡先情報
  postalCode: varchar("postal_code", { length: 20 }),
  address: text("address"),
  addressEn: text("address_en"),
  phoneNumber: varchar("phone_number", { length: 50 }),
  faxNumber: varchar("fax_number", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 500 }),
  
  // 代表者情報
  ceoName: varchar("ceo_name", { length: 100 }),
  ceoNameEn: varchar("ceo_name_en", { length: 100 }),
  
  // 企業情報
  capital: decimal("capital", { precision: 20, scale: 2 }), // 資本金
  employees: integer("employees"), // 従業員数
  businessDescription: text("business_description"), // 事業内容
  businessDescriptionEn: text("business_description_en"),
  
  // ロゴ・ブランディング
  logoUrl: varchar("logo_url", { length: 500 }),
  primaryColor: varchar("primary_color", { length: 20 }), // #00A676
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const companySettingsRelations = relations(companySettings, ({ one }) => ({
  updater: one(users, {
    fields: [companySettings.updatedBy],
    references: [users.id],
  }),
}));

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

// 外部サービス認証情報メタデータ
// 注意: 実際のAPIキー・パスワードはReplitのSecretsで管理し、このテーブルには接続状態のみ保存
export const serviceCredentials = pgTable("service_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceName: varchar("service_name", { length: 100 }).notNull(), // e.g., "OpenAI", "Gmail", "Stripe"
  serviceType: varchar("service_type", { length: 50 }).notNull(), // e.g., "ai", "email", "payment", "accounting"
  secretKeyName: varchar("secret_key_name", { length: 255 }), // 環境変数名 e.g., "OPENAI_API_KEY"
  
  // ログイン情報（外部サービス用）
  serviceUrl: varchar("service_url", { length: 500 }), // 外部サービスのURL
  loginUsername: varchar("login_username", { length: 255 }), // ログインID/ユーザー名
  loginPassword: text("login_password"), // 暗号化されたパスワード（注意：本番環境では環境変数管理を推奨）
  
  // 接続状態
  status: varchar("status", { length: 50 }).default("inactive"), // active, inactive, error
  isConnected: boolean("is_connected").default(false),
  lastCheckedAt: timestamp("last_checked_at"),
  lastSuccessAt: timestamp("last_success_at"),
  
  // メタデータ
  accountId: varchar("account_id", { length: 255 }), // サービス側のアカウントID（マスク表示用）
  accountEmail: varchar("account_email", { length: 255 }),
  
  // エラー情報
  lastError: text("last_error"),
  errorCount: integer("error_count").default(0),
  
  // 設定情報
  config: text("config"), // JSON形式での追加設定
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
  updatedBy: varchar("updated_by").references(() => users.id),
});

export const serviceCredentialsRelations = relations(serviceCredentials, ({ one }) => ({
  creator: one(users, {
    fields: [serviceCredentials.createdBy],
    references: [users.id],
    relationName: "credentialCreator",
  }),
  updater: one(users, {
    fields: [serviceCredentials.updatedBy],
    references: [users.id],
    relationName: "credentialUpdater",
  }),
}));

export const insertServiceCredentialSchema = createInsertSchema(serviceCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertServiceCredential = z.infer<typeof insertServiceCredentialSchema>;
export type ServiceCredential = typeof serviceCredentials.$inferSelect;

// ==================== EMPLOYEE PORTAL TABLES ====================

// 従業員プロフィール詳細
export const employeeProfiles = pgTable("employee_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  businessId: varchar("business_id").references(() => businesses.id), // 所属事業部門
  
  // 個人情報
  phoneNumber: varchar("phone_number", { length: 20 }),
  address: text("address"),
  emergencyContactName: varchar("emergency_contact_name", { length: 255 }),
  emergencyContactPhone: varchar("emergency_contact_phone", { length: 20 }),
  
  // 雇用情報
  employeeNumber: varchar("employee_number", { length: 50 }), // 社員番号
  position: varchar("position", { length: 100 }), // 役職
  department: varchar("department", { length: 100 }), // 部署
  employmentType: varchar("employment_type", { length: 50 }).default("full-time"), // full-time, part-time, contract, intern
  hireDate: timestamp("hire_date"), // 入社日
  contractEndDate: timestamp("contract_end_date"), // 契約終了日（契約社員の場合）
  
  // ステータス
  status: varchar("status", { length: 50 }).default("active"), // active, inactive, on_leave, terminated
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  user: one(users, {
    fields: [employeeProfiles.userId],
    references: [users.id],
  }),
  business: one(businesses, {
    fields: [employeeProfiles.businessId],
    references: [businesses.id],
  }),
}));

export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployeeProfile = z.infer<typeof insertEmployeeProfileSchema>;
export type EmployeeProfile = typeof employeeProfiles.$inferSelect;

// 従業員口座情報
export const employeeBankAccounts = pgTable("employee_bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // 口座情報
  bankName: varchar("bank_name", { length: 255 }).notNull(), // 銀行名
  branchName: varchar("branch_name", { length: 255 }), // 支店名
  branchCode: varchar("branch_code", { length: 10 }), // 支店コード
  accountType: varchar("account_type", { length: 50 }).default("ordinary"), // ordinary(普通), current(当座), savings(貯蓄)
  accountNumber: varchar("account_number", { length: 20 }).notNull(), // 口座番号
  accountHolderName: varchar("account_holder_name", { length: 255 }).notNull(), // 口座名義
  
  // メタデータ
  isPrimary: boolean("is_primary").default(true), // メイン口座かどうか
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeBankAccountsRelations = relations(employeeBankAccounts, ({ one }) => ({
  user: one(users, {
    fields: [employeeBankAccounts.userId],
    references: [users.id],
  }),
}));

export const insertEmployeeBankAccountSchema = createInsertSchema(employeeBankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployeeBankAccount = z.infer<typeof insertEmployeeBankAccountSchema>;
export type EmployeeBankAccount = typeof employeeBankAccounts.$inferSelect;

// 従業員給与情報
export const employeeSalaries = pgTable("employee_salaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // 給与期間
  paymentDate: timestamp("payment_date").notNull(), // 支払日
  periodStart: timestamp("period_start").notNull(), // 対象期間開始
  periodEnd: timestamp("period_end").notNull(), // 対象期間終了
  
  // 給与詳細
  baseSalary: decimal("base_salary", { precision: 15, scale: 2 }).notNull(), // 基本給
  allowances: decimal("allowances", { precision: 15, scale: 2 }).default("0"), // 手当合計
  bonus: decimal("bonus", { precision: 15, scale: 2 }).default("0"), // 賞与
  overtimePay: decimal("overtime_pay", { precision: 15, scale: 2 }).default("0"), // 残業代
  grossPay: decimal("gross_pay", { precision: 15, scale: 2 }).notNull(), // 総支給額
  
  // 控除
  incomeTax: decimal("income_tax", { precision: 15, scale: 2 }).default("0"), // 所得税
  residentTax: decimal("resident_tax", { precision: 15, scale: 2 }).default("0"), // 住民税
  healthInsurance: decimal("health_insurance", { precision: 15, scale: 2 }).default("0"), // 健康保険
  pensionInsurance: decimal("pension_insurance", { precision: 15, scale: 2 }).default("0"), // 厚生年金
  employmentInsurance: decimal("employment_insurance", { precision: 15, scale: 2 }).default("0"), // 雇用保険
  otherDeductions: decimal("other_deductions", { precision: 15, scale: 2 }).default("0"), // その他控除
  totalDeductions: decimal("total_deductions", { precision: 15, scale: 2 }).default("0"), // 控除合計
  
  // 差引支給額
  netPay: decimal("net_pay", { precision: 15, scale: 2 }).notNull(), // 差引支給額（手取り）
  
  // メタデータ
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, paid, cancelled
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const employeeSalariesRelations = relations(employeeSalaries, ({ one }) => ({
  user: one(users, {
    fields: [employeeSalaries.userId],
    references: [users.id],
  }),
}));

export const insertEmployeeSalarySchema = createInsertSchema(employeeSalaries).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployeeSalary = z.infer<typeof insertEmployeeSalarySchema>;
export type EmployeeSalary = typeof employeeSalaries.$inferSelect;

// 通知システム
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // 送信者・受信者
  fromUserId: varchar("from_user_id").references(() => users.id), // 送信者（管理者）
  toUserId: varchar("to_user_id").references(() => users.id).notNull(), // 受信者（従業員）
  
  // 通知内容
  title: varchar("title", { length: 255 }).notNull(), // タイトル
  message: text("message").notNull(), // メッセージ本文
  type: varchar("type", { length: 50 }).default("info"), // info, warning, urgent, system
  category: varchar("category", { length: 50 }), // salary, workflow, general, system
  
  // リンク情報
  linkUrl: varchar("link_url", { length: 500 }), // 関連ページへのリンク
  linkText: varchar("link_text", { length: 100 }), // リンクテキスト
  
  // ステータス
  isRead: boolean("is_read").default(false), // 既読フラグ
  readAt: timestamp("read_at"), // 既読日時
  priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
  
  // 有効期限
  expiresAt: timestamp("expires_at"), // 通知の有効期限
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
    relationName: "notificationSender",
  }),
  toUser: one(users, {
    fields: [notifications.toUserId],
    references: [users.id],
    relationName: "notificationReceiver",
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// ==================== MEMO SYSTEM ====================

export const memos = pgTable("memos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags").array(),
  
  isPinned: boolean("is_pinned").default(false),
  isArchived: boolean("is_archived").default(false),
  color: varchar("color", { length: 20 }),
  
  reminderAt: timestamp("reminder_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const memosRelations = relations(memos, ({ one }) => ({
  user: one(users, {
    fields: [memos.userId],
    references: [users.id],
  }),
}));

export const insertMemoSchema = createInsertSchema(memos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMemo = z.infer<typeof insertMemoSchema>;
export type Memo = typeof memos.$inferSelect;

// ==================== EXTERNAL SERVICE INTEGRATION LOGS ====================

export const integrationLogs = pgTable("integration_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceCredentialId: varchar("service_credential_id").references(() => serviceCredentials.id),
  
  serviceName: varchar("service_name", { length: 100 }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).notNull(),
  
  requestData: text("request_data"),
  responseData: text("response_data"),
  errorMessage: text("error_message"),
  
  executedBy: varchar("executed_by").references(() => users.id),
  executionTime: integer("execution_time"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationLogsRelations = relations(integrationLogs, ({ one }) => ({
  serviceCredential: one(serviceCredentials, {
    fields: [integrationLogs.serviceCredentialId],
    references: [serviceCredentials.id],
  }),
  user: one(users, {
    fields: [integrationLogs.executedBy],
    references: [users.id],
  }),
}));

export const insertIntegrationLogSchema = createInsertSchema(integrationLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertIntegrationLog = z.infer<typeof insertIntegrationLogSchema>;
export type IntegrationLog = typeof integrationLogs.$inferSelect;

// ==================== PAYMENT INTEGRATIONS (Stripe, Square) ====================

export const externalPayments = pgTable("external_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  provider: varchar("provider", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  customerId: varchar("customer_id").references(() => customers.id),
  
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("JPY"),
  status: varchar("status", { length: 50 }).notNull(),
  
  paymentMethod: varchar("payment_method", { length: 100 }),
  description: text("description"),
  metadata: text("metadata"),
  
  paidAt: timestamp("paid_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: decimal("refund_amount", { precision: 15, scale: 2 }),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const externalPaymentsRelations = relations(externalPayments, ({ one }) => ({
  customer: one(customers, {
    fields: [externalPayments.customerId],
    references: [customers.id],
  }),
}));

export const insertExternalPaymentSchema = createInsertSchema(externalPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalPayment = z.infer<typeof insertExternalPaymentSchema>;
export type ExternalPayment = typeof externalPayments.$inferSelect;

// ==================== SPREADSHEET SYNC ====================

export const spreadsheetSyncs = pgTable("spreadsheet_syncs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  name: varchar("name", { length: 255 }).notNull(),
  spreadsheetId: varchar("spreadsheet_id", { length: 255 }).notNull(),
  sheetName: varchar("sheet_name", { length: 255 }),
  range: varchar("range", { length: 100 }),
  
  syncDirection: varchar("sync_direction", { length: 50 }).notNull(),
  targetTable: varchar("target_table", { length: 100 }),
  
  schedule: varchar("schedule", { length: 100 }),
  lastSyncAt: timestamp("last_sync_at"),
  nextSyncAt: timestamp("next_sync_at"),
  
  isActive: boolean("is_active").default(true),
  syncCount: integer("sync_count").default(0),
  errorCount: integer("error_count").default(0),
  lastError: text("last_error"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSpreadsheetSyncSchema = createInsertSchema(spreadsheetSyncs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSpreadsheetSync = z.infer<typeof insertSpreadsheetSyncSchema>;
export type SpreadsheetSync = typeof spreadsheetSyncs.$inferSelect;

// ==================== MESSAGING INTEGRATIONS (LINE, Slack, ChatWork) ====================

export const externalMessages = pgTable("external_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  platform: varchar("platform", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  
  direction: varchar("direction", { length: 20 }).notNull(),
  fromId: varchar("from_id", { length: 255 }),
  toId: varchar("to_id", { length: 255 }),
  
  messageType: varchar("message_type", { length: 50 }),
  content: text("content"),
  attachments: text("attachments").array(),
  
  status: varchar("status", { length: 50 }),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  
  metadata: text("metadata"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertExternalMessageSchema = createInsertSchema(externalMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertExternalMessage = z.infer<typeof insertExternalMessageSchema>;
export type ExternalMessage = typeof externalMessages.$inferSelect;

// ==================== SOCIAL MEDIA INTEGRATIONS (X, TikTok) ====================

export const socialMediaPosts = pgTable("social_media_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  platform: varchar("platform", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }),
  
  content: text("content"),
  mediaUrls: text("media_urls").array(),
  hashtags: text("hashtags").array(),
  
  status: varchar("status", { length: 50 }),
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  
  metrics: text("metrics"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSocialMediaPostSchema = createInsertSchema(socialMediaPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSocialMediaPost = z.infer<typeof insertSocialMediaPostSchema>;
export type SocialMediaPost = typeof socialMediaPosts.$inferSelect;

// ==================== ZOOM INTEGRATION ====================

export const zoomMeetings = pgTable("zoom_meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  externalId: varchar("external_id", { length: 255 }),
  topic: varchar("topic", { length: 255 }).notNull(),
  agenda: text("agenda"),
  
  startTime: timestamp("start_time").notNull(),
  duration: integer("duration"),
  timezone: varchar("timezone", { length: 100 }),
  
  joinUrl: text("join_url"),
  password: varchar("password", { length: 100 }),
  
  hostId: varchar("host_id").references(() => users.id),
  participants: text("participants").array(),
  
  status: varchar("status", { length: 50 }),
  recordingUrl: text("recording_url"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const zoomMeetingsRelations = relations(zoomMeetings, ({ one }) => ({
  host: one(users, {
    fields: [zoomMeetings.hostId],
    references: [users.id],
  }),
}));

export const insertZoomMeetingSchema = createInsertSchema(zoomMeetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertZoomMeeting = z.infer<typeof insertZoomMeetingSchema>;
export type ZoomMeeting = typeof zoomMeetings.$inferSelect;

// ==================== CANVA INTEGRATION ====================

export const canvaDesigns = pgTable("canva_designs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  externalId: varchar("external_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  designType: varchar("design_type", { length: 100 }),
  
  thumbnailUrl: text("thumbnail_url"),
  editUrl: text("edit_url"),
  exportUrl: text("export_url"),
  
  status: varchar("status", { length: 50 }),
  tags: text("tags").array(),
  
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const canvaDesignsRelations = relations(canvaDesigns, ({ one }) => ({
  creator: one(users, {
    fields: [canvaDesigns.createdBy],
    references: [users.id],
  }),
}));

export const insertCanvaDesignSchema = createInsertSchema(canvaDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCanvaDesign = z.infer<typeof insertCanvaDesignSchema>;
export type CanvaDesign = typeof canvaDesigns.$inferSelect;

// ==================== E-SIGNATURE INTEGRATION (CloudSign) ====================

export const eSignatureDocuments = pgTable("e_signature_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  externalId: varchar("external_id", { length: 255 }),
  title: varchar("title", { length: 255 }).notNull(),
  documentType: varchar("document_type", { length: 100 }),
  
  fileUrl: text("file_url"),
  signedFileUrl: text("signed_file_url"),
  
  status: varchar("status", { length: 50 }),
  signers: text("signers").array(),
  
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  
  createdBy: varchar("created_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const eSignatureDocumentsRelations = relations(eSignatureDocuments, ({ one }) => ({
  creator: one(users, {
    fields: [eSignatureDocuments.createdBy],
    references: [users.id],
  }),
}));

export const insertESignatureDocumentSchema = createInsertSchema(eSignatureDocuments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertESignatureDocument = z.infer<typeof insertESignatureDocumentSchema>;
export type ESignatureDocument = typeof eSignatureDocuments.$inferSelect;

// ==================== BANK INTEGRATION ====================

export const bankAccounts = pgTable("bank_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  bankName: varchar("bank_name", { length: 255 }).notNull(),
  branchName: varchar("branch_name", { length: 255 }),
  accountNumber: varchar("account_number", { length: 100 }).notNull(),
  accountType: varchar("account_type", { length: 50 }),
  accountHolder: varchar("account_holder", { length: 255 }),
  
  externalId: varchar("external_id", { length: 255 }),
  balance: decimal("balance", { precision: 15, scale: 2 }),
  currency: varchar("currency", { length: 10 }).default("JPY"),
  
  lastSyncAt: timestamp("last_sync_at"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBankAccount = z.infer<typeof insertBankAccountSchema>;
export type BankAccount = typeof bankAccounts.$inferSelect;

export const bankTransactions = pgTable("bank_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bankAccountId: varchar("bank_account_id").references(() => bankAccounts.id).notNull(),
  
  externalId: varchar("external_id", { length: 255 }),
  transactionDate: timestamp("transaction_date").notNull(),
  
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }),
  
  transactionType: varchar("transaction_type", { length: 50 }),
  description: text("description"),
  counterparty: varchar("counterparty", { length: 255 }),
  
  category: varchar("category", { length: 100 }),
  memo: text("memo"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const bankTransactionsRelations = relations(bankTransactions, ({ one }) => ({
  bankAccount: one(bankAccounts, {
    fields: [bankTransactions.bankAccountId],
    references: [bankAccounts.id],
  }),
}));

export const insertBankTransactionSchema = createInsertSchema(bankTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertBankTransaction = z.infer<typeof insertBankTransactionSchema>;
export type BankTransaction = typeof bankTransactions.$inferSelect;

// ==================== PHONE INTEGRATION ====================

export const phoneCallLogs = pgTable("phone_call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  direction: varchar("direction", { length: 20 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  
  duration: integer("duration"),
  status: varchar("status", { length: 50 }),
  
  recordingUrl: text("recording_url"),
  transcription: text("transcription"),
  
  userId: varchar("user_id").references(() => users.id),
  
  calledAt: timestamp("called_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const phoneCallLogsRelations = relations(phoneCallLogs, ({ one }) => ({
  user: one(users, {
    fields: [phoneCallLogs.userId],
    references: [users.id],
  }),
}));

export const insertPhoneCallLogSchema = createInsertSchema(phoneCallLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertPhoneCallLog = z.infer<typeof insertPhoneCallLogSchema>;
export type PhoneCallLog = typeof phoneCallLogs.$inferSelect;

export const smsMessages = pgTable("sms_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  direction: varchar("direction", { length: 20 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  
  content: text("content").notNull(),
  status: varchar("status", { length: 50 }),
  
  externalId: varchar("external_id", { length: 255 }),
  deliveredAt: timestamp("delivered_at"),
  
  userId: varchar("user_id").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const smsMessagesRelations = relations(smsMessages, ({ one }) => ({
  user: one(users, {
    fields: [smsMessages.userId],
    references: [users.id],
  }),
}));

export const insertSmsMessageSchema = createInsertSchema(smsMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertSmsMessage = z.infer<typeof insertSmsMessageSchema>;
export type SmsMessage = typeof smsMessages.$inferSelect;
