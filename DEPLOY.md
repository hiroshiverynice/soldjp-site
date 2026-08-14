# SoldJP LP デプロイ手順

`site/` はコミット済み・ローカル検証済み（Chrome、ライト／ダーク両テーマ）。
残りは**あなたのアカウントが必要な操作だけ**です。上から順に4ステップ。

---

## 1. GitHubリポジトリを作って公開する

自動実行が権限で止められたため、この1コマンドだけ手で流してください。
Claude Codeのプロンプトで `!` を付けるとこのセッション内で実行できます。

```
! cd C:\Users\HiroshiKanemoto\projects\soldjp\site && gh repo create soldjp-site --public --source=. --push --description "SoldJP - Japanese auction sold-comp data for exporters. Landing page."
```

GitHub Pagesの無料枠は公開リポジトリのみ対応のため `--public` にしています。
中身はLPと Apps Script のコードだけで、**収集エンジン（`../engine`）は含めていません**。
手法が競争優位なので、意図的に別ディレクトリに分けてあります。

## 2. GitHub Pagesを有効化する

```
! gh api -X POST repos/hiroshiverynice/soldjp-site/pages -f "source[branch]=main" -f "source[path]=/"
```

1〜2分で公開されます:
**https://hiroshiverynice.github.io/soldjp-site/**

## 3. フォームの受け皿を作る（所要5分）

`form-backend.gs` の手順どおりに進めます。

1. Googleスプレッドシートを新規作成 → 名前を「SoldJP Waitlist」に
2. 拡張機能 → Apps Script → `form-backend.gs` の中身を全部貼り付け
3. 通知メールが欲しければ `NOTIFY_EMAIL` にアドレスを設定
4. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
   - 次のユーザーとして実行: **自分**
   - アクセスできるユーザー: **全員** ← ここを間違えると必ず失敗します
5. 発行された `https://script.google.com/macros/s/..../exec` をコピー
6. `site/index.html` の `const FORM_ENDPOINT = "";` に貼る
7. `! cd C:\Users\HiroshiKanemoto\projects\soldjp\site && git commit -am "Wire up form endpoint" && git push`

> LPは `Content-Type: text/plain` で送信しています。`application/json` に
> 変えるとCORSプリフライトが発生し、Apps Scriptは応答できないため必ず失敗します。

## 4. 連絡先メールを実在させる

`index.html` の末尾に、送信失敗時の受け皿として `soldjp.beta@gmail.com` が
書いてあります。実在させるか、自分のアドレスに書き換えてください。

---

## 任意: 独自ドメイン

`hiroshiverynice.github.io/soldjp-site` でもゲートは回せますが、
Redditでの信頼感は独自ドメインが上です。年1,500円程度。

1. `soldjp.com` 等を取得
2. `site/CNAME` に `soldjp.com` の1行だけを書いてコミット
3. DNSに `185.199.108-111.153` のA4本、または `hiroshiverynice.github.io` へCNAME
4. リポジトリ設定 → Pages → Enforce HTTPS

ドメインを変えたら `index.html` 冒頭の `og:url` と `canonical` も更新してください。

---

## 配信（ゲート②の本番）

合格ライン: **90日で登録100件、うち「Yes - I'd start today」が20%以上**。
登録数だけ見ないでください。過去5案件は「興味はあるが誰も払わない」で全滅しています。

配信先（セルフプロモ規約を必ず各サブレの sidebar で確認）:

| チャネル | 備考 |
|---|---|
| r/flipping | 本丸。週次のセルフプロモスレを使う |
| r/gamecollecting | レトロゲーム輸入層 |
| r/AnalogCommunity, r/photomarket | カメラ・レンズ層。実測データと相性が最良 |
| r/Watches, r/Seiko | 「Seiko watch 10.6倍」の話がそのまま刺さる |
| TCG系Discord | ポケカ日本版の海外需要 |
| X の #ebayseller / #reselling | |

投稿は宣伝でなく**発見の共有**として書くのが通ります。
「Yahoo!オークションを英語で検索すると Seiko で90%取りこぼす件」を
実データ付きで出し、LPは末尾に1行置くだけ。売り込むと即BANされます。

集計は Apps Script エディタで `summarise()` を実行すればログに出ます。
