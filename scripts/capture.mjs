import { chromium } from "@playwright/test";
const base = process.env.CAPTURE_URL || "http://127.0.0.1:4225";
const out = "D:/Work/_shots";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas", { timeout: 30000 });
await page.mouse.move(4, 4);
await page.waitForTimeout(4000);
await page.screenshot({ path: out + "/v6-overview.png" });
for (const [zone, file] of [["office", "v6-office"], ["cinema", "v6-cinema"], ["guestbook", "v6-guestbook"]]) {
  await page.locator('[data-room-zone="' + zone + '"]').click();
  await page.mouse.move(4, 4);
  await page.waitForTimeout(4500);
  await page.screenshot({ path: out + "/" + file + ".png" });
}
console.log("captured");
await browser.close();
