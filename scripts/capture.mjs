import { chromium } from "@playwright/test";
const base = "http://127.0.0.1:4204";
const out = "D:/Work/_shots";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// reduced motion makes the camera snap, so screenshots show the final framing
await page.emulateMedia({ reducedMotion: "reduce" });
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.mouse.move(4, 4);
await page.waitForTimeout(3500);
await page.screenshot({ path: out + "/v4-overview.png" });
for (const [zone, file] of [["office", "v4-office"], ["cinema", "v4-cinema"], ["guestbook", "v4-guestbook"]]) {
  await page.locator('[data-room-zone="' + zone + '"]').click();
  await page.mouse.move(4, 4);
  await page.waitForTimeout(4000);
  await page.screenshot({ path: out + "/" + file + ".png" });
}
await browser.close();
