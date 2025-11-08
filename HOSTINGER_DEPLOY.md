# Hostingerへのデプロイ手順書

## 前提条件

- Hostinger VPS または Cloud Hosting プラン（Node.jsサポート必須）
- Node.js 18以上がインストール済み
- データベース（Neon PostgreSQL推奨）
- 必要なAPIキー（Google Cloud、Stripe、Gemini AI等）

## デプロイ手順

### 1. Hostingerでのサーバー準備

1. **Hostingerコントロールパネル**にログイン
2. **VPS**または**Cloud Hosting**でNode.jsアプリケーションを作成
3. **SSH接続**または**File Manager**でサーバーにアクセス

### 2. ファイルのアップロード

#### 方法A: Git経由（推奨）
```bash
# サーバーにSSH接続後
cd /var/www/html  # または適切なディレクトリ
git clone https://github.com/SINJAPANLLC/sinjapan-manager-ver2.git
cd sinjapan-manager-ver2
```

#### 方法B: FTP/SFTP経由
- `dist/`フォルダの内容をアップロード
- `package.json`をアップロード
- `node_modules`は後でインストール

### 3. 依存関係のインストール

```bash
# Node.jsの依存関係をインストール
npm install --production

# または開発者依存関係も含める場合
npm install
```

### 4. 環境変数の設定

#### 方法A: .envファイルの作成
```bash
# env.example.hostingerをコピーして編集
cp env.example.hostinger .env
nano .env  # または vi .env
```

#### 方法B: Hostingerコントロールパネル
1. **Environment Variables**セクションに移動
2. 以下の変数を設定：

```
NODE_ENV=production
PORT=3000
DATABASE_URL=your-database-url
SESSION_SECRET=your-session-secret
GEMINI_API_KEY=your-gemini-key
STRIPE_SECRET_KEY=your-stripe-key
# ... その他の環境変数
```

### 5. データベースの設定

```bash
# Drizzleマイグレーションの実行
npm run db:push
```

### 6. アプリケーションのビルド（必要に応じて）

```bash
# 本番環境用ビルドが必要な場合
npm run build
```

### 7. アプリケーションの起動

#### 開発環境での確認
```bash
npm start
```

#### プロダクション環境での起動（PM2推奨）
```bash
# PM2をグローバルインストール
npm install -g pm2

# アプリケーションを起動
pm2 start dist/index.js --name "sinjapan-manager"

# 自動起動設定
pm2 startup
pm2 save
```

### 8. リバースプロキシの設定（Apache/Nginx）

#### Apache設定 (.htaccess)
```apache
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P]
RewriteRule ^(?!api)(.*)$ /public/$1 [L]
```

#### Nginx設定
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location / {
        try_files $uri $uri/ @node;
    }
    
    location @node {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## トラブルシューティング

### 1. ポートエラー
- Hostingerで使用可能なポートを確認
- 環境変数`PORT`が正しく設定されているか確認

### 2. データベース接続エラー
- `DATABASE_URL`が正しいか確認
- データベースが外部接続を許可しているか確認

### 3. ファイルアップロードエラー
- Google Cloud Storageの認証情報が正しいか確認
- バケットの権限設定を確認

### 4. 静的ファイル配信エラー
- `dist/public`フォルダが存在するか確認
- Webサーバーの設定を確認

## セキュリティ設定

1. **SSL/TLS証明書**の設定
2. **ファイアウォール**の設定
3. **環境変数**の適切な管理
4. **定期的なバックアップ**の設定

## 監視とメンテナンス

1. **ログ監視**: `pm2 logs`
2. **プロセス監視**: `pm2 monit`
3. **自動再起動**: PM2の設定
4. **定期的な更新**: `git pull && npm install && pm2 restart all`

## 本番環境の確認項目

- [ ] アプリケーションが正常に起動している
- [ ] データベース接続が正常
- [ ] API エンドポイントが応答している
- [ ] 静的ファイルが配信されている
- [ ] SSL証明書が有効
- [ ] 環境変数が正しく設定されている
- [ ] ログが正常に出力されている

## サポート

問題が発生した場合は、以下を確認してください：

1. サーバーのログ: `pm2 logs`
2. アプリケーションのログ
3. Webサーバーのログ
4. データベースの接続状況

詳細なサポートが必要な場合は、Hostingerのサポートまたは開発チームにお問い合わせください。
