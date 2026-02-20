# RELEASE CHECKLIST

## 1. 事前確認

1. `main` に最新を取り込む
2. 必須チェック（Quality / Security）が通ること
3. 依存脆弱性の再確認: `npm run audit:prod`

## 2. ローカルQA

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test:unit`
5. `npm run build`
6. `NEXT_PUBLIC_TETRIS_TARGET_SEC=120 npm run dev` で手動シナリオ確認

## 3. 手動シナリオ（必須）

1. Home → セッション開始 → 全ステップ完走
2. 中断ボタンからホーム復帰
3. セッション途中でリロードして復帰できる
4. 設定の再活性化秒数変更が次セッションに反映
5. ログ保存・週次集計・CSV/JSONエクスポート
6. スマホ操作（タップ/スワイプ/長押し）

## 4. PWA確認

1. `manifest.webmanifest` が配信される
2. Service Worker が登録される（production build）
3. iOS Safari のホーム画面追加案内が表示される
4. オフライン時に `/offline` へフォールバックする

## 5. リリース判定

1. 重大バグ（P0/P1）ゼロ
2. 既知制限をREADMEへ反映済み
3. リリースノート作成

## 6. リリース後監視

1. ユーザー報告（操作不能 / データ消失）を最優先対応
2. ログと再現手順を issue 化
3. 修正後に回帰テスト（unit + e2e）を再実行
