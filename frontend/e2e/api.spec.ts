import { expect, test } from "@playwright/test";

test("Angular connects to Java, creates an initiative and persists a volunteer response", async ({
  page,
  request,
}) => {
  test.skip(
    process.env.QAMQOR_TEST_API !== "1",
    "Set QAMQOR_TEST_API=1 and start the Java API on port 8080.",
  );

  const stats = await request.get("/api/stats");
  expect(
    stats.ok(),
    "The Java API must be reachable through the Angular /api proxy.",
  ).toBe(true);
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^О проекте/ })
    .click();
  await page.locator(".developer-tools summary").click();
  const loading = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/requests") &&
      response.request().method() === "GET",
  );
  await page
    .getByRole("button", { name: "Подключить Java API", exact: true })
    .click();
  expect((await loading).status()).toBe(200);
  await expect(page.locator(".mode-label")).toHaveText("Java API подключён");

  await page
    .getByRole("navigation")
    .getByRole("button", { name: "Найти доброе дело", exact: true })
    .click();
  await page.getByRole("button", { name: "Нужна помощь", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Начнём доброе дело" });
  const title = `Учебная инициатива E2E ${Date.now()}`;
  await dialog
    .getByRole("textbox", { name: "Название дела", exact: true })
    .fill(title);
  await dialog
    .getByRole("textbox", { name: "Что нужно сделать?", exact: true })
    .fill(
      "Проверяем совместную работу Angular, Java и базы данных на вымышленной инициативе.",
    );
  await dialog
    .getByRole("combobox", { name: "Город", exact: true })
    .selectOption("Алматы");
  await dialog
    .getByRole("combobox", { name: "Категория", exact: true })
    .selectOption("CARE");
  await dialog
    .getByRole("textbox", { name: "Команда или организатор", exact: true })
    .fill("Вымышленная команда E2E");
  await dialog
    .getByRole("spinbutton", { name: "Сколько нужно волонтёров?", exact: true })
    .fill("1");
  await dialog
    .getByRole("textbox", { name: "Место встречи / район", exact: true })
    .fill("Учебная общественная мастерская");

  const creating = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/requests") &&
      response.request().method() === "POST",
  );
  await dialog
    .getByRole("button", { name: "Создать заявку", exact: true })
    .click();
  const created = await creating;
  expect(created.status()).toBe(201);
  const initiative = (await created.json()) as {
    id: string;
    volunteers: number;
  };
  expect(initiative.id).toMatch(/^[0-9a-f-]{36}$/i);
  expect(initiative.volunteers).toBe(0);

  const card = page
    .locator("article.request-card")
    .filter({ has: page.getByRole("heading", { name: title, exact: true }) });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "Откликнуться", exact: true }).click();
  const joining = page.getByRole("dialog", { name: "Ваше участие важно" });
  await joining
    .getByRole("textbox", { name: "Ваше имя", exact: true })
    .fill("Учебный волонтёр E2E");
  const volunteering = page.waitForResponse(
    (response) =>
      response.url().endsWith(`/api/requests/${initiative.id}/volunteer`) &&
      response.request().method() === "POST",
  );
  await joining
    .getByRole("button", { name: "Откликнуться", exact: true })
    .click();
  expect((await volunteering).status()).toBe(200);
  await expect(joining).not.toBeVisible();
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );

  const persisted = await request.get(`/api/requests/${initiative.id}`);
  expect(persisted.status()).toBe(200);
  const body = await persisted.json();
  expect(body).toMatchObject({
    id: initiative.id,
    title,
    volunteers: 1,
    targetVolunteers: 1,
    city: "Алматы",
  });
  expect(body).not.toHaveProperty("normalizedName");

  const full = await request.post(`/api/requests/${initiative.id}/volunteer`, {
    data: { name: "Другой учебный участник" },
  });
  expect(full.status()).toBe(409);
});
