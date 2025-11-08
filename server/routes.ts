// API Routes - All endpoints for SIN JAPAN MANAGER
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSession, isAuthenticated as replitIsAuthenticated, isAdmin } from "./replitAuth";
import passport, { isAuthenticated, hashPassword } from "./localAuth";
import { requirePermission, requireRole, canViewAll } from "./middleware/authorization";
import OpenAI from "openai";
import { google } from "googleapis";
import { getBusinessPL, getPeriodDates } from "./services/pl";
import { exportPLToExcel } from "./services/excel";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { 
  chatWithGemini, 
  generateTextWithGemini, 
  generateDocumentWithGemini,
  summarizeText,
  analyzeSentiment,
  generateTaskSuggestions,
  generateSocialPost,
  analyzeCustomer,
  generateFinancialReport
} from "./gemini";
import {
  insertBusinessSchema,
  insertContractSchema,
  insertShiftSchema,
  insertQuoteSchema,
  insertProjectSchema,
  insertMeetingSchema,
  insertJobPostingSchema,
  insertApplicantSchema,
  insertTransactionSchema,
  insertTaskSchema,
  insertKpiSchema,
  insertCommunicationSchema,
  insertAiEventSchema,
  insertMemorySchema,
  insertChatHistorySchema,
  insertAiGeneratedContentSchema,
  insertCampaignSchema,
  insertSocialPostSchema,
  insertSocialConnectionSchema,
  insertEmployeeProfileSchema,
  insertEmployeeBankAccountSchema,
  insertEmployeeSalarySchema,
  insertNotificationSchema,
} from "@shared/schema";

