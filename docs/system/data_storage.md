# Ultraviolet AI Chat — データ保存アーキテクチャ (Data Storage Architecture)

本ドキュメントでは、Ultraviolet AI Chat アプリケーションにおける全体のデータ保存設計および各コンポーネントごとの役割分担について整理します。

システムは、クライアント側のプライバシー保護とセッション管理の簡素化、サーバー側での永続データ管理およびリアルタイム記憶管理のために、3つの異なるデータ保存レイヤーを組み合わせて構成されています。

---

## 1. 全体データ保存マップ

アプリケーション内の主要なデータ項目が、どのストレージレイヤーにどのような目的で格納されるかの全体像です。

| データ項目 | 保存先 | ライフサイクル / 特徴 | 詳細リンク |
| :--- | :--- | :--- | :--- |
| **Gemini API キー** | LocalStorage | ユーザーブラウザに永続化。サーバー側データベースには保存されません。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **Tavily API キー** | LocalStorage | 同上（検索ツール用）。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **Gemini モデル名** | LocalStorage | 設定画面で選択されたモデル情報を保持。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **システム指示 (System Instruction)** | LocalStorage | デフォルトで適用されるシステムプロンプト。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **JWTトークン (Token)** | LocalStorage | ログイン完了時にサーバーから返却される署名済み認証トークン。保護されたAPIへのアクセスで使用。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **会話履歴・セッション一覧** | LocalStorage | ユーザーごとの会話セッションとメッセージ履歴。ユーザー名プレフィックスで暗黙的に隔離。 | [LocalStorage 仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md) |
| **認証ユーザー情報 (Identity)** | SQLite | ログイン用のユーザーID（`username`）、ハッシュ化されたパスワード、システム権限、アバター。 | [SQLite データベース仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md) |
| **共有/個人メモ (Memos)** | SQLite | ユーザーが作成したメモのタイトル、内容、作成者・更新者ペルソナ、所有者。 | [SQLite データベース仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md) |
| **メモの公開対象 (Audiences)** | SQLite | 各メモを閲覧可能なターゲットペルソナのリスト。多対多の中間テーブル。 | [SQLite データベース仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md) |
| **カスタムエージェント** | SQLite | ユーザーが登録した独自のシステム指示やアバターを持つエージェントプロファイル。 | [SQLite データベース仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md) |
| **対話セッション・短期文脈** | InMemory | `@google/adk` が実行中の会話スレッド、推論ステップ、および短期コンテキストを追跡。 | [In-Memory 保存仕様](file:///c:/CodeRoot/solid_chat_adk/docs/system/in_memory_storage.md) |

---

## 2. 3つのストレージレイヤー (Storage Layers)

各データ保存レイヤーは、セキュリティ、永続性、およびアクセス速度のバランスを考慮して役割が分担されています。詳細はそれぞれの設計ドキュメントを参照してください。

### ① [フロントエンド LocalStorage (Client-side)](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md)
* **主な役割**: 個人設定、認証APIキー、暗号署名済みJWT（`auth_token`）、チャットメッセージ履歴、アクティブペルソナの管理。
* **設計ポイント**:
  - `auth_username` をプレフィックス（`${authUsername}_`）とした名前空間を動的に付与し、同じブラウザを使用する異なる認証ユーザー間でのデータを完全分離。
  - 機密情報である API キーがバックエンドデータベースへ永続化されるのを排除し、個々のブラウザ内で安全に完結。

### ② [バックエンド SQLite データベース (Shared & Master DB)](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md)
* **主な役割**: ログイン認証ユーザー、共有メモ、ターゲットオーディエンス、およびカスタムエージェントの永続化。
* **設計ポイント**:
  - ルートディレクトリ直下の `app.db` で一元管理。
  - カラムに `owner`（認証ユーザーの Identity）を設け、`owner IS NULL OR owner = ?` によるクエリフィルタリングにより、マルチユーザー間でのデータ分離とプライバシーを確保。

### ③ [バックエンド メモリ内保存 (Real-time Context & Memory)](file:///c:/CodeRoot/solid_chat_adk/docs/system/in_memory_storage.md)
* **主な役割**: 自律型 AI エージェントの実行中に発生するセッションコンテキスト、アーティファクト、および文脈記憶のリアルタイム追跡。
* **設計ポイント**:
  - Google Agent Development Kit (`@google/adk`) の `InMemorySessionService` などを利用した高速な揮発性管理。
  - サーバーの再起動などによるデータ消失に備え、フロントエンドからのチャット送信時に履歴を自動送信してセッションをオンデマンドで復旧できる自己修復ロジックを確立。
