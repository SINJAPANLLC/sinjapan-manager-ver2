// DatabaseStorage implementation - CRUD operations for all entities
import {
  users,
  businesses,
  contracts,
  shifts,
  quotes,
  projects,
  meetings,
  jobPostings,
  applicants,
  transactions,
  tasks,
  kpis,
  communications,
  aiEvents,
  memory,
  chatHistory,
  aiGeneratedContent,
  campaigns,
  socialPosts,
  socialConnections,
  companySettings,
  serviceCredentials,
  employeeProfiles,
  employeeBankAccounts,
  employeeSalaries,
  notifications,
  customers,
  contacts,
  leads,
  deals,
  activities,
  memos,
  type User,
  type UpsertUser,
  type Business,
  type InsertBusiness,
  type Contract,
  type InsertContract,
  type Shift,
  type InsertShift,
  type Quote,
  type InsertQuote,
  type Project,
  type InsertProject,
  type Meeting,
  type InsertMeeting,
  type JobPosting,
  type InsertJobPosting,
  type Applicant,
  type InsertApplicant,
  type Transaction,
  type InsertTransaction,
  type Task,
  type InsertTask,
  type Kpi,
  type InsertKpi,
  type Communication,
  type InsertCommunication,
  type AiEvent,
  type InsertAiEvent,
  type Memory,
  type InsertMemory,
  type ChatHistory,
  type InsertChatHistory,
  type AiGeneratedContent,
  type InsertAiGeneratedContent,
  type Campaign,
  type InsertCampaign,
  type SocialPost,
  type InsertSocialPost,
  type SocialConnection,
  type InsertSocialConnection,
  type CompanySettings,
  type InsertCompanySettings,
  type ServiceCredential,
  type InsertServiceCredential,
  type EmployeeProfile,
  type InsertEmployeeProfile,
  type EmployeeBankAccount,
  type InsertEmployeeBankAccount,
  type EmployeeSalary,
  type InsertEmployeeSalary,
  type Notification,
  type InsertNotification,
  type Customer,
  type InsertCustomer,
  type Contact,
  type InsertContact,
  type Lead,
  type InsertLead,
  type Deal,
  type InsertDeal,
  type Activity,
  type InsertActivity,
  type Memo,
  type InsertMemo,
  workflows,
  workflowSteps,
  workflowConnections,
  workflowExecutions,
  rolePermissions,
  type Workflow,
  type InsertWorkflow,
  type WorkflowStep,
  type InsertWorkflowStep,
  type WorkflowConnection,
  type InsertWorkflowConnection,
  type WorkflowExecution,
  type InsertWorkflowExecution,
  type RolePermission,
  type InsertRolePermission,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Business operations
  getAllBusinesses(): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | undefined>;
  createBusiness(business: InsertBusiness): Promise<Business>;
  updateBusiness(id: string, business: Partial<InsertBusiness>): Promise<Business>;
  deleteBusinesses(id: string): Promise<void>;
  
  // Contract operations
  getAllContracts(businessId?: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;
  
  // Shift operations
  getAllShifts(businessId?: string, userId?: string): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  updateShift(id: string, shift: Partial<InsertShift>): Promise<Shift>;
  deleteShift(id: string): Promise<void>;
  
  // Quote operations
  getAllQuotes(businessId?: string): Promise<Quote[]>;
  getQuote(id: string): Promise<Quote | undefined>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;
  
  // Project operations
  getAllProjects(businessId?: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  // Meeting operations
  getAllMeetings(businessId?: string, projectId?: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, meeting: Partial<InsertMeeting>): Promise<Meeting>;
  deleteMeeting(id: string): Promise<void>;
  
  // Job Posting operations (INDEED連携)
  getAllJobPostings(businessId?: string): Promise<JobPosting[]>;
  getJobPosting(id: string): Promise<JobPosting | undefined>;
  createJobPosting(jobPosting: InsertJobPosting): Promise<JobPosting>;
  updateJobPosting(id: string, jobPosting: Partial<InsertJobPosting>): Promise<JobPosting>;
  deleteJobPosting(id: string): Promise<void>;
  
  // Applicant operations (INDEED連携)
  getAllApplicants(jobPostingId?: string): Promise<Applicant[]>;
  getApplicant(id: string): Promise<Applicant | undefined>;
  createApplicant(applicant: InsertApplicant): Promise<Applicant>;
  updateApplicant(id: string, applicant: Partial<InsertApplicant>): Promise<Applicant>;
  deleteApplicant(id: string): Promise<void>;
  
  // Transaction operations
  getAllTransactions(businessId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  
  // Task operations
  getAllTasks(filters?: { category?: string; status?: string; businessId?: string }): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  
  // KPI operations
  getAllKpis(businessId?: string): Promise<Kpi[]>;
  getKpi(id: string): Promise<Kpi | undefined>;
  createKpi(kpi: InsertKpi): Promise<Kpi>;
  
  // Communication operations
  getAllCommunications(limit?: number): Promise<Communication[]>;
  getCommunication(id: string): Promise<Communication | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  updateCommunication(id: string, communication: Partial<InsertCommunication>): Promise<Communication>;
  
  // AI Event operations
  getAllAiEvents(limit?: number): Promise<AiEvent[]>;
  getAiEvent(id: string): Promise<AiEvent | undefined>;
  createAiEvent(aiEvent: InsertAiEvent): Promise<AiEvent>;
  
  // Memory operations
  getAllMemories(limit?: number): Promise<Memory[]>;
  getMemory(id: string): Promise<Memory | undefined>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory>;
  
  // Chat History operations
  getChatHistory(userId: string, sessionId?: string, limit?: number): Promise<ChatHistory[]>;
  createChatMessage(chatMessage: InsertChatHistory): Promise<ChatHistory>;
  
  // AI Generated Content operations
  getAllAiGeneratedContent(userId: string, contentType?: string, limit?: number): Promise<AiGeneratedContent[]>;
  getAiGeneratedContent(id: string): Promise<AiGeneratedContent | undefined>;
  createAiGeneratedContent(content: InsertAiGeneratedContent): Promise<AiGeneratedContent>;
  
  // Campaign operations
  getAllCampaigns(businessId?: string): Promise<Campaign[]>;
  getCampaign(id: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  
  // Social Post operations
  getAllSocialPosts(filters?: { campaignId?: string; businessId?: string; platform?: string; status?: string }): Promise<SocialPost[]>;
  getSocialPost(id: string): Promise<SocialPost | undefined>;
  createSocialPost(post: InsertSocialPost): Promise<SocialPost>;
  updateSocialPost(id: string, post: Partial<InsertSocialPost>): Promise<SocialPost>;
  deleteSocialPost(id: string): Promise<void>;
  
  // Social Connection operations
  getAllSocialConnections(userId: string): Promise<SocialConnection[]>;
  getSocialConnection(id: string): Promise<SocialConnection | undefined>;
  getSocialConnectionByPlatform(userId: string, platform: string): Promise<SocialConnection | undefined>;
  createSocialConnection(connection: InsertSocialConnection): Promise<SocialConnection>;
  updateSocialConnection(id: string, connection: Partial<InsertSocialConnection>): Promise<SocialConnection>;
  deleteSocialConnection(id: string): Promise<void>;
  
  // Company Settings operations
  getCompanySettings(): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(id: string, settings: Partial<InsertCompanySettings>): Promise<CompanySettings>;
  
  // Service Credentials operations
  getAllServiceCredentials(): Promise<ServiceCredential[]>;
  getServiceCredential(id: string): Promise<ServiceCredential | undefined>;
  getServiceCredentialByName(serviceName: string): Promise<ServiceCredential | undefined>;
  createServiceCredential(credential: InsertServiceCredential): Promise<ServiceCredential>;
  updateServiceCredential(id: string, credential: Partial<InsertServiceCredential>): Promise<ServiceCredential>;
  deleteServiceCredential(id: string): Promise<void>;
  
  // Employee Profile operations
  getEmployeeProfile(userId: string): Promise<EmployeeProfile | undefined>;
  getAllEmployeeProfiles(businessId?: string): Promise<EmployeeProfile[]>;
  createEmployeeProfile(profile: InsertEmployeeProfile): Promise<EmployeeProfile>;
  updateEmployeeProfile(id: string, profile: Partial<InsertEmployeeProfile>): Promise<EmployeeProfile>;
  deleteEmployeeProfile(id: string): Promise<void>;
  
  // Employee Bank Account operations
  getEmployeeBankAccounts(userId: string): Promise<EmployeeBankAccount[]>;
  getEmployeeBankAccount(id: string): Promise<EmployeeBankAccount | undefined>;
  createEmployeeBankAccount(account: InsertEmployeeBankAccount): Promise<EmployeeBankAccount>;
  updateEmployeeBankAccount(id: string, account: Partial<InsertEmployeeBankAccount>): Promise<EmployeeBankAccount>;
  deleteEmployeeBankAccount(id: string): Promise<void>;
  
  // Employee Salary operations
  getEmployeeSalaries(userId: string, limit?: number): Promise<EmployeeSalary[]>;
  getEmployeeSalary(id: string): Promise<EmployeeSalary | undefined>;
  createEmployeeSalary(salary: InsertEmployeeSalary): Promise<EmployeeSalary>;
  updateEmployeeSalary(id: string, salary: Partial<InsertEmployeeSalary>): Promise<EmployeeSalary>;
  deleteEmployeeSalary(id: string): Promise<void>;
  
  // Notification operations
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  getNotification(id: string): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, notification: Partial<InsertNotification>): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<Notification>;
  deleteNotification(id: string): Promise<void>;
  
  // CRM: Customer operations
  getAllCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // CRM: Contact operations
  getAllContacts(customerId?: string): Promise<Contact[]>;
  getContact(id: string): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: string, contact: Partial<InsertContact>): Promise<Contact>;
  deleteContact(id: string): Promise<void>;
  
  // CRM: Lead operations
  getAllLeads(): Promise<Lead[]>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  convertLeadToDeal(leadId: string, dealData: InsertDeal): Promise<{ deal: Deal; lead: Lead }>;
  
  // CRM: Deal operations
  getAllDeals(customerId?: string): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, deal: Partial<InsertDeal>): Promise<Deal>;
  deleteDeal(id: string): Promise<void>;
  
  // CRM: Activity operations
  getAllActivities(filters?: { customerId?: string; leadId?: string; dealId?: string }): Promise<Activity[]>;
  getActivity(id: string): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: string, activity: Partial<InsertActivity>): Promise<Activity>;
  deleteActivity(id: string): Promise<void>;
  
  // Memo operations
  getAllMemos(userId: string): Promise<Memo[]>;
  getMemo(id: string): Promise<Memo | undefined>;
  createMemo(memo: InsertMemo): Promise<Memo>;
  updateMemo(id: string, memo: Partial<InsertMemo>): Promise<Memo>;
  deleteMemo(id: string): Promise<void>;

  // Role permissions operations
  getRolePermissions(): Promise<RolePermission[]>;
  getRolePermissionsByRole(role: string): Promise<RolePermission[]>;
  updateRolePermission(id: string, permission: Partial<InsertRolePermission>): Promise<RolePermission>;
}

