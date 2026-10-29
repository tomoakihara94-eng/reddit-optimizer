# 差配システム（サーバー側）設計メモ

来店したお客様の担当営業を決めるシステムのサーバー側。iOS アプリ（`~/dispatch-app`、Expo）から
`https://reddit-optimizer.vercel.app/api/dispatch/*` を呼ぶ。データは Upstash Redis。

変更する前にこのメモを読み、変えたらこのメモも更新する。

## 流れ

1. 差配者がアプリで「来店通知を送る」→ お客様タイプを選ぶ → `POST /notify`
   - `dispatch:event` に `{ id, startedAt, status: 'active', customerType }` を作り、押下・応答の記録を消す
   - 営業へ Expo push（0秒）。`after()` で 10秒・20秒後に未応答者へ再送（計3回）
2. 営業が応答（アプリのボタン or 通知ボタン / Apple Watch）→ `POST /press { staffId, response, via }`
3. 全員が `GET /status` を2秒ごとにポーリング。30秒経過後の最初の status/press で `finalizeIfDecided` が当選を確定
4. 確定時: event を `assigned` に、得点の内訳を日別ログへ保存、当選者の通知を30分停止
5. 差配者が「次のお客様」→ `POST /clear`

## 当選の決め方（`src/lib/dispatch-winner.ts`）

```
得点 =（応答 + コンディション + 実績台数 × 0.1）× 得意度 × 0.1
```

- 応答: いくぜ40 / 行けたら行きたい30 / 普通20 / 今は無理かも10 / 対応中0（**対応中は当選対象外**）
- コンディション: 絶好調8 / 好調6 / 普通4 / 不調2 / 絶不調0（来店前に営業が選ぶ。未選択0）
- 実績: `dispatch:sales_units`（管理者画面で入力）。未入力の人は `SALES_UNITS`（config）の初期値
- 得意度: `dispatch:affinity` の お客様タイプ別 1〜10。未入力は 10（×1.0）
- 30秒以内に応答した人の中で最高得点。同点は早押し
- 30秒以内に誰もいなければ、30秒後に最初に応答した人
- 差配者本人（`event.dispatcherId`、旧仕様の名残）は対象外

## 問い合わせ（電話）

- 差配者が内線（必須）・お客様タイプ（必須、アプリ側で強制）・サイト（任意）を選び `POST /notify { kind: 'inquiry', line, customerType, source? }`（1.1.37〜。サイトなしでも受け付ける）
- event に `kind: 'inquiry'`, `line`, `customerType`, `source?`。status は種類・サイト・内線を全員に返す。お客様タイプは来店と同じく当選者本人にだけ返す
- 得点は得意度の代わりに TEL（`dispatch:tel`、営業ごと 1〜10、未入力 10）を掛ける（`scoringContext`）。即決定の通知の遅らせも TEL で判断
- 通知の文言は `pushText`（📞 お問い合わせ・サイト・内線）
- 結果の記録にも kind / source / line が残る

## 差配者名称（`src/lib/dispatch-labels.ts`、Redis `dispatch:labels`）

- 差配者画面のボタンの名前: 来店の差配者 / 電話を受けた人 / サイト / 内線。管理者画面「差配者名称」で編集（`POST /labels`）
- `/config` が返し、`/notify` は問い合わせのサイト・内線をこの一覧で検査する
- 送信時の `dispatchedBy`（差配した人・電話を受けた人）は event・status・結果・通知本文に入る

## 即決定方式（`src/lib/dispatch-fast.ts`、Redis `dispatch:fast_rules`、管理者画面「当選の設定 → 即決定」）

- 3段階: 例「36点以上は0秒から／33点以上は10秒後から／30点以上は20秒後から」その場で最高点の人に決定（`determineWinner` に `fastRules` を渡す）
- 得意度での通知の遅れ: そのお客様タイプの得意度が「5以下は2段目の秒数まで／3以下は3段目の秒数まで」通知しない（`blockedAffinity`・`gatedIdsNow`）
- 再通知の時刻は2段目・3段目の秒数（`repushTimesSec`）。再通知の前に `finalizeIfDecided` で当選を確かめる
- 30秒たっても当選者がいなければ、差配者のアプリが5秒ごとに `POST /keep-notify` を呼び、サーバーが「everySec 秒ごと・maxMin 分まで」未応答者に送る
- 応答（`/press`）のたびに `finalizeIfDecided` を呼ぶので、即決定はその場で確定する
- 設定がない・壊れているときは `DEFAULT_FAST_RULES`

## 通知が届かない条件（`src/lib/dispatch-push.ts` の `sendVisitPush`）

