# ToDo リスト Web アプリ

Next.js（App Router）で作成したシンプルな ToDo リストです。
タスクの追加・完了・削除ができ、データはブラウザの localStorage に保存されるため、閉じても残ります。

## 主な機能

- タスクの追加・完了マーク・削除
- localStorage による永続化（ブラウザを閉じてもデータが残る）
- フィルタ（すべて / 未完了 / 完了）
- 削除の取り消し（Undo）
- 未完了件数・完了率の表示
- 空状態の表示、キーボード操作（Enter で追加）対応

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## ビルド（本番用）

```bash
npm run build
npm start
```

## デプロイ（Vercel）

1. GitHub にこのリポジトリを push する
2. https://vercel.com にログインし、「Add New → Project」から該当リポジトリを Import
3. フレームワークは自動で Next.js と認識される。そのまま Deploy
4. 発行された公開 URL を提出する

## 使用技術

- Next.js 14 (App Router)
- React 18
- CSS（プレーン、外部 UI ライブラリなし）
