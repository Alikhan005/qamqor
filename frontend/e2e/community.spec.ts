import { expect, test, type Page } from "@playwright/test";

const cards = (page: Page) => page.locator("article.request-card");
const navigation = (page: Page) => page.getByRole("navigation");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(cards(page)).toHaveCount(7);
});

test("overview renders statistics and a working 3D or fallback map", async ({
  page,
}) => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Помогать — значит",
  );
  await expect(page.locator(".stat-card")).toHaveCount(4);
  await expect(
    page.locator(
      "app-kazakhstan-map canvas:visible, app-kazakhstan-map .fallback-map:visible",
    ),
  ).toHaveCount(1);

  await page
    .getByRole("button", { name: "Выбрать город: Алматы", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Город", exact: true }),
  ).toHaveValue("Алматы");
  await expect(cards(page)).toHaveCount(3);
  await expect(
    page.locator(".request-meta").filter({ hasNotText: "Алматы" }),
  ).toHaveCount(0);
});

test("keeps the map usable by keyboard when WebGL is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: function (
        this: HTMLCanvasElement,
        type: string,
        ...options: unknown[]
      ) {
        if (
          type === "webgl" ||
          type === "webgl2" ||
          type === "experimental-webgl"
        )
          return null;
        return Reflect.apply(original, this, [type, ...options]);
      },
    });
  });
  await page.reload();
  await expect(page.locator("app-kazakhstan-map .fallback-map")).toBeVisible();
  const astana = page.getByRole("button", {
    name: "Выбрать город: Астана",
    exact: true,
  });
  await astana.focus();
  await astana.press("Enter");
  await expect(astana).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "Город", exact: true }),
  ).toHaveValue("Астана");
  await expect(cards(page)).toHaveCount(2);
});

test("category, city and text filters combine and reset", async ({ page }) => {
  await navigation(page)
    .getByRole("button", { name: "Найти доброе дело", exact: true })
    .click();
  await page
    .locator(".category-tabs")
    .getByRole("button", { name: "Экология", exact: true })
    .click();
  await expect(cards(page)).toHaveCount(2);
  await page
    .getByRole("combobox", { name: "Город", exact: true })
    .selectOption("Алматы");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading")).toHaveText(
    "Посадим маленький городской сад",
  );

  await page.getByRole("searchbox").fill("несуществующая инициатива");
  await expect(cards(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Здесь пока тихо" }),
  ).toBeVisible();
  await page
    .locator(".filter-summary")
    .getByRole("button", { name: "Сбросить фильтры" })
    .click();
  await expect(cards(page)).toHaveCount(7);
  await page.getByRole("searchbox").fill("ПРОДУКТОВАЯ");
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading")).toHaveText(
    "Продуктовая корзина для пожилых",
  );
});

