# SIN-JAPAN-MANAGER-Ver2

## Project Status

このプロジェクトは、GitHubから「デプロイ設定ファイルのみ」をインポートしたため、実際のアプリケーションコードが含まれていませんでした。

開発画面を表示できるよう、最小限の動作確認用フルスタックアプリケーションを作成しました。

## 現在の構成

### フロントエンド
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Port**: 5000 (Replitプロキシ対応済み)
- **Location**: `client/` ディレクトリ

### バックエンド
- **Framework**: Express.js + TypeScript
- **Port**: 3000 (環境変数PORTで変更可能)
- **Host**: 0.0.0.0 (Replit環境対応済み)
- **Location**: `server/` ディレクトリ
- **API Endpoint**: `/api/health` - ヘルスチェック用

### 開発環境
- **Node.js**: v20
- **Package Manager**: npm
- **Dev Workflow**: `npm run dev` (フロントエンドとバックエンドを同時起動)
- **ポート設定**: フロントエンド(5000) + バックエンド(3000)

## ファイル構造

```
.
├── client/              # React フロントエンド
│   ├── src/
│   │   ├── App.tsx     # メインアプリコンポーネント
│   │   ├── main.tsx    # エントリーポイント
│   │   └── index.css   # スタイル
│   └── index.html      # HTMLテンプレート
├── server/              # Express バックエンド
│   └── index.ts        # サーバーエントリーポイント
├── vite.config.ts      # Vite設定 (プロキシ含む)
├── tsconfig.json       # TypeScript設定
├── package.json        # 依存関係
└── replit.md           # このファイル
```

## 重要な注意事項

⚠️ **このアプリケーションは最小限の動作確認用です**

元のGitHubリポジトリには以下のファイルのみが含まれていました：
- `package.json` - 依存関係のリスト（Stripe、Google Cloud Storage、Drizzle ORM等を含む完全な設定）
- `.htaccess` - Hostinger用Apache設定
- `setup-hostinger.sh` - Hostingerデプロイスクリプト
- `HOSTINGER_403_FIX.md` - トラブルシューティングガイド

実際のアプリケーションコード（データベーススキーマ、認証ロジック、UIコンポーネント等）は**含まれていません**。

## 完全なアプリケーションを実行するには

以下のいずれかの対応が必要です：

1. **実際のソースコードを含むリポジトリをインポート**
   - 正しいブランチまたはリポジトリからコードを取得

2. **既存の依存関係を使用して再構築**
   - `package.json`に記載された完全な依存関係リストを参照
   - Stripe、Google Cloud Storage、PostgreSQL (Neon)、Drizzle ORM等の設定が含まれています

3. **別の場所からソースコードを取得**

## 開発コマンド

```bash
# 開発サーバー起動（フロントエンド + バックエンド）
npm run dev

# フロントエンドのみ起動
npm run dev:client

# バックエンドのみ起動
npm run dev:server

# プロダクションビルド
npm run build

# プロダクション起動
npm start
```

## 環境変数

現在、環境変数は不要です。完全なアプリケーションには以下が必要になる可能性があります：
- `DATABASE_URL` - PostgreSQL接続文字列
- `STRIPE_SECRET_KEY` - Stripe決済
- `GOOGLE_CLOUD_STORAGE_CREDENTIALS` - GCS認証
- その他、package.jsonに記載されたサービス用のAPI キー

## Replit設定

- ✅ Vite設定: `0.0.0.0:5000`、全ホスト許可済み
- ✅ Expressサーバー: `0.0.0.0:3000`、プロキシ経由でアクセス可能
- ✅ ワークフロー: `dev`（ポート5000でwebview表示）
- ✅ TypeScript: JSX変換設定済み

## 本番環境（VPS）

- **ホスティング**: Hostinger VPS
- **IPアドレス**: 212.85.24.206
- **プロセス管理**: PM2 (`sinjapan-manager`)
- **GitHub**: https://github.com/SINJAPANLLC/sinjapan-manager-ver2
- **データベース**: Replit PostgreSQL（Neon）

### デプロイ手順
```bash
ssh root@212.85.24.206
cd /path/to/project  # ディレクトリ確認後更新
git pull origin main
npm install
npm run build
pm2 restart sinjapan-manager
```

## 次のステップ

1. 実際のアプリケーションソースコードを取得
2. 必要な環境変数とシークレットを設定
3. データベースマイグレーションを実行
4. 完全なアプリケーション機能を実装
