# SIN JAPAN MANAGER

AI駆動型の自律的な社内管理システム - SIN JAPAN LLCのための統合ビジネスOS

## Overview
SIN JAPAN MANAGER is an AI-driven, autonomous internal management system designed as an integrated business OS for SIN JAPAN LLC. Its primary purpose is to unify 11 business divisions, centrally managing finance, tasks, communication, and AI agents. The system aims to provide a comprehensive solution for business operations, offering features from a CEO dashboard with KPI overviews to advanced AI capabilities for strategic decision-making and content generation, along with robust marketing, workflow, and KGI/KPI/KTF analysis functionalities.

## User Preferences
I prefer simple language. I want iterative development. Ask before making major changes. I prefer detailed explanations. Do not make changes to the folder `Z`. Do not make changes to the file `Y`.

## System Architecture

### UI/UX Decisions
The system employs a clean and modern design.
- **Color Palette**: Primary color is a deep green (#00A676) with a white background for light mode and #171717 for dark mode. Cards are #FAFAFA (light) / #1E1E1E (dark).
- **Typography**: Inter for alphanumeric, Noto Sans JP for Japanese, and JetBrains Mono for code/data.
- **Layout**: Features a sidebar (280px expanded, 64px collapsed) and an AI console bar (64px height). Max width is 1536px (max-w-screen-2xl).
- **Responsiveness**: Designed to be fully responsive and includes dark mode support.
- **Components**: Utilizes Shadcn UI and Radix UI for a consistent and accessible component library.

### Technical Implementations
- **Frontend**: Built with React 18 and TypeScript, using Wouter for routing, TanStack Query for state management, Tailwind CSS for styling, Lucide React for icons, and React Hook Form with Zod for forms.
- **Backend**: Powered by Node.js and Express.js.
- **Database**: PostgreSQL (Neon) managed with Drizzle ORM.
- **Authentication**: Replit Auth (OpenID Connect) with session management via `express-session` and `connect-pg-simple`.
- **Validation**: Zod is used for data validation across the stack.

### Feature Specifications
- **User Authentication**: Supports Google, GitHub, X, Apple, and email/password logins with role management (CEO, Manager, Staff, AI).
- **CEO Dashboard**: Provides an overview of all business divisions, KPIs, total sales, net profit, active tasks, and AI activity summaries.
- **Business Division Management**: Detailed pages for each of the 11 divisions, showing real-time revenue, expenses, profit, contract information, and transaction history.
- **Task Management**: Tasks categorized into 4 quadrants (Sales, Organization, Risk, Expansion) with CRUD operations, priority settings, and AI-generated tasks.
- **Financial Management**: Automated P&L, B/S display, C/F analysis, and period-based reporting (monthly, quarterly, annually).
- **Integrated Communication**: Gmail integration for managing incoming/outgoing emails and their status.
- **AI Console**:
    - **Three-layer AI Agent System**: SIGMA CORE (strategy, ROI, resource allocation), MIZUKI MANAGER (daily automation, KPI tracking, communication), NEURAL ENGINE (document, report, post, image generation).
    - **Enhanced AI Chat**: Persistent chat history, session-based conversation, context understanding, and automatic saving of important conversations to AI Memory.
    - **AI Image Generation**: DALL-E 3 API integration with quality settings, history, and gallery view.
    - **AI Document Generation**: Automated generation of reports, emails, proposals, and summaries with context, including download functionality.
    - **Content Management**: Centralized management of AI-generated images and documents with type-based filtering.
- **Marketing Features**: Campaign management (5 types, budget, goals, progress), social media post management (X, Instagram, Facebook, LinkedIn with scheduling and AI integration), SNS connection settings, and planned content calendar/analytics.
- **Workflow Management (★IMPLEMENTED)**: 可視化・マニュアル化・自動化を統合したワークフロー管理機能。React Flowを使用したビジュアルエディター、ステップ管理（開始、終了、タスク、承認、自動化、分岐）、マニュアル・手順書管理、担当者役割設定、所要時間見積もり、実行履歴追跡、監査ログ、CRM・財務・タスクとの統合準備。一覧ページ（/workflows）と編集・閲覧ページ（/workflows/:id/edit, /workflows/:id/view）実装済み。
- **KGI/KPI/KTF Analysis**: Comprehensive management of indicators, performance tracking, target setting, dependency mapping, bottleneck analysis, and performance snapshots.
- **Differentiation Strategy**: Competitive analysis with competitor profiles and SWOT analysis, market positioning canvases, differentiation factors with USP management, competitor comparison matrices, strategic initiatives tracking with progress monitoring, and KPI integration for impact measurement.
- **Recruitment Management (★IMPLEMENTED)**: INDEED連携準備機能。求人情報管理（職種名、勤務地、職務内容、雇用形態、給与範囲、ステータス管理）、応募者管理（連絡先、応募経路、選考ステータス、履歴書・面接メモ）、事業部門別フィルター、Indeed投稿用データエクスポート準備。
- **Employee Portal (★IMPLEMENTED)**: 従業員ポータル機能。プロフィール管理（個人情報、雇用情報、緊急連絡先）、銀行口座情報管理（銀行名、支店名、口座番号、口座種別）、給与情報表示（基本給、手当、控除、差引支給額、支払履歴）、通知管理（管理者による通知作成・配信、従業員による既読管理）、統合ダッシュボード（プロフィール、口座、最新通知の一元表示）。
- **MEMO機能 (★IMPLEMENTED)**: メモのCRUD操作、カテゴリ分類、タグ付け、ピン留め、アーカイブ、検索機能。ユーザー毎の完全分離、オーナーシップ検証により他ユーザーのメモを変更・削除不可。
- **ファイルストレージ (★IMPLEMENTED)**: Replitオブジェクトストレージ統合。ファイルアップロード（Uppy利用、最大50MB、複数ファイル対応）、ACLベースアクセス制御（public/private）、ファイル種別管理（ドキュメント、画像、音声、動画）、統合管理UI（/file-storage）。APIエンドポイント：プライベートオブジェクト提供（/objects/*、認証・ACL必須）、公開オブジェクト提供（/public-objects/*）、アップロードURL取得（/api/objects/upload）、ACL設定（/api/objects/confirm）。
- **決済管理 (★IMPLEMENTED)**: Stripe決済統合準備完了。APIエンドポイント：支払いインテント作成（/api/payments/create-intent）、支払い確認（/api/payments/confirm）、支払い履歴取得（/api/payments）。統合管理UI（/payments、支払い作成フォーム、履歴表示、ステータス管理）。APIキー設定待ち（STRIPE_SECRET_KEY、VITE_STRIPE_PUBLIC_KEY）。
- **外部サービス連携 (★PARTIAL)**: 18種類の外部サービス統合管理システム。データベーススキーマ完備（memos, integrationLogs, externalPayments, spreadsheetSyncs, externalMessages, socialMediaPosts, zoomMeetings, canvaDesigns, eSignatureDocuments, bankAccounts, bankTransactions, phoneCallLogs, smsMessages）。統合管理ページ実装済み（/integrations）。システム設定でAPIキー管理可能。Stripe SDK インストール済み。

### System Design Choices
The project utilizes a monorepo-like structure with distinct `client/`, `server/`, and `shared/` directories. The database schema is designed to support all features, including dedicated tables for AI functionalities, marketing, workflows, detailed financial tracking, and differentiation strategy management.

### Database Tables
The system includes 67+ tables organized into the following categories:
- **Core**: users, businesses, sessions
- **Tasks & Communication**: tasks, communications, kpis
- **AI**: ai_events, memory, chat_history, ai_generated_content
- **CRM**: customers, contacts, leads, deals, activities
- **Finance**: contracts, transactions, accounts, journal_entries, budgets, invoices, payments, expense_reports
- **Marketing**: campaigns, social_posts, social_connections
- **Workflows**: workflows, workflow_steps, workflow_connections, workflow_executions, workflow_execution_steps, workflow_logs, workflow_triggers, workflow_documents
- **KGI/KPI/KTF**: indicators, indicator_measurements, indicator_targets, indicator_dependencies, bottlenecks, performance_snapshots
- **Differentiation Strategy**: competitors, competitor_strengths, business_competitors, competitor_metrics, swot_profiles, positioning_canvases, differentiation_factors, competitor_comparisons, differentiation_initiatives, initiative_progress
- **Recruitment (★IMPLEMENTED)**: job_postings, applicants
- **Employee Portal (★IMPLEMENTED)**: employee_profiles, employee_bank_accounts, employee_salaries, notifications
- **Memo (★IMPLEMENTED)**: memos
- **External Integrations (★PARTIAL)**: integrationLogs, externalPayments, spreadsheetSyncs, externalMessages, socialMediaPosts, zoomMeetings, canvaDesigns, eSignatureDocuments, bankAccounts, bankTransactions, phoneCallLogs, smsMessages

## External Dependencies
- **AI Provider**: 
  - **Google Gemini** (@google/genai v1.5.1) - メインAIプロバイダー。チャット、文書生成、感情分析、要約機能に使用。モデル: gemini-2.0-flash-exp
  - **OpenAI** (via Replit AI Integrations) - DALL-E 3による画像生成専用
- **Email**: Gmail API (googleapis) for email integration.
- **Database**: PostgreSQL (Neon).
- **Authentication**: Replit Auth (OpenID Connect).
- **Object Storage**: Replit Object Storage（Google Cloud Storage）。バケット作成済み、環境変数設定済み（PUBLIC_OBJECT_SEARCH_PATHS、PRIVATE_OBJECT_DIR）。
- **File Upload**: Uppy v5.1.1（@uppy/core、@uppy/aws-s3、@uppy/dashboard、@uppy/react）インストール済み。
- **Payment**: Stripe SDK インストール済み（stripe, @stripe/react-stripe-js, @stripe/stripe-js）。APIキー設定待ち（STRIPE_SECRET_KEY、VITE_STRIPE_PUBLIC_KEY）。
- **Planned Integrations**: Square, CloudSign, LINE, Slack, Zoom, Canva, TikTok, X, ChatWork, 銀行連携、電話連携、iPhone同期、Googleスプレッドシート。