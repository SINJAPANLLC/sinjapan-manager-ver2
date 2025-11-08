# SIN JAPAN MANAGER - デザインガイドライン

## デザインアプローチ

**選択アプローチ**: カスタムデザインシステム（Material Design + Linear の影響）  
**理由**: エンタープライズ級の管理システムとして、データの視認性と操作効率を最優先しつつ、AIコラボレーションの未来的な雰囲気を表現

---

## カラーパレット

### ライトモード
- **Primary**: 220 100% 55% (Vivid Blue)
- **Primary Hover**: 220 100% 60%
- **Background**: 0 0% 100% (White)
- **Surface**: 0 0% 98%
- **Border**: 0 0% 90%
- **Text Primary**: 0 0% 13%
- **Text Secondary**: 0 0% 45%
- **Success**: 142 76% 36%
- **Warning**: 38 92% 50%
- **Danger**: 0 84% 60%
- **Gradient Blue**: 220° → 200° → 190° (Blue to Cyan)
- **Gradient Purple**: 250° → 220° → 200° (Purple to Blue)

### ダークモード
- **Primary**: 220 100% 60%
- **Primary Hover**: 220 100% 65%
- **Background**: 0 0% 9%
- **Surface**: 0 0% 12%
- **Border**: 0 0% 20%
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 0 0% 65%
- **Gradient Blue Dark**: 220° → 200° → 250° (Enhanced for dark mode)

---

## タイポグラフィ

### フォントファミリー
- **英数字**: Inter (Google Fonts)
- **日本語**: Noto Sans JP (Google Fonts)
- **モノスペース**: JetBrains Mono (コード/データ表示用)

### スケール
- **H1 (ページタイトル)**: 2rem (32px), font-weight: 700
- **H2 (セクション)**: 1.5rem (24px), font-weight: 600
- **H3 (カード見出し)**: 1.25rem (20px), font-weight: 600
- **Body Large**: 1rem (16px), font-weight: 400
- **Body**: 0.875rem (14px), font-weight: 400
- **Small**: 0.75rem (12px), font-weight: 400
- **Data/Numbers**: 1.125rem (18px), font-weight: 600, JetBrains Mono

---

## レイアウトシステム

### スペーシング
主要なTailwindユニット: **2, 3, 4, 6, 8, 12, 16**
- カード内パディング: p-6
- セクション間マージン: mb-8
- コンポーネント間ギャップ: gap-4
- ページコンテナ: px-8 py-6

### グリッドレイアウト
- **ダッシュボード**: 12カラムグリッド
- **KPIカード**: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **ビジネスモジュール**: grid-cols-1 lg:grid-cols-3
- **最大幅**: max-w-screen-2xl (1536px)

---

## コンポーネントライブラリ

### ナビゲーション

**左サイドバー**
- 幅: 280px (展開時), 64px (折りたたみ時)
- 背景: surface color
- 各ビジネスモジュールをアイコン+ラベルで表示
- アクティブ状態: primary colorの左ボーダー (4px)
- ホバー: 背景を微かに明るく

**トップAIコンソールバー**
- 高さ: 64px
- 背景: 青のグラデーション (bg-gradient-blue) + 紫のオーバーレイ (bg-gradient-purple 30% opacity)
- アニメーション: 2層グラデーションアニメーション（通常速度 + 高速）
- AI状態インジケーター（SIGMA/MIZUKI/NEURAL）を右側に配置
- ステータスバッジ: グロー効果付き（稼働中=緑、処理中=黄+パルス、待機=灰）
- リアルタイム通知バッジ

### カード

**標準カード**
- 背景: surface color
- ボーダー: 1px solid border color
- 角丸: rounded-lg (8px)
- シャドウ: shadow-sm, ホバー時 shadow-md
- パディング: p-6

**KPIカード**
- ヘッダー: アイコン + ラベル（small, text-secondary）
- メトリクス値: 大きく（2xl, font-bold, JetBrains Mono）
- 変化率: 色付き矢印 + パーセンテージ（success/danger color）
- スパークライン（オプション）: 小さなチャート表示

