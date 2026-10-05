# CR003 公式デザイン調査 — 2026-09-28 JST

調査方法: 公式公開ページを実ブラウザーで表示し、主要画面のスクリーンショットを`research/`に保存。同ページの見出し・UI要素を閲覧した。下記「抽象化」はJARVIS向けの設計判断で、各社の公式推奨という意味ではない。参考画面の画像・ロゴ・フォント資産は試作に組み込んでいない。

| 公式サイト / 根拠 | 観察 | 抽象化 → JARVISの問題 | 今回に適用しない点 |
|---|---|---|---|
| [Linear](https://linear.app/) · [ブラウザー記録](research/linear.png) | トップ内の実製品画面で左ナビ・単一issueの本文・右プロパティを分け、同じ面に履歴を置く。見出しと本文には緩急があり、小さなラベルは補助役。 | 情報の近接を「今の判断→根拠→履歴」で作る。A案は現在のカード散在を右判断レールと下の根拠へ組み替える。 | Linearのナビ幅・アイコン・色・issue画面を1:1で再現しない。JARVISはビジネス判断の意味を先に出す。 |
| [Raycast](https://www.raycast.com/) · [ブラウザー記録](research/raycast.png) | 公式ページはKeyboard FirstとHotkeys/Aliasesを明示し、主入力を短い指示の入口として扱う。ホームの視覚は大きな見出しと少数の優先行動。 | 既存のEnter送信欄を残し、入力例を「朝の報告/承認」の業務語へ。B案は判断→指示を近い順序にする。 | Raycast固有のランチャー窓、キー体系、赤い造形、ダウンロード導線を流用しない。現行にないグローバルショートカットを試作で動作すると見せない。 |
| [Vercel Geist Typography](https://vercel.com/geist/typography)、[Colors](https://vercel.com/geist/colors)、[Grid](https://vercel.com/geist/grid) · [ブラウザー記録](research/geist_typography.png) | 文字スタイルをfont-size/line-height/letter-spacing/weightの組で管理し、通常copyは14、モーダルでは16の用途を記述。ALL CAPSは忙しい画面の第三階層。色も主/副テキスト、面、境界を分ける。Grid文書は装飾線を過剰に重ねない指針。 | 現行の9–12px大文字と広い字間を主要説明から外し、日本語本文と金額/対象の対比を優先。A/Bとも細い線は区分に必要な場所だけに置く。 | Geist書体、Vercel固有の色値/部品/CSSクラスは移植しない。現行CSSへの実装はユーザー選択後。 |
| [Jarvis Institute](https://jarvis.institute/) · [ブラウザー記録](research/jarvis_institute.png) | 公開ページはCommand Centerでtask/tool activity/approvals/resultを一か所に見ると説明し、ワークフローを指示→確認→行動→結果に分ける。画像は高密度のネオン型ダッシュボード。 | B案で入力・根拠・人の判断を一続きに示す。A案で承認と業務データの境界を明瞭にする。現行の状態ラベルより「何を判断するか」を先に見せる。 | 同名製品のロゴ、文字組み、青い球、カード構図や映画的演出はコピーしない。同サイトの実サービス機能を本repoの機能として主張しない。 |

## ローカル参考画像の扱い

- `references/assets/01_command_center_reference.webp`: 左のナビ・中央の状態・周辺の情報役割だけを分析した。青い球/カード枠/文字配置は転用していない。
- `references/assets/02_amber_energy_reference.webp`: 不均一な輪郭、奥行きのある層、局所発光という抽象的な造形原則だけをB案に適用。原画像は試作HTML/SVGに埋め込んでいない。

## 未確認

各製品のログイン後UI・実動作、Geist書体の利用権、参考サイトの性能、アクセシビリティ適合は未確認。ここに記載したのは2026-09-28に公開ページで実際に閲覧できた範囲のみ。追加候補Perplexity/Radix/Three.jsは今回閲覧しておらず、調査済みとは扱わない。
