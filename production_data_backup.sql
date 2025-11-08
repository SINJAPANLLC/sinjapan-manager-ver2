-- ==========================================
-- SIN JAPAN MANAGER 本番環境用データ
-- 事業部門（Businesses）データバックアップ
-- 作成日: 2025-10-22
-- ==========================================

-- 事業部門データの投入
INSERT INTO businesses (id, name, name_ja, description, status, revenue, expenses, profit, manager_id, created_at, updated_at) VALUES
('126aa47a-e208-45fa-8691-68864fa57388', 'SIN JAPAN 軽貨物', 'SIN JAPAN 軽貨物', '金融　車両　投資', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:47:04.139731', '2025-10-21 09:56:05.355'),
('89598da1-212e-477a-b6eb-6df318c46b48', 'SIN JAPAN 一般貨物', 'SIN JAPAN 一般貨物', NULL, 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:47:18.596432', '2025-10-21 09:47:18.596432'),
('7b57d0f9-c8f1-4cb8-a18e-996de6ab657d', 'SIN JAPAN 人材紹介', 'SIN JAPAN 人材紹介', 'プラットフォーム拡張', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:48:05.651256', '2025-10-21 09:54:48.956'),
('2d437e29-0220-4fe9-8dd4-a766df72bee7', 'SIN JAPAN ライブ', 'SIN JAPAN ライブ', 'マーケティング拡張
プラットフォーム拡張', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:48:22.191003', '2025-10-21 09:54:38.657'),
('05b24add-fa29-4487-817f-7aad52971432', 'SIN JAPAN LOGI MATCH', 'SIN JAPAN LOGI MATCH', 'フードデリバリー拡張', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:49:17.830427', '2025-10-21 09:51:46.632'),
('00a72b21-b395-43f7-a7e3-222d7a1a908f', 'SIN JAPAN SCHOOL', 'SIN JAPAN SCHOOL', 'ONLINE WORK拡張　副業クラウド', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:50:12.189551', '2025-10-21 10:02:46.556'),
('4d705bef-a6e7-4ec1-a3cc-fb7bcc9ac0e0', 'Only U', 'Only U', 'Only Match拡張
SIN JAPAN KANAGAWA', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:50:29.073415', '2025-10-21 09:57:20.73'),
('b1602512-e805-4f25-a19a-786d00c751fa', 'SIN JAPAN POKER', 'SIN JAPAN POKER', 'LIBERIA', 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:53:17.916819', '2025-10-21 09:53:17.916819'),
('b104d2ec-b94e-4ed3-8ad4-0070321cc1ff', 'SIN JAPAN SYSTEM', 'SIN JAPAN SYSTEM', NULL, 'active', 0.00, 0.00, 0.00, NULL, '2025-10-21 09:55:26.599387', '2025-10-21 09:55:26.599387')
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 事業部門一覧（9部門）
-- ==========================================
-- 1. SIN JAPAN 軽貨物（金融　車両　投資）
-- 2. SIN JAPAN 一般貨物
-- 3. SIN JAPAN 人材紹介（プラットフォーム拡張）
-- 4. SIN JAPAN ライブ（マーケティング拡張、プラットフォーム拡張）
-- 5. SIN JAPAN LOGI MATCH（フードデリバリー拡張）
-- 6. SIN JAPAN SCHOOL（ONLINE WORK拡張　副業クラウド）
-- 7. Only U（Only Match拡張、SIN JAPAN KANAGAWA）
-- 8. SIN JAPAN POKER（LIBERIA）
-- 9. SIN JAPAN SYSTEM
-- ==========================================
