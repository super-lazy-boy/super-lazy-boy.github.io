import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:4180/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas");
await page.waitForTimeout(1200);
await page.getByRole("button", { name: /翻页角/ }).click();
await page.waitForTimeout(3200);
await page.screenshot({ path: "D:/Work/_shots/anim-books-before.png" });
await page.mouse.click(980, 430);
for (let i = 0; i < 5; i++) {
  await page.waitForTimeout(190);
  await page.screenshot({ path: "D:/Work/_shots/anim-book-" + i + ".png" });
}
await page.waitForTimeout(1500);
await page.screenshot({ path: "D:/Work/_shots/anim-book-end.png" });
await browser.close();
