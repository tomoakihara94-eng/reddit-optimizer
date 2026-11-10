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

- 応答（2026-10-31〜 4択）: いくぜ40 / いける30 / きびしい10 / いけない−20（**いけないは当選対象外**、−20は結果の表示だけ。10分の通知停止も従来どおり）
  - 値は互換のため旧名のまま（いける=`行けたら行きたい`、きびしい=`今は無理かも`、いけない=`対応中`）。表示名は `RESPONSE_LABELS` で `/config` が返す
  - 廃止した「普通」（古いアプリの通知ボタン・記録）は `toResponse` で「いける」に読み替える
- コンディション: 絶好調8 / 好調6 / 普通4 / 不調2 / 絶不調0（来店前に営業が選ぶ。未選択0）
- 実績: `dispatch:sales_units`（管理者画面で入力）。未入力の人は `SALES_UNITS`（config）の初期値
- 得意度: `dispatch:affinity` の お客様タイプ別 1〜10。未入力は 10（×1.0）
- 30秒以内に応答した人の中で最高得点。同点は早押し
- 30秒以内に誰もいなければ、30秒後に最初に応答した人
- 差配者本人（`event.dispatcherId`、旧仕様の名残）は対象外

## 結果の決まり方（実況コメント用、2026-11-06〜）

- `DispatchResult.decision = { mode: 'fast' | 'window' | 'late', decidedSec, tier? }`（`buildResult`）。fast は即決定で、当たった段（tier）も残す
- アプリの `lib/commentary.ts` が結果から全員分の実況コメントを作る（古い結果は decision なしなので秒数から推測）

## 担当なしの回も記録（2026-11-11〜、`recordUnassigned`）

- 担当が決まらないまま終わった回（50秒の受付終了・決まる前に `/clear`・次の `/notify` で上書き）も計算結果に残す。`unassigned: true`、`winnerId: ''`、`winnerName: '担当なし'`（古いアプリでもそのまま出るように）、`decision: { mode: 'none', reason: 'closed' | 'cancelled' }`
- `/clear` と `/notify` は、まず `finalizeIfDecided`（決まる状態なら確定）→ だめなら `recordUnassigned`。`dispatch:finalize:<eventId>` のロックで二重記録しない
- `/stats` の当選回数には数えない

## 今日の責任者（`src/lib/dispatch-leader.ts`、2026-11-11〜）

- `POST /leader { staffId }`（null で解除、暗証番号なし）。`dispatch:leader:YYYY-MM-DD`（JST、3日）。次の日は未選択
- `/status` が `leader: { id, name } | null` を全員に返す（差配者画面の右上・営業の待機画面に表示）

## 問い合わせ（電話）

- 差配者が内線（必須）・お客様タイプ（必須、アプリ側で強制）・サイト（任意）を選び `POST /notify { kind: 'inquiry', line, customerType, source? }`（1.1.37〜。サイトなしでも受け付ける）
- event に `kind: 'inquiry'`, `line`, `customerType`, `source?`。status は種類・サイト・内線を全員に返す。お客様タイプは来店と同じく当選者本人にだけ返す
- 得点 =（応答＋調子＋実績×0.1）× 得意度×0.1 × TEL×0.1（1.1.38〜。得意度はそのお客様タイプのもの、タイプなし＝古いアプリは 10 扱い。TEL は `dispatch:tel`、未入力 10）。`determineWinner`/`scoreBreakdown` に tel を渡す。結果の行に `affinityLevel` と `telLevel`
- 即決定の「通知を遅らせる」判定は TEL だけ（`scoringContext`、ユーザー指定）
- 掛ける値が2つになり点数が下がるので、即決定の点数（36点など）には届きにくい
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
- 30秒たっても当選者がいなければ（＝いけない以外の応答がない）、差配者のアプリが5秒ごとに `POST /keep-notify` を呼び、サーバーが「everySec 秒ごと・来店通知から untilSec 秒まで」（既定 5秒・50秒）未応答者に送る
- untilSec を過ぎても決まらなければ受付終了: 担当なし（ユーザー指定「差配者が対応」）。`/status` は `closed: true`、`/press` は `closed` で断る、`determineWinner` は締切後の応答を数えない（`closeSec`）
- 保存済みの旧形式（maxMin 分まで）や古い管理者画面からの保存は、送り続けの部分だけ既定値（5秒・50秒）になる
- 応答（`/press`）のたびに `finalizeIfDecided` を呼ぶので、即決定はその場で確定する
- 設定がない・壊れているときは `DEFAULT_FAST_RULES`

