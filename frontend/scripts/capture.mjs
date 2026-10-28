import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const output = fileURLToPath(new URL("../../docs/images/", import.meta.url));
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1536, height: 1480 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(process.env.QAMQOR_URL || "http://127.0.0.1:4200", {
    waitUntil: "networkidle",
  });
  await page.getByRole("heading", { level: 1 }).waitFor();
  await page
    .getByRole("button", { name: "Выбрать город: Алматы", exact: true })
    .waitFor({ state: "visible" });
  await page.screenshot({ path: `${output}/dashboard.png`, fullPage: false });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${output}/mobile.png`, fullPage: true });
  console.log(
    JSON.stringify({
      screenshots: ["docs/images/dashboard.png", "docs/images/mobile.png"],
      pageErrors: errors,
    }),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
