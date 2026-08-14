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

配信先は **2026-08-14にReddit APIで実地検証済**。詳細と根拠は
Obsidian `10_進行中/ニッチWebサービス調査/030_SoldJP_配信先実地検証_2026-08-14.md`。

| 優先 | チャネル | 実測根拠 |
|---|---|---|
| **1** | **r/japanesestreetwear**（419K） | **宣伝ルール0件**。同型の先行事例「I created a yahoo japan auctions viewer for iOS!」が**114pt/21c で生存** |
| **2** | **r/AnalogCommunity**（424K） | 宣伝規定なし。Nikonレンズの実測がそのまま使える |
| 3 | r/gamecollecting（385K） | `yahoo auction` 投稿が61pt/23c。**要mod事前承認**（無断投稿は削除） |
| 4 | r/Seiko（255K） | Seiko10.6倍が最も刺さる相手だが宣伝禁止。ルールに「mod に相談」とあるので**先にDM** |
| ❌ | r/Flipping | 日曜スレのみ可だが、**日本仕入れの会話が実質ゼロ**（唯一の実物が0pt）。優先度を落とした |
| ❌ | r/Watches | 3.4Mだが宣伝**全面禁止**。手が出せない |

**先行事例が通った書き方**（そのまま真似る）:
> 無料で作っている／**Buyeeが遅くて使いにくいのが動機**／まだベータ／
> **コミュニティの意見が欲しい**

売り込みが1文字もありません。同サブレでは詳しい解説記事が464ptを獲得しており、
**知識共有型の長文が最も歓迎される**ことも確認済みです。

⚠️ **重要な検証結果**: Redditで到達できる日本仕入れ層は**コレクター**であり、
彼らが求めているのは相場分析ではなく**閲覧性**でした（先行事例のコメントで
落札相場・利益率に言及した人はゼロ）。転売層（r/Flipping）は日本から仕入れていません。
配信前に、LPを転売フレーム（"find your margin"）から
**コレクターフレーム（"Don't overpay"）**へ寄せるか判断してください。
`Max buy` とコンディション別中央値はそのまま刺さります。

**1つずつ打つこと。** 全部に一斉配信すると、外したときに何が悪かったか学べません。

集計は Apps Script エディタで `summarise()` を実行すればログに出ます。

集計は Apps Script エディタで `summarise()` を実行すればログに出ます。
