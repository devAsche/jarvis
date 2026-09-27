# 08 — Antigravity × Codex 共同開発プロトコル

## 唯一の真実源

コード・仕様・進捗は同じGitリポジトリ `C:\AI\jarvis` 内。チャット履歴を真実源にしない。`AGENTS.md`は重複しない最上位の共通ルール。M0後の仕様変更は必ず`docs/adr`に記録。各セッションは必要なdocsのみ読む。

## 推奨作業サイクル

1. `git status` と `docs/HANDOFF.md` / `docs/TASK_BOARD.md`を確認。未コミット変更は勝手に上書きしない。
2. 今回のタスク/担当ファイル/受入条件/見積コストを短く宣言。
3. 可能なら1エージェントで処理。UIはAntigravity、信頼境界/テストはCodexを優先。
4. 作業ごとにlint, typecheck, testとスクショまたはAPIログで実証。問題があれば原因と未検証範囲を明記。
5. `WORK_LOG.md`に追加 → `TASK_BOARD.md`を更新 → `HANDOFF.md`のnext actionを書き換え → 変更と次の仕事を報告。

## 並列運用

- 同じファイル/DBスキーマ/ロックファイルに同時編集権を与えない。`feat/ui-shell`, `feat/mock-core`, `review/security`など作業分離。
- worktreeを別フォルダーに分ける（`C:\AI\jarvis` = UI, `C:\AI\jarvis-codex` = API）。どちらかが依存/lockfileを更新したら後にマージを担当者が行う。
- 同じ物理ディレクトリを両IDEで同時に使うときは、片方は**読み取り・レビューのみ**。
- 動作検証のため外部アクセスが必要なら目的/範囲/費用を先に人間へ提示。GitHub private repo等への公開も明示承認後のみ。

## スケルトン構成案（M0の担当者が実装）

```text
jarvis/
  apps/web/             Next.js UI
  apps/server/          API + scheduler (初期はモック)
  packages/contracts/   zod/type schemas
  packages/policy/      deterministic policy + tests
  packages/ui/          design tokens/components (必要時)
  fixtures/             fake events / data only
  docs/                 requirements + ADR + logs
  .agents/              rules + skills
  prompts/              agent starts / review / resume
  prototype/            static visual reference
```

M0のスタック確定時、Web/APIを最初から分離する価値が低ければ、単一Next.js app + `packages/contracts`に簡略化して良い。**仕様上の境界**（UI / 信頼できないデータ / Policy / 実行）は維持し、その設計判断をADRに追記。

## モデルとコンテキスト

開発時は既存サブスクの利用枠を優先し、毎回全仕様をプロンプトに貼らず `AGENTS.md` → 対象ドキュメントで段階開示。単純な見た目/テストは軽量モード、セキュリティ/厄介なバグと最終レビューだけ高推論。詳細な料金/利用枠は契約と現在の公式情報を接続時に確認。開発AIの利用上限が切れても作業を復元できるよう、チャット依存の意思決定を禁止。
