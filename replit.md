# SIN JAPAN MANAGER Ver2

## Overview
SIN JAPAN MANAGER Ver2 is a comprehensive, multi-tenant business management application designed to streamline operations with robust role-based access control. It offers a wide array of features including CRM, chat, notifications, HR management, sales tracking, task management (with AI assistance), business financial tracking, calendaring, and advanced AI functionalities for content generation. The system aims to provide a centralized platform for various business needs, supporting different roles from administrators to clients, and enhancing efficiency through automation and integrated tools. The multi-tenant architecture allows for customized branding and segregated data for each client.

## User Preferences
I prefer simple language and detailed explanations. I want iterative development with frequent, small updates. Ask before making major changes to the system architecture or core functionalities. Do not make changes to the existing folder structure unless explicitly requested.

## System Architecture

### UI/UX Decisions
The application features a refined white-based theme with blue gradient accents, implemented using Tailwind CSS. Key design elements include rounded cards with soft shadows, blue gradient buttons, and consistent styling across all pages for improved visual hierarchy and user experience. Custom components like `.glass-card` provide modern visual effects.

**Mobile Responsive Design (Dec 2024)**:
-   Collapsible hamburger menu for mobile devices (hidden sidebar by default on screens < lg)
-   Fixed header with app branding on mobile
-   Responsive grid layouts (1-column on mobile, expanding on larger screens)
-   Horizontal scrollable tables for financial data on small screens
-   Touch-friendly navigation with proper spacing and tap targets
-   CSS utility classes: `.mobile-scroll-x`, `.page-header`, `.page-title`, `.grid-responsive`, `.modal-container`

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite for build tooling, TanStack Query for state management, and Wouter for routing.
-   **Backend**: Express.js with TypeScript, using PostgreSQL (Neon) via Drizzle ORM.
-   **Authentication**: Session-based authentication with bcrypt for password hashing.
-   **Multi-tenancy**: Implemented via subdomain-based tenant separation, with dedicated branding, data segregation using a tenant storage wrapper, and support for tenant-specific Square payment settings and AI features.
-   **Security**: Server-side role-based authorization on all routes, staff ownership validation for data access, and session management.
-   **Role-Based Access Control**: Granular permissions for Admin/CEO, Manager, Staff, Agency, and Client roles, ensuring data visibility and feature access are restricted according to the user's role.
-   **AI Features**: Integrated capabilities for AI text conversation (GPT-4o-mini), image/video/voice generation (MODELSLAB API), SEO article generation, list generation, document generation, multi-language translation (22 languages), learning content generation (psychology/business management), music concept/lyrics generation, LP (landing page) structure/copy generation, and drama script generation.
-   **Workflow & Organization Visualization**: Interactive diagrams using React Flow for task workflows and organizational structures, with editing, full-screen, PDF export, and reset functionalities.
-   **Data Filtering**: Role-based data filtering ensuring users only access data relevant to their permissions (e.g., staff only see their own created data).

### Feature Specifications
-   **CRM**: Comprehensive customer management including banking information.
-   **Chat & Notifications**: Real-time chat with file attachments, group chat functionality (create groups, manage members, group messaging), and a robust notification system supporting bulk messages. DM and Group chat modes with separate tabs.
-   **HR Hub**: Employee management, including payroll with 5 custom deductions, shift management with amount and approval workflow (pending/approved/rejected), advance payment requests with fixed ¥330 transfer fee, and detailed staff profiles with task tracking, affiliate management, and personal notes. Salary breakdown displays approved task rewards and shift amounts grouped by approval date.
-   **Sales Tracking**: Agency sales tracking with incentive management (per project, percentage/fixed, specific/all agencies, time-bound).
-   **Task Management**: Creation, assignment, and evidence submission for tasks, with AI-generated task support.
-   **Financial Management**: Business sales/expense tracking, investment recording, and cash flow calculation. **Module sales from Logistics, Staffing, IT, and BPO are automatically posted to PL/CF statements.**
-   **Calendar**: Personal and shared calendar with memo functionality.
-   **SEO Management**: Advanced SEO article management with categorization, bulk generation, AI-powered internal linking, and an indexing monitoring dashboard.
-   **Self-Registration**: Two-step self-registration for Staff, Agency, and Client roles.
-   **Square Payment Integration**: API integration for creating payment links, managing customer payments, and handling invoices, with environment switching.
-   **Staffing/Recruitment Module (人材)**: Complete staffing management with 5 tabs:
    - 案件一覧: Job listings with employment type, salary, requirements, and status tracking
    - 求職者一覧・詳細・進捗: Candidate management with applications pipeline (applied → screening → interview → offer → hired)
    - 職務経歴書: Resume/CV management linked to candidates
    - 請求書: Invoice generation and tracking for placements
    - 売上: Sales tracking with summary statistics (total sales, monthly revenue, placement count)

## External Dependencies
-   **Database**: PostgreSQL (Neon)
-   **ORM**: Drizzle ORM
-   **AI APIs**:
    -   OpenAI GPT-4o-mini (for AI text conversation, SEO article generation, list generation)
    -   MODELSLAB API (for image, video, voice generation)
-   **Payment Gateway**: Square SDK (for payment processing and management)
-   **UI Libraries**:
    -   Tailwind CSS
    -   React Flow (for diagram visualization)
-   **PDF Generation**: html2canvas + jsPDF