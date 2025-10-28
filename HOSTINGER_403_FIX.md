# Hostinger 403 Forbidden エラー対処ガイド

## 🚨 403エラーの原因と対処法

### **症状**
- ウェブサイトにアクセスすると「403 Forbidden」エラーが表示される
- 「You don't have permission to access this resource」メッセージが出る

### **主な原因**
1. ファイル/ディレクトリのパーミッション問題
2. インデックスファイル（index.html）が見つからない
3. .htaccess設定の問題
4. ディレクトリ構造の不一致
5. Node.jsアプリケーションが起動していない

---

## 🔧 **解決手順**

### **Step 1: ファイル構造を確認**

Hostingerでの正しいファイル構造：

```
/public_html/ (または /var/www/html/)
├── .htaccess              # 修正版を使用
├── dist/
│   ├── index.js          # Node.jsサーバー
│   └── public/
│       ├── index.html    # メインファイル
│       ├── assets/       # CSS, JS, 画像など
│       └── ...
├── package.json
├── node_modules/
└── ecosystem.config.js
```

### **Step 2: ファイルパーミッションを設定**

**FTPまたはHostingerファイルマネージャーで：**

```bash
# ディレクトリのパーミッション
chmod 755 /public_html/
chmod 755 /public_html/dist/
chmod 755 /public_html/dist/public/

# ファイルのパーミッション
chmod 644 /public_html/.htaccess
chmod 644 /public_html/dist/public/index.html
chmod 644 /public_html/dist/public/assets/*
chmod 755 /public_html/dist/index.js
```

**SSHアクセスがある場合：**

```bash
# プロジェクトディレクトリに移動
cd /public_html

# 一括でパーミッション設定
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 755 dist/index.js
```

### **Step 3: インデックスファイルの確認**

**A. 静的ファイルのみの場合：**

1. `dist/public/index.html` を `/public_html/` にコピー
2. `dist/public/assets/` を `/public_html/assets/` にコピー

```bash
# コピーコマンド例
cp dist/public/index.html ./
cp -r dist/public/assets ./
```

**B. フルスタック（Node.js + React）の場合：**

Node.jsアプリケーションが正常に起動している必要があります。

### **Step 4: .htaccess設定の確認**

更新された `.htaccess` ファイルを使用してください。

**静的ファイルのみの場合の.htaccess：**

```apache
RewriteEngine On

# Handle client-side routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
<IfModule mod_headers.c>
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
</IfModule>
```

### **Step 5: Node.jsアプリケーションの起動確認**

**PM2で起動：**

```bash
# PM2インストール
npm install -g pm2

# アプリケーション起動
pm2 start ecosystem.config.js --env production

# ステータス確認
pm2 status
pm2 logs sinjapan-manager
```

**手動起動：**

```bash
# 環境変数設定
export NODE_ENV=production
export PORT=3000

# アプリケーション起動
node dist/index.js
```

### **Step 6: Hostinger固有の設定**

**Hostingerコントロールパネルで：**

1. **Webサイト設定** → **Advanced** → **Error Pages**
   - 403エラーページを確認

2. **Node.js設定** （VPS/Cloud Hostingの場合）
   - Node.jsバージョンを確認（18以上推奨）
   - アプリケーションの起動コマンドを設定

3. **Apache設定**
   - `AllowOverride All` が有効か確認
   - `mod_rewrite` が有効か確認

---

## 🔍 **デバッグ方法**

### **1. エラーログの確認**

```bash
# Apacheエラーログ
tail -f /var/log/apache2/error.log

# Node.jsアプリログ
pm2 logs sinjapan-manager

# Hostingerエラーログ（コントロールパネルで確認）
```

### **2. ファイル存在確認**

```bash
# 重要ファイルの存在確認
ls -la /public_html/
ls -la /public_html/dist/public/
ls -la /public_html/dist/public/index.html
```

### **3. パーミッション確認**

```bash
# パーミッション詳細表示
ls -la /public_html/
ls -la /public_html/dist/public/
```

---

## 🚀 **シナリオ別対処法**

### **シナリオ 1: 静的サイトとして配信**

```bash
# 1. ビルドファイルをルートにコピー
cp dist/public/* /public_html/

# 2. 簡単な.htaccess作成
echo "DirectoryIndex index.html" > /public_html/.htaccess
echo "RewriteEngine On" >> /public_html/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-f" >> /public_html/.htaccess
echo "RewriteCond %{REQUEST_FILENAME} !-d" >> /public_html/.htaccess
echo "RewriteRule . /index.html [L]" >> /public_html/.htaccess

# 3. パーミッション設定
chmod 644 /public_html/.htaccess
chmod 644 /public_html/index.html
```

### **シナリオ 2: フルスタックアプリケーション**

```bash
# 1. Node.jsアプリケーション起動
pm2 start ecosystem.config.js --env production

# 2. プロキシ設定の.htaccess使用
# (既に更新済みの.htaccessを使用)

# 3. ヘルスチェック
curl http://localhost:3000/api/health
```

---

## ✅ **最終チェックリスト**

- [ ] ファイルパーミッションが正しく設定されている
- [ ] `index.html` ファイルが存在し、アクセス可能
- [ ] `.htaccess` ファイルが適切に設定されている
- [ ] Node.jsアプリケーションが起動している（フルスタックの場合）
- [ ] Hostingerの設定が正しい
- [ ] エラーログにエラーが出ていない
- [ ] ブラウザのキャッシュをクリアしている

---

## 📞 **サポート情報**

**まだ解決しない場合：**

1. Hostingerサポートに連絡
2. エラーログの内容を確認
3. 段階的に設定を簡素化して原因を特定

**緊急対応：**
静的ファイルのみでの配信に切り替える場合は、シナリオ1の手順を実行してください。
