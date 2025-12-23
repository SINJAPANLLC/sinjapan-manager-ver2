# SIN JAPAN MANAGER Ver2

## Overview
SIN JAPAN MANAGER Ver2 is a comprehensive, multi-tenant business management application designed to streamline operations with robust role-based access control. It offers a wide array of features including CRM, chat, notifications, HR management, sales tracking, task management (with AI assistance), business financial tracking, calendaring, and advanced AI functionalities for content generation. The system aims to provide a centralized platform for various business needs, supporting different roles from administrators to clients, and enhancing efficiency through automation and integrated tools. The multi-tenant architecture allows for customized branding and segregated data for each client.

## User Preferences
I prefer simple language and detailed explanations. I want iterative development with frequent, small updates. Ask before making major changes to the system architecture or core functionalities. Do not make changes to the existing folder structure unless explicitly requested.

## System Architecture

### UI/UX Decisions
The application features a refined white-based theme with blue gradient accents, implemented using Tailwind CSS. Key design elements include rounded cards with soft shadows, blue gradient buttons, and consistent styling across all pages for improved visual hierarchy and user experience. Custom components like `.glass-card` provide modern visual effects.

### Technical Implementations
-   **Frontend**: React 18 with TypeScript, Vite for build tooling, TanStack Query for state management, and Wouter for routing.
-   **Backend**: Express.js with TypeScript, using PostgreSQL (Neon) via Drizzle ORM.
-   **Authentication**: Session-based authentication with bcrypt for password hashing.
-   **Multi-tenancy**: Implemented via subdomain-based tenant separation, with dedicated branding, data segregation using a tenant storage wrapper, and support for tenant-specific Square payment settings and AI features.
-   **Security**: Server-side role-based authorization on all routes, staff ownership validation for data access, and session management.
-   **Role-Based Access Control**: Granular permissions for Admin/CEO, Manager, Staff, Agency, and Client roles, ensuring data visibility and feature access are restricted according to the user's role.
-   **AI Features**: Integrated capabilities for AI text conversation (GPT-4o-mini), image/video/voice generation (MODELSLAB API), SEO article generation, list generation, and document generation.
-   **Workflow & Organization Visualization**: Interactive diagrams using React Flow for task workflows and organizational structures, with editing, full-screen, PDF export, and reset functionalities.
-   **Data Filtering**: Role-based data filtering ensuring users only access data relevant to their permissions (e.g., staff only see their own created data).

### Feature Specifications
-   **CRM**: Comprehensive customer management including banking information.
-   **Chat & Notifications**: Real-time chat with file attachments and a robust notification system supporting bulk messages.
-   **HR Hub**: Employee management, including payroll with 5 custom deductions, shift management with amount and approval workflow (pending/approved/rejected), advance payment requests with fixed ¥330 transfer fee, and detailed staff profiles with task tracking, affiliate management, and personal notes. Salary breakdown displays approved task rewards and shift amounts grouped by approval date.
-   **Sales Tracking**: Agency sales tracking with incentive management (per project, percentage/fixed, specific/all agencies, time-bound).
-   **Task Management**: Creation, assignment, and evidence submission for tasks, with AI-generated task support.
-   **Financial Management**: Business sales/expense tracking, investment recording, and cash flow calculation.
-   **Calendar**: Personal and shared calendar with memo functionality.
-   **SEO Management**: Advanced SEO article management with categorization, bulk generation, AI-powered internal linking, and an indexing monitoring dashboard.
-   **Self-Registration**: Two-step self-registration for Staff, Agency, and Client roles.
-   **Square Payment Integration**: API integration for creating payment links, managing customer payments, and handling invoices, with environment switching.

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