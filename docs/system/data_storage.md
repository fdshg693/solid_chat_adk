# Ultraviolet AI Chat — データ保存設計書 (Data Storage Architecture)

本ドキュメントでは、Ultraviolet AI Chat アプリケーションにおけるデータの保存先および保存方法について整理します。
システムは、フロントエンドでのローカル状態管理（`LocalStorage`）、バックエンドでの共有リソース管理（`SQLite`）、および一時的な対話コンテキスト（`InMemory`）の3つを役割に応じて組み合わせて使用しています。

---

## 1. 全体データ保存マップ

| データ項目 | 保存先 | ライフサイクル / 特徴 |
| :--- | :--- | :--- |
| **Gemini API キー** | LocalStorage | ブラウザを閉じても永続化。サーバーへはリクエストごとに送信され、サーバーログ等には残りません。 |
| **Tavily API キー** | LocalStorage | 同上（検索ツール用）。 |
| **Gemini モデル名** | LocalStorage | 設定画面で選択されたモデル情報を保持。 |
| **システム指示 (System Instruction)** | LocalStorage | デフォルトで適用されるシステムプロンプト。 |
| **### ① ブラウザ LocalStorage（フロントエンド）

ユーザーの個人設定、認証情報（API キー）、および個人の会話履歴は、セキュリティと設計の簡素化のために**ブラウザの LocalStorage** にのみ保存され、バックエンドのデータベースには記録されません。

> [!NOTE]
> ユーザーの API キーが直接サーバー側のデータベースに保存されるのを防ぐことで、個々のブラウザ内で安全にキーが完結するプライバシーに配慮した設計となっています。

#### 【実装済】認証ユーザーとペルソナの分離
本システムでは、ログイン画面を介して決定される**システム上で一意となる「本当のユーザー名（認証情報）」** と、各ユーザーが独自に作成・切り替えられる「アクティブなペルソナ」を完全に分離しています。
* **本当のユーザー名 (Identity)**: バックエンドの認証および SQLite 上でのデータフィルタリング（他ユーザーとのデータ重複の排除）に使用。
* **アクティブなユーザー (Persona)**: 同一の「本当のユーザー」が文脈や用途に応じて画面上で自由に切り替えられるペルソナ（表現・表示レイヤー）。

これに伴い、LocalStorage のキーにはログイン中の認証ユーザー名がプレフィックスとして動的に付与され（例：`${authUsername}_chat_users`）、認証ユーザー間でのローカルデータの完全分離（他ユーザーとのデータ重複の排除）を実現しています。

#### 主なキーとデータ構造

##### 認証用のグローバルキー（名前空間なし）
1. **`auth_username`**
   - **データ型**: `string`
   - **用途**: ログイン中の認証ユーザーの「本当のユーザー名 (Identity)」。
2. **`auth_role`**
   - **データ型**: `string`
   - **用途**: 認証ユーザーの権限レベル (`admin` または `user`)。
3. **`auth_avatar`**
   - **データ型**: `string`
   - **用途**: 認証ユーザーの基本アバター絵文字。

##### 認証ユーザー固有のキー（`${authUsername}_` のプレフィックスが付与されます）
1. **`${authUsername}_gemini_api_key`** / **`${authUsername}_tavily_api_key`**
   - **データ型**: `string`
   - **用途**: 認証ユーザー固有の API キー。
2. **`${authUsername}_gemini_model`**
   - **データ型**: `string` (デフォルト: `gemini-2.5-flash`)
   - **用途**: 対話で使用するモデルの識別子。
3. **`${authUsername}_gemini_system_instruction`**
   - **データ型**: `string`
   - **用途**: 認証ユーザーのデフォルトシステムプロンプト。
4. **`${authUsername}_chat_users`**
   - **データ型**: `JSON string` (配列)
   - **用途**: その認証ユーザーが作成したアクティブペルソナ（表示レイヤー）のリスト。
5. **`${authUsername}_active_user_id`**
   - **データ型**: `string`
   - **用途**: 選択中のアクティブペルソナのID。
6. **`${authUsername}_active_agent_id`**
   - **データ型**: `string`
   - **用途**: 選択中のカスタムエージェントID。
7. **`${authUsername}_chat_sessions`**
   - **データ型**: `JSON string` (配列)
   - **用途**: そのユーザーの会話セッション一覧。
8. **`${authUsername}_active_session_id`**
   - **データ型**: `string`
   - **用途**: 現在表示中のアクティブセッションID。
9. **`${authUsername}_chat_history_${sessionId}`**
   - **データ型**: `JSON string` (配列)
   - **用途**: そのユーザーの指定セッションに紐づくメッセージ履歴。

---

### ② バックエンド SQLite データベース (`app.db`)

アプリケーションの共有データやマスターデータは、Node.js の標準ライブラリ（`node:sqlite`）を介して、ルートディレクトリ直下の `app.db` ファイルに永続化されます。

> [!TIP]
> データベース名を `app.db` とすることで、特定のデータ型に囚われず、共有設定やマスターデータを一元管理するデータベースとしての役割を明確にしています。

#### テーブル設計

#### 1. `users` テーブル
認証ユーザー（本当のユーザー名：Identity）の情報を格納します。一意性を保証し、同一ユーザー名の重複登録を防ぎます。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `username` | TEXT | PRIMARY KEY | 本当のユーザー名 (例: `admin`, `user1`) |
| `password` | TEXT | NOT NULL | SHA-256でハッシュ化されたパスワード値 |
| `role` | TEXT | NOT NULL DEFAULT 'user' | 権限ロール (`admin` または `user`) |
| `avatar` | TEXT | - | 認証ユーザーのデフォルトアバター絵文字 |

