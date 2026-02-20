# SECURITY STATUS

最終更新: 2026-02-20

## 監査結果

- `npm audit --omit=dev --audit-level=high`: 0 件
- `npm audit --audit-level=high`: 18 件（high 14 / moderate 4）

## 判定方針（MVP）

1. 本番依存（`dependencies`）に high/critical がある場合はリリース停止。
2. 開発依存のみの脆弱性は、実行面の影響と修正時の破壊的変更リスクを評価して扱う。
3. 開発依存の残件がある場合は、次回依存更新時に再評価する。

## 現在の残課題（開発依存）

- ESLint/Vitest 系の脆弱性は、`npm audit fix --force` でメジャー更新が必要。
- 現時点では lint/test 実行専用依存のため、MVP本番挙動への直接影響は限定的。
