# SIN JAPAN MANAGER Ver2

## Overview

SIN JAPAN 業務管理システム - ロールベースアクセス制御を備えた包括的なビジネス管理アプリケーション

## Current Status: Multi-tenant Architecture Complete

アプリケーションは完全に機能しており、マルチテナント対応が完了：
- ロールベース認証（Admin, CEO, Manager, Staff, Agency, Client）
- 顧客管理（CRM）with 銀行情報
- チャット機能（ファイル添付対応）
- 通知システム（一括送信対応）
- 従業員管理（HR Hub）
- 代理店売上追跡
- タスク管理（AI生成対応）
- 事業管理（売上/経費の都度追加）
- カレンダー（メモ機能）
- AI機能ページ（画像/動画/SEO記事/音声/リスト/書類生成、AIチャット）

### Multi-tenant Architecture (Complete)
- サブドメインベースのテナント分離（lvr.sinjapan-manager.com等）
- 各テナントのブランディング対応（ロゴ、名前、カラー）
- テナントストレージラッパーによるデータ分離
- ユーザー作成時のcompanyId自動設定
- VPS + Nginx + ワイルドカードSSL証明書対応
- テナント別Square決済設定対応
- AI機能のテナント分離（ログ、会話履歴、ナレッジベース）

## Architecture

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with blue gradient theme
- **State Management**: TanStack Query
- **Routing**: Wouter
- **Port**: 5000 (Replit proxy compatible)

### Backend
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL (Neon) via Drizzle ORM
- **Authentication**: Session-based with bcrypt
- **Port**: 3000

### Security
- Server-side role-based authorization on all routes
- Staff ownership validation for customer data
- Session management with memory store
- Password hashing with bcrypt

## File Structure

```
.
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/        # UI Components
│   │   │   └── layout.tsx     # Main layout with sidebar
│   │   ├── hooks/
│   │   │   └── use-auth.tsx   # Authentication hook
│   │   ├── lib/
│   │   │   └── utils.ts       # Utility functions
│   │   ├── pages/             # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── customers.tsx
│   │   │   ├── tasks.tsx
│   │   │   ├── chat.tsx
│   │   │   ├── notifications.tsx
│   │   │   ├── users.tsx
│   │   │   ├── employees.tsx
│   │   │   ├── agency-sales.tsx
│   │   │   └── settings.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/                    # Express Backend
│   ├── index.ts               # Server entry point
│   ├── routes.ts              # API routes with authorization
│   ├── storage.ts             # Database operations
│   ├── tenant.ts              # Tenant middleware
│   └── tenant-storage.ts      # Tenant-scoped storage wrapper
├── shared/
│   └── schema.ts              # Drizzle ORM schema
├── drizzle.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── replit.md
```

## Database Schema

| Table | Purpose |
|-------|---------|
| users | User accounts with roles |
| customers | CRM with bank info |
| tasks | Task management |
| notifications | System notifications |
| chat_messages | Real-time messaging |
| employees | HR management |
| agency_sales | Sales tracking |
| businesses | Business management |
| business_sales | Business revenue/expense records |
| memos | Calendar memos |
| ai_logs | AI usage logs |
| ai_conversations | AI conversation memory |
| ai_knowledge | AI knowledge base |
| client_projects | Client project management |
| client_invoices | Client invoices |

## Role Permissions

| Role | Access |
|------|--------|
| admin/ceo | Full access to all features |
| manager | Customers, tasks, employees, users, chat, notifications |
| staff | Own customers, tasks, chat, notifications |
| agency | Sales, customers, chat, notifications |
| client | Documents, chat, notifications |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | test123 |
| Staff | staff@test.com | test123 |
| Agency | agency@test.com | test123 |
| Client | client@test.com | test123 |

## Development Commands

```bash
# Start development server
npm run dev

# Database push (sync schema)
npm run db:push

# Production build
npm run build

# Production start
npm start
```

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string (provided by Replit)
- `SESSION_SECRET` - Auto-generated on first run

Optional (for AI features):
- `MODELSLAB_API_KEY` - MODELSLAB API key for image/video/voice generation

## Configuration Notes

- Vite configured with `allowedHosts: true` for Replit proxy
- Express server binds to `0.0.0.0:3000`
- Frontend served on port 5000
- CORS enabled for development

## Recent Changes (2025-12-20)

### ワークフロータブに図面機能追加
- **ワークフロー図**: タスクのステータス別フロー図（開始→未着手→進行中→完了→終了）
- **組織図**: スタッフの階層構造を視覚化（会社→Admin/CEO→Manager→Staff/Agency）
- React Flowライブラリを使用した対話的なダイアグラム
- ズーム・パン機能付き
- ワークフロータブ選択時に左側にカンバン、右側に図面を表示
- **編集機能**: ノードのドラッグ移動、ダブルクリックで編集、ノード追加/削除、接続線の作成
- **PDF出力**: 図面をPDFとしてダウンロード可能（html2canvas + jsPDF使用）
- **リセット機能**: 編集した図面を初期状態に戻す