## 通知が届かない条件（`src/lib/dispatch-push.ts` の `sendVisitPush`）

- 夜間: 日本時間 19:00〜翌 8:15（`isQuietHours`。2026-10-31 に 18:00→19:00）
- `dispatch:mutes` に期限がある人
  - 「対応中（行けない）」を押した → 10分（`/mute` で 10〜60分に変更・0で再開）
  - 来店で当選した → 30分（本人が再開できる）。問い合わせの当選では止めない（2026-11-04〜）
  - 営業が「来店通知 OFF」 → 10〜60分（10分刻み）、または 61〜720分＋理由（`dispatch:mute_reasons`、差配者画面に表示）
  - 1.1.32 以前のアプリの「OFF」→ 実質無期限（`MUTE_OFF_MS`）
- すでに応答した人（再送時）
- 同じ端末が複数の営業IDに登録されている場合は1通だけ（`/register-expo` で古い登録を消す）
- **1人の名前は1台のスマホだけ**（2026-11-02〜、`src/lib/dispatch-tokens.ts`）: `/register-expo` は、その名前が別のトークンで登録済みなら 409 `taken` で断る（上書きしない）。管理者の暗証番号付きなら引き継ぐ。`/unregister-expo` は token 付きならそのスマホの登録のときだけ消す（管理者は必ず、どちらもなしの古いアプリは従来どおり）
  - 背景: 別のスマホで同じ名前を選ぶと、黙って通知がそちらに移っていた
  - 機種変更・入れ直しでトークンが変わると taken になる → アプリで暗証番号を入れて引き継ぐか、管理者画面で登録を解除
  - `/unregister-expo` はトークンも暗証番号もない（1.1.39 以前のアプリ）呼び出しでは消さない（2026-11-04〜）。古いアプリで差配者に切り替える・名前を選び直すと、本人の別のスマホの登録まで消していたため（千原さん・基成さんの登録が消えていた）

## 送信記録（`src/lib/dispatch-pushlog.ts`、2026-11-04〜）

- `dispatch:push_log`: 通知を送るたびに `{ t, eventId, stage(最初/再通知/送り続け), sent, skipped(営業ID→理由), tickets(営業ID→ok:ticketId / error:内容), error }`。最大300件・3日
  - 理由: 未登録 / 通知OFF / 差配者 / 応答済み / 得意度・TELで遅らせ中 / 同じスマホ / 夜間（`planPush`）
- `dispatch:token_log`: 登録の新規・引き継ぎ・断った（taken）・削除（deleted / not this device / legacy ignored）。毎回の同じ登録は残さない。最大300件・14日
- `GET /push-log`（暗証番号なし・トークンは含まない）で読む。`?receipts=1` で直近30回分の Expo receipt（Apple まで届いたか。24時間以内）も付ける
- `POST /test-expo { staffId }`: その1人にだけテスト通知（30秒に1回、夜間・通知OFFでも送る）。結果は push_log の stage 'テスト'。`GET /test-expo?ticket=` で Apple まで届いたか（pending / ok / error）。差配者画面の「テスト」タブが使う
- 「鳴らない」と言われたら: push_log でその人が sent か skipped か → sent なら tickets/receipts → ok なら端末側（マナーモード・集中モード・通知設定）

## 営業の追加・削除（`src/lib/dispatch-staff.ts`、2026-11-07〜）

