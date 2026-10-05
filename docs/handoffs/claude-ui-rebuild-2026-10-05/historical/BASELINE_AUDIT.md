# CR003 現状監査 — 2026-09-28 JST

## 監査対象とGit

- 実repo: `C:\AI\jarvis\JARVIS_C_AI_Starter\jarvis`、branch `feature/cr001-r3f-voice-foundations`、HEAD `fe3ab07`。worktreeはこの1つ。
- 開始時点でCR001/CR002の未コミット変更が多数ある。`src/app/page.tsx`、`src/app/globals.css`、`src/components/ApprovalModal.tsx`、`src/contracts/index.ts`、`docs/HANDOFF.md`などが変更済みで、`src/components/presence/`、`src/lib/`、`src/app/api/`などは未追跡。破棄・stash・commit・別worktree作成をしていない。
- CR003の試作とレポートはrepoの外側にある本変更要求の`report/`へ保存。アプリの`src/`、package、既存fixtureは編集していない。既存の未コミット実装と同じファイルへの差分衝突なし。引継ぎ記録としてrepoの`docs/HANDOFF.md`、`docs/TASK_BOARD.md`、`docs/WORK_LOG.md`末尾のみ更新。
- 閲覧した基準: repo `AGENTS.md`、`docs/HANDOFF.md`、`docs/TASK_BOARD.md`、CR002 status、CR003 `README_FIRST.md`、5仕様、2参考画像、`qa/ACCEPTANCE.md`。参考画像は構造・光密度を抽象化し、画像自体を試作に埋めていない。

## 実ブラウザーの基準画面

| 証跡 | 実測・観察 |
|---|---|
| [通常画面](screenshots/baseline_idle.png) | Codex in-app browser、CSS viewport 1440×900、`document.scrollWidth=1440`、Canvas 1。フルページ高さ1173 CSS px。出力PNG幅はブラウザーパネルによりCSS viewportより小さい。 |
| [承認画面](screenshots/baseline_approval.png) | 未処理1件。demo、効果なし、対象ID、¥4,900、送料¥900→¥1,550、期限、承認/拒否を表示。判断ボタンは押していない。 |
| [幅390](screenshots/baseline_narrow.png) | CSS viewport 390×844、横はみ出しなし (`scrollWidth=390`)。フルページ高さ2712 CSS pxで、承認と売上はかなり下に移る。 |
| [GPU強制失敗](screenshots/baseline_gpu_failure.png) | 開発用`?gpu=fail`でCanvas 0。承認ボタンとサンプル売上DOMは残った。実機のWebGL無効化試験ではない。 |

## 現行の契約と動作

- `src/app/page.tsx`: R3FはPresence中央だけ。`Core3DViewport`をSSRなしで遅延読込し、外側の接続・売上・字幕・承認・コマンドはDOM。`quality=auto/balanced/low/off`、`mode=calm/network/surge`、reduced motion、GPU失敗で2Dへ切替。音声/テキスト入力から開発限定`/api/demo/runs`へ進む。UIのMock/No taskバッジは表示される。
- `src/contracts/index.ts`: `CoreVisualState`と`TaskRun.taskRunId`、`DEMO/LIVE_VERIFIED/STALE/UNKNOWN`の鮮度、Mock UIEventのdemo必須、active task状態のsessionId/taskId必須が定義済み。`src/lib/demoSafety.ts`は重複イベントを拒否し、日時降順に並べる。
- `src/lib/demoStore.ts`: 3系統のfixture READ、4出典ID照合、根拠付きbrief、待機承認、判断監査をプロセス内メモリで保持。`decideDemoApproval`は対象/原本/期限/重複を照合し、外部作用はない。サーバー再起動・複数workerでは持続しない。`/api/demo`のPOSTは開発環境の同一Originだけに限定される。
- `ApprovalModal.tsx`: 開くと閉じるボタンへフォーカス。Escと背景クリックで閉じる。実ブラウザーでEsc後にdialogが消えることを確認。ただしEsc後の`document.activeElement`は`body`で、起点ボタンへフォーカスが戻らない。Tabのモーダル内循環もコード上なし。選択案の実装時に修正・実測が必要。
- コマンド欄はフォームとして入力後Enter/送信ボタンで実行。朝/承認/ダッシュボードの語句を既存ハンドラへ分岐する。全域ショートカットやコマンドパレットは現状ない。Voice Mockは音声シナリオボタンとDOM字幕を持つ。UIの「発話中」はブラウザーTTS以外で実音声とはしない。