test("favorites persist across reload and can be removed from saved view", async ({
  page,
}) => {
  const title = await cards(page).first().getByRole("heading").innerText();
  await cards(page)
    .first()
    .getByRole("button", { name: "Сохранить в избранное" })
    .click();
  await expect(
    cards(page).first().getByRole("button", { name: "Убрать из избранного" }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await navigation(page)
    .getByRole("button", { name: "Избранное", exact: true })
    .click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading")).toHaveText(title);
  await cards(page)
    .first()
    .getByRole("button", { name: "Убрать из избранного" })
    .click();
  await expect(cards(page)).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Здесь пока тихо" }),
  ).toBeVisible();
});

test("volunteer sign-up updates capacity and persists in My responses", async ({
  page,
}) => {
  const card = cards(page).first();
  const title = await card.getByRole("heading").innerText();
  const previousCount = Number(
    await card.getByRole("progressbar").getAttribute("aria-valuenow"),
  );
  await card.getByRole("button", { name: "Откликнуться", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Ваше участие важно" });
  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Откликнуться", exact: true }),
  ).toBeDisabled();
  await dialog
    .getByRole("textbox", { name: "Ваше имя", exact: true })
    .fill("Тестовый волонтёр");
  await dialog
    .getByRole("button", { name: "Откликнуться", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    card.getByRole("button", { name: "Вы участвуете", exact: true }),
  ).toBeDisabled();
  await expect(card.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(previousCount + 1),
  );

  await page.reload();
  await navigation(page)
    .getByRole("button", { name: /^Мои отклики/ })
    .click();
  await expect(cards(page)).toHaveCount(1);
  await expect(cards(page).first().getByRole("heading")).toHaveText(title);
  await expect(
    cards(page)
      .first()
      .getByRole("button", { name: "Вы участвуете", exact: true }),
  ).toBeDisabled();
  await expect(cards(page).first().getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(previousCount + 1),
  );
});

test("publishes a validated initiative and keeps it after reload", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Нужна помощь", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Начнём доброе дело" });
  const publish = dialog.getByRole("button", {
    name: "Создать заявку",
    exact: true,
  });
  await expect(publish).toBeDisabled();
  await dialog
    .getByRole("textbox", { name: "Название дела", exact: true })
    .fill("Учебная помощь соседям в Алматы");
  await dialog
    .getByRole("textbox", { name: "Что нужно сделать?", exact: true })
    .fill(
      "Соберёмся в общественной мастерской и поможем соседям подготовить книги к обмену.",
    );
  await dialog
    .getByRole("combobox", { name: "Город", exact: true })
    .selectOption("Алматы");
  await dialog
    .getByRole("combobox", { name: "Категория", exact: true })
    .selectOption("EDUCATION");
  await dialog
    .getByRole("textbox", { name: "Команда или организатор", exact: true })
    .fill("Учебная команда");
  // The form initializes tomorrow's local date, so the test remains valid on any day.
  await expect(dialog.locator('input[name="date"]')).not.toHaveValue("");
  await dialog
    .getByRole("spinbutton", { name: "Сколько нужно волонтёров?", exact: true })
    .fill("4");
  await dialog
    .getByRole("textbox", { name: "Место встречи / район", exact: true })
    .fill("Общественная мастерская района");
  await expect(publish).toBeEnabled();
  await publish.click();
  await expect(dialog).not.toBeVisible();
  await expect(cards(page)).toHaveCount(8);
  await expect(cards(page).first().getByRole("heading")).toHaveText(
    "Учебная помощь соседям в Алматы",
  );
  await expect(cards(page).first().getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page.reload();
  await page.getByRole("searchbox").fill("Учебная помощь соседям в Алматы");
  await expect(cards(page)).toHaveCount(1);
});

test("language switch translates navigation, headings, categories and form labels", async ({
  page,
}) => {
  await page.getByRole("button", { name: "ҚАЗ", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "kk");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Көмектесу —",
  );
  await expect(
    navigation(page).getByRole("button", { name: "Игі іс табу", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator(".category-tabs")
      .getByRole("button", { name: "Білім", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Көмек керек", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Игі істі бастайық" });
  await expect(
    dialog.getByRole("textbox", { name: "Істің атауы", exact: true }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Бас тарту", exact: true }).click();
  await page.getByRole("button", { name: "РУС", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Помогать — значит",
  );
});

test("dialogs support Escape and restore the trigger focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", {
    name: "Нужна помощь",
    exact: true,
  });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("textbox", { name: "Название дела", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});

test.describe("mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true });

  test("fits a 375px screen and opens and closes the navigation drawer", async ({
    page,
  }) => {
    const overflows = () =>
      page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
    expect(await overflows()).toBe(false);
    await page.getByRole("button", { name: "Меню", exact: true }).click();
    await expect(
      navigation(page).getByRole("button", { name: "Избранное", exact: true }),
    ).toBeVisible();
    await navigation(page)
      .getByRole("button", { name: "Избранное", exact: true })
      .click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/mobile-open/);
    await expect(page.locator(".section-heading h2")).toContainText(
      "Избранное",
    );
    expect(await overflows()).toBe(false);

    await page.getByRole("button", { name: "Меню", exact: true }).click();
    await navigation(page)
      .getByRole("button", { name: "Найти доброе дело", exact: true })
      .click();
    await expect(cards(page)).toHaveCount(7);
    await cards(page)
      .first()
      .getByRole("button", { name: "Подробнее", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(await overflows()).toBe(false);
  });
});
