// Regenerates docs/screenshots/*.png against a running API.
// Usage: IL_URL=http://127.0.0.1:8000 npm run screenshots
import { chromium } from "playwright";
const OUT = new URL("../../docs/screenshots", import.meta.url).pathname;
const B = process.env.IL_URL || "http://127.0.0.1:8000";  // make serve
const browser = await chromium.launch();

const page1 = async (name, fn, h = 900) => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: h }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(B + "/app", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  await fn(page);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot:", name);
  await ctx.close();
};

// landing
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(B + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/00-landing.png` });
  console.log("shot: 00-landing");
  await ctx.close();
}

await page1("01-dashboard", async () => {});
await page1("02-answer-result", async (p) => {
  await p.click(".suggest .sg");
  await p.waitForTimeout(6500);
}, 1000);
await page1("03-company-browser", async (p) => {
  await p.fill(".picker-input input", "TSLA");
  await p.waitForTimeout(1600);
  await p.click(".picker-menu .opt");
  await p.waitForTimeout(3500);
});
await page1("04-command-palette", async (p) => {
  await p.keyboard.press("Meta+k");
  await p.waitForTimeout(700);
  await p.fill(".panel-search input", "risk");
  await p.waitForTimeout(900);
});
await browser.close();