// Initialize OpenAI client (Replit AI Integrations)
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware first (required for Passport)
  app.set("trust proxy", 1);
  app.use(getSession());
  
  // Setup Passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // ==================== AUTH ROUTES ====================
  
  // Register new user
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードは必須です" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Normalize role to match permissions matrix
      const ROLE_MAPPING: Record<string, string> = {
        "ceo": "CEO",
        "manager": "Manager",
        "staff": "Staff",
        "agency": "Agency",
        "client": "Client",
        "ai": "AI",
        // Also accept already-capitalized versions
        "CEO": "CEO",
        "Manager": "Manager",
        "Staff": "Staff",
        "Agency": "Agency",
        "Client": "Client",
        "AI": "AI",
      };
      
      const normalizedRole = role 
        ? ROLE_MAPPING[role.toLowerCase()] || "Staff"
        : "Staff";

      // Create user
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        role: normalizedRole,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: error.message || "Failed to register user" });
    }
  });

  // Login
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "ログインエラーが発生しました" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "ログインに失敗しました" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "セッションの作成に失敗しました" });
        }
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "ログアウトに失敗しました" });
      }
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "セッションの削除に失敗しました" });
        }
        res.json({ success: true });
      });
    });
  });
  
  // Get current user - NOT protected, returns null if not authenticated
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.json(null);
      }
      const { password, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ==================== USER MANAGEMENT ROUTES ====================
  
  // Get all users (for task assignment, etc.)
  app.get('/api/users', isAuthenticated, requirePermission("view:users"), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Create new user (Admin only)
  app.post('/api/users', isAuthenticated, requirePermission("create:users"), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "メールアドレスとパスワードは必須です" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(400).json({ message: "このメールアドレスは既に登録されています" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Normalize role to match permissions matrix
      const ROLE_MAPPING: Record<string, string> = {
        "ceo": "CEO",
        "manager": "Manager",
        "staff": "Staff",
        "agency": "Agency",
        "client": "Client",
        "ai": "AI",
        "CEO": "CEO",
        "Manager": "Manager",
        "Staff": "Staff",
        "Agency": "Agency",
        "Client": "Client",
        "AI": "AI",
      };
      
      const normalizedRole = role 
        ? ROLE_MAPPING[role.toLowerCase()] || "Staff"
        : "Staff";

      // Create user
      const user = await storage.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName || "",
        lastName: lastName || "",
        role: normalizedRole,
      });

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: error.message || "ユーザーの作成に失敗しました" });
    }
  });

  // Update user (Admin only)
  app.patch('/api/users/:id', isAuthenticated, requirePermission("update:users"), async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const updateData: any = {};

      if (email) updateData.email = email.toLowerCase();
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      
      if (role) {
        // Normalize role
        const ROLE_MAPPING: Record<string, string> = {
          "ceo": "CEO",
          "manager": "Manager",
          "staff": "Staff",
          "agency": "Agency",
          "client": "Client",
          "ai": "AI",
          "CEO": "CEO",
          "Manager": "Manager",
          "Staff": "Staff",
          "Agency": "Agency",
          "Client": "Client",
          "AI": "AI",
        };
        updateData.role = ROLE_MAPPING[role.toLowerCase()] || "Staff";
      }

      // Hash password if provided
      if (password) {
        updateData.password = await hashPassword(password);
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await storage.getUserByEmail(email.toLowerCase());
        if (existingUser && existingUser.id !== req.params.id) {
          return res.status(400).json({ message: "このメールアドレスは既に使用されています" });
        }
      }

      const user = await storage.updateUser(req.params.id, updateData);
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: error.message || "ユーザーの更新に失敗しました" });
    }
  });

  // Delete user (Admin only)
  app.delete('/api/users/:id', isAuthenticated, requirePermission("delete:users"), async (req, res) => {
    try {
      // Prevent self-deletion
      if (req.user && req.user.id === req.params.id) {
        return res.status(400).json({ message: "自分自身のアカウントは削除できません" });
      }

      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: error.message || "ユーザーの削除に失敗しました" });
    }
  });

  // ==================== BUSINESS ROUTES ====================
  
  app.get("/api/businesses", isAuthenticated, requirePermission("view:businesses"), async (req, res) => {
    try {
      const businesses = await storage.getAllBusinesses();
      res.json(businesses);
    } catch (error) {
      console.error("Error fetching businesses:", error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.get("/api/businesses/:id", isAuthenticated, requirePermission("view:businesses"), async (req, res) => {
    try {
      const business = await storage.getBusiness(req.params.id);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      res.json(business);
    } catch (error) {
      console.error("Error fetching business:", error);
      res.status(500).json({ message: "Failed to fetch business" });
    }
  });

  app.post("/api/businesses", isAuthenticated, requirePermission("create:businesses"), async (req, res) => {
    try {
      const validatedData = insertBusinessSchema.parse(req.body);
      const business = await storage.createBusiness(validatedData);
      res.json(business);
    } catch (error: any) {
      console.error("Error creating business:", error);
      res.status(400).json({ message: error.message || "Failed to create business" });
    }
  });

  app.patch("/api/businesses/:id", isAuthenticated, requirePermission("update:businesses"), async (req, res) => {
    try {
      const business = await storage.updateBusiness(req.params.id, req.body);
      res.json(business);
    } catch (error) {
      console.error("Error updating business:", error);
      res.status(500).json({ message: "Failed to update business" });
    }
  });

  app.delete("/api/businesses/:id", isAuthenticated, requirePermission("delete:businesses"), async (req, res) => {
    try {
      await storage.deleteBusinesses(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting business:", error);
      res.status(500).json({ message: "Failed to delete business" });
    }
  });

  // ==================== CONTRACT ROUTES ====================
  
  app.get("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const contracts = await storage.getAllContracts(businessId);
      res.json(contracts);
    } catch (error) {
      console.error("Error fetching contracts:", error);
      res.status(500).json({ message: "Failed to fetch contracts" });
    }
  });

  app.post("/api/contracts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertContractSchema.parse(req.body);
      const contract = await storage.createContract(validatedData);
      res.json(contract);
    } catch (error: any) {
      console.error("Error creating contract:", error);
      res.status(400).json({ message: error.message || "Failed to create contract" });
    }
  });

  app.patch("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      const contract = await storage.updateContract(req.params.id, req.body);
      res.json(contract);
    } catch (error) {
      console.error("Error updating contract:", error);
      res.status(500).json({ message: "Failed to update contract" });
    }
  });

  app.delete("/api/contracts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteContract(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contract:", error);
      res.status(500).json({ message: "Failed to delete contract" });
    }
  });

  // ==================== SHIFT ROUTES ====================
  
  app.get("/api/shifts", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const userId = req.query.userId as string | undefined;
      const shifts = await storage.getAllShifts(businessId, userId);
      res.json(shifts);
    } catch (error) {
      console.error("Error fetching shifts:", error);
      res.status(500).json({ message: "Failed to fetch shifts" });
    }
  });

  app.get("/api/shifts/:id", isAuthenticated, async (req, res) => {
    try {
      const shift = await storage.getShift(req.params.id);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error) {
      console.error("Error fetching shift:", error);
      res.status(500).json({ message: "Failed to fetch shift" });
    }
  });

  app.post("/api/shifts", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(validatedData);
      res.json(shift);
    } catch (error: any) {
      console.error("Error creating shift:", error);
      res.status(400).json({ message: error.message || "Failed to create shift" });
    }
  });

  app.patch("/api/shifts/:id", isAuthenticated, async (req, res) => {
    try {
      const shift = await storage.updateShift(req.params.id, req.body);
      res.json(shift);
    } catch (error) {
      console.error("Error updating shift:", error);
      res.status(500).json({ message: "Failed to update shift" });
    }
  });

  app.delete("/api/shifts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteShift(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shift:", error);
      res.status(500).json({ message: "Failed to delete shift" });
    }
  });

  // ==================== QUOTE ROUTES ====================
  
  app.get("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const quotes = await storage.getAllQuotes(businessId);
      res.json(quotes);
    } catch (error) {
      console.error("Error fetching quotes:", error);
      res.status(500).json({ message: "Failed to fetch quotes" });
    }
  });

  app.get("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const quote = await storage.getQuote(req.params.id);
      if (!quote) {
        return res.status(404).json({ message: "Quote not found" });
      }
      res.json(quote);
    } catch (error) {
      console.error("Error fetching quote:", error);
      res.status(500).json({ message: "Failed to fetch quote" });
    }
  });

  app.post("/api/quotes", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertQuoteSchema.parse(req.body);
      const quote = await storage.createQuote(validatedData);
      res.json(quote);
    } catch (error: any) {
      console.error("Error creating quote:", error);
      res.status(400).json({ message: error.message || "Failed to create quote" });
    }
  });

  app.patch("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      const quote = await storage.updateQuote(req.params.id, req.body);
      res.json(quote);
    } catch (error) {
      console.error("Error updating quote:", error);
      res.status(500).json({ message: "Failed to update quote" });
    }
  });

  app.delete("/api/quotes/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteQuote(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting quote:", error);
      res.status(500).json({ message: "Failed to delete quote" });
    }
  });

  // ==================== PROJECT ROUTES ====================
  
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const projects = await storage.getAllProjects(businessId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.json(project);
    } catch (error: any) {
      console.error("Error creating project:", error);
      res.status(400).json({ message: error.message || "Failed to create project" });
    }
  });

  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteProject(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // ==================== MEETING ROUTES ====================
  
  app.get("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const projectId = req.query.projectId as string | undefined;
      const meetings = await storage.getAllMeetings(businessId, projectId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const meeting = await storage.getMeeting(req.params.id);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMeetingSchema.parse(req.body);
      const meeting = await storage.createMeeting(validatedData);
      res.json(meeting);
    } catch (error: any) {
      console.error("Error creating meeting:", error);
      res.status(400).json({ message: error.message || "Failed to create meeting" });
    }
  });

  app.patch("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(req.params.id, req.body);
      res.json(meeting);
    } catch (error) {
      console.error("Error updating meeting:", error);
      res.status(500).json({ message: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteMeeting(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // ==================== JOB POSTING ROUTES (INDEED連携) ====================
  
  app.get("/api/job-postings", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const jobPostings = await storage.getAllJobPostings(businessId);
      res.json(jobPostings);
    } catch (error) {
      console.error("Error fetching job postings:", error);
      res.status(500).json({ message: "Failed to fetch job postings" });
    }
  });

  app.get("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const jobPosting = await storage.getJobPosting(req.params.id);
      if (!jobPosting) {
        return res.status(404).json({ message: "Job posting not found" });
      }
      res.json(jobPosting);
    } catch (error) {
      console.error("Error fetching job posting:", error);
      res.status(500).json({ message: "Failed to fetch job posting" });
    }
  });

  app.post("/api/job-postings", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertJobPostingSchema.parse(req.body);
      const jobPosting = await storage.createJobPosting(validatedData);
      res.json(jobPosting);
    } catch (error: any) {
      console.error("Error creating job posting:", error);
      res.status(400).json({ message: error.message || "Failed to create job posting" });
    }
  });

  app.patch("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      const jobPosting = await storage.updateJobPosting(req.params.id, req.body);
      res.json(jobPosting);
    } catch (error) {
      console.error("Error updating job posting:", error);
      res.status(500).json({ message: "Failed to update job posting" });
    }
  });

  app.delete("/api/job-postings/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteJobPosting(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting job posting:", error);
      res.status(500).json({ message: "Failed to delete job posting" });
    }
  });

  // ==================== APPLICANT ROUTES (INDEED連携) ====================
  
  app.get("/api/applicants", isAuthenticated, async (req, res) => {
    try {
      const jobPostingId = req.query.jobPostingId as string | undefined;
      const applicants = await storage.getAllApplicants(jobPostingId);
      res.json(applicants);
    } catch (error) {
      console.error("Error fetching applicants:", error);
      res.status(500).json({ message: "Failed to fetch applicants" });
    }
  });

  app.get("/api/applicants/:id", isAuthenticated, async (req, res) => {
    try {
      const applicant = await storage.getApplicant(req.params.id);
      if (!applicant) {
        return res.status(404).json({ message: "Applicant not found" });
      }
      res.json(applicant);
    } catch (error) {
      console.error("Error fetching applicant:", error);
      res.status(500).json({ message: "Failed to fetch applicant" });
    }
  });

  app.post("/api/applicants", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertApplicantSchema.parse(req.body);
      const applicant = await storage.createApplicant(validatedData);
      res.json(applicant);
    } catch (error: any) {
      console.error("Error creating applicant:", error);
      res.status(400).json({ message: error.message || "Failed to create applicant" });
    }
  });

  app.patch("/api/applicants/:id", isAuthenticated, async (req, res) => {
    try {
      const applicant = await storage.updateApplicant(req.params.id, req.body);
      res.json(applicant);
    } catch (error) {
      console.error("Error updating applicant:", error);
      res.status(500).json({ message: "Failed to update applicant" });
    }
  });

  app.delete("/api/applicants/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteApplicant(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting applicant:", error);
      res.status(500).json({ message: "Failed to delete applicant" });
    }
  });

  // ==================== TRANSACTION ROUTES ====================
  
  app.get("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const transactions = await storage.getAllTransactions(businessId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.json(transaction);
    } catch (error: any) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: error.message || "Failed to create transaction" });
    }
  });

  // ==================== TASK ROUTES ====================
  
  app.get("/api/tasks", isAuthenticated, requirePermission("view:tasks:all", "view:tasks:own"), async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      const filters: any = {
        category: req.query.category as string | undefined,
        status: req.query.status as string | undefined,
        businessId: req.query.businessId as string | undefined,
      };
      
      // If user can only view their own tasks, add userId filter
      if (!canViewAll(userRole)) {
        filters.userId = userId;
      }
      
      const tasks = await storage.getAllTasks(filters);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post("/api/tasks", isAuthenticated, requirePermission("create:tasks"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const validatedData = insertTaskSchema.parse({
        ...req.body,
        createdBy: userId,
      });
      const task = await storage.createTask(validatedData);
      res.json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", isAuthenticated, requirePermission("update:tasks:all", "update:tasks:own"), async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Check ownership if user can only update their own tasks
      if (!canViewAll(userRole)) {
        const task = await storage.getTask(req.params.id);
        if (!task || task.createdBy !== userId) {
          return res.status(403).json({ message: "このタスクを更新する権限がありません" });
        }
      }
      
      const task = await storage.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", isAuthenticated, requirePermission("delete:tasks:all", "delete:tasks:own"), async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // Check ownership if user can only delete their own tasks
      if (!canViewAll(userRole)) {
        const task = await storage.getTask(req.params.id);
        if (!task || task.createdBy !== userId) {
          return res.status(403).json({ message: "このタスクを削除する権限がありません" });
        }
      }
      
      await storage.deleteTask(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ==================== KPI ROUTES ====================
  
  app.get("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const kpis = await storage.getAllKpis(businessId);
      res.json(kpis);
    } catch (error) {
      console.error("Error fetching kpis:", error);
      res.status(500).json({ message: "Failed to fetch kpis" });
    }
  });

  app.post("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertKpiSchema.parse(req.body);
      const kpi = await storage.createKpi(validatedData);
      res.json(kpi);
    } catch (error: any) {
      console.error("Error creating kpi:", error);
      res.status(400).json({ message: error.message || "Failed to create kpi" });
    }
  });

  // ==================== FINANCE ROUTES ====================
  
  app.get("/api/finance/pl", isAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || "monthly";
      const transactions = await storage.getAllTransactions();
      
      // Calculate P&L
      const revenue = transactions
        .filter(t => t.type === "revenue")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const cogs = expenses * 0.4; // Simplified: 40% of expenses
      const opex = expenses * 0.6; // Simplified: 60% of expenses
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - opex;
      
      res.json({
        period,
        revenue,
        cogs,
        grossProfit,
        opex,
        netProfit,
      });
    } catch (error) {
      console.error("Error calculating P&L:", error);
      res.status(500).json({ message: "Failed to calculate P&L" });
    }
  });

  app.get("/api/finance/bs", isAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || "monthly";
      
      // Simplified Balance Sheet calculation
      const businesses = await storage.getAllBusinesses();
      const totalAssets = businesses.reduce((sum, b) => sum + parseFloat(b.revenue || "0"), 0) * 0.8;
      const currentAssets = totalAssets * 0.6;
      const fixedAssets = totalAssets * 0.4;
      
      const totalLiabilities = totalAssets * 0.3;
      const currentLiabilities = totalLiabilities * 0.6;
      const longTermLiabilities = totalLiabilities * 0.4;
      
      const equity = totalAssets - totalLiabilities;
      
      res.json({
        period,
        currentAssets,
        fixedAssets,
        totalAssets,
        currentLiabilities,
        longTermLiabilities,
        totalLiabilities,
        equity,
      });
    } catch (error) {
      console.error("Error calculating B/S:", error);
      res.status(500).json({ message: "Failed to calculate B/S" });
    }
  });

  app.get("/api/finance/cf", isAuthenticated, async (req, res) => {
    try {
      const period = req.query.period as string || "monthly";
      const transactions = await storage.getAllTransactions();
      
      // Simplified Cash Flow calculation
      const revenue = transactions
        .filter(t => t.type === "revenue")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = transactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const operating = revenue - expenses;
      const investing = -operating * 0.15; // Simplified: 15% reinvestment
      const financing = 0; // No financing activity
      const netChange = operating + investing + financing;
      
      res.json({
        period,
        operating,
        investing,
        financing,
        netChange,
      });
    } catch (error) {
      console.error("Error calculating C/F:", error);
      res.status(500).json({ message: "Failed to calculate C/F" });
    }
  });

  // ==================== COMMUNICATION ROUTES ====================
  
  app.get("/api/communications", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const communications = await storage.getAllCommunications(limit);
      res.json(communications);
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({ message: "Failed to fetch communications" });
    }
  });

  app.post("/api/communications", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCommunicationSchema.parse(req.body);
      const communication = await storage.createCommunication(validatedData);
      res.json(communication);
    } catch (error: any) {
      console.error("Error creating communication:", error);
      res.status(400).json({ message: error.message || "Failed to create communication" });
    }
  });

  // ==================== AI ROUTES ====================
  
  // AI Chat endpoint (Gemini)
  app.post("/api/ai/chat", isAuthenticated, async (req, res) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。Gemini APIキーが設定されていません。",
          response: "AI機能を利用するには、Gemini APIキーを設定してください。" 
        });
      }

      // Call Gemini with system context
      const systemPrompt = `あなたはSIN JAPAN MANAGERの統合AIエージェントです。3層AIシステム（SIGMA戦略判断、MIZUKI日次自動化、NEURAL文書生成）として動作し、11事業部門の管理、財務分析、タスク管理をサポートします。常に日本語で簡潔に回答してください。

ユーザーの質問: ${message}`;

      const response = await generateTextWithGemini(systemPrompt);

      // Log AI event
      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "chat_response",
        input: { message },
        output: { response },
        status: "success",
        executionTime: 0,
      });

      res.json({ response });
    } catch (error: any) {
      console.error("Error in AI chat:", error);
      
      // Log error event
      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "chat_response",
        input: { message: req.body.message },
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "AI処理中にエラーが発生しました",
        response: "申し訳ございません。現在AIサービスに問題が発生しています。" 
      });
    }
  });

  // AI Events
  app.get("/api/ai/events", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const events = await storage.getAllAiEvents(limit);
      res.json(events);
    } catch (error) {
      console.error("Error fetching AI events:", error);
      res.status(500).json({ message: "Failed to fetch AI events" });
    }
  });

  app.get("/api/ai/events/recent", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getAllAiEvents(10);
      res.json(events);
    } catch (error) {
      console.error("Error fetching recent AI events:", error);
      res.status(500).json({ message: "Failed to fetch recent AI events" });
    }
  });

  app.post("/api/ai/events", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAiEventSchema.parse(req.body);
      const event = await storage.createAiEvent(validatedData);
      res.json(event);
    } catch (error: any) {
      console.error("Error creating AI event:", error);
      res.status(400).json({ message: error.message || "Failed to create AI event" });
    }
  });

  // AI Memory
  app.get("/api/ai/memory", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const memories = await storage.getAllMemories(limit);
      res.json(memories);
    } catch (error) {
      console.error("Error fetching AI memories:", error);
      res.status(500).json({ message: "Failed to fetch AI memories" });
    }
  });

  app.post("/api/ai/memory", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMemorySchema.parse(req.body);
      const memory = await storage.createMemory(validatedData);
      res.json(memory);
    } catch (error: any) {
      console.error("Error creating AI memory:", error);
      res.status(400).json({ message: error.message || "Failed to create AI memory" });
    }
  });

  // AI Chat History (persistent conversations)
  app.get("/api/ai/chat/history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const sessionId = req.query.sessionId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getChatHistory(userId, sessionId, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Enhanced AI Chat with memory and context (Gemini)
  app.post("/api/ai/chat/enhanced", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { message, sessionId } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。",
          response: "AI機能を利用するには、Gemini APIキーを設定してください。" 
        });
      }

      // Get conversation history for context
      const history = sessionId 
        ? await storage.getChatHistory(userId, sessionId, 10)
        : [];

      // Build context from history
      const conversationMessages = history.map((h) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      }));

      // Get relevant memories for context
      const memories = await storage.getAllMemories(5);
      const memoryContext = memories.length > 0
        ? `\n\n過去の記憶:\n${memories.map((m) => `- ${m.content}`).join("\n")}`
        : "";

      // Build full prompt with system context
      const systemContext = `あなたはSIN JAPAN MANAGERの統合AIエージェントです。3層AIシステム（SIGMA戦略判断、MIZUKI日次自動化、NEURAL文書生成）として動作し、11事業部門の管理、財務分析、タスク管理をサポートします。

ユーザーとの会話を記憶し、文脈を理解した上で回答してください。${memoryContext}

常に日本語で簡潔かつ具体的に回答してください。`;

      // Prepend system context to conversation history
      const fullHistory = [
        { role: "assistant", content: systemContext },
        ...conversationMessages,
      ];

      // Call Gemini with full context
      const response = await chatWithGemini(message, fullHistory);

      // Save user message to history
      const newSessionId = sessionId || `session_${Date.now()}`;
      await storage.createChatMessage({
        userId,
        sessionId: newSessionId,
        role: "user",
        content: message,
        metadata: null,
      });

      // Save assistant response to history
      await storage.createChatMessage({
        userId,
        sessionId: newSessionId,
        role: "assistant",
        content: response,
        metadata: {
          model: "gemini-2.0-flash-exp",
          provider: "google",
        },
      });

      // Auto-create memory for important insights
      if (message.length > 50 || response.length > 100) {
        await storage.createMemory({
          type: "conversation",
          content: `Q: ${message.substring(0, 100)} A: ${response.substring(0, 100)}`,
          context: { userId, sessionId: newSessionId },
          importance: 5,
          accessCount: 0,
          lastAccessedAt: null,
        });
      }

      // Log AI event
      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "enhanced_chat",
        input: { message, sessionId: newSessionId },
        output: { response },
        status: "success",
        executionTime: 0,
      });

      res.json({ response, sessionId: newSessionId });
    } catch (error: any) {
      console.error("Error in enhanced AI chat:", error);
      res.status(500).json({ 
        message: "AI処理中にエラーが発生しました",
        response: "申し訳ございません。現在AIサービスに問題が発生しています。" 
      });
    }
  });

  // AI Image Generation (Currently unavailable - Replit AI Integrations doesn't support DALL-E)
  app.post("/api/ai/generate/image", isAuthenticated, async (req: any, res) => {
    try {
      await storage.createAiEvent({
        agentType: "NEURAL",
        actionType: "image_generation",
        input: { prompt: req.body.prompt },
        output: null,
        status: "error",
        errorMessage: "画像生成機能は現在準備中です",
        executionTime: 0,
      });
      
      res.status(503).json({ 
        message: "AI画像生成機能は現在準備中です",
        details: "Replit AI Integrationsでは画像生成がサポートされていません。今後のアップデートで対応予定です。"
      });
    } catch (error: any) {
      console.error("Error in image generation endpoint:", error);
      res.status(500).json({ 
        message: "エラーが発生しました",
        error: error.message
      });
    }
  });

  // AI Document Generation (Gemini)
  app.post("/api/ai/generate/document", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { type, prompt, context } = req.body;
      
      if (!prompt || !type) {
        return res.status(400).json({ message: "Prompt and type are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI文書生成機能は現在利用できません。Gemini APIキーが設定されていません。" 
        });
      }

      // Call Gemini for document generation
      const document = await generateDocumentWithGemini(type, prompt, context);

      // Save to AI generated content
      const content = await storage.createAiGeneratedContent({
        userId,
        contentType: "document",
        prompt,
        result: document,
        metadata: {
          model: "gemini-2.0-flash-exp",
          provider: "google",
          type,
          context,
        },
        status: "completed",
      });

      // Log AI event
      await storage.createAiEvent({
        agentType: "NEURAL",
        actionType: "document_generation",
        input: { type, prompt, context },
        output: { document: document.substring(0, 200) },
        status: "success",
        executionTime: 0,
      });

      res.json({ document, contentId: content.id });
    } catch (error: any) {
      console.error("Error generating document:", error);
      
      await storage.createAiEvent({
        agentType: "NEURAL",
        actionType: "document_generation",
        input: { type: req.body.type, prompt: req.body.prompt },
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "文書生成中にエラーが発生しました",
        error: error.message
      });
    }
  });

  // Get AI Generated Content
  app.get("/api/ai/generated-content", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const contentType = req.query.type as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const content = await storage.getAllAiGeneratedContent(userId, contentType, limit);
      res.json(content);
    } catch (error) {
      console.error("Error fetching generated content:", error);
      res.status(500).json({ message: "Failed to fetch generated content" });
    }
  });

  // AI Task Generation
  app.post("/api/ai/generate/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const { context } = req.body;
      
      if (!context) {
        return res.status(400).json({ message: "Context is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。Gemini APIキーが設定されていません。" 
        });
      }

      const tasks = await generateTaskSuggestions(context);

      await storage.createAiEvent({
        agentType: "MIZUKI",
        actionType: "task_generation",
        input: { context },
        output: { tasks },
        status: "success",
        executionTime: 0,
      });

      res.json({ tasks });
    } catch (error: any) {
      console.error("Error generating tasks:", error);
      
      await storage.createAiEvent({
        agentType: "MIZUKI",
        actionType: "task_generation",
        input: { context: req.body.context },
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "タスク生成中にエラーが発生しました",
        error: error.message
      });
    }
  });

  // AI SNS Post Generation
  app.post("/api/ai/generate/social-post", isAuthenticated, async (req: any, res) => {
    try {
      const { platform, topic, tone, hashtags } = req.body;
      
      if (!platform || !topic) {
        return res.status(400).json({ message: "Platform and topic are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。Gemini APIキーが設定されていません。" 
        });
      }

      const result = await generateSocialPost({ platform, topic, tone, hashtags });

      await storage.createAiEvent({
        agentType: "NEURAL",
        actionType: "social_post_generation",
        input: { platform, topic, tone, hashtags },
        output: result,
        status: "success",
        executionTime: 0,
      });

      res.json(result);
    } catch (error: any) {
      console.error("Error generating social post:", error);
      
      await storage.createAiEvent({
        agentType: "NEURAL",
        actionType: "social_post_generation",
        input: req.body,
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "SNS投稿生成中にエラーが発生しました",
        error: error.message
      });
    }
  });

  // AI Customer Analysis
  app.post("/api/ai/analyze/customer", isAuthenticated, async (req: any, res) => {
    try {
      const { name, interactions, lastContact, notes } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Customer name is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。Gemini APIキーが設定されていません。" 
        });
      }

      const analysis = await analyzeCustomer({ name, interactions, lastContact, notes });

      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "customer_analysis",
        input: { name, interactions, lastContact, notes },
        output: analysis,
        status: "success",
        executionTime: 0,
      });

      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing customer:", error);
      
      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "customer_analysis",
        input: req.body,
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "顧客分析中にエラーが発生しました",
        error: error.message
      });
    }
  });

  // AI Financial Report Generation
  app.post("/api/ai/generate/financial-report", isAuthenticated, async (req: any, res) => {
    try {
      const { period, revenue, expenses, profit, context } = req.body;
      
      if (!period || revenue === undefined || expenses === undefined || profit === undefined) {
        return res.status(400).json({ message: "Period, revenue, expenses, and profit are required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(503).json({ 
          message: "AI機能は現在利用できません。Gemini APIキーが設定されていません。" 
        });
      }

      const report = await generateFinancialReport({ period, revenue, expenses, profit, context });

      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "financial_report_generation",
        input: { period, revenue, expenses, profit, context },
        output: { report: report.substring(0, 200) },
        status: "success",
        executionTime: 0,
      });

      res.json({ report });
    } catch (error: any) {
      console.error("Error generating financial report:", error);
      
      await storage.createAiEvent({
        agentType: "SIGMA",
        actionType: "financial_report_generation",
        input: req.body,
        output: null,
        status: "error",
        errorMessage: error.message,
        executionTime: 0,
      });
      
      res.status(500).json({ 
        message: "財務レポート生成中にエラーが発生しました",
        error: error.message
      });
    }
  });

  // ==================== MARKETING ROUTES ====================
  
  // Campaign Routes
  app.get("/api/campaigns", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const campaigns = await storage.getAllCampaigns(businessId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.getCampaign(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: "Campaign not found" });
      }
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  });

  app.post("/api/campaigns", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertCampaignSchema.parse({ ...req.body, createdBy: userId });
      const campaign = await storage.createCampaign(data);
      res.status(201).json(campaign);
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      res.status(400).json({ message: error.message || "Failed to create campaign" });
    }
  });

  app.patch("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      const campaign = await storage.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      res.status(400).json({ message: error.message || "Failed to update campaign" });
    }
  });

  app.delete("/api/campaigns/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteCampaign(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  });

  // Social Post Routes
  app.get("/api/social-posts", isAuthenticated, async (req, res) => {
    try {
      const filters = {
        campaignId: req.query.campaignId as string | undefined,
        businessId: req.query.businessId as string | undefined,
        platform: req.query.platform as string | undefined,
        status: req.query.status as string | undefined,
      };
      const posts = await storage.getAllSocialPosts(filters);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching social posts:", error);
      res.status(500).json({ message: "Failed to fetch social posts" });
    }
  });

  app.get("/api/social-posts/:id", isAuthenticated, async (req, res) => {
    try {
      const post = await storage.getSocialPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Social post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching social post:", error);
      res.status(500).json({ message: "Failed to fetch social post" });
    }
  });

  app.post("/api/social-posts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertSocialPostSchema.parse({ ...req.body, createdBy: userId });
      const post = await storage.createSocialPost(data);
      res.status(201).json(post);
    } catch (error: any) {
      console.error("Error creating social post:", error);
      res.status(400).json({ message: error.message || "Failed to create social post" });
    }
  });

  app.patch("/api/social-posts/:id", isAuthenticated, async (req, res) => {
    try {
      const post = await storage.updateSocialPost(req.params.id, req.body);
      res.json(post);
    } catch (error: any) {
      console.error("Error updating social post:", error);
      res.status(400).json({ message: error.message || "Failed to update social post" });
    }
  });

  app.delete("/api/social-posts/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSocialPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social post:", error);
      res.status(500).json({ message: "Failed to delete social post" });
    }
  });

  // ==================== SOCIAL CONNECTION ROUTES ====================
  
  // Get all social connections for current user
  app.get("/api/social-connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connections = await storage.getAllSocialConnections(userId);
      
      // Remove sensitive tokens from response
      const safeConnections = connections.map(conn => ({
        ...conn,
        accessToken: conn.accessToken ? "***" : null,
        refreshToken: conn.refreshToken ? "***" : null,
      }));
      
      res.json(safeConnections);
    } catch (error) {
      console.error("Error fetching social connections:", error);
      res.status(500).json({ message: "Failed to fetch social connections" });
    }
  });

  // Create new social connection
  app.post("/api/social-connections", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertSocialConnectionSchema.parse({ ...req.body, userId });
      
      // Check if connection already exists for this platform
      const existing = await storage.getSocialConnectionByPlatform(userId, data.platform);
      if (existing) {
        return res.status(400).json({ 
          message: `${data.platform}への接続は既に存在します。先に削除してください。` 
        });
      }
      
      const connection = await storage.createSocialConnection(data);
      
      // Remove sensitive tokens from response
      const safeConnection = {
        ...connection,
        accessToken: connection.accessToken ? "***" : null,
        refreshToken: connection.refreshToken ? "***" : null,
      };
      
      res.status(201).json(safeConnection);
    } catch (error: any) {
      console.error("Error creating social connection:", error);
      res.status(400).json({ message: error.message || "Failed to create social connection" });
    }
  });

  // Update social connection
  app.patch("/api/social-connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connection = await storage.getSocialConnection(req.params.id);
      
      if (!connection) {
        return res.status(404).json({ message: "Social connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updated = await storage.updateSocialConnection(req.params.id, req.body);
      
      // Remove sensitive tokens from response
      const safeConnection = {
        ...updated,
        accessToken: updated.accessToken ? "***" : null,
        refreshToken: updated.refreshToken ? "***" : null,
      };
      
      res.json(safeConnection);
    } catch (error: any) {
      console.error("Error updating social connection:", error);
      res.status(400).json({ message: error.message || "Failed to update social connection" });
    }
  });

  // Delete social connection
  app.delete("/api/social-connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const connection = await storage.getSocialConnection(req.params.id);
      
      if (!connection) {
        return res.status(404).json({ message: "Social connection not found" });
      }
      
      if (connection.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.deleteSocialConnection(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting social connection:", error);
      res.status(500).json({ message: "Failed to delete social connection" });
    }
  });

  // Publish social post to platform
  app.post("/api/social-posts/:id/publish", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const post = await storage.getSocialPost(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: "Social post not found" });
      }
      
      // Get user's connection for this platform
      const connection = await storage.getSocialConnectionByPlatform(userId, post.platform);
      
      if (!connection || !connection.isActive) {
        return res.status(400).json({ 
          message: `${post.platform}への接続が見つかりません。先にSNS連携設定を行ってください。` 
        });
      }
      
      // TODO: Call actual SNS API based on platform
      // For now, we'll simulate the publishing
      const publishResult = await publishToSocialMedia(post, connection);
      
      if (!publishResult.success) {
        await storage.updateSocialPost(post.id, {
          status: "failed",
          metadata: { error: publishResult.error },
        });
        return res.status(500).json({ 
          message: `投稿の公開に失敗しました: ${publishResult.error}` 
        });
      }
      
      // Update post with published status
      const updatedPost = await storage.updateSocialPost(post.id, {
        status: "published",
        publishedAt: new Date(),
        externalId: publishResult.externalId,
      });
      
      // Update last used timestamp for connection
      await storage.updateSocialConnection(connection.id, {
        lastUsed: new Date(),
      });
      
      res.json({ 
        message: "投稿を公開しました",
        post: updatedPost,
        externalId: publishResult.externalId,
      });
    } catch (error: any) {
      console.error("Error publishing social post:", error);
      res.status(500).json({ 
        message: error.message || "Failed to publish social post" 
      });
    }
  });

  // ==================== HEALTH CHECK ====================
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ==================== P/L (Profit & Loss) ROUTES ====================
  
  // Get business P/L
  app.get("/api/finance/pl", isAuthenticated, async (req, res) => {
    try {
      const businessId = req.query.businessId as string | undefined;
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const period = (req.query.period as "month" | "quarter" | "year") || "month";
      const value = parseInt(req.query.value as string) || 1;

      const { start, end } = getPeriodDates(year, period, value);
      const pl = await getBusinessPL(businessId || null, start, end);

      res.json(pl);
    } catch (error) {
      console.error("Error fetching P/L:", error);
      res.status(500).json({ message: "Failed to fetch P/L" });
    }
  });

  // Export P/L to Excel
  app.post("/api/finance/pl/export", isAuthenticated, async (req, res) => {
    try {
      const { businessId, year, period, value } = req.body;

      const yearNum = parseInt(year) || new Date().getFullYear();
      const periodType = period || "month";
      const valueNum = parseInt(value) || 1;

      const { start, end } = getPeriodDates(yearNum, periodType, valueNum);
      const pl = await getBusinessPL(businessId || null, start, end);

      const excelBuffer = await exportPLToExcel(pl);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=PL_${pl.businessName}_${yearNum}${periodType}${valueNum}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error exporting P/L:", error);
      res.status(500).json({ message: "Failed to export P/L" });
    }
  });

  // ==================== COMPANY SETTINGS ROUTES ====================
  
  // Get company settings
  app.get("/api/settings/company", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "会社設定の取得に失敗しました" });
    }
  });

  // Create company settings
  app.post("/api/settings/company", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.createCompanySettings({
        ...req.body,
        updatedBy: req.user!.id,
      });
      res.status(201).json(settings);
    } catch (error) {
      console.error("Error creating company settings:", error);
      res.status(500).json({ message: "会社設定の作成に失敗しました" });
    }
  });

  // Update company settings
  app.patch("/api/settings/company/:id", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.params.id, {
        ...req.body,
        updatedBy: req.user!.id,
      });
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "会社設定の更新に失敗しました" });
    }
  });

  // ==================== SERVICE CREDENTIALS ROUTES ====================
  
  // Get all service credentials
  app.get("/api/settings/services", isAuthenticated, async (req, res) => {
    try {
      const credentials = await storage.getAllServiceCredentials();
      res.json(credentials);
    } catch (error) {
      console.error("Error fetching service credentials:", error);
      res.status(500).json({ message: "サービス認証情報の取得に失敗しました" });
    }
  });

  // Get single service credential
  app.get("/api/settings/services/:id", isAuthenticated, async (req, res) => {
    try {
      const credential = await storage.getServiceCredential(req.params.id);
      if (!credential) {
        return res.status(404).json({ message: "サービス認証情報が見つかりません" });
      }
      res.json(credential);
    } catch (error) {
      console.error("Error fetching service credential:", error);
      res.status(500).json({ message: "サービス認証情報の取得に失敗しました" });
    }
  });

  // Create service credential
  app.post("/api/settings/services", isAuthenticated, async (req, res) => {
    try {
      const credential = await storage.createServiceCredential({
        ...req.body,
        createdBy: req.user!.id,
        updatedBy: req.user!.id,
      });
      res.status(201).json(credential);
    } catch (error) {
      console.error("Error creating service credential:", error);
      res.status(500).json({ message: "サービス認証情報の作成に失敗しました" });
    }
  });

  // Update service credential
  app.patch("/api/settings/services/:id", isAuthenticated, async (req, res) => {
    try {
      // パスワードが空またはnullの場合は送信しない（既存のパスワードを保持）
      const updateData: any = {
        ...req.body,
        updatedBy: req.user!.id,
      };
      
      // パスワードが空文字列、null、またはundefinedの場合は削除
      if (!updateData.loginPassword) {
        delete updateData.loginPassword;
      }
      
      const credential = await storage.updateServiceCredential(req.params.id, updateData);
      res.json(credential);
    } catch (error) {
      console.error("Error updating service credential:", error);
      res.status(500).json({ message: "サービス認証情報の更新に失敗しました" });
    }
  });

  // Delete service credential
  app.delete("/api/settings/services/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteServiceCredential(req.params.id);
      res.json({ message: "サービス認証情報を削除しました" });
    } catch (error) {
      console.error("Error deleting service credential:", error);
      res.status(500).json({ message: "サービス認証情報の削除に失敗しました" });
    }
  });

  // Check service connection status
  app.post("/api/settings/services/:id/check", isAuthenticated, async (req, res) => {
    try {
      const credential = await storage.getServiceCredential(req.params.id);
      if (!credential) {
        return res.status(404).json({ message: "サービス認証情報が見つかりません" });
      }

      // 環境変数から実際のキーを取得してテスト
      let isConnected = false;
      let error = null;

      if (credential.secretKeyName && process.env[credential.secretKeyName]) {
        // サービスごとの接続チェックロジックをここに実装
        // 現時点では環境変数の存在確認のみ
        isConnected = true;
      } else {
        error = "APIキーが設定されていません";
      }

      // 接続状態を更新
      const updated = await storage.updateServiceCredential(credential.id, {
        isConnected,
        status: isConnected ? "active" : "error",
        lastCheckedAt: new Date(),
        lastSuccessAt: isConnected ? new Date() : credential.lastSuccessAt,
        lastError: error,
        errorCount: isConnected ? 0 : (credential.errorCount || 0) + 1,
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Error checking service connection:", error);
      res.status(500).json({ message: "接続確認に失敗しました" });
    }
  });

  // ==================== EMPLOYEE PORTAL ROUTES ====================
  
  // Employee Profile routes
  app.get("/api/employee/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getEmployeeProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error fetching employee profile:", error);
      res.status(500).json({ message: "従業員プロフィールの取得に失敗しました" });
    }
  });

  app.get("/api/employee/profiles", isAuthenticated, async (req, res) => {
    try {
      const { businessId } = req.query;
      const profiles = await storage.getAllEmployeeProfiles(businessId as string);
      res.json(profiles);
    } catch (error) {
      console.error("Error fetching employee profiles:", error);
      res.status(500).json({ message: "従業員プロフィール一覧の取得に失敗しました" });
    }
  });

  app.post("/api/employee/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertEmployeeProfileSchema.parse({ ...req.body, userId });
      const profile = await storage.createEmployeeProfile(data);
      res.json(profile);
    } catch (error) {
      console.error("Error creating employee profile:", error);
      res.status(500).json({ message: "従業員プロフィールの作成に失敗しました" });
    }
  });

  app.patch("/api/employee/profile/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertEmployeeProfileSchema.partial().parse(req.body);
      const profile = await storage.updateEmployeeProfile(id, data);
      res.json(profile);
    } catch (error) {
      console.error("Error updating employee profile:", error);
      res.status(500).json({ message: "従業員プロフィールの更新に失敗しました" });
    }
  });

  app.delete("/api/employee/profile/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeProfile(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting employee profile:", error);
      res.status(500).json({ message: "従業員プロフィールの削除に失敗しました" });
    }
  });

  // Employee Bank Account routes
  app.get("/api/employee/bank-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const accounts = await storage.getEmployeeBankAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      res.status(500).json({ message: "口座情報の取得に失敗しました" });
    }
  });

  app.post("/api/employee/bank-accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const data = insertEmployeeBankAccountSchema.parse({ ...req.body, userId });
      const account = await storage.createEmployeeBankAccount(data);
      res.json(account);
    } catch (error) {
      console.error("Error creating bank account:", error);
      res.status(500).json({ message: "口座情報の登録に失敗しました" });
    }
  });

  app.patch("/api/employee/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertEmployeeBankAccountSchema.partial().parse(req.body);
      const account = await storage.updateEmployeeBankAccount(id, data);
      res.json(account);
    } catch (error) {
      console.error("Error updating bank account:", error);
      res.status(500).json({ message: "口座情報の更新に失敗しました" });
    }
  });

  app.delete("/api/employee/bank-accounts/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeBankAccount(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bank account:", error);
      res.status(500).json({ message: "口座情報の削除に失敗しました" });
    }
  });

  // Employee Salary routes
  app.get("/api/employee/salaries", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 12;
      const salaries = await storage.getEmployeeSalaries(userId, limit);
      res.json(salaries);
    } catch (error) {
      console.error("Error fetching salaries:", error);
      res.status(500).json({ message: "給与情報の取得に失敗しました" });
    }
  });

  app.get("/api/employee/salaries/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const salary = await storage.getEmployeeSalary(id);
      res.json(salary);
    } catch (error) {
      console.error("Error fetching salary:", error);
      res.status(500).json({ message: "給与情報の取得に失敗しました" });
    }
  });

  app.post("/api/employee/salaries", isAuthenticated, async (req, res) => {
    try {
      const data = insertEmployeeSalarySchema.parse(req.body);
      const salary = await storage.createEmployeeSalary(data);
      res.json(salary);
    } catch (error) {
      console.error("Error creating salary:", error);
      res.status(500).json({ message: "給与情報の作成に失敗しました" });
    }
  });

  app.patch("/api/employee/salaries/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertEmployeeSalarySchema.partial().parse(req.body);
      const salary = await storage.updateEmployeeSalary(id, data);
      res.json(salary);
    } catch (error) {
      console.error("Error updating salary:", error);
      res.status(500).json({ message: "給与情報の更新に失敗しました" });
    }
  });

  app.delete("/api/employee/salaries/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEmployeeSalary(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting salary:", error);
      res.status(500).json({ message: "給与情報の削除に失敗しました" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const notifications = await storage.getNotifications(userId, limit);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "通知の取得に失敗しました" });
    }
  });

  app.get("/api/notifications/unread", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const notifications = await storage.getUnreadNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      res.status(500).json({ message: "未読通知の取得に失敗しました" });
    }
  });

  app.post("/api/notifications", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const fromUserId = req.user.id;
      const data = insertNotificationSchema.parse({ ...req.body, fromUserId });
      const notification = await storage.createNotification(data);
      res.json(notification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "通知の作成に失敗しました" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "通知の既読化に失敗しました" });
    }
  });

  app.delete("/api/notifications/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ message: "通知の削除に失敗しました" });
    }
  });

  // ==================== CRM ENDPOINTS ====================
  const requireAuth = isAuthenticated;

  // Customer endpoints
  app.get("/api/crm/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomer(req.params.id);
      if (!customer) {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/customers", requireAuth, async (req, res) => {
    try {
      console.log("POST /api/crm/customers - Request body:", JSON.stringify(req.body, null, 2));
      const { insertCustomerSchema } = await import("@shared/schema");
      const validatedData = insertCustomerSchema.parse(req.body);
      console.log("POST /api/crm/customers - Validated data:", JSON.stringify(validatedData, null, 2));
      const customer = await storage.createCustomer(validatedData);
      res.status(201).json(customer);
    } catch (error: any) {
      console.error("POST /api/crm/customers - Error:", error);
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.updateCustomer(req.params.id, req.body);
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteCustomer(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Contact endpoints
  app.get("/api/crm/contacts", requireAuth, async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const contacts = await storage.getAllContacts(customerId);
      res.json(contacts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.getContact(req.params.id);
      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/contacts", requireAuth, async (req, res) => {
    try {
      const { insertContactSchema } = await import("@shared/schema");
      const validatedData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(validatedData);
      res.status(201).json(contact);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/crm/contacts/:id", requireAuth, async (req, res) => {
    try {
      const contact = await storage.updateContact(req.params.id, req.body);
      res.json(contact);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/crm/contacts/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteContact(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Lead endpoints
  app.get("/api/crm/leads", requireAuth, async (req, res) => {
    try {
      const leads = await storage.getAllLeads();
      res.json(leads);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.getLead(req.params.id);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/leads", requireAuth, async (req, res) => {
    try {
      const { insertLeadSchema } = await import("@shared/schema");
      const validatedData = insertLeadSchema.parse(req.body);
      const lead = await storage.createLead(validatedData);
      res.status(201).json(lead);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/crm/leads/:id", requireAuth, async (req, res) => {
    try {
      const lead = await storage.updateLead(req.params.id, req.body);
      res.json(lead);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/crm/leads/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLead(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/leads/:id/convert", requireAuth, async (req, res) => {
    try {
      const { insertDealSchema } = await import("@shared/schema");
      const validatedData = insertDealSchema.parse(req.body);
      const result = await storage.convertLeadToDeal(req.params.id, validatedData);
      res.json(result);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  // Deal endpoints
  app.get("/api/crm/deals", requireAuth, async (req, res) => {
    try {
      const customerId = req.query.customerId as string | undefined;
      const deals = await storage.getAllDeals(customerId);
      res.json(deals);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/deals/:id", requireAuth, async (req, res) => {
    try {
      const deal = await storage.getDeal(req.params.id);
      if (!deal) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/deals", requireAuth, async (req, res) => {
    try {
      const { insertDealSchema } = await import("@shared/schema");
      const validatedData = insertDealSchema.parse(req.body);
      const deal = await storage.createDeal(validatedData);
      res.status(201).json(deal);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/crm/deals/:id", requireAuth, async (req, res) => {
    try {
      const deal = await storage.updateDeal(req.params.id, req.body);
      res.json(deal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/crm/deals/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteDeal(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity endpoints
  app.get("/api/crm/activities", requireAuth, async (req, res) => {
    try {
      const filters = {
        customerId: req.query.customerId as string | undefined,
        leadId: req.query.leadId as string | undefined,
        dealId: req.query.dealId as string | undefined,
      };
      const activities = await storage.getAllActivities(filters);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/crm/activities/:id", requireAuth, async (req, res) => {
    try {
      const activity = await storage.getActivity(req.params.id);
      if (!activity) {
        return res.status(404).json({ error: "Activity not found" });
      }
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/crm/activities", requireAuth, async (req, res) => {
    try {
      const { insertActivitySchema } = await import("@shared/schema");
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(validatedData);
      res.status(201).json(activity);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/crm/activities/:id", requireAuth, async (req, res) => {
    try {
      const activity = await storage.updateActivity(req.params.id, req.body);
      res.json(activity);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/crm/activities/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteActivity(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== MEMO ROUTES ====================

  app.get("/api/memos", isAuthenticated, requirePermission("view:memos:all", "view:memos:own"), async (req: any, res) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.id;
      
      // CEOs and Managers can view all memos, others only their own
      const memos = canViewAll(userRole) 
        ? await storage.getAllMemos()
        : await storage.getAllMemos(userId);
      
      res.json(memos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/memos/:id", isAuthenticated, requirePermission("view:memos:all", "view:memos:own"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      const memo = await storage.getMemo(req.params.id);
      if (!memo) {
        res.status(404).json({ error: "Memo not found" });
        return;
      }
      
      // Check ownership if user can only view their own memos
      if (!canViewAll(userRole) && memo.userId !== userId) {
        res.status(403).json({ error: "このメモを表示する権限がありません" });
        return;
      }
      
      res.json(memo);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/memos", isAuthenticated, requirePermission("create:memos"), async (req: any, res) => {
    try {
      const { insertMemoSchema } = await import("@shared/schema");
      const validatedData = insertMemoSchema.parse({
        ...req.body,
        userId: req.user?.id,
      });
      const memo = await storage.createMemo(validatedData);
      res.status(201).json(memo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/memos/:id", isAuthenticated, requirePermission("update:memos:own"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const existing = await storage.getMemo(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Memo not found" });
        return;
      }
      
      // Check ownership
      if (existing.userId !== userId) {
        res.status(403).json({ error: "このメモを編集する権限がありません" });
        return;
      }
      
      const { insertMemoSchema } = await import("@shared/schema");
      const validatedData = insertMemoSchema.partial().omit({ userId: true }).parse(req.body);
      const keys = Object.keys(validatedData);
      if (keys.length === 0) {
        res.status(400).json({ error: "At least one field must be provided" });
        return;
      }
      const memo = await storage.updateMemo(req.params.id, validatedData);
      res.json(memo);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/memos/:id", isAuthenticated, requirePermission("delete:memos:own"), async (req: any, res) => {
    try {
      const userId = req.user?.id;
      
      const existing = await storage.getMemo(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Memo not found" });
        return;
      }
      
      // Check ownership
      if (existing.userId !== userId) {
        res.status(403).json({ error: "このメモを削除する権限がありません" });
        return;
      }
      
      await storage.deleteMemo(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== WORKFLOW ROUTES ====================
  
  app.get("/api/workflows", requireAuth, async (req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { insertWorkflowSchema } = await import("@shared/schema");
      const validatedData = insertWorkflowSchema.parse({
        ...req.body,
        createdBy: user.claims.sub,
      });
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      const workflow = await storage.updateWorkflow(req.params.id, req.body);
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkflow(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/steps", requireAuth, async (req, res) => {
    try {
      const steps = await storage.getWorkflowSteps(req.params.id);
      res.json(steps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/steps", requireAuth, async (req, res) => {
    try {
      const { insertWorkflowStepSchema } = await import("@shared/schema");
      const validatedData = insertWorkflowStepSchema.parse({
        ...req.body,
        workflowId: req.params.id,
      });
      const step = await storage.createWorkflowStep(validatedData);
      res.status(201).json(step);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/workflow-steps/:id", requireAuth, async (req, res) => {
    try {
      const step = await storage.updateWorkflowStep(req.params.id, req.body);
      res.json(step);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflow-steps/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkflowStep(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/connections", requireAuth, async (req, res) => {
    try {
      const connections = await storage.getWorkflowConnections(req.params.id);
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/connections", requireAuth, async (req, res) => {
    try {
      const { insertWorkflowConnectionSchema } = await import("@shared/schema");
      const validatedData = insertWorkflowConnectionSchema.parse({
        ...req.body,
        workflowId: req.params.id,
      });
      const connection = await storage.createWorkflowConnection(validatedData);
      res.status(201).json(connection);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.delete("/api/workflow-connections/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteWorkflowConnection(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflow-executions", requireAuth, async (req, res) => {
    try {
      const workflowId = req.query.workflowId as string | undefined;
      const executions = await storage.getWorkflowExecutions(workflowId);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflow-executions", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const { insertWorkflowExecutionSchema } = await import("@shared/schema");
      const validatedData = insertWorkflowExecutionSchema.parse({
        ...req.body,
        initiatedBy: user.claims.sub,
      });
      const execution = await storage.createWorkflowExecution(validatedData);
      res.status(201).json(execution);
    } catch (error: any) {
      if (error.name === "ZodError") {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  });

  app.patch("/api/workflow-executions/:id", requireAuth, async (req, res) => {
    try {
      const execution = await storage.updateWorkflowExecution(req.params.id, req.body);
      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== ROLE PERMISSIONS ROUTES ====================
  
  // Get all role permissions
  app.get("/api/role-permissions", requireAuth, requirePermission("permissions", "read"), async (req, res) => {
    try {
      const permissions = await storage.getRolePermissions();
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get permissions for a specific role
  app.get("/api/role-permissions/:role", requireAuth, async (req, res) => {
    try {
      const permissions = await storage.getRolePermissionsByRole(req.params.role);
      res.json(permissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update role permission
  app.patch("/api/role-permissions/:id", requireAuth, requirePermission("permissions", "update"), async (req, res) => {
    try {
      const permission = await storage.updateRolePermission(req.params.id, req.body);
      res.json(permission);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==================== OBJECT STORAGE ROUTES ====================
  
  // Serve public assets from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects (with authentication and ACL check)
  app.get("/objects/:objectPath(*)", requireAuth, async (req, res) => {
    const userId = req.user?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error: any) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Get upload URL for object entity
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Confirm file upload and set ACL policy
  app.put("/api/objects/confirm", requireAuth, async (req, res) => {
    const userId = req.user?.id;
    if (!req.body.fileURL) {
      return res.status(400).json({ error: "fileURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.fileURL,
        {
          owner: userId,
          visibility: req.body.visibility || "private",
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error: any) {
      console.error("Error confirming upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ==================== STRIPE PAYMENT ROUTES ====================
  
  // Create payment intent (requires Stripe API key)
  app.post("/api/payments/create-intent", requireAuth, async (req, res) => {
    try {
      // Check if Stripe is configured
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(503).json({ 
          error: "Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable." 
        });
      }

      const { amount, currency = "jpy", description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid amount" });
      }

      // TODO: Implement actual Stripe payment intent creation
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.create({
      //   amount,
      //   currency,
      //   description,
      //   metadata: { userId: req.user?.id },
      // });

      res.json({
        clientSecret: "mock_client_secret",
        paymentIntentId: "mock_payment_intent_id",
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Confirm payment
  app.post("/api/payments/confirm", requireAuth, async (req, res) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({ error: "paymentIntentId is required" });
      }

      // TODO: Implement actual Stripe payment confirmation
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      res.json({
        status: "succeeded",
        amount: 1000,
        currency: "jpy",
      });
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get payment history
  app.get("/api/payments", requireAuth, async (req, res) => {
    try {
      // TODO: Implement actual Stripe payment history retrieval
      // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      // const paymentIntents = await stripe.paymentIntents.list({
      //   limit: 100,
      //   customer: req.user?.stripeCustomerId,
      // });

      res.json({
        payments: [],
        hasMore: false,
      });
    } catch (error: any) {
      console.error("Error getting payment history:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// ==================== SNS PUBLISHING HELPERS ====================

// Publish post to social media platform
async function publishToSocialMedia(post: any, connection: any): Promise<{
  success: boolean;
  externalId?: string;
  error?: string;
}> {
  try {
    switch (post.platform) {
      case "twitter":
        return await publishToTwitter(post, connection);
      case "instagram":
        return await publishToInstagram(post, connection);
      case "facebook":
        return await publishToFacebook(post, connection);
      case "linkedin":
        return await publishToLinkedIn(post, connection);
      default:
        return { success: false, error: "Unsupported platform" };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Twitter/X API integration
async function publishToTwitter(post: any, connection: any): Promise<{
  success: boolean;
  externalId?: string;
  error?: string;
}> {
  // TODO: Implement actual Twitter API v2 call
  // For now, return a simulated success
  console.log("Publishing to Twitter:", post.content);
  
  return {
    success: true,
    externalId: `twitter_${Date.now()}`,
  };
}

// Instagram API integration
async function publishToInstagram(post: any, connection: any): Promise<{
  success: boolean;
  externalId?: string;
  error?: string;
}> {
  // TODO: Implement actual Instagram Graph API call
  console.log("Publishing to Instagram:", post.content);
  
  if (!post.mediaUrls || post.mediaUrls.length === 0) {
    return { 
      success: false, 
      error: "Instagram requires at least one image or video" 
    };
  }
  
  return {
    success: true,
    externalId: `instagram_${Date.now()}`,
  };
}

// Facebook API integration
async function publishToFacebook(post: any, connection: any): Promise<{
  success: boolean;
  externalId?: string;
  error?: string;
}> {
  // TODO: Implement actual Facebook Graph API call
  console.log("Publishing to Facebook:", post.content);
  
  return {
    success: true,
    externalId: `facebook_${Date.now()}`,
  };
}

// LinkedIn API integration
async function publishToLinkedIn(post: any, connection: any): Promise<{
  success: boolean;
  externalId?: string;
  error?: string;
}> {
  // TODO: Implement actual LinkedIn API call
  console.log("Publishing to LinkedIn:", post.content);
  
  return {
    success: true,
    externalId: `linkedin_${Date.now()}`,
  };
}

