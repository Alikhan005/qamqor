import { expect, test } from "@playwright/test";

test("explains the social purpose and links to the public source code", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^О проекте/ })
    .click();

  const about = page.locator(".about-section");
  await expect(about.getByRole("heading", { level: 1 })).toHaveText(
    "Помочь проще, когда знаешь где.",
  );
  await expect(about.locator(".about-intro")).toContainText("Казахстана");
  await expect(about.locator(".about-intro")).toContainText("волонтёр");
  await expect(about.locator(".about-mission")).toContainText(
    "Объявления о помощи часто теряются в чатах",
  );
  await expect(about.locator(".project-stack")).toContainText("Angular");
  await expect(about.locator(".project-stack")).toContainText("Java");
  await expect(about.locator(".about-demo-note")).toContainText("вымышлены");
  await expect(about.locator(".about-demo-note")).toContainText("в этом браузере");
  await expect(
    about.getByRole("link", { name: "Исходный код на GitHub" }),
  ).toHaveAttribute("href", "https://github.com/Alikhan005/qamqor");
  await expect(page.getByText("mvn spring-boot:run", { exact: false })).toHaveCount(
    0,
  );
});

test("public visitors can use the demo without developer setup controls", async ({
  page,
}) => {
  // Serve the local app behind a public hostname to exercise the deployment
  // behavior without starting a second server or depending on external hosting.
  await page.route("https://public-qamqor.test/**", async (route) => {
    const requested = new URL(route.request().url());
    const response = await route.fetch({
      url: `http://127.0.0.1:4200${requested.pathname}${requested.search}`,
    });
    await route.fulfill({ response });
  });
  await page.goto("https://public-qamqor.test/");
  await expect(page.locator("article.request-card")).toHaveCount(7);
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^О проекте/ })
    .click();
  await expect(page.locator(".about-section")).toBeVisible();
  await expect(page.locator(".developer-tools")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Подключить Java API", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".mode-label")).toContainText(
    "Интерактивная демоверсия",
  );
});
