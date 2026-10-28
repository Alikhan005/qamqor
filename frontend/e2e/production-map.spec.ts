import { expect, test } from "@playwright/test";

test("a projected city stays under the pointer during a real press", async ({
  page,
}) => {
  await page.goto(process.env.QAMQOR_PUBLIC_URL || "/");
  const map = page.locator("app-kazakhstan-map");
  await expect(map.locator("canvas:visible, .fallback-map:visible")).toHaveCount(1);
  test.skip(
    await map.locator(".fallback-map").isVisible(),
    "WebGL is unavailable; the keyboard fallback has its own regression test.",
  );
  const city = page.locator(".city-button:visible").first();
  await expect(city).toBeVisible();
  await city.scrollIntoViewIfNeeded();
  const before = await city.boundingBox();
  expect(before).not.toBeNull();
  await page.mouse.move(
    before!.x + before!.width / 2,
    before!.y + before!.height / 2,
  );
  await page.mouse.down();
  try {
    const during = await city.boundingBox();
    expect(during!.x).toBeCloseTo(before!.x, 0);
    expect(during!.y).toBeCloseTo(before!.y, 0);
  } finally {
    await page.mouse.up();
  }
  await expect(city).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("article.request-card")).toHaveCount(3);

  // Exercise Playwright's full hit-target checks without force or dispatchEvent.
  await city.click();
  await expect(city).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator("article.request-card")).toHaveCount(7);
});
