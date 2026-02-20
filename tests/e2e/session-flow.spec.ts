import { expect, test } from "@playwright/test";

const clearLocalState = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.goto("/");
};

const beginSessionFromIntro = async (page: import("@playwright/test").Page): Promise<void> => {
  await page.getByTestId("home-start-session-button").click();
  await page.getByTestId("intro-toggle-all-button").click();
  await page.getByRole("button", { name: "開始" }).click();
};

test.beforeEach(async ({ page }) => {
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });

  await clearLocalState(page);
});

test("full guided session can complete and be saved", async ({ page }) => {
  await beginSessionFromIntro(page);

  await expect(page.getByText("短い思い出し（再活性化）")).toBeVisible();
  await page.getByTestId("reactivation-skip-button").click();

  await expect(page.getByText("回転ミニ課題")).toBeVisible();
  for (let i = 0; i < 3; i += 1) {
    await page.getByTestId("rotation-option-a").click();
    await page.getByTestId("rotation-submit-button").click();
    await page.getByTestId("rotation-next-button").click();
  }

  await expect(page.getByText("テトリス")).toBeVisible();
  await page.getByTestId("tetris-finish-button").click();

  await expect(
    page.getByRole("heading", { name: "セッション後チェック", level: 2 })
  ).toBeVisible();
  await page.getByTestId("checkout-mood-slider").press("ArrowRight");
  await page.getByTestId("checkout-vividness-slider").press("ArrowLeft");
  await expect(page.getByText("気分: 6")).toBeVisible();
  await expect(page.getByText("記憶の鮮明さ: 4")).toBeVisible();
  await page.getByTestId("checkout-save-button").click();

  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("link", { name: "記録を見る" }).click();
  await expect(page.getByText("セッション一覧（前回比較付き）")).toBeVisible();
  await expect(page.getByText(/mood 6 \/ vividness 4/)).toBeVisible();
});

test("reactivation setting is reflected in next session", async ({ page }) => {
  await page.goto("/settings");
  await page.getByTestId("settings-reactivation-40").check();

  await page.goto("/");
  await beginSessionFromIntro(page);
  await expect(page.getByTestId("reactivation-seconds")).toContainText(/39|40/);
});

test("in-progress session resumes after reload", async ({ page }) => {
  await beginSessionFromIntro(page);
  await expect(page.getByText("短い思い出し（再活性化）")).toBeVisible();

  await page.reload();

  await expect(page.getByText("短い思い出し（再活性化）")).toBeVisible();
  await expect(page.getByTestId("reactivation-seconds")).toBeVisible();
});
