# キラペン

キャラと推し部屋（My Room）をつくって、推し色にかざる推し活アプリ。
第1弾の機能：はじめての設定（キャラ作り・推し登録）／My Roomの模様替え／推し活の貯金箱／シェア画像。

## ファイルの中身

```
index.html            アプリの入口
css/app.css           見た目（色・文字・レイアウト）
js/app.js             動き（画面、着せ替え、模様替え、貯金箱、保存）
assets/parts.json     キャラのパーツ一覧（ここに1行足すと着せ替えに出る）
assets/char/          キャラのイラスト（素体・髪・服など）
assets/room/          部屋アイテムのイラスト（今は空。入れると描いた絵と差し替わる）
assets/icons/         アプリのアイコン
manifest.webmanifest  ホーム画面に追加したときの名前やアイコン
sw.js                 オフラインでも開けるようにする仕組み
```

## イラストのルール

- キャラのパーツは **600×732 の透明な画像**（PNG か WebP）
- 素体（assets/char/base.webp）と同じ位置・同じ大きさで重なるように描く
- 重なる順番（下から）：素体 → ボトムス → くつ → トップス → 持ち物 → 髪 → アクセ
- 色を選べるパーツは、ミルクティー色や白など **明るめの色** で描いておくと、きれいに色変えできる
- ChatGPTで作った 1254×1254 の画像は、位置合わせと切り抜きをしてから入れる

## パーツの増やし方

1. 画像を `assets/char/（種類）/` に置く（例：`assets/char/top/live-tee.webp`）
2. `assets/parts.json` の該当する slot の `items` に1行足す

```json
{ "id": "live-tee", "name": "ライブT", "src": "assets/char/top/live-tee.webp" }
```

3. `sw.js` の `VERSION` の数字を1つ上げる（例：`kirapen-1` → `kirapen-2`）

部屋のアイテムを絵に差し替えるときは、`parts.json` の `room` に書く：

```json
"room": { "bed": { "src": "assets/room/bed.webp" } }
```

## 公開のしかた（GitHub Pages・無料）

1. GitHubでリポジトリを作り、このフォルダの中身を全部アップロード
2. Settings → Pages → Branch を `main` / `(root)` にして保存
3. 表示されたURLをスマホで開き、共有メニューから「ホーム画面に追加」

## データについて

- ログインしていないときは、データはスマホのブラウザの中（localStorage）だけに保存。ログインするとSupabaseにも保存
- 「着せ替え・推し」タブの「バックアップをとる」で、データを文字として控えられる
- 写真フレームの写真はバックアップに含まれない

## ログインと保存（Supabase）

- 設定は `js/cloud.js` の `SUPABASE_URL` と `SUPABASE_KEY`（公開してよい publishable key だけ）
- テーブルの作り方：Supabase の SQL Editor に `supabase/schema.sql` を貼って Run
- `profiles`：みんなに見せる部屋（キャラ・推し・部屋）。だれでも見られる、本人だけ書ける
- `private_data`：貯金箱のお金の記録。本人だけ見られる
- 部屋のリンク：`https://dianajd0283-code.github.io/kirapen/?room=（ユーザーID）`
- service_role key / secret key / Database Password は、このリポジトリに絶対に書かない

## 投稿・タイムライン（第2弾）
- `supabase/posts.sql` を Supabase の SQL Editor で1回実行すると、投稿・わかる・通報・ブロック・写真の保存場所ができます。
- 3人から通報された投稿は自動で非表示になり、運営が「通報を確認」画面で 削除 / 問題なし を選べます。
- 運営にする人は `public.admins` テーブルに user_id を入れます（SQL Editor から）。

## 立体の部屋（My Room）
- 床は 6×6 マス、かべは左（L）と右（R）。家具は `js/app.js` の `ITEMS`（w・d がマス数）。
- ちゃっぴーの絵に差し替えるときは `assets/parts.json` の `room` に `{"bed": {"src": "assets/room/bed.webp", "scale": 1.1, "ratio": 1, "dy": 0}}` のように書く（scale：横幅の倍率、ratio：高さ÷幅、dy：上下の微調整）。
