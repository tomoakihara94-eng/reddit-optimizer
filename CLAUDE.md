@AGENTS.md

プロジェクト名は reddit-optimizer だが、中身は松下モータースの社内ツール群と差配システムのサーバー。Reddit 関連と投稿文作成ツール（/api/optimize）は 2026-10-29 に削除済み。Vercel プロジェクトごと消すと差配アプリが止まるので消さないこと。

## 差配システム（/api/dispatch, src/lib/dispatch-*）

触る前に `docs/dispatch.md` を読む。変更したら同メモと `npm test`（src/lib/dispatch.test.ts）を更新・実行する。
アプリ側は `~/dispatch-app`。スタッフ一覧などの共通設定はここ（`/api/dispatch/config`）が正で、アプリは起動時に読む。