- 夜間: 日本時間 18:00〜翌 8:15（`isQuietHours`）
- `dispatch:mutes` に期限がある人
  - 「対応中（行けない）」を押した → 10分（`/mute` で 10〜60分に変更・0で再開）
  - 当選した → 30分（本人が再開できる）
  - 営業が「来店通知 OFF」 → 10〜60分（10分刻み）、または 61〜720分＋理由（`dispatch:mute_reasons`、差配者画面に表示）
  - 1.1.32 以前のアプリの「OFF」→ 実質無期限（`MUTE_OFF_MS`）
- すでに応答した人（再送時）
- 同じ端末が複数の営業IDに登録されている場合は1通だけ（`/register-expo` で古い登録を消す）

## Redis キー（`src/lib/dispatch-redis.ts`）

| キー | 中身 | 寿命 |
|---|---|---|
| `dispatch:event` | 今の来店（active / assigned） | 1時間 |
| `dispatch:presses` | 押下 `id::name::rank` → `{ t, r, v }`（旧形式は時刻の数値） | 確定時に削除 |
| `dispatch:staff_conditions` | 営業ID → コンディション | 保持 |
| `dispatch:conditions` | 旧仕様の抜群/不良（旧アプリ用に残置） | 来店ごとに削除 |
| `dispatch:expo_tokens` | 営業ID → Expo push トークン | 保持 |
| `dispatch:tokens` | Web push（旧 PWA） | 保持 |
| `dispatch:affinity` | 営業ID → `{ タイプ: 得意度 }` | 保持 |
| `dispatch:sales_units` | 営業ID → 台数 | 保持 |
| `dispatch:mutes` | 営業ID → 通知停止の期限(ms) | 保持（期限切れは無視） |
| `dispatch:results:YYYY-MM-DD` | その日（JST）の当選内訳 | 180日 |
| `dispatch:finalize:<eventId>` | 当選確定のロック（二重記録防止） | 5分 |
| `dispatch:staff_names` | 営業ID → 表示名（管理者が変更。なければ config の名前） | 保持 |
| `dispatch:board:notice` / `dispatch:board:president` | 掲示板（周知事項 / 社長は何を考えているのか）。新しい順に最大20件 | 保持 |
| `dispatch:fast_rules` | 即決定方式の設定（JSON） | 保持 |
| `dispatch:keepnotify:<eventId>` | 送り続ける通知の間隔ロック | everySec 秒 |
| `dispatch:mute_reasons` | 営業ID → 60分を超えて止めた理由（status の muteReasons で返す） | 保持 |
| `dispatch:tel` | 営業ID → TEL（1〜10）。問い合わせの得点に掛ける | 保持 |
| `dispatch:labels` | 差配者名称（JSON） | 保持 |
| `dispatch:notify_log` | 来店通知の送信記録 最新10件 | 1日 |

## 公開 API（暗証番号なし）

`/config`（共通設定）、`/board` の GET（掲示板。POST/DELETE は管理者）、`/status`、`/notify`、`/press`、`/mute`、`/staff-condition`、`/register-expo` など

## 管理者（暗証番号）

- 暗証番号は Vercel の環境変数 `DISPATCH_ADMIN_PIN`。ヘッダー `X-Admin-Pin` で照合（`src/lib/dispatch-admin.ts`）
- 必要な API: `/admin-verify`、`/affinity`、`/sales-units`、`/results`、`/staff-name`、`/fast-rules`、`/tel`、`/labels` の POST
- 変更は `vercel env rm` → `vercel env add` → 本番再公開。反映まで10秒ほどかかる
- **未対応**: `/notify` 自体は暗証番号不要（古いアプリ・外部から送れる）

## 設計上の決めごと（なぜこうしたか）

- **応答の値「対応中」は変えない**: 画面では「対応中（行けない）」だが、古いアプリが「対応中」を送るため
- **営業ID は変えない**: 平賀さんの ID は `sato`（佐藤→平賀は同一人物の名前訂正）。ID を変えると押下・得意度・実績・通知登録が切れる
- **お客様タイプは当選者にだけ返す**: `GET /status?staffId=` が当選者本人のときだけ `customerType` を付ける（他の営業には見せない仕様）
- **古いアプリとの互換**: 新しい項目は省略可能にし、なければ従来どおり動くようにする（`DEFAULT_RESPONSE` など）
- **共通の設定はここが正**: `GET /config` がスタッフ一覧・応答（表示名・点数）・コンディション・お客様タイプ・停止の分数・夜間を返し、アプリ（1.1.24〜）は起動時に読む。スタッフの追加・改名はここを直して公開するだけでアプリにも反映される（アプリの予備の初期値は `dispatch-app` で `npm run test:server` を流して合わせる）

## テスト

```
npm test
```

`src/lib/dispatch.test.ts`（当選ロジック・結果記録・通知停止・夜間判定）。Redis はテスト内のモックを使い、本番には触れない。

## 公開

- `npx vercel --prod --yes`（1回目が CLI エラーになることが多い。再実行で成功する）
- 公開後に `curl https://reddit-optimizer.vercel.app/api/dispatch/status` で確認
