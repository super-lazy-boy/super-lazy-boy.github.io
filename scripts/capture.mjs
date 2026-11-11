// Capture reference screenshots of the built site (docs/) with the local Chrome.
import { chromium } from "@playwright/test";
const base = process.env.CAPTURE_URL || "http://127.0.0.1:4180";
const out = process.env.CAPTURE_OUT || "D:/Work/_shots";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", e => errors.push("pageerror: " + e.message));
await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForSelector("canvas", { timeout: 30000 });
await page.waitForTimeout(2000);
await page.screenshot({ path: out + "/shot-overview.png" });
for (const [name, label, file] of [["灵感角", "office", "shot-desk"], ["翻页角", "books", "shot-books"], ["放映角", "cinema", "shot-cinema"]]) {
  await page.getByRole("button", { name: new RegExp(name) }).click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: out + "/" + file + ".png" });
}
console.log("console errors:", JSON.stringify(errors.slice(0, 5)));
await browser.close();
