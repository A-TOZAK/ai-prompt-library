# 🧰 AI プロンプトライブラリ

Claude Code・Claude・Gemini・NotebookLM・ChatGPT で使うプロンプトを、検索してワンクリックでコピーできる個人用ライブラリ。

**公開URL**: https://a-tozak.github.io/ai-prompt-library/

## 特徴

- 🔍 キーワード検索（スペース区切りでAND検索、`/`キーで検索ボックスにフォーカス）
- 🗂️ 2つのコレクション切替
  - **🧰 しごと・AI活用**：AIツール別タブ（Claude Code / Claude / Gemini / NotebookLM / ChatGPT）× 業務カテゴリ
  - **🏫 授業・教科（小中高）**：校種タブ × 教科チップ（152本の教員向け構造化プロンプト）
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

授業・教科プロンプトの追加は `js/school-prompts-*.js`（小学校1・2／中学校3／高校4）に同様の形式で追記する。

## 構成

```
ai-prompt-library/
├── index.html              ← 入口（ブラウザで開くだけで動く）
├── css/style.css           ← 見た目
└── js/
    ├── prompts-data.js     ← しごと用プロンプトデータ
    ├── school-prompts-1.js ← 小学校（教科別）
    ├── school-prompts-2.js ← 小学校（校務・横断・画像活用）
    ├── school-prompts-3.js ← 中学校
    ├── school-prompts-4.js ← 高校
    └── app.js              ← 検索・フィルタ・コピーのロジック
```

ビルド不要・依存なしの純粋な HTML/CSS/JS。`index.html` をダブルクリックしてもローカルで動く。
