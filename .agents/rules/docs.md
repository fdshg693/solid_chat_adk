---
trigger: always_on
glob: "**/*"
description: Rules for using and updating documentation under the docs/ folder.
---

# ドキュメント参照・更新ルール (Documentation Guidelines)

開発を行うにあたり、`docs` フォルダ配下のドキュメントの記述内容を正しく把握し、参照すべきタイミングで適切なドキュメントを参照してください。

> [!IMPORTANT]
> **「常に最新にすること」の指示**
> アプリケーションの機能追加、設計変更、またはツールの更新などを行った場合は、**必ず対応する `docs` 配下のドキュメントをチェックし、最新の状態に保つように修正**してください。仕様変更があったにもかかわらずドキュメントの更新を怠ることは厳禁です。

---

## 1. ドキュメントインデックス・参照ガイド

現在 `docs` フォルダ配下に存在するドキュメントの概要と、どのような状況下で参照すべきかを定義します。

### ① AI機能・能力詳細
- **ファイルパス**: [AI_ABILITIES.md](file:///c:/CodeRoot/solid_chat_adk/docs/app/AI_ABILITIES.md)
- **概要**: アプリケーション内でAI（エージェント）が実行可能な自律ツール（ウェブ検索やユーザーメモ操作など）や、対話時におけるコンテキスト記憶機能について詳細を説明しています。
- **いつ見るべきか**:
  - AIが利用可能なツール（Tavily検索、メモ一覧取得、メモ作成・更新など）の具体的な挙動や連携仕様を確認したいとき。
  - AIエージェントに新しいツールを実装・拡張するとき。

### ② アプリケーション機能一覧
- **ファイルパス**: [Features.md](file:///c:/CodeRoot/solid_chat_adk/docs/app/Features.md)
- **概要**: ユーザーに提供されるアプリケーションの全体的な機能仕様（チャットUI、エージェント管理、ユーザーメモ、設定、複数ユーザー機能）について、非技術的な視点を含めて説明しています。
- **いつ見るべきか**:
  - システム全体が提供する主要な機能要件を確認したいとき。
  - UIコンポーネント（Sidebar, AgentManager, SettingsDrawerなど）の振る舞いや仕様を理解・変更したいとき。

### ③ データ保存設計書 (Overview & Map)
- **ファイルパス**: [data_storage.md](file:///c:/CodeRoot/solid_chat_adk/docs/system/data_storage.md)
- **概要**: アプリケーションのデータ構造全体の保存マップおよび設計思想をまとめた最上位の設計書です。
- **いつ見るべきか**:
  - 各種データの保存先（フロントエンド/バックエンド/メモリ）の全体設計を確認したいとき。

### ④ フロントエンド LocalStorage 仕様
- **ファイルパス**: [local_storage.md](file:///c:/CodeRoot/solid_chat_adk/docs/system/local_storage.md)
- **概要**: フロントエンド（SolidJS）側で管理する API キー、ユーザー設定、表示用ペルソナ、およびセッションメッセージ履歴などのキー一覧と JSON スキーマ定義です。
- **いつ見るべきか**:
  - LocalStorage のキーを追加・変更したり、ペルソナやメッセージ履歴のデータ構造を確認・変更したいとき。

### ⑤ バックエンド SQLite データベース仕様
- **ファイルパス**: [sqlite_database.md](file:///c:/CodeRoot/solid_chat_adk/docs/system/sqlite_database.md)
- **概要**: バックエンド（Hono）側の SQLite データベース（`app.db`）の各テーブル定義（`users`, `memos`, `memo_audiences`, `agents`）、マイグレーション、およびマルチユーザーデータ分離フィルタリングの仕様です。
- **いつ見るべきか**:
  - DBテーブルの定義変更、新規テーブルの作成、あるいは認証ユーザーごとの所有データ隔離ロジックを更新・確認したいとき。

### ⑥ バックエンド In-Memory 保存仕様
- **ファイルパス**: [in_memory_storage.md](file:///c:/CodeRoot/solid_chat_adk/docs/system/in_memory_storage.md)
- **概要**: Google Agent Development Kit (`@google/adk`) を用いたリアルタイムなセッション状態、ランナー記憶、およびアーティファクトの追跡仕様と、サーバー再起動時のセッション自己修復メカニズムを解説しています。
- **いつ見るべきか**:
  - バックエンドでのセッション管理やコンテキスト追跡、一時記憶のライフサイクルのデバッグや仕様を確認したいとき。

