# SIN JAPAN MANAGER Ver2

## Overview

SIN JAPAN 業務管理システム - ロールベースアクセス制御を備えた包括的なビジネス管理アプリケーション

## Current Status: Production Ready

アプリケーションは完全に機能しており、以下の機能が実装されています：
- ロールベース認証（Admin, CEO, Manager, Staff, Agency, Client）
- 顧客管理（CRM）with 銀行情報
- チャット機能
- 通知システム（一括送信対応）
- 従業員管理（HR Hub）
- 代理店売上追跡
- タスク管理

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
│   └── storage.ts             # Database operations
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

## Configuration Notes

- Vite configured with `allowedHosts: true` for Replit proxy
- Express server binds to `0.0.0.0:3000`
- Frontend served on port 5000
- CORS enabled for development

## Recent Changes (2025-12-05)

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