### スタッフ管理機能の拡張
- **給料管理（給料タブ）**: 月別給料記録（基本給、残業代、賞与、控除、支給額）
- **シフト管理（シフトタブ）**: 日付、勤務時間、休憩時間、労働時間の記録
- **前払い申請（前払い申請タブ）**: 申請金額・理由、承認ワークフロー対応
- 新規データベーステーブル: staff_salaries, staff_shifts, advance_payments
- Manager以上の権限で前払い申請の承認・却下・支払い処理

## Previous Changes (2025-12-07)

### バグ修正
- **事業削除機能**: 外部キー制約エラーを修正。削除前に関連テーブル（contracts, budgets, campaigns等50+テーブル）のレコードを先に削除
- **会社削除機能**: 会社IDがUUID型なのにintegerとして処理していた問題を修正
- **ダッシュボード売上表示**: 全期間の合計ではなく、当月の売上/経費のみを表示するように変更（毎月1日にリセット）
- **孤立データのクリーンアップ**: 削除された事業に紐づくbusiness_salesレコードを削除

### Square決済連携
- Square SDK（v40+）を使用してAPI連携
- 設定ページの決済管理タブでSquare接続状態を表示
- 店舗情報（ロケーション）の取得・表示
- **決済リンク作成機能**: 商品名、金額、説明を入力してURLを生成
- 顧客管理、決済履歴、請求書のAPIエンドポイント追加
- 環境切り替え対応（SQUARE_ENVIRONMENT: sandbox/production）
- 必要な環境変数: SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID

### 設定ページのユーザー管理機能
- 設定ページに「ユーザー管理」タブを追加（admin/ceoのみ表示）
- ユーザー一覧の表示（名前、メール、ロール、部署、役職）
- ユーザーの追加・編集・削除機能
- ロール別アクセス権限の説明パネル
- 会社情報保存のバグ修正（capital/establishedDateの空文字列対応）
- 投資記録の空businessId対応

### 投資記録機能（C/Fタブ）
- investmentsテーブルを追加（事業との連携、投資種類、カテゴリ、金額、説明、日付）
- C/Fタブに「投資を記録」ボタンを追加
- 投資記録フォーム（事業選択、投資種類、カテゴリ、金額、説明、日付）
- 投資記録一覧の表示・削除機能
- キャッシュフロー計算書に投資活動CFを反映
- 投資CFが営業CFから差し引かれて最終キャッシュ増減額を計算

## Previous Changes (2025-12-07)

### SEO記事管理の高度な機能追加
- **カテゴリ管理**: 記事をカテゴリで分類・管理
  - seo_categoriesテーブル追加
  - 記事にcategoryId連携
- **一括記事生成**: トピックリストから複数記事を自動生成（1日10〜30記事推奨）
  - 進捗表示付きの一括生成UI
  - カテゴリ指定可能
- **内部リンク自動生成AI**: 記事編集時に関連記事へのリンクを自動挿入
  - OpenAI APIで関連性を分析
  - 自然な文脈でリンクを追加
- **インデックス監視ダッシュボード**: SEOパフォーマンスの可視化
  - 総記事数、公開数、インデックス送信済み数
  - インデックス率（目標50%以上）の監視
  - 未インデックス記事のリスト表示

### Previous Changes (2025-12-06)

#### AI機能ページの追加
- AIテキスト会話（OpenAI GPT-4o-mini）
- 画像生成（MODELSLAB API）
- 動画生成（MODELSLAB API）
- SEO記事生成（OpenAI）
- 音声生成（MODELSLAB API）
- リスト生成（OpenAI）
- 書類生成（契約書、提案書、請求書、報告書、メール、議事録）
- AI利用ログ機能
- AI自動化（Coming Soon）
- 音声会話（Coming Soon）

#### 事業管理の売上/経費記録機能
- business_salesテーブル追加
- 売上・経費を都度追加可能
- 履歴の表示・削除機能
- 総売上・総経費・利益の自動計算

## Previous Changes (2025-12-05)

### Design Overhaul - Refined White-based Theme with Blue Gradient Accents
- Updated Tailwind configuration with custom design tokens, colors, and animations
- Enhanced global CSS with refined component classes (glass-card, btn-primary, btn-secondary, etc.)
- Redesigned layout with cleaner white-based sidebar and blue gradient accents
- Updated all pages with consistent styling:
  - Rounded-2xl/3xl cards with shadow-soft effects
  - Blue gradient buttons and hover states
  - Improved visual hierarchy and spacing
  - Smooth animations (fade-in, slide-up)
- Custom scrollbar styling
- Glass-morphism effects for cards and modals

### Previous Updates (2025-01-05)
- Fixed wouter Link component nesting issues (removed nested `<a>` tags)
- Implemented server-side role-based authorization on all CRUD routes
- Added staff ownership validation for customer access
- Added user deletion cascade/nullify across related tables
- Resolved all console errors

## Design System

### Colors
- Primary: Blue (#0070f3) with gradient variations
- Background: White with subtle blue gradient accents
- Text: Slate color scale for hierarchy

### Components
- `.btn-primary` - Blue gradient button with hover shadow
- `.btn-secondary` - White button with blue border
- `.input-field` - Rounded input with focus ring
- `.card` - White card with soft shadow
- `.stat-card` - Statistics card with hover effects
- `.badge` - Status badges (success, warning, info)
- `.glass-card` - Frosted glass effect card