#### 2. `memos` テーブル
ユーザーメモ本体を格納します。`owner` カラムにより認証ユーザーごとのフィルタリングが行われます。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | メモのユニークID (例: `memo-171694...`) |
| `title` | TEXT | NOT NULL | メモのタイトル |
| `content` | TEXT | NOT NULL | メモのマークダウン本文 |
| `creator` | TEXT | - | メモを作成したペルソナ名 |
| `updater` | TEXT | - | 最後にメモを更新したペルソナ名 |
| `owner` | TEXT | - | メモを所有する認証ユーザー名 (Identity) |

#### 3. `memo_audiences` テーブル
メモの公開対象（ターゲットオーディエンス）を管理する中間テーブルです。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `memo_id` | TEXT | PRIMARY KEY (複合) / FK | `memos.id` に紐づく外部キー（ON DELETE CASCADE） |
| `username` | TEXT | PRIMARY KEY (複合) | 公開対象のペルソナ名 / ユーザー名 |

#### 4. `agents` テーブル
カスタムエージェントの情報を格納します。`owner` カラムにより認証ユーザーごとのフィルタリングが行われます。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | エージェントのユニークID |
| `name` | TEXT | NOT NULL | エージェントの表示名 |
| `systemPrompt` | TEXT | NOT NULL | エージェントに与える独自の役割・命令文 |
| `avatar` | TEXT | - | エージェントのアバター（絵文字等、デフォルトは `'🤖'`） |
| `owner` | TEXT | - | エージェントを所有する認証ユーザー名 (Identity) |": "admin", "avatar": "👑" },
       { "id": "u-2", "name": "user1", "role": "user", "avatar": "👤" }
     ]
     ```

5. **`active_user_id`**
   - **データ型**: `string`
   - **用途**: 現在ログイン中のアクティブなユーザーID。

6. **`active_agent_id`**
   - **データ型**: `string`
   - **用途**: 選択中のカスタムエージェントID。空文字の場合はデフォルトエージェントが適用されます。

7. **`chat_sessions`**
   - **データ型**: `JSON string` (配列)
   - **構造**:
     ```json
     [
       { "id": "session-1716940000000", "title": "新しい会話", "timestamp": 1716940000000 }
     ]
     ```

8. **`active_session_id`**
   - **データ型**: `string`
   - **用途**: 現在画面に表示されているチャットセッションのID。

9. **`chat_history_${sessionId}`**
   - **データ型**: `JSON string` (配列)
   - **構造**:
     ```json
     [
       {
         "id": "msg-user-1716940005000",
         "role": "user",
         "text": "こんにちは",
         "timestamp": 1716940005000
       },
       {
         "id": "msg-assistant-1716940007000",
         "role": "assistant",
         "text": "こんにちは！何かお手伝いできることはありますか？",
         "timestamp": 1716940007000
       }
     ]
     ```

---

### ② バックエンド SQLite データベース (`app.db`)

アプリケーションの共有データやマスターデータは、Node.js の標準ライブラリ（`node:sqlite`）を介して、ルートディレクトリ直下の `app.db` ファイルに永続化されます。

> [!TIP]
> データベース名を `app.db` とすることで、特定のデータ型に囚われず、共有設定やマスターデータを一元管理するデータベースとしての役割を明確にしています。

#### テーブル設計

#### 1. `memos` テーブル
共有のユーザーメモ本体を格納します。ターゲット指定の情報は別テーブルに正規化されています。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | メモのユニークID (例: `memo-171694...`) |
| `title` | TEXT | NOT NULL | メモのタイトル |
| `content` | TEXT | NOT NULL | メモのマークダウン本文 |
| `creator` | TEXT | - | メモを作成したユーザー名 |
| `updater` | TEXT | - | 最後にメモを更新したユーザー名 |

#### 2. `memo_audiences` テーブル
メモの公開対象（ターゲットオーディエンス）を管理する中間テーブルです。特定のユーザー向けメモのフィルタリングを容易にします。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `memo_id` | TEXT | PRIMARY KEY (複合) / FK | `memos.id` に紐づく外部キー（ON DELETE CASCADE） |
| `username` | TEXT | PRIMARY KEY (複合) | 公開対象のペルソナ名 / ユーザー名 |

#### 3. `agents` テーブル
カスタムエージェント（独自のシステムプロンプトやアバターを持つAI）の設定情報を格納します。

| カラム名 | データ型 | 特徴 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | TEXT | PRIMARY KEY | エージェントのユニークID |
| `name` | TEXT | NOT NULL | エージェントの表示名 |
| `systemPrompt` | TEXT | NOT NULL | エージェントに与える独自の役割・命令文 |
| `avatar` | TEXT | - | エージェントのアバター（絵文字等、デフォルトは `'🤖'`） |

---

### ③ バックエンド メモリ内保存 (InMemory)

バックエンド（Honoサーバー）は、Google Agent Development Kit (`@google/adk`) の以下のクラスを使用して、セッションおよび対話の状態をメモリ上で一時的に追跡します。

- **`InMemorySessionService`**: エージェントとユーザーの対話セッション状態を追跡。
- **`InMemoryArtifactService`**: エージェント実行中に生成されるアーティファクトを保持。
- **`InMemoryMemoryService`**: エージェントの過去の文脈記憶を保持。

> [!WARNING]
> Honoサーバープロセスが再起動（デプロイやサーバーシャットダウン等）されると、**InMemory の情報は完全に失われます**。
>
> ただし、フロントエンドの LocalStorage 側に `chat_history_${sessionId}` が保存されているため、ユーザーのブラウザ画面上にはチャット履歴が維持されます。次回メッセージを送信した時点で、バックエンド側で新しい対話セッションが自動的に再構築されます。
