# TASK BOARD

更新: 2026-09-28 / 状態は実装実行で検証後に更新

| ID | 状態 | 担当候補 | 終了条件 |
| --- | --- | --- | --- |
| SETUP-01 | DONE | Human + Antigravity | C:\AI\jarvisに配置、git init、両IDE読取確認 (完了) |
| M0-01 | DONE | Antigravity | 対応バージョン検証、アプリ起動、scripts整備 (Next.js 15+TS+Zod, build/typecheck/lint合格) |
| M0-02 | DONE | Antigravity | Presence/Brief/Approval/Dashboard画面とUI QA (Edge 1440x900 & 390x844 スクショ検証済) |
| M0-03 | READY | Codex | 内部イベント/承認ポリシーの厳格型と負のテスト |
| M0-04 | TODO | Codex | モックAPIとエラー・冪等性検証 |
| M0-05 | TODO | Antigravity | 統合・ブラウザE2Eと視覚比較 |
| M0-06 | TODO | Codex | 差分安全レビュー/回帰試験 |
| M2-01 | BLOCKED | Human decision | 外部1サービスの読取専用連携を指定・認証 |

状態: TODO/READY/IN_PROGRESS/BLOCKED/VERIFY/DONE。作業前に担当ブランチ/対象ファイルを`HANDOFF.md`へ記録。
