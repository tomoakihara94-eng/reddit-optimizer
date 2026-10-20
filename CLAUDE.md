@AGENTS.md

## 差配システム（/api/dispatch, src/lib/dispatch-*）

触る前に `docs/dispatch.md` を読む。変更したら同メモと `npm test`（src/lib/dispatch.test.ts）を更新・実行する。
アプリ側は `~/dispatch-app`。スタッフ一覧などの共通設定はここ（`/api/dispatch/config`）が正で、アプリは起動時に読む。
