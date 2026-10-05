# CR003 デザイン判断

- 状態: **選択済み / 実装対象**
- 選択: [ ] A Observatory　[ ] B Foundry　[x] 指定の折衷案
- 承認者・日付: ユーザー、2026-09-28 JST
- 基準画面: [baseline_idle.png](screenshots/baseline_idle.png)
- A全画面 / コア: [concept_a_idle.png](screenshots/concept_a_idle.png) / [concept_a_core.png](screenshots/concept_a_core.png)
- B全画面 / コア: [concept_b_idle.png](screenshots/concept_b_idle.png) / [concept_b_core.png](screenshots/concept_b_core.png)
- 採りたい要素: 当初は「AとB半々のような形で、カラーを織り交ぜた感じ」。その後、ユーザーがAのコア画像を添付して「やっぱこれにもどして、キリいいとこでいい」と再指定。**最新判断は中央コアをA Observatoryの青白い観測表示へ戻すこと**。既存3カラム、右の判断カード、デモの安全表示は維持する。
- 避けたい要素: 追加指定なし。参照画像の直接コピー、実データ誤認、全画面WebGLは既存制約により採用しない。
- 言語比率・主な画面幅: 未記入

## 今回の承認対象

最新指定の対象は添付画像に写る中央コアの造形と色。R3Fの薄い奥行き線と、同じ構図の2D fallbackを実装する。静止HTML/SVG単体を完成UIとは扱わない。

## 非対象

有料音声、外部サービス接続、認証情報、実注文/メール/広告への書込み、承認の自己実行、P3以降の機能追加。選択だけでこれらを許可したことにはならない。

## 次の引継ぎ

上記のユーザー選択に基づき、`prompts/CODEX_01_IMPLEMENT.md`を実行する。`BASELINE_AUDIT.md`のP1フォーカス問題、MOCK/DEMOの明示、既存イベント契約と2D fallback、狭幅の優先順を必須条件にする。
