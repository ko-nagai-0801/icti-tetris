# ICTI手順 テトリス＋プロトコル

ICTI記事の手順を再現するための MVP Web アプリです。

- 注意事項
- 短い思い出し（20/30/40秒）
- 回転ミニ課題（3問）
- テトリス（20分、開発時は短縮可）
- セッション後チェック
- ログ保存・週次集計

## 重要な注意

本アプリは医療行為・診断・治療の代替ではありません。強い苦痛がある場合は中断し、必要に応じて専門家・医療機関へ相談してください。

## 技術スタック

- Next.js App Router
- React + TypeScript strict
- Zustand
- Canvas 2D (テトリス)
- localStorage 永続化
- Playwright (E2E)
- Vitest (unit/regression)

## セットアップ

```bash
npm install
```

## 開発起動

```bash
# 開発時にテトリス時間を短縮（例: 120秒）
NEXT_PUBLIC_TETRIS_TARGET_SEC=120 npm run dev
```

## 品質チェック

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run audit:prod
```

## E2E テスト

```bash
# 初回はブラウザインストールが必要
npx playwright install chromium webkit
npm run test:e2e:chromium
npm run test:e2e:webkit
npm run test:e2e:mobile
```

一括実行:

```bash
npm run release:check
```

## セキュリティ運用

- 2026-02-20 時点で `npm audit --omit=dev` は 0 件（high/critical 含む）です。
- `npm audit`（開発依存を含む）には ESLint/Vitest 系の既知脆弱性が残る場合があります。
- 現状の残件は実行環境が開発時に限定されるため、MVPリリース判定では `audit:prod` を必須ゲートにしています。

## CI

GitHub Actions で以下を実行します。

- Quality: lint / typecheck / unit test / build
- E2E: Playwright Chromium + WebKit (PR と手動実行)
- Security: `npm audit --omit=dev --audit-level=high`

## iOS運用メモ

- PWA manifest / icon / Apple icon 対応済み
- Safari から「ホーム画面に追加」でアプリ風に利用可能
- Safe Area / タッチ操作を考慮

## 既知の制限

- ログイン・クラウド同期なし（ローカル保存のみ）
- 医療的判定や診断ロジックは実装しない
- テトリスはMVP仕様（対戦/高度な得点競争なし）

## リリース手順

詳細は `docs/RELEASE_CHECKLIST.md`、`docs/SECURITY_STATUS.md`、`docs/IOS_DEVICE_QA.md` を参照。