- 今いる営業 = `STAFF`（dispatch-config）＋ `dispatch:staff_added`（ID → 名前）− `dispatch:staff_removed`（ID → 削除時刻）。名前は `dispatch:staff_names` で上書き（`getStaff`）
- `POST /staff { name }`（管理者）で追加。ID は `s` ＋ 時刻（36進）。同じ名前は不可。`DELETE /staff { staffId }`（管理者）で削除（最初からの営業も可）。通知の登録・停止・問い合わせのみも消す。過去の計算結果は残る
- 営業IDの検査は `isStaffId`（各 API）。通知の送り先も `getStaff` から（追加した人にも届く）
- 旧 Web 版（src/app/dispatch/*）は `STAFF` 固定のまま

## 電話問い合わせだけ受ける（2026-11-07〜）

- `POST /inquiry-only { staffId, on }`（本人、暗証番号なし）。`dispatch:inquiry_only`。本人が戻すまで続く（ユーザー指定）
- **本人のスマホだけ**（2026-11-08〜）: `token` がその営業の登録（`dispatch:expo_tokens`）と一致しないと 403（`deviceCheck`）。11/7 夜に別のスマホから浅倉・柿崎がオンにされ、来店通知が止まっていたため。変更は token_log に action 'inquiry-only' で残る
- `/mute` も token 付き（1.1.47〜）で別のスマホなら 403。token なしの古いアプリは従来どおり受ける
- 来店の通知（最初・再通知・送り続け）ではこの人を外す（送信記録の理由「問い合わせのみ」）。投票率の分母にも入らない
- `/status` が `inquiryOnly`（ID の配列）を全員に返す。アプリは来店中の画面を出さない・差配者の一覧に出す

## 投票率（`src/lib/dispatch-stats.ts`、2026-11-04〜）

- 投票率 = 応答した回数 ÷ 通知が届いた回数（営業ごと・日ごと）。`GET /stats?days=1|7|30`（管理者）が投票率 `rate` と当選率 `winRate` を返す
- 分母: `sendVisitPush` が送った人（`markNotified`。同じ回の再通知は `dispatch:notified:<eventId>` で1回だけ）＋通知の前にアプリで応答した人。通知OFF・夜間・未登録は送らないので入らない（ユーザー指定）
- 分子: `/press` のたび（`markResponded`）。「いけない」も投票（ユーザー指定）。内訳 `<id>:r:<応答>`
- 公開より前の分はない。送ってすぐ取り消した回も「届いた」に入る
- **出勤日だけ**: 1回も応答しなかった日は休みとみなし、その日の通知は数えない（`getStats`、ユーザー指定）。`days` = 出勤日数
- 専用パスワード（`X-Stats-Pin`）は 2026-11-07 に廃止（ユーザー指定）。管理者の暗証番号だけ。Vercel の `DISPATCH_STATS_PIN` は使っていない
- **当選率** = 当選回数 ÷ 応答回数（2026-11-07〜）。当選回数は `/stats` が計算結果（`getResults`）から日ごとに数え、出勤日の分だけ足す

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
| `dispatch:push_log` | 通知ごとの送り先・送らない理由・Expo の返事 | 300件・3日 |
| `dispatch:token_log` | 通知の登録の変更 | 300件・14日 |
| `dispatch:staff_added` | 追加した営業（ID → 名前） | 保持 |
| `dispatch:staff_removed` | 削除した営業（ID → 時刻） | 保持 |
| `dispatch:inquiry_only` | 電話問い合わせだけ受ける営業 | 保持 |
| `dispatch:stats:YYYY-MM-DD` | 投票率の集計（`<id>:n` / `<id>:r` / `<id>:r:<応答>`） | 180日 |
| `dispatch:notified:<eventId>` | その回で数えた人 | 1日 |

## 公開 API（暗証番号なし）

`/config`（共通設定）、`/results` の GET（日ごとの計算結果。2026-10-31〜 営業も見られるよう暗証番号なし）、`/result?eventId=`（今の担当決定1件の計算結果。営業画面の「アルゴリズム結果」。今の event と一致するときだけ返す。お客様タイプも含む＝ユーザー指定）、`/board` の GET（掲示板。POST/DELETE は管理者）、`/status`、`/notify`、`/press`、`/mute`、`/staff-condition`、`/register-expo` など

## 管理者（暗証番号）

- 暗証番号は Vercel の環境変数 `DISPATCH_ADMIN_PIN`。ヘッダー `X-Admin-Pin` で照合（`src/lib/dispatch-admin.ts`）
- 必要な API: `/admin-verify`、`/staff`（追加・削除）、`/stats`、`/affinity`、`/sales-units`、`/staff-name`、`/fast-rules`、`/tel`、`/labels` の POST
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
