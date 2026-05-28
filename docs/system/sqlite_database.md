# Ultraviolet AI Chat — バックエンド SQLite データベース仕様 (Backend SQLite Database Specification)

本ドキュメントでは、バックエンド（Hono サーバー）の永続化ストレージである SQLite データベース（`app.db`）の設計、テーブル定義、リレーションシップ、およびマルチユーザーデータ分離の仕組みについて詳細に説明します。

---

## 1. データベースの概要

アプリケーション全体の永続化データは、Node.js 標準の `node:sqlite` モジュールを使用して、プロジェクトルート直下の `app.db` ファイルに保存されます。

* **データベースファイルパス**: `<project-root>/app.db`
* **機能特徴**:
  - `PRAGMA foreign_keys = ON;` を有効にし、テーブル間の参照整合性を保持。
  - 起動時に必要なテーブルが存在しない場合、自動的にテーブルの作成（`CREATE TABLE IF NOT EXISTS`）およびデフォルトデータ（管理者、一般ユーザー）のインサート処理（シーディング）を実行。
  - スキーマ変更時（後方互換カラム追加）の例外処理によるエラー回避ロジックを搭載。

---

## 2. テーブル定義 (Table Definitions)

### ① `users` テーブル
認証ユーザー（本当のユーザー名: Identity）の認証情報とシステム権限ロールを管理します。

| カラム名 | データ型 | キー・制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `username` | `TEXT` | `PRIMARY KEY` | 認証用の一意なユーザー名（例: `"admin"`, `"user1"`） |
| `password` | `TEXT` | `NOT NULL` | SHA-256 でハッシュ化されたパスワード文字列 |
| `role` | `TEXT` | `NOT NULL DEFAULT 'user'` | システム権限。（`"admin"` または `"user"`） |
| `avatar` | `TEXT` | - | ユーザーのデフォルトアバター絵文字（例: `"👑"`, `"👤"`） |

---

### ② `memos` テーブル
共有または個人用のユーザーメモ本体を保持します。マルチユーザー分離用の `owner` カラムを持ちます。

| カラム名 | データ型 | キー・制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | メモの一意なID。（プレフィックス `memo-` ＋タイムスタンプ等） |
| `title` | `TEXT` | `NOT NULL` | メモのタイトル。 |
| `content` | `TEXT` | `NOT NULL` | マークダウン形式のメモ本文。 |
| `creator` | `TEXT` | - | メモを作成したペルソナ名（表示上の作成者名）。 |
| `updater` | `TEXT` | - | 最後にメモを更新したペルソナ名（表示上の更新者名）。 |
| `owner` | `TEXT` | - | メモを所有する認証ユーザーの `username` (Identity) |

---

### ③ `memo_audiences` テーブル
各メモの「公開対象ペルソナ（ターゲットオーディエンス）」を格納する多対多の中間テーブルです。

| カラム名 | データ型 | キー・制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `memo_id` | `TEXT` | `PRIMARY KEY (複合)` / `FOREIGN KEY` | `memos.id` に対する外部キー参照。（`ON DELETE CASCADE`） |
| `username` | `TEXT` | `PRIMARY KEY (複合)` | メモの公開対象（表示名/ペルソナ名）。 |

---

### ④ `agents` テーブル
ユーザーが作成したカスタムエージェントの設定（システムプロンプトやアバター絵文字）を管理します。

| カラム名 | データ型 | キー・制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | カスタムエージェントの一意なID。 |
| `name` | `TEXT` | `NOT NULL` | エージェントの表示名。 |
| `systemPrompt`| `TEXT` | `NOT NULL` | AI に適用する独自の役割定義・命令プロンプト。 |
| `avatar` | `TEXT` | - | エージェントのアバター絵文字。（デフォルト: `"🤖"`） |
| `owner` | `TEXT` | - | エージェントを所有する認証ユーザーの `username` (Identity) |

---

## 3. マルチユーザーデータ分離とアクセス制御

認証ユーザーごとの安全なデータアクセスを保証するため、データベースの読み書き処理において以下のクエリによるフィルタリングとオーナー紐付けが徹底されています。

* **グローバルリソースと個人リソースの混在解決**:
  `owner IS NULL` であるリソース（初期リソースや共通設定など）と、`owner = ?` であるリソース（ログインユーザー本人が作成したリソース）の両方を読み込めるようにするため、データ取得時は以下の条件指定を行います。
  ```sql
  SELECT * FROM memos WHERE owner IS NULL OR owner = ?
  ```
  ```sql
  SELECT * FROM agents WHERE owner IS NULL OR owner = ?
  ```
* **新規保存時のオーナー紐付け**:
  データ保存（`saveMemo` / `saveAgent`）の実行時、リクエストヘッダー `X-User-Identity` から抽出したログインユーザー名を `owner` カラムに書き込みます。
* **削除のアクセス制御**:
  自分が所有しているデータ（または共通データ）のみ削除できるようにするため、削除クエリにも `owner` 条件を付与します。
  ```sql
  DELETE FROM memos WHERE id = ? AND (owner IS NULL OR owner = ?)
  ```

---

## 4. 初期シーディングとマイグレーション

* **デフォルトユーザーの作成**:
  データベース初期化時（初回起動時など）に `users` テーブルが空の場合、自動的に以下の2つのアカウントをシードします。
  1. `admin` (パスワード: `admin`, ロール: `admin`, アバター: `👑`)
  2. `user1` (パスワード: `user1`, ロール: `user`, アバター: `👤`)
* **スキーママイグレーションの耐性**:
  テーブル作成のあとに、`ALTER TABLE` 句を `try-catch` ブロックで実行することで、カラムが既に存在する旧データベース環境でもエラーを発生させずに起動できる仕様になっています。
  ```typescript
  try { db.exec("ALTER TABLE memos ADD COLUMN owner TEXT;"); } catch (e) {}
  ```
