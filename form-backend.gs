/**
 * SoldJP 待機リスト受け皿 — Google Apps Script ウェブアプリ
 *
 * 導入手順（所要5分）:
 *  1. Googleスプレッドシートを新規作成し、名前を「SoldJP Waitlist」にする
 *  2. 拡張機能 → Apps Script を開き、このファイルの中身を全部貼り付ける
 *  3. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
 *       次のユーザーとして実行: 自分
 *       アクセスできるユーザー: 全員          ← ここを必ず「全員」にする
 *  4. 発行された https://script.google.com/macros/s/..../exec を
 *     site/index.html の FORM_ENDPOINT に貼る
 *
 * 注意: LP側は Content-Type を text/plain で送っている。
 *       application/json にすると CORS プリフライトが発生し、
 *       Apps Script はそれに応答できないため必ず失敗する。
 */

var SHEET_NAME = 'signups';
var NOTIFY_EMAIL = '';   // 登録のたびにメール通知したい場合はアドレスを入れる

function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    var email = String(payload.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ ok: false, error: 'invalid email' });
    }

    var sheet = getSheet();

    // 重複登録は上書きせず無視する（再送信でも成功として返す）
    var existing = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][0]).toLowerCase() === email) {
        return json({ ok: true, duplicate: true });
      }
    }

    sheet.appendRow([
      new Date(),
      email,
      payload.category || '',
      payload.frequency || '',
      payload.intent || '',
      payload.willingness || '',
      payload.ref || '',
      payload.ts || ''
    ]);

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'SoldJP signup #' + (sheet.getLastRow() - 1) + ': ' + email,
        [
          'Email:       ' + email,
          'Sources:     ' + (payload.category || '-'),
          'Frequency:   ' + (payload.frequency || '-'),
          'Intent:      ' + (payload.intent || '-'),
          'Would pay:   ' + (payload.willingness || '-'),
          'Came from:   ' + (payload.ref || 'direct')
        ].join('\n')
      );
    }

    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

function doGet() {
  var sheet = getSheet();
  return json({ ok: true, signups: Math.max(sheet.getLastRow() - 1, 0) });
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['received_at', 'email', 'category', 'frequency', 'intent',
                     'willingness', 'referrer', 'client_ts']);
    sheet.getRange('A1:H1').setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(2, 240);
    sheet.setColumnWidth(3, 190);
    sheet.setColumnWidth(4, 170);
    sheet.setColumnWidth(5, 190);
    sheet.setColumnWidth(6, 240);
  }
  return sheet;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ゲート判定用の集計。Apps Script エディタから直接実行して結果をログで見る。
 *
 * 合格ライン: 90日で登録100件、うち「Yes - I'd start today」が20%以上。
 *
 * ただし本当に見るべきは最後のクロス集計。サブスクが成立するかを決めるのは
 * コレクターか転売者かではなく「買う頻度」である（オークファンもZIKも、
 * 顧客の共通点は毎日〜毎週取引していること）。
 * 高頻度層（週1以上）が薄いまま登録数だけ集まった場合、
 * それは需要ではなく好奇心なので、サブスクでは回収できない。
 */
var HIGH_FREQ = ['Several times a week', 'About once a week', 'A few times a month'];

function summarise() {
  var rows = getSheet().getDataRange().getValues().slice(1);
  if (!rows.length) { Logger.log('no signups yet'); return; }

  var byWtp = {}, byCat = {}, byFreq = {}, byIntent = {};
  var highFreq = 0, highFreqYes = 0, yes = 0;

  rows.forEach(function (r) {
    var cat = r[2], freq = r[3], intent = r[4], wtp = r[5];
    byCat[cat] = (byCat[cat] || 0) + 1;
    byFreq[freq] = (byFreq[freq] || 0) + 1;
    byIntent[intent] = (byIntent[intent] || 0) + 1;
    byWtp[wtp] = (byWtp[wtp] || 0) + 1;

    var isYes = (wtp === "Yes - I'd start today");
    if (isYes) yes++;
    if (HIGH_FREQ.indexOf(freq) >= 0) {
      highFreq++;
      if (isYes) highFreqYes++;
    }
  });

  var pct = function (n) { return Math.round(n / rows.length * 100) + '%'; };

  Logger.log('signups: %s', rows.length);
  Logger.log('would pay today: %s (%s)', yes, pct(yes));
  Logger.log('--- frequency ---');
  Logger.log(JSON.stringify(byFreq, null, 2));
  Logger.log('--- intent ---');
  Logger.log(JSON.stringify(byIntent, null, 2));
  Logger.log('--- willingness ---');
  Logger.log(JSON.stringify(byWtp, null, 2));
  Logger.log('--- categories ---');
  Logger.log(JSON.stringify(byCat, null, 2));

  Logger.log('=== 判定 ===');
  Logger.log('高頻度層(週1以上〜月数回): %s (%s)', highFreq, pct(highFreq));
  Logger.log('うち即払う: %s  → 高頻度層の中の転換率 %s%%',
    highFreqYes, highFreq ? Math.round(highFreqYes / highFreq * 100) : 0);
  Logger.log(highFreq / rows.length < 0.3
    ? 'WARN: 高頻度層が3割未満。サブスクでは回収できない可能性が高い。'
    : 'OK: 高頻度層が厚い。サブスクの前提が成立している。');
}