**AIアクションカード**
- アイコン: 左側に AI エージェントのシンボル
- アクション内容: 太字でハイライト
- タイムスタンプ: 右上（small, text-secondary）
- 結果ステータス: 色付きバッジ（成功/進行中/失敗）

### フォーム

**入力フィールド**
- 高さ: h-10 (40px)
- ボーダー: 1px, focus時 primary color + ring
- 背景: ライトモードで白、ダークモードで surface + 5% lighter
- パディング: px-3 py-2
- プレースホルダー: text-secondary, italic

**ボタン**
- Primary: primary color背景, white text, h-10, px-6, rounded-md
- Secondary: border + text が primary color, 背景透明
- Ghost: テキストのみ、ホバー時に背景表示
- Danger: danger color背景

### データ表示

**テーブル**
- ヘッダー: 背景 surface, 太字, 小さめテキスト
- 行: ホバー時に背景を微かに変化
- ボーダー: 水平線のみ（vertical なし）
- ページネーション: 下部中央

**チャート**
- プライマリライン/バー: primary color
- セカンダリ: グレースケール
- グリッド: 薄いボーダーcolor
- ツールチップ: surfaceカード + shadow-lg

### モーダル/オーバーレイ

**モーダル**
- 背景オーバーレイ: black opacity 40%
- カード: max-w-2xl, rounded-xl, shadow-2xl
- ヘッダー: primary colorの薄い背景 + 閉じるボタン
- パディング: p-8

**通知トースト**
- 右上に表示
- 4秒後に自動消去
- アイコン + メッセージ + 閉じるボタン
- タイプ別色分け（success/warning/danger/info）

---

## 特殊コンポーネント

### AIコンソールチャット
- 右側パネル: w-96, スライドイン
- メッセージ: 左（AI）/ 右（ユーザー）の吹き出し
- AI応答: primary colorの薄い背景
- 入力欄: 下部固定、送信ボタン付き

### 財務ダッシュボード（PL/BS/CF）
- 3カラムレイアウト（各財務諸表）
- カード形式で数値表示
- 折りたたみ可能な詳細セクション
- 月次/四半期/年次の切り替えタブ

### タスク分類ビジュアル
- 4象限グリッド: Sales / Org / Risk / Expand
- 各象限に色分け（primary colorのバリエーション）
- タスクカードをドラッグ&ドロップ可能
- カウントバッジ表示

---

## アニメーション

### グラデーションアニメーション
- **gradient-shift**: 背景グラデーションの移動アニメーション (8秒、無限ループ)
- **gradient-shift-fast**: 高速グラデーション移動 (4秒、無限ループ)
- **gradient-rotate**: 色相回転アニメーション (10秒、無限ループ)
- **pulse-glow**: パルスグロー効果 (3秒、無限ループ、青い光沢)
- **shimmer**: シマー効果 (2秒、無限ループ、光沢反射)

### インタラクティブアニメーション
- ページ遷移: fadeIn (200ms)
- カードホバー: transform scale(1.05), shadow-xl変化 (300ms)
- アイコンホバー: scale(1.1) (トランジション)
- ボタンホバー: グラデーションオーバーレイ、scale(1.05)
- サイドバー展開/折りたたみ: width変化 (300ms ease-in-out)
- データ更新時: subtle pulse (1回のみ)

### 特殊効果
- **Glass Morphism**: backdrop-filter blur(10px), 半透明背景
- **Gradient Text**: グラデーションテキスト効果（青→水色→緑青）
- **Badge Glow**: ステータスバッジに応じたグロー効果（緑/黄/灰）

---

## アイコン

**ライブラリ**: Heroicons (outline/solid)
- ナビゲーション: outline版
- ボタン内: solid版
- ステータス: solid版 (check-circle, x-circle, exclamation-triangle)

---

## 特記事項

1. **レスポンシブ**: モバイルでは左サイドバーをドロワーに変換
2. **ダークモード**: システム設定に従うが、ユーザーが手動切り替え可能
3. **データ密度**: 情報過多を避けつつ、必要なデータを1画面に集約
4. **AI可視性**: AIの動作状態を常に可視化（トップバー + 専用パネル）
5. **日本語最適化**: 行間を適切に設定（leading-relaxed for body text）