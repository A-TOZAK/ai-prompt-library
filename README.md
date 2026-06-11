# 🧰 AI プロンプトライブラリ

Claude Code・Claude・Gemini・NotebookLM・ChatGPT で使うプロンプトを、検索してワンクリックでコピーできる個人用ライブラリ。

**公開URL**: https://a-tozak.github.io/ai-prompt-library/

## 特徴

- 🔍 キーワード検索（スペース区切りでAND検索、`/`キーで検索ボックスにフォーカス）
- 🏷️ AIツール別タブ × 業務カテゴリ別チップの二軸絞り込み
- 📋 ワンクリックコピー
- 📱 スマホ・タブレット対応

## プロンプトの追加方法

[`js/prompts-data.js`](js/prompts-data.js) の `PROMPTS` 配列にオブジェクトを1つ追加するだけ。

```js
{
  tool: "claude-code",      // claude-code | claude | gemini | notebooklm | chatgpt | common
  category: "授業準備",      // 既存カテゴリ or 新カテゴリ（新カテゴリは自動で表示される）
  title: "プロンプトの名前",
  description: "いつ・何のために使うかの一行説明",
  prompt: "プロンプト本文。\n改行は \\n で。",
  tags: ["タグ1", "タグ2"]
}
```

Claude Code に「**プロンプトライブラリに追加して**」と頼めば、編集からpushまでやってくれる。

## 構成

```
ai-prompt-library/
├── index.html          ← 入口（ブラウザで開くだけで動く）
├── css/style.css       ← 見た目
└── js/
    ├── prompts-data.js ← プロンプトデータ（普段さわるのはここだけ）
    └── app.js          ← 検索・フィルタ・コピーのロジック
```

ビルド不要・依存なしの純粋な HTML/CSS/JS。`index.html` をダブルクリックしてもローカルで動く。
