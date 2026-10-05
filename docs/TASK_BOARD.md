# TASK BOARD

更新: 2026-10-05 / 状態は実装実行で検証後に更新

| ID | 状態 | 担当候補 | 終了条件 |
| --- | --- | --- | --- |
| SETUP-01 | DONE | Human + Antigravity | C:\AI\jarvisに配置、git init、両IDE読取確認 (完了) |
| M0-01 | DONE | Antigravity | 対応バージョン検証、アプリ起動、scripts整備 (Next.js 15+TS+Zod, build/typecheck/lint合格) |
| M0-02 | DONE | Antigravity | Presence/Brief/Approval/Dashboard画面とUI QA (Edge 1440x900 & 390x844 スクショ検証済) |
| CR001 | VERIFY | Codex引継ぎ | R3F中央コア＋音声モック実装済。WebGL無効・reduced-motion実機試験、GPU負荷計測は残件 |
| M0-03 | DONE | Codex | デモイベント/承認の型と負のテスト（重複、順不同、期限切れ、改ざん、二重判断）20件の一部として合格 |
| M0-04 | DONE | Codex | デモ範囲: GET状態、開発時のみPOSTイベント/承認。再起動で消えるプロセス内状態、公開APIは未実装 |
| M0-05 | DONE | Codex | フロント→ローカルdemo APIのText/Voice Mock・taskRunId・承認監査のブラウザーE2Eを確認。正確なPNG寸法はブラウザーパネル制限あり |
| M0-06 | VERIFY | Codex | CR001差分安全レビュー実施。M0-05統合後の再レビューを残す |
| CR002-P1 | DONE | Codex | calm/network/surge・品質設定・2D fallback・DOM境界・短時間画面QA |
| CR002-S1 | DONE | Codex | fixture source ID→taskRunId→brief→承認demo→監査。22テストとブラウザー操作で確認。耐久/GPU計測は別途 |
| CR003-RESEARCH | DONE | Codex / Human | 現行監査・公式サイト調査・独立A/B試作完了。ユーザーは最終的にAの青いコア画像へ戻すと指定。 |
| CR003-IMPLEMENT | VERIFY | Codex | 青い観測コアの回転と左右カードの微小な浮遊を復帰。typecheck/lint/22テスト/build、実ブラウザーで動き/手動抑制を確認。FPS/コントラスト/全幅QAと英語copy残件は`CR003/report/IMPLEMENTATION_LOG.md`参照。 |
| UI-REBUILD-HANDOFF | DONE | Codex | Claude Code向けブリーフ・契約/受入条件・監査/実装/レビューのプロンプトを`docs/handoffs/claude-ui-rebuild-2026-10-05/`へ保存。アプリ実装は未変更 |
| UI-REBUILD-CLOUD | DONE | Codex | 公開`devAsche/jarvis`の`handoff/claude-ui-rebuild-2026-10-05`へ現行デモと資料をpushし、GitHub上で引継ぎREADMEを確認。typecheck/lint/22テスト合格 |
| UI-REBUILD-DESIGN | VERIFY | Claude Code + Human | 監査と3案（A 朝の机 / B 管制盤 / C 対話）の試作・キャプチャを`docs/design/ui-rebuild-2026-10-05/`に保存。ユーザーの選択待ち。本番ルート未変更 |
| UI-REBUILD-IMPLEMENT | BLOCKED | Claude Code | `DESIGN_SELECTION.md`へ今回の選択が記録された後、既存アプリ内へ選択案を実装・試験 |
| M2-01 | BLOCKED | Human decision | 外部1サービスの読取専用連携を指定・認証 |

状態: TODO/READY/IN_PROGRESS/BLOCKED/VERIFY/DONE。作業前に担当ブランチ/対象ファイルを`HANDOFF.md`へ記録。