## 問題の分類

| 重大度 | 観察と原因 | 再現・証跡 |
|---|---|---|
| P1 操作 | 承認dialogをEscで閉じると起点へフォーカスが戻らない。キーボード連続操作に支障。フォーカストラップも未実装。 | 通常画面→承認センター→Esc→`document.activeElement`がbody。`ApprovalModal.tsx`のcloseボタンfocusとEscape handlerのみ。 |
| P1 誤認リスク | 初回表示の「ORDER REVENUE ¥4,900」は小さな“Sample data, not real sales”で補足される。視線の強い金額だけ読むと実売上に見える。左イベントの“COMMERCE ORDER PAID”もfixture表記が二次行。 | 通常画面右・左列。`RightSidebar.tsx`/`LeftSidebar.tsx`。A/Bでは金額の直近にサンプルを置く。 |
| P2 造形 | 最新コアは黄橙ではなく青紫の不透明球＋同じ中心の3 torus。色と線が変わってもシルエットがほぼ一定で、遠近の差・局所光・非均一な空間密度が弱い。玩具的/宇宙模型的に見える主因はこの単純な幾何関係。承認時はamberへ変わるが形態差は小さい。 | 通常スクリーンショット、`CoreScene.tsx`のsphereGeometry/3 torusGeometry、状態色は`CoreVisualState.ts`。 |
| P2 情報階層 | 左に接続/イベント、中央に大きなコア、右に売上/agent/優先案件という均等なカード分割。承認1件の判断内容より装飾とシステム情報が広い面積を占める。幅390では優先案件が下方。 | 通常/幅390スクリーンショット。`globals.css`の3列grid。 |
| P2 文字・copy | 9–12pxの英大文字、字間0.15–0.39emが多く、`CORE INTERFACE / V.02-R3F`、`PROVIDER`、`BUILD: CONCEPT`、`ENCRYPTION: NOT CONFIGURED`等が意思決定より目立つ。日本語の業務説明は相対的に弱く、テンプレート調。 | 通常画面、`globals.css`のfont-size/letter-spacing、`page.tsx`。 |
| P2 語の正確さ | `AGENT STATUS`の3エージェントはDEMO/IDLEで、実行agentではない。`CONNECTED SYSTEMS`の見出しは全件未接続。`Mock Voice Engine`と音声絵文字は実音声利用可能に見える余地があり、断り書きが離れている。 | 通常画面DOM。初回の「System standby」はタスクなし表示と一致。 |
| P2 負荷 | idleでも`frameloop="always"`。Sphere・3 torus・particleを`useFrame`で毎frame回す。hidden tabはdemandへ切替、quality low/offもあるが、FPS/GPU時間の実測なし。 | `Core3DViewport.tsx`/`CoreScene.tsx`。実GPU値は未計測。 |

## 維持すべき動作と境界

承認/拒否の内容・対象・期限・効果なし表示、朝の報告と根拠ID、サンプル売上と鮮度、コマンド入力、Voice Mock字幕と割込み、Canvas失敗時のDOM操作、reduced motion、`taskRunId`連動を維持。A/B試作はこれらの配置と表現だけの検討で、機能試験ではない。

## 今回の未実施

アプリ本体は変更していないため、lint/typecheck/test/buildは再実行していない。CR002文書には同日22/22・lint/typecheck/build合格とあるが、これは今回の再検証結果ではない。実機WebGL無効化、長時間FPS/GPU/メモリ、OS reduced motion、モーダルTab循環の実ブラウザー確認、全幅・コントラスト測定は選択後の実装/QA段階へ残す。承認ボタンは押していない。
