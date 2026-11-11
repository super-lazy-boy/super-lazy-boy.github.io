import { test, expect } from "@playwright/test";

test("published records render without a backend", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });

  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await expect(page.locator("canvas")).toBeVisible();

  // The dead record service must not surface as an error to visitors.
  await expect(page.locator(".error-note")).toHaveCount(0);
  await expect(page.locator("[role=alert]")).toHaveCount(0);

  // Restored published records are visible in the counters.
  const counts = page.locator(".quick-records");
  await expect(counts).toContainText("89");
  await expect(counts).toContainText("1137");
  await page.screenshot({ path: "test-results/overview.png" });

  // Reading corner shows the restored books.
  await page.getByRole("button", { name: /阅读记录/ }).first().click();
  const library = page.locator(".book-library-ui");
  await expect(library).toBeVisible();
  await expect(library).toContainText("89 本读过的书");
  await page.screenshot({ path: "test-results/reading-shelf.png" });

  console.log("console errors: " + JSON.stringify(consoleErrors.slice(0, 6)));
});

test("guestbook degrades to a calm notice", async ({ page }) => {
  await page.goto("/#guestbook-notes", { waitUntil: "networkidle" });
  const guestbook = page.locator(".guestbook-space");
  await expect(guestbook).toBeVisible({ timeout: 20_000 });
  await expect(guestbook).toContainText("留言板暂时收起");
  await expect(page.locator(".guestbook-error")).toHaveCount(0);
  await page.waitForTimeout(700);
  await page.screenshot({ path: "test-results/guestbook-offline.png" });
});

test("mobile layout still renders the room", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 30_000 });
  await expect(page.locator(".error-note")).toHaveCount(0);
  await page.screenshot({ path: "test-results/mobile.png" });
});
