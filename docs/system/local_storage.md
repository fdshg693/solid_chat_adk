# Ultraviolet AI Chat — フロントエンド LocalStorage 仕様 (Frontend LocalStorage Specification)

本ドキュメントでは、Ultraviolet AI Chat のフロントエンド（SolidJS）におけるブラウザの `LocalStorage` のデータ構造、設計思想、およびキーとオブジェクトの仕様について詳細に説明します。

---

## 1. 設計思想と特長

フロントエンドでの `LocalStorage` は、ユーザーのプライバシー保護とセッション管理の簡素化を両立するために採用されています。

* **API キーの保護**: ユーザーが入力した Gemini および Tavily の API キーは、バックエンドのデータベース（SQLite）には一切保存されず、ブラウザの `LocalStorage` にのみ安全に保存されます。サーバーへのリクエスト（対話や検索）のたび、リクエストヘッダーまたはボディに含めて動的に送信される設計になっています。
* **認証ユーザー (Identity) とペルソナ (Persona) の分離**:
  - **認証ユーザー (Identity)**: システム全体で一意となる「本当のユーザー名」（例: `admin`, `user1`）。バックエンドでの認証および SQLite 上での所有データ（memos/agents）のフィルタリングに使用されます。
  - **アクティブユーザー (Persona)**: 認証ユーザーがチャット画面上で切り替えて会話を行うための「ペルソナ」（表示レイヤー）。
* **名前空間（プレフィックス）による分離**:
  認証済みのユーザー間でお互いの会話履歴や設定情報が混ざらないよう、`auth_username` に基づく動的なプレフィックス（`${authUsername}_`）をキーに付与しています。

---

## 2. キー構造一覧

### ① グローバルキー (認証・システム全体)
ログイン状態および認証ユーザー（Identity）の基本情報を管理する、プレフィックスなしの共通キーです。

| キー名 | データ型 | 説明 |
| :--- | :--- | :--- |
| `auth_username` | `string` | ログイン中の認証ユーザー名（Identity）。（例: `"admin"`, `"user1"`） |
| `auth_role` | `string` | ログイン中ユーザーのシステム権限。（`"admin"` または `"user"`） |
| `auth_avatar` | `string` | ログイン中ユーザーのデフォルトアバター絵文字。（例: `"👑"`, `"👤"`） |

---

### ② ユーザー固有キー (名前空間付き)
ログイン中の認証ユーザー名（`auth_username` の値）をプレフィックス `${authUsername}_` として付与し、ユーザー間で完全に分離されるデータキーです。

| キー名 | データ型 | デフォルト値 | 説明 |
| :--- | :--- | :--- | :--- |
| `${authUsername}_gemini_api_key` | `string` | `""` | Gemini API の実行キー。 |
| `${authUsername}_tavily_api_key` | `string` | `""` | Tavily 検索 API の実行キー。 |
| `${authUsername}_gemini_model` | `string` | `"gemini-2.5-flash"` | チャットで使用するデフォルトの Gemini モデル識別子。 |
| `${authUsername}_gemini_system_instruction` | `string` | 指定テキスト | 標準エージェント対話用のシステムプロンプト。 |
| `${authUsername}_chat_users` | `JSON string` | 配列データ | 作成されたアクティブなペルソナ（表示レイヤー）の配列。 |
| `${authUsername}_active_user_id` | `string` | 選択中のID | 現在選択されているアクティブペルソナのID。 |
| `${authUsername}_active_agent_id` | `string` | `""` | 現在選択されているカスタムエージェントのID。（空はデフォルト） |
| `${authUsername}_chat_sessions` | `JSON string` | 配列データ | チャットセッションの一覧。 |
| `${authUsername}_active_session_id` | `string` | 選択中のID | 現在画面に表示しているチャットセッションのID。 |
| `${authUsername}_chat_history_${sessionId}` | `JSON string` | 配列データ | 指定した `sessionId` に対応するメッセージ履歴。 |

---

## 3. 主要な JSON オブジェクトのデータ構造

### ① ペルソナリスト (`chat_users`)
ユーザーが独自に作成・切り替えることができる、チャット画面用のペルソナ情報の一覧です。

```json
[
  {
    "id": "u-1",
    "name": "admin",
    "role": "admin",
    "avatar": "👑"
  },
  {
    "id": "u-2",
    "name": "assistant",
    "role": "user",
    "avatar": "🤖"
  }
]
```

### ② 会話セッション一覧 (`chat_sessions`)
作成されたチャットの会話グループを識別するためのリストです。

```json
[
  {
    "id": "session-1716940000000",
    "title": "新しい会話",
    "timestamp": 1716940000000
  }
]
```

### ③ メッセージ履歴 (`chat_history_${sessionId}`)
各会話セッション内におけるユーザーとAIエージェントのメッセージログです。フロントエンドの画面再描画や、バックエンド再起動時の状態回復に利用されます。

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

## 4. ライフサイクルとクリーンアップ

* **セッションの初期化**: ログインが成立した際、`initializeStateForUser()` が呼び出され、`auth_username` をキープレフィックスとした各種情報が読み込まれます。
* **ログアウト時のクリーンアップ**:
  ログアウト処理（`logoutUser()`）の実行時、以下の挙動が行われます。
  - グローバルキー（`auth_username`, `auth_role`, `auth_avatar`）がクリアされます。
  - フロントエンドのメモリ上のシグナルが初期状態にリセットされます。
  - > [!NOTE]
    > ユーザーごとの LocalStorage データ（プレフィックス付きのもの）は、次回ログイン時に再開できるよう意図的に保持されます。