export class DatabaseStorage implements IStorage {
  // ==================== USER OPERATIONS (Replit Auth Required) ====================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).where(eq(users.id, id));
    return user as User;
  }

  async getAllUsers(): Promise<User[]> {
    const usersData = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    }).from(users).orderBy(desc(users.createdAt));
    return usersData as User[];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
      role: users.role,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    });
    return user as User;
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [user] = await db.update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    return user as User;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // ==================== BUSINESS OPERATIONS ====================
  
  async getAllBusinesses(): Promise<Business[]> {
    return await db.select().from(businesses).orderBy(desc(businesses.createdAt));
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async createBusiness(businessData: InsertBusiness): Promise<Business> {
    const [business] = await db.insert(businesses).values(businessData).returning();
    return business;
  }

  async updateBusiness(id: string, businessData: Partial<InsertBusiness>): Promise<Business> {
    const [business] = await db
      .update(businesses)
      .set({ ...businessData, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  }

  async deleteBusinesses(id: string): Promise<void> {
    await db.delete(businesses).where(eq(businesses.id, id));
  }

  // ==================== CONTRACT OPERATIONS ====================
  
  async getAllContracts(businessId?: string): Promise<Contract[]> {
    if (businessId) {
      return await db.select().from(contracts)
        .where(eq(contracts.businessId, businessId))
        .orderBy(desc(contracts.createdAt));
    }
    return await db.select().from(contracts).orderBy(desc(contracts.createdAt));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract;
  }

  async createContract(contractData: InsertContract): Promise<Contract> {
    const [contract] = await db.insert(contracts).values(contractData).returning();
    return contract;
  }

  async updateContract(id: string, contractData: Partial<InsertContract>): Promise<Contract> {
    const [contract] = await db
      .update(contracts)
      .set({ ...contractData, updatedAt: new Date() })
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    await db.delete(contracts).where(eq(contracts.id, id));
  }

  // ==================== SHIFT OPERATIONS ====================
  
  async getAllShifts(businessId?: string, userId?: string): Promise<Shift[]> {
    const conditions = [];
    if (businessId) conditions.push(eq(shifts.businessId, businessId));
    if (userId) conditions.push(eq(shifts.userId, userId));
    
    if (conditions.length > 0) {
      return await db.select().from(shifts)
        .where(and(...conditions))
        .orderBy(desc(shifts.startTime));
    }
    return await db.select().from(shifts).orderBy(desc(shifts.startTime));
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id));
    return shift;
  }

  async createShift(shiftData: InsertShift): Promise<Shift> {
    const [shift] = await db.insert(shifts).values(shiftData).returning();
    return shift;
  }

  async updateShift(id: string, shiftData: Partial<InsertShift>): Promise<Shift> {
    const [shift] = await db
      .update(shifts)
      .set({ ...shiftData, updatedAt: new Date() })
      .where(eq(shifts.id, id))
      .returning();
    return shift;
  }

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  // ==================== QUOTE OPERATIONS ====================
  
  async getAllQuotes(businessId?: string): Promise<Quote[]> {
    if (businessId) {
      return await db.select().from(quotes)
        .where(eq(quotes.businessId, businessId))
        .orderBy(desc(quotes.createdAt));
    }
    return await db.select().from(quotes).orderBy(desc(quotes.createdAt));
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async createQuote(quoteData: InsertQuote): Promise<Quote> {
    const [quote] = await db.insert(quotes).values(quoteData).returning();
    return quote;
  }

  async updateQuote(id: string, quoteData: Partial<InsertQuote>): Promise<Quote> {
    const [quote] = await db
      .update(quotes)
      .set({ ...quoteData, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return quote;
  }

  async deleteQuote(id: string): Promise<void> {
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // ==================== PROJECT OPERATIONS ====================
  
  async getAllProjects(businessId?: string): Promise<Project[]> {
    if (businessId) {
      return await db.select().from(projects)
        .where(eq(projects.businessId, businessId))
        .orderBy(desc(projects.createdAt));
    }
    return await db.select().from(projects).orderBy(desc(projects.createdAt));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(projectData: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(projectData).returning();
    return project;
  }

  async updateProject(id: string, projectData: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...projectData, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // ==================== MEETING OPERATIONS ====================
  
  async getAllMeetings(businessId?: string, projectId?: string): Promise<Meeting[]> {
    const conditions = [];
    if (businessId) conditions.push(eq(meetings.businessId, businessId));
    if (projectId) conditions.push(eq(meetings.projectId, projectId));
    
    if (conditions.length > 0) {
      return await db.select().from(meetings)
        .where(and(...conditions))
        .orderBy(desc(meetings.startTime));
    }
    return await db.select().from(meetings).orderBy(desc(meetings.startTime));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async createMeeting(meetingData: InsertMeeting): Promise<Meeting> {
    const [meeting] = await db.insert(meetings).values(meetingData).returning();
    return meeting;
  }

  async updateMeeting(id: string, meetingData: Partial<InsertMeeting>): Promise<Meeting> {
    const [meeting] = await db
      .update(meetings)
      .set({ ...meetingData, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return meeting;
  }

  async deleteMeeting(id: string): Promise<void> {
    await db.delete(meetings).where(eq(meetings.id, id));
  }

  // ==================== JOB POSTING OPERATIONS (INDEED連携) ====================
  
  async getAllJobPostings(businessId?: string): Promise<JobPosting[]> {
    if (businessId) {
      return await db.select().from(jobPostings)
        .where(eq(jobPostings.businessId, businessId))
        .orderBy(desc(jobPostings.createdAt));
    }
    return await db.select().from(jobPostings).orderBy(desc(jobPostings.createdAt));
  }

  async getJobPosting(id: string): Promise<JobPosting | undefined> {
    const [jobPosting] = await db.select().from(jobPostings).where(eq(jobPostings.id, id));
    return jobPosting;
  }

  async createJobPosting(jobPostingData: InsertJobPosting): Promise<JobPosting> {
    const [jobPosting] = await db.insert(jobPostings).values(jobPostingData).returning();
    return jobPosting;
  }

  async updateJobPosting(id: string, jobPostingData: Partial<InsertJobPosting>): Promise<JobPosting> {
    // Convert timestamp strings to Date objects if present
    const data: any = { ...jobPostingData };
    if (data.postedAt && typeof data.postedAt === 'string') {
      data.postedAt = new Date(data.postedAt);
    }
    if (data.closedAt && typeof data.closedAt === 'string') {
      data.closedAt = new Date(data.closedAt);
    }
    
    const [jobPosting] = await db
      .update(jobPostings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(jobPostings.id, id))
      .returning();
    return jobPosting;
  }

  async deleteJobPosting(id: string): Promise<void> {
    await db.delete(jobPostings).where(eq(jobPostings.id, id));
  }

  // ==================== APPLICANT OPERATIONS (INDEED連携) ====================
  
  async getAllApplicants(jobPostingId?: string): Promise<Applicant[]> {
    if (jobPostingId) {
      return await db.select().from(applicants)
        .where(eq(applicants.jobPostingId, jobPostingId))
        .orderBy(desc(applicants.appliedAt));
    }
    return await db.select().from(applicants).orderBy(desc(applicants.appliedAt));
  }

  async getApplicant(id: string): Promise<Applicant | undefined> {
    const [applicant] = await db.select().from(applicants).where(eq(applicants.id, id));
    return applicant;
  }

  async createApplicant(applicantData: InsertApplicant): Promise<Applicant> {
    const [applicant] = await db.insert(applicants).values(applicantData).returning();
    return applicant;
  }

  async updateApplicant(id: string, applicantData: Partial<InsertApplicant>): Promise<Applicant> {
    const [applicant] = await db
      .update(applicants)
      .set({ ...applicantData, updatedAt: new Date() })
      .where(eq(applicants.id, id))
      .returning();
    return applicant;
  }

  async deleteApplicant(id: string): Promise<void> {
    await db.delete(applicants).where(eq(applicants.id, id));
  }

  // ==================== TRANSACTION OPERATIONS ====================
  
  async getAllTransactions(businessId?: string): Promise<Transaction[]> {
    if (businessId) {
      return await db.select().from(transactions)
        .where(eq(transactions.businessId, businessId))
        .orderBy(desc(transactions.transactionDate));
    }
    return await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transactionData: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  // ==================== TASK OPERATIONS ====================
  
  async getAllTasks(filters?: { category?: string; status?: string; businessId?: string }): Promise<Task[]> {
    const conditions = [];
    if (filters?.category) conditions.push(eq(tasks.category, filters.category));
    if (filters?.status) conditions.push(eq(tasks.status, filters.status));
    if (filters?.businessId) conditions.push(eq(tasks.businessId, filters.businessId));
    
    if (conditions.length > 0) {
      return await db.select().from(tasks)
        .where(and(...conditions))
        .orderBy(desc(tasks.createdAt));
    }
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, taskData: Partial<InsertTask>): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...taskData, updatedAt: new Date() })
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // ==================== KPI OPERATIONS ====================
  
  async getAllKpis(businessId?: string): Promise<Kpi[]> {
    if (businessId) {
      return await db.select().from(kpis)
        .where(eq(kpis.businessId, businessId))
        .orderBy(desc(kpis.periodDate));
    }
    return await db.select().from(kpis).orderBy(desc(kpis.periodDate));
  }

  async getKpi(id: string): Promise<Kpi | undefined> {
    const [kpi] = await db.select().from(kpis).where(eq(kpis.id, id));
    return kpi;
  }

  async createKpi(kpiData: InsertKpi): Promise<Kpi> {
    const [kpi] = await db.insert(kpis).values(kpiData).returning();
    return kpi;
  }

  // ==================== COMMUNICATION OPERATIONS ====================
  
  async getAllCommunications(limit: number = 50): Promise<Communication[]> {
    return await db.select().from(communications)
      .orderBy(desc(communications.receivedAt))
      .limit(limit);
  }

  async getCommunication(id: string): Promise<Communication | undefined> {
    const [communication] = await db.select().from(communications).where(eq(communications.id, id));
    return communication;
  }

  async createCommunication(communicationData: InsertCommunication): Promise<Communication> {
    const [communication] = await db.insert(communications).values(communicationData).returning();
    return communication;
  }

  async updateCommunication(id: string, communicationData: Partial<InsertCommunication>): Promise<Communication> {
    const [communication] = await db
      .update(communications)
      .set(communicationData)
      .where(eq(communications.id, id))
      .returning();
    return communication;
  }

  // ==================== AI EVENT OPERATIONS ====================
  
  async getAllAiEvents(limit: number = 100): Promise<AiEvent[]> {
    return await db.select().from(aiEvents)
      .orderBy(desc(aiEvents.createdAt))
      .limit(limit);
  }

  async getAiEvent(id: string): Promise<AiEvent | undefined> {
    const [aiEvent] = await db.select().from(aiEvents).where(eq(aiEvents.id, id));
    return aiEvent;
  }

  async createAiEvent(aiEventData: InsertAiEvent): Promise<AiEvent> {
    const [aiEvent] = await db.insert(aiEvents).values(aiEventData).returning();
    return aiEvent;
  }

  // ==================== MEMORY OPERATIONS ====================
  
  async getAllMemories(limit: number = 100): Promise<Memory[]> {
    return await db.select().from(memory)
      .orderBy(desc(memory.createdAt))
      .limit(limit);
  }

  async getMemory(id: string): Promise<Memory | undefined> {
    const [mem] = await db.select().from(memory).where(eq(memory.id, id));
    return mem;
  }

  async createMemory(memoryData: InsertMemory): Promise<Memory> {
    const [mem] = await db.insert(memory).values(memoryData).returning();
    return mem;
  }

  async updateMemory(id: string, memoryData: Partial<InsertMemory>): Promise<Memory> {
    const [mem] = await db
      .update(memory)
      .set(memoryData)
      .where(eq(memory.id, id))
      .returning();
    return mem;
  }

  // ==================== CHAT HISTORY OPERATIONS ====================
  
  async getChatHistory(userId: string, sessionId?: string, limit: number = 100): Promise<ChatHistory[]> {
    if (sessionId) {
      return await db.select().from(chatHistory)
        .where(and(eq(chatHistory.userId, userId), eq(chatHistory.sessionId, sessionId)))
        .orderBy(chatHistory.createdAt)
        .limit(limit);
    }
    return await db.select().from(chatHistory)
      .where(eq(chatHistory.userId, userId))
      .orderBy(desc(chatHistory.createdAt))
      .limit(limit);
  }

  async createChatMessage(chatMessageData: InsertChatHistory): Promise<ChatHistory> {
    const [chatMessage] = await db.insert(chatHistory).values(chatMessageData).returning();
    return chatMessage;
  }

  // ==================== AI GENERATED CONTENT OPERATIONS ====================
  
  async getAllAiGeneratedContent(userId: string, contentType?: string, limit: number = 100): Promise<AiGeneratedContent[]> {
    if (contentType) {
      return await db.select().from(aiGeneratedContent)
        .where(and(eq(aiGeneratedContent.userId, userId), eq(aiGeneratedContent.contentType, contentType)))
        .orderBy(desc(aiGeneratedContent.createdAt))
        .limit(limit);
    }
    return await db.select().from(aiGeneratedContent)
      .where(eq(aiGeneratedContent.userId, userId))
      .orderBy(desc(aiGeneratedContent.createdAt))
      .limit(limit);
  }

  async getAiGeneratedContent(id: string): Promise<AiGeneratedContent | undefined> {
    const [content] = await db.select().from(aiGeneratedContent).where(eq(aiGeneratedContent.id, id));
    return content;
  }

  async createAiGeneratedContent(contentData: InsertAiGeneratedContent): Promise<AiGeneratedContent> {
    const [content] = await db.insert(aiGeneratedContent).values(contentData).returning();
    return content;
  }

  // ==================== CAMPAIGN OPERATIONS ====================
  
  async getAllCampaigns(businessId?: string): Promise<Campaign[]> {
    if (businessId) {
      return await db.select().from(campaigns)
        .where(eq(campaigns.businessId, businessId))
        .orderBy(desc(campaigns.createdAt));
    }
    return await db.select().from(campaigns).orderBy(desc(campaigns.createdAt));
  }

  async getCampaign(id: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async createCampaign(campaignData: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(campaignData).returning();
    return campaign;
  }

  async updateCampaign(id: string, campaignData: Partial<InsertCampaign>): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ ...campaignData, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  async deleteCampaign(id: string): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // ==================== SOCIAL POST OPERATIONS ====================
  
  async getAllSocialPosts(filters?: { 
    campaignId?: string; 
    businessId?: string; 
    platform?: string; 
    status?: string;
  }): Promise<SocialPost[]> {
    let query = db.select().from(socialPosts);
    
    const conditions = [];
    if (filters?.campaignId) {
      conditions.push(eq(socialPosts.campaignId, filters.campaignId));
    }
    if (filters?.businessId) {
      conditions.push(eq(socialPosts.businessId, filters.businessId));
    }
    if (filters?.platform) {
      conditions.push(eq(socialPosts.platform, filters.platform));
    }
    if (filters?.status) {
      conditions.push(eq(socialPosts.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(socialPosts.scheduledAt));
    }
    
    return await query.orderBy(desc(socialPosts.createdAt));
  }

  async getSocialPost(id: string): Promise<SocialPost | undefined> {
    const [post] = await db.select().from(socialPosts).where(eq(socialPosts.id, id));
    return post;
  }

  async createSocialPost(postData: InsertSocialPost): Promise<SocialPost> {
    const [post] = await db.insert(socialPosts).values(postData).returning();
    return post;
  }

  async updateSocialPost(id: string, postData: Partial<InsertSocialPost>): Promise<SocialPost> {
    const [post] = await db
      .update(socialPosts)
      .set({ ...postData, updatedAt: new Date() })
      .where(eq(socialPosts.id, id))
      .returning();
    return post;
  }

  async deleteSocialPost(id: string): Promise<void> {
    await db.delete(socialPosts).where(eq(socialPosts.id, id));
  }

  // ==================== SOCIAL CONNECTION OPERATIONS ====================
  
  async getAllSocialConnections(userId: string): Promise<SocialConnection[]> {
    return await db.select().from(socialConnections)
      .where(eq(socialConnections.userId, userId))
      .orderBy(desc(socialConnections.createdAt));
  }

  async getSocialConnection(id: string): Promise<SocialConnection | undefined> {
    const [connection] = await db.select().from(socialConnections).where(eq(socialConnections.id, id));
    return connection;
  }

  async getSocialConnectionByPlatform(userId: string, platform: string): Promise<SocialConnection | undefined> {
    const [connection] = await db.select().from(socialConnections)
      .where(and(
        eq(socialConnections.userId, userId),
        eq(socialConnections.platform, platform)
      ));
    return connection;
  }

  async createSocialConnection(connectionData: InsertSocialConnection): Promise<SocialConnection> {
    const [connection] = await db.insert(socialConnections).values(connectionData).returning();
    return connection;
  }

  async updateSocialConnection(id: string, connectionData: Partial<InsertSocialConnection>): Promise<SocialConnection> {
    const [connection] = await db
      .update(socialConnections)
      .set({ ...connectionData, updatedAt: new Date() })
      .where(eq(socialConnections.id, id))
      .returning();
    return connection;
  }

  async deleteSocialConnection(id: string): Promise<void> {
    await db.delete(socialConnections).where(eq(socialConnections.id, id));
  }

  // ==================== COMPANY SETTINGS OPERATIONS ====================
  
  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings;
  }

  async createCompanySettings(settingsData: InsertCompanySettings): Promise<CompanySettings> {
    const [settings] = await db.insert(companySettings).values(settingsData).returning();
    return settings;
  }

  async updateCompanySettings(id: string, settingsData: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const [settings] = await db
      .update(companySettings)
      .set({ ...settingsData, updatedAt: new Date() })
      .where(eq(companySettings.id, id))
      .returning();
    return settings;
  }

  // ==================== SERVICE CREDENTIALS OPERATIONS ====================
  
  async getAllServiceCredentials(): Promise<ServiceCredential[]> {
    const credentials = await db.select().from(serviceCredentials)
      .orderBy(desc(serviceCredentials.createdAt));
    // パスワードを除外してセキュリティを確保（nullを返す）
    return credentials.map(({ loginPassword, ...rest }) => ({
      ...rest,
      loginPassword: null,
    })) as ServiceCredential[];
  }

  async getServiceCredential(id: string): Promise<ServiceCredential | undefined> {
    const [credential] = await db.select().from(serviceCredentials).where(eq(serviceCredentials.id, id));
    if (!credential) return undefined;
    // パスワードを除外してセキュリティを確保（nullを返す）
    const { loginPassword, ...rest } = credential;
    return {
      ...rest,
      loginPassword: null,
    } as ServiceCredential;
  }

  async getServiceCredentialByName(serviceName: string): Promise<ServiceCredential | undefined> {
    const [credential] = await db.select().from(serviceCredentials)
      .where(eq(serviceCredentials.serviceName, serviceName));
    return credential;
  }

  async createServiceCredential(credentialData: InsertServiceCredential): Promise<ServiceCredential> {
    const [credential] = await db.insert(serviceCredentials).values(credentialData).returning();
    return credential;
  }

  async updateServiceCredential(id: string, credentialData: Partial<InsertServiceCredential>): Promise<ServiceCredential> {
    const [credential] = await db
      .update(serviceCredentials)
      .set({ ...credentialData, updatedAt: new Date() })
      .where(eq(serviceCredentials.id, id))
      .returning();
    return credential;
  }

  async deleteServiceCredential(id: string): Promise<void> {
    await db.delete(serviceCredentials).where(eq(serviceCredentials.id, id));
  }

  // ==================== EMPLOYEE PROFILE OPERATIONS ====================
  
  async getEmployeeProfile(userId: string): Promise<EmployeeProfile | undefined> {
    const [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId));
    return profile;
  }

  async getAllEmployeeProfiles(businessId?: string): Promise<EmployeeProfile[]> {
    if (businessId) {
      return await db.select().from(employeeProfiles)
        .where(eq(employeeProfiles.businessId, businessId))
        .orderBy(desc(employeeProfiles.createdAt));
    }
    return await db.select().from(employeeProfiles).orderBy(desc(employeeProfiles.createdAt));
  }

  async createEmployeeProfile(profileData: InsertEmployeeProfile): Promise<EmployeeProfile> {
    const [profile] = await db.insert(employeeProfiles).values(profileData).returning();
    return profile;
  }

  async updateEmployeeProfile(id: string, profileData: Partial<InsertEmployeeProfile>): Promise<EmployeeProfile> {
    const [profile] = await db
      .update(employeeProfiles)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(employeeProfiles.id, id))
      .returning();
    return profile;
  }

  async deleteEmployeeProfile(id: string): Promise<void> {
    await db.delete(employeeProfiles).where(eq(employeeProfiles.id, id));
  }

  // ==================== EMPLOYEE BANK ACCOUNT OPERATIONS ====================
  
  async getEmployeeBankAccounts(userId: string): Promise<EmployeeBankAccount[]> {
    return await db.select().from(employeeBankAccounts)
      .where(eq(employeeBankAccounts.userId, userId))
      .orderBy(desc(employeeBankAccounts.isPrimary), desc(employeeBankAccounts.createdAt));
  }

  async getEmployeeBankAccount(id: string): Promise<EmployeeBankAccount | undefined> {
    const [account] = await db.select().from(employeeBankAccounts).where(eq(employeeBankAccounts.id, id));
    return account;
  }

  async createEmployeeBankAccount(accountData: InsertEmployeeBankAccount): Promise<EmployeeBankAccount> {
    const [account] = await db.insert(employeeBankAccounts).values(accountData).returning();
    return account;
  }

  async updateEmployeeBankAccount(id: string, accountData: Partial<InsertEmployeeBankAccount>): Promise<EmployeeBankAccount> {
    const [account] = await db
      .update(employeeBankAccounts)
      .set({ ...accountData, updatedAt: new Date() })
      .where(eq(employeeBankAccounts.id, id))
      .returning();
    return account;
  }

  async deleteEmployeeBankAccount(id: string): Promise<void> {
    await db.delete(employeeBankAccounts).where(eq(employeeBankAccounts.id, id));
  }

  // ==================== EMPLOYEE SALARY OPERATIONS ====================
  
  async getEmployeeSalaries(userId: string, limit: number = 12): Promise<EmployeeSalary[]> {
    return await db.select().from(employeeSalaries)
      .where(eq(employeeSalaries.userId, userId))
      .orderBy(desc(employeeSalaries.paymentDate))
      .limit(limit);
  }

  async getEmployeeSalary(id: string): Promise<EmployeeSalary | undefined> {
    const [salary] = await db.select().from(employeeSalaries).where(eq(employeeSalaries.id, id));
    return salary;
  }

  async createEmployeeSalary(salaryData: InsertEmployeeSalary): Promise<EmployeeSalary> {
    const [salary] = await db.insert(employeeSalaries).values(salaryData).returning();
    return salary;
  }

  async updateEmployeeSalary(id: string, salaryData: Partial<InsertEmployeeSalary>): Promise<EmployeeSalary> {
    const [salary] = await db
      .update(employeeSalaries)
      .set({ ...salaryData, updatedAt: new Date() })
      .where(eq(employeeSalaries.id, id))
      .returning();
    return salary;
  }

  async deleteEmployeeSalary(id: string): Promise<void> {
    await db.delete(employeeSalaries).where(eq(employeeSalaries.id, id));
  }

  // ==================== NOTIFICATION OPERATIONS ====================
  
  async getNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.toUserId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.toUserId, userId),
        eq(notifications.isRead, false)
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async updateNotification(id: string, notificationData: Partial<InsertNotification>): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ ...notificationData, updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const [notification] = await db
      .update(notifications)
      .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return notification;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // ==================== CRM: CUSTOMER OPERATIONS ====================
  
  async getAllCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async createCustomer(customerData: InsertCustomer): Promise<Customer> {
    const [customer] = await db.insert(customers).values(customerData).returning();
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...customerData, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  // ==================== CRM: CONTACT OPERATIONS ====================
  
  async getAllContacts(customerId?: string): Promise<Contact[]> {
    if (customerId) {
      return await db.select().from(contacts)
        .where(eq(contacts.customerId, customerId))
        .orderBy(desc(contacts.createdAt));
    }
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt));
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact;
  }

  async createContact(contactData: InsertContact): Promise<Contact> {
    const [contact] = await db.insert(contacts).values(contactData).returning();
    return contact;
  }

  async updateContact(id: string, contactData: Partial<InsertContact>): Promise<Contact> {
    const [contact] = await db
      .update(contacts)
      .set({ ...contactData, updatedAt: new Date() })
      .where(eq(contacts.id, id))
      .returning();
    return contact;
  }

  async deleteContact(id: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, id));
  }

  // ==================== CRM: LEAD OPERATIONS ====================
  
  async getAllLeads(): Promise<Lead[]> {
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead;
  }

  async createLead(leadData: InsertLead): Promise<Lead> {
    const [lead] = await db.insert(leads).values(leadData).returning();
    return lead;
  }

  async updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await db
      .update(leads)
      .set({ ...leadData, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id));
  }

  async convertLeadToDeal(leadId: string, dealData: InsertDeal): Promise<{ deal: Deal; lead: Lead }> {
    const [deal] = await db.insert(deals).values(dealData).returning();
    const [lead] = await db
      .update(leads)
      .set({ 
        convertedToDealId: deal.id,
        convertedAt: new Date(),
        status: "converted",
        updatedAt: new Date()
      })
      .where(eq(leads.id, leadId))
      .returning();
    return { deal, lead };
  }

  // ==================== CRM: DEAL OPERATIONS ====================
  
  async getAllDeals(customerId?: string): Promise<Deal[]> {
    if (customerId) {
      return await db.select().from(deals)
        .where(eq(deals.customerId, customerId))
        .orderBy(desc(deals.createdAt));
    }
    return await db.select().from(deals).orderBy(desc(deals.createdAt));
  }

  async getDeal(id: string): Promise<Deal | undefined> {
    const [deal] = await db.select().from(deals).where(eq(deals.id, id));
    return deal;
  }

  async createDeal(dealData: InsertDeal): Promise<Deal> {
    const [deal] = await db.insert(deals).values(dealData).returning();
    return deal;
  }

  async updateDeal(id: string, dealData: Partial<InsertDeal>): Promise<Deal> {
    const [deal] = await db
      .update(deals)
      .set({ ...dealData, updatedAt: new Date() })
      .where(eq(deals.id, id))
      .returning();
    return deal;
  }

  async deleteDeal(id: string): Promise<void> {
    await db.delete(deals).where(eq(deals.id, id));
  }

  // ==================== CRM: ACTIVITY OPERATIONS ====================
  
  async getAllActivities(filters?: { customerId?: string; leadId?: string; dealId?: string }): Promise<Activity[]> {
    if (!filters) {
      return await db.select().from(activities).orderBy(desc(activities.createdAt));
    }
    
    const conditions = [];
    if (filters.customerId) conditions.push(eq(activities.customerId, filters.customerId));
    if (filters.leadId) conditions.push(eq(activities.leadId, filters.leadId));
    if (filters.dealId) conditions.push(eq(activities.dealId, filters.dealId));
    
    if (conditions.length > 0) {
      return await db.select().from(activities)
        .where(and(...conditions))
        .orderBy(desc(activities.createdAt));
    }
    
    return await db.select().from(activities).orderBy(desc(activities.createdAt));
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async createActivity(activityData: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(activityData).returning();
    return activity;
  }

  async updateActivity(id: string, activityData: Partial<InsertActivity>): Promise<Activity> {
    const [activity] = await db
      .update(activities)
      .set({ ...activityData, updatedAt: new Date() })
      .where(eq(activities.id, id))
      .returning();
    return activity;
  }

  async deleteActivity(id: string): Promise<void> {
    await db.delete(activities).where(eq(activities.id, id));
  }

  // ==================== MEMO OPERATIONS ====================
  
  async getAllMemos(userId: string): Promise<Memo[]> {
    return await db.select().from(memos)
      .where(eq(memos.userId, userId))
      .orderBy(desc(memos.updatedAt));
  }

  async getMemo(id: string): Promise<Memo | undefined> {
    const [memo] = await db.select().from(memos).where(eq(memos.id, id));
    return memo;
  }

  async createMemo(memoData: InsertMemo): Promise<Memo> {
    const [memo] = await db.insert(memos).values(memoData).returning();
    return memo;
  }

  async updateMemo(id: string, memoData: Partial<InsertMemo>): Promise<Memo> {
    const { userId, ...safeData } = memoData;
    const [memo] = await db
      .update(memos)
      .set({ ...safeData, updatedAt: new Date() })
      .where(eq(memos.id, id))
      .returning();
    return memo;
  }

  async deleteMemo(id: string): Promise<void> {
    await db.delete(memos).where(eq(memos.id, id));
  }

  // ==================== WORKFLOW OPERATIONS ====================
  
  async getAllWorkflows(): Promise<Workflow[]> {
    return await db.select().from(workflows).orderBy(workflows.createdAt);
  }

  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const [workflow] = await db.select().from(workflows).where(eq(workflows.id, id));
    return workflow;
  }

  async createWorkflow(workflowData: InsertWorkflow): Promise<Workflow> {
    const [workflow] = await db.insert(workflows).values(workflowData).returning();
    return workflow;
  }

  async updateWorkflow(id: string, workflowData: Partial<InsertWorkflow>): Promise<Workflow> {
    const [workflow] = await db
      .update(workflows)
      .set({ ...workflowData, updatedAt: new Date() })
      .where(eq(workflows.id, id))
      .returning();
    return workflow;
  }

  async deleteWorkflow(id: string): Promise<void> {
    await db.delete(workflows).where(eq(workflows.id, id));
  }

  async getWorkflowSteps(workflowId: string): Promise<WorkflowStep[]> {
    return await db
      .select()
      .from(workflowSteps)
      .where(eq(workflowSteps.workflowId, workflowId))
      .orderBy(workflowSteps.order);
  }

  async createWorkflowStep(stepData: InsertWorkflowStep): Promise<WorkflowStep> {
    const [step] = await db.insert(workflowSteps).values(stepData).returning();
    return step;
  }

  async updateWorkflowStep(id: string, stepData: Partial<InsertWorkflowStep>): Promise<WorkflowStep> {
    const [step] = await db
      .update(workflowSteps)
      .set({ ...stepData, updatedAt: new Date() })
      .where(eq(workflowSteps.id, id))
      .returning();
    return step;
  }

  async deleteWorkflowStep(id: string): Promise<void> {
    await db.delete(workflowSteps).where(eq(workflowSteps.id, id));
  }

  async getWorkflowConnections(workflowId: string): Promise<WorkflowConnection[]> {
    return await db
      .select()
      .from(workflowConnections)
      .where(eq(workflowConnections.workflowId, workflowId))
      .orderBy(workflowConnections.order);
  }

  async createWorkflowConnection(connectionData: InsertWorkflowConnection): Promise<WorkflowConnection> {
    const [connection] = await db.insert(workflowConnections).values(connectionData).returning();
    return connection;
  }

  async deleteWorkflowConnection(id: string): Promise<void> {
    await db.delete(workflowConnections).where(eq(workflowConnections.id, id));
  }

  async getWorkflowExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    if (workflowId) {
      return await db
        .select()
        .from(workflowExecutions)
        .where(eq(workflowExecutions.workflowId, workflowId))
        .orderBy(workflowExecutions.startedAt);
    }
    return await db.select().from(workflowExecutions).orderBy(workflowExecutions.startedAt);
  }

  async getWorkflowExecution(id: string): Promise<WorkflowExecution | undefined> {
    const [execution] = await db.select().from(workflowExecutions).where(eq(workflowExecutions.id, id));
    return execution;
  }

  async createWorkflowExecution(executionData: InsertWorkflowExecution): Promise<WorkflowExecution> {
    const [execution] = await db.insert(workflowExecutions).values(executionData).returning();
    return execution;
  }

  async updateWorkflowExecution(id: string, executionData: Partial<InsertWorkflowExecution>): Promise<WorkflowExecution> {
    const [execution] = await db
      .update(workflowExecutions)
      .set({ ...executionData, updatedAt: new Date() })
      .where(eq(workflowExecutions.id, id))
      .returning();
    return execution;
  }

  // ==================== ROLE PERMISSIONS OPERATIONS ====================

  async getRolePermissions(): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).orderBy(rolePermissions.role, rolePermissions.resource);
  }

  async getRolePermissionsByRole(role: string): Promise<RolePermission[]> {
    return await db.select().from(rolePermissions).where(eq(rolePermissions.role, role));
  }

  async updateRolePermission(id: string, permissionData: Partial<InsertRolePermission>): Promise<RolePermission> {
    const [permission] = await db
      .update(rolePermissions)
      .set({ ...permissionData, updatedAt: new Date() })
      .where(eq(rolePermissions.id, id))
      .returning();
    return permission;
  }
}

export const storage = new DatabaseStorage();
